// Single shared tax/FICA/RMD/LTCG calculation engine, replacing the ~8
// independently hand-transcribed copies of this logic that used to live in
// taxCalculator.js, BudgetContext.jsx (x2), Week1FederalTax.jsx,
// Week1StateTax.jsx, Week4.jsx, Week6Retirement.jsx, Week9.jsx, and
// Week12.jsx. See docs/financial-audit-2026-08-11.md for the bugs this
// consolidation fixes, and docs/univ154-migration.md for the write-up.
//
// Every function here is pure and takes an `assumptions` object (the shape
// produced by src/utils/assumptionsApi.js's fetchAssumptions() / exposed by
// useAssumptions()) as a parameter -- no hardcoded constants live in this
// file. Single-filer only, matching the rest of the app's current scope
// (MFJ/HoH support was dead/commented-out code in the old taxCalculator.js
// and is not reintroduced here).

// Generic progressive/marginal bracket-stacking tax calculation. Works for
// federal ordinary, federal LTCG, NYC, and state brackets alike -- they all
// share the same { lower, upper, rate } shape once sourced from the
// Assumptions tables (state brackets now carry an explicit `upper` instead
// of being inferred from adjacent rows, which is what fixed both the
// negative-tax-below-threshold and $0-flat-rate-state bugs -- see
// calculateStateTax below).
//
// A bracket whose `lower` the income never reaches is correctly untaxed
// (0%) rather than defaulting to some other bracket's rate -- this is what
// makes states like DE (first bracket starts at lower=2000) correctly
// return $0 tax below their threshold instead of a negative number.
export function calculateProgressiveTax(income, brackets) {
  if (!income || income <= 0 || !Array.isArray(brackets) || brackets.length === 0) {
    return 0;
  }
  let tax = 0;
  for (const bracket of brackets) {
    if (income <= bracket.lower) break; // brackets are sorted ascending by lower
    const taxableInBracket = Math.min(income, bracket.upper) - bracket.lower;
    if (taxableInBracket > 0) {
      tax += taxableInBracket * bracket.rate;
    }
  }
  return tax;
}

// Same stacking logic as calculateProgressiveTax, but returns the per-
// bracket breakdown instead of just the total -- for the pedagogical
// "here's what you owe in each bracket" tables (Week1FederalTax.jsx,
// Week4.jsx) that show students the bracket-by-bracket math, not just the
// bottom-line figure.
export function calculateBracketBreakdown(income, brackets) {
  const inc = income || 0;
  return (brackets ?? []).map((bracket) => {
    const taxableInBracket = inc > bracket.lower ? Math.min(inc, bracket.upper) - bracket.lower : 0;
    return {
      ...bracket,
      taxableInBracket: Math.max(0, taxableInBracket),
      taxInBracket: Math.max(0, taxableInBracket) * bracket.rate,
    };
  });
}

export function calculateStandardDeduction(assumptions) {
  return assumptions?.scalars?.std_deduction_single ?? 0;
}

// Not floored at 0 -- matches the app's established convention (see
// calculateFullTax below) of only flooring the final after-tax figure, not
// taxable income itself. calculateProgressiveTax already treats
// income <= 0 as $0 tax, so an unfloored negative value here is safe to
// pass straight into the bracket functions.
export function calculateTaxableIncome(preTaxIncome, assumptions, preTaxExpenses = 0) {
  const standardDeduction = calculateStandardDeduction(assumptions);
  return (preTaxIncome || 0) - standardDeduction - (preTaxExpenses || 0);
}

export function calculateFederalTax(taxableIncome, assumptions) {
  return calculateProgressiveTax(taxableIncome, assumptions?.federalOrdinaryBrackets);
}

export function calculateNYCTax(taxableIncome, assumptions) {
  return calculateProgressiveTax(taxableIncome, assumptions?.nycBrackets);
}

// stateBracketsForState: the bracket array for one state, e.g.
// assumptions.stateBrackets['GA']. Callers look this up themselves so this
// function stays agnostic to how the caller identifies "which state."
export function calculateStateTax(taxableIncome, stateBracketsForState) {
  return calculateProgressiveTax(taxableIncome, stateBracketsForState);
}

// FICA is computed on gross wages (preTaxIncome), not taxable income --
// matches both real tax law and the live Excel workbook's
// `Week 1 B - Federal Tax!G18` formula (`=MIN(Summary!income * 6.2%, ...)`,
// pulling gross income from the Summary sheet, not this sheet's own
// post-deduction taxable-income cell). Some of the pre-consolidation web
// engines applied FICA to taxable income instead -- fixed here.
//
// Fixes finding #1 (SS cap applied to the wrong operand): caps *wages*
// against the wage base before applying the rate, not the resulting tax
// dollar amount against the wage-base dollar figure.
//
// Also adds Additional Medicare Tax (0.9% over the threshold), which was
// missing from 7 of the 8 pre-consolidation engines -- not new pedagogy,
// Week12.jsx's ASSUMPTIONS_2026-based engine already modeled this
// correctly, matching `Week 7 B - Assumptions!C10/C11`
// (`=AddlMedicare_Rate` / `=AddlMedicare_Threshold`) in the live Excel
// workbook.
export function calculateFICA(wages, assumptions) {
  const scalars = assumptions?.scalars ?? {};
  const ssRate = scalars.ss_rate ?? 0;
  const ssWageBase = scalars.ss_wage_base ?? 0;
  const medicareRate = scalars.medicare_rate ?? 0;
  const addlMedicareRate = scalars.addl_medicare_rate ?? 0;
  const addlMedicareThreshold = scalars.addl_medicare_threshold ?? 0;

  const w = wages || 0;
  const socialSecurityTax = Math.min(w, ssWageBase) * ssRate;
  const medicareTax = w * medicareRate;
  const additionalMedicareTax = Math.max(0, w - addlMedicareThreshold) * addlMedicareRate;

  return {
    socialSecurityTax,
    medicareTax,
    additionalMedicareTax,
    totalFICA: socialSecurityTax + medicareTax + additionalMedicareTax,
  };
}

// Long-term capital gains, bracket-stacked on top of ordinary taxable
// income (the gains occupy the income range
// [ordinaryTaxableIncome, ordinaryTaxableIncome + gains) within the LTCG
// bracket table) -- the standard "stacking" rule, not a flat rate. Fixes
// finding #26 (Week9.jsx's flat 15% simplification) and replaces Week12's
// separate copy of the same logic.
export function calculateLTCGTax(gains, ordinaryTaxableIncome, assumptions) {
  const g = gains || 0;
  if (g <= 0) return 0;
  const brackets = assumptions?.federalLtcgBrackets ?? [];
  const base = ordinaryTaxableIncome || 0;
  const total = base + g;
  let tax = 0;
  for (const bracket of brackets) {
    const lower = Math.max(bracket.lower, base);
    const upper = Math.min(bracket.upper, total);
    const amount = upper - lower;
    if (amount > 0) {
      tax += amount * bracket.rate;
    }
  }
  return tax;
}

// RMD divisor lookup. Fixes finding #12 (the old RMD_DIVISOR_BY_AGE table
// only covered ages 73-90 and silently treated anything past that as $0);
// the Assumptions table covers 72-120.
export function getRMDDivisor(age, assumptions) {
  const divisors = assumptions?.rmdDivisors ?? {};
  return divisors[age] ?? null;
}

export function getRMDAmount(balance, age, assumptions) {
  const rmdStartAge = assumptions?.scalars?.rmd_start_age ?? Infinity;
  if (age < rmdStartAge) return 0;
  const divisor = getRMDDivisor(age, assumptions);
  if (!divisor) return 0;
  return (balance || 0) / divisor;
}

// Groups a flat [{ state, lower, upper, rate }, ...] array into
// { [state]: [{ lower, upper, rate }, ...] } -- useful for any consumer
// still working with a flat bracket list rather than the already-grouped
// shape assumptions.stateBrackets provides. Promoted from Week12.jsx, the
// one pre-consolidation engine that already did this instead of
// hand-transcribing a 50-state object.
export function buildStateBracketMap(flatStateBrackets) {
  const map = {};
  (flatStateBrackets ?? []).forEach(({ state, lower, upper, rate }) => {
    if (!map[state]) map[state] = [];
    map[state].push({ lower, upper, rate });
  });
  return map;
}

// Convenience wrapper computing a full tax picture for one person in one
// state, the shape most components actually want (mirrors the old
// taxCalculator.js's calculateFinancials(), fixed and assumptions-driven).
export function calculateFullTax({ preTaxIncome, preTaxExpenses = 0, state, residenceInNYC = false }, assumptions) {
  const standardDeduction = calculateStandardDeduction(assumptions);
  const taxableIncome = calculateTaxableIncome(preTaxIncome, assumptions, preTaxExpenses);
  const federalIncomeTax = calculateFederalTax(taxableIncome, assumptions);
  const { socialSecurityTax, medicareTax, additionalMedicareTax } = calculateFICA(preTaxIncome, assumptions);
  const stateBracketsForState = assumptions?.stateBrackets?.[state] ?? [];
  const stateIncomeTax = calculateStateTax(taxableIncome, stateBracketsForState);
  const nycTax = residenceInNYC ? calculateNYCTax(taxableIncome, assumptions) : 0;

  const totalTax = federalIncomeTax + socialSecurityTax + medicareTax + additionalMedicareTax + stateIncomeTax + nycTax;

  // Spendable after-tax income = gross pay minus pre-tax deductions (401k,
  // insurance premiums -- money that never hits your paycheck) minus taxes.
  // Equivalent to taxableIncome - totalTax + standardDeduction (the
  // standard deduction isn't a real cash deduction, just a tax-calculation
  // construct, so it's added back here) -- matches the app's established
  // formula, floored at $0 only at this final step, not on taxableIncome
  // itself.
  const afterTaxIncome = Math.max((preTaxIncome || 0) - (preTaxExpenses || 0) - totalTax, 0);

  return {
    preTaxIncome: preTaxIncome || 0,
    standardDeduction,
    taxableIncome,
    federalIncomeTax,
    socialSecurityTax,
    medicareTax,
    additionalMedicareTax,
    stateIncomeTax,
    nycTax,
    totalTax,
    afterTaxIncome,
  };
}
