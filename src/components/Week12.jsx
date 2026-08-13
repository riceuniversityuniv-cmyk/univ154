import React, { useEffect, useMemo, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useBudget } from '../contexts/BudgetContext';
import { useAssumptions } from '../contexts/AssumptionsContext';
import { formatCurrency } from '../utils/formatters';
import { calculateProgressiveTax, getRMDDivisor } from '../utils/taxEngine';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, rgba(255, 253, 231, 0.27) 0%, rgb(255, 252, 240) 50%, rgb(255, 255, 255) 100%)',
    padding: '32px 24px 16px 24px',
    width: '100%',
    fontSize: '14px',
    color: '#111827',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    position: 'relative',
  },
  sectionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderRadius: '16px',
    padding: '40px',
    marginBottom: '32px',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1), 0 4px 16px 0 rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    width: '100%',
    maxWidth: '1200px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  enhancedHeader: {
    background: 'linear-gradient(135deg, rgba(13, 26, 75, 0.95) 0%, rgba(30, 58, 138, 0.9) 100%)',
    color: 'white',
    padding: '28px 32px',
    borderRadius: '16px',
    fontWeight: '600',
    fontSize: '22px',
    textAlign: 'center',
    marginBottom: '24px',
    boxShadow: '0 8px 32px 0 rgba(13, 26, 75, 0.3), 0 4px 16px 0 rgba(13, 26, 75, 0.2)',
    letterSpacing: '-0.01em',
    lineHeight: '1.3',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  infoBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 18px',
    backgroundColor: 'rgba(13, 26, 75, 0.05)',
    borderRadius: '8px',
    color: '#0d1a4b',
    fontSize: '13px',
    marginBottom: '30px',
    border: '1px solid rgba(13, 26, 75, 0.15)',
  },
  worksheetGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 192px',
    gap: '18px',
    alignItems: 'start',
    marginBottom: '32px',
  },
  sectionStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: '1px solid rgba(229, 231, 235, 0.75)',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
  },
  sectionCardTitle: {
    fontStyle: 'italic',
    fontWeight: 700,
    color: '#1e293b',
    background: 'linear-gradient(to bottom, rgba(249, 250, 251, 0.95) 0%, rgba(243, 244, 246, 0.9) 100%)',
    padding: '10px 14px',
    fontSize: '13px',
    borderBottom: '1px solid #cbd5e1',
  },
  fieldRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 176px',
    alignItems: 'center',
    minHeight: '50px',
    borderTop: '1px solid #e5e7eb',
  },
  fieldLabel: {
    padding: '9px 14px',
    color: '#1f2937',
    fontSize: '12px',
    lineHeight: 1.35,
  },
  fieldValueCell: {
    borderLeft: '1px solid #e5e7eb',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: '7px 9px',
    overflow: 'hidden',
  },
  worksheetSurface: {
    backgroundColor: 'rgba(255, 255, 255, 0.68)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    borderRadius: '12px',
    border: '1px solid rgba(229, 231, 235, 0.55)',
    boxShadow: '0 8px 22px rgba(15, 23, 42, 0.08), 0 4px 12px rgba(15, 23, 42, 0.05)',
    padding: '18px',
  },
  worksheetTable: {
    width: '100%',
    borderCollapse: 'collapse',
    borderSpacing: 0,
    border: '1px solid rgba(203, 213, 225, 0.9)',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 3px 12px rgba(15, 23, 42, 0.06)',
  },
  sectionTitleCell: {
    fontStyle: 'italic',
    fontWeight: 700,
    color: '#1e293b',
    background: 'linear-gradient(to bottom, rgba(249, 250, 251, 0.95) 0%, rgba(243, 244, 246, 0.9) 100%)',
    padding: '9px 12px',
    fontSize: '13px',
    borderBottom: '1px solid #cbd5e1',
  },
  labelCell: {
    padding: '9px 12px',
    borderBottom: '1px solid #e2e8f0',
    borderRight: '1px solid #e2e8f0',
    color: '#1f2937',
    backgroundColor: '#fff',
    fontSize: '12px',
    lineHeight: 1.35,
  },
  valueCell: {
    width: '176px',
    minWidth: '176px',
    borderBottom: '1px solid #e2e8f0',
    backgroundColor: '#fff',
    padding: '0',
  },
  yellowInput: {
    width: '100%',
    maxWidth: '100%',
    display: 'block',
    border: '2px solid #d1d5db',
    padding: '8px 10px',
    textAlign: 'right',
    backgroundColor: '#fffde7',
    borderRadius: '10px',
    boxSizing: 'border-box',
    fontWeight: '500',
    color: '#111827',
    fontSize: '14px',
    lineHeight: 1.1,
    outline: 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)',
  },
  whiteInput: {
    width: '100%',
    maxWidth: '100%',
    display: 'block',
    border: 'none',
    backgroundColor: '#fff',
    textAlign: 'right',
    fontWeight: 500,
    color: '#111827',
    fontSize: '14px',
    lineHeight: 1,
    padding: '8px 10px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  grayOutput: {
    width: '100%',
    maxWidth: '100%',
    display: 'block',
    border: 'none',
    backgroundColor: '#f8fafc',
    textAlign: 'right',
    fontWeight: 600,
    color: '#111827',
    fontSize: '14px',
    lineHeight: 1,
    padding: '8px 10px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  contributionsCard: {
    border: '1px solid rgba(203, 213, 225, 0.9)',
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    marginTop: '680px',
    position: 'relative',
    top: 'auto',
    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08), 0 4px 12px rgba(15, 23, 42, 0.05)',
  },
  contributionsHeader: {
    padding: '9px 8px',
    textAlign: 'center',
    borderBottom: '1px solid rgba(203, 213, 225, 0.9)',
    fontStyle: 'italic', 
    fontWeight: 700,
    color: '#1f2937',
    background: 'linear-gradient(to bottom, rgba(249, 250, 251, 0.95) 0%, rgba(243, 244, 246, 0.9) 100%)',
    fontSize: '11px',
    letterSpacing: '0.01em',
  },
  contributionsValue: {
    textAlign: 'center',
    padding: '12px 8px',
    fontSize: '14px',
    color: '#111827',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderBottom: '1px solid rgba(203, 213, 225, 0.9)',
    fontWeight: 600,
    lineHeight: 1.2,
  },
  chartGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '18px',
    alignItems: 'start',
  },
  chartCard: {
    border: '1px solid rgba(229, 231, 235, 0.55)',
    borderRadius: '14px',
    backgroundColor: 'rgba(255,255,255,0.68)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    padding: '18px 20px',
    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08), 0 4px 12px rgba(15, 23, 42, 0.05)',
    minHeight: '300px',
  },
  chartTitle: {
    fontSize: '16px',
    fontWeight: 700,
    marginBottom: '12px',
    textAlign: 'center',
    color: '#111827',
  },
  chartLegendRow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    marginTop: '10px',
  },
  chartLegendItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    color: '#334155',
    fontSize: '12px',
    fontWeight: 500,
    lineHeight: 1.2,
  },
  chartLegendSwatch: {
    width: '10px',
    height: '10px',
    borderRadius: '3px',
    border: '1px solid rgba(148, 163, 184, 0.45)',
    flexShrink: 0,
  },
  lineChartCard: {
    border: '1px solid rgba(229, 231, 235, 0.55)',
    borderRadius: '14px',
    backgroundColor: 'rgba(255,255,255,0.68)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    padding: '18px 20px',
    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08), 0 4px 12px rgba(15, 23, 42, 0.05)',
    margin: '18px auto 0',
    width: '100%',
    maxWidth: 'calc((100% - 18px) / 2)',
    minHeight: '340px',
  },
};

const sanitizeMoney = (value) => value.replace(/[^\d]/g, '');
const sanitizeCurrency = (value) => {
  const clean = value.replace(/[^\d.]/g, '');
  const index = clean.indexOf('.');
  if (index === -1) return clean.slice(0, 9);
  const integerPart = clean.slice(0, index).slice(0, 9);
  const decimalPart = clean
    .slice(index + 1)
    .replace(/\./g, '')
    .slice(0, 2);
  return `${integerPart}.${decimalPart}`;
};
const sanitizePercent = (value) => {
  const clean = value.replace(/[^\d.]/g, '');
  const index = clean.indexOf('.');
  if (index === -1) return clean;
  return clean.slice(0, index + 1) + clean.slice(index + 1).replace(/\./g, '').slice(0, 2);
};
const sanitizeState = (value) => value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2);

// formatCurrency now comes from src/utils/formatters.js (module import above).
const formatCurrencyInput = (value) => {
  const clean = sanitizeCurrency(String(value ?? ''));
  if (!clean) return '';

  const hasDecimalPoint = clean.includes('.');
  const [wholePartRaw, decimalPart = ''] = clean.split('.');
  const wholePart = (wholePartRaw || '0').replace(/^0+(?=\d)/, '');
  const groupedWhole = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (hasDecimalPoint) {
    return `$${groupedWhole}.${decimalPart}`;
  }
  return `$${groupedWhole}`;
};
const formatPercent = (value) => `${value || '0'}%`;
const toNumber = (value) => {
  const parsed = Number(String(value ?? '').replace(/[$,%\s,]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};
const toPercent = (value) => toNumber(value) / 100;

const PROJECTION_YEARS = 60;

// Legislative constants, federal/LTCG bracket tables, and the RMD divisor
// table all now come from the admin-editable Assumptions table
// (useAssumptions() inside the component) instead of being hardcoded here
// -- this was previously the single most complete/correct of the ~8
// pre-consolidation tax engines (it already modeled Additional Medicare Tax
// and had the widest RMD divisor coverage of any of them), but still forked
// its own copy of every constant. See docs/financial-audit-2026-08-11.md
// and src/utils/taxEngine.js.
//
// calculateProgressiveTax and getRMDDivisor are now imported from
// taxEngine.js (this file's local copies were identical in shape).
// buildStateBracketMap is no longer needed here: assumptions.stateBrackets
// already arrives pre-grouped with explicit upper bounds from the DB.

const scaleBrackets = (brackets, factor) =>
  brackets.map((b) => ({
    lower: b.lower * factor,
    upper: b.upper * factor,
    rate: b.rate,
  }));

const WEEK12_STORAGE_KEY = 'week12_data';
const WEEK12_DEFAULT_INPUTS = {
  goalAnnualAfterTax: '80000',
  withdrawalRate: '4',
  currentAge: '22',
  retirementAge: '65',
  salaryBeforeTax: '150000',
  extraRaise: '1',
  stateWorking: 'TX',
  stateRetirement: 'TX',
  contribution401kPct: '50',
  employerMatchPct: '3',
  contributionIRAPct: '100',
  annualBrokerageContribution: '2000',
  annualBrokerageGrowthRate: '2',
  businessesIncome: '0',
  realEstateIncome: '0',
  notesIncome: '0',
  royaltiesIncome: '0',
};

const Week12 = () => {
  const { topInputs } = useBudget() || {};
  const { assumptions } = useAssumptions();
  const [inputs, setInputs] = useState(WEEK12_DEFAULT_INPUTS);

  const updateInput = (key, sanitizer) => (event) => {
    const value = sanitizer ? sanitizer(event.target.value) : event.target.value;
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  // Auto-load on mount (same pattern as other modules)
  useEffect(() => {
    const savedData = localStorage.getItem(WEEK12_STORAGE_KEY);
    if (!savedData) return;

    try {
      const parsed = JSON.parse(savedData);
      const savedInputs = parsed && typeof parsed === 'object'
        ? (parsed.inputs && typeof parsed.inputs === 'object' ? parsed.inputs : parsed)
        : null;

      if (!savedInputs) return;

      setInputs((prev) => {
        const merged = { ...prev };
        Object.keys(WEEK12_DEFAULT_INPUTS).forEach((key) => {
          const nextValue = savedInputs[key];
          if (nextValue !== undefined && nextValue !== null) {
            merged[key] = String(nextValue);
          }
        });

        merged.stateWorking = String(merged.stateWorking || 'TX').toUpperCase().slice(0, 2);
        merged.stateRetirement = String(merged.stateRetirement || merged.stateWorking || 'TX').toUpperCase().slice(0, 2);
        return merged;
      });
    } catch (error) {
      console.error('Error loading Week 12 data:', error);
    }
  }, []);

  // Auto-save function (no alert)
  const autoSaveWeek12 = () => {
    try {
      const week12Data = {
        week: 12,
        inputs,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(WEEK12_STORAGE_KEY, JSON.stringify(week12Data));
    } catch (error) {
      console.error('Error auto-saving Week 12 data:', error);
    }
  };

  // Auto-save with debounce (500ms)
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      autoSaveWeek12();
    }, 500);
    return () => clearTimeout(saveTimer);
  }, [inputs]);

  const linkedSalary = toNumber(topInputs?.preTaxIncome);
  const budgetContextLooksUntouched =
    String(topInputs?.preTaxIncome ?? '') === '100000' &&
    String(topInputs?.location ?? '') === 'NY' &&
    String(topInputs?.residenceInNYC ?? '') === 'Yes';

  const model = useMemo(() => {
    const goalSheet = {
      G5: toNumber(inputs.goalAnnualAfterTax),
      G7: toPercent(inputs.withdrawalRate),
      G10: Math.max(0, Math.floor(toNumber(inputs.currentAge) || 22)),
      G12: 0,
      G16: 0,
      G18: toPercent(inputs.extraRaise),
      G20: (inputs.stateWorking || 'TX').toUpperCase(),
      G22: (inputs.stateRetirement || (inputs.stateWorking || 'TX')).toUpperCase(),
      G36: toNumber(inputs.businessesIncome),
      G38: toNumber(inputs.realEstateIncome),
      G40: toNumber(inputs.notesIncome),
      G42: toNumber(inputs.royaltiesIncome),
    };

    goalSheet.G12 = Math.max(goalSheet.G10, Math.floor(toNumber(inputs.retirementAge) || 65));
    const week12SalaryFallback = toNumber(inputs.salaryBeforeTax);
    goalSheet.G16 =
      linkedSalary > 0 && !budgetContextLooksUntouched
        ? linkedSalary
        : week12SalaryFallback;

    const currentAge = goalSheet.G10;
    const retirementAge = goalSheet.G12;
    const salaryYear0 = goalSheet.G16;
    const extraRaiseRate = goalSheet.G18;
    const salaryGrowthRate = assumptions.scalars.cpi_inflation + extraRaiseRate;
    const contribution401kPct = toPercent(inputs.contribution401kPct);
    const contributionIraPct = toPercent(inputs.contributionIRAPct);
    const employerMatchPct = toPercent(inputs.employerMatchPct);
    const brokerageGrowthRate = assumptions.scalars.cpi_inflation + toPercent(inputs.annualBrokerageGrowthRate);
    const brokerageContributionYear0 = toNumber(inputs.annualBrokerageContribution);
    const withdrawalRate = goalSheet.G7;
    const goalToday = goalSheet.G5;
    const workingState = goalSheet.G20;
    const retirementState = goalSheet.G22;
    const outsideIncomeToday = goalSheet.G36 + goalSheet.G38 + goalSheet.G40 + goalSheet.G42;

    const projectionRows = [];
    let previousTrad = 0;
    let previousRoth = 0;
    let previousBroker = 0;
    let previousBrokerBasis = 0;

    for (let year = 0; year < PROJECTION_YEARS; year += 1) {
      const age = currentAge + year;
      const inflationFactor = Math.pow(1 + assumptions.scalars.cpi_inflation, year);
      const salary = salaryYear0 * Math.pow(1 + salaryGrowthRate, year);
      const limit401k = assumptions.scalars.limit_401k * inflationFactor;
      const limitIra = assumptions.scalars.limit_ira * inflationFactor;
      const contributes = age <= retirementAge;

      const contribution401k = contributes ? limit401k * contribution401kPct : 0;
      const contributionIra = contributes ? limitIra * contributionIraPct : 0;
      const contributionBroker = contributes ? brokerageContributionYear0 * Math.pow(1 + brokerageGrowthRate, year) : 0;
      // Employer match requires an actual employee 401(k) contribution, not
      // just being under retirement age -- setting the contribution % to 0
      // previously still credited a full salary * employerMatchPct match
      // every year. See docs/financial-audit-2026-08-11.md finding #11.
      const employerMatch = contributes && contribution401k > 0 ? salary * employerMatchPct : 0;

      let tradBalancePreRmd = 0;
      let rmd = 0;
      let tradBalance = 0;
      let rothBalance = 0;
      let brokerBalance = 0;
      let brokerBasis = 0;

      if (year > 0) {
        tradBalancePreRmd =
          previousTrad * (1 + assumptions.scalars.portfolio_return) +
          contribution401k +
          employerMatch;
        const divisor = age >= assumptions.scalars.rmd_start_age ? getRMDDivisor(age, assumptions) : undefined;
        rmd = divisor ? tradBalancePreRmd / divisor : 0;
        tradBalance = Math.max(0, tradBalancePreRmd - rmd);
        rothBalance =
          previousRoth * (1 + assumptions.scalars.portfolio_return) +
          contributionIra;
        brokerBalance =
          previousBroker * (1 + assumptions.scalars.portfolio_return) +
          contributionBroker;
        brokerBasis = previousBrokerBasis + contributionBroker;
      }

      projectionRows.push({
        year,
        age,
        salary,
        limit401k,
        limitIra,
        contribution401k,
        contributionIra,
        contributionBroker,
        employerMatch,
        tradBalance,
        tradBalancePreRmd,
        rothBalance,
        brokerBalance,
        brokerBasis,
        rmd,
        totalBalance: tradBalance + rothBalance + brokerBalance,
      });

      previousTrad = tradBalance;
      previousRoth = rothBalance;
      previousBroker = brokerBalance;
      previousBrokerBasis = brokerBasis;
    }

    // --- Week 7 B - Results cell map ---
    const resultsCells = {};
    resultsCells.C9 = Math.max(0, goalSheet.G12 - goalSheet.G10); // Years to retirement
    resultsCells.C10 = Math.pow(1 + assumptions.scalars.cpi_inflation, resultsCells.C9); // Inflation factor
    resultsCells.C11 = outsideIncomeToday; // Outside income (today's $)
    resultsCells.C12 = resultsCells.C11 * resultsCells.C10; // Outside income (nominal at retirement)
    resultsCells.C13 = resultsCells.C9 + 3; // Projection row index

    const projectionIndex = Math.min(resultsCells.C9, projectionRows.length - 1);
    const retirementRow = projectionRows[projectionIndex];
    resultsCells.C14 = retirementRow?.tradBalance ?? 0; // Trad balance at retirement
    resultsCells.C15 = retirementRow?.rothBalance ?? 0; // Roth balance at retirement
    resultsCells.C16 = retirementRow?.brokerBalance ?? 0; // Broker balance at retirement
    resultsCells.C17 = retirementRow?.brokerBasis ?? 0; // Broker basis at retirement
    resultsCells.C18 = resultsCells.C14 * goalSheet.G7; // Traditional withdrawal
    resultsCells.C19 = (resultsCells.C14 + resultsCells.C15 + resultsCells.C16) * goalSheet.G7; // Total withdrawals
    resultsCells.C20 =
      resultsCells.C16 === 0
        ? 0
        : Math.max(0, (resultsCells.C16 - resultsCells.C17) / resultsCells.C16) *
          (resultsCells.C16 * goalSheet.G7);

    // --- Week 7 B - Tax Engine cell map ---
    const taxCells = {};
    taxCells.C3 = resultsCells.C9;
    taxCells.C4 = assumptions.scalars.cpi_inflation;
    taxCells.C5 = workingState;
    taxCells.C6 = retirementState;
    taxCells.C8 = goalSheet.G16;
    taxCells.C9 = Math.max(0, taxCells.C8 - assumptions.scalars.std_deduction_single);
    taxCells.C10 = calculateProgressiveTax(taxCells.C9, assumptions.federalOrdinaryBrackets);
    taxCells.C11 = taxCells.C9;
    taxCells.C12 = calculateProgressiveTax(
      taxCells.C11,
      assumptions.stateBrackets[taxCells.C5] || []
    );
    taxCells.C13 =
      Math.min(taxCells.C8, assumptions.scalars.ss_wage_base) * assumptions.scalars.ss_rate +
      taxCells.C8 * assumptions.scalars.medicare_rate +
      Math.max(0, taxCells.C8 - assumptions.scalars.addl_medicare_threshold) *
        assumptions.scalars.addl_medicare_rate;
    taxCells.C14 = taxCells.C8 - (taxCells.C10 + taxCells.C12 + taxCells.C13);

    taxCells.C17 = resultsCells.C18;
    taxCells.C18 = resultsCells.C20;
    taxCells.C19 =
      assumptions.scalars.std_deduction_single * Math.pow(1 + taxCells.C4, taxCells.C3);
    taxCells.C16 = Math.max(0, taxCells.C19 - taxCells.C17);
    taxCells.C20 = Math.max(0, taxCells.C17 - taxCells.C19);
    const indexedFedOrdinaryBrackets = scaleBrackets(
      assumptions.federalOrdinaryBrackets,
      Math.pow(1 + taxCells.C4, taxCells.C3)
    );
    taxCells.C21 = calculateProgressiveTax(taxCells.C20, indexedFedOrdinaryBrackets);
    taxCells.C22 = assumptions.federalLtcgBrackets[0].upper * Math.pow(1 + taxCells.C4, taxCells.C3);
    taxCells.C23 = assumptions.federalLtcgBrackets[1].upper * Math.pow(1 + taxCells.C4, taxCells.C3);
    taxCells.C24 = Math.max(
      0,
      Math.min(
        Math.max(0, taxCells.C18 - taxCells.C16),
        Math.max(0, taxCells.C22 - taxCells.C20)
      )
    );
    taxCells.C25 = Math.max(
      0,
      Math.min(
        Math.max(0, taxCells.C18 - taxCells.C16) - taxCells.C24,
        Math.max(0, taxCells.C23 - Math.max(taxCells.C20, taxCells.C22))
      )
    );
    taxCells.C26 = Math.max(
      0,
      Math.max(0, taxCells.C18 - taxCells.C16) - taxCells.C24 - taxCells.C25
    );
    taxCells.C27 = taxCells.C25 * 0.15 + taxCells.C26 * 0.2;
    taxCells.C28 = Math.max(0, taxCells.C17 + taxCells.C18 - taxCells.C19);
    taxCells.C29 = calculateProgressiveTax(
      taxCells.C28,
      scaleBrackets(
        assumptions.stateBrackets[taxCells.C6] || [],
        Math.pow(1 + taxCells.C4, taxCells.C3)
      )
    );
    taxCells.C30 = taxCells.C21 + taxCells.C27;
    taxCells.C31 = taxCells.C30 + taxCells.C29;

    // back-link from Week 7 B - Results
    resultsCells.C21 = taxCells.C31;
    resultsCells.C22 = resultsCells.C19 - resultsCells.C21;
    resultsCells.C23 = resultsCells.C22 / resultsCells.C10;
    resultsCells.C24 = resultsCells.C11 + resultsCells.C23;
    resultsCells.C25 = goalSheet.G5;
    resultsCells.C26 = resultsCells.C24 - resultsCells.C25;
    resultsCells.C27 = resultsCells.C14 + resultsCells.C15 + resultsCells.C16;

    const yearsToRetirement = resultsCells.C9;
    const inflationFactorToRetirement = resultsCells.C10;
    const tradAtRetirement = resultsCells.C14;
    const rothAtRetirement = resultsCells.C15;
    const brokerageAtRetirement = resultsCells.C16;
    const basisAtRetirement = resultsCells.C17;
    const traditionalWithdrawalNominal = resultsCells.C18;
    const totalWithdrawalsNominal = resultsCells.C19;
    const brokerageGainsPortionNominal = resultsCells.C20;
    const afterTaxInvestmentIncomeToday = resultsCells.C23;
    const totalRetirementIncomeToday = resultsCells.C24;
    const gapVsGoalToday = resultsCells.C26;
    const totalInvestmentBalanceAtRetirement = resultsCells.C27;

    return {
      salaryYear0,
      yearsToRetirement,
      inflationFactorToRetirement,
      projectionRows,
      projectionRowNumberAtRetirement: yearsToRetirement + 3,
      outsideIncomeToday: resultsCells.C11,
      outsideIncomeNominalAtRetirement: resultsCells.C12,
      tradAtRetirement,
      rothAtRetirement,
      brokerageAtRetirement,
      basisAtRetirement,
      traditionalWithdrawalNominal,
      totalWithdrawalsNominal,
      brokerageGainsPortionNominal,
      taxEngine: {
        ...taxCells,
      },
      resultsCells,
      afterTaxInvestmentIncomeToday,
      totalRetirementIncomeToday,
      goalToday: resultsCells.C25,
      gapVsGoalToday,
      totalInvestmentBalanceAtRetirement,
      yearly401kContribution:
        contribution401kPct * assumptions.scalars.limit_401k,
      yearlyIraContribution:
        contributionIraPct * assumptions.scalars.limit_ira,
    };
  }, [inputs, linkedSalary, budgetContextLooksUntouched, assumptions]);

  const goalVsIncomeData = useMemo(
    () => ({
      labels: ['Goal', 'Outside income', 'Investment income', 'Gap'],
      datasets: [
        {
          label: 'Amount',
          data: [
            model.goalToday,
            model.outsideIncomeToday,
            model.afterTaxInvestmentIncomeToday,
            model.gapVsGoalToday,
          ],
          backgroundColor: ['#1e293b', '#94a3b8', '#0f766e', '#64748b'],
          borderRadius: 6,
          barThickness: 28,
        },
      ],
    }),
    [model.goalToday, model.outsideIncomeToday, model.afterTaxInvestmentIncomeToday, model.gapVsGoalToday]
  );

  const moneySourceData = useMemo(
    () => ({
      labels: ['Businesses', 'Real estate', 'Notes/IOUs', 'Royalties/IP', 'Investments'],
      datasets: [
        {
          label: 'Amount',
          data: [
            Number(inputs.businessesIncome || 0),
            Number(inputs.realEstateIncome || 0),
            Number(inputs.notesIncome || 0),
            Number(inputs.royaltiesIncome || 0),
            model.afterTaxInvestmentIncomeToday,
          ],
          backgroundColor: ['#d8dee9', '#94a3b8', '#64748b', '#475569', '#1e293b'],
          borderRadius: 6,
          barThickness: 28,
        },
      ],
    }),
    [
      inputs.businessesIncome,
      inputs.realEstateIncome,
      inputs.notesIncome,
      inputs.royaltiesIncome,
      model.afterTaxInvestmentIncomeToday,
    ]
  );

  const investmentsData = useMemo(() => {
    const ages = model.projectionRows.map((row) => row.age);
    const preRetirement = model.projectionRows.map((row, index) =>
      index <= model.yearsToRetirement ? Math.round(row.totalBalance) : null
    );
    const postRetirement = model.projectionRows.map((row, index) =>
      index >= model.yearsToRetirement ? Math.round(row.totalBalance) : null
    );

    return {
      labels: ages,
      datasets: [
        {
          label: 'Before retirement',
          data: preRetirement,
          borderColor: '#94a3b8',
          backgroundColor: 'rgba(148, 163, 184, 0.25)',
          borderWidth: 3,
          pointRadius: 0,
          tension: 0.28,
        },
        {
          label: 'After retirement',
          data: postRetirement,
          borderColor: '#1e293b',
          backgroundColor: 'rgba(30, 41, 59, 0.2)',
          borderWidth: 3,
          pointRadius: 0,
          tension: 0.28,
        },
      ],
    };
  }, [model.projectionRows, model.yearsToRetirement]);

  const goalVsIncomeLegend = [
    { label: 'Goal', color: '#1e293b' },
    { label: 'Outside income', color: '#94a3b8' },
    { label: 'Investment income', color: '#0f766e' },
    { label: 'Gap', color: '#64748b' },
  ];

  const moneySourceLegend = [
    { label: 'Businesses', color: '#d8dee9' },
    { label: 'Real estate', color: '#94a3b8' },
    { label: 'Notes/IOUs', color: '#64748b' },
    { label: 'Royalties/IP', color: '#475569' },
    { label: 'Investments', color: '#1e293b' },
  ];

  const sharedBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${formatCurrency(context.raw)}`,
        },
      },
    },
    layout: {
      padding: { left: 8, right: 8, top: 6, bottom: 4 },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, maxRotation: 0, minRotation: 0 },
      },
      y: {
        beginAtZero: true,
        grid: { display: false },
        ticks: {
          callback: (value) => formatCurrency(value),
          font: { size: 11 },
        },
      },
    },
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${formatCurrency(context.raw)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        title: { display: true, text: 'Age', font: { size: 12 } },
        ticks: {
          maxTicksLimit: 16,
          autoSkip: true,
          font: { size: 11 },
        },
      },
      y: {
        beginAtZero: true,
        grid: { display: false },
        ticks: {
          callback: (value) => formatCurrency(value),
          font: { size: 11 },
        },
      },
    },
  };

  const worksheetSections = [
    {
      title: 'Your goal',
      rows: [
        { key: 'goalAnnualAfterTax', label: 'How much you want to live on each year (after tax, in today\'s dollars)', type: 'currency', inputVariant: 'yellow' },
        { key: 'withdrawalRate', label: 'Percent of your portfolio you withdraw yearly', type: 'percent', inputVariant: 'yellow' },
      ],
    },
    {
      title: 'Your timeline',
      rows: [
        { key: 'currentAge', label: 'Your current age', type: 'age', inputVariant: 'yellow' },
        { key: 'retirementAge', label: 'The age you want to retire', type: 'age', inputVariant: 'yellow' },
      ],
    },
    {
      title: 'Your salary and taxes (you do NOT enter tax rates)',
      rows: [
        { key: 'salaryBeforeTax', label: 'Salary (before tax, today\'s dollars)', type: 'currency', inputVariant: 'white', readOnly: true },
        { key: 'extraRaise', label: 'Extra raise above inflation', type: 'percent', inputVariant: 'yellow' },
        { key: 'stateWorking', label: 'State you live in while working', type: 'state', inputVariant: 'yellow' },
        { key: 'stateRetirement', label: 'State you expect to live in during retirement', type: 'state', inputVariant: 'yellow' },
      ],
    },
    {
      title: 'How you invest each year',
      rows: [
        { key: 'contribution401kPct', label: '% of the 401(k) max limit you invest each year', type: 'percent', inputVariant: 'yellow' },
        { key: 'employerMatchPct', label: 'Employer match on your 401(k)', type: 'percent', inputVariant: 'yellow' },
        { key: 'contributionIRAPct', label: '% of the IRA max limit you invest each year (0 to 1)', type: 'percent', inputVariant: 'yellow' },
        { key: 'annualBrokerageContribution', label: 'Annual brokerage account contribution', type: 'currency', inputVariant: 'yellow' },
        { key: 'annualBrokerageGrowthRate', label: 'Annual brokerage contribution growth rate', type: 'percent', inputVariant: 'yellow' },
      ],
    },
    {
      title: 'Advanced - Income you expect from other sources in retirement (after tax, today\'s dollars)',
      rows: [
        { key: 'businessesIncome', label: 'Businesses (takes none of your time)', type: 'currency', inputVariant: 'yellow' },
        { key: 'realEstateIncome', label: 'Real estate (rent after expenses)', type: 'currency', inputVariant: 'yellow' },
        { key: 'notesIncome', label: 'Notes / IOUs', type: 'currency', inputVariant: 'yellow' },
        { key: 'royaltiesIncome', label: 'Royalties / Intellectual Property', type: 'currency', inputVariant: 'yellow' },
      ],
    },
  ];

  const resultRows = [
    { label: 'Total retirement income (after tax, in today\'s dollars)', value: formatCurrency(model.totalRetirementIncomeToday) },
    { label: 'After-tax income from advanced sources', value: formatCurrency(model.outsideIncomeToday) },
    { label: 'Portfolio income', value: formatCurrency(model.afterTaxInvestmentIncomeToday) },
    { label: 'Gap vs your goal (positive = extra, negative = shortfall)', value: formatCurrency(model.gapVsGoalToday) },
    { label: 'Retirement portfolio balance', value: formatCurrency(model.totalInvestmentBalanceAtRetirement) },
  ];

  const getFieldValue = (key, type) => {
    if (key === 'salaryBeforeTax') return formatCurrency(model.salaryYear0);
    if (type === 'currency') return formatCurrencyInput(inputs[key]);
    if (type === 'percent') return formatPercent(inputs[key]);
    return inputs[key];
  };

  const getSanitizer = (type) => {
    if (type === 'currency') return sanitizeCurrency;
    if (type === 'percent') return (value) => sanitizePercent(value.replace('%', '')).slice(0, 5);
    if (type === 'age') return (value) => sanitizeMoney(value).slice(0, 3);
    if (type === 'state') return sanitizeState;
    return undefined;
  };

  return (
    <>
      <style>{`
        .week12-goal-page input:not([readonly]) {
          transform: scale(1);
          will-change: transform, box-shadow, border-color, background-color;
        }
        .week12-goal-page input:not([readonly]):hover:not(:focus) {
          border-color: #9ca3af !important;
          background-color: #ffffff !important;
          box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03) !important;
          transform: translateY(-2px) scale(1.01) !important;
        }
        .week12-goal-page input:not([readonly]):focus {
          border-color: #0d1a4b !important;
          background-color: #fffef0 !important;
          box-shadow: 0 0 0 3px rgba(13, 26, 75, 0.12) !important;
          transform: translateY(-1px) scale(1.01) !important;
          outline: none;
        }
        .week12-surface {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .week12-surface:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12);
          border-color: rgba(148, 163, 184, 0.35) !important;
        }
        .week12-goal-page table tbody tr:hover td {
          background-color: #f8fafc;
        }
        .week12-chart-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 28px rgba(15, 23, 42, 0.11);
        }
        .week12-responsive-hidden-desktop {
          display: none;
        }
        @media (max-width: 1024px) {
          .week12-sheet-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }
          .week12-contributions-desktop {
            display: none !important;
          }
          .week12-responsive-hidden-desktop {
            display: block;
            margin-bottom: 14px;
          }
          .week12-chart-grid {
            grid-template-columns: 1fr !important;
          }
          .week12-line-half {
            max-width: 100% !important;
          }
          .week12-field-row {
            grid-template-columns: 1fr !important;
          }
          .week12-field-value-cell {
            border-left: none !important;
            border-top: 1px solid #e5e7eb;
          }
        }
      `}</style>

      <div
        style={{
          position: 'fixed',
          top: '24px',
          right: '32px',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255,255,255,0.85)',
          border: '1px solid rgba(13, 26, 75, 0.15)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          borderRadius: '14px',
          padding: '12px 20px',
          color: '#0d1a4b',
          fontWeight: 500,
          fontSize: 12,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d1a4b" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
        </svg>
        You can only enter data in the open (yellow) fields.
      </div>

      <div style={styles.container}>
        <div style={styles.sectionContainer} className="week12-goal-page">
          <div style={styles.enhancedHeader}>
            <span style={{ fontSize: '26px', letterSpacing: '-0.02em' }}>Constructing The Goal</span>
          </div>

          <div style={styles.infoBox}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d1a4b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <div>
              <strong>How it works:</strong> Enter values in yellow fields. This page now computes projection, taxes, and retirement goal outputs using the Week 7 workbook logic.
            </div>
          </div>

          <div className="week12-responsive-hidden-desktop">
            <div style={{ ...styles.contributionsCard, marginTop: 0 }} className="week12-surface">
              <div style={styles.contributionsHeader}>This Year&apos;s Contributions</div>
              <div style={styles.contributionsValue}>{formatCurrency(model.yearly401kContribution)}</div>
              <div style={{ ...styles.contributionsValue, borderBottom: 'none' }}>{formatCurrency(model.yearlyIraContribution)}</div>
            </div>
          </div>

          <div style={styles.worksheetGrid} className="week12-sheet-grid">
            <div style={styles.worksheetSurface} className="week12-surface">
              <div style={styles.sectionStack}>
                {worksheetSections.map((section) => (
                  <div key={section.title} style={styles.sectionCard}>
                    <div style={styles.sectionCardTitle}>{section.title}</div>
                    <div>
                      {section.rows.map((row, rowIndex) => (
                        <div
                          key={row.key}
                          className="week12-field-row"
                          style={{
                            ...styles.fieldRow,
                            borderTop: rowIndex === 0 ? 'none' : styles.fieldRow.borderTop,
                          }}
                        >
                          <div style={styles.fieldLabel}>{row.label}</div>
                          <div style={styles.fieldValueCell} className="week12-field-value-cell">
                            <input
                              value={getFieldValue(row.key, row.type)}
                              onChange={row.readOnly ? undefined : updateInput(row.key, getSanitizer(row.type))}
                              readOnly={Boolean(row.readOnly)}
                              style={row.inputVariant === 'white' ? styles.whiteInput : styles.yellowInput}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div style={styles.sectionCard}>
                  <div style={styles.sectionCardTitle}>Your results (automatic)</div>
                  <div>
                    {resultRows.map((row, rowIndex) => (
                      <div
                        key={row.label}
                        className="week12-field-row"
                        style={{
                          ...styles.fieldRow,
                          borderTop: rowIndex === 0 ? 'none' : styles.fieldRow.borderTop,
                        }}
                      >
                        <div style={styles.fieldLabel}>{row.label}</div>
                        <div style={styles.fieldValueCell} className="week12-field-value-cell">
                          <input value={row.value} readOnly style={styles.grayOutput} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.contributionsCard} className="week12-contributions-desktop week12-surface">
              <div style={styles.contributionsHeader}>This Year&apos;s Contributions</div>
              <div style={styles.contributionsValue}>{formatCurrency(model.yearly401kContribution)}</div>
              <div style={{ ...styles.contributionsValue, borderBottom: 'none' }}>{formatCurrency(model.yearlyIraContribution)}</div>
            </div>
          </div>

          <div style={styles.chartGrid} className="week12-chart-grid">
            <div style={styles.chartCard} className="week12-chart-card week12-surface">
              <div style={styles.chartTitle}>Goal vs Income (Today&apos;s $)</div>
              <div style={{ height: 270 }}>
                <Bar data={goalVsIncomeData} options={sharedBarOptions} />
              </div>
              <div style={styles.chartLegendRow}>
                {goalVsIncomeLegend.map((item) => (
                  <span key={item.label} style={styles.chartLegendItem}>
                    <span style={{ ...styles.chartLegendSwatch, backgroundColor: item.color }} />
                    {item.label}
                  </span>
                ))}
              </div>
            </div>

            <div style={styles.chartCard} className="week12-chart-card week12-surface">
              <div style={styles.chartTitle}>Where Your Retirement Money Comes From</div>
              <div style={{ height: 270 }}>
                <Bar data={moneySourceData} options={sharedBarOptions} />
              </div>
              <div style={styles.chartLegendRow}>
                {moneySourceLegend.map((item) => (
                  <span key={item.label} style={styles.chartLegendItem}>
                    <span style={{ ...styles.chartLegendSwatch, backgroundColor: item.color }} />
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div style={styles.lineChartCard} className="week12-chart-card week12-line-half week12-surface">
            <div style={styles.chartTitle}>Investments Over Time (Nominal $)</div>
            <div style={{ height: 305 }}>
              <Line data={investmentsData} options={lineOptions} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Week12;
