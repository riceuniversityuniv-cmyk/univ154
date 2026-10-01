// Single projection engine for the Retirement Planning tab (Week6Retirement.jsx),
// replacing 12 copy-pasted per-account/per-scenario calculators. Pure functions
// only -- assumptions are passed in, nothing is read from React context.
import {
  calculateTaxableIncome,
  calculateFederalTax,
  calculateNYCTax,
  calculateStateTaxableIncome,
  calculateStateTax,
  getRMDDivisor,
} from './taxEngine';

export const PROJECTION_END_AGE = 100;

// Value of a future-dollar amount in today's dollars (discounted at inflation).
export function discountToToday(futureValue, years, inflation) {
  return (futureValue || 0) / Math.pow(1 + inflation, Math.max(years, 0));
}

// IRS Uniform Lifetime divisor; ages past the end of the table reuse the last one.
export function rmdDivisorFor(age, assumptions) {
  const direct = getRMDDivisor(age, assumptions);
  if (direct) return direct;
  const table = assumptions?.rmdDivisors || {};
  const ages = Object.keys(table).map(Number).sort((a, b) => a - b);
  if (!ages.length || age < ages[0]) return null;
  return table[ages[ages.length - 1]];
}

// Effective federal + state (+ NYC) rate on an annual retirement withdrawal,
// computed in today's dollars (today's brackets) so it isn't distorted by
// inflation. Other retirement income (Social Security) is not modeled.
export function effectiveTaxRateOnWithdrawal(gross, { assumptions, state, residenceInNYC }, ageDeflator) {
  if (!(gross > 0)) return 0;
  const todayGross = gross / ageDeflator;
  const fed = calculateFederalTax(calculateTaxableIncome(todayGross, assumptions), assumptions);
  const stateTaxable = calculateStateTaxableIncome(todayGross, assumptions, 0, state);
  let tax = fed + calculateStateTax(stateTaxable, assumptions?.stateBrackets?.[state] || []);
  if (residenceInNYC) tax += calculateNYCTax(stateTaxable, assumptions);
  return Math.min(Math.max(tax / todayGross, 0), 1);
}

/**
 * Timing convention: a person works (and contributes) every year from
 * contributionStartAge up to, but NOT including, retirementAge. Each year's
 * contribution is deposited at year-end, so the balance on the retirement-age
 * birthday is an ordinary annuity of (retirementAge - contributionStartAge)
 * payments -- the same number of years used to express it in today's dollars.
 * Withdrawals happen at the START of each year from withdrawalStartAge (>=
 * retirementAge); any gap years compound with no contributions, and the
 * balance left after a withdrawal grows a year before the next one.
 *
 * Account types:
 *  - 'traditional': everything pre-tax (employee + match); RMDs + tax apply.
 *  - 'roth401k'   : employee contributions tax-free (no RMD); the employer
 *                   match lands in a PRE-TAX sub-balance (taxed, RMD applies).
 *  - 'roth'       : Roth IRA, all tax-free, no RMD.
 *
 * @param {object} p
 * @param {'traditional'|'roth401k'|'roth'} p.accountType
 * @param {number} p.monthlyPayment        monthly contribution (employee)
 * @param {number} p.employerMatchRate     fraction OF THE EMPLOYEE CONTRIBUTION (0.03); 0 for IRAs
 * @param {number} p.returnRate            fraction (0.07), nominal (includes inflation)
 * @param {number} p.contributionStartAge
 * @param {number} p.retirementAge
 * @param {number} p.withdrawalStartAge    clamped up to retirementAge
 * @param {number} p.withdrawalRate        fraction of balance withdrawn each year
 * @param {number|null} p.taxRateOverride  flat fraction applied to the pre-tax portion, or null for auto
 * @param {object} p.assumptions
 * @param {string} p.state
 * @param {boolean} p.residenceInNYC
 */
export function simulateRetirementAccount(p) {
  const {
    accountType = 'traditional', monthlyPayment = 0, employerMatchRate = 0, returnRate,
    contributionStartAge, retirementAge, withdrawalRate, taxRateOverride = null,
    assumptions, state, residenceInNYC = false,
  } = p;
  const inflation = assumptions?.scalars?.cpi_inflation ?? 0.03;
  const rmdStartAge = assumptions?.scalars?.rmd_start_age ?? 75;
  const withdrawalStartAge = Math.max(Math.round(p.withdrawalStartAge) || retirementAge, retirementAge);

  const annualContribution = monthlyPayment * 12;
  const employerMatch = annualContribution * employerMatchRate;
  const totalContribution = annualContribution + employerMatch;
  const toTaxFree = accountType === 'traditional' ? 0 : annualContribution;
  const toPreTax = accountType === 'traditional' ? totalContribution : (accountType === 'roth401k' ? employerMatch : 0);

  // Accumulation. Row 0 is the starting (empty) balance so that
  // accumulationData[age - contributionStartAge] is the balance at that age.
  const accumulationData = [{
    age: contributionStartAge, year: 0, annualContribution: 0, employerMatch: 0,
    totalContribution: 0, accountBalance: 0,
  }];
  let taxFree = 0;
  let preTax = 0;
  for (let age = contributionStartAge + 1; age <= retirementAge; age++) {
    taxFree = taxFree * (1 + returnRate) + toTaxFree;
    preTax = preTax * (1 + returnRate) + toPreTax;
    accumulationData.push({
      age, year: age - contributionStartAge, annualContribution, employerMatch, totalContribution,
      accountBalance: round2(taxFree + preTax),
    });
  }
  const finalBalance = taxFree + preTax;

  // Bridge years: no contributions between retirement and the first withdrawal.
  const bridge = Math.pow(1 + returnRate, withdrawalStartAge - retirementAge);
  taxFree *= bridge;
  preTax *= bridge;

  const hasOverride = taxRateOverride !== null && taxRateOverride !== '' && Number.isFinite(Number(taxRateOverride));
  const withdrawalData = [];
  for (let age = withdrawalStartAge; age <= PROJECTION_END_AGE && taxFree + preTax > 0.005; age++) {
    const pctPreTax = preTax * withdrawalRate;
    const pctTaxFree = taxFree * withdrawalRate;
    let rmd = 0;
    if (age >= rmdStartAge && preTax > 0) {
      const divisor = rmdDivisorFor(age, assumptions);
      rmd = divisor ? preTax / divisor : 0;
    }
    const preTaxWithdrawal = Math.min(Math.max(pctPreTax, rmd), preTax);
    const taxFreeWithdrawal = Math.min(pctTaxFree, taxFree);
    const gross = preTaxWithdrawal + taxFreeWithdrawal;

    let taxRate = 0;
    if (preTaxWithdrawal > 0) {
      taxRate = hasOverride
        ? Number(taxRateOverride)
        : effectiveTaxRateOnWithdrawal(preTaxWithdrawal, { assumptions, state, residenceInNYC },
            Math.pow(1 + inflation, age - contributionStartAge));
    }
    const tax = preTaxWithdrawal * taxRate;
    withdrawalData.push({
      year: age, age,
      startBalance: round2(taxFree + preTax), accountBalance: round2(taxFree + preTax), remainingBalance: round2(taxFree + preTax),
      preTaxBalance: round2(preTax), taxFreeBalance: round2(taxFree),
      pctWithdrawal: round2(pctPreTax + pctTaxFree), rmd: round2(rmd), rmdBound: rmd > pctPreTax,
      withdrawals: round2(gross), gross: round2(gross),
      preTaxWithdrawal: round2(preTaxWithdrawal), taxFreeWithdrawal: round2(taxFreeWithdrawal),
      taxRate, tax: round2(tax), afterTax: round2(gross - tax),
    });
    taxFree = (taxFree - taxFreeWithdrawal) * (1 + returnRate);
    preTax = (preTax - preTaxWithdrawal) * (1 + returnRate);
  }

  const first = withdrawalData[0] || { gross: 0, afterTax: 0, taxRate: 0, preTaxWithdrawal: 0, taxFreeWithdrawal: 0 };
  const yearsToWithdrawal = withdrawalStartAge - contributionStartAge;
  return {
    accumulationData, withdrawalData, finalBalance: round2(finalBalance),
    withdrawalStartAge, yearsToWithdrawal, inflation, accountType,
    hasPreTaxPortion: toPreTax > 0,
    firstWithdrawal: first.gross, firstAfterTax: first.afterTax, firstTaxRate: first.taxRate,
    firstPreTaxWithdrawal: first.preTaxWithdrawal, firstTaxFreeWithdrawal: first.taxFreeWithdrawal,
    pvFirstWithdrawal: discountToToday(first.gross, yearsToWithdrawal, inflation),
    pvFirstAfterTax: discountToToday(first.afterTax, yearsToWithdrawal, inflation),
    finalBalanceToday: discountToToday(finalBalance, retirementAge - contributionStartAge, inflation),
  };
}

function round2(x) { return Math.round(x * 100) / 100; }
