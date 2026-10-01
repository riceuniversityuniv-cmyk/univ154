import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import { useBudget } from '../contexts/BudgetContext';
import { useAssumptions } from '../contexts/AssumptionsContext';
import { formatCurrency } from '../utils/formatters';
import { simulateRetirementAccount, discountToToday, PROJECTION_END_AGE } from '../utils/retirementProjection';
import { tableHeaderStyle } from '../styles/tableHeaderStyle';

// Round a chart's max up to a "nice" number so the top tick lands exactly on
// the plot's top edge (<= 5 intervals), and list the ticks for it.
const NICE_STEPS = [1, 2, 2.5, 5, 10];
const niceAxisStep = (max) => {
  const magnitude = Math.pow(10, Math.floor(Math.log10(max)) - 1);
  return NICE_STEPS.map(m => m * magnitude).find(step => max / step <= 5) || magnitude * 10;
};
const niceAxisMax = (max) => {
  if (!(max > 0)) return 1;
  const step = niceAxisStep(max);
  return Math.ceil(max / step - 1e-9) * step;
};
const niceAxisTicks = (top) => {
  if (!(top > 0)) return [0];
  const step = niceAxisStep(top);
  const ticks = [];
  for (let v = 0; v <= top + step / 1000; v += step) ticks.push(v);
  return ticks;
};

const RMD_DEFINITION = 'Required Minimum Distribution: the minimum amount the IRS forces you to withdraw each year from a traditional 401(k) or IRA once you reach this age (Roth IRAs are exempt).';

// Modern inline styles matching Week 2 and Week 3 design
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
  // Same floating-box shape as Week7.jsx's term tooltip (navy gradient,
  // blur, arrow), but with a warm gold text color instead of plain white
  // so it doesn't read as an interchangeable copy of that one.
  deferralTooltip: {
    position: 'fixed',
    zIndex: 10000,
    background: 'linear-gradient(135deg, rgba(13, 26, 75, 0.98) 0%, rgba(30, 58, 138, 0.96) 100%)',
    color: '#fcd34d',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    maxWidth: '280px',
    boxShadow: '0 8px 24px rgba(13, 26, 75, 0.35)',
    border: '1px solid rgba(255, 255, 255, 0.16)',
    pointerEvents: 'none',
    opacity: 0.97,
    backdropFilter: 'blur(6px)',
    transform: 'translateX(-50%)',
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
    maxWidth: '1520px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  enhancedHeader: {
    background: 'linear-gradient(135deg, rgba(13, 26, 75, 0.95) 0%, rgba(30, 58, 138, 0.9) 100%)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    color: 'white',
    padding: '28px 32px',
    borderRadius: '16px',
    fontWeight: '600',
    fontSize: '22px',
    textAlign: 'center',
    marginBottom: '32px',
    boxShadow: '0 8px 32px 0 rgba(13, 26, 75, 0.3), 0 4px 16px 0 rgba(13, 26, 75, 0.2)',
    letterSpacing: '-0.01em',
    lineHeight: '1.3',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  sectionDivider: {
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(229, 231, 235, 0.6), transparent)',
    margin: '0',
    borderRadius: '1px',
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
    marginBottom: '24px',
    border: '1px solid rgba(13, 26, 75, 0.15)',
  },
  section: {
    marginBottom: 48,
    borderRadius: '16px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    background: '#fff',
    padding: '32px 2vw',
    border: '1px solid #e5e7eb',
    transition: 'all 0.2s ease-in-out',
  },
  header: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#0d1a4b',
    marginBottom: 20,
    letterSpacing: '-0.01em',
  },
  subHeader: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#0d1a4b',
    margin: '20px 0 12px 0',
    letterSpacing: '-0.01em',
  },
  table: {
    width: '70%',
    borderCollapse: 'separate',
    borderSpacing: 0,
    marginTop: 12,
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #e5e7eb',
    marginBottom: 20,
    marginLeft: 'auto',
    marginRight: 'auto',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  },
  
  th: {
    ...tableHeaderStyle,
    padding: '14px',
    textAlign: 'center',
    letterSpacing: '-0.01em',
  },
  td: {
    border: '1px solid #e5e7eb',
    padding: '12px 14px',
    verticalAlign: 'middle',
    textAlign: 'center',
    backgroundColor: 'white',
    transition: 'background-color 0.15s ease',
  },
  input: {
    width: '100%',
    border: '2px solid #d1d5db',
    padding: '10px 14px',
    textAlign: 'right',
    backgroundColor: '#fffde7',
    borderRadius: '8px',
    boxSizing: 'border-box',
    fontWeight: '500',
    fontSize: '14px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
    transform: 'scale(1)',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)',
    maxWidth: '100%',
  },
  readOnly: {
    textAlign: 'right',
    paddingRight: '12px',
    color: '#6b7280',
    backgroundColor: 'rgba(249, 250, 251, 0.8)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    borderRadius: '8px',
    fontWeight: '600',
    border: '1px solid rgba(229, 231, 235, 0.6)',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)',
  },
  chartPlaceholder: {
    width: '70%',
    height: 300,
    background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6b7280',
    fontSize: 18,
    borderRadius: '16px',
    margin: '24px auto',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  },
  info: {
    background: 'linear-gradient(135deg, rgba(255, 253, 231, 0.9) 0%, rgba(254, 243, 199, 0.9) 100%)',
    border: '2px solid #fdb913',
    boxShadow: '0 4px 6px -1px rgba(253, 185, 19, 0.2), 0 2px 4px -2px rgba(253, 185, 19, 0.1)',
    borderRadius: '12px',
    padding: '14px 20px',
    color: '#0d1a4b',
    fontWeight: 500,
    fontSize: 13,
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
};

// Hover-definition bubble. Owns its own state so moving the mouse over a term
// re-renders only this tiny component -- not the whole (very heavy) Week 6
// page, whose withdrawal tabs re-run the projection engine on every render.
// Portaled to <body> so no blurred/transformed ancestor can misplace it.
const TermTipHost = forwardRef(function TermTipHost(_props, ref) {
  const [tip, setTip] = useState(null);
  useImperativeHandle(ref, () => ({
    show: (text, e) => setTip({ text, x: e.clientX, y: e.clientY }),
    hide: () => setTip(null),
  }), []);
  if (!tip) return null;
  return createPortal(
    <div style={{
      ...styles.deferralTooltip,
      left: `${Math.min(Math.max(tip.x, 150), window.innerWidth - 150)}px`,
      top: `${tip.y - 16}px`,
      transform: 'translate(-50%, -100%)',
      width: 'max-content',
      maxWidth: '300px',
    }}>
      <div style={{ lineHeight: '1.45', fontSize: '13px' }}>{tip.text}</div>
    </div>,
    document.body
  );
});

export default function Week6Retirement() {
  const { topInputs, retirementInputs, setRetirementInputs, userPreTaxInputs, financialCalculations, summaryCalculations, saveBudgetData, loadBudgetData } = useBudget() || {};
  const { assumptions } = useAssumptions();

  const selectedState = topInputs?.location;
  const stateBrackets = selectedState ? (assumptions.stateBrackets[selectedState] || []) : [];

  // Which tab is showing: a Summary view (income summary + retirement
  // account budgeting + monthly deferral calculator) plus one tab per
  // account type. Splits what used to be one long scrolling page into
  // separate views without touching any of the shared calculations below,
  // which all still run regardless of which tab is active.
  const [activeTab, setActiveTab] = useState('summary');

  // Hover state for the "Deferral" quick-definition tooltip next to the
  // Monthly Deferral Calculator title.
  const [showDeferralTooltip, setShowDeferralTooltip] = useState(false);
  const [deferralTooltipPosition, setDeferralTooltipPosition] = useState({ x: 0, y: 0 });
  // Generic hover definition for other terms (e.g. RMD) -- same look as the
  // Deferral tooltip above. null = hidden.
  const termTipRef = useRef(null);
  // RMD start age always comes from the Assumptions table (never from saved data).
  const rmdStartAge = assumptions.scalars.rmd_start_age;

  const renderTermHint = (label, text) => (
    <span
      style={{ textDecoration: 'underline dotted', textUnderlineOffset: '3px', cursor: 'help' }}
      onMouseEnter={(e) => termTipRef.current?.show(text, e)}
      onMouseMove={(e) => termTipRef.current?.show(text, e)}
      onMouseLeave={() => termTipRef.current?.hide()}
    >
      {label}
    </span>
  );

  // New Retirement Budgeting state with default values
  const [retirementBudgetedAmounts, setRetirementBudgetedAmounts] = useState({
    traditional_401k: '',
    roth_401k: '',
    traditional_ira: '',
    roth_ira: ''
  });

  // Error state for validation messages
  const [validationErrors, setValidationErrors] = useState({});

  // Calculate default values based on Week 1 recommendations
  const getDefaultBudgetedAmount = (type) => {
    const defaultValue = 386.526666666667; // Default value you want
    return Math.round(defaultValue); // Round to 387 for display
  };

  const [deferralPercentage, setDeferralPercentage] = useState(5);

  // State for monthly payment inputs in retirement planning sections
  const [monthlyPayments, setMonthlyPayments] = useState({
    traditional_401k_a: 387,
    traditional_401k_b: 833,
    traditional_401k_c: 1279,
    roth_401k_a: 387,
    roth_401k_b: 833,
    roth_401k_c: 1279,
    traditional_ira_a: 300,
    traditional_ira_b: 400,
    traditional_ira_c: 500,
    roth_ira_a: 300,
    roth_ira_b: 400,
    roth_ira_c: 500
  });

  // State for validation errors in monthly payment inputs
  const [monthlyPaymentErrors, setMonthlyPaymentErrors] = useState({});

  // State for table visibility filters
  const [tableVisibility, setTableVisibility] = useState({
    traditional401kSeriesA: false,
    traditional401kSeriesB: false,
    traditional401kSeriesC: false,
    roth401kSeriesA: false,
    roth401kSeriesB: false,
    roth401kSeriesC: false,
    traditionalIRASeriesA: false,
    traditionalIRASeriesB: false,
    traditionalIRASeriesC: false,
    rothIRASeriesA: false,
    rothIRASeriesB: false,
    rothIRASeriesC: false
  });

  // State for selected series
  const [selectedSeries, setSelectedSeries] = useState('none');
  const [selectedWithdrawalSeries, setSelectedWithdrawalSeries] = useState('none');
  const [selectedRoth401kSeries, setSelectedRoth401kSeries] = useState('none');
  const [selectedRoth401kWithdrawalSeries, setSelectedRoth401kWithdrawalSeries] = useState('A');
  const [selectedTraditionalIRASeries, setSelectedTraditionalIRASeries] = useState('none');
  const [selectedTraditionalIRAWithdrawalSeries, setSelectedTraditionalIRAWithdrawalSeries] = useState('A');
  const [selectedRothIRASeries, setSelectedRothIRASeries] = useState('none');
  const [selectedRothIRAWithdrawalSeries, setSelectedRothIRAWithdrawalSeries] = useState('A');

  // State for other retirement planning inputs
  const [retirementPlanningInputs, setRetirementPlanningInputs] = useState({
    contributionStartAge: 22,
    retirementAge: 65,
    annualReturnRate: 7,
    employerMatch401k: 3,
    employerMatchIRA: 0,
    // Traditional 401k withdrawal rates
    traditional401kWithdrawalRateA: 4,
    traditional401kWithdrawalRateB: 4,
    traditional401kWithdrawalRateC: 4,
    // Roth 401k withdrawal rates
    roth401kWithdrawalRateA: 4,
    roth401kWithdrawalRateB: 4,
    roth401kWithdrawalRateC: 4,
    // Traditional IRA withdrawal rates
    traditionalIRAWithdrawalRateA: 4,
    traditionalIRAWithdrawalRateB: 4,
    traditionalIRAWithdrawalRateC: 4,
    // Roth IRA withdrawal rates
    rothIRAWithdrawalRateA: 4,
    rothIRAWithdrawalRateB: 4,
    rothIRAWithdrawalRateC: 4,
    traditional401kAgeA: 65,
    traditional401kAgeB: 65,
    traditional401kAgeC: 65,
    roth401kAgeA: 65,
    roth401kAgeB: 65,
    roth401kAgeC: 65,
    traditionalIRAAgeA: 65, // Traditional IRA Scenario A age
    traditionalIRAAgeB: 65,
    traditionalIRAAgeC: 65,
    rothIRAAgeA: 65,
    rothIRAAgeB: 65,
    rothIRAAgeC: 65,
    // Sourced from the Assumptions table (was hardcoded to 75 here, which
    // disagreed with the `|| 73` fallback used elsewhere in this file --
    // see docs/financial-audit-2026-08-11.md).
    // Optional flat retirement tax-rate override (%); '' = auto from withdrawal
    traditional401kTaxRateA: '', traditional401kTaxRateB: '', traditional401kTaxRateC: '',
    traditionalIRATaxRateA: '', traditionalIRATaxRateB: '', traditionalIRATaxRateC: '',
    roth401kTaxRateA: '', roth401kTaxRateB: '', roth401kTaxRateC: ''
  });

  // State for validation errors in retirement planning inputs
  const [retirementPlanningErrors, setRetirementPlanningErrors] = useState({});

  const sanitizeRetirementPlanningInputs = (inputs = {}) => {
    const parsedRetirementAge = Number.parseInt(inputs.retirementAge, 10);
    const safeRetirementAge = Number.isFinite(parsedRetirementAge)
      ? Math.min(Math.max(parsedRetirementAge, 31), 100)
      : 65;

    const maxContributionStartAge = Math.max(safeRetirementAge - 1, 0);
    const parsedContributionStartAge = Number.parseInt(inputs.contributionStartAge, 10);
    const safeContributionStartAge = Number.isFinite(parsedContributionStartAge)
      ? Math.min(Math.max(parsedContributionStartAge, 0), maxContributionStartAge)
      : 22;

    return {
      ...inputs,
      contributionStartAge: safeContributionStartAge,
      retirementAge: safeRetirementAge
    };
  };

  // Distributions can't start before contributions stop, and Traditional
  // accounts can't defer past the RMD start age. Returns only the withdrawal-age
  // keys that need to change (older saves / a raised Retirement Age can leave
  // them below the retirement age).
  const WITHDRAWAL_AGE_KEYS = [
    'traditional401kAgeA', 'traditional401kAgeB', 'traditional401kAgeC',
    'roth401kAgeA', 'roth401kAgeB', 'roth401kAgeC',
    'traditionalIRAAgeA', 'traditionalIRAAgeB', 'traditionalIRAAgeC',
    'rothIRAAgeA', 'rothIRAAgeB', 'rothIRAAgeC',
  ];
  const alignWithdrawalAges = (inputs) => {
    const retirementAge = parseInt(inputs.retirementAge, 10) || 65;
    const changes = {};
    WITHDRAWAL_AGE_KEYS.forEach((key) => {
      const current = parseInt(inputs[key], 10);
      const max = key.startsWith('traditional') ? Math.max(rmdStartAge, retirementAge) : 100;
      const next = Number.isFinite(current) ? Math.min(Math.max(current, retirementAge), max) : retirementAge;
      if (next !== current) changes[key] = next;
    });
    return changes;
  };

  // Auto-save function (without alert)
  const autoSaveWeek6 = () => {
    try {
      const week6Data = {
        version: 2,
        retirementPlanningInputs,
        monthlyPayments,
        timestamp: new Date().toISOString()
      };
      
      // Save to localStorage silently
      localStorage.setItem('week6_data', JSON.stringify(week6Data));
    } catch (error) {
      console.error('Error auto-saving Week 6 data:', error);
    }
  };

  // Auto-load data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('week6_data');
    if (savedData) {
      try {
        const week6Data = JSON.parse(savedData);
        
        // Load retirement planning inputs
        if (week6Data.retirementPlanningInputs) {
          // Drop legacy/derived keys (rmdAge now always comes from the
          // Assumptions table; startingDistributionAgeA was a mis-named key).
          // eslint-disable-next-line no-unused-vars
          const { rmdAge, startingDistributionAgeA, ...savedInputs } = week6Data.retirementPlanningInputs;
          setRetirementPlanningInputs(prev => {
            const merged = sanitizeRetirementPlanningInputs({ ...prev, ...savedInputs });
            return { ...merged, ...alignWithdrawalAges(merged) };
          });
        }
        
        // Load monthly payments
        if (week6Data.monthlyPayments) {
          setMonthlyPayments(week6Data.monthlyPayments);
        }
      } catch (error) {
        console.error('Error loading Week 6 data:', error);
      }
    }
  }, []); // Only run on mount

  useEffect(() => {
    const sanitized = sanitizeRetirementPlanningInputs(retirementPlanningInputs);
    const startAgeChanged = String(sanitized.contributionStartAge) !== String(retirementPlanningInputs.contributionStartAge);
    const retirementAgeChanged = String(sanitized.retirementAge) !== String(retirementPlanningInputs.retirementAge);

    if (startAgeChanged || retirementAgeChanged) {
      setRetirementPlanningInputs(prev => ({
        ...prev,
        contributionStartAge: sanitized.contributionStartAge,
        retirementAge: sanitized.retirementAge
      }));
    }
  }, [retirementPlanningInputs.contributionStartAge, retirementPlanningInputs.retirementAge]);

  // Auto-save with debounce (500ms delay)
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      autoSaveWeek6();
    }, 500); // Wait 500ms after last change before saving

    return () => clearTimeout(saveTimer);
  }, [retirementPlanningInputs, monthlyPayments]);

  const preTaxIncome = Number(topInputs?.preTaxIncome) || 1;
  const suggestedAfterTaxIncome = summaryCalculations?.suggestedAfterTaxIncome || 0;
  const userAfterTaxIncome = summaryCalculations?.userAfterTaxIncome || 0;

  // Calculate monthly incomes
  const monthlyPreTaxIncome = preTaxIncome / 12;
  const monthlySuggestedAfterTaxIncome = suggestedAfterTaxIncome / 12; // For recommended calculations
  const monthlyUserAfterTaxIncome = userAfterTaxIncome / 12; // For user input calculations

  // Helper function to calculate percentage of Monthly Pre-Tax Income
  const calculatePercentageOfPreTaxIncome = (monthlyPayment) => {
    if (!monthlyPreTaxIncome || monthlyPreTaxIncome <= 0) return 0;
    return ((monthlyPayment || 0) / monthlyPreTaxIncome) * 100;
  };

  // Helper function to calculate percentage of Monthly After Tax Income
  const calculatePercentageOfAfterTaxIncome = (monthlyPayment) => {
    if (!monthlyUserAfterTaxIncome || monthlyUserAfterTaxIncome <= 0) return 0;
    return ((monthlyPayment || 0) / monthlyUserAfterTaxIncome) * 100;
  };

  // Toggle table visibility
  const toggleTableVisibility = (tableKey) => {
    setTableVisibility(prev => ({
      ...prev,
      [tableKey]: !prev[tableKey]
    }));
  };

  // Handle series selection
  const handleSeriesSelection = (series) => {
    setSelectedSeries(series);
    // Reset all visibility
    setTableVisibility({
      traditional401kSeriesA: false,
      traditional401kSeriesB: false,
      traditional401kSeriesC: false,
      roth401kSeriesA: false,
      roth401kSeriesB: false,
      roth401kSeriesC: false,
      traditionalIRASeriesA: false,
      traditionalIRASeriesB: false,
      traditionalIRASeriesC: false,
      rothIRASeriesA: false,
      rothIRASeriesB: false,
      rothIRASeriesC: false
    });
    // Show selected series
    if (series !== 'none') {
      setTableVisibility(prev => ({
        ...prev,
        [`traditional401kSeries${series}`]: true
      }));
    }
  };

  // ---- Projection engine wiring -------------------------------------------
  // All 12 account/scenario projections share one engine
  // (utils/retirementProjection.js). See docs/univ154-migration.md
  // 2026-09-30 entry for the rules (bridge years, RMDs, tax, CPI discount).
  const RETIREMENT_ACCOUNTS = {
    traditional401k: { pay: 'traditional_401k', ageKey: 'traditional401kAge', rateKey: 'traditional401kWithdrawalRate', taxKey: 'traditional401kTaxRate', match: true, traditional: true, accountType: 'traditional' },
    roth401k: { pay: 'roth_401k', ageKey: 'roth401kAge', rateKey: 'roth401kWithdrawalRate', taxKey: 'roth401kTaxRate', match: true, traditional: false, accountType: 'roth401k' },
    traditionalIRA: { pay: 'traditional_ira', ageKey: 'traditionalIRAAge', rateKey: 'traditionalIRAWithdrawalRate', taxKey: 'traditionalIRATaxRate', match: false, traditional: true, accountType: 'traditional' },
    rothIRA: { pay: 'roth_ira', ageKey: 'rothIRAAge', rateKey: 'rothIRAWithdrawalRate', taxKey: null, match: false, traditional: false, accountType: 'roth' },
  };

  const simulateAccount = (account, series) => {
    const cfg = RETIREMENT_ACCOUNTS[account];
    const inputs = retirementPlanningInputs;
    const retirementAge = inputs.retirementAge || 65;
    const taxOverride = cfg.taxKey ? inputs[cfg.taxKey + series] : null;
    return simulateRetirementAccount({
      monthlyPayment: parseFloat(monthlyPayments[`${cfg.pay}_${series.toLowerCase()}`]) || 0,
      employerMatchRate: cfg.match ? (inputs.employerMatch401k || 0) / 100 : 0,
      returnRate: (Number.isFinite(parseFloat(inputs.annualReturnRate)) ? parseFloat(inputs.annualReturnRate) : 7) / 100,
      contributionStartAge: inputs.contributionStartAge || 22,
      retirementAge,
      withdrawalStartAge: parseInt(inputs[cfg.ageKey + series], 10) || retirementAge,
      withdrawalRate: (parseFloat(inputs[cfg.rateKey + series]) || 0) / 100,
      accountType: cfg.accountType,
      taxRateOverride: taxOverride === '' || taxOverride == null ? null : parseFloat(taxOverride) / 100,
      assumptions,
      state: topInputs?.location,
      residenceInNYC: topInputs?.location === 'NY' && topInputs?.residenceInNYC === 'Yes',
    });
  };

  const calculateTraditional401kSeriesA = () => simulateAccount('traditional401k', 'A');
  const calculateTraditional401kSeriesB = () => simulateAccount('traditional401k', 'B');
  const calculateTraditional401kSeriesC = () => simulateAccount('traditional401k', 'C');
  const calculateRoth401kSeriesA = () => simulateAccount('roth401k', 'A');
  const calculateRoth401kSeriesB = () => simulateAccount('roth401k', 'B');
  const calculateRoth401kSeriesC = () => simulateAccount('roth401k', 'C');
  const calculateTraditionalIRASeriesA = () => simulateAccount('traditionalIRA', 'A');
  const calculateTraditionalIRASeriesB = () => simulateAccount('traditionalIRA', 'B');
  const calculateTraditionalIRASeriesC = () => simulateAccount('traditionalIRA', 'C');
  const calculateRothIRASeriesA = () => simulateAccount('rothIRA', 'A');
  const calculateRothIRASeriesB = () => simulateAccount('rothIRA', 'B');
  const calculateRothIRASeriesC = () => simulateAccount('rothIRA', 'C');

  // Inflation rate used to express future dollars in today's dollars
  // (Assumptions CPI, replaces the old hardcoded 3.5%).
  const inflationRate = assumptions.scalars.cpi_inflation ?? 0.03;
  const calculatePresentValue = (futureValue, yearsFromNow) => discountToToday(futureValue, yearsFromNow, inflationRate);

  // Generate chart data for Roth 401k Balance vs Age
  // Fixed to match its three sibling chart generators (Traditional 401k,
  // Traditional IRA, Roth IRA below): read balances straight from the real
  // accumulation table instead of recomputing them with an independent
  // closed-form formula. The old formula had an extra trailing `(1+r)`
  // factor -- already wrong at year 0 (showed C*(1+r) instead of the
  // table's C), diverging further every subsequent year -- so this chart
  // could disagree with the Roth 401(k) table and withdrawal figures shown
  // elsewhere on this same page. See docs/financial-audit-2026-08-11.md
  // finding #6.
  const generateRoth401kChartData = () => {
    const seriesAData = calculateRoth401kSeriesA();
    const seriesBData = calculateRoth401kSeriesB();
    const seriesCData = calculateRoth401kSeriesC();

    const chartData = [];
    const startAge = retirementPlanningInputs.contributionStartAge || 22;
    const endAge = retirementPlanningInputs.retirementAge || 65;

    for (let age = startAge; age <= endAge; age++) {
      const year = age - startAge;
      const seriesABalance = seriesAData.accumulationData[year]?.accountBalance || 0;
      const seriesBBalance = seriesBData.accumulationData[year]?.accountBalance || 0;
      const seriesCBalance = seriesCData.accumulationData[year]?.accountBalance || 0;

      chartData.push({
        age,
        seriesA: Math.round(seriesABalance),
        seriesB: Math.round(seriesBBalance),
        seriesC: Math.round(seriesCBalance)
      });
    }

    return chartData;
  };

  // Per-scenario "what do I actually get" block: labels make the annual vs.
  // monthly distinction explicit and show the full tie-out from the first
  // annual withdrawal (future dollars) to its present value (today's dollars).
  const renderWithdrawalSummary = (account, series) => {
    const cfg = RETIREMENT_ACCOUNTS[account];
    const sim = simulateAccount(account, series);
    const pct = (x) => `${(x * 100).toFixed(1)}%`;
    const row = (label, note, value, sub) => (
      <div>
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', lineHeight: 1.35 }}>{label}</div>
        <div style={{ fontSize: '11.5px', color: '#9ca3af', marginTop: '1px', lineHeight: 1.35 }}>{note}</div>
        <div style={{ marginTop: '4px', display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px 10px' }}>
          <span style={{ fontSize: '20px', fontWeight: '700', color: '#111827', letterSpacing: '-0.01em' }}>{value}</span>
          {sub && <span style={{ fontSize: '12.5px', color: '#6b7280' }}>{sub}</span>}
        </div>
      </div>
    );
    const taxKey = cfg.taxKey ? `${cfg.taxKey}${series}` : null;
    return (
      <>
        {taxKey && (
          <>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px', marginTop: '12px', fontWeight: '500' }}>{account === 'roth401k' ? 'Tax Rate on Employer-Match Portion (%)' : 'Tax Rate in Retirement (%)'}</div>
            <input
              type="text"
              value={retirementPlanningInputs[taxKey] ? `${retirementPlanningInputs[taxKey]}%` : ''}
              placeholder={`Auto (${pct(sim.firstTaxRate)})`}
              onChange={(e) => handleRetirementPlanningInputChange(taxKey, e.target.value, e.target)}
              style={{ ...styles.input, width: '100%', padding: '12px 16px', fontSize: '15px', fontWeight: '600', textAlign: 'center', marginBottom: '6px', boxSizing: 'border-box', maxWidth: '100%' }}
            />
            <div style={{ fontSize: '11px', color: '#9ca3af', fontStyle: 'italic' }}>Blank = auto (federal + state).</div>
            {retirementPlanningErrors[taxKey] && (
              <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>{retirementPlanningErrors[taxKey]}</div>
            )}
          </>
        )}
        <div style={{ marginTop: '24px', paddingTop: '26px', borderTop: '1px solid #e5e7eb', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {row(`Annual withdrawal at age ${sim.withdrawalStartAge}`, 'pre-tax, future dollars', formatCurrency(sim.firstWithdrawal), `${formatCurrency(sim.firstWithdrawal / 12)} / month`)}
          {cfg.traditional && row('After-tax annual withdrawal', `tax rate ${pct(sim.firstTaxRate)}`, formatCurrency(sim.firstAfterTax), `${formatCurrency(sim.firstAfterTax / 12)} / month`)}
          {account === 'roth401k' && row('After-tax annual withdrawal', `Roth portion tax-free; employer match taxed at ${pct(sim.firstTaxRate)}`, formatCurrency(sim.firstAfterTax), `${formatCurrency(sim.firstAfterTax / 12)} / month`)}
          {!cfg.traditional && account !== 'roth401k' && row('After-tax annual withdrawal', 'Roth: tax-free', formatCurrency(sim.firstAfterTax))}
          <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {row("PV of first withdrawal", "today's dollars", formatCurrency(sim.pvFirstWithdrawal))}
            {account !== 'rothIRA' && row("PV of first after-tax withdrawal", "today's dollars", formatCurrency(sim.pvFirstAfterTax))}
            <div style={{ fontSize: '11.5px', color: '#9ca3af', lineHeight: 1.5 }}>
              PV = {formatCurrency(sim.firstWithdrawal)} ÷ (1 + {(sim.inflation * 100).toFixed(1)}% inflation)<sup>{sim.yearsToWithdrawal}</sup>, discounted over the {sim.yearsToWithdrawal} years from today to the start age.
            </div>
          </div>
        </div>
      </>
    );
  };

  // Generate chart data for Traditional 401k Balance vs Age
  const generateTraditional401kChartData = () => {
    const seriesAData = calculateTraditional401kSeriesA();
    const seriesBData = calculateTraditional401kSeriesB();
    const seriesCData = calculateTraditional401kSeriesC();
    
    const chartData = [];
    const startAge = retirementPlanningInputs.contributionStartAge || 22;
    const endAge = retirementPlanningInputs.retirementAge || 65;
    
    for (let age = startAge; age <= endAge; age++) {
      const year = age - startAge;
      const seriesABalance = seriesAData.accumulationData[year]?.accountBalance || 0;
      const seriesBBalance = seriesBData.accumulationData[year]?.accountBalance || 0;
      const seriesCBalance = seriesCData.accumulationData[year]?.accountBalance || 0;
      
      chartData.push({
        age,
        seriesA: Math.round(seriesABalance),
        seriesB: Math.round(seriesBBalance),
        seriesC: Math.round(seriesCBalance)
      });
    }
    
    return chartData;
  };

  // Annual (pre-tax) withdrawal per age for the three scenarios, from the
  // shared engine, so the chart includes RMD-forced withdrawals. Ages before a
  // scenario's start age (or after it is depleted) plot as 0.
  const generateWithdrawalsChartData = (account) => {
    const sims = ['A', 'B', 'C'].map(series => simulateAccount(account, series));
    const maps = sims.map(sim => new Map(sim.withdrawalData.map(row => [row.age, row.gross])));
    const earliest = Math.min(...sims.map(sim => sim.withdrawalStartAge));
    const chartData = [];
    for (let age = earliest; age <= PROJECTION_END_AGE; age++) {
      chartData.push({
        age,
        seriesA: Math.round(maps[0].get(age) || 0),
        seriesB: Math.round(maps[1].get(age) || 0),
        seriesC: Math.round(maps[2].get(age) || 0),
      });
    }
    return chartData;
  };

  // Generate chart data for Traditional 401k Withdrawals vs Age
  const generateTraditional401kWithdrawalsChartData = () => generateWithdrawalsChartData('traditional401k');

  // Generate chart data for Roth 401k Withdrawals vs Age
  const generateRoth401kWithdrawalsChartData = () => generateWithdrawalsChartData('roth401k');

  // Generate chart data for Traditional IRA Balance vs Age
  const generateTraditionalIRAChartData = () => {
    const seriesAData = calculateTraditionalIRASeriesA();
    const seriesBData = calculateTraditionalIRASeriesB();
    const seriesCData = calculateTraditionalIRASeriesC();
    
    const chartData = [];
    const startAge = retirementPlanningInputs.contributionStartAge || 22;
    const endAge = retirementPlanningInputs.retirementAge || 65;
    
    for (let age = startAge; age <= endAge; age++) {
      const year = age - startAge;
      const seriesABalance = seriesAData.accumulationData[year]?.accountBalance || 0;
      const seriesBBalance = seriesBData.accumulationData[year]?.accountBalance || 0;
      const seriesCBalance = seriesCData.accumulationData[year]?.accountBalance || 0;
      
      chartData.push({
        age,
        seriesA: Math.round(seriesABalance),
        seriesB: Math.round(seriesBBalance),
        seriesC: Math.round(seriesCBalance)
      });
    }
    
    return chartData;
  };

  // Generate chart data for Traditional IRA Withdrawals vs Age
  const generateTraditionalIRAWithdrawalsChartData = () => generateWithdrawalsChartData('traditionalIRA');

  // Generate chart data for Roth IRA Balance vs Age
  const generateRothIRAChartData = () => {
    const seriesAData = calculateRothIRASeriesA();
    const seriesBData = calculateRothIRASeriesB();
    const seriesCData = calculateRothIRASeriesC();
    
    const chartData = [];
    const startAge = retirementPlanningInputs.contributionStartAge || 22;
    const endAge = retirementPlanningInputs.retirementAge || 65;
    
    for (let age = startAge; age <= endAge; age++) {
      const year = age - startAge;
      const seriesABalance = seriesAData.accumulationData[year]?.accountBalance || 0;
      const seriesBBalance = seriesBData.accumulationData[year]?.accountBalance || 0;
      const seriesCBalance = seriesCData.accumulationData[year]?.accountBalance || 0;
      
      chartData.push({
        age,
        seriesA: Math.round(seriesABalance),
        seriesB: Math.round(seriesBBalance),
        seriesC: Math.round(seriesCBalance)
      });
    }
    
    return chartData;
  };

  // Generate chart data for Roth IRA Withdrawals vs Age
  const generateRothIRAWithdrawalsChartData = () => generateWithdrawalsChartData('rothIRA');

  // Helper function to get retirement input from Week 1
  const getRetirementInput = (key) => {
    // Handle traditional retirement accounts from userPreTaxInputs
    if (key === 'retirement_traditional_401k') {
      const val = userPreTaxInputs?.traditional_401k;
      return val === undefined || val === "" ? 0 : Number(val);
    }
    if (key === 'retirement_traditional_ira') {
      const val = userPreTaxInputs?.traditional_ira;
      return val === undefined || val === "" ? 0 : Number(val);
    }
    
    // Handle Roth retirement accounts from retirementInputs
    const val = retirementInputs?.[key];
    return val === undefined || val === "" ? 0 : Number(val);
  };

  // Helper function to handle retirement budget changes
  const handleRetirementBudgetChange = (key, value) => {
    // Remove dollar signs, commas, and other non-numeric characters except decimal point
    const cleanValue = value.replace(/[$,\s]/g, '');
    
    // Clear any existing error for this field
    setValidationErrors(prev => ({
      ...prev,
      [key]: ''
    }));
    
    // Allow empty string (user can clear the field)
    if (cleanValue === '') {
      setRetirementBudgetedAmounts(prev => ({
        ...prev,
        [key]: ''
      }));
      return;
    }
    
    // Convert to number and validate
    const numValue = parseFloat(cleanValue);
    
    // Set different limits based on account type
    // Sourced from the Assumptions table (401k/IRA annual limits / 12)
    // instead of hardcoded monthly figures -- see
    // docs/financial-audit-2026-08-11.md finding #14 (this file, BudgetForm.jsx,
    // and Week12.jsx each had their own disagreeing cap literals).
    let maxValue = assumptions.scalars.limit_401k / 12; // Default for 401(k) plans
    let accountType = '401(k)';
    if (key.includes('ira')) {
      maxValue = assumptions.scalars.limit_ira / 12; // IRA plans have lower limit
      accountType = 'IRA';
    }
    
    // Validate range: 0 <= value <= maxValue
    if (numValue >= 0 && numValue <= maxValue) {
      setRetirementBudgetedAmounts(prev => ({
        ...prev,
        [key]: cleanValue
      }));
    } else if (numValue > maxValue) {
      // Show error message for values exceeding maximum
      setValidationErrors(prev => ({
        ...prev,
        [key]: `${accountType} plan maximum value is ${formatCurrency(maxValue)}. Please enter a smaller value.`
      }));
    } else if (numValue < 0) {
      // Show error message for negative values
      setValidationErrors(prev => ({
        ...prev,
        [key]: 'Value cannot be less than 0. Please enter a positive value.'
      }));
    }
    // If invalid, don't update (keep previous valid value)
  };

  // Helper function to handle monthly payment changes in retirement planning sections
  const handleMonthlyPaymentChange = (key, value) => {
    // Remove dollar signs, commas, and other non-numeric characters except decimal point
    const cleanValue = value.replace(/[$,\s]/g, '');
    const sanitized = cleanValue.replace(/[^0-9.]/g, '');
    
    // Clear any existing error for this field
    setMonthlyPaymentErrors(prev => ({
      ...prev,
      [key]: ''
    }));
    
    // Allow empty string (user can clear the field)
    if (sanitized === '') {
      setMonthlyPayments(prev => ({
        ...prev,
        [key]: ''
      }));
      return;
    }
    
    // Prevent multiple decimals - find first decimal point
    const firstDotIndex = sanitized.indexOf('.');
    let numericValue = '';
    
    if (firstDotIndex === -1) {
      numericValue = sanitized;
    } else {
      const intPart = sanitized.substring(0, firstDotIndex);
      const decPart = sanitized.substring(firstDotIndex + 1).slice(0, 2); // max 2 decimals
      numericValue = intPart + '.' + decPart;
    }
    
    // Allow just a decimal point or partial decimal
    if (sanitized === '.' || (firstDotIndex !== -1 && sanitized.substring(firstDotIndex + 1) === '')) {
      setMonthlyPayments(prev => ({
        ...prev,
        [key]: numericValue
      }));
      return;
    }
    
    // Convert to number and validate
    const numValue = parseFloat(numericValue);
    
    // Set different limits based on account type
    // Sourced from the Assumptions table (401k/IRA annual limits / 12)
    // instead of hardcoded monthly figures -- see
    // docs/financial-audit-2026-08-11.md finding #14 (this file, BudgetForm.jsx,
    // and Week12.jsx each had their own disagreeing cap literals).
    let maxValue = assumptions.scalars.limit_401k / 12; // Default for 401(k) plans
    let accountType = '401(k)';
    if (key.includes('ira')) {
      maxValue = assumptions.scalars.limit_ira / 12; // IRA plans have lower limit
      accountType = 'IRA';
    }
    
    // Validate range: 0 <= value <= maxValue
    if (numValue >= 0 && numValue <= maxValue) {
      setMonthlyPayments(prev => ({
        ...prev,
        [key]: numericValue
      }));
    } else if (numValue > maxValue) {
      // Show error message for values exceeding maximum
      setMonthlyPaymentErrors(prev => ({
        ...prev,
        [key]: `${accountType} plan maximum value is ${formatCurrency(maxValue)}. Please enter a smaller value.`
      }));
    } else if (numValue < 0) {
      // Show error message for negative values
      setMonthlyPaymentErrors(prev => ({
        ...prev,
        [key]: 'Value cannot be less than 0. Please enter a positive value.'
      }));
    }
    // If invalid, don't update (keep previous valid value)
  };

  // Helper function to handle other retirement planning input changes
  const handleRetirementPlanningInputChange = (key, value, inputEl) => {
    // Remove percentage signs, commas, and other non-numeric characters except decimal point
    const cleanValue = value.replace(/[%,\s]/g, '');
    
    // Clear any existing error for this field
    setRetirementPlanningErrors(prev => ({
      ...prev,
      [key]: ''
    }));
    
    // Always allow empty string (user can clear the field)
    if (cleanValue === '') {
      setRetirementPlanningInputs(prev => ({
        ...prev,
        [key]: ''
      }));
      return;
    }
    
    const isAgeField = key === 'contributionStartAge' || key === 'retirementAge';
    const updatedInputs = isAgeField
      ? sanitizeRetirementPlanningInputs({ ...retirementPlanningInputs, [key]: cleanValue })
      : { ...retirementPlanningInputs, [key]: cleanValue };
    const valueToStore = updatedInputs[key];
    const numValue = parseFloat(valueToStore);

    // Keep invalid age values from breaking calculations by storing clamped values
    if (isAgeField) {
      setRetirementPlanningInputs(prev => {
        const next = {
          ...prev,
          contributionStartAge: updatedInputs.contributionStartAge,
          retirementAge: updatedInputs.retirementAge
        };
        return { ...next, ...alignWithdrawalAges(next) };
      });
    } else {
      setRetirementPlanningInputs(prev => ({
        ...prev,
        [key]: valueToStore
      }));
    }

    // Keep cursor before the % (or other suffix) so user can keep typing naturally
    if (inputEl && valueToStore !== '') {
      const pos = String(valueToStore).length;
      requestAnimationFrame(() => {
        if (inputEl && document.activeElement === inputEl) {
          inputEl.setSelectionRange(pos, pos);
        }
      });
    }
    
    // Define validation rules for each input type
    let errorMessage = '';
    
    if (key === 'contributionStartAge') {
      const retirementAge = parseFloat(updatedInputs.retirementAge) || 65;
      // Contribution age should be less than retirement age (not equal)
      const maxContributionAge = Math.min(retirementAge, 100);
      if (numValue >= maxContributionAge) {
        errorMessage = `Contribution Start Age must be less than ${maxContributionAge} years.`;
      }
    } else if (key === 'retirementAge') {
      const contributionAge = parseFloat(updatedInputs.contributionStartAge) || 22;
      // Retirement age should always be max 100, and min should be 30 (exclusive)
      const minRetirementAge = Math.max(contributionAge, 30);
      if (numValue <= minRetirementAge || numValue > 100) {
        errorMessage = `Retirement Age must be between ${minRetirementAge + 1} and 100 years.`;
      }
    } else if (key === 'annualReturnRate') {
      if (numValue < 0 || numValue > 20) {
        errorMessage = 'Annual Rate of Return must be between 0% and 20%.';
      }
    } else if (key === 'employerMatch401k' || key === 'employerMatchIRA') {
      if (numValue < 0 || numValue > 100) {
        errorMessage = 'Employer Match must be between 0% and 100%.';
      }
    } else if (key === 'traditional401kWithdrawalRateA' || key === 'traditional401kWithdrawalRateB' || key === 'traditional401kWithdrawalRateC' ||
               key === 'roth401kWithdrawalRateA' || key === 'roth401kWithdrawalRateB' || key === 'roth401kWithdrawalRateC' ||
               key === 'traditionalIRAWithdrawalRateA' || key === 'traditionalIRAWithdrawalRateB' || key === 'traditionalIRAWithdrawalRateC' ||
               key === 'rothIRAWithdrawalRateA' || key === 'rothIRAWithdrawalRateB' || key === 'rothIRAWithdrawalRateC') {
      if (numValue < 0 || numValue > 100) {
        errorMessage = 'Withdrawal Rate must be between 0% and 100%.';
      }
    } else if (key === 'traditional401kAgeA' || key === 'traditional401kAgeB' || key === 'traditional401kAgeC' ||
               key === 'roth401kAgeA' || key === 'roth401kAgeB' || key === 'roth401kAgeC' ||
               key === 'traditionalIRAAgeA' || key === 'traditionalIRAAgeB' || key === 'traditionalIRAAgeC' ||
               key === 'rothIRAAgeA' || key === 'rothIRAAgeB' || key === 'rothIRAAgeC') {
      // Distributions can't start before contributions stop (retirement age).
      // Traditional accounts can't defer past the RMD start age; Roth accounts
      // are capped at 100.
      const minStartAge = parseFloat(updatedInputs.retirementAge) || 65;
      const isTraditionalKey = key.startsWith('traditional');
      const maxStartAge = isTraditionalKey
        ? rmdStartAge
        : 100;
      if (numValue < minStartAge || numValue > maxStartAge) {
        errorMessage = `Starting Distribution Age must be between ${minStartAge} (your retirement age) and ${maxStartAge} years.`;
      }
    } else if (key.endsWith('TaxRateA') || key.endsWith('TaxRateB') || key.endsWith('TaxRateC')) {
      if (numValue < 0 || numValue > 100) {
        errorMessage = 'Tax Rate must be between 0% and 100%.';
      }
    } else if (key === 'rmdAge') {
      // No validation limits for RMD age
    }
    
    // Show error message if validation fails
    if (errorMessage) {
      setRetirementPlanningErrors(prev => ({
        ...prev,
        [key]: errorMessage
      }));
    }
  };

  // Calculate recommended Roth 401(k) amount using Week 1 logic (suggested after-tax income)
  const calculateRecommendedRoth401k = () => {
    if (monthlySuggestedAfterTaxIncome <= 0) return 0;
    // 5% of monthly after-tax income, capped at the monthly 401(k) limit
    // (Assumptions table, annual limit / 12) -- was hardcoded to 1958.33
    // (the old 2025 limit / 12), disagreeing with BudgetForm.jsx/Week12.jsx.
    const monthly401kLimit = assumptions.scalars.limit_401k / 12;
    return Math.min(monthlySuggestedAfterTaxIncome * 0.05, monthly401kLimit);
  };

  // Calculate recommended Roth IRA amount using Week 1 logic (suggested after-tax income)
  const calculateRecommendedRothIRA = () => {
    if (monthlySuggestedAfterTaxIncome <= 0) return 0;
    // Only contribute to Roth IRA if Roth 401k is at its maximum
    const monthly401kLimit = assumptions.scalars.limit_401k / 12;
    const monthlyIraLimit = assumptions.scalars.limit_ira / 12;
    const roth401kAmount = Math.min(monthlySuggestedAfterTaxIncome * 0.05, monthly401kLimit);
    if (roth401kAmount === monthly401kLimit) {
      // Calculate Roth 401k percentage first
      const roth401kPercent = roth401kAmount / monthlySuggestedAfterTaxIncome;
      // Then calculate Roth IRA: 5% total - Roth 401k percentage, capped at the monthly IRA limit
      return Math.min(monthlySuggestedAfterTaxIncome * (0.05 - roth401kPercent), monthlyIraLimit);
    }
    return 0;
  };

  // Calculate deferral amount based on percentage
  const calculateDeferralAmount = () => {
    const percentage = parseFloat(deferralPercentage) || 0;
    return monthlyPreTaxIncome * (percentage / 100);
  };

  // Calculate totals for the table
  const totalUserInput = Object.values({
    traditional_401k: getRetirementInput('retirement_traditional_401k'),
    roth_401k: getRetirementInput('retirement_roth_401k'),
    traditional_ira: getRetirementInput('retirement_traditional_ira'),
    roth_ira: getRetirementInput('retirement_roth_ira')
  }).reduce((sum, val) => sum + val, 0);

  const totalBudgetedAmount = Object.entries(retirementBudgetedAmounts).reduce((sum, [key, val]) => {
    // Only include valid values (no errors) in total calculation
    if (validationErrors[key]) {
      return sum; // Skip invalid values
    }
    const value = parseFloat(val) || getDefaultBudgetedAmount(key);
    return sum + value;
  }, 0);

  const totalRecommendedAmount = calculateRecommendedRoth401k() + calculateRecommendedRothIRA();

  const totalRecommendedPercent = monthlyPreTaxIncome > 0 ? (totalRecommendedAmount / monthlyPreTaxIncome) * 100 : 0;

  // Simulations
  // formatCurrency/formatPercent now come from src/utils/formatters.js (module import above).


  return (
    <>
      <style>{`
        .week6-retirement-page input,
        .week6-retirement-page table tbody tr,
        .week6-main-surface > div[style*="box-shadow"] {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .week6-main-surface > div[style*="box-shadow"]:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 34px rgba(15, 23, 42, 0.12), 0 6px 18px rgba(15, 23, 42, 0.08) !important;
          border-color: rgba(148, 163, 184, 0.45) !important;
        }
        .week6-retirement-page .week6-info-surface:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(13, 26, 75, 0.12);
          border-color: rgba(13, 26, 75, 0.25) !important;
          background-color: rgba(13, 26, 75, 0.08) !important;
        }
        .week6-retirement-page input:hover:not(:focus) {
          border-color: #9ca3af !important;
          background-color: #ffffff !important;
          box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03) !important;
          transform: translateY(-2px) scale(1.01) !important;
        }
        .week6-retirement-page input:focus {
          border-color: #0d1a4b !important;
          background-color: #fffef0 !important;
          box-shadow: 0 0 0 3px rgba(13, 26, 75, 0.12) !important;
          transform: translateY(-1px) scale(1.01) !important;
          outline: none;
        }
        .week6-retirement-page table tbody tr:hover {
          transform: translateY(-1px);
        }
        @media (prefers-reduced-motion: reduce) {
          .week6-retirement-page input,
          .week6-retirement-page table tbody tr,
          .week6-main-surface > div[style*="box-shadow"] {
            transition: none !important;
            transform: none !important;
          }
        }
      `}</style>
      {/* Modern info alert for editable fields - guaranteed right top corner */}
      {/* Modern info alert for editable fields - guaranteed right top corner */}
      <div style={{
        position: 'fixed',
        top: '24px',
        right: '32px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(2px)',
        border: '1px solid rgba(13, 26, 75, 0.15)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        borderRadius: '14px',
        padding: '12px 20px',
        color: '#0d1a4b',
        fontWeight: 500,
        fontSize: 12
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d1a4b" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01"/></svg>
        You can only enter data in the open (yellow) fields.
      </div>

      <TermTipHost ref={termTipRef} />

      {/* "Deferral" quick-definition tooltip */}
      {showDeferralTooltip && (
        <div style={{
          ...styles.deferralTooltip,
          left: `${deferralTooltipPosition.x}px`,
          top: `${deferralTooltipPosition.y - 60}px`,
        }}>
          <div style={{
            position: 'absolute',
            bottom: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '8px solid rgba(13, 26, 75, 0.97)',
          }} />
          <div style={{ lineHeight: '1.4', fontSize: '12px' }}>
            <strong>Deferral</strong>: income you redirect into a retirement account instead of taking as cash today.
          </div>
        </div>
      )}

      <div style={styles.container} className="week6-retirement-page">
        <div style={styles.sectionContainer} className="week6-main-surface">
            {/* Enhanced Header */}
        <div style={styles.enhancedHeader}>
              <span style={{ fontSize: '26px', letterSpacing: '-0.02em' }}>Retirement Planning</span>
            </div>


        {/* Tab bar: Summary + one tab per retirement account type, replacing
            the old single long scrolling page. */}
        <nav style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          borderBottom: '2px solid #e0e0e0',
          marginBottom: '28px',
        }}>
          {[
            { id: 'summary', label: 'Summary' },
            { id: '401k', label: 'Traditional 401(k)' },
            { id: 'roth401k', label: 'Roth 401(k)' },
            { id: 'tradira', label: 'Traditional IRA' },
            { id: 'rothira', label: 'Roth IRA' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 20px',
                fontSize: '15px',
                fontWeight: '700',
                color: activeTab === tab.id ? '#002060' : '#6b7280',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '4px solid #002060' : '4px solid transparent',
                marginBottom: '-2px',
                cursor: 'pointer',
                transition: 'color 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Summary tab: Income Summary + Retirement Account Budgeting +
            Monthly Deferral Calculator (sections 1-3). */}
        {activeTab === 'summary' && (<>
        {/* 1. Income Summary */}
          <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.08)',
          marginBottom: '24px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          <div style={{
            fontSize: '15px',
            fontWeight: '600',
            color: '#0d1a4b',
            marginBottom: '16px',
            textAlign: 'center',
            letterSpacing: '-0.01em',
          }}>
            Income Summary
          </div>
          <div style={{
            display: 'flex',
            gap: '24px',
            justifyContent: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap'
          }}>
            <div style={{
              backgroundColor: 'rgba(240, 253, 244, 0.8)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              padding: '16px 20px',
              borderRadius: '12px',
              border: '2px solid rgba(134, 239, 172, 0.5)',
              textAlign: 'center',
              minWidth: '200px',
              boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.05)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px 0 rgba(0, 0, 0, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px 0 rgba(0, 0, 0, 0.05)';
            }}
            >
              <div style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#0d1a4b',
                marginBottom: '8px'
              }}>
                Monthly Pre-Tax Income
              </div>
              <div style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#0d1a4b'
              }}>
                {formatCurrency(monthlyPreTaxIncome)}
              </div>
            </div>
            <div style={{
              backgroundColor: 'rgba(240, 253, 244, 0.8)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              padding: '16px 20px',
              borderRadius: '12px',
              border: '2px solid rgba(134, 239, 172, 0.5)',
              textAlign: 'center',
              minWidth: '200px',
              boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.05)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px 0 rgba(0, 0, 0, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px 0 rgba(0, 0, 0, 0.05)';
            }}
            >
              <div style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#0d1a4b',
                marginBottom: '8px'
              }}>
                Monthly After-Tax Income
              </div>
              <div style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#0d1a4b'
              }}>
                {formatCurrency(monthlyUserAfterTaxIncome)}
              </div>
            </div>
          </div>
        </div>

        {/* 1.5. Account Types at a Glance -- replaces the small gray
            paragraph that used to sit cramped under each account name in
            the budgeting table below (hard to read at 12px in a narrow
            column). Same info, laid out as a real comparison table. */}
        <div style={{
          ...styles.sectionContainer,
          maxWidth: '1100px',
          padding: '32px'
        }}>
          <div style={{
            fontSize: '15px',
            fontWeight: '600',
            color: '#0d1a4b',
            marginBottom: '20px',
            textAlign: 'center',
            letterSpacing: '-0.01em',
          }}>
            Account Types at a Glance
          </div>
          <div style={{ overflowX: 'auto', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
            <table style={{ ...styles.table, width: '100%', minWidth: '700px', maxWidth: '100%', boxSizing: 'border-box' }}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, textAlign: 'left' }}>Account Type</th>
                  <th style={styles.th}>Tax Treatment</th>
                  <th style={styles.th}>Sponsor</th>
                  <th style={styles.th}>Annual Limit</th>
                  <th style={styles.th}>Withdrawal Taxation</th>
                  <th style={styles.th}>Employer Match</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Traditional 401(k)', tax: 'Pre-tax', sponsor: 'Employer-sponsored', limit: formatCurrency(assumptions.scalars.limit_401k, { decimals: 0 }), withdrawalTax: 'Taxed at withdrawal', match: 'Available' },
                  { name: 'Roth 401(k)', tax: 'Post-tax', sponsor: 'Employer-sponsored', limit: formatCurrency(assumptions.scalars.limit_401k, { decimals: 0 }), withdrawalTax: 'Tax-free at withdrawal', match: 'Common (into pre-tax 401(k))' },
                  { name: 'Traditional IRA', tax: 'Pre-tax', sponsor: 'Individual', limit: `${formatCurrency(assumptions.scalars.limit_ira, { decimals: 0 })}`, withdrawalTax: 'Taxed at withdrawal', match: 'None' },
                  { name: 'Roth IRA', tax: 'Post-tax', sponsor: 'Individual', limit: `${formatCurrency(assumptions.scalars.limit_ira, { decimals: 0 })}`, withdrawalTax: 'Tax-free at withdrawal', match: 'None' },
                ].map((row) => (
                  <tr key={row.name}>
                    <td style={{ ...styles.td, textAlign: 'left', fontWeight: '600' }}>{row.name}</td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>{row.tax}</td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>{row.sponsor}</td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>{row.limit}</td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>{row.withdrawalTax}</td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>{row.match}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Retirement Account Budgeting Table */}
        <div style={{
          ...styles.sectionContainer,
          maxWidth: '1100px',
          padding: '32px'
        }}>
          <div style={{
            fontSize: '15px',
            fontWeight: '600',
            color: '#0d1a4b',
            marginBottom: '20px',
            textAlign: 'center',
            letterSpacing: '-0.01em',
          }}>
            Retirement Account Budgeting
          </div>
          <div style={{ 
            overflowX: 'auto', 
            width: '100%', 
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}>
          <table style={{
            ...styles.table,
            width: '100%',
            minWidth: '700px',
            maxWidth: '100%',
            boxSizing: 'border-box',
            tableLayout: 'auto'
          }}>
          <thead>
            <tr>
                <th style={{
                  ...styles.th,
                  textAlign: 'left',
                  width: '22%',
                  minWidth: '140px'
                }}>
                  Account Type
                </th>
                <th style={{
                  ...styles.th,
                  width: '18%',
                  minWidth: '120px'
                }}>
                  User Input in Week 1 Budget
                </th>
                <th style={{
                  ...styles.th,
                  width: '20%',
                  minWidth: '140px'
                }}>
                  Budgeted Amount Spent
                </th>
                <th style={{
                  ...styles.th,
                  width: '20%',
                  minWidth: '140px'
                }}>
                  Recommended Amount Spent
                </th>
                <th style={{
                  ...styles.th,
                  width: '20%',
                  minWidth: '120px'
                }}>
                  Recommended %
                </th>
            </tr>
          </thead>
          <tbody>
              {/* Traditional 401(k) */}
                <tr>
                  <td style={{
                    ...styles.td,
                  textAlign: 'left',
                  verticalAlign: 'top',
                  padding: '16px 12px'
                }}>
                  <div style={{
                    fontWeight: '600',
                    fontSize: '14px',
                  }}>
                    Traditional 401(k)
                  </div>
                  </td>
                <td style={styles.td}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    {formatCurrency(getRetirementInput('retirement_traditional_401k'))}
                  </div>
                </td>
                <td style={styles.td}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    textAlign: 'center'
                  }}>
                    {formatCurrency(parseFloat(retirementBudgetedAmounts.traditional_401k) || getDefaultBudgetedAmount('traditional_401k'))}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#888',
                    marginTop: '4px',
                    textAlign: 'center'
                  }}>
                    {(() => {
                    const amount = parseFloat(retirementBudgetedAmounts.traditional_401k) || getDefaultBudgetedAmount('traditional_401k');
                    return `${((amount / monthlyPreTaxIncome) * 100).toFixed(1)}% of Gross Monthly Income`;
                  })()}
                  </div>
                  </td>
                <td style={styles.td}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#666'
                  }}>
                    -
                  </div>
                </td>
                <td style={styles.td}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#666'
                  }}>
                    0.00%
                  </div>
                </td>
                </tr>

            {/* Roth 401(k) */}
            <tr>
              <td style={{...styles.td, textAlign: 'left', verticalAlign: 'top', padding: '16px 12px'}}>
                <div style={{fontWeight: '600', fontSize: '14px'}}>
                  Roth 401(k)
                </div>
              </td>
              <td style={styles.td}>
                <div style={{fontSize: '14px', fontWeight: '600'}}>
                  {formatCurrency(getRetirementInput('retirement_roth_401k'))}
                </div>
              </td>
              <td style={styles.td}>
                <div style={{fontSize: '14px', fontWeight: '700', textAlign: 'center'}}>
                  {formatCurrency(parseFloat(retirementBudgetedAmounts.roth_401k) || getDefaultBudgetedAmount('roth_401k'))}
                </div>
                <div style={{fontSize: '11px', color: '#888', marginTop: '4px', textAlign: 'center'}}>
                  {(() => {
                  const amount = parseFloat(retirementBudgetedAmounts.roth_401k) || getDefaultBudgetedAmount('roth_401k');
                  return `${((amount / monthlyPreTaxIncome) * 100).toFixed(1)}% of Gross Monthly Income`;
                })()}
                </div>
              </td>
              <td style={styles.td}>
                <div style={{fontSize: '14px', fontWeight: '600', color: '#666'}}>
                  {formatCurrency(calculateRecommendedRoth401k())}
                </div>
              </td>
              <td style={styles.td}>
                <div style={{fontSize: '14px', fontWeight: '600', color: '#666'}}>
                  {monthlyPreTaxIncome > 0 ? ((calculateRecommendedRoth401k() / monthlyPreTaxIncome) * 100).toFixed(2) : '0.00'}%
                </div>
              </td>
            </tr>

            {/* Traditional IRA */}
            <tr>
              <td style={{...styles.td, textAlign: 'left', verticalAlign: 'top', padding: '16px 12px'}}>
                <div style={{fontWeight: '600', fontSize: '14px'}}>
                  Traditional IRA
                </div>
              </td>
              <td style={styles.td}>
                <div style={{fontSize: '14px', fontWeight: '600'}}>
                  {formatCurrency(getRetirementInput('retirement_traditional_ira'))}
              </div>
              </td>
              <td style={styles.td}>
                <div style={{fontSize: '14px', fontWeight: '700', textAlign: 'center'}}>
                  {formatCurrency(parseFloat(retirementBudgetedAmounts.traditional_ira) || getDefaultBudgetedAmount('traditional_ira'))}
                </div>
                <div style={{fontSize: '11px', color: '#888', marginTop: '4px', textAlign: 'center'}}>
                  {(() => {
                  const amount = parseFloat(retirementBudgetedAmounts.traditional_ira) || getDefaultBudgetedAmount('traditional_ira');
                  return `${((amount / monthlyPreTaxIncome) * 100).toFixed(1)}% of Gross Monthly Income`;
                })()}
                </div>
              </td>
              <td style={styles.td}>
                <div style={{fontSize: '14px', fontWeight: '600', color: '#666'}}>-</div>
              </td>
              <td style={styles.td}>
                <div style={{fontSize: '14px', fontWeight: '600', color: '#666'}}>0.00%</div>
              </td>
            </tr>

            {/* Roth IRA */}
            <tr>
              <td style={{...styles.td, textAlign: 'left', verticalAlign: 'top', padding: '16px 12px'}}>
                <div style={{fontWeight: '600', fontSize: '14px'}}>
                  Roth IRA
                </div>
              </td>
              <td style={styles.td}>
                <div style={{fontSize: '14px', fontWeight: '600'}}>
                  {formatCurrency(getRetirementInput('retirement_roth_ira'))}
              </div>
              </td>
              <td style={styles.td}>
                <div style={{fontSize: '14px', fontWeight: '700', textAlign: 'center'}}>
                  {formatCurrency(parseFloat(retirementBudgetedAmounts.roth_ira) || getDefaultBudgetedAmount('roth_ira'))}
                </div>
                <div style={{fontSize: '11px', color: '#888', marginTop: '4px', textAlign: 'center'}}>
                  {(() => {
                  const amount = parseFloat(retirementBudgetedAmounts.roth_ira) || getDefaultBudgetedAmount('roth_ira');
                  return `${((amount / monthlyPreTaxIncome) * 100).toFixed(1)}% of Gross Monthly Income`;
                })()}
                </div>
                  </td>
              <td style={styles.td}>
                <div style={{fontSize: '14px', fontWeight: '600', color: '#666'}}>
                  {formatCurrency(calculateRecommendedRothIRA())}
              </div>
              </td>
              <td style={styles.td}>
                <div style={{fontSize: '14px', fontWeight: '600', color: '#666'}}>
                  {monthlyPreTaxIncome > 0 ? ((calculateRecommendedRothIRA() / monthlyPreTaxIncome) * 100).toFixed(2) : '0.00'}%
              </div>
              </td>
                </tr>

            {/* Total Row */}
            <tr style={{background: 'linear-gradient(135deg, rgba(13, 26, 75, 0.95) 0%, rgba(30, 58, 138, 0.9) 100%)'}}>
              <td style={{...styles.td, background: 'linear-gradient(135deg, rgba(13, 26, 75, 0.95) 0%, rgba(30, 58, 138, 0.9) 100%)', color: '#fff', fontWeight: '700', fontSize: '14px'}}>
                <b>Total</b>
              </td>
              <td style={{...styles.td, background: 'linear-gradient(135deg, rgba(13, 26, 75, 0.95) 0%, rgba(30, 58, 138, 0.9) 100%)', color: '#fff', fontWeight: '700', fontSize: '14px'}}>
                {formatCurrency(totalUserInput)}
              </td>
              <td style={{...styles.td, background: 'linear-gradient(135deg, rgba(13, 26, 75, 0.95) 0%, rgba(30, 58, 138, 0.9) 100%)', color: '#fff', fontWeight: '700', fontSize: '14px'}}>
                {formatCurrency(totalBudgetedAmount)}
              </td>
              <td style={{...styles.td, background: 'linear-gradient(135deg, rgba(13, 26, 75, 0.95) 0%, rgba(30, 58, 138, 0.9) 100%)', color: '#fff', fontWeight: '700', fontSize: '14px'}}>
                {formatCurrency(totalRecommendedAmount)}
              </td>
              <td style={{...styles.td, background: 'linear-gradient(135deg, rgba(13, 26, 75, 0.95) 0%, rgba(30, 58, 138, 0.9) 100%)', color: '#fff', fontWeight: '700', fontSize: '14px'}}>
                {totalRecommendedPercent.toFixed(2)}%
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>

        {/* 3. Monthly Deferral Calculator */}
        <div style={{
          ...styles.sectionContainer,
          maxWidth: '600px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <div style={{
            fontSize: '15px',
            fontWeight: '600',
            color: '#0d1a4b',
            marginBottom: '20px',
            textAlign: 'center',
            letterSpacing: '-0.01em',
          }}>
            Monthly{' '}
            <span
              style={{ textDecoration: 'underline dotted', textUnderlineOffset: '3px', cursor: 'help' }}
              onMouseEnter={(e) => {
                setShowDeferralTooltip(true);
                setDeferralTooltipPosition({ x: e.clientX, y: e.clientY });
              }}
              onMouseMove={(e) => setDeferralTooltipPosition({ x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setShowDeferralTooltip(false)}
            >
              Deferral
            </span>{' '}
            Calculator
              </div>
          <div style={{
            marginBottom: '12px',
            fontSize: '14px',
            color: '#666',
            textAlign: 'center'
          }}>
            Retirement contribution based on % of monthly gross income
              </div>
          <div style={{ 
            overflowX: 'auto', 
            width: '100%', 
            maxWidth: '100%', 
            display: 'flex', 
            justifyContent: 'center',
            boxSizing: 'border-box'
          }}>
          <table style={{
            ...styles.table,
            width: '100%',
            maxWidth: '350px',
            margin: '0 auto',
            boxSizing: 'border-box',
            tableLayout: 'auto'
          }}>
            <thead>
              <tr>
                <th style={styles.th}>Deferral %</th>
                <th style={styles.th}>Deferral $</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={styles.td}>
                  <input
                    type="text"
                    min="0"
                    max="100"
                    step="0.1"
                    value={deferralPercentage === '' ? '' : (typeof deferralPercentage === 'string' ? deferralPercentage + '%' : `${deferralPercentage}%`)}
                    onChange={e => {
                      let cleanValue = e.target.value.replace(/[%,\s]/g, '');
                      cleanValue = cleanValue.replace(/^\./, '').replace(/(\..*)\./g, '$1');
                      const numValue = parseFloat(cleanValue);
                      const isEmpty = cleanValue === '';
                      const isValid = !isNaN(numValue) && numValue >= 0 && numValue <= 100;
                      const endsWithDot = cleanValue.endsWith('.');
                      if (isEmpty) {
                        setDeferralPercentage('');
                      } else if (endsWithDot && numValue >= 0 && numValue <= 100) {
                        setDeferralPercentage(cleanValue);
                      } else if (isValid) {
                        setDeferralPercentage(numValue);
                      }
                      const inputEl = e.target;
                      const pos = cleanValue.length;
                      requestAnimationFrame(() => {
                        if (inputEl && document.activeElement === inputEl) {
                          inputEl.setSelectionRange(pos, pos);
                        }
                      });
                    }}
                    style={{
                      ...styles.input,
                      backgroundColor: '#fffde7',
                      fontWeight: '700',
                      textAlign: 'center'
                    }}
                    placeholder="5%"
                    onMouseEnter={(e) => {
                      if (document.activeElement !== e.target) {
                        e.target.style.borderColor = '#9ca3af';
                        e.target.style.backgroundColor = '#ffffff';
                        e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                        e.target.style.transform = 'translateY(-2px) scale(1.01)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (document.activeElement !== e.target) {
                        e.target.style.borderColor = '#d1d5db';
                        e.target.style.backgroundColor = '#fffde7';
                        e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                        e.target.style.transform = 'scale(1)';
                      }
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0d1a4b';
                      e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                      e.target.style.backgroundColor = '#fffef0';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.transform = 'scale(1)';
                    }}
                  />
                </td>
                <td style={styles.td}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#002060'
                  }}>
                    {formatCurrency(calculateDeferralAmount())}
              </div>
                </td>
              </tr>
            </tbody>
          </table>
          </div>
              </div>
        </>)}

        {/* 401(k) tab */}
        {activeTab === '401k' && (<>
        {/* 5. Traditional 401(k) Balance and Withdrawals */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '32px',
          marginBottom: '40px',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}>
          {/* Traditional 401(k) Balance */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1), 0 4px 16px 0 rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(229, 231, 235, 0.8)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            boxSizing: 'border-box',
            minWidth: 0,
            width: '100%',
            maxWidth: '100%',
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(13, 26, 75, 0.98) 0%, rgba(30, 58, 138, 0.95) 100%)',
              color: 'white',
              padding: '18px 24px',
              borderRadius: '12px',
              marginBottom: '24px',
              fontSize: '16px',
              fontWeight: '700',
              textAlign: 'center',
              letterSpacing: '-0.02em',
              boxShadow: '0 4px 12px 0 rgba(13, 26, 75, 0.25)',
            }}>
              Traditional 401(k) Balance
              </div>

            {/* Description */}
            <div style={{
              fontSize: '13px',
              color: '#4b5563',
              marginBottom: '24px',
              lineHeight: '1.6',
              padding: '14px 18px',
              backgroundColor: 'rgba(249, 250, 251, 0.8)',
              borderRadius: '10px',
              border: '1px solid rgba(229, 231, 235, 0.6)',
            }}>
              Pre-tax. {formatCurrency(assumptions.scalars.limit_401k, { decimals: 0 })} limit. Taxed at withdrawal. Employer match.
              </div>

            {/* Key Parameters */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.6)',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>Contribution Start Age</div>
                <input
                  type="number"
                  value={retirementPlanningInputs.contributionStartAge || ''}
                  onChange={(e) => handleRetirementPlanningInputChange('contributionStartAge', e.target.value)}
                  min="0"
                  max="100"
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'right',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {retirementPlanningErrors.contributionStartAge && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.contributionStartAge}
            </div>
                )}
            </div>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.6)',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>Retirement Age</div>
                <input
                  type="number"
                  value={retirementPlanningInputs.retirementAge || ''}
                  onChange={(e) => handleRetirementPlanningInputChange('retirementAge', e.target.value)}
                  min={retirementPlanningInputs.retirementAge || 65}
                  max="100"
                  style={{
                    ...styles.readOnly,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'right',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  readOnly
                />
                {retirementPlanningErrors.retirementAge && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.retirementAge}
            </div>
                )}
          </div>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.6)',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>Annual Rate of Return (%)</div>
                <input
                  type="text"
                  value={retirementPlanningInputs.annualReturnRate ? `${retirementPlanningInputs.annualReturnRate}%` : ''}
                  onChange={(e) => handleRetirementPlanningInputChange('annualReturnRate', e.target.value, e.target)}
                  min="0"
                  max="20"
                  step="0.1"
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'right',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {retirementPlanningErrors.annualReturnRate && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.annualReturnRate}
              </div>
                )}
              </div>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.6)',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>Employer Match (% of your contribution)</div>
                <input
                  type="text"
                  value={retirementPlanningInputs.employerMatch401k ? `${retirementPlanningInputs.employerMatch401k}%` : ''}
                  onChange={(e) => handleRetirementPlanningInputChange('employerMatch401k', e.target.value, e.target)}
                  min="0"
                  max="100"
                  step="0.1"
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'right',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {retirementPlanningErrors.employerMatch401k && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.employerMatch401k}
              </div>
                )}
            </div>
          </div>

            {/* Scenarios */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '28px',
              marginBottom: '56px',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '28px 26px',
                borderRadius: '12px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
                textAlign: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                boxSizing: 'border-box',
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px 0 rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(13, 26, 75, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(229, 231, 235, 0.8)';
              }}
              >
                <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#0d1a4b', letterSpacing: '0.3px' }}>Scenario A</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px', fontWeight: '500' }}>Monthly Payment</div>
                <input
                  type="text"
                  value={monthlyPayments.traditional_401k_a !== '' && monthlyPayments.traditional_401k_a != null ? `${formatCurrency(monthlyPayments.traditional_401k_a)}` : ''}
                  onChange={(e) => handleMonthlyPaymentChange('traditional_401k_a', e.target.value)}
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '10px',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {monthlyPaymentErrors.traditional_401k_a && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {monthlyPaymentErrors.traditional_401k_a}
        </div>
                )}
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '10px', fontWeight: '500' }}>{calculatePercentageOfPreTaxIncome(monthlyPayments.traditional_401k_a).toFixed(2)}% of Monthly Pre-Tax Income</div>
      </div>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '28px 26px',
                borderRadius: '12px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
                textAlign: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                boxSizing: 'border-box',
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px 0 rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(13, 26, 75, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(229, 231, 235, 0.8)';
              }}
              >
                <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#0d1a4b', letterSpacing: '0.3px' }}>Scenario B</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px', fontWeight: '500' }}>Monthly Payment</div>
                <input
                  type="text"
                  value={monthlyPayments.traditional_401k_b !== '' && monthlyPayments.traditional_401k_b != null ? `${formatCurrency(monthlyPayments.traditional_401k_b)}` : ''}
                  onChange={(e) => handleMonthlyPaymentChange('traditional_401k_b', e.target.value)}
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '10px',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {monthlyPaymentErrors.traditional_401k_b && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {monthlyPaymentErrors.traditional_401k_b}
              </div>
                )}
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '10px', fontWeight: '500' }}>{calculatePercentageOfPreTaxIncome(monthlyPayments.traditional_401k_b).toFixed(2)}% of Monthly Pre-Tax Income</div>
              </div>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '28px 26px',
                borderRadius: '12px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
                textAlign: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                boxSizing: 'border-box',
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px 0 rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(13, 26, 75, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(229, 231, 235, 0.8)';
              }}
              >
                <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#0d1a4b', letterSpacing: '0.3px' }}>Scenario C</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px', fontWeight: '500' }}>Monthly Payment</div>
                <input
                  type="text"
                  value={monthlyPayments.traditional_401k_c !== '' && monthlyPayments.traditional_401k_c != null ? `${formatCurrency(monthlyPayments.traditional_401k_c)}` : ''}
                  onChange={(e) => handleMonthlyPaymentChange('traditional_401k_c', e.target.value)}
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '10px',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {monthlyPaymentErrors.traditional_401k_c && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {monthlyPaymentErrors.traditional_401k_c}
            </div>
                )}
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '10px', fontWeight: '500' }}>{calculatePercentageOfPreTaxIncome(monthlyPayments.traditional_401k_c).toFixed(2)}% of Monthly Pre-Tax Income</div>
              </div>
              </div>

            {/* Dynamic Chart */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: 'none',
              borderRadius: '14px',
              padding: '28px',
              marginBottom: '24px',
              minHeight: '620px',
              boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.06)',
            }}>
              <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', textAlign: 'center', color: '#111827', letterSpacing: '-0.02em' }}>
                Traditional 401(k) Balance vs. Age Chart
              </div>
              {(() => {
                const chartData = generateTraditional401kChartData();
                const maxValue = niceAxisMax(Math.max(...chartData.map(d => Math.max(d.seriesA, d.seriesB, d.seriesC))));
                
                // Dynamic Y-axis values based on max value
                const getYAxisValues = (max) => niceAxisTicks(max);
                
                const yAxisValues = getYAxisValues(maxValue);
                const chartWidth = 1100;
                const chartHeight = 520;
                const padding = 24;
                const bottomPad = 72; // room under the plot for tick labels + the "Age" axis title
                const yAxisLabelWidth = 150; // gutter for the rotated y-axis title + whole-dollar tick labels
                const plotWidth = chartWidth - padding - yAxisLabelWidth;
                const plotHeight = chartHeight - padding - bottomPad;
                
                return (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', maxWidth: chartWidth, height: 'auto', overflow: 'visible' }}>
                      {/* Y-axis value labels (horizontal grid lines removed) */}
                      {yAxisValues.map((value, i) => {
                        const ratio = value / maxValue;
                        return (
                          <g key={i}>
                            <text
                              x={yAxisLabelWidth - 12}
                              y={padding + plotHeight * (1 - ratio) + 6}
                              fontSize="16" fontWeight="500"
                              fill="#000000"
                              textAnchor="end"
                            >
                              {formatCurrency(Math.round(value), { decimals: 0 })}
                            </text>
                          </g>
                        );
                      })}
                      
                      {/* Axis lines (line charts only, per house spec) */}
                      <line x1={yAxisLabelWidth} y1={padding} x2={yAxisLabelWidth} y2={padding + plotHeight} stroke="#000000" strokeWidth="1" />
                      <line x1={yAxisLabelWidth} y1={padding + plotHeight} x2={chartWidth} y2={padding + plotHeight} stroke="#000000" strokeWidth="1" />
                      {/* Axis titles */}
                      <text x={yAxisLabelWidth + plotWidth / 2} y={chartHeight - 10} fontSize="17" fontWeight="700" fill="#000000" textAnchor="middle">Age</text>
                      <text transform={`translate(20 ${padding + plotHeight / 2}) rotate(-90)`} fontSize="17" fontWeight="700" fill="#000000" textAnchor="middle">Account Balance</text>

                      {/* Age labels */}
                      {chartData.filter((_, i) => i % 5 === 0).map((d, i) => (
                        <text
                          key={i}
                          x={yAxisLabelWidth + (plotWidth / (chartData.length - 1)) * (chartData.findIndex(item => item.age === d.age))}
                          y={chartHeight - bottomPad + 28}
                          fontSize="16" fontWeight="500"
                          fill="#000000"
                          textAnchor="middle"
                        >
                          {d.age}
                        </text>
                      ))}
                      
                      {/* Series A line */}
                      <polyline
                        points={chartData.map((d, i) => 
                          `${yAxisLabelWidth + (plotWidth / (chartData.length - 1)) * i},${padding + plotHeight * (1 - d.seriesA / maxValue)}`
                        ).join(' ')}
                        fill="none"
                        stroke="#d8dee9"
                        strokeWidth="2"
                      />
                      
                      {/* Series B line */}
                      <polyline
                        points={chartData.map((d, i) => 
                          `${yAxisLabelWidth + (plotWidth / (chartData.length - 1)) * i},${padding + plotHeight * (1 - d.seriesB / maxValue)}`
                        ).join(' ')}
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="2"
                      />
                      
                      {/* Series C line */}
                      <polyline
                        points={chartData.map((d, i) => 
                          `${yAxisLabelWidth + (plotWidth / (chartData.length - 1)) * i},${padding + plotHeight * (1 - d.seriesC / maxValue)}`
                        ).join(' ')}
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                );
              })()}
              
              {/* Legend */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '28px', marginTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#d8dee9' }}></div>
                  <span style={{ fontSize: '15px', color: '#000000', fontWeight: '600' }}>Series A</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#94a3b8' }}></div>
                  <span style={{ fontSize: '15px', color: '#000000', fontWeight: '600' }}>Series B</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#1e293b' }}></div>
                  <span style={{ fontSize: '15px', color: '#000000', fontWeight: '600' }}>Series C</span>
                </div>
              </div>
            </div>


            {/* Traditional 401k Series A Tables */}
            {tableVisibility.traditional401kSeriesA && (() => {
              const seriesAData = calculateTraditional401kSeriesA();
              return (
                <div style={{ marginBottom: '16px' }}>
                  {/* Accumulation Phase Table */}
            <div style={{
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
                    padding: '12px',
                    border: '1px solid #e9ecef',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', textAlign: 'center' }}>
                      Traditional 401(k) Plan - Series A (Accumulation Phase)
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#e9ecef' }}>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Age</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Year</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Annual Contribution</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Employer Match</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Total Contribution</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Account Balance (FV)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seriesAData.accumulationData.map((row, index) => (
                            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{row.age}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{row.year}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'right' }}>{formatCurrency(row.annualContribution)}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'right' }}>{formatCurrency(row.employerMatch)}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'right' }}>{formatCurrency(row.totalContribution)}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(row.accountBalance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Summary Table */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '14px',
              padding: '24px',
              border: '1px solid rgba(229, 231, 235, 0.8)',
              boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.06)',
            }}>
              <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', textAlign: 'center', color: '#111827', letterSpacing: '-0.02em' }}>
                Summary
            </div>
              <table className="week6-summary-table" style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'left', 
                      backgroundColor: 'rgba(249, 250, 251, 0.8)',
                      borderTop: '1px solid rgba(229, 231, 235, 0.8)',
                      borderLeft: '1px solid rgba(229, 231, 235, 0.8)',
                      borderRight: '2px solid #d1d5db',
                      borderBottom: '2px solid #d1d5db',
                      fontWeight: '700',
                      color: '#374151',
                      fontSize: '12px',
                      whiteSpace: 'nowrap'
                    }}>Metric</th>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'center', 
                      backgroundColor: 'rgba(249, 250, 251, 0.8)',
                      borderTop: '1px solid rgba(229, 231, 235, 0.8)',
                      borderRight: '2px solid #d1d5db',
                      borderBottom: '2px solid #d1d5db',
                      fontWeight: '700',
                      color: '#374151',
                      fontSize: '12px',
                      whiteSpace: 'nowrap'
                    }}>Scenario A</th>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'center', 
                      backgroundColor: 'rgba(249, 250, 251, 0.8)',
                      borderTop: '1px solid rgba(229, 231, 235, 0.8)',
                      borderRight: '2px solid #d1d5db',
                      borderBottom: '2px solid #d1d5db',
                      fontWeight: '700',
                      color: '#374151',
                      fontSize: '12px',
                      whiteSpace: 'nowrap'
                    }}>Scenario B</th>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'center', 
                      backgroundColor: 'rgba(249, 250, 251, 0.8)',
                      borderTop: '1px solid rgba(229, 231, 235, 0.8)',
                      borderRight: '2px solid #d1d5db',
                      borderBottom: '2px solid #d1d5db',
                      fontWeight: '700',
                      color: '#374151',
                      fontSize: '12px',
                      whiteSpace: 'nowrap'
                    }}>Scenario C</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ 
                      padding: '14px 16px', 
                      fontWeight: '600',
                      color: '#4b5563',
                      borderLeft: '1px solid rgba(229, 231, 235, 0.8)',
                      borderRight: '2px solid #d1d5db',
                      borderBottom: '2px solid #d1d5db',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>Future Value Retirement Balance (future $)</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculateTraditional401kSeriesA().finalBalance, { decimals: 0 })}</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculateTraditional401kSeriesB().finalBalance, { decimals: 0 })}</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculateTraditional401kSeriesC().finalBalance, { decimals: 0 })}</td>
                  </tr>
                  <tr>
                    <td style={{ 
                      padding: '14px 16px', 
                      fontWeight: '600',
                      color: '#4b5563',
                      borderLeft: '1px solid rgba(229, 231, 235, 0.8)',
                      borderRight: '2px solid #d1d5db',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>Value in Today's Dollars (discounted at {(inflationRate * 100).toFixed(1)}% inflation)</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculatePresentValue(calculateTraditional401kSeriesA().finalBalance, (retirementPlanningInputs.retirementAge || 65) - (retirementPlanningInputs.contributionStartAge || 22)), { decimals: 0 })}</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculatePresentValue(calculateTraditional401kSeriesB().finalBalance, (retirementPlanningInputs.retirementAge || 65) - (retirementPlanningInputs.contributionStartAge || 22)), { decimals: 0 })}</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculatePresentValue(calculateTraditional401kSeriesC().finalBalance, (retirementPlanningInputs.retirementAge || 65) - (retirementPlanningInputs.contributionStartAge || 22)), { decimals: 0 })}</td>
                  </tr>
                </tbody>
              </table>
          </div>
              </div>

          {/* Traditional 401(k) Withdrawals */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1), 0 4px 16px 0 rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(229, 231, 235, 0.8)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            boxSizing: 'border-box',
            minWidth: 0,
            width: '100%',
            maxWidth: '100%',
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(13, 26, 75, 0.98) 0%, rgba(30, 58, 138, 0.95) 100%)',
              color: 'white',
              padding: '18px 24px',
              borderRadius: '12px',
              marginBottom: '24px',
              fontSize: '16px',
              fontWeight: '700',
              textAlign: 'center',
              letterSpacing: '-0.02em',
              boxShadow: '0 4px 12px 0 rgba(13, 26, 75, 0.25)',
            }}>
              Traditional 401(k) Withdrawals
              </div>

            <div style={{
              fontSize: '13px',
              color: '#4b5563',
              padding: '14px 18px',
              backgroundColor: 'rgba(249, 250, 251, 0.8)',
              borderRadius: '10px',
              border: '1px solid rgba(229, 231, 235, 0.6)',
              textAlign: 'center',
              fontStyle: 'italic',
              marginBottom: '24px'
            }}>
              Contributions are monthly; withdrawals are annual. Shaded rows: RMD exceeds your withdrawal rate.
              </div>

            {/* RMD Input */}
            {selectedWithdrawalSeries === 'A' && (() => {
              const seriesAData = calculateTraditional401kSeriesA();
              return (
                <div style={{ marginBottom: '16px' }}>
                  {/* Withdrawal Phase Table */}
            <div style={{
              backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    padding: '12px',
              border: '1px solid #e9ecef'
            }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', textAlign: 'center' }}>
                      Traditional 401(k) Plan - Series A (Withdrawal Phase)
              </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#e9ecef' }}>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Age</th>
<th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Annual Withdrawal (pre-tax)</th>
<th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>IRS RMD</th>
<th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Tax</th>
<th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>After-Tax Annual Withdrawal</th>
<th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Balance (start of year)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seriesAData.withdrawalData.map((row, index) => (
                            <tr key={index} style={{ backgroundColor: row.rmdBound ? '#fff7e0' : (index % 2 === 0 ? '#fff' : '#f8f9fa') }}>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center', fontWeight: '400' }}>{row.age}</td>
<td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(row.gross)}</td>
<td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'right', fontWeight: '400' }}>{row.rmd > 0 ? formatCurrency(row.rmd) : '—'}</td>
<td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'right', fontWeight: '400' }}>{formatCurrency(row.tax)} ({(row.taxRate * 100).toFixed(1)}%)</td>
<td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(row.afterTax)}</td>
<td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'right', fontWeight: '400' }}>{formatCurrency(row.startBalance)}</td>
                            </tr>
                          ))}
                                                  </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Series B Withdrawal Tables */}
            {selectedWithdrawalSeries === 'B' && (() => {
              const seriesBData = calculateTraditional401kSeriesB();
              return (
                <div style={{ marginBottom: '16px' }}>
                  {/* Withdrawal Phase Table */}
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    padding: '12px',
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', textAlign: 'center' }}>
                      Traditional 401(k) Plan - Series B (Withdrawal Phase)
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#e9ecef' }}>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Age</th>
<th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Annual Withdrawal (pre-tax)</th>
<th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>IRS RMD</th>
<th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Tax</th>
<th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>After-Tax Annual Withdrawal</th>
<th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Balance (start of year)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seriesBData.withdrawalData.map((row, index) => (
                            <tr key={index} style={{ backgroundColor: row.rmdBound ? '#fff7e0' : (index % 2 === 0 ? '#fff' : '#f8f9fa') }}>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center', fontWeight: '400' }}>{row.age}</td>
<td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(row.gross)}</td>
<td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'right', fontWeight: '400' }}>{row.rmd > 0 ? formatCurrency(row.rmd) : '—'}</td>
<td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'right', fontWeight: '400' }}>{formatCurrency(row.tax)} ({(row.taxRate * 100).toFixed(1)}%)</td>
<td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(row.afterTax)}</td>
<td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'right', fontWeight: '400' }}>{formatCurrency(row.startBalance)}</td>
                            </tr>
                          ))}
                                                  </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Series C Tables */}
            {selectedWithdrawalSeries === 'C' && (() => {
              const seriesCData = calculateTraditional401kSeriesC();
              return (
                <div style={{ marginBottom: '16px' }}>
                  {/* Withdrawal Phase Table */}
            <div style={{
              backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    padding: '12px',
              border: '1px solid #e9ecef'
            }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', textAlign: 'center' }}>
                      Traditional 401(k) Plan - Series C (Withdrawal Phase)
              </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#e9ecef' }}>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Age</th>
<th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Annual Withdrawal (pre-tax)</th>
<th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>IRS RMD</th>
<th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Tax</th>
<th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>After-Tax Annual Withdrawal</th>
<th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Balance (start of year)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seriesCData.withdrawalData.map((row, index) => (
                            <tr key={index} style={{ backgroundColor: row.rmdBound ? '#fff7e0' : (index % 2 === 0 ? '#fff' : '#f8f9fa') }}>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center', fontWeight: '400' }}>{row.age}</td>
<td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(row.gross)}</td>
<td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'right', fontWeight: '400' }}>{row.rmd > 0 ? formatCurrency(row.rmd) : '—'}</td>
<td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'right', fontWeight: '400' }}>{formatCurrency(row.tax)} ({(row.taxRate * 100).toFixed(1)}%)</td>
<td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(row.afterTax)}</td>
<td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'right', fontWeight: '400' }}>{formatCurrency(row.startBalance)}</td>
                            </tr>
                          ))}
                                                  </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* RMD Input */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px',
              padding: '16px 20px',
              backgroundColor: 'rgba(249, 250, 251, 0.6)',
              borderRadius: '12px',
              border: '1px solid rgba(229, 231, 235, 0.8)',
            }}>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
                minWidth: '120px',
                width: '120px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
 cursor: 'help'
}}
 onMouseEnter={(e) => termTipRef.current?.show(RMD_DEFINITION, e)}
 onMouseMove={(e) => termTipRef.current?.show(RMD_DEFINITION, e)}
 onMouseLeave={() => termTipRef.current?.hide()}
>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>{renderTermHint('RMD', RMD_DEFINITION)}</div>
                <input
                  type="number"
                  value={rmdStartAge}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid rgba(229, 231, 235, 0.6)',
                    borderRadius: '8px',
                    backgroundColor: '#e5e7eb',
                    fontSize: '15px',
                    textAlign: 'center',
                    cursor: 'help',
                    fontWeight: '700',
                    color: '#111827',
                    boxSizing: 'border-box'
                  }}
                />
          </div>
      </div>

            {/* Scenarios */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '28px',
              marginBottom: '56px',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '28px 26px',
                borderRadius: '12px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
                textAlign: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                boxSizing: 'border-box',
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px 0 rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(13, 26, 75, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(229, 231, 235, 0.8)';
              }}
              >
                <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#0d1a4b', letterSpacing: '0.3px' }}>Scenario A</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px', fontWeight: '500' }}>Withdrawal Rate (%)</div>
                <input
                  type="text"
                  value={retirementPlanningInputs.traditional401kWithdrawalRateA ? `${retirementPlanningInputs.traditional401kWithdrawalRateA}%` : ''}
                  onChange={(e) => handleRetirementPlanningInputChange('traditional401kWithdrawalRateA', e.target.value, e.target)}
                  min="0"
                  max="100"
                  step="0.1"
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '10px',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {retirementPlanningErrors.traditional401kWithdrawalRateA && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.traditional401kWithdrawalRateA}
              </div>
                )}
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px', marginTop: '12px', fontWeight: '500' }}>Starting Distribution Age</div>
                <input
                  type="number"
                  value={retirementPlanningInputs.traditional401kAgeA || 65}
                  onChange={(e) => handleRetirementPlanningInputChange('traditional401kAgeA', e.target.value)}
                  min={retirementPlanningInputs.retirementAge || 65}
                  max="100"
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '10px',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {retirementPlanningErrors.traditional401kAgeA && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.traditional401kAgeA}
              </div>
                )}
                {renderWithdrawalSummary('traditional401k', 'A')}
              </div>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '28px 26px',
                borderRadius: '12px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
                textAlign: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                boxSizing: 'border-box',
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px 0 rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(13, 26, 75, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(229, 231, 235, 0.8)';
              }}
              >
                <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#0d1a4b', letterSpacing: '0.3px' }}>Scenario B</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px', fontWeight: '500' }}>Withdrawal Rate (%)</div>
                <input
                  type="text"
                  value={retirementPlanningInputs.traditional401kWithdrawalRateB ? `${retirementPlanningInputs.traditional401kWithdrawalRateB}%` : ''}
                  onChange={(e) => handleRetirementPlanningInputChange('traditional401kWithdrawalRateB', e.target.value, e.target)}
                  min="0"
                  max="100"
                  step="0.1"
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '10px',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {retirementPlanningErrors.traditional401kWithdrawalRateB && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.traditional401kWithdrawalRateB}
            </div>
                )}
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px', marginTop: '12px', fontWeight: '500' }}>Starting Distribution Age</div>
                <input
                  type="number"
                  value={retirementPlanningInputs.traditional401kAgeB || 65}
                  onChange={(e) => handleRetirementPlanningInputChange('traditional401kAgeB', e.target.value)}
                  min={retirementPlanningInputs.retirementAge || 65}
                  max="100"
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '10px',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {retirementPlanningErrors.traditional401kAgeB && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.traditional401kAgeB}
              </div>
                )}
                {renderWithdrawalSummary('traditional401k', 'B')}
              </div>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '28px 26px',
                borderRadius: '12px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
                textAlign: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                boxSizing: 'border-box',
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px 0 rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(13, 26, 75, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(229, 231, 235, 0.8)';
              }}
              >
                <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#0d1a4b', letterSpacing: '0.3px' }}>Scenario C</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px', fontWeight: '500' }}>Withdrawal Rate (%)</div>
                <input
                  type="text"
                  value={retirementPlanningInputs.traditional401kWithdrawalRateC ? `${retirementPlanningInputs.traditional401kWithdrawalRateC}%` : ''}
                  onChange={(e) => handleRetirementPlanningInputChange('traditional401kWithdrawalRateC', e.target.value, e.target)}
                  min="0"
                  max="100"
                  step="0.1"
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '10px',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {retirementPlanningErrors.traditional401kWithdrawalRateC && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.traditional401kWithdrawalRateC}
              </div>
                )}
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px', marginTop: '12px', fontWeight: '500' }}>Starting Distribution Age</div>
                <input
                  type="number"
                  value={retirementPlanningInputs.traditional401kAgeC || 65}
                  onChange={(e) => handleRetirementPlanningInputChange('traditional401kAgeC', e.target.value)}
                  min={retirementPlanningInputs.retirementAge || 65}
                  max="100"
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '10px',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {retirementPlanningErrors.traditional401kAgeC && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.traditional401kAgeC}
            </div>
                )}
                {renderWithdrawalSummary('traditional401k', 'C')}
            </div>
          </div>

            {/* Traditional 401k Series B Tables */}
            {tableVisibility.traditional401kSeriesB && (() => {
              const seriesBData = calculateTraditional401kSeriesB();
              return (
                <div style={{ marginBottom: '16px' }}>
                  {/* Accumulation Phase Table */}
            <div style={{
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
                    padding: '12px',
                    border: '1px solid #e9ecef',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', textAlign: 'center' }}>
                      Traditional 401(k) Plan - Series B (Accumulation Phase)
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#e9ecef' }}>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Age</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Year</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Annual Contribution</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Employer Match</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Total Contribution</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Account Balance (FV)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seriesBData.accumulationData.map((row, index) => (
                            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{row.age}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{row.year}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'right' }}>{formatCurrency(row.annualContribution)}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'right' }}>{formatCurrency(row.employerMatch)}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'right' }}>{formatCurrency(row.totalContribution)}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(row.accountBalance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Traditional 401(k) Withdrawals vs Age Chart */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: 'none',
              borderRadius: '14px',
              padding: '28px',
              marginBottom: '24px',
              minHeight: '620px',
              boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.06)',
            }}>
              <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', textAlign: 'center', color: '#111827', letterSpacing: '-0.02em' }}>
                Traditional 401(k) Annual Withdrawals (Pre-Tax) vs. Age Chart
              </div>
              {(() => {
                const chartData = generateTraditional401kWithdrawalsChartData();
                const maxValue = niceAxisMax(Math.max(...chartData.map(d => Math.max(d.seriesA, d.seriesB, d.seriesC))));
                
                // For withdrawal charts, extend Y-axis to double the max value for better visual spacing
                const extendedMaxValue = maxValue;
                
                // Dynamic Y-axis values based on extended max value
                const getYAxisValues = (max) => niceAxisTicks(max);
                
                const yAxisValues = getYAxisValues(extendedMaxValue);
                const chartWidth = 1100;
                const chartHeight = 520;
                const padding = 24;
                const bottomPad = 72; // room under the plot for tick labels + the "Age" axis title
                const yAxisLabelWidth = 150; // gutter for the rotated y-axis title + whole-dollar tick labels
                const plotWidth = chartWidth - padding - yAxisLabelWidth;
                const plotHeight = chartHeight - padding - bottomPad;
                
                return (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', maxWidth: chartWidth, height: 'auto', overflow: 'visible' }}>
                      {/* Y-axis value labels (horizontal grid lines removed) */}
                      {yAxisValues.map((value, i) => {
                        const ratio = value / extendedMaxValue;
                        return (
                          <g key={i}>
                            <text
                              x={yAxisLabelWidth - 12}
                              y={padding + plotHeight * (1 - ratio) + 6}
                              fontSize="16" fontWeight="500"
                              fill="#000000"
                              textAnchor="end"
                            >
                              {formatCurrency(Math.round(value), { decimals: 0 })}
                            </text>
                          </g>
                        );
                      })}
                      
                      {/* Axis titles */}
                      <text x={yAxisLabelWidth + plotWidth / 2} y={chartHeight - 10} fontSize="17" fontWeight="700" fill="#000000" textAnchor="middle">Age</text>
                      <text transform={`translate(20 ${padding + plotHeight / 2}) rotate(-90)`} fontSize="17" fontWeight="700" fill="#000000" textAnchor="middle">Annual Withdrawal (Pre-Tax)</text>

                      {/* Age labels */}
                      {chartData.filter((_, i) => i % 5 === 0).map((d, i) => (
                        <text
                          key={i}
                          x={yAxisLabelWidth + (plotWidth / chartData.length) * (chartData.findIndex(item => item.age === d.age) + 0.5)}
                          y={chartHeight - bottomPad + 28}
                          fontSize="16" fontWeight="500"
                          fill="#000000"
                          textAnchor="middle"
                        >
                          {d.age}
                        </text>
                      ))}
                      
                      {/* Bar chart - Series A, B, C bars for each age */}
                      {chartData.map((d, i) => {
                        const barWidth = (plotWidth / chartData.length) * 0.8; // 80% of available space
                        const barSpacing = (plotWidth / chartData.length) * 0.2; // 20% spacing
                        const x = yAxisLabelWidth + (plotWidth / chartData.length) * i + barSpacing / 2;
                        
                        return (
                          <g key={i}>
                            {/* Series A bar */}
                            <rect
                              x={x}
                              y={padding + plotHeight * (1 - d.seriesA / extendedMaxValue)}
                              width={barWidth / 3}
                              height={plotHeight * (d.seriesA / extendedMaxValue)}
                              fill="#d8dee9"
                              opacity="0.85"
                              rx="2"
                              ry="2"
                            />
                            
                            {/* Series B bar */}
                            <rect
                              x={x + barWidth / 3}
                              y={padding + plotHeight * (1 - d.seriesB / extendedMaxValue)}
                              width={barWidth / 3}
                              height={plotHeight * (d.seriesB / extendedMaxValue)}
                              fill="#94a3b8"
                              opacity="0.85"
                              rx="2"
                              ry="2"
                            />
                            
                            {/* Series C bar */}
                            <rect
                              x={x + 2 * barWidth / 3}
                              y={padding + plotHeight * (1 - d.seriesC / extendedMaxValue)}
                              width={barWidth / 3}
                              height={plotHeight * (d.seriesC / extendedMaxValue)}
                              fill="#1e293b"
                              opacity="0.85"
                              rx="2"
                              ry="2"
                            />
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                );
              })()}
              
              {/* Legend */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '28px', marginTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#d8dee9' }}></div>
                  <span style={{ fontSize: '15px', color: '#000000', fontWeight: '600' }}>Series A</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#94a3b8' }}></div>
                  <span style={{ fontSize: '15px', color: '#000000', fontWeight: '600' }}>Series B</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#1e293b' }}></div>
                  <span style={{ fontSize: '15px', color: '#000000', fontWeight: '600' }}>Series C</span>
                </div>
              </div>
            </div>


            <div style={{
              fontSize: '13px',
              color: '#4b5563',
              padding: '14px 18px',
              backgroundColor: 'rgba(249, 250, 251, 0.8)',
              borderRadius: '10px',
              border: '1px solid rgba(229, 231, 235, 0.6)',
              textAlign: 'center',
              fontStyle: 'italic',
              marginTop: '24px'
            }}>
              Return above withdrawal rate: balance keeps growing.
              </div>
            </div>
          </div>
        </>)}

        {/* Roth 401(k) tab */}
        {activeTab === 'roth401k' && (<>
        {/* 6. Roth 401(k) Balance and Withdrawals */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '32px',
          marginBottom: '40px',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}>
          {/* Roth 401(k) Balance */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1), 0 4px 16px 0 rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(229, 231, 235, 0.8)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            boxSizing: 'border-box',
            minWidth: 0,
            width: '100%',
            maxWidth: '100%',
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(13, 26, 75, 0.98) 0%, rgba(30, 58, 138, 0.95) 100%)',
              color: 'white',
              padding: '18px 24px',
              borderRadius: '12px',
              marginBottom: '24px',
              fontSize: '16px',
              fontWeight: '700',
              textAlign: 'center',
              letterSpacing: '-0.02em',
              boxShadow: '0 4px 12px 0 rgba(13, 26, 75, 0.25)',
            }}>
              Roth 401(k) Balance
              </div>

            {/* Description */}
            <div style={{
              fontSize: '13px',
              color: '#4b5563',
              marginBottom: '24px',
              lineHeight: '1.6',
              padding: '14px 18px',
              backgroundColor: 'rgba(249, 250, 251, 0.8)',
              borderRadius: '10px',
              border: '1px solid rgba(229, 231, 235, 0.6)',
            }}>
              Post-tax. {formatCurrency(assumptions.scalars.limit_401k, { decimals: 0 })} limit. Tax-free withdrawals. Match is pre-tax.
              </div>

            {/* Key Parameters */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.6)',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>Contribution Start Age</div>
                <input
                  type="number"
                  value={retirementPlanningInputs.contributionStartAge || ''}
                  onChange={(e) => handleRetirementPlanningInputChange('contributionStartAge', e.target.value)}
                  min="0"
                  max="100"
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'right',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {retirementPlanningErrors.contributionStartAge && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.contributionStartAge}
            </div>
                )}
            </div>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.6)',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>Retirement Age</div>
                <input
                  type="number"
                  value={retirementPlanningInputs.retirementAge || ''}
                  onChange={(e) => handleRetirementPlanningInputChange('retirementAge', e.target.value)}
                  min={retirementPlanningInputs.retirementAge || 65}
                  max="100"
                  style={{
                    ...styles.readOnly,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'right',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  readOnly
                />
                {retirementPlanningErrors.retirementAge && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.retirementAge}
            </div>
                )}
          </div>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.6)',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>Annual Rate of Return (%)</div>
                <input
                  type="text"
                  value={retirementPlanningInputs.annualReturnRate ? `${retirementPlanningInputs.annualReturnRate}%` : ''}
                  onChange={(e) => handleRetirementPlanningInputChange('annualReturnRate', e.target.value, e.target)}
                  min="0"
                  max="20"
                  step="0.1"
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'right',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {retirementPlanningErrors.annualReturnRate && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.annualReturnRate}
              </div>
                )}
              </div>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.6)',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>Employer Match (% of your contribution)</div>
                <input
                  type="text"
                  value={retirementPlanningInputs.employerMatch401k ? `${retirementPlanningInputs.employerMatch401k}%` : ''}
                  onChange={(e) => handleRetirementPlanningInputChange('employerMatch401k', e.target.value, e.target)}
                  min="0"
                  max="100"
                  step="0.1"
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'right',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {retirementPlanningErrors.employerMatch401k && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.employerMatch401k}
              </div>
                )}
            </div>
          </div>

            {/* Scenarios */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '28px',
              marginBottom: '56px',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '28px 26px',
                borderRadius: '12px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
                textAlign: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                boxSizing: 'border-box',
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px 0 rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(13, 26, 75, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(229, 231, 235, 0.8)';
              }}>
                <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px', color: '#0d1a4b', letterSpacing: '-0.01em' }}>Scenario A</div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '10px', fontWeight: '600' }}>Monthly Payment</div>
                <input
                  type="text"
                  value={monthlyPayments.roth_401k_a !== '' && monthlyPayments.roth_401k_a != null ? `${formatCurrency(monthlyPayments.roth_401k_a)}` : ''}
                  onChange={(e) => handleMonthlyPaymentChange('roth_401k_a', e.target.value)}
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {monthlyPaymentErrors.roth_401k_a && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {monthlyPaymentErrors.roth_401k_a}
              </div>
                )}
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '10px', fontWeight: '500' }}>{calculatePercentageOfAfterTaxIncome(monthlyPayments.roth_401k_a).toFixed(2)}% of Monthly After Tax Income</div>
              </div>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '28px 26px',
                borderRadius: '12px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
                textAlign: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                boxSizing: 'border-box',
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px 0 rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(13, 26, 75, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(229, 231, 235, 0.8)';
              }}>
                <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px', color: '#0d1a4b', letterSpacing: '-0.01em' }}>Scenario B</div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '10px', fontWeight: '600' }}>Monthly Payment</div>
                <input
                  type="text"
                  value={monthlyPayments.roth_401k_b !== '' && monthlyPayments.roth_401k_b != null ? `${formatCurrency(monthlyPayments.roth_401k_b)}` : ''}
                  onChange={(e) => handleMonthlyPaymentChange('roth_401k_b', e.target.value)}
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {monthlyPaymentErrors.roth_401k_b && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {monthlyPaymentErrors.roth_401k_b}
              </div>
                )}
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '10px', fontWeight: '500' }}>{calculatePercentageOfAfterTaxIncome(monthlyPayments.roth_401k_b).toFixed(2)}% of Monthly After Tax Income</div>
            </div>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '28px 26px',
                borderRadius: '12px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
                textAlign: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                boxSizing: 'border-box',
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px 0 rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(13, 26, 75, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(229, 231, 235, 0.8)';
              }}>
                <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px', color: '#0d1a4b', letterSpacing: '-0.01em' }}>Scenario C</div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '10px', fontWeight: '600' }}>Monthly Payment</div>
                <input
                  type="text"
                  value={monthlyPayments.roth_401k_c !== '' && monthlyPayments.roth_401k_c != null ? `${formatCurrency(monthlyPayments.roth_401k_c)}` : ''}
                  onChange={(e) => handleMonthlyPaymentChange('roth_401k_c', e.target.value)}
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {monthlyPaymentErrors.roth_401k_c && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {monthlyPaymentErrors.roth_401k_c}
          </div>
                )}
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '10px', fontWeight: '500' }}>{calculatePercentageOfAfterTaxIncome(monthlyPayments.roth_401k_c).toFixed(2)}% of Monthly After Tax Income</div>
        </div>
      </div>

            {/* Dynamic Chart */}
            <div style={{
              backgroundColor: '#f8f9fa',
              border: 'none',
              borderRadius: '6px',
              padding: '16px',
              marginBottom: '16px',
              minHeight: '620px'
            }}>
              <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', textAlign: 'center', color: '#333' }}>
                Roth 401(k) Balance vs. Age Chart
      </div>
              {(() => {
                const chartData = generateRoth401kChartData();
                const maxValue = niceAxisMax(Math.max(...chartData.map(d => Math.max(d.seriesA, d.seriesB, d.seriesC))));
                
                // Dynamic Y-axis values based on max value
                const getYAxisValues = (max) => niceAxisTicks(max);
                
                const yAxisValues = getYAxisValues(maxValue);
                const chartWidth = 1100;
                const chartHeight = 520;
                const padding = 24;
                const bottomPad = 72; // room under the plot for tick labels + the "Age" axis title
                const yAxisLabelWidth = 150; // gutter for the rotated y-axis title + whole-dollar tick labels
                const plotWidth = chartWidth - padding - yAxisLabelWidth;
                const plotHeight = chartHeight - padding - bottomPad;
                
                return (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', maxWidth: chartWidth, height: 'auto', overflow: 'visible' }}>
                      {/* Y-axis value labels (horizontal grid lines removed) */}
                      {yAxisValues.map((value, i) => {
                        const ratio = value / maxValue;
                        return (
                          <g key={i}>
                            <text
                              x={yAxisLabelWidth - 12}
                              y={padding + plotHeight * (1 - ratio) + 6}
                              fontSize="16" fontWeight="500"
                              fill="#000000"
                              textAnchor="end"
                            >
                              {formatCurrency(Math.round(value), { decimals: 0 })}
                            </text>
                          </g>
                        );
                      })}
                      
                      {/* Axis lines (line charts only, per house spec) */}
                      <line x1={yAxisLabelWidth} y1={padding} x2={yAxisLabelWidth} y2={padding + plotHeight} stroke="#000000" strokeWidth="1" />
                      <line x1={yAxisLabelWidth} y1={padding + plotHeight} x2={chartWidth} y2={padding + plotHeight} stroke="#000000" strokeWidth="1" />
                      {/* Axis titles */}
                      <text x={yAxisLabelWidth + plotWidth / 2} y={chartHeight - 10} fontSize="17" fontWeight="700" fill="#000000" textAnchor="middle">Age</text>
                      <text transform={`translate(20 ${padding + plotHeight / 2}) rotate(-90)`} fontSize="17" fontWeight="700" fill="#000000" textAnchor="middle">Account Balance</text>

                      {/* Age labels */}
                      {chartData.filter((_, i) => i % 5 === 0).map((d, i) => (
                        <text
                          key={i}
                          x={yAxisLabelWidth + (plotWidth / (chartData.length - 1)) * (chartData.findIndex(item => item.age === d.age))}
                          y={chartHeight - bottomPad + 28}
                          fontSize="16" fontWeight="500"
                          fill="#000000"
                          textAnchor="middle"
                        >
                          {d.age}
                        </text>
                      ))}
                      
                      {/* Series A line */}
                      <polyline
                        points={chartData.map((d, i) => 
                          `${yAxisLabelWidth + (plotWidth / (chartData.length - 1)) * i},${padding + plotHeight * (1 - d.seriesA / maxValue)}`
                        ).join(' ')}
                        fill="none"
                        stroke="#d8dee9"
                        strokeWidth="2"
                      />
                      
                      {/* Series B line */}
                      <polyline
                        points={chartData.map((d, i) => 
                          `${yAxisLabelWidth + (plotWidth / (chartData.length - 1)) * i},${padding + plotHeight * (1 - d.seriesB / maxValue)}`
                        ).join(' ')}
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="2"
                      />
                      
                      {/* Series C line */}
                      <polyline
                        points={chartData.map((d, i) => 
                          `${yAxisLabelWidth + (plotWidth / (chartData.length - 1)) * i},${padding + plotHeight * (1 - d.seriesC / maxValue)}`
                        ).join(' ')}
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                );
              })()}
              
              {/* Legend */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '28px', marginTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#d8dee9' }}></div>
                  <span style={{ fontSize: '15px', color: '#000000', fontWeight: '600' }}>Series A</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#94a3b8' }}></div>
                  <span style={{ fontSize: '15px', color: '#000000', fontWeight: '600' }}>Series B</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#1e293b' }}></div>
                  <span style={{ fontSize: '15px', color: '#000000', fontWeight: '600' }}>Series C</span>
                </div>
              </div>
      </div>


            {/* Series Tables */}
            {selectedRoth401kSeries === 'A' && (() => {
              const seriesAData = calculateRoth401kSeriesA();
              return (
                <div style={{ marginBottom: '16px' }}>
                  {/* Accumulation Phase Table */}
            <div style={{
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
                    padding: '12px',
                    border: '1px solid #e9ecef',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', textAlign: 'center' }}>
                      Roth 401(k) Plan - Series A (Accumulation Phase)
      </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#e9ecef' }}>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Age</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Year</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Annual Contribution</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Employer Match</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Total Contribution</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Account Balance (FV)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seriesAData.accumulationData.map((row, index) => (
                            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{row.age}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{row.year}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{formatCurrency(row.annualContribution)}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{formatCurrency(row.employerMatch)}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{formatCurrency(row.totalContribution)}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{formatCurrency(row.accountBalance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {selectedRoth401kSeries === 'B' && (() => {
              const seriesBData = calculateRoth401kSeriesB();
              return (
                <div style={{ marginBottom: '16px' }}>
                  {/* Accumulation Phase Table */}
            <div style={{
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
                    padding: '12px',
                    border: '1px solid #e9ecef',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', textAlign: 'center' }}>
                      Roth 401(k) Plan - Series B (Accumulation Phase)
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#e9ecef' }}>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Age</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Year</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Annual Contribution</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Employer Match</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Total Contribution</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Account Balance (FV)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seriesBData.accumulationData.map((row, index) => (
                            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{row.age}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{row.year}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{formatCurrency(row.annualContribution)}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{formatCurrency(row.employerMatch)}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{formatCurrency(row.totalContribution)}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{formatCurrency(row.accountBalance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {selectedRoth401kSeries === 'C' && (() => {
              const seriesCData = calculateRoth401kSeriesC();
              return (
                <div style={{ marginBottom: '16px' }}>
                  {/* Accumulation Phase Table */}
            <div style={{
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
                    padding: '12px',
                    border: '1px solid #e9ecef',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', textAlign: 'center' }}>
                      Roth 401(k) Plan - Series C (Accumulation Phase)
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#e9ecef' }}>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Age</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Year</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Annual Contribution</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Employer Match</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Total Contribution</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Account Balance (FV)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seriesCData.accumulationData.map((row, index) => (
                            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{row.age}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{row.year}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{formatCurrency(row.annualContribution)}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{formatCurrency(row.employerMatch)}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{formatCurrency(row.totalContribution)}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{formatCurrency(row.accountBalance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Summary Table */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '14px',
              padding: '24px',
              border: '1px solid rgba(229, 231, 235, 0.8)',
              boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.06)',
            }}>
              <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', textAlign: 'center', color: '#111827', letterSpacing: '-0.02em' }}>
                Summary
            </div>
              <table className="week6-summary-table" style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'left', 
                      backgroundColor: 'rgba(249, 250, 251, 0.8)',
                      borderTop: '1px solid rgba(229, 231, 235, 0.8)',
                      borderLeft: '1px solid rgba(229, 231, 235, 0.8)',
                      borderRight: '2px solid #d1d5db',
                      borderBottom: '2px solid #d1d5db',
                      fontWeight: '700',
                      color: '#374151',
                      fontSize: '12px',
                      whiteSpace: 'nowrap'
                    }}>Metric</th>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'center', 
                      backgroundColor: 'rgba(249, 250, 251, 0.8)',
                      borderTop: '1px solid rgba(229, 231, 235, 0.8)',
                      borderRight: '2px solid #d1d5db',
                      borderBottom: '2px solid #d1d5db',
                      fontWeight: '700',
                      color: '#374151',
                      fontSize: '12px',
                      whiteSpace: 'nowrap'
                    }}>Scenario A</th>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'center', 
                      backgroundColor: 'rgba(249, 250, 251, 0.8)',
                      borderTop: '1px solid rgba(229, 231, 235, 0.8)',
                      borderRight: '2px solid #d1d5db',
                      borderBottom: '2px solid #d1d5db',
                      fontWeight: '700',
                      color: '#374151',
                      fontSize: '12px',
                      whiteSpace: 'nowrap'
                    }}>Scenario B</th>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'center', 
                      backgroundColor: 'rgba(249, 250, 251, 0.8)',
                      borderTop: '1px solid rgba(229, 231, 235, 0.8)',
                      borderRight: '2px solid #d1d5db',
                      borderBottom: '2px solid #d1d5db',
                      fontWeight: '700',
                      color: '#374151',
                      fontSize: '12px',
                      whiteSpace: 'nowrap'
                    }}>Scenario C</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ 
                      padding: '14px 16px', 
                      fontWeight: '600',
                      color: '#4b5563',
                      borderLeft: '1px solid rgba(229, 231, 235, 0.8)',
                      borderRight: '2px solid #d1d5db',
                      borderBottom: '2px solid #d1d5db',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>Future Value Retirement Balance (future $)</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculateRoth401kSeriesA().finalBalance, { decimals: 0 })}</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculateRoth401kSeriesB().finalBalance, { decimals: 0 })}</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculateRoth401kSeriesC().finalBalance, { decimals: 0 })}</td>
                  </tr>
                  <tr>
                    <td style={{ 
                      padding: '14px 16px', 
                      fontWeight: '600',
                      color: '#4b5563',
                      borderLeft: '1px solid rgba(229, 231, 235, 0.8)',
                      borderRight: '2px solid #d1d5db',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>Value in Today's Dollars (discounted at {(inflationRate * 100).toFixed(1)}% inflation)</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculatePresentValue(calculateRoth401kSeriesA().finalBalance, (retirementPlanningInputs.retirementAge || 65) - (retirementPlanningInputs.contributionStartAge || 22)), { decimals: 0 })}</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculatePresentValue(calculateRoth401kSeriesB().finalBalance, (retirementPlanningInputs.retirementAge || 65) - (retirementPlanningInputs.contributionStartAge || 22)), { decimals: 0 })}</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculatePresentValue(calculateRoth401kSeriesC().finalBalance, (retirementPlanningInputs.retirementAge || 65) - (retirementPlanningInputs.contributionStartAge || 22)), { decimals: 0 })}</td>
                  </tr>
            </tbody>
          </table>
          </div>
      </div>

          {/* Roth 401(k) Withdrawals */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1), 0 4px 16px 0 rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(229, 231, 235, 0.8)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            boxSizing: 'border-box',
            minWidth: 0,
            width: '100%',
            maxWidth: '100%',
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(13, 26, 75, 0.98) 0%, rgba(30, 58, 138, 0.95) 100%)',
              color: 'white',
              padding: '18px 24px',
              borderRadius: '12px',
              marginBottom: '24px',
              fontSize: '16px',
              fontWeight: '700',
              textAlign: 'center',
              letterSpacing: '-0.02em',
              boxShadow: '0 4px 12px 0 rgba(13, 26, 75, 0.25)',
            }}>
              Roth 401(k) Withdrawals
              </div>

            {/* Note */}
            <div style={{
              fontSize: '13px',
              color: '#4b5563',
              marginBottom: '24px',
              lineHeight: '1.6',
              padding: '14px 18px',
              backgroundColor: 'rgba(249, 250, 251, 0.8)',
              borderRadius: '10px',
              border: '1px solid rgba(229, 231, 235, 0.6)',
            }}>
              Balance carries from the left.
              </div>

            {/* RMD Input */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px',
              padding: '16px 20px',
              backgroundColor: 'rgba(249, 250, 251, 0.6)',
              borderRadius: '12px',
              border: '1px solid rgba(229, 231, 235, 0.8)',
            }}>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
                minWidth: '120px',
                width: '120px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
 cursor: 'help'
}}
 onMouseEnter={(e) => termTipRef.current?.show(RMD_DEFINITION, e)}
 onMouseMove={(e) => termTipRef.current?.show(RMD_DEFINITION, e)}
 onMouseLeave={() => termTipRef.current?.hide()}
>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>{renderTermHint('RMD', RMD_DEFINITION)}</div>
                <input
                  type="text"
                  value="None"
                  readOnly
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid rgba(229, 231, 235, 0.6)',
                    borderRadius: '8px',
                    backgroundColor: '#e5e7eb',
                    fontSize: '15px',
                    textAlign: 'center',
                    cursor: 'help',
                    fontWeight: '700',
                    color: '#111827',
                    boxSizing: 'border-box'
                  }}
                />
          </div>
      </div>

            {/* Scenarios */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '28px',
              marginBottom: '56px',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '28px 26px',
                borderRadius: '12px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
                textAlign: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                boxSizing: 'border-box',
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px 0 rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(13, 26, 75, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(229, 231, 235, 0.8)';
              }}
              >
                <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#0d1a4b', letterSpacing: '0.3px' }}>Scenario A</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px', fontWeight: '500' }}>Withdrawal Rate (%)</div>
                <input
                  type="text"
                  value={retirementPlanningInputs.roth401kWithdrawalRateA ? `${retirementPlanningInputs.roth401kWithdrawalRateA}%` : ''}
                  onChange={(e) => handleRetirementPlanningInputChange('roth401kWithdrawalRateA', e.target.value, e.target)}
                  min="0"
                  max="100"
                  step="0.1"
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '10px',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {retirementPlanningErrors.roth401kWithdrawalRateA && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.roth401kWithdrawalRateA}
                  </div>
                )}
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px', marginTop: '12px', fontWeight: '500' }}>Starting Distribution Age</div>
                <input
                  type="number"
                  value={retirementPlanningInputs.roth401kAgeA || 65}
                  onChange={(e) => handleRetirementPlanningInputChange('roth401kAgeA', e.target.value)}
                  min={retirementPlanningInputs.retirementAge || 65}
                  max="100"
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '10px',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {retirementPlanningErrors.roth401kAgeA && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.roth401kAgeA}
                  </div>
                )}
                {renderWithdrawalSummary('roth401k', 'A')}
              </div>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '28px 26px',
                borderRadius: '12px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
                textAlign: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                boxSizing: 'border-box',
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px 0 rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(13, 26, 75, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(229, 231, 235, 0.8)';
              }}
              >
                <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#0d1a4b', letterSpacing: '0.3px' }}>Scenario B</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px', fontWeight: '500' }}>Withdrawal Rate (%)</div>
                <input
                  type="text"
                  value={retirementPlanningInputs.roth401kWithdrawalRateB ? `${retirementPlanningInputs.roth401kWithdrawalRateB}%` : ''}
                  onChange={(e) => handleRetirementPlanningInputChange('roth401kWithdrawalRateB', e.target.value, e.target)}
                  min="0"
                  max="100"
                  step="0.1"
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '10px',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {retirementPlanningErrors.roth401kWithdrawalRateB && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.roth401kWithdrawalRateB}
                  </div>
                )}
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px', marginTop: '12px', fontWeight: '500' }}>Starting Distribution Age</div>
                <input
                  type="number"
                  value={retirementPlanningInputs.roth401kAgeB || 65}
                  onChange={(e) => handleRetirementPlanningInputChange('roth401kAgeB', e.target.value)}
                  min={retirementPlanningInputs.retirementAge || 65}
                  max="100"
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '10px',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {retirementPlanningErrors.roth401kAgeB && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.roth401kAgeB}
                  </div>
                )}
                {renderWithdrawalSummary('roth401k', 'B')}
              </div>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '28px 26px',
                borderRadius: '12px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
                textAlign: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                boxSizing: 'border-box',
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px 0 rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(13, 26, 75, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(229, 231, 235, 0.8)';
              }}
              >
                <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#0d1a4b', letterSpacing: '0.3px' }}>Scenario C</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px', fontWeight: '500' }}>Withdrawal Rate (%)</div>
                <input
                  type="text"
                  value={retirementPlanningInputs.roth401kWithdrawalRateC ? `${retirementPlanningInputs.roth401kWithdrawalRateC}%` : ''}
                  onChange={(e) => handleRetirementPlanningInputChange('roth401kWithdrawalRateC', e.target.value, e.target)}
                  min="0"
                  max="100"
                  step="0.1"
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '10px',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {retirementPlanningErrors.roth401kWithdrawalRateC && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.roth401kWithdrawalRateC}
                  </div>
                )}
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px', marginTop: '12px', fontWeight: '500' }}>Starting Distribution Age</div>
                <input
                  type="number"
                  value={retirementPlanningInputs.roth401kAgeC || 65}
                  onChange={(e) => handleRetirementPlanningInputChange('roth401kAgeC', e.target.value)}
                  min={retirementPlanningInputs.retirementAge || 65}
                  max="100"
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '10px',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {retirementPlanningErrors.roth401kAgeC && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.roth401kAgeC}
                  </div>
                )}
                {renderWithdrawalSummary('roth401k', 'C')}
              </div>
      </div>

            {/* Chart */}
            <div style={{
              backgroundColor: '#f8f9fa',
              border: 'none',
              borderRadius: '6px',
              padding: '16px',
              marginBottom: '16px',
              minHeight: '620px'
            }}>
              <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', textAlign: 'center', color: '#333' }}>
                Roth 401(k) Annual Withdrawals (Pre-Tax) vs. Age Chart
            </div>
              {(() => {
                const chartData = generateRoth401kWithdrawalsChartData();
                const maxValue = niceAxisMax(Math.max(...chartData.map(d => Math.max(d.seriesA, d.seriesB, d.seriesC))));
                
                // For withdrawal charts, extend Y-axis to double the max value for better visual spacing
                const extendedMaxValue = maxValue;
                
                // Dynamic Y-axis values based on extended max value
                const getYAxisValues = (max) => niceAxisTicks(max);
                
                const yAxisValues = getYAxisValues(extendedMaxValue);
                const chartWidth = 1100;
                const chartHeight = 520;
                const padding = 24;
                const bottomPad = 72; // room under the plot for tick labels + the "Age" axis title
                const yAxisLabelWidth = 150; // gutter for the rotated y-axis title + whole-dollar tick labels
                const plotWidth = chartWidth - padding - yAxisLabelWidth;
                const plotHeight = chartHeight - padding - bottomPad;
                
                return (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', maxWidth: chartWidth, height: 'auto', overflow: 'visible' }}>
                      {/* Y-axis value labels (horizontal grid lines removed) */}
                      {yAxisValues.map((value, i) => {
                        const ratio = value / extendedMaxValue;
                        return (
                          <g key={i}>
                            <text
                              x={yAxisLabelWidth - 12}
                              y={padding + plotHeight * (1 - ratio) + 6}
                              fontSize="16" fontWeight="500"
                              fill="#000000"
                              textAnchor="end"
                            >
                              {formatCurrency(Math.round(value), { decimals: 0 })}
                            </text>
                          </g>
                        );
                      })}
                      
                      {/* Axis titles */}
                      <text x={yAxisLabelWidth + plotWidth / 2} y={chartHeight - 10} fontSize="17" fontWeight="700" fill="#000000" textAnchor="middle">Age</text>
                      <text transform={`translate(20 ${padding + plotHeight / 2}) rotate(-90)`} fontSize="17" fontWeight="700" fill="#000000" textAnchor="middle">Annual Withdrawal (Pre-Tax)</text>

                      {/* Age labels */}
                      {chartData.filter((_, i) => i % 5 === 0).map((d, i) => (
                        <text
                          key={i}
                          x={yAxisLabelWidth + (plotWidth / chartData.length) * (chartData.findIndex(item => item.age === d.age) + 0.5)}
                          y={chartHeight - bottomPad + 28}
                          fontSize="16" fontWeight="500"
                          fill="#000000"
                          textAnchor="middle"
                        >
                          {d.age}
                        </text>
                      ))}
                      
                      {/* Bar chart - Series A, B, C bars for each age */}
                      {chartData.map((d, i) => {
                        const barWidth = (plotWidth / chartData.length) * 0.8; // 80% of available space
                        const barSpacing = (plotWidth / chartData.length) * 0.2; // 20% spacing
                        const x = yAxisLabelWidth + (plotWidth / chartData.length) * i + barSpacing / 2;
                        
                        return (
                          <g key={i}>
                            {/* Series A bar */}
                            <rect
                              x={x}
                              y={padding + plotHeight * (1 - d.seriesA / extendedMaxValue)}
                              width={barWidth / 3}
                              height={plotHeight * (d.seriesA / extendedMaxValue)}
                              fill="#d8dee9"
                              opacity="0.85"
                              rx="2"
                              ry="2"
                            />
                            
                            {/* Series B bar */}
                            <rect
                              x={x + barWidth / 3}
                              y={padding + plotHeight * (1 - d.seriesB / extendedMaxValue)}
                              width={barWidth / 3}
                              height={plotHeight * (d.seriesB / extendedMaxValue)}
                              fill="#94a3b8"
                              opacity="0.85"
                              rx="2"
                              ry="2"
                            />
                            
                            {/* Series C bar */}
                            <rect
                              x={x + 2 * barWidth / 3}
                              y={padding + plotHeight * (1 - d.seriesC / extendedMaxValue)}
                              width={barWidth / 3}
                              height={plotHeight * (d.seriesC / extendedMaxValue)}
                              fill="#1e293b"
                              opacity="0.85"
                              rx="2"
                              ry="2"
                            />
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                );
              })()}
              
              {/* Legend */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '28px', marginTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#d8dee9' }}></div>
                  <span style={{ fontSize: '15px', color: '#000000', fontWeight: '600' }}>Series A</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#94a3b8' }}></div>
                  <span style={{ fontSize: '15px', color: '#000000', fontWeight: '600' }}>Series B</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#1e293b' }}></div>
                  <span style={{ fontSize: '15px', color: '#000000', fontWeight: '600' }}>Series C</span>
                </div>
              </div>
          </div>

            {/* Note */}
            <div style={{
              fontSize: '12px',
              color: '#666',
              padding: '8px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              border: '1px solid #e9ecef',
              textAlign: 'center'
            }}>
              Return above withdrawal rate: balance keeps growing.
              </div>




        </div>
      </div>
        </>)}

        {/* Traditional IRA tab */}
        {activeTab === 'tradira' && (<>
        {/* 7. Traditional IRA Balance and Withdrawals */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '32px',
          marginBottom: '40px',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}>
          {/* Traditional IRA Balance */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1), 0 4px 16px 0 rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(229, 231, 235, 0.8)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            boxSizing: 'border-box',
            minWidth: 0,
            width: '100%',
            maxWidth: '100%',
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(13, 26, 75, 0.98) 0%, rgba(30, 58, 138, 0.95) 100%)',
              color: 'white',
              padding: '18px 24px',
              borderRadius: '12px',
              marginBottom: '24px',
              fontSize: '16px',
              fontWeight: '700',
              textAlign: 'center',
              letterSpacing: '-0.02em',
              boxShadow: '0 4px 12px 0 rgba(13, 26, 75, 0.25)',
            }}>
              Traditional IRA Balance
              </div>

            {/* Description */}
            <div style={{
              fontSize: '13px',
              color: '#4b5563',
              marginBottom: '24px',
              lineHeight: '1.6',
              padding: '14px 18px',
              backgroundColor: 'rgba(249, 250, 251, 0.8)',
              borderRadius: '10px',
              border: '1px solid rgba(229, 231, 235, 0.6)',
            }}>
              Pre-tax. {formatCurrency(assumptions.scalars.limit_ira, { decimals: 0 })} limit. Taxed at withdrawal. No match.
              </div>

            {/* Key Parameters */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.6)',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>Contribution Start Age</div>
                <input
                  type="number"
                  value={retirementPlanningInputs.contributionStartAge || ''}
                  onChange={(e) => handleRetirementPlanningInputChange('contributionStartAge', e.target.value)}
                  min="0"
                  max="100"
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'right',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {retirementPlanningErrors.contributionStartAge && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.contributionStartAge}
            </div>
                )}
            </div>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.6)',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>Retirement Age</div>
                <input
                  type="number"
                  value={retirementPlanningInputs.retirementAge || ''}
                  onChange={(e) => handleRetirementPlanningInputChange('retirementAge', e.target.value)}
                  min={retirementPlanningInputs.retirementAge || 65}
                  max="100"
                  style={{
                    ...styles.readOnly,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'right',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  readOnly
                />
                {retirementPlanningErrors.retirementAge && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.retirementAge}
            </div>
                )}
          </div>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.6)',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>Annual Rate of Return (%)</div>
                <input
                  type="text"
                  value={retirementPlanningInputs.annualReturnRate ? `${retirementPlanningInputs.annualReturnRate}%` : ''}
                  onChange={(e) => handleRetirementPlanningInputChange('annualReturnRate', e.target.value, e.target)}
                  min="0"
                  max="20"
                  step="0.1"
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'right',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {retirementPlanningErrors.annualReturnRate && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.annualReturnRate}
              </div>
                )}
              </div>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.6)',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>Employer Match (% of your contribution)</div>
                <input
                  type="text"
                  value={retirementPlanningInputs.employerMatchIRA ? `${retirementPlanningInputs.employerMatchIRA}%` : ''}
                  onChange={(e) => handleRetirementPlanningInputChange('employerMatchIRA', e.target.value, e.target)}
                  min="0"
                  max="100"
                  step="0.1"
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'right',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {retirementPlanningErrors.employerMatchIRA && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.employerMatchIRA}
              </div>
                )}
            </div>
          </div>

            {/* Scenarios */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '28px',
              marginBottom: '56px',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '28px 26px',
                borderRadius: '12px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
                textAlign: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                boxSizing: 'border-box',
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px 0 rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(13, 26, 75, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(229, 231, 235, 0.8)';
              }}>
                <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px', color: '#0d1a4b', letterSpacing: '-0.01em' }}>Scenario A</div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '10px', fontWeight: '600' }}>Monthly Payment</div>
                <input
                  type="text"
                  value={monthlyPayments.traditional_ira_a !== '' && monthlyPayments.traditional_ira_a != null ? `${formatCurrency(monthlyPayments.traditional_ira_a)}` : ''}
                  onChange={(e) => handleMonthlyPaymentChange('traditional_ira_a', e.target.value)}
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {monthlyPaymentErrors.traditional_ira_a && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {monthlyPaymentErrors.traditional_ira_a}
              </div>
                )}
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '10px', fontWeight: '500' }}>{calculatePercentageOfPreTaxIncome(monthlyPayments.traditional_ira_a).toFixed(2)}% of Monthly Pre-Tax Income</div>
              </div>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '28px 26px',
                borderRadius: '12px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
                textAlign: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                boxSizing: 'border-box',
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px 0 rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(13, 26, 75, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(229, 231, 235, 0.8)';
              }}>
                <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px', color: '#0d1a4b', letterSpacing: '-0.01em' }}>Scenario B</div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '10px', fontWeight: '600' }}>Monthly Payment</div>
                <input
                  type="text"
                  value={monthlyPayments.traditional_ira_b !== '' && monthlyPayments.traditional_ira_b != null ? `${formatCurrency(monthlyPayments.traditional_ira_b)}` : ''}
                  onChange={(e) => handleMonthlyPaymentChange('traditional_ira_b', e.target.value)}
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {monthlyPaymentErrors.traditional_ira_b && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {monthlyPaymentErrors.traditional_ira_b}
                  </div>
                )}
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '10px', fontWeight: '500' }}>{calculatePercentageOfPreTaxIncome(monthlyPayments.traditional_ira_b).toFixed(2)}% of Monthly Pre-Tax Income</div>
            </div>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '28px 26px',
                borderRadius: '12px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
                textAlign: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                boxSizing: 'border-box',
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px 0 rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(13, 26, 75, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(229, 231, 235, 0.8)';
              }}>
                <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px', color: '#0d1a4b', letterSpacing: '-0.01em' }}>Scenario C</div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '10px', fontWeight: '600' }}>Monthly Payment</div>
                <input
                  type="text"
                  value={monthlyPayments.traditional_ira_c !== '' && monthlyPayments.traditional_ira_c != null ? `${formatCurrency(monthlyPayments.traditional_ira_c)}` : ''}
                  onChange={(e) => handleMonthlyPaymentChange('traditional_ira_c', e.target.value)}
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {monthlyPaymentErrors.traditional_ira_c && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {monthlyPaymentErrors.traditional_ira_c}
                  </div>
                )}
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '10px', fontWeight: '500' }}>{calculatePercentageOfPreTaxIncome(monthlyPayments.traditional_ira_c).toFixed(2)}% of Monthly Pre-Tax Income</div>
        </div>
      </div>

            {/* Traditional IRA Balance vs Age Chart */}
            <div style={{
              backgroundColor: '#f8f9fa',
              border: 'none',
              borderRadius: '6px',
              padding: '16px',
              marginBottom: '16px',
              minHeight: '620px'
            }}>
              <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', textAlign: 'center', color: '#333' }}>
                Traditional IRA Balance vs. Age Chart
              </div>
              {(() => {
                const chartData = generateTraditionalIRAChartData();
                const maxValue = niceAxisMax(Math.max(...chartData.map(d => Math.max(d.seriesA, d.seriesB, d.seriesC))));
                
                // Dynamic Y-axis values based on max value
                const getYAxisValues = (max) => niceAxisTicks(max);
                
                const yAxisValues = getYAxisValues(maxValue);
                const chartWidth = 1100;
                const chartHeight = 520;
                const padding = 24;
                const bottomPad = 72; // room under the plot for tick labels + the "Age" axis title
                const yAxisLabelWidth = 150; // gutter for the rotated y-axis title + whole-dollar tick labels
                const plotWidth = chartWidth - padding - yAxisLabelWidth;
                const plotHeight = chartHeight - padding - bottomPad;
                
                return (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', maxWidth: chartWidth, height: 'auto', overflow: 'visible' }}>
                      {/* Y-axis value labels (horizontal grid lines removed) */}
                      {yAxisValues.map((value, i) => {
                        const ratio = value / maxValue;
                        return (
                          <g key={i}>
                            <text
                              x={yAxisLabelWidth - 12}
                              y={padding + plotHeight * (1 - ratio) + 6}
                              fontSize="16" fontWeight="500"
                              fill="#000000"
                              textAnchor="end"
                            >
                              {formatCurrency(Math.round(value), { decimals: 0 })}
                            </text>
                          </g>
                        );
                      })}
                      
                      {/* Axis lines (line charts only, per house spec) */}
                      <line x1={yAxisLabelWidth} y1={padding} x2={yAxisLabelWidth} y2={padding + plotHeight} stroke="#000000" strokeWidth="1" />
                      <line x1={yAxisLabelWidth} y1={padding + plotHeight} x2={chartWidth} y2={padding + plotHeight} stroke="#000000" strokeWidth="1" />
                      {/* Axis titles */}
                      <text x={yAxisLabelWidth + plotWidth / 2} y={chartHeight - 10} fontSize="17" fontWeight="700" fill="#000000" textAnchor="middle">Age</text>
                      <text transform={`translate(20 ${padding + plotHeight / 2}) rotate(-90)`} fontSize="17" fontWeight="700" fill="#000000" textAnchor="middle">Account Balance</text>

                      {/* Age labels */}
                      {chartData.filter((_, i) => i % 5 === 0).map((d, i) => (
                        <text
                          key={i}
                          x={yAxisLabelWidth + (plotWidth / (chartData.length - 1)) * (chartData.findIndex(item => item.age === d.age))}
                          y={chartHeight - bottomPad + 28}
                          fontSize="16" fontWeight="500"
                          fill="#000000"
                          textAnchor="middle"
                        >
                          {d.age}
                        </text>
                      ))}
                      
                      {/* Series A line */}
                      <polyline
                        points={chartData.map((d, i) => 
                          `${yAxisLabelWidth + (plotWidth / (chartData.length - 1)) * i},${padding + plotHeight * (1 - d.seriesA / maxValue)}`
                        ).join(' ')}
                        fill="none"
                        stroke="#d8dee9"
                        strokeWidth="2"
                      />
                      
                      {/* Series B line */}
                      <polyline
                        points={chartData.map((d, i) => 
                          `${yAxisLabelWidth + (plotWidth / (chartData.length - 1)) * i},${padding + plotHeight * (1 - d.seriesB / maxValue)}`
                        ).join(' ')}
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="2"
                      />
                      
                      {/* Series C line */}
                      <polyline
                        points={chartData.map((d, i) => 
                          `${yAxisLabelWidth + (plotWidth / (chartData.length - 1)) * i},${padding + plotHeight * (1 - d.seriesC / maxValue)}`
                        ).join(' ')}
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                );
              })()}
              
              {/* Legend */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '28px', marginTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#d8dee9' }}></div>
                  <span style={{ fontSize: '15px', color: '#000000', fontWeight: '600' }}>Series A</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#94a3b8' }}></div>
                  <span style={{ fontSize: '15px', color: '#000000', fontWeight: '600' }}>Series B</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#1e293b' }}></div>
                  <span style={{ fontSize: '15px', color: '#000000', fontWeight: '600' }}>Series C</span>
                </div>
              </div>
            </div>

            {/* Series Tables */}
            {selectedTraditionalIRASeries === 'A' && (() => {
              const seriesAData = calculateTraditionalIRASeriesA();
              return (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    padding: '12px',
                    border: '1px solid #e9ecef',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', textAlign: 'center' }}>
                      Traditional IRA Plan - Series A (Accumulation Phase)
            </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#e9ecef' }}>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Age</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Year</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Annual Contribution</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Account Balance (FV)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seriesAData.accumulationData.map((row, index) => (
                            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{row.age}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{row.year}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{formatCurrency(row.annualContribution)}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{formatCurrency(row.accountBalance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {selectedTraditionalIRASeries === 'B' && (() => {
              const seriesBData = calculateTraditionalIRASeriesB();
              return (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    padding: '12px',
                    border: '1px solid #e9ecef',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', textAlign: 'center' }}>
                      Traditional IRA Plan - Series B (Accumulation Phase)
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#e9ecef' }}>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Age</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Year</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Annual Contribution</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Account Balance (FV)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seriesBData.accumulationData.map((row, index) => (
                            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{row.age}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{row.year}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{formatCurrency(row.annualContribution)}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{formatCurrency(row.accountBalance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {selectedTraditionalIRASeries === 'C' && (() => {
              const seriesCData = calculateTraditionalIRASeriesC();
              return (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    padding: '12px',
                    border: '1px solid #e9ecef',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', textAlign: 'center' }}>
                      Traditional IRA Plan - Series C (Accumulation Phase)
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#e9ecef' }}>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Age</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Year</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Annual Contribution</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Account Balance (FV)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seriesCData.accumulationData.map((row, index) => (
                            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{row.age}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{row.year}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{formatCurrency(row.annualContribution)}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{formatCurrency(row.accountBalance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}
            {/* Summary Table */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '14px',
              padding: '24px',
              border: '1px solid rgba(229, 231, 235, 0.8)',
              boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.06)',
            }}>
              <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', textAlign: 'center', color: '#111827', letterSpacing: '-0.02em' }}>
                Summary
            </div>
              <table className="week6-summary-table" style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'left', 
                      backgroundColor: 'rgba(249, 250, 251, 0.8)',
                      borderTop: '1px solid rgba(229, 231, 235, 0.8)',
                      borderLeft: '1px solid rgba(229, 231, 235, 0.8)',
                      borderRight: '2px solid #d1d5db',
                      borderBottom: '2px solid #d1d5db',
                      fontWeight: '700',
                      color: '#374151',
                      fontSize: '12px',
                      whiteSpace: 'nowrap'
                    }}>Metric</th>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'center', 
                      backgroundColor: 'rgba(249, 250, 251, 0.8)',
                      borderTop: '1px solid rgba(229, 231, 235, 0.8)',
                      borderRight: '2px solid #d1d5db',
                      borderBottom: '2px solid #d1d5db',
                      fontWeight: '700',
                      color: '#374151',
                      fontSize: '12px',
                      whiteSpace: 'nowrap'
                    }}>Scenario A</th>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'center', 
                      backgroundColor: 'rgba(249, 250, 251, 0.8)',
                      borderTop: '1px solid rgba(229, 231, 235, 0.8)',
                      borderRight: '2px solid #d1d5db',
                      borderBottom: '2px solid #d1d5db',
                      fontWeight: '700',
                      color: '#374151',
                      fontSize: '12px',
                      whiteSpace: 'nowrap'
                    }}>Scenario B</th>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'center', 
                      backgroundColor: 'rgba(249, 250, 251, 0.8)',
                      borderTop: '1px solid rgba(229, 231, 235, 0.8)',
                      borderRight: '2px solid #d1d5db',
                      borderBottom: '2px solid #d1d5db',
                      fontWeight: '700',
                      color: '#374151',
                      fontSize: '12px',
                      whiteSpace: 'nowrap'
                    }}>Scenario C</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ 
                      padding: '14px 16px', 
                      fontWeight: '600',
                      color: '#4b5563',
                      borderLeft: '1px solid rgba(229, 231, 235, 0.8)',
                      borderRight: '2px solid #d1d5db',
                      borderBottom: '2px solid #d1d5db',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>Future Value Retirement Balance (future $)</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculateTraditionalIRASeriesA().finalBalance, { decimals: 0 })}</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculateTraditionalIRASeriesB().finalBalance, { decimals: 0 })}</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculateTraditionalIRASeriesC().finalBalance, { decimals: 0 })}</td>
                  </tr>
                  <tr>
                    <td style={{ 
                      padding: '14px 16px', 
                      fontWeight: '600',
                      color: '#4b5563',
                      borderLeft: '1px solid rgba(229, 231, 235, 0.8)',
                      borderRight: '2px solid #d1d5db',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>Value in Today's Dollars (discounted at {(inflationRate * 100).toFixed(1)}% inflation)</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculatePresentValue(calculateTraditionalIRASeriesA().finalBalance, (retirementPlanningInputs.retirementAge || 65) - (retirementPlanningInputs.contributionStartAge || 22)), { decimals: 0 })}</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculatePresentValue(calculateTraditionalIRASeriesB().finalBalance, (retirementPlanningInputs.retirementAge || 65) - (retirementPlanningInputs.contributionStartAge || 22)), { decimals: 0 })}</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculatePresentValue(calculateTraditionalIRASeriesC().finalBalance, (retirementPlanningInputs.retirementAge || 65) - (retirementPlanningInputs.contributionStartAge || 22)), { decimals: 0 })}</td>
                  </tr>
            </tbody>
          </table>
          </div>
      </div>

          {/* Traditional IRA Withdrawals */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1), 0 4px 16px 0 rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(229, 231, 235, 0.8)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            boxSizing: 'border-box',
            minWidth: 0,
            width: '100%',
            maxWidth: '100%',
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(13, 26, 75, 0.98) 0%, rgba(30, 58, 138, 0.95) 100%)',
              color: 'white',
              padding: '18px 24px',
              borderRadius: '12px',
              marginBottom: '24px',
              fontSize: '16px',
              fontWeight: '700',
              textAlign: 'center',
              letterSpacing: '-0.02em',
              boxShadow: '0 4px 12px 0 rgba(13, 26, 75, 0.25)',
            }}>
              Traditional IRA Withdrawals
              </div>

            {/* Note */}
            <div style={{
              fontSize: '13px',
              color: '#4b5563',
              marginBottom: '24px',
              lineHeight: '1.6',
              padding: '14px 18px',
              backgroundColor: 'rgba(249, 250, 251, 0.8)',
              borderRadius: '10px',
              border: '1px solid rgba(229, 231, 235, 0.6)',
            }}>
              Balance carries from the left.
              </div>

            {/* RMD Input */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px',
              padding: '16px 20px',
              backgroundColor: 'rgba(249, 250, 251, 0.6)',
              borderRadius: '12px',
              border: '1px solid rgba(229, 231, 235, 0.8)',
            }}>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
                minWidth: '120px',
                width: '120px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
 cursor: 'help'
}}
 onMouseEnter={(e) => termTipRef.current?.show(RMD_DEFINITION, e)}
 onMouseMove={(e) => termTipRef.current?.show(RMD_DEFINITION, e)}
 onMouseLeave={() => termTipRef.current?.hide()}
>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>{renderTermHint('RMD', RMD_DEFINITION)}</div>
                <input
                  type="number"
                  value="75"
                  readOnly
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid rgba(229, 231, 235, 0.6)',
                    borderRadius: '8px',
                    backgroundColor: '#e5e7eb',
                    fontSize: '15px',
                    textAlign: 'center',
                    cursor: 'help',
                    fontWeight: '700',
                    color: '#111827',
                    boxSizing: 'border-box'
                  }}
                />
          </div>
      </div>

            {/* Scenarios */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '28px',
              marginBottom: '56px',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '28px 26px',
                borderRadius: '12px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
                textAlign: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                boxSizing: 'border-box',
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px 0 rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(13, 26, 75, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(229, 231, 235, 0.8)';
              }}
              >
                <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#0d1a4b', letterSpacing: '0.3px' }}>Scenario A</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px', fontWeight: '500' }}>Withdrawal Rate (%)</div>
                <input
                  type="text"
                  value={retirementPlanningInputs.traditionalIRAWithdrawalRateA ? `${retirementPlanningInputs.traditionalIRAWithdrawalRateA}%` : ''}
                  onChange={(e) => handleRetirementPlanningInputChange('traditionalIRAWithdrawalRateA', e.target.value, e.target)}
                  min="0"
                  max="100"
                  step="0.1"
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '10px',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {retirementPlanningErrors.traditionalIRAWithdrawalRateA && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.traditionalIRAWithdrawalRateA}
                  </div>
                )}
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px', marginTop: '12px', fontWeight: '500' }}>Starting Distribution Age</div>
                <input
                  type="number"
                  value={retirementPlanningInputs.traditionalIRAAgeA || 65}
                  onChange={(e) => handleRetirementPlanningInputChange('traditionalIRAAgeA', e.target.value)}
                  min={retirementPlanningInputs.retirementAge || 65}
                  max={rmdStartAge}
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '10px',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {retirementPlanningErrors.traditionalIRAAgeA && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.traditionalIRAAgeA}
                  </div>
                )}
                {renderWithdrawalSummary('traditionalIRA', 'A')}
              </div>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '28px 26px',
                borderRadius: '12px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
                textAlign: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                boxSizing: 'border-box',
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px 0 rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(13, 26, 75, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(229, 231, 235, 0.8)';
              }}
              >
                <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#0d1a4b', letterSpacing: '0.3px' }}>Scenario B</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px', fontWeight: '500' }}>Withdrawal Rate (%)</div>
                <input
                  type="text"
                  value={retirementPlanningInputs.traditionalIRAWithdrawalRateB ? `${retirementPlanningInputs.traditionalIRAWithdrawalRateB}%` : ''}
                  onChange={(e) => handleRetirementPlanningInputChange('traditionalIRAWithdrawalRateB', e.target.value, e.target)}
                  min="0"
                  max="100"
                  step="0.1"
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '10px',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {retirementPlanningErrors.traditionalIRAWithdrawalRateB && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.traditionalIRAWithdrawalRateB}
                  </div>
                )}
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px', marginTop: '12px', fontWeight: '500' }}>Starting Distribution Age</div>
                <input
                  type="number"
                  value={retirementPlanningInputs.traditionalIRAAgeB || 65}
                  onChange={(e) => handleRetirementPlanningInputChange('traditionalIRAAgeB', e.target.value)}
                  min={retirementPlanningInputs.retirementAge || 65}
                  max={rmdStartAge}
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '10px',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {retirementPlanningErrors.traditionalIRAAgeB && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.traditionalIRAAgeB}
                  </div>
                )}
                {renderWithdrawalSummary('traditionalIRA', 'B')}
              </div>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '28px 26px',
                borderRadius: '12px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
                textAlign: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                boxSizing: 'border-box',
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px 0 rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(13, 26, 75, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(229, 231, 235, 0.8)';
              }}
              >
                <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#0d1a4b', letterSpacing: '0.3px' }}>Scenario C</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px', fontWeight: '500' }}>Withdrawal Rate (%)</div>
                <input
                  type="text"
                  value={retirementPlanningInputs.traditionalIRAWithdrawalRateC ? `${retirementPlanningInputs.traditionalIRAWithdrawalRateC}%` : ''}
                  onChange={(e) => handleRetirementPlanningInputChange('traditionalIRAWithdrawalRateC', e.target.value, e.target)}
                  min="0"
                  max="100"
                  step="0.1"
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '10px',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {retirementPlanningErrors.traditionalIRAWithdrawalRateC && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.traditionalIRAWithdrawalRateC}
                  </div>
                )}
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px', marginTop: '12px', fontWeight: '500' }}>Starting Distribution Age</div>
                <input
                  type="number"
                  value={retirementPlanningInputs.traditionalIRAAgeC || 65}
                  onChange={(e) => handleRetirementPlanningInputChange('traditionalIRAAgeC', e.target.value)}
                  min={retirementPlanningInputs.retirementAge || 65}
                  max={rmdStartAge}
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '10px',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {retirementPlanningErrors.traditionalIRAAgeC && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.traditionalIRAAgeC}
                  </div>
                )}
                {renderWithdrawalSummary('traditionalIRA', 'C')}
              </div>
      </div>

            {/* Chart Placeholder */}
            {/* Traditional IRA Withdrawals vs Age Chart */}
            <div style={{
              backgroundColor: '#f8f9fa',
              border: 'none',
              borderRadius: '6px',
              padding: '16px',
              marginBottom: '16px',
              minHeight: '620px'
            }}>
              <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', textAlign: 'center', color: '#333' }}>
                Traditional IRA Annual Withdrawals (Pre-Tax) vs. Age Chart
              </div>
              {(() => {
                const chartData = generateTraditionalIRAWithdrawalsChartData();
                const maxValue = niceAxisMax(Math.max(...chartData.map(d => Math.max(d.seriesA, d.seriesB, d.seriesC))));
                
                // For withdrawal charts, extend Y-axis to double the max value for better visual spacing
                const extendedMaxValue = maxValue;
                
                // Dynamic Y-axis values based on extended max value
                const getYAxisValues = (max) => niceAxisTicks(max);
                
                const yAxisValues = getYAxisValues(extendedMaxValue);
                const chartWidth = 1100;
                const chartHeight = 520;
                const padding = 24;
                const bottomPad = 72; // room under the plot for tick labels + the "Age" axis title
                const yAxisLabelWidth = 150; // gutter for the rotated y-axis title + whole-dollar tick labels
                const plotWidth = chartWidth - padding - yAxisLabelWidth;
                const plotHeight = chartHeight - padding - bottomPad;
                
                return (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', maxWidth: chartWidth, height: 'auto', overflow: 'visible' }}>
                      {/* Y-axis value labels (horizontal grid lines removed) */}
                      {yAxisValues.map((value, i) => {
                        const ratio = value / extendedMaxValue;
                        return (
                          <g key={i}>
                            <text
                              x={yAxisLabelWidth - 12}
                              y={padding + plotHeight * (1 - ratio) + 6}
                              fontSize="16" fontWeight="500"
                              fill="#000000"
                              textAnchor="end"
                            >
                              {formatCurrency(Math.round(value), { decimals: 0 })}
                            </text>
                          </g>
                        );
                      })}
                      
                      {/* Axis titles */}
                      <text x={yAxisLabelWidth + plotWidth / 2} y={chartHeight - 10} fontSize="17" fontWeight="700" fill="#000000" textAnchor="middle">Age</text>
                      <text transform={`translate(20 ${padding + plotHeight / 2}) rotate(-90)`} fontSize="17" fontWeight="700" fill="#000000" textAnchor="middle">Annual Withdrawal (Pre-Tax)</text>

                      {/* Age labels */}
                      {chartData.filter((_, i) => i % 5 === 0).map((d, i) => (
                        <text
                          key={i}
                          x={yAxisLabelWidth + (plotWidth / chartData.length) * (chartData.findIndex(item => item.age === d.age) + 0.5)}
                          y={chartHeight - bottomPad + 28}
                          fontSize="16" fontWeight="500"
                          fill="#000000"
                          textAnchor="middle"
                        >
                          {d.age}
                        </text>
                      ))}
                      
                      {/* Bar chart - Series A, B, C bars for each age */}
                      {chartData.map((d, i) => {
                        const barWidth = (plotWidth / chartData.length) * 0.8; // 80% of available space
                        const barSpacing = (plotWidth / chartData.length) * 0.2; // 20% spacing
                        const x = yAxisLabelWidth + (plotWidth / chartData.length) * i + barSpacing / 2;
                        
                        return (
                          <g key={i}>
                            {/* Series A bar */}
                            <rect
                              x={x}
                              y={padding + plotHeight * (1 - d.seriesA / extendedMaxValue)}
                              width={barWidth / 3}
                              height={plotHeight * (d.seriesA / extendedMaxValue)}
                              fill="#d8dee9"
                              opacity="0.85"
                              rx="2"
                              ry="2"
                            />
                            
                            {/* Series B bar */}
                            <rect
                              x={x + barWidth / 3}
                              y={padding + plotHeight * (1 - d.seriesB / extendedMaxValue)}
                              width={barWidth / 3}
                              height={plotHeight * (d.seriesB / extendedMaxValue)}
                              fill="#94a3b8"
                              opacity="0.85"
                              rx="2"
                              ry="2"
                            />
                            
                            {/* Series C bar */}
                            <rect
                              x={x + 2 * barWidth / 3}
                              y={padding + plotHeight * (1 - d.seriesC / extendedMaxValue)}
                              width={barWidth / 3}
                              height={plotHeight * (d.seriesC / extendedMaxValue)}
                              fill="#1e293b"
                              opacity="0.85"
                              rx="2"
                              ry="2"
                            />
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                );
              })()}
              
              {/* Legend */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '28px', marginTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#d8dee9' }}></div>
                  <span style={{ fontSize: '15px', color: '#000000', fontWeight: '600' }}>Series A</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#666' }}></div>
                  <span style={{ fontSize: '15px', color: '#000000', fontWeight: '600' }}>Series B</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#dc3545' }}></div>
                  <span style={{ fontSize: '15px', color: '#000000', fontWeight: '600' }}>Series C</span>
                </div>
              </div>
            </div>

            {/* Note */}
            <div style={{
              fontSize: '12px',
              color: '#666',
              padding: '8px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              border: '1px solid #e9ecef',
              textAlign: 'center'
            }}>
              Return above withdrawal rate: balance keeps growing.
            </div>




          </div>
        </div>
        </>)}

        {/* Roth IRA tab */}
        {activeTab === 'rothira' && (<>
        {/* 8. Roth IRA Balance and Withdrawals */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '32px',
          marginBottom: '40px',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}>
          {/* Roth IRA Balance */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1), 0 4px 16px 0 rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(229, 231, 235, 0.8)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            boxSizing: 'border-box',
            minWidth: 0,
            width: '100%',
            maxWidth: '100%',
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(13, 26, 75, 0.98) 0%, rgba(30, 58, 138, 0.95) 100%)',
              color: 'white',
              padding: '18px 24px',
              borderRadius: '12px',
              marginBottom: '24px',
              fontSize: '16px',
              fontWeight: '700',
              textAlign: 'center',
              letterSpacing: '-0.02em',
              boxShadow: '0 4px 12px 0 rgba(13, 26, 75, 0.25)',
            }}>
              Roth IRA Balance
              </div>

            {/* Description */}
            <div style={{
              fontSize: '13px',
              color: '#4b5563',
              marginBottom: '24px',
              lineHeight: '1.6',
              padding: '14px 18px',
              backgroundColor: 'rgba(249, 250, 251, 0.8)',
              borderRadius: '10px',
              border: '1px solid rgba(229, 231, 235, 0.6)',
            }}>
              Post-tax. {formatCurrency(assumptions.scalars.limit_ira, { decimals: 0 })} limit. Tax-free withdrawals. No match.
              </div>

            {/* Key Parameters */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.6)',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>Contribution Start Age</div>
                <input
                  type="number"
                  value={retirementPlanningInputs.contributionStartAge || ''}
                  onChange={(e) => handleRetirementPlanningInputChange('contributionStartAge', e.target.value)}
                  min="0"
                  max="100"
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'right',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {retirementPlanningErrors.contributionStartAge && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.contributionStartAge}
            </div>
                )}
            </div>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.6)',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>Retirement Age</div>
                <input
                  type="number"
                  value={retirementPlanningInputs.retirementAge || ''}
                  onChange={(e) => handleRetirementPlanningInputChange('retirementAge', e.target.value)}
                  min={retirementPlanningInputs.retirementAge || 65}
                  max="100"
                  style={{
                    ...styles.readOnly,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'right',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  readOnly
                />
                {retirementPlanningErrors.retirementAge && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.retirementAge}
            </div>
                )}
          </div>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.6)',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>Annual Rate of Return (%)</div>
                <input
                  type="text"
                  value={retirementPlanningInputs.annualReturnRate ? `${retirementPlanningInputs.annualReturnRate}%` : ''}
                  onChange={(e) => handleRetirementPlanningInputChange('annualReturnRate', e.target.value, e.target)}
                  min="0"
                  max="20"
                  step="0.1"
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'right',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {retirementPlanningErrors.annualReturnRate && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.annualReturnRate}
              </div>
                )}
              </div>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.6)',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>Employer Match (% of your contribution)</div>
                <input
                  type="text"
                  value={retirementPlanningInputs.employerMatchIRA ? `${retirementPlanningInputs.employerMatchIRA}%` : ''}
                  onChange={(e) => handleRetirementPlanningInputChange('employerMatchIRA', e.target.value, e.target)}
                  min="0"
                  max="100"
                  step="0.1"
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'right',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {retirementPlanningErrors.employerMatchIRA && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.employerMatchIRA}
              </div>
                )}
            </div>
          </div>

            {/* Scenarios */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '28px',
              marginBottom: '56px',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '28px 26px',
                borderRadius: '12px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
                textAlign: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                boxSizing: 'border-box',
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px 0 rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(13, 26, 75, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(229, 231, 235, 0.8)';
              }}>
                <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px', color: '#0d1a4b', letterSpacing: '-0.01em' }}>Scenario A</div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '10px', fontWeight: '600' }}>Monthly Payment</div>
                <input
                  type="text"
                  value={monthlyPayments.roth_ira_a !== '' && monthlyPayments.roth_ira_a != null ? `${formatCurrency(monthlyPayments.roth_ira_a)}` : ''}
                  onChange={(e) => handleMonthlyPaymentChange('roth_ira_a', e.target.value)}
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {monthlyPaymentErrors.roth_ira_a && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {monthlyPaymentErrors.roth_ira_a}
              </div>
                )}
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '10px', fontWeight: '500' }}>{calculatePercentageOfAfterTaxIncome(monthlyPayments.roth_ira_a).toFixed(2)}% of Monthly After Tax Income</div>
              </div>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '28px 26px',
                borderRadius: '12px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
                textAlign: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                boxSizing: 'border-box',
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px 0 rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(13, 26, 75, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(229, 231, 235, 0.8)';
              }}>
                <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px', color: '#0d1a4b', letterSpacing: '-0.01em' }}>Scenario B</div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '10px', fontWeight: '600' }}>Monthly Payment</div>
                <input
                  type="text"
                  value={monthlyPayments.roth_ira_b !== '' && monthlyPayments.roth_ira_b != null ? `${formatCurrency(monthlyPayments.roth_ira_b)}` : ''}
                  onChange={(e) => handleMonthlyPaymentChange('roth_ira_b', e.target.value)}
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {monthlyPaymentErrors.roth_ira_b && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {monthlyPaymentErrors.roth_ira_b}
                  </div>
                )}
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '10px', fontWeight: '500' }}>{calculatePercentageOfAfterTaxIncome(monthlyPayments.roth_ira_b).toFixed(2)}% of Monthly After Tax Income</div>
            </div>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '28px 26px',
                borderRadius: '12px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
                textAlign: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                boxSizing: 'border-box',
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px 0 rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(13, 26, 75, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(229, 231, 235, 0.8)';
              }}>
                <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px', color: '#0d1a4b', letterSpacing: '-0.01em' }}>Scenario C</div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '10px', fontWeight: '600' }}>Monthly Payment</div>
                <input
                  type="text"
                  value={monthlyPayments.roth_ira_c !== '' && monthlyPayments.roth_ira_c != null ? `${formatCurrency(monthlyPayments.roth_ira_c)}` : ''}
                  onChange={(e) => handleMonthlyPaymentChange('roth_ira_c', e.target.value)}
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {monthlyPaymentErrors.roth_ira_c && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {monthlyPaymentErrors.roth_ira_c}
                  </div>
                )}
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '10px', fontWeight: '500' }}>{calculatePercentageOfAfterTaxIncome(monthlyPayments.roth_ira_c).toFixed(2)}% of Monthly After Tax Income</div>
        </div>
      </div>

            {/* Roth IRA Balance vs Age Chart */}
            <div style={{
              backgroundColor: '#f8f9fa',
              border: 'none',
              borderRadius: '6px',
              padding: '16px',
              marginBottom: '16px',
              minHeight: '620px'
            }}>
              <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', textAlign: 'center', color: '#333' }}>
                Roth IRA Balance vs. Age Chart
              </div>
              {(() => {
                const chartData = generateRothIRAChartData();
                const maxValue = niceAxisMax(Math.max(...chartData.map(d => Math.max(d.seriesA, d.seriesB, d.seriesC))));
                
                // Dynamic Y-axis values based on max value
                const getYAxisValues = (max) => niceAxisTicks(max);
                
                const yAxisValues = getYAxisValues(maxValue);
                const chartWidth = 1100;
                const chartHeight = 520;
                const padding = 24;
                const bottomPad = 72; // room under the plot for tick labels + the "Age" axis title
                const yAxisLabelWidth = 150; // gutter for the rotated y-axis title + whole-dollar tick labels
                const plotWidth = chartWidth - padding - yAxisLabelWidth;
                const plotHeight = chartHeight - padding - bottomPad;
                
                return (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', maxWidth: chartWidth, height: 'auto', overflow: 'visible' }}>
                      {/* Y-axis value labels (horizontal grid lines removed) */}
                      {yAxisValues.map((value, i) => {
                        const ratio = value / maxValue;
                        return (
                          <g key={i}>
                            <text
                              x={yAxisLabelWidth - 12}
                              y={padding + plotHeight * (1 - ratio) + 6}
                              fontSize="16" fontWeight="500"
                              fill="#000000"
                              textAnchor="end"
                            >
                              {formatCurrency(Math.round(value), { decimals: 0 })}
                            </text>
                          </g>
                        );
                      })}
                      
                      {/* Axis lines (line charts only, per house spec) */}
                      <line x1={yAxisLabelWidth} y1={padding} x2={yAxisLabelWidth} y2={padding + plotHeight} stroke="#000000" strokeWidth="1" />
                      <line x1={yAxisLabelWidth} y1={padding + plotHeight} x2={chartWidth} y2={padding + plotHeight} stroke="#000000" strokeWidth="1" />
                      {/* Axis titles */}
                      <text x={yAxisLabelWidth + plotWidth / 2} y={chartHeight - 10} fontSize="17" fontWeight="700" fill="#000000" textAnchor="middle">Age</text>
                      <text transform={`translate(20 ${padding + plotHeight / 2}) rotate(-90)`} fontSize="17" fontWeight="700" fill="#000000" textAnchor="middle">Account Balance</text>

                      {/* Age labels */}
                      {chartData.filter((_, i) => i % 5 === 0).map((d, i) => (
                        <text
                          key={i}
                          x={yAxisLabelWidth + (plotWidth / (chartData.length - 1)) * (chartData.findIndex(item => item.age === d.age))}
                          y={chartHeight - bottomPad + 28}
                          fontSize="16" fontWeight="500"
                          fill="#000000"
                          textAnchor="middle"
                        >
                          {d.age}
                        </text>
                      ))}
                      
                      {/* Series A line */}
                      <polyline
                        points={chartData.map((d, i) => 
                          `${yAxisLabelWidth + (plotWidth / (chartData.length - 1)) * i},${padding + plotHeight * (1 - d.seriesA / maxValue)}`
                        ).join(' ')}
                        fill="none"
                        stroke="#d8dee9"
                        strokeWidth="2"
                      />
                      
                      {/* Series B line */}
                      <polyline
                        points={chartData.map((d, i) => 
                          `${yAxisLabelWidth + (plotWidth / (chartData.length - 1)) * i},${padding + plotHeight * (1 - d.seriesB / maxValue)}`
                        ).join(' ')}
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="2"
                      />
                      
                      {/* Series C line */}
                      <polyline
                        points={chartData.map((d, i) => 
                          `${yAxisLabelWidth + (plotWidth / (chartData.length - 1)) * i},${padding + plotHeight * (1 - d.seriesC / maxValue)}`
                        ).join(' ')}
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                );
              })()}
              
              {/* Legend */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '28px', marginTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#d8dee9' }}></div>
                  <span style={{ fontSize: '15px', color: '#000000', fontWeight: '600' }}>Series A</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#94a3b8' }}></div>
                  <span style={{ fontSize: '15px', color: '#000000', fontWeight: '600' }}>Series B</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#1e293b' }}></div>
                  <span style={{ fontSize: '15px', color: '#000000', fontWeight: '600' }}>Series C</span>
                </div>
              </div>
            </div>


            {/* Series Tables */}
            {selectedRothIRASeries === 'A' && (() => {
              const seriesAData = calculateRothIRASeriesA();
              return (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    padding: '12px',
                    border: '1px solid #e9ecef',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', textAlign: 'center' }}>
                      Roth IRA Plan - Series A (Accumulation Phase)
            </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#e9ecef' }}>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Age</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Year</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Annual Contribution</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Account Balance (FV)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seriesAData.accumulationData.map((row, index) => (
                            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{row.age}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{row.year}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{formatCurrency(row.annualContribution)}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{formatCurrency(row.accountBalance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {selectedRothIRASeries === 'B' && (() => {
              const seriesBData = calculateRothIRASeriesB();
              return (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    padding: '12px',
                    border: '1px solid #e9ecef',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', textAlign: 'center' }}>
                      Roth IRA Plan - Series B (Accumulation Phase)
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#e9ecef' }}>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Age</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Year</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Annual Contribution</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Account Balance (FV)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seriesBData.accumulationData.map((row, index) => (
                            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{row.age}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{row.year}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{formatCurrency(row.annualContribution)}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{formatCurrency(row.accountBalance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {selectedRothIRASeries === 'C' && (() => {
              const seriesCData = calculateRothIRASeriesC();
              return (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    padding: '12px',
                    border: '1px solid #e9ecef',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', textAlign: 'center' }}>
                      Roth IRA Plan - Series C (Accumulation Phase)
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#e9ecef' }}>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Age</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Year</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Annual Contribution</th>
                            <th style={{ borderBottom: '2px solid #c7d0e8', padding: '10px 8px', textAlign: 'center' }}>Account Balance (FV)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seriesCData.accumulationData.map((row, index) => (
                            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{row.age}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{row.year}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{formatCurrency(row.annualContribution)}</td>
                              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{formatCurrency(row.accountBalance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Summary Table */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '14px',
              padding: '24px',
              border: '1px solid rgba(229, 231, 235, 0.8)',
              boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.06)',
            }}>
              <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', textAlign: 'center', color: '#111827', letterSpacing: '-0.02em' }}>
                Summary
            </div>
              <table className="week6-summary-table" style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'left', 
                      backgroundColor: 'rgba(249, 250, 251, 0.8)',
                      borderTop: '1px solid rgba(229, 231, 235, 0.8)',
                      borderLeft: '1px solid rgba(229, 231, 235, 0.8)',
                      borderRight: '2px solid #d1d5db',
                      borderBottom: '2px solid #d1d5db',
                      fontWeight: '700',
                      color: '#374151',
                      fontSize: '12px',
                      whiteSpace: 'nowrap'
                    }}>Metric</th>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'center', 
                      backgroundColor: 'rgba(249, 250, 251, 0.8)',
                      borderTop: '1px solid rgba(229, 231, 235, 0.8)',
                      borderRight: '2px solid #d1d5db',
                      borderBottom: '2px solid #d1d5db',
                      fontWeight: '700',
                      color: '#374151',
                      fontSize: '12px',
                      whiteSpace: 'nowrap'
                    }}>Scenario A</th>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'center', 
                      backgroundColor: 'rgba(249, 250, 251, 0.8)',
                      borderTop: '1px solid rgba(229, 231, 235, 0.8)',
                      borderRight: '2px solid #d1d5db',
                      borderBottom: '2px solid #d1d5db',
                      fontWeight: '700',
                      color: '#374151',
                      fontSize: '12px',
                      whiteSpace: 'nowrap'
                    }}>Scenario B</th>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'center', 
                      backgroundColor: 'rgba(249, 250, 251, 0.8)',
                      borderTop: '1px solid rgba(229, 231, 235, 0.8)',
                      borderRight: '2px solid #d1d5db',
                      borderBottom: '2px solid #d1d5db',
                      fontWeight: '700',
                      color: '#374151',
                      fontSize: '12px',
                      whiteSpace: 'nowrap'
                    }}>Scenario C</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ 
                      padding: '14px 16px', 
                      fontWeight: '600',
                      color: '#4b5563',
                      borderLeft: '1px solid rgba(229, 231, 235, 0.8)',
                      borderRight: '2px solid #d1d5db',
                      borderBottom: '2px solid #d1d5db',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>Future Value Retirement Balance (future $)</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculateRothIRASeriesA().finalBalance, { decimals: 0 })}</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculateRothIRASeriesB().finalBalance, { decimals: 0 })}</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculateRothIRASeriesC().finalBalance, { decimals: 0 })}</td>
                  </tr>
                  <tr>
                    <td style={{ 
                      padding: '14px 16px', 
                      fontWeight: '600',
                      color: '#4b5563',
                      borderLeft: '1px solid rgba(229, 231, 235, 0.8)',
                      borderRight: '2px solid #d1d5db',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>Value in Today's Dollars (discounted at {(inflationRate * 100).toFixed(1)}% inflation)</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculatePresentValue(calculateRothIRASeriesA().finalBalance, (retirementPlanningInputs.retirementAge || 65) - (retirementPlanningInputs.contributionStartAge || 22)), { decimals: 0 })}</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculatePresentValue(calculateRothIRASeriesB().finalBalance, (retirementPlanningInputs.retirementAge || 65) - (retirementPlanningInputs.contributionStartAge || 22)), { decimals: 0 })}</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculatePresentValue(calculateRothIRASeriesC().finalBalance, (retirementPlanningInputs.retirementAge || 65) - (retirementPlanningInputs.contributionStartAge || 22)), { decimals: 0 })}</td>
                  </tr>
          </tbody>
        </table>
            </div>
      </div>

          {/* Roth IRA Withdrawals */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1), 0 4px 16px 0 rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(229, 231, 235, 0.8)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            boxSizing: 'border-box',
            minWidth: 0,
            width: '100%',
            maxWidth: '100%',
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(13, 26, 75, 0.98) 0%, rgba(30, 58, 138, 0.95) 100%)',
              color: 'white',
              padding: '18px 24px',
              borderRadius: '12px',
              marginBottom: '24px',
              fontSize: '16px',
              fontWeight: '700',
              textAlign: 'center',
              letterSpacing: '-0.02em',
              boxShadow: '0 4px 12px 0 rgba(13, 26, 75, 0.25)',
            }}>
              Roth IRA Withdrawals
              </div>

            {/* Note */}
            <div style={{
              fontSize: '13px',
              color: '#4b5563',
              marginBottom: '24px',
              lineHeight: '1.6',
              padding: '14px 18px',
              backgroundColor: 'rgba(249, 250, 251, 0.8)',
              borderRadius: '10px',
              border: '1px solid rgba(229, 231, 235, 0.6)',
            }}>
              Balance carries from the left.
              </div>

            {/* RMD Input */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px',
              padding: '16px 20px',
              backgroundColor: 'rgba(249, 250, 251, 0.6)',
              borderRadius: '12px',
              border: '1px solid rgba(229, 231, 235, 0.8)',
            }}>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
                minWidth: '120px',
                width: '120px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
 cursor: 'help'
}}
 onMouseEnter={(e) => termTipRef.current?.show(RMD_DEFINITION, e)}
 onMouseMove={(e) => termTipRef.current?.show(RMD_DEFINITION, e)}
 onMouseLeave={() => termTipRef.current?.hide()}
>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>{renderTermHint('RMD', RMD_DEFINITION)}</div>
                <input
                  type="text"
                  value="None"
                  readOnly
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid rgba(229, 231, 235, 0.6)',
                    borderRadius: '8px',
                    backgroundColor: '#e5e7eb',
                    fontSize: '15px',
                    textAlign: 'center',
                    cursor: 'help',
                    fontWeight: '700',
                    color: '#111827',
                    boxSizing: 'border-box'
                  }}
                />
          </div>
      </div>

            {/* Scenarios */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '28px',
              marginBottom: '56px',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '28px 26px',
                borderRadius: '12px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
                textAlign: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                boxSizing: 'border-box',
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px 0 rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(13, 26, 75, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(229, 231, 235, 0.8)';
              }}
              >
                <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#0d1a4b', letterSpacing: '0.3px' }}>Scenario A</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px', fontWeight: '500' }}>Withdrawal Rate (%)</div>
                <input
                  type="text"
                  value={retirementPlanningInputs.rothIRAWithdrawalRateA ? `${retirementPlanningInputs.rothIRAWithdrawalRateA}%` : ''}
                  onChange={(e) => handleRetirementPlanningInputChange('rothIRAWithdrawalRateA', e.target.value, e.target)}
                  min="0"
                  max="100"
                  step="0.1"
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '10px',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {retirementPlanningErrors.rothIRAWithdrawalRateA && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.rothIRAWithdrawalRateA}
                  </div>
                )}
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px', marginTop: '12px', fontWeight: '500' }}>Starting Distribution Age</div>
                <input
                  type="number"
                  value={retirementPlanningInputs.rothIRAAgeA || 65}
                  onChange={(e) => handleRetirementPlanningInputChange('rothIRAAgeA', e.target.value)}
                  min={retirementPlanningInputs.retirementAge || 65}
                  max="100"
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '10px',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {retirementPlanningErrors.rothIRAAgeA && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.rothIRAAgeA}
                  </div>
                )}
                {renderWithdrawalSummary('rothIRA', 'A')}
              </div>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '28px 26px',
                borderRadius: '12px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
                textAlign: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                boxSizing: 'border-box',
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px 0 rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(13, 26, 75, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(229, 231, 235, 0.8)';
              }}
              >
                <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#0d1a4b', letterSpacing: '0.3px' }}>Scenario B</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px', fontWeight: '500' }}>Withdrawal Rate (%)</div>
                <input
                  type="text"
                  value={retirementPlanningInputs.rothIRAWithdrawalRateB ? `${retirementPlanningInputs.rothIRAWithdrawalRateB}%` : ''}
                  onChange={(e) => handleRetirementPlanningInputChange('rothIRAWithdrawalRateB', e.target.value, e.target)}
                  min="0"
                  max="100"
                  step="0.1"
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '10px',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {retirementPlanningErrors.rothIRAWithdrawalRateB && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.rothIRAWithdrawalRateB}
                  </div>
                )}
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px', marginTop: '12px', fontWeight: '500' }}>Starting Distribution Age</div>
                <input
                  type="number"
                  value={retirementPlanningInputs.rothIRAAgeB || 65}
                  onChange={(e) => handleRetirementPlanningInputChange('rothIRAAgeB', e.target.value)}
                  min={retirementPlanningInputs.retirementAge || 65}
                  max="100"
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '10px',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {retirementPlanningErrors.rothIRAAgeB && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.rothIRAAgeB}
                  </div>
                )}
                {renderWithdrawalSummary('rothIRA', 'B')}
              </div>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '28px 26px',
                borderRadius: '12px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
                textAlign: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                boxSizing: 'border-box',
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px 0 rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(13, 26, 75, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(229, 231, 235, 0.8)';
              }}
              >
                <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#0d1a4b', letterSpacing: '0.3px' }}>Scenario C</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px', fontWeight: '500' }}>Withdrawal Rate (%)</div>
                <input
                  type="text"
                  value={retirementPlanningInputs.rothIRAWithdrawalRateC ? `${retirementPlanningInputs.rothIRAWithdrawalRateC}%` : ''}
                  onChange={(e) => handleRetirementPlanningInputChange('rothIRAWithdrawalRateC', e.target.value, e.target)}
                  min="0"
                  max="100"
                  step="0.1"
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '10px',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {retirementPlanningErrors.rothIRAWithdrawalRateC && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.rothIRAWithdrawalRateC}
                  </div>
                )}
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px', marginTop: '12px', fontWeight: '500' }}>Starting Distribution Age</div>
                <input
                  type="number"
                  value={retirementPlanningInputs.rothIRAAgeC || 65}
                  onChange={(e) => handleRetirementPlanningInputChange('rothIRAAgeC', e.target.value)}
                  min={retirementPlanningInputs.retirementAge || 65}
                  max="100"
                  style={{
                    ...styles.input,
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '10px',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d1a4b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                    e.target.style.backgroundColor = '#fffef0';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                {retirementPlanningErrors.rothIRAAgeC && (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>
                    {retirementPlanningErrors.rothIRAAgeC}
                  </div>
                )}
                {renderWithdrawalSummary('rothIRA', 'C')}
              </div>
      </div>

            {/* Chart Placeholder */}
            {/* Roth IRA Withdrawals vs Age Chart */}
            <div style={{
              backgroundColor: '#f8f9fa',
              border: 'none',
              borderRadius: '6px',
              padding: '16px',
              marginBottom: '16px',
              minHeight: '620px'
            }}>
              <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', textAlign: 'center', color: '#333' }}>
                Roth IRA Annual Withdrawals (Pre-Tax) vs. Age Chart
              </div>
              {(() => {
                const chartData = generateRothIRAWithdrawalsChartData();
                const maxValue = niceAxisMax(Math.max(...chartData.map(d => Math.max(d.seriesA, d.seriesB, d.seriesC))));
                
                // For withdrawal charts, extend Y-axis to double the max value for better visual spacing
                const extendedMaxValue = maxValue;
                
                // Dynamic Y-axis values based on extended max value
                const getYAxisValues = (max) => niceAxisTicks(max);
                
                const yAxisValues = getYAxisValues(extendedMaxValue);
                const chartWidth = 1100;
                const chartHeight = 520;
                const padding = 24;
                const bottomPad = 72; // room under the plot for tick labels + the "Age" axis title
                const yAxisLabelWidth = 150; // gutter for the rotated y-axis title + whole-dollar tick labels
                const plotWidth = chartWidth - padding - yAxisLabelWidth;
                const plotHeight = chartHeight - padding - bottomPad;
                
                return (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', maxWidth: chartWidth, height: 'auto', overflow: 'visible' }}>
                      {/* Y-axis value labels (horizontal grid lines removed) */}
                      {yAxisValues.map((value, i) => {
                        const ratio = value / extendedMaxValue;
                        return (
                          <g key={i}>
                            <text
                              x={yAxisLabelWidth - 12}
                              y={padding + plotHeight * (1 - ratio) + 6}
                              fontSize="16" fontWeight="500"
                              fill="#000000"
                              textAnchor="end"
                            >
                              {formatCurrency(Math.round(value), { decimals: 0 })}
                            </text>
                          </g>
                        );
                      })}
                      
                      {/* Axis titles */}
                      <text x={yAxisLabelWidth + plotWidth / 2} y={chartHeight - 10} fontSize="17" fontWeight="700" fill="#000000" textAnchor="middle">Age</text>
                      <text transform={`translate(20 ${padding + plotHeight / 2}) rotate(-90)`} fontSize="17" fontWeight="700" fill="#000000" textAnchor="middle">Annual Withdrawal (Pre-Tax)</text>

                      {/* Age labels */}
                      {chartData.filter((_, i) => i % 5 === 0).map((d, i) => (
                        <text
                          key={i}
                          x={yAxisLabelWidth + (plotWidth / chartData.length) * (chartData.findIndex(item => item.age === d.age) + 0.5)}
                          y={chartHeight - bottomPad + 28}
                          fontSize="16" fontWeight="500"
                          fill="#000000"
                          textAnchor="middle"
                        >
                          {d.age}
                        </text>
                      ))}
                      
                      {/* Bar chart - Series A, B, C bars for each age */}
                      {chartData.map((d, i) => {
                        const barWidth = (plotWidth / chartData.length) * 0.8; // 80% of available space
                        const barSpacing = (plotWidth / chartData.length) * 0.2; // 20% spacing
                        const x = yAxisLabelWidth + (plotWidth / chartData.length) * i + barSpacing / 2;
                        
                        return (
                          <g key={i}>
                            {/* Series A bar */}
                            <rect
                              x={x}
                              y={padding + plotHeight * (1 - d.seriesA / extendedMaxValue)}
                              width={barWidth / 3}
                              height={plotHeight * (d.seriesA / extendedMaxValue)}
                              fill="#d8dee9"
                              opacity="0.85"
                              rx="2"
                              ry="2"
                            />
                            
                            {/* Series B bar */}
                            <rect
                              x={x + barWidth / 3}
                              y={padding + plotHeight * (1 - d.seriesB / extendedMaxValue)}
                              width={barWidth / 3}
                              height={plotHeight * (d.seriesB / extendedMaxValue)}
                              fill="#94a3b8"
                              opacity="0.85"
                              rx="2"
                              ry="2"
                            />
                            
                            {/* Series C bar */}
                            <rect
                              x={x + 2 * barWidth / 3}
                              y={padding + plotHeight * (1 - d.seriesC / extendedMaxValue)}
                              width={barWidth / 3}
                              height={plotHeight * (d.seriesC / extendedMaxValue)}
                              fill="#1e293b"
                              opacity="0.85"
                              rx="2"
                              ry="2"
                            />
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                );
              })()}
              
              {/* Legend */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '28px', marginTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#d8dee9' }}></div>
                  <span style={{ fontSize: '15px', color: '#000000', fontWeight: '600' }}>Series A</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#666' }}></div>
                  <span style={{ fontSize: '15px', color: '#000000', fontWeight: '600' }}>Series B</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#dc3545' }}></div>
                  <span style={{ fontSize: '15px', color: '#000000', fontWeight: '600' }}>Series C</span>
                </div>
              </div>
            </div>

            {/* Note */}
            <div style={{
              fontSize: '12px',
              color: '#666',
              padding: '8px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              border: '1px solid #e9ecef',
              textAlign: 'center'
            }}>
              Return above withdrawal rate: balance keeps growing.
            </div>




          </div>
        </div>
        </>)}


          {/* Section Divider */}
          <div style={styles.sectionDivider}></div>

          {/* Save/Load Buttons - enhanced like Week 1/2/3 */}
          <div style={{
            marginTop: '20px', 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '20px',
            padding: '15px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
          }}>
        </div>
        </div>
      </div>
    </>
  );
} 