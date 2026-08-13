import React, { useState, useMemo, useEffect } from 'react';
import { useBudget } from '../contexts/BudgetContext';
import { useAssumptions } from '../contexts/AssumptionsContext';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

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
    background: 'linear-gradient(135deg, rgba(13, 26, 75, 0.95) 0%, rgba(30, 58, 138, 0.9) 100%)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    color: 'white',
    padding: '14px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    textAlign: 'center',
    fontWeight: 600,
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

function simulate401k({
  startAge,
  endAge,
  annualPayment,
  returnRate,
  employerMatch,
  maxContribution,
}) {
  const ages = [];
  const years = [];
  const annualContributions = [];
  const employerMatches = [];
  const totalContributions = [];
  const balances = [];
  let balance = 0;
  let year = 0; // Start from 0 to match Excel
  for (let age = startAge; age <= endAge; age++, year++) {
    ages.push(age);
    years.push(year);
    // Annual contribution logic (capped by maxContribution)
    let contribution = Math.min(annualPayment, maxContribution);
    annualContributions.push(contribution);
    // Employer match
    let match = contribution * (employerMatch / 100);
    employerMatches.push(match);
    // Total contribution
    let total = contribution + match;
    totalContributions.push(total);
    // Account balance (future value)
    balance = balance * (1 + returnRate / 100) + total;
    balances.push(balance);
  }
  return { ages, years, annualContributions, employerMatches, totalContributions, balances };
}

// Helper to get last valid value in array (like Excel INDEX(..., MATCH(1E+99, ...)))
function getLastValid(arr) {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] != null && !isNaN(arr[i])) { // allow 0 as valid
      return arr[i];
    }
  }
  return 0;
}

export default function Week6Retirement() {
  const { topInputs, retirementInputs, setRetirementInputs, userPreTaxInputs, financialCalculations, summaryCalculations, saveBudgetData, loadBudgetData } = useBudget() || {};
  const { assumptions } = useAssumptions();

  const selectedState = topInputs?.location;
  const stateBrackets = selectedState ? (assumptions.stateBrackets[selectedState] || []) : [];

  // Shared input state
  const [startAge, setStartAge] = useState(20);
  const [endAge, setEndAge] = useState(70);
  // Remove maxContribution state, make it computed

  // Series A
  const [annualPaymentA, setAnnualPaymentA] = useState(4638);
  const [returnRateA, setReturnRateA] = useState(7);
  const [employerMatchA, setEmployerMatchA] = useState(3);
  const [withdrawalRateA, setWithdrawalRateA] = useState(6);

  // Series B
  const [annualPaymentB, setAnnualPaymentB] = useState(10000);
  const [returnRateB, setReturnRateB] = useState(7);
  const [employerMatchB, setEmployerMatchB] = useState(3);
  const [withdrawalRateB, setWithdrawalRateB] = useState(6);

  // Series C
  const [annualPaymentC, setAnnualPaymentC] = useState(15353);
  const [returnRateC, setReturnRateC] = useState(7);
  const [employerMatchC, setEmployerMatchC] = useState(3);
  const [withdrawalRateC, setWithdrawalRateC] = useState(6);

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
    traditional401kAgeA: 60, // Traditional 401k Scenario A age
    traditional401kAgeB: 60, // Traditional 401k Scenario B age
    traditional401kAgeC: 60, // Traditional 401k Scenario C age
    roth401kAgeA: 60, // Roth 401k Scenario A age
    roth401kAgeB: 60, // Roth 401k Scenario B age
    roth401kAgeC: 60, // Roth 401k Scenario C age
    startingDistributionAgeA: 60, // Traditional IRA Scenario A age
    traditionalIRAAgeB: 60, // Traditional IRA Scenario B age
    traditionalIRAAgeC: 60, // Traditional IRA Scenario C age
    rothIRAAgeA: 60, // Roth IRA Scenario A age
    rothIRAAgeB: 60, // Roth IRA Scenario B age
    rothIRAAgeC: 60, // Roth IRA Scenario C age
    // Sourced from the Assumptions table (was hardcoded to 75 here, which
    // disagreed with the `|| 73` fallback used elsewhere in this file --
    // see docs/financial-audit-2026-08-11.md).
    rmdAge: assumptions.scalars.rmd_start_age
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

  // Auto-save function (without alert)
  const autoSaveWeek6 = () => {
    try {
      const week6Data = {
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
          setRetirementPlanningInputs(prev => sanitizeRetirementPlanningInputs({
            ...prev,
            ...week6Data.retirementPlanningInputs
          }));
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

  // Force re-calculation of withdrawal data when retirement planning inputs or monthly payments change
  useEffect(() => {
    // This effect will trigger re-renders when retirementPlanningInputs or monthlyPayments change
    // The withdrawal calculation functions will be called again with new values
  }, [retirementPlanningInputs, monthlyPayments]);

  // Calculate maxContribution using the effective take-home rate from Week 1
  const preTaxIncome = Number(topInputs?.preTaxIncome) || 1;
  console.log('preTaxIncome (Week 6):', preTaxIncome);
  
  // Get both after-tax incomes from summaryCalculations
  const suggestedAfterTaxIncome = summaryCalculations?.suggestedAfterTaxIncome || 0;
  const userAfterTaxIncome = summaryCalculations?.userAfterTaxIncome || 0;
  console.log('suggestedAfterTaxIncome (Week 6):', suggestedAfterTaxIncome);
  console.log('userAfterTaxIncome (Week 6):', userAfterTaxIncome);
  
  const effectiveTakeHomeRate = userAfterTaxIncome / preTaxIncome;
  // Was hardcoded to 23500 (the old 2025 401k limit) -- now sourced from
  // the Assumptions table (24500), same source BudgetForm.jsx/Week12.jsx
  // use, closing the three-way disagreement documented in
  // docs/financial-audit-2026-08-11.md finding #14.
  const maxContribution = assumptions.scalars.limit_401k * (effectiveTakeHomeRate);

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

  // Traditional 401k Series A Calculations
  const calculateTraditional401kSeriesA = () => {
    const monthlyPayment = monthlyPayments.traditional_401k_a || 0;
    const annualContribution = monthlyPayment * 12;
    const employerMatchRate = (retirementPlanningInputs.employerMatch401k || 0) / 100;
    const employerMatch = annualContribution * employerMatchRate;
    const totalAnnualContribution = annualContribution + employerMatch;
    const returnRate = (retirementPlanningInputs.annualReturnRate || 7) / 100;
    const startAge = retirementPlanningInputs.contributionStartAge || 22;
    const endAge = retirementPlanningInputs.retirementAge || 65;
    const withdrawalStartAge = parseInt(retirementPlanningInputs.traditional401kAgeA) || 60;
    const withdrawalRate = (retirementPlanningInputs.traditional401kWithdrawalRateA || 4) / 100;

    // Accumulation phase (ages 22-65)
    const accumulationData = [];
    let accountBalance = 0;
    
    for (let age = startAge; age <= endAge; age++) {
      const year = age - startAge;
      if (year === 0) {
        accountBalance = totalAnnualContribution;
      } else {
        accountBalance = accountBalance * (1 + returnRate) + totalAnnualContribution;
      }
      
      accumulationData.push({
        age,
        year,
        annualContribution,
        employerMatch,
        totalContribution: totalAnnualContribution,
        accountBalance: Math.round(accountBalance * 100) / 100
      });
    }

    // Withdrawal phase (ages 60+)
    const withdrawalData = [];
    // Find the balance at withdrawal start age from accumulation phase
    const withdrawalStartAgeIndex = accumulationData.findIndex(item => item.age === withdrawalStartAge);
    let accountBalanceForWithdrawals = withdrawalStartAgeIndex >= 0 ? 
      accumulationData[withdrawalStartAgeIndex].accountBalance : 
      accumulationData[accumulationData.length - 1]?.accountBalance || 0;
    
    
    for (let age = withdrawalStartAge; age <= 109; age++) {
      const year = age;
      const yearIndex = age - withdrawalStartAge;
      
      // Calculate withdrawal using different formulas for first year vs subsequent years:
      // First year: N4*Q9 (no MAX)
      // Subsequent years: MAX(N5*Q9,0)
      const withdrawal = yearIndex === 0 
        ? accountBalanceForWithdrawals * withdrawalRate  // First year: no MAX
        : Math.max(accountBalanceForWithdrawals * withdrawalRate, 0);  // Subsequent years: with MAX
      
      // Store the current year's data
      withdrawalData.push({
        year: age,
        withdrawals: Math.round(withdrawal * 100) / 100,
        accountBalance: Math.round(accountBalanceForWithdrawals * 100) / 100
      });
      
      // Calculate next year's Account Balance For Withdrawals using Excel formula:
      // IF((N5-M5)*(1+ReturnRate)=0,NA(),(N5-M5)*(1+ReturnRate))
      // Where N5 = Previous Year's Account Balance For Withdrawals, M5 = Previous Year's Withdrawals
      const nextYearBalance = (accountBalanceForWithdrawals - withdrawal) * (1 + returnRate);
      
      // Only continue if the result is not zero (Excel's IF condition)
      if (nextYearBalance !== 0) {
        accountBalanceForWithdrawals = nextYearBalance;
      } else {
        // If balance becomes zero, stop the loop (Excel returns NA())
        break;
      }
    }

    return {
      accumulationData,
      withdrawalData,
      finalBalance: accumulationData[accumulationData.length - 1]?.accountBalance || 0
    };
  };

  // Present Value calculation using Excel PV formula
  const calculatePresentValue = (futureValue, yearsFromNow, discountRate = 0.035) => {
    // Excel formula: =ABS(PV(0.035, nper, 0, fv))
    // PV = FV / (1 + rate)^nper
    const presentValue = futureValue / Math.pow(1 + discountRate, yearsFromNow);
    return Math.abs(presentValue);
  };

  // Traditional 401k Series B Calculations
  const calculateTraditional401kSeriesB = () => {
    const monthlyPayment = monthlyPayments.traditional_401k_b || 0;
    const annualContribution = monthlyPayment * 12;
    const employerMatchRate = (retirementPlanningInputs.employerMatch401k || 0) / 100;
    const employerMatch = annualContribution * employerMatchRate;
    const totalAnnualContribution = annualContribution + employerMatch;
    const returnRate = (retirementPlanningInputs.annualReturnRate || 7) / 100;
    const startAge = retirementPlanningInputs.contributionStartAge || 22;
    const endAge = retirementPlanningInputs.retirementAge || 65;
    const withdrawalStartAge = parseInt(retirementPlanningInputs.traditional401kAgeB) || 60;
    const withdrawalRate = (retirementPlanningInputs.traditional401kWithdrawalRateB || 4) / 100;

    // Accumulation phase (ages 22-65)
    const accumulationData = [];
    let accountBalance = 0;
    
    for (let age = startAge; age <= endAge; age++) {
      const year = age - startAge;
      if (year === 0) {
        accountBalance = totalAnnualContribution;
      } else {
        accountBalance = accountBalance * (1 + returnRate) + totalAnnualContribution;
      }
      
      accumulationData.push({
        age,
        year,
        annualContribution,
        employerMatch,
        totalContribution: totalAnnualContribution,
        accountBalance: Math.round(accountBalance * 100) / 100
      });
    }

    // Withdrawal phase (ages 60+)
    const withdrawalData = [];
    // Find the balance at withdrawal start age from accumulation phase
    const withdrawalStartAgeIndex = accumulationData.findIndex(item => item.age === withdrawalStartAge);
    let accountBalanceForWithdrawals = withdrawalStartAgeIndex >= 0 ? 
      accumulationData[withdrawalStartAgeIndex].accountBalance : 
      accumulationData[accumulationData.length - 1]?.accountBalance || 0;
    
    for (let age = withdrawalStartAge; age <= 109; age++) {
      const year = age;
      const yearIndex = age - withdrawalStartAge;
      
      // Calculate withdrawal using different formulas for first year vs subsequent years:
      // First year: N4*Q9 (no MAX)
      // Subsequent years: MAX(N5*Q9,0)
      const withdrawal = yearIndex === 0 
        ? accountBalanceForWithdrawals * withdrawalRate  // First year: no MAX
        : Math.max(accountBalanceForWithdrawals * withdrawalRate, 0);  // Subsequent years: with MAX
      
      // Store the current year's data
      withdrawalData.push({
        year: age,
        withdrawals: Math.round(withdrawal * 100) / 100,
        accountBalance: Math.round(accountBalanceForWithdrawals * 100) / 100
      });
      
      // Calculate next year's Account Balance For Withdrawals using Excel formula:
      // IF((N5-M5)*(1+ReturnRate)=0,NA(),(N5-M5)*(1+ReturnRate))
      // Where N5 = Previous Year's Account Balance For Withdrawals, M5 = Previous Year's Withdrawals
      const nextYearBalance = (accountBalanceForWithdrawals - withdrawal) * (1 + returnRate);
      
      // Only continue if the result is not zero (Excel's IF condition)
      if (nextYearBalance !== 0) {
        accountBalanceForWithdrawals = nextYearBalance;
      } else {
        // If balance becomes zero, stop the loop (Excel returns NA())
        break;
      }
    }

    return {
      accumulationData,
      withdrawalData,
      finalBalance: accumulationData[accumulationData.length - 1]?.accountBalance || 0
    };
  };

  // Traditional 401k Series C Calculations
  const calculateTraditional401kSeriesC = () => {
    const monthlyPayment = monthlyPayments.traditional_401k_c || 0;
    const annualContribution = monthlyPayment * 12;
    const employerMatchRate = (retirementPlanningInputs.employerMatch401k || 0) / 100;
    const employerMatch = annualContribution * employerMatchRate;
    const totalAnnualContribution = annualContribution + employerMatch;
    const returnRate = (retirementPlanningInputs.annualReturnRate || 7) / 100;
    const startAge = retirementPlanningInputs.contributionStartAge || 22;
    const endAge = retirementPlanningInputs.retirementAge || 65;
    const withdrawalStartAge = parseInt(retirementPlanningInputs.traditional401kAgeC) || 60;
    const withdrawalRate = (retirementPlanningInputs.traditional401kWithdrawalRateC || 4) / 100;

    // Accumulation phase (ages 22-65)
    const accumulationData = [];
    let accountBalance = 0;
    
    for (let age = startAge; age <= endAge; age++) {
      const year = age - startAge;
      if (year === 0) {
        accountBalance = totalAnnualContribution;
      } else {
        accountBalance = accountBalance * (1 + returnRate) + totalAnnualContribution;
      }
      
      accumulationData.push({
        age,
        year,
        annualContribution,
        employerMatch,
        totalContribution: totalAnnualContribution,
        accountBalance: Math.round(accountBalance * 100) / 100
      });
    }

    // Withdrawal phase (ages 60+)
    const withdrawalData = [];
    // Find the balance at withdrawal start age from accumulation phase
    const withdrawalStartAgeIndex = accumulationData.findIndex(item => item.age === withdrawalStartAge);
    let accountBalanceForWithdrawals = withdrawalStartAgeIndex >= 0 ? 
      accumulationData[withdrawalStartAgeIndex].accountBalance : 
      accumulationData[accumulationData.length - 1]?.accountBalance || 0;
    
    for (let age = withdrawalStartAge; age <= 109; age++) {
      const year = age;
      const yearIndex = age - withdrawalStartAge;
      
      // Calculate withdrawal using different formulas for first year vs subsequent years:
      // First year: N4*Q9 (no MAX)
      // Subsequent years: MAX(N5*Q9,0)
      const withdrawal = yearIndex === 0 
        ? accountBalanceForWithdrawals * withdrawalRate  // First year: no MAX
        : Math.max(accountBalanceForWithdrawals * withdrawalRate, 0);  // Subsequent years: with MAX
      
      // Store the current year's data
      withdrawalData.push({
        year: age,
        withdrawals: Math.round(withdrawal * 100) / 100,
        accountBalance: Math.round(accountBalanceForWithdrawals * 100) / 100
      });
      
      // Calculate next year's Account Balance For Withdrawals using Excel formula:
      // IF((N5-M5)*(1+ReturnRate)=0,NA(),(N5-M5)*(1+ReturnRate))
      // Where N5 = Previous Year's Account Balance For Withdrawals, M5 = Previous Year's Withdrawals
      const nextYearBalance = (accountBalanceForWithdrawals - withdrawal) * (1 + returnRate);
      
      // Only continue if the result is not zero (Excel's IF condition)
      if (nextYearBalance !== 0) {
        accountBalanceForWithdrawals = nextYearBalance;
      } else {
        // If balance becomes zero, stop the loop (Excel returns NA())
        break;
      }
    }

    return {
      accumulationData,
      withdrawalData,
      finalBalance: accumulationData[accumulationData.length - 1]?.accountBalance || 0
    };
  };

  // Roth 401k Series A Calculations
  const calculateRoth401kSeriesA = () => {
    const monthlyPayment = monthlyPayments.roth_401k_a || 0;
    const annualContribution = monthlyPayment * 12;
    const employerMatchRate = (retirementPlanningInputs.employerMatch401k || 0) / 100;
    const employerMatch = annualContribution * employerMatchRate;
    const totalAnnualContribution = annualContribution + employerMatch;
    const returnRate = (retirementPlanningInputs.annualReturnRate || 7) / 100;
    const startAge = retirementPlanningInputs.contributionStartAge || 22;
    const endAge = retirementPlanningInputs.retirementAge || 65;
    const withdrawalStartAge = parseInt(retirementPlanningInputs.roth401kAgeA) || 60;
    const withdrawalRate = (retirementPlanningInputs.roth401kWithdrawalRateA || 4) / 100;

    // Accumulation phase (ages 22-65)
    const accumulationData = [];
    let accountBalance = 0;
    
    for (let age = startAge; age <= endAge; age++) {
      const year = age - startAge;
      if (year === 0) {
        accountBalance = totalAnnualContribution;
      } else {
        accountBalance = accountBalance * (1 + returnRate) + totalAnnualContribution;
      }
      
      accumulationData.push({
        age,
        year,
        annualContribution,
        employerMatch,
        totalContribution: totalAnnualContribution,
        accountBalance: Math.round(accountBalance * 100) / 100
      });
    }

    // Withdrawal phase (ages 60+)
    const withdrawalData = [];
    // Find the balance at withdrawal start age from accumulation phase
    const withdrawalStartAgeIndex = accumulationData.findIndex(item => item.age === withdrawalStartAge);
    let accountBalanceForWithdrawals = withdrawalStartAgeIndex >= 0 ? 
      accumulationData[withdrawalStartAgeIndex].accountBalance : 
      accumulationData[accumulationData.length - 1]?.accountBalance || 0;
    
    for (let age = withdrawalStartAge; age <= 109; age++) {
      const year = age;
      const yearIndex = age - withdrawalStartAge;
      
      // Calculate withdrawal using different formulas for first year vs subsequent years:
      // First year: N4*Q9 (no MAX)
      // Subsequent years: MAX(N5*Q9,0)
      const withdrawal = yearIndex === 0 
        ? accountBalanceForWithdrawals * withdrawalRate  // First year: no MAX
        : Math.max(accountBalanceForWithdrawals * withdrawalRate, 0);  // Subsequent years: with MAX
      
      // Store the current year's data
      withdrawalData.push({
        year: age,
        withdrawals: Math.round(withdrawal * 100) / 100,
        accountBalance: Math.round(accountBalanceForWithdrawals * 100) / 100
      });
      
      // Calculate next year's Account Balance For Withdrawals using Excel formula:
      // IF((N5-M5)*(1+ReturnRate)=0,NA(),(N5-M5)*(1+ReturnRate))
      // Where N5 = Previous Year's Account Balance For Withdrawals, M5 = Previous Year's Withdrawals
      const nextYearBalance = (accountBalanceForWithdrawals - withdrawal) * (1 + returnRate);
      
      // Only continue if the result is not zero (Excel's IF condition)
      if (nextYearBalance !== 0) {
        accountBalanceForWithdrawals = nextYearBalance;
      } else {
        // If balance becomes zero, stop the loop (Excel returns NA())
        break;
      }
    }

    return {
      accumulationData,
      withdrawalData,
      finalBalance: accumulationData[accumulationData.length - 1]?.accountBalance || 0
    };
  };

  // Roth 401k Series B Calculations
  const calculateRoth401kSeriesB = () => {
    const monthlyPayment = monthlyPayments.roth_401k_b || 0;
    const annualContribution = monthlyPayment * 12;
    const employerMatchRate = (retirementPlanningInputs.employerMatch401k || 0) / 100;
    const employerMatch = annualContribution * employerMatchRate;
    const totalAnnualContribution = annualContribution + employerMatch;
    const returnRate = (retirementPlanningInputs.annualReturnRate || 7) / 100;
    const startAge = retirementPlanningInputs.contributionStartAge || 22;
    const endAge = retirementPlanningInputs.retirementAge || 65;
    const withdrawalStartAge = parseInt(retirementPlanningInputs.roth401kAgeB) || 60;
    const withdrawalRate = (retirementPlanningInputs.roth401kWithdrawalRateB || 4) / 100;

    // Accumulation phase (ages 22-65)
    const accumulationData = [];
    let accountBalance = 0;
    
    for (let age = startAge; age <= endAge; age++) {
      const year = age - startAge;
      if (year === 0) {
        accountBalance = totalAnnualContribution;
      } else {
        accountBalance = accountBalance * (1 + returnRate) + totalAnnualContribution;
      }
      
      accumulationData.push({
        age,
        year,
        annualContribution,
        employerMatch,
        totalContribution: totalAnnualContribution,
        accountBalance: Math.round(accountBalance * 100) / 100
      });
    }

    // Withdrawal phase (ages 60+)
    const withdrawalData = [];
    // Find the balance at withdrawal start age from accumulation phase
    const withdrawalStartAgeIndex = accumulationData.findIndex(item => item.age === withdrawalStartAge);
    let accountBalanceForWithdrawals = withdrawalStartAgeIndex >= 0 ? 
      accumulationData[withdrawalStartAgeIndex].accountBalance : 
      accumulationData[accumulationData.length - 1]?.accountBalance || 0;
    
    for (let age = withdrawalStartAge; age <= 109; age++) {
      const year = age;
      const yearIndex = age - withdrawalStartAge;
      
      // Calculate withdrawal using different formulas for first year vs subsequent years:
      // First year: N4*Q9 (no MAX)
      // Subsequent years: MAX(N5*Q9,0)
      const withdrawal = yearIndex === 0 
        ? accountBalanceForWithdrawals * withdrawalRate  // First year: no MAX
        : Math.max(accountBalanceForWithdrawals * withdrawalRate, 0);  // Subsequent years: with MAX
      
      // Store the current year's data
      withdrawalData.push({
        year: age,
        withdrawals: Math.round(withdrawal * 100) / 100,
        accountBalance: Math.round(accountBalanceForWithdrawals * 100) / 100
      });
      
      // Calculate next year's Account Balance For Withdrawals using Excel formula:
      // IF((N5-M5)*(1+ReturnRate)=0,NA(),(N5-M5)*(1+ReturnRate))
      // Where N5 = Previous Year's Account Balance For Withdrawals, M5 = Previous Year's Withdrawals
      const nextYearBalance = (accountBalanceForWithdrawals - withdrawal) * (1 + returnRate);
      
      // Only continue if the result is not zero (Excel's IF condition)
      if (nextYearBalance !== 0) {
        accountBalanceForWithdrawals = nextYearBalance;
      } else {
        // If balance becomes zero, stop the loop (Excel returns NA())
        break;
      }
    }

    return {
      accumulationData,
      withdrawalData,
      finalBalance: accumulationData[accumulationData.length - 1]?.accountBalance || 0
    };
  };

  // Roth 401k Series C Calculations
  const calculateRoth401kSeriesC = () => {
    const monthlyPayment = monthlyPayments.roth_401k_c || 0;
    const annualContribution = monthlyPayment * 12;
    const employerMatchRate = (retirementPlanningInputs.employerMatch401k || 0) / 100;
    const employerMatch = annualContribution * employerMatchRate;
    const totalAnnualContribution = annualContribution + employerMatch;
    const returnRate = (retirementPlanningInputs.annualReturnRate || 7) / 100;
    const startAge = retirementPlanningInputs.contributionStartAge || 22;
    const endAge = retirementPlanningInputs.retirementAge || 65;
    const withdrawalStartAge = parseInt(retirementPlanningInputs.roth401kAgeC) || 60;
    const withdrawalRate = (retirementPlanningInputs.roth401kWithdrawalRateC || 4) / 100;

    // Accumulation phase (ages 22-65)
    const accumulationData = [];
    let accountBalance = 0;
    
    for (let age = startAge; age <= endAge; age++) {
      const year = age - startAge;
      if (year === 0) {
        accountBalance = totalAnnualContribution;
      } else {
        accountBalance = accountBalance * (1 + returnRate) + totalAnnualContribution;
      }
      
      accumulationData.push({
        age,
        year,
        annualContribution,
        employerMatch,
        totalContribution: totalAnnualContribution,
        accountBalance: Math.round(accountBalance * 100) / 100
      });
    }

    // Withdrawal phase (ages 60+)
    const withdrawalData = [];
    // Find the balance at withdrawal start age from accumulation phase
    const withdrawalStartAgeIndex = accumulationData.findIndex(item => item.age === withdrawalStartAge);
    let accountBalanceForWithdrawals = withdrawalStartAgeIndex >= 0 ? 
      accumulationData[withdrawalStartAgeIndex].accountBalance : 
      accumulationData[accumulationData.length - 1]?.accountBalance || 0;
    
    for (let age = withdrawalStartAge; age <= 109; age++) {
      const year = age;
      const yearIndex = age - withdrawalStartAge;
      
      // Calculate withdrawal using different formulas for first year vs subsequent years:
      // First year: N4*Q9 (no MAX)
      // Subsequent years: MAX(N5*Q9,0)
      const withdrawal = yearIndex === 0 
        ? accountBalanceForWithdrawals * withdrawalRate  // First year: no MAX
        : Math.max(accountBalanceForWithdrawals * withdrawalRate, 0);  // Subsequent years: with MAX
      
      // Store the current year's data
      withdrawalData.push({
        year: age,
        withdrawals: Math.round(withdrawal * 100) / 100,
        accountBalance: Math.round(accountBalanceForWithdrawals * 100) / 100
      });
      
      // Calculate next year's Account Balance For Withdrawals using Excel formula:
      // IF((N5-M5)*(1+ReturnRate)=0,NA(),(N5-M5)*(1+ReturnRate))
      // Where N5 = Previous Year's Account Balance For Withdrawals, M5 = Previous Year's Withdrawals
      const nextYearBalance = (accountBalanceForWithdrawals - withdrawal) * (1 + returnRate);
      
      // Only continue if the result is not zero (Excel's IF condition)
      if (nextYearBalance !== 0) {
        accountBalanceForWithdrawals = nextYearBalance;
      } else {
        // If balance becomes zero, stop the loop (Excel returns NA())
        break;
      }
    }

    return {
      accumulationData,
      withdrawalData,
      finalBalance: accumulationData[accumulationData.length - 1]?.accountBalance || 0
    };
  };

  // Traditional IRA Series A Calculations
  const calculateTraditionalIRASeriesA = () => {
    const monthlyPayment = monthlyPayments.traditional_ira_a || 0;
    const annualContribution = monthlyPayment * 12;
    const returnRate = (retirementPlanningInputs.annualReturnRate || 7) / 100;
    const startAge = retirementPlanningInputs.contributionStartAge || 22;
    const endAge = retirementPlanningInputs.retirementAge || 65;
    const yearsToRetirement = endAge - startAge;

      // Accumulation Phase
      const accumulationData = [];
      let accountBalance = 0;
      
      for (let age = startAge; age <= endAge; age++) {
        const year = age - startAge;
        
        if (year === 0) {
          // First year: Account Balance = Annual Contribution (no compound interest)
          accountBalance = annualContribution;
        } else {
          // Subsequent years: Account Balance (Year n) = Account Balance (Year n-1) × (1 + Return Rate) + Annual Contribution
          accountBalance = accountBalance * (1 + returnRate) + annualContribution;
        }
        
        accumulationData.push({
        age,
        year: year + 1,
        annualContribution,
        employerMatch: 0, // IRA has no employer match
        totalContribution: annualContribution,
        accountBalance: Math.round(accountBalance * 100) / 100
      });
    }

    const finalBalance = accumulationData[accumulationData.length - 1]?.accountBalance || 0;

    // Withdrawal Phase
    const withdrawalStartAge = parseInt(retirementPlanningInputs.traditionalIRAAgeA) || 60;
    const withdrawalRate = (retirementPlanningInputs.traditionalIRAWithdrawalRateA || 4) / 100;
    const withdrawalData = [];
    
    // Find the balance at withdrawal start age from accumulation phase
    const withdrawalStartAgeIndex = accumulationData.findIndex(item => item.age === withdrawalStartAge);
    let accountBalanceForWithdrawals = withdrawalStartAgeIndex >= 0 ? 
      accumulationData[withdrawalStartAgeIndex].accountBalance : 
      accumulationData[accumulationData.length - 1]?.accountBalance || 0;
    
    for (let age = withdrawalStartAge; age <= 109; age++) {
      const year = age;
      const yearIndex = age - withdrawalStartAge;
      
      // Calculate withdrawal using different formulas for first year vs subsequent years:
      // First year: N4*Q9 (no MAX)
      // Subsequent years: MAX(N5*Q9,0)
      const withdrawal = yearIndex === 0 
        ? accountBalanceForWithdrawals * withdrawalRate  // First year: no MAX
        : Math.max(accountBalanceForWithdrawals * withdrawalRate, 0);  // Subsequent years: with MAX
      
      // Store the current year's data
      withdrawalData.push({
        year: age,
        withdrawals: Math.round(withdrawal * 100) / 100,
        remainingBalance: Math.round(accountBalanceForWithdrawals * 100) / 100
      });
      
      // Calculate next year's Account Balance For Withdrawals using Excel formula:
      // IF((N5-M5)*(1+ReturnRate)=0,NA(),(N5-M5)*(1+ReturnRate))
      // Where N5 = Previous Year's Account Balance For Withdrawals, M5 = Previous Year's Withdrawals
      const nextYearBalance = (accountBalanceForWithdrawals - withdrawal) * (1 + returnRate);
      
      // Only continue if the result is not zero (Excel's IF condition)
      if (nextYearBalance !== 0) {
        accountBalanceForWithdrawals = nextYearBalance;
      } else {
        // If balance becomes zero, stop the loop (Excel returns NA())
        break;
      }
    }
    
    return {
      finalBalance: Math.round(finalBalance * 100) / 100,
      accumulationData,
      withdrawalData
    };
  };

  // Traditional IRA Series B Calculations
  const calculateTraditionalIRASeriesB = () => {
    const monthlyPayment = monthlyPayments.traditional_ira_b || 0;
    const annualContribution = monthlyPayment * 12;
    const returnRate = (retirementPlanningInputs.annualReturnRate || 7) / 100;
    const startAge = retirementPlanningInputs.contributionStartAge || 22;
    const endAge = retirementPlanningInputs.retirementAge || 65;
    const yearsToRetirement = endAge - startAge;

      // Accumulation Phase
      const accumulationData = [];
      let accountBalance = 0;
      
      for (let age = startAge; age <= endAge; age++) {
        const year = age - startAge;
        
        if (year === 0) {
          // First year: Account Balance = Annual Contribution (no compound interest)
          accountBalance = annualContribution;
        } else {
          // Subsequent years: Account Balance (Year n) = Account Balance (Year n-1) × (1 + Return Rate) + Annual Contribution
          accountBalance = accountBalance * (1 + returnRate) + annualContribution;
        }
        
        accumulationData.push({
        age,
        year: year + 1,
        annualContribution,
        employerMatch: 0, // IRA has no employer match
        totalContribution: annualContribution,
        accountBalance: Math.round(accountBalance * 100) / 100
      });
    }

    const finalBalance = accumulationData[accumulationData.length - 1]?.accountBalance || 0;

    // Withdrawal Phase
    const withdrawalStartAge = parseInt(retirementPlanningInputs.traditionalIRAAgeB) || 60;
    const withdrawalRate = (retirementPlanningInputs.traditionalIRAWithdrawalRateB || 4) / 100;
    const withdrawalData = [];
    
    // Find the balance at withdrawal start age from accumulation phase
    const withdrawalStartAgeIndex = accumulationData.findIndex(item => item.age === withdrawalStartAge);
    let accountBalanceForWithdrawals = withdrawalStartAgeIndex >= 0 ? 
      accumulationData[withdrawalStartAgeIndex].accountBalance : 
      accumulationData[accumulationData.length - 1]?.accountBalance || 0;
    
    for (let age = withdrawalStartAge; age <= 109; age++) {
      const year = age;
      const yearIndex = age - withdrawalStartAge;
      
      // Calculate withdrawal using different formulas for first year vs subsequent years:
      // First year: N4*Q9 (no MAX)
      // Subsequent years: MAX(N5*Q9,0)
      const withdrawal = yearIndex === 0 
        ? accountBalanceForWithdrawals * withdrawalRate  // First year: no MAX
        : Math.max(accountBalanceForWithdrawals * withdrawalRate, 0);  // Subsequent years: with MAX
      
      // Store the current year's data
      withdrawalData.push({
        year: age,
        withdrawals: Math.round(withdrawal * 100) / 100,
        remainingBalance: Math.round(accountBalanceForWithdrawals * 100) / 100
      });
      
      // Calculate next year's Account Balance For Withdrawals using Excel formula:
      // IF((N5-M5)*(1+ReturnRate)=0,NA(),(N5-M5)*(1+ReturnRate))
      // Where N5 = Previous Year's Account Balance For Withdrawals, M5 = Previous Year's Withdrawals
      const nextYearBalance = (accountBalanceForWithdrawals - withdrawal) * (1 + returnRate);
      
      // Only continue if the result is not zero (Excel's IF condition)
      if (nextYearBalance !== 0) {
        accountBalanceForWithdrawals = nextYearBalance;
      } else {
        // If balance becomes zero, stop the loop (Excel returns NA())
        break;
      }
    }
    
    return {
      finalBalance: Math.round(finalBalance * 100) / 100,
      accumulationData,
      withdrawalData
    };
  };

  // Traditional IRA Series C Calculations
  const calculateTraditionalIRASeriesC = () => {
    const monthlyPayment = monthlyPayments.traditional_ira_c || 0;
    const annualContribution = monthlyPayment * 12;
    const returnRate = (retirementPlanningInputs.annualReturnRate || 7) / 100;
    const startAge = retirementPlanningInputs.contributionStartAge || 22;
    const endAge = retirementPlanningInputs.retirementAge || 65;
    const yearsToRetirement = endAge - startAge;

      // Accumulation Phase
      const accumulationData = [];
      let accountBalance = 0;
      
      for (let age = startAge; age <= endAge; age++) {
        const year = age - startAge;
        
        if (year === 0) {
          // First year: Account Balance = Annual Contribution (no compound interest)
          accountBalance = annualContribution;
        } else {
          // Subsequent years: Account Balance (Year n) = Account Balance (Year n-1) × (1 + Return Rate) + Annual Contribution
          accountBalance = accountBalance * (1 + returnRate) + annualContribution;
        }
        
        accumulationData.push({
        age,
        year: year + 1,
        annualContribution,
        employerMatch: 0, // IRA has no employer match
        totalContribution: annualContribution,
        accountBalance: Math.round(accountBalance * 100) / 100
      });
    }

    const finalBalance = accumulationData[accumulationData.length - 1]?.accountBalance || 0;

    // Withdrawal Phase
    const withdrawalStartAge = parseInt(retirementPlanningInputs.traditionalIRAAgeC) || 60;
    const withdrawalRate = (retirementPlanningInputs.traditionalIRAWithdrawalRateC || 4) / 100;
    const withdrawalData = [];
    
    // Find the balance at withdrawal start age from accumulation phase
    const withdrawalStartAgeIndex = accumulationData.findIndex(item => item.age === withdrawalStartAge);
    let accountBalanceForWithdrawals = withdrawalStartAgeIndex >= 0 ? 
      accumulationData[withdrawalStartAgeIndex].accountBalance : 
      accumulationData[accumulationData.length - 1]?.accountBalance || 0;
    
    for (let age = withdrawalStartAge; age <= 109; age++) {
      const year = age;
      const yearIndex = age - withdrawalStartAge;
      
      // Calculate withdrawal using different formulas for first year vs subsequent years:
      // First year: N4*Q9 (no MAX)
      // Subsequent years: MAX(N5*Q9,0)
      const withdrawal = yearIndex === 0 
        ? accountBalanceForWithdrawals * withdrawalRate  // First year: no MAX
        : Math.max(accountBalanceForWithdrawals * withdrawalRate, 0);  // Subsequent years: with MAX
      
      // Store the current year's data
      withdrawalData.push({
        year: age,
        withdrawals: Math.round(withdrawal * 100) / 100,
        remainingBalance: Math.round(accountBalanceForWithdrawals * 100) / 100
      });
      
      // Calculate next year's Account Balance For Withdrawals using Excel formula:
      // IF((N5-M5)*(1+ReturnRate)=0,NA(),(N5-M5)*(1+ReturnRate))
      // Where N5 = Previous Year's Account Balance For Withdrawals, M5 = Previous Year's Withdrawals
      const nextYearBalance = (accountBalanceForWithdrawals - withdrawal) * (1 + returnRate);
      
      // Only continue if the result is not zero (Excel's IF condition)
      if (nextYearBalance !== 0) {
        accountBalanceForWithdrawals = nextYearBalance;
      } else {
        // If balance becomes zero, stop the loop (Excel returns NA())
        break;
      }
    }
    
    return {
      finalBalance: Math.round(finalBalance * 100) / 100,
      accumulationData,
      withdrawalData
    };
  };

  // Roth IRA Series A Calculations
  const calculateRothIRASeriesA = () => {
    const monthlyPayment = monthlyPayments.roth_ira_a || 0;
    const annualContribution = monthlyPayment * 12;
    const returnRate = (retirementPlanningInputs.annualReturnRate || 7) / 100;
    const startAge = retirementPlanningInputs.contributionStartAge || 22;
    const endAge = retirementPlanningInputs.retirementAge || 65;
    const yearsToRetirement = endAge - startAge;

      // Accumulation Phase
      const accumulationData = [];
      let accountBalance = 0;
      
      for (let age = startAge; age <= endAge; age++) {
        const year = age - startAge;
        
        if (year === 0) {
          // First year: Account Balance = Annual Contribution (no compound interest)
          accountBalance = annualContribution;
        } else {
          // Subsequent years: Account Balance (Year n) = Account Balance (Year n-1) × (1 + Return Rate) + Annual Contribution
          accountBalance = accountBalance * (1 + returnRate) + annualContribution;
        }
        
        accumulationData.push({
        age,
        year: year + 1,
        annualContribution,
        employerMatch: 0, // IRA has no employer match
        totalContribution: annualContribution,
        accountBalance: Math.round(accountBalance * 100) / 100
      });
    }

    const finalBalance = accumulationData[accumulationData.length - 1]?.accountBalance || 0;

    // Withdrawal Phase
    const withdrawalStartAge = parseInt(retirementPlanningInputs.rothIRAAgeA) || 60;
    const withdrawalRate = (retirementPlanningInputs.rothIRAWithdrawalRateA || 4) / 100;
    const withdrawalData = [];
    
    // Find the balance at withdrawal start age from accumulation phase
    const withdrawalStartAgeIndex = accumulationData.findIndex(item => item.age === withdrawalStartAge);
    let accountBalanceForWithdrawals = withdrawalStartAgeIndex >= 0 ? 
      accumulationData[withdrawalStartAgeIndex].accountBalance : 
      accumulationData[accumulationData.length - 1]?.accountBalance || 0;
    
    for (let age = withdrawalStartAge; age <= 109; age++) {
      const year = age;
      const yearIndex = age - withdrawalStartAge;
      
      // Calculate withdrawal using different formulas for first year vs subsequent years:
      // First year: N4*Q9 (no MAX)
      // Subsequent years: MAX(N5*Q9,0)
      const withdrawal = yearIndex === 0 
        ? accountBalanceForWithdrawals * withdrawalRate  // First year: no MAX
        : Math.max(accountBalanceForWithdrawals * withdrawalRate, 0);  // Subsequent years: with MAX
      
      // Store the current year's data
      withdrawalData.push({
        year: age,
        withdrawals: Math.round(withdrawal * 100) / 100,
        remainingBalance: Math.round(accountBalanceForWithdrawals * 100) / 100
      });
      
      // Calculate next year's Account Balance For Withdrawals using Excel formula:
      // IF((N5-M5)*(1+ReturnRate)=0,NA(),(N5-M5)*(1+ReturnRate))
      // Where N5 = Previous Year's Account Balance For Withdrawals, M5 = Previous Year's Withdrawals
      const nextYearBalance = (accountBalanceForWithdrawals - withdrawal) * (1 + returnRate);
      
      // Only continue if the result is not zero (Excel's IF condition)
      if (nextYearBalance !== 0) {
        accountBalanceForWithdrawals = nextYearBalance;
      } else {
        // If balance becomes zero, stop the loop (Excel returns NA())
        break;
      }
    }
    
    return {
      finalBalance: Math.round(finalBalance * 100) / 100,
      accumulationData,
      withdrawalData
    };
  };

  // Roth IRA Series B Calculations
  const calculateRothIRASeriesB = () => {
    const monthlyPayment = monthlyPayments.roth_ira_b || 0;
    const annualContribution = monthlyPayment * 12;
    const returnRate = (retirementPlanningInputs.annualReturnRate || 7) / 100;
    const startAge = retirementPlanningInputs.contributionStartAge || 22;
    const endAge = retirementPlanningInputs.retirementAge || 65;
    const yearsToRetirement = endAge - startAge;

      // Accumulation Phase
      const accumulationData = [];
      let accountBalance = 0;
      
      for (let age = startAge; age <= endAge; age++) {
        const year = age - startAge;
        
        if (year === 0) {
          // First year: Account Balance = Annual Contribution (no compound interest)
          accountBalance = annualContribution;
        } else {
          // Subsequent years: Account Balance (Year n) = Account Balance (Year n-1) × (1 + Return Rate) + Annual Contribution
          accountBalance = accountBalance * (1 + returnRate) + annualContribution;
        }
        
        accumulationData.push({
        age,
        year: year + 1,
        annualContribution,
        employerMatch: 0, // IRA has no employer match
        totalContribution: annualContribution,
        accountBalance: Math.round(accountBalance * 100) / 100
      });
    }

    const finalBalance = accumulationData[accumulationData.length - 1]?.accountBalance || 0;

    // Withdrawal Phase
    const withdrawalStartAge = parseInt(retirementPlanningInputs.rothIRAAgeB) || 60;
    const withdrawalRate = (retirementPlanningInputs.rothIRAWithdrawalRateB || 4) / 100;
    const withdrawalData = [];
    
    // Find the balance at withdrawal start age from accumulation phase
    const withdrawalStartAgeIndex = accumulationData.findIndex(item => item.age === withdrawalStartAge);
    let accountBalanceForWithdrawals = withdrawalStartAgeIndex >= 0 ? 
      accumulationData[withdrawalStartAgeIndex].accountBalance : 
      accumulationData[accumulationData.length - 1]?.accountBalance || 0;
    
    for (let age = withdrawalStartAge; age <= 109; age++) {
      const year = age;
      const yearIndex = age - withdrawalStartAge;
      
      // Calculate withdrawal using different formulas for first year vs subsequent years:
      // First year: N4*Q9 (no MAX)
      // Subsequent years: MAX(N5*Q9,0)
      const withdrawal = yearIndex === 0 
        ? accountBalanceForWithdrawals * withdrawalRate  // First year: no MAX
        : Math.max(accountBalanceForWithdrawals * withdrawalRate, 0);  // Subsequent years: with MAX
      
      // Store the current year's data
      withdrawalData.push({
        year: age,
        withdrawals: Math.round(withdrawal * 100) / 100,
        remainingBalance: Math.round(accountBalanceForWithdrawals * 100) / 100
      });
      
      // Calculate next year's Account Balance For Withdrawals using Excel formula:
      // IF((N5-M5)*(1+ReturnRate)=0,NA(),(N5-M5)*(1+ReturnRate))
      // Where N5 = Previous Year's Account Balance For Withdrawals, M5 = Previous Year's Withdrawals
      const nextYearBalance = (accountBalanceForWithdrawals - withdrawal) * (1 + returnRate);
      
      // Only continue if the result is not zero (Excel's IF condition)
      if (nextYearBalance !== 0) {
        accountBalanceForWithdrawals = nextYearBalance;
      } else {
        // If balance becomes zero, stop the loop (Excel returns NA())
        break;
      }
    }
    
    return {
      finalBalance: Math.round(finalBalance * 100) / 100,
      accumulationData,
      withdrawalData
    };
  };

  // Roth IRA Series C Calculations
  const calculateRothIRASeriesC = () => {
    const monthlyPayment = monthlyPayments.roth_ira_c || 0;
    const annualContribution = monthlyPayment * 12;
    const returnRate = (retirementPlanningInputs.annualReturnRate || 7) / 100;
    const startAge = retirementPlanningInputs.contributionStartAge || 22;
    const endAge = retirementPlanningInputs.retirementAge || 65;
    const yearsToRetirement = endAge - startAge;

      // Accumulation Phase
      const accumulationData = [];
      let accountBalance = 0;
      
      for (let age = startAge; age <= endAge; age++) {
        const year = age - startAge;
        
        if (year === 0) {
          // First year: Account Balance = Annual Contribution (no compound interest)
          accountBalance = annualContribution;
        } else {
          // Subsequent years: Account Balance (Year n) = Account Balance (Year n-1) × (1 + Return Rate) + Annual Contribution
          accountBalance = accountBalance * (1 + returnRate) + annualContribution;
        }
        
        accumulationData.push({
        age,
        year: year + 1,
        annualContribution,
        employerMatch: 0, // IRA has no employer match
        totalContribution: annualContribution,
        accountBalance: Math.round(accountBalance * 100) / 100
      });
    }

    const finalBalance = accumulationData[accumulationData.length - 1]?.accountBalance || 0;

    // Withdrawal Phase
    const withdrawalStartAge = parseInt(retirementPlanningInputs.rothIRAAgeC) || 60;
    const withdrawalRate = (retirementPlanningInputs.rothIRAWithdrawalRateC || 4) / 100;
    const withdrawalData = [];
    
    // Find the balance at withdrawal start age from accumulation phase
    const withdrawalStartAgeIndex = accumulationData.findIndex(item => item.age === withdrawalStartAge);
    let accountBalanceForWithdrawals = withdrawalStartAgeIndex >= 0 ? 
      accumulationData[withdrawalStartAgeIndex].accountBalance : 
      accumulationData[accumulationData.length - 1]?.accountBalance || 0;
    
    for (let age = withdrawalStartAge; age <= 109; age++) {
      const year = age;
      const yearIndex = age - withdrawalStartAge;
      
      // Calculate withdrawal using different formulas for first year vs subsequent years:
      // First year: N4*Q9 (no MAX)
      // Subsequent years: MAX(N5*Q9,0)
      const withdrawal = yearIndex === 0 
        ? accountBalanceForWithdrawals * withdrawalRate  // First year: no MAX
        : Math.max(accountBalanceForWithdrawals * withdrawalRate, 0);  // Subsequent years: with MAX
      
      // Store the current year's data
      withdrawalData.push({
        year: age,
        withdrawals: Math.round(withdrawal * 100) / 100,
        remainingBalance: Math.round(accountBalanceForWithdrawals * 100) / 100
      });
      
      // Calculate next year's Account Balance For Withdrawals using Excel formula:
      // IF((N5-M5)*(1+ReturnRate)=0,NA(),(N5-M5)*(1+ReturnRate))
      // Where N5 = Previous Year's Account Balance For Withdrawals, M5 = Previous Year's Withdrawals
      const nextYearBalance = (accountBalanceForWithdrawals - withdrawal) * (1 + returnRate);
      
      // Only continue if the result is not zero (Excel's IF condition)
      if (nextYearBalance !== 0) {
        accountBalanceForWithdrawals = nextYearBalance;
      } else {
        // If balance becomes zero, stop the loop (Excel returns NA())
        break;
      }
    }
    
    return {
      finalBalance: Math.round(finalBalance * 100) / 100,
      accumulationData,
      withdrawalData
    };
  };

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

  // Calculate PV of First Payment for Traditional 401k
  const calculateTraditional401kPV = (series) => {
    const seriesData = series === 'A' ? calculateTraditional401kSeriesA() : 
                      series === 'B' ? calculateTraditional401kSeriesB() : 
                      calculateTraditional401kSeriesC();
    
    const withdrawalStartAge = series === 'A' ? parseInt(retirementPlanningInputs.traditional401kAgeA) || 60 :
                               series === 'B' ? parseInt(retirementPlanningInputs.traditional401kAgeB) || 60 :
                               parseInt(retirementPlanningInputs.traditional401kAgeC) || 60;
    
    // Find the withdrawal data for the specific withdrawal start age
    const firstWithdrawalData = seriesData.withdrawalData.find(item => item.year === withdrawalStartAge);
    const firstWithdrawal = firstWithdrawalData?.withdrawals || 0;
    const yearsFromNow = withdrawalStartAge - (retirementPlanningInputs.contributionStartAge || 22);
    
    
    return calculatePresentValue(firstWithdrawal, yearsFromNow);
  };

  // Calculate PV of First Payment for Roth 401k
  const calculateRoth401kPV = (series) => {
    const seriesData = series === 'A' ? calculateRoth401kSeriesA() : 
                      series === 'B' ? calculateRoth401kSeriesB() : 
                      calculateRoth401kSeriesC();
    
    const withdrawalStartAge = series === 'A' ? parseInt(retirementPlanningInputs.roth401kAgeA) || 60 :
                               series === 'B' ? parseInt(retirementPlanningInputs.roth401kAgeB) || 60 :
                               parseInt(retirementPlanningInputs.roth401kAgeC) || 60;
    
    // Find the withdrawal data for the specific withdrawal start age
    const firstWithdrawalData = seriesData.withdrawalData.find(item => item.year === withdrawalStartAge);
    const firstWithdrawal = firstWithdrawalData?.withdrawals || 0;
    const yearsFromNow = withdrawalStartAge - (retirementPlanningInputs.contributionStartAge || 22);
    
    return calculatePresentValue(firstWithdrawal, yearsFromNow);
  };

  // Calculate PV of First Payment for Traditional IRA
  const calculateTraditionalIRAPV = (series) => {
    const seriesData = series === 'A' ? calculateTraditionalIRASeriesA() : 
                      series === 'B' ? calculateTraditionalIRASeriesB() : 
                      calculateTraditionalIRASeriesC();
    
    const withdrawalStartAge = series === 'A' ? parseInt(retirementPlanningInputs.traditionalIRAAgeA) || 60 :
                               series === 'B' ? parseInt(retirementPlanningInputs.traditionalIRAAgeB) || 60 :
                               parseInt(retirementPlanningInputs.traditionalIRAAgeC) || 60;
    
    // Find the withdrawal data for the specific withdrawal start age
    const firstWithdrawalData = seriesData.withdrawalData.find(item => item.year === withdrawalStartAge);
    const firstWithdrawal = firstWithdrawalData?.withdrawals || 0;
    const yearsFromNow = withdrawalStartAge - (retirementPlanningInputs.contributionStartAge || 22);
    
    return calculatePresentValue(firstWithdrawal, yearsFromNow);
  };

  // Calculate PV of First Payment for Roth IRA
  const calculateRothIRAPV = (series) => {
    const seriesData = series === 'A' ? calculateRothIRASeriesA() : 
                      series === 'B' ? calculateRothIRASeriesB() : 
                      calculateRothIRASeriesC();
    
    const withdrawalStartAge = series === 'A' ? parseInt(retirementPlanningInputs.rothIRAAgeA) || 60 :
                               series === 'B' ? parseInt(retirementPlanningInputs.rothIRAAgeB) || 60 :
                               parseInt(retirementPlanningInputs.rothIRAAgeC) || 60;
    
    // Find the withdrawal data for the specific withdrawal start age
    const firstWithdrawalData = seriesData.withdrawalData.find(item => item.year === withdrawalStartAge);
    const firstWithdrawal = firstWithdrawalData?.withdrawals || 0;
    const yearsFromNow = withdrawalStartAge - (retirementPlanningInputs.contributionStartAge || 22);
    
    return calculatePresentValue(firstWithdrawal, yearsFromNow);
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

  // Generate chart data for Traditional 401k Withdrawals vs Age
  const generateTraditional401kWithdrawalsChartData = () => {
    const seriesAData = calculateTraditional401kSeriesA();
    const seriesBData = calculateTraditional401kSeriesB();
    const seriesCData = calculateTraditional401kSeriesC();
    
    const chartData = [];
    const withdrawalStartAgeA = retirementPlanningInputs.traditional401kAgeA || 60;
    const withdrawalStartAgeB = retirementPlanningInputs.traditional401kAgeB || 60;
    const withdrawalStartAgeC = retirementPlanningInputs.traditional401kAgeC || 60;
    
    // Find the earliest withdrawal start age
    const earliestStartAge = Math.min(withdrawalStartAgeA, withdrawalStartAgeB, withdrawalStartAgeC);
    
    // Generate data from earliest start age to 100
    for (let age = earliestStartAge; age <= 100; age++) {
      const yearA = age - withdrawalStartAgeA;
      const yearB = age - withdrawalStartAgeB;
      const yearC = age - withdrawalStartAgeC;
      
      const seriesAWithdrawal = yearA >= 0 && seriesAData.withdrawalData[yearA] ? seriesAData.withdrawalData[yearA].withdrawals : 0;
      const seriesBWithdrawal = yearB >= 0 && seriesBData.withdrawalData[yearB] ? seriesBData.withdrawalData[yearB].withdrawals : 0;
      const seriesCWithdrawal = yearC >= 0 && seriesCData.withdrawalData[yearC] ? seriesCData.withdrawalData[yearC].withdrawals : 0;
      
      chartData.push({
        age,
        seriesA: Math.round(seriesAWithdrawal),
        seriesB: Math.round(seriesBWithdrawal),
        seriesC: Math.round(seriesCWithdrawal)
      });
    }
    
    return chartData;
  };

  // Generate chart data for Roth 401k Withdrawals vs Age
  const generateRoth401kWithdrawalsChartData = () => {
    const seriesAData = calculateRoth401kSeriesA();
    const seriesBData = calculateRoth401kSeriesB();
    const seriesCData = calculateRoth401kSeriesC();
    
    const chartData = [];
    const withdrawalStartAgeA = retirementPlanningInputs.roth401kAgeA || 60;
    const withdrawalStartAgeB = retirementPlanningInputs.roth401kAgeB || 60;
    const withdrawalStartAgeC = retirementPlanningInputs.roth401kAgeC || 60;
    
    // Find the earliest withdrawal start age
    const earliestStartAge = Math.min(withdrawalStartAgeA, withdrawalStartAgeB, withdrawalStartAgeC);
    
    // Generate data from earliest start age to 100
    for (let age = earliestStartAge; age <= 100; age++) {
      const yearA = age - withdrawalStartAgeA;
      const yearB = age - withdrawalStartAgeB;
      const yearC = age - withdrawalStartAgeC;
      
      const seriesAWithdrawal = yearA >= 0 && seriesAData.withdrawalData[yearA] ? seriesAData.withdrawalData[yearA].withdrawals : 0;
      const seriesBWithdrawal = yearB >= 0 && seriesBData.withdrawalData[yearB] ? seriesBData.withdrawalData[yearB].withdrawals : 0;
      const seriesCWithdrawal = yearC >= 0 && seriesCData.withdrawalData[yearC] ? seriesCData.withdrawalData[yearC].withdrawals : 0;
      
      chartData.push({
        age,
        seriesA: Math.round(seriesAWithdrawal),
        seriesB: Math.round(seriesBWithdrawal),
        seriesC: Math.round(seriesCWithdrawal)
      });
    }
    
    return chartData;
  };

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
  const generateTraditionalIRAWithdrawalsChartData = () => {
    const seriesAData = calculateTraditionalIRASeriesA();
    const seriesBData = calculateTraditionalIRASeriesB();
    const seriesCData = calculateTraditionalIRASeriesC();
    
    const chartData = [];
    const withdrawalStartAgeA = parseInt(retirementPlanningInputs.traditionalIRAAgeA) || 60;
    const withdrawalStartAgeB = parseInt(retirementPlanningInputs.traditionalIRAAgeB) || 60;
    const withdrawalStartAgeC = parseInt(retirementPlanningInputs.traditionalIRAAgeC) || 60;
    
    // Find the earliest withdrawal start age
    const earliestStartAge = Math.min(withdrawalStartAgeA, withdrawalStartAgeB, withdrawalStartAgeC);
    
    // Generate data from earliest start age to 100
    for (let age = earliestStartAge; age <= 100; age++) {
      const yearA = age - withdrawalStartAgeA;
      const yearB = age - withdrawalStartAgeB;
      const yearC = age - withdrawalStartAgeC;
      
      const seriesAWithdrawal = yearA >= 0 && seriesAData.withdrawalData[yearA] ? seriesAData.withdrawalData[yearA].withdrawals : 0;
      const seriesBWithdrawal = yearB >= 0 && seriesBData.withdrawalData[yearB] ? seriesBData.withdrawalData[yearB].withdrawals : 0;
      const seriesCWithdrawal = yearC >= 0 && seriesCData.withdrawalData[yearC] ? seriesCData.withdrawalData[yearC].withdrawals : 0;
      
      chartData.push({
        age,
        seriesA: Math.round(seriesAWithdrawal),
        seriesB: Math.round(seriesBWithdrawal),
        seriesC: Math.round(seriesCWithdrawal)
      });
    }
    
    return chartData;
  };

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
  const generateRothIRAWithdrawalsChartData = () => {
    const seriesAData = calculateRothIRASeriesA();
    const seriesBData = calculateRothIRASeriesB();
    const seriesCData = calculateRothIRASeriesC();
    
    const chartData = [];
    const withdrawalStartAgeA = parseInt(retirementPlanningInputs.rothIRAAgeA) || 60;
    const withdrawalStartAgeB = parseInt(retirementPlanningInputs.rothIRAAgeB) || 60;
    const withdrawalStartAgeC = parseInt(retirementPlanningInputs.rothIRAAgeC) || 60;
    
    // Find the earliest withdrawal start age
    const earliestStartAge = Math.min(withdrawalStartAgeA, withdrawalStartAgeB, withdrawalStartAgeC);
    
    // Generate data from earliest start age to 100
    for (let age = earliestStartAge; age <= 100; age++) {
      const yearA = age - withdrawalStartAgeA;
      const yearB = age - withdrawalStartAgeB;
      const yearC = age - withdrawalStartAgeC;
      
      const seriesAWithdrawal = yearA >= 0 && seriesAData.withdrawalData[yearA] ? seriesAData.withdrawalData[yearA].withdrawals : 0;
      const seriesBWithdrawal = yearB >= 0 && seriesBData.withdrawalData[yearB] ? seriesBData.withdrawalData[yearB].withdrawals : 0;
      const seriesCWithdrawal = yearC >= 0 && seriesCData.withdrawalData[yearC] ? seriesCData.withdrawalData[yearC].withdrawals : 0;
      
      chartData.push({
        age,
        seriesA: Math.round(seriesAWithdrawal),
        seriesB: Math.round(seriesBWithdrawal),
        seriesC: Math.round(seriesCWithdrawal)
      });
    }
    
    return chartData;
  };

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
      setRetirementPlanningInputs(prev => ({
        ...prev,
        contributionStartAge: updatedInputs.contributionStartAge,
        retirementAge: updatedInputs.retirementAge
      }));
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
      // Traditional IRA ages are limited by RMD age
      if (key.startsWith('traditionalIRA')) {
        const rmdAge = parseFloat(retirementPlanningInputs.rmdAge) || assumptions.scalars.rmd_start_age;
        if (numValue <= 30 || numValue > rmdAge) {
          errorMessage = `Starting Distribution Age must be between 31 and ${rmdAge} years.`;
        }
      } 
      // Roth IRA ages are limited to 100
      else if (key.startsWith('rothIRA')) {
        if (numValue <= 30 || numValue > 100) {
          errorMessage = `Starting Distribution Age must be between 31 and 100 years.`;
        }
      }
      // Traditional and Roth 401k ages are limited by RMD age
      else {
        const rmdAge = parseFloat(retirementPlanningInputs.rmdAge) || assumptions.scalars.rmd_start_age;
        if (numValue <= 30 || numValue > rmdAge) {
          errorMessage = `Starting Distribution Age must be between 31 and ${rmdAge} years.`;
        }
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
  const simA = useMemo(() => {
    // For Series A, annual contribution is annualPaymentA / effectiveTakeHomeRate (Excel logic)
    const customSimulate401kA = ({
      startAge,
      endAge,
      annualPayment,
      returnRate,
      employerMatch,
      maxContribution,
      effectiveTakeHomeRate
    }) => {
      const ages = [];
      const years = [];
      const annualContributions = [];
      const employerMatches = [];
      const totalContributions = [];
      const balances = [];
      let balance = 0;
      let year = 0;
      // Calculate the fixed annual contribution for all years
      const fixedContribution = annualPayment / effectiveTakeHomeRate;
      for (let age = startAge; age <= endAge; age++, year++) {
        ages.push(age);
        years.push(year);
        // Round annual contribution
        const roundedContribution = Number(fixedContribution.toFixed(2));
        annualContributions.push(roundedContribution);
        // Round employer match
        let match = Number((roundedContribution * (employerMatch / 100)).toFixed(2));
        employerMatches.push(match);
        // Total contribution, rounded
        let total;
        if (roundedContribution === "" || match === "") {
          total = "";
          totalContributions.push("");
        } else {
          total = Number((roundedContribution + match).toFixed(2));
          totalContributions.push(total);
        }
        // Account balance (future value), rounded
        if (total === "") {
          balances.push("");
        } else {
          balance = Number((balance * (1 + returnRate / 100) + total).toFixed(2));
          balances.push(balance);
        }
      }
      return { ages, years, annualContributions, employerMatches, totalContributions, balances };
    };
    return customSimulate401kA({
      startAge,
      endAge,
      annualPayment: annualPaymentA,
      returnRate: returnRateA,
      employerMatch: employerMatchA,
      maxContribution,
      effectiveTakeHomeRate
    });
  }, [startAge, endAge, annualPaymentA, returnRateA, employerMatchA, maxContribution, effectiveTakeHomeRate]);

  // Series B and C remain unchanged for now
  const simB = useMemo(() => {
    const ages = [];
    const years = [];
    const annualContributions = [];
    const employerMatches = [];
    const totalContributions = [];
    const balances = [];
    let balance = 0;
    let year = 0;
    // Calculate the fixed annual contribution for all years (Excel logic)
    const fixedContribution = annualPaymentB / effectiveTakeHomeRate;
    for (let age = startAge; age <= endAge; age++, year++) {
      ages.push(age);
      years.push(year);
      // Round annual contribution
      const roundedContribution = Number(fixedContribution.toFixed(2));
      annualContributions.push(roundedContribution);
      // Round employer match
      let match = Number((roundedContribution * (employerMatchB / 100)).toFixed(2));
      employerMatches.push(match);
      // Total contribution, rounded
      let total;
      if (roundedContribution === "" || match === "") {
        total = "";
        totalContributions.push("");
      } else {
        total = Number((roundedContribution + match).toFixed(2));
        totalContributions.push(total);
      }
      // Account balance (future value), rounded
      if (total === "") {
        balances.push("");
      } else {
        balance = Number((balance * (1 + returnRateB / 100) + total).toFixed(2));
        balances.push(balance);
      }
    }
    return { ages, years, annualContributions, employerMatches, totalContributions, balances };
  }, [startAge, endAge, annualPaymentB, returnRateB, employerMatchB, maxContribution, effectiveTakeHomeRate]);

  const simC = useMemo(() => {
    const ages = [];
    const years = [];
    const annualContributions = [];
    const employerMatches = [];
    const totalContributions = [];
    const balances = [];
    let balance = 0;
    let year = 0;
    // Calculate the fixed annual contribution for all years (Excel logic)
    const fixedContribution = annualPaymentC / effectiveTakeHomeRate;
    for (let age = startAge; age <= endAge; age++, year++) {
      ages.push(age);
      years.push(year);
      // Round annual contribution
      const roundedContribution = Number(fixedContribution.toFixed(2));
      annualContributions.push(roundedContribution);
      // Round employer match
      let match = Number((roundedContribution * (employerMatchC / 100)).toFixed(2));
      employerMatches.push(match);
      // Total contribution, rounded
      let total;
      if (roundedContribution === "" || match === "") {
        total = "";
        totalContributions.push("");
      } else {
        total = Number((roundedContribution + match).toFixed(2));
        totalContributions.push(total);
      }
      // Account balance (future value), rounded
      if (total === "") {
        balances.push("");
      } else {
        balance = Number((balance * (1 + returnRateC / 100) + total).toFixed(2));
        balances.push(balance);
      }
    }
    return { ages, years, annualContributions, employerMatches, totalContributions, balances };
  }, [startAge, endAge, annualPaymentC, returnRateC, employerMatchC, maxContribution, effectiveTakeHomeRate]);

  // Final balances (last valid value)
  const finalBalanceA = getLastValid(simA.balances);
  const finalBalanceB = getLastValid(simB.balances);
  const finalBalanceC = getLastValid(simC.balances);

  // Chart data
  const chartData = {
    labels: simA.ages,
    datasets: [
      {
        label: 'Series A',
        data: simA.balances,
        borderColor: '#d8dee9',
        backgroundColor: 'rgba(216,222,233,0.45)',
        tension: 0.2,
      },
      {
        label: 'Series B',
        data: simB.balances,
        borderColor: '#94a3b8',
        backgroundColor: 'rgba(148,163,184,0.3)',
        tension: 0.2,
      },
      {
        label: 'Series C',
        data: simC.balances,
        borderColor: '#1e293b',
        backgroundColor: 'rgba(30,41,59,0.3)',
        tension: 0.2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Traditional 401(k) Balance vs. Age' },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        }
      }
    }
  };

  // formatCurrency/formatPercent now come from src/utils/formatters.js (module import above).


  // Section header style for all section titles
  const sectionHeaderStyle = {
    fontSize: '18px',
    fontWeight: 700,
    color: '#002060',
    margin: '0 0 18px 0',
    padding: 0,
    fontFamily: 'inherit',
    letterSpacing: 0,
    lineHeight: 1.3,
  };

  // Simple section header style to match Week 1
  const simpleHeaderStyle = {
    fontSize: '18px',
    fontWeight: 700,
    color: '#002060',
    margin: '0 0 18px 0',
    padding: 0,
    fontFamily: 'inherit',
    letterSpacing: 0,
    lineHeight: 1.3,
  };

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

      <div style={styles.container} className="week6-retirement-page">
        <div style={styles.sectionContainer} className="week6-main-surface">
            {/* Enhanced Header */}
        <div style={styles.enhancedHeader}>
              <span style={{ fontSize: '26px', letterSpacing: '-0.02em' }}>Retirement Planning</span>
            </div>

        {/* Info Box - matching Week 2/3 styling */}
        <div style={styles.infoBox} className="week6-info-surface">
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#0d1a4b" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <div>
            <strong>How it works:</strong> Enter your retirement planning inputs and monthly payments. The calculator will show you how your retirement accounts will grow over time and how much you can withdraw during retirement.
          </div>
            </div>

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
                    marginBottom: '8px'
                  }}>
                    Traditional 401(k)
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#666',
                    lineHeight: '1.4'
                  }}>
                    Pre-tax. Employer-sponsored. $23,500 limit. No taxes now, taxed at withdrawal. Employer match available.
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
                <div style={{fontWeight: '600', fontSize: '14px', marginBottom: '8px'}}>
                  Roth 401(k)
      </div>
                <div style={{fontSize: '12px', color: '#666', lineHeight: '1.4'}}>
                  Post-tax. Employer-sponsored. $23,500 limit. Pay taxes now, withdraw tax-free. Employer match common; goes into pre-tax 401(k).
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
                <div style={{fontWeight: '600', fontSize: '14px', marginBottom: '8px'}}>
                  Traditional IRA
      </div>
                <div style={{fontSize: '12px', color: '#666', lineHeight: '1.4'}}>
                  Pre-tax. Individual account. $7,000 limit &lt;50 y/o &amp; &lt;$150,000 income. Lowers taxes now, taxed at withdrawal. No employer match.
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
                <div style={{fontWeight: '600', fontSize: '14px', marginBottom: '8px'}}>
                  Roth IRA
              </div>
                <div style={{fontSize: '12px', color: '#666', lineHeight: '1.4'}}>
                  Post-tax. Individual account. $7,000 limit &lt;50 yo &amp; &lt;$150,000 income. Tax-free growth and withdrawals. No employer match.
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
            Monthly Deferral Calculator
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
          <div style={{
            fontSize: '13px',
            color: '#666',
            fontStyle: 'italic',
            textAlign: 'center',
            marginTop: '16px',
            padding: '6px 12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            border: '1px solid #e9ecef'
          }}>
            Note: Adjust Week 1 Budget based on this week's insights
            </div>
              </div>

        {/* 5. Traditional 401(k) Balance and Withdrawals */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
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
              Pre-tax. Employer-sponsored. $23,500 limit. No taxes now, taxed at withdrawal. Employer match available.
              </div>

            {/* Key Parameters */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.6)',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contribution Start Age</div>
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
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Retirement Age</div>
                <input
                  type="number"
                  value={retirementPlanningInputs.retirementAge || ''}
                  onChange={(e) => handleRetirementPlanningInputChange('retirementAge', e.target.value)}
                  min="31"
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
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Annual Rate of Return (%)</div>
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
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employer Match (%)</div>
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
              gap: '16px',
              marginBottom: '24px',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '18px',
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
                padding: '18px',
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
                padding: '18px',
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
              border: '1px solid rgba(229, 231, 235, 0.8)',
              borderRadius: '14px',
              padding: '28px',
              marginBottom: '24px',
              minHeight: '380px',
              boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.06)',
            }}>
              <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', textAlign: 'center', color: '#111827', letterSpacing: '-0.02em' }}>
                Traditional 401(k) Balance vs. Age Chart
              </div>
              {(() => {
                const chartData = generateTraditional401kChartData();
                const maxValue = Math.max(...chartData.map(d => Math.max(d.seriesA, d.seriesB, d.seriesC)));
                
                // Dynamic Y-axis values based on max value
                const getYAxisValues = (max) => {
                  if (max === 0) return [0];
                  
                  // Calculate nice intervals
                  const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
                  const normalized = max / magnitude;
                  
                  let step;
                  if (normalized <= 1) step = 0.2;
                  else if (normalized <= 2) step = 0.5;
                  else if (normalized <= 5) step = 1;
                  else step = 2;
                  
                  step *= magnitude;
                  const steps = Math.ceil(max / step);
                  
                  const values = [];
                  for (let i = 0; i <= steps; i++) {
                    values.push(i * step);
                  }
                  return values;
                };
                
                const yAxisValues = getYAxisValues(maxValue);
                const chartWidth = 500;
                const chartHeight = 250;
                const padding = 20;
                const yAxisLabelWidth = 60; // Space for Y-axis labels
                const plotWidth = chartWidth - padding - yAxisLabelWidth;
                const plotHeight = chartHeight - 2 * padding;
                
                return (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <svg width={chartWidth} height={chartHeight} style={{ border: '1px solid #ddd', borderRadius: '4px' }}>
                      {/* Y-axis value labels (horizontal grid lines removed) */}
                      {yAxisValues.map((value, i) => {
                        const ratio = value / maxValue;
                        return (
                          <g key={i}>
                            <text
                              x={yAxisLabelWidth - 5}
                              y={padding + plotHeight * (1 - ratio) + 4}
                              fontSize="10"
                              fill="#666"
                              textAnchor="end"
                            >
                              {formatCurrency(Math.round(value))}
                            </text>
                          </g>
                        );
                      })}
                      
                      {/* Age labels */}
                      {chartData.filter((_, i) => i % 5 === 0).map((d, i) => (
                        <text
                          key={i}
                          x={yAxisLabelWidth + (plotWidth / (chartData.length - 1)) * (chartData.findIndex(item => item.age === d.age))}
                          y={chartHeight - padding + 15}
                          fontSize="10"
                          fill="#666"
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
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '2px', backgroundColor: '#d8dee9' }}></div>
                  <span style={{ fontSize: '11px', color: '#666' }}>Series A</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '2px', backgroundColor: '#94a3b8' }}></div>
                  <span style={{ fontSize: '11px', color: '#666' }}>Series B</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '2px', backgroundColor: '#1e293b' }}></div>
                  <span style={{ fontSize: '11px', color: '#666' }}>Series C</span>
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
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#e9ecef' }}>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Age</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Year</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Annual Contribution</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Employer Match</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Total Contribution</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Account Balance (FV)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seriesAData.accumulationData.slice(0, 20).map((row, index) => (
                            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{row.age}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{row.year}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'right' }}>{formatCurrency(row.annualContribution)}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'right' }}>{formatCurrency(row.employerMatch)}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'right' }}>{formatCurrency(row.totalContribution)}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(row.accountBalance)}</td>
                            </tr>
                          ))}
                          {seriesAData.accumulationData.length > 20 && (
                            <tr>
                              <td colSpan="6" style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center', fontStyle: 'italic' }}>
                                ... and {seriesAData.accumulationData.length - 20} more rows
                              </td>
                            </tr>
                          )}
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
              <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'separate', borderSpacing: '0' }}>
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
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
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
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
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
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
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
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
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
                    }}>Future Value Retirement Balance</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculateTraditional401kSeriesA().finalBalance)}</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculateTraditional401kSeriesB().finalBalance)}</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculateTraditional401kSeriesC().finalBalance)}</td>
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
                    }}>Value in Today's Dollars</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculatePresentValue(calculateTraditional401kSeriesA().finalBalance, (retirementPlanningInputs.retirementAge || 65) - (retirementPlanningInputs.contributionStartAge || 22)))}</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculatePresentValue(calculateTraditional401kSeriesB().finalBalance, (retirementPlanningInputs.retirementAge || 65) - (retirementPlanningInputs.contributionStartAge || 22)))}</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculatePresentValue(calculateTraditional401kSeriesC().finalBalance, (retirementPlanningInputs.retirementAge || 65) - (retirementPlanningInputs.contributionStartAge || 22)))}</td>
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
              Note: Withdrawal Balance calculated from previous Traditional 401(k) Balance (left)
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
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#e9ecef' }}>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Year</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Withdrawals</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Account Balance For Withdrawals</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seriesAData.withdrawalData.slice(0, 20).map((row, index) => (
                            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{row.year}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(row.withdrawals)}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(row.accountBalance)}</td>
                            </tr>
                          ))}
                          {seriesAData.withdrawalData.length > 20 && (
                            <tr>
                              <td colSpan="3" style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center', fontStyle: 'italic' }}>
                                ... and {seriesAData.withdrawalData.length - 20} more rows
                              </td>
                            </tr>
                          )}
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
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#e9ecef' }}>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Year</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Withdrawals</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Account Balance For Withdrawals</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seriesBData.withdrawalData.slice(0, 20).map((row, index) => (
                            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{row.year}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(row.withdrawals)}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(row.accountBalance)}</td>
                            </tr>
                          ))}
                          {seriesBData.withdrawalData.length > 20 && (
                            <tr>
                              <td colSpan="3" style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center', fontStyle: 'italic' }}>
                                ... and {seriesBData.withdrawalData.length - 20} more rows
                              </td>
                            </tr>
                          )}
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
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#e9ecef' }}>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Year</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Withdrawals</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Account Balance For Withdrawals</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seriesCData.withdrawalData.slice(0, 20).map((row, index) => (
                            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{row.year}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(row.withdrawals)}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(row.accountBalance)}</td>
                            </tr>
                          ))}
                          {seriesCData.withdrawalData.length > 20 && (
                            <tr>
                              <td colSpan="3" style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center', fontStyle: 'italic' }}>
                                ... and {seriesCData.withdrawalData.length - 20} more rows
                              </td>
                            </tr>
                          )}
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
                justifyContent: 'center'
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>RMD</div>
                <input
                  type="number"
                  value={retirementPlanningInputs.rmdAge || ''}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid rgba(229, 231, 235, 0.6)',
                    borderRadius: '8px',
                    backgroundColor: '#e5e7eb',
                    fontSize: '15px',
                    textAlign: 'center',
                    cursor: 'not-allowed',
                    fontWeight: '700',
                    color: '#111827',
                    boxSizing: 'border-box'
                  }}
                />
          </div>
              <div style={{
                fontSize: '13px',
                color: '#4b5563',
                flex: 1,
                fontWeight: '500',
                lineHeight: '1.6',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '4px'
              }}>
                RMD: Required Minimum Distribution (last start age for withdrawals) - Fixed at 75
        </div>
      </div>

            {/* Scenarios */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              marginBottom: '24px',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '18px',
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
                  value={retirementPlanningInputs.traditional401kAgeA || 60}
                  onChange={(e) => handleRetirementPlanningInputChange('traditional401kAgeA', e.target.value)}
                  min="31"
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
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '12px', fontWeight: '500' }}>PV of First Payment: {formatCurrency(calculateTraditional401kPV('A'))}</div>
              </div>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '18px',
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
                  value={retirementPlanningInputs.traditional401kAgeB || 60}
                  onChange={(e) => handleRetirementPlanningInputChange('traditional401kAgeB', e.target.value)}
                  min="31"
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
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '12px', fontWeight: '500' }}>PV of First Payment: {formatCurrency(calculateTraditional401kPV('B'))}</div>
              </div>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '18px',
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
                  value={retirementPlanningInputs.traditional401kAgeC || 60}
                  onChange={(e) => handleRetirementPlanningInputChange('traditional401kAgeC', e.target.value)}
                  min="31"
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
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '12px', fontWeight: '500' }}>PV of First Payment: {formatCurrency(calculateTraditional401kPV('C'))}</div>
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
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#e9ecef' }}>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Age</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Year</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Annual Contribution</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Employer Match</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Total Contribution</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Account Balance (FV)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seriesBData.accumulationData.slice(0, 20).map((row, index) => (
                            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{row.age}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{row.year}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'right' }}>{formatCurrency(row.annualContribution)}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'right' }}>{formatCurrency(row.employerMatch)}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'right' }}>{formatCurrency(row.totalContribution)}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(row.accountBalance)}</td>
                            </tr>
                          ))}
                          {seriesBData.accumulationData.length > 20 && (
                            <tr>
                              <td colSpan="6" style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center', fontStyle: 'italic' }}>
                                ... and {seriesBData.accumulationData.length - 20} more rows
                              </td>
                            </tr>
                          )}
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
              border: '1px solid rgba(229, 231, 235, 0.8)',
              borderRadius: '14px',
              padding: '28px',
              marginBottom: '24px',
              minHeight: '380px',
              boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.06)',
            }}>
              <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', textAlign: 'center', color: '#111827', letterSpacing: '-0.02em' }}>
                Traditional 401(k) Withdrawals vs. Age Chart
              </div>
              {(() => {
                const chartData = generateTraditional401kWithdrawalsChartData();
                const maxValue = Math.max(...chartData.map(d => Math.max(d.seriesA, d.seriesB, d.seriesC)));
                
                // For withdrawal charts, extend Y-axis to double the max value for better visual spacing
                const extendedMaxValue = maxValue * 2;
                
                // Dynamic Y-axis values based on extended max value
                const getYAxisValues = (max) => {
                  if (max === 0) return [0];
                  
                  // Calculate nice intervals - aim for 5-6 steps
                  const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
                  const normalized = max / magnitude;
                  
                  let step;
                  if (normalized <= 1) step = 0.2;
                  else if (normalized <= 2) step = 0.4;
                  else if (normalized <= 5) step = 1;
                  else if (normalized <= 10) step = 2;
                  else step = 5;
                  
                  step *= magnitude;
                  
                  // Ensure we have 5-6 steps
                  const numSteps = Math.ceil(max / step);
                  if (numSteps < 4) {
                    step = max / 5;
                  } else if (numSteps > 8) {
                    step = max / 6;
                  }
                  
                  const values = [];
                  for (let i = 0; i <= Math.ceil(max / step); i++) {
                    const value = i * step;
                    if (value <= max) {
                      values.push(value);
                    }
                  }
                  return values;
                };
                
                const yAxisValues = getYAxisValues(extendedMaxValue);
                const chartWidth = 500;
                const chartHeight = 250;
                const padding = 20;
                const yAxisLabelWidth = 60; // Space for Y-axis labels
                const plotWidth = chartWidth - padding - yAxisLabelWidth;
                const plotHeight = chartHeight - 2 * padding;
                
                return (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <svg width={chartWidth} height={chartHeight} style={{ border: '1px solid #ddd', borderRadius: '4px' }}>
                      {/* Y-axis value labels (horizontal grid lines removed) */}
                      {yAxisValues.map((value, i) => {
                        const ratio = value / extendedMaxValue;
                        return (
                          <g key={i}>
                            <text
                              x={yAxisLabelWidth - 5}
                              y={padding + plotHeight * (1 - ratio) + 4}
                              fontSize="10"
                              fill="#666"
                              textAnchor="end"
                            >
                              {formatCurrency(Math.round(value))}
                            </text>
                          </g>
                        );
                      })}
                      
                      {/* Age labels */}
                      {chartData.filter((_, i) => i % 5 === 0).map((d, i) => (
                        <text
                          key={i}
                          x={yAxisLabelWidth + (plotWidth / (chartData.length - 1)) * (chartData.findIndex(item => item.age === d.age))}
                          y={chartHeight - padding + 15}
                          fontSize="10"
                          fill="#666"
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
                              opacity="0.8"
                            />
                            
                            {/* Series B bar */}
                            <rect
                              x={x + barWidth / 3}
                              y={padding + plotHeight * (1 - d.seriesB / extendedMaxValue)}
                              width={barWidth / 3}
                              height={plotHeight * (d.seriesB / extendedMaxValue)}
                              fill="#94a3b8"
                              opacity="0.8"
                            />
                            
                            {/* Series C bar */}
                            <rect
                              x={x + 2 * barWidth / 3}
                              y={padding + plotHeight * (1 - d.seriesC / extendedMaxValue)}
                              width={barWidth / 3}
                              height={plotHeight * (d.seriesC / extendedMaxValue)}
                              fill="#1e293b"
                              opacity="0.8"
                            />
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                );
              })()}
              
              {/* Legend */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '2px', backgroundColor: '#d8dee9' }}></div>
                  <span style={{ fontSize: '11px', color: '#666' }}>Series A</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '2px', backgroundColor: '#94a3b8' }}></div>
                  <span style={{ fontSize: '11px', color: '#666' }}>Series B</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '2px', backgroundColor: '#1e293b' }}></div>
                  <span style={{ fontSize: '11px', color: '#666' }}>Series C</span>
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
              Note: If the Annual Rate of Return is larger than Withdrawal Rate, your portfolio will increase forever!
              </div>
            </div>
          </div>

        {/* 6. Roth 401(k) Balance and Withdrawals */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
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
              Post-tax. Employer-sponsored. $23,500 limit. Pay taxes now, withdraw tax-free. Employer match common; goes into pre-tax 401(k).
              </div>

            {/* Key Parameters */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.6)',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contribution Start Age</div>
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
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Retirement Age</div>
                <input
                  type="number"
                  value={retirementPlanningInputs.retirementAge || ''}
                  onChange={(e) => handleRetirementPlanningInputChange('retirementAge', e.target.value)}
                  min="31"
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
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Annual Rate of Return (%)</div>
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
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employer Match (%)</div>
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
              gap: '16px',
              marginBottom: '24px',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '18px',
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
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monthly Payment</div>
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
                padding: '18px',
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
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monthly Payment</div>
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
                padding: '18px',
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
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monthly Payment</div>
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
              border: '1px solid #e9ecef',
              borderRadius: '6px',
              padding: '16px',
              marginBottom: '16px',
              minHeight: '350px'
            }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', textAlign: 'center', color: '#333' }}>
                Roth 401(k) Balance vs. Age Chart
      </div>
              {(() => {
                const chartData = generateRoth401kChartData();
                const maxValue = Math.max(...chartData.map(d => Math.max(d.seriesA, d.seriesB, d.seriesC)));
                
                // Dynamic Y-axis values based on max value
                const getYAxisValues = (max) => {
                  if (max === 0) return [0];
                  
                  // Calculate nice intervals
                  const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
                  const normalized = max / magnitude;
                  
                  let step;
                  if (normalized <= 1) step = 0.2;
                  else if (normalized <= 2) step = 0.5;
                  else if (normalized <= 5) step = 1;
                  else step = 2;
                  
                  step *= magnitude;
                  const steps = Math.ceil(max / step);
                  
                  const values = [];
                  for (let i = 0; i <= steps; i++) {
                    values.push(i * step);
                  }
                  return values;
                };
                
                const yAxisValues = getYAxisValues(maxValue);
                const chartWidth = 500;
                const chartHeight = 250;
                const padding = 20;
                const yAxisLabelWidth = 60; // Space for Y-axis labels
                const plotWidth = chartWidth - padding - yAxisLabelWidth;
                const plotHeight = chartHeight - 2 * padding;
                
                return (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <svg width={chartWidth} height={chartHeight} style={{ border: '1px solid #ddd', borderRadius: '4px' }}>
                      {/* Y-axis value labels (horizontal grid lines removed) */}
                      {yAxisValues.map((value, i) => {
                        const ratio = value / maxValue;
                        return (
                          <g key={i}>
                            <text
                              x={yAxisLabelWidth - 5}
                              y={padding + plotHeight * (1 - ratio) + 4}
                              fontSize="10"
                              fill="#666"
                              textAnchor="end"
                            >
                              {formatCurrency(Math.round(value))}
                            </text>
                          </g>
                        );
                      })}
                      
                      {/* Age labels */}
                      {chartData.filter((_, i) => i % 5 === 0).map((d, i) => (
                        <text
                          key={i}
                          x={yAxisLabelWidth + (plotWidth / (chartData.length - 1)) * (chartData.findIndex(item => item.age === d.age))}
                          y={chartHeight - padding + 15}
                          fontSize="10"
                          fill="#666"
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
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '2px', backgroundColor: '#d8dee9' }}></div>
                  <span style={{ fontSize: '11px', color: '#666' }}>Series A</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '2px', backgroundColor: '#94a3b8' }}></div>
                  <span style={{ fontSize: '11px', color: '#666' }}>Series B</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '2px', backgroundColor: '#1e293b' }}></div>
                  <span style={{ fontSize: '11px', color: '#666' }}>Series C</span>
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
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#e9ecef' }}>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Age</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Year</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Annual Contribution</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Employer Match</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Total Contribution</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Account Balance (FV)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seriesAData.accumulationData.slice(0, 20).map((row, index) => (
                            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{row.age}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{row.year}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{formatCurrency(row.annualContribution)}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{formatCurrency(row.employerMatch)}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{formatCurrency(row.totalContribution)}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{formatCurrency(row.accountBalance)}</td>
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
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#e9ecef' }}>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Age</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Year</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Annual Contribution</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Employer Match</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Total Contribution</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Account Balance (FV)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seriesBData.accumulationData.slice(0, 20).map((row, index) => (
                            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{row.age}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{row.year}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{formatCurrency(row.annualContribution)}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{formatCurrency(row.employerMatch)}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{formatCurrency(row.totalContribution)}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{formatCurrency(row.accountBalance)}</td>
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
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#e9ecef' }}>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Age</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Year</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Annual Contribution</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Employer Match</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Total Contribution</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Account Balance (FV)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seriesCData.accumulationData.slice(0, 20).map((row, index) => (
                            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{row.age}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{row.year}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{formatCurrency(row.annualContribution)}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{formatCurrency(row.employerMatch)}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{formatCurrency(row.totalContribution)}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{formatCurrency(row.accountBalance)}</td>
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
              <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'separate', borderSpacing: '0' }}>
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
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
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
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
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
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
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
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
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
                    }}>Future Value Retirement Balance</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculateRoth401kSeriesA().finalBalance)}</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculateRoth401kSeriesB().finalBalance)}</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculateRoth401kSeriesC().finalBalance)}</td>
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
                    }}>Value in Today's Dollars</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculatePresentValue(calculateRoth401kSeriesA().finalBalance, (retirementPlanningInputs.retirementAge || 65) - (retirementPlanningInputs.contributionStartAge || 22)))}</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculatePresentValue(calculateRoth401kSeriesB().finalBalance, (retirementPlanningInputs.retirementAge || 65) - (retirementPlanningInputs.contributionStartAge || 22)))}</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculatePresentValue(calculateRoth401kSeriesC().finalBalance, (retirementPlanningInputs.retirementAge || 65) - (retirementPlanningInputs.contributionStartAge || 22)))}</td>
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
              Note: Withdrawal Balance calculated from previous Roth 401(k) Balance (left)
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
                justifyContent: 'center'
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>RMD</div>
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
                    cursor: 'not-allowed',
                    fontWeight: '700',
                    color: '#111827',
                    boxSizing: 'border-box'
                  }}
                />
          </div>
              <div style={{
                fontSize: '13px',
                color: '#4b5563',
                flex: 1,
                fontWeight: '500',
                lineHeight: '1.6',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '4px'
              }}>
                RMD: Required Minimum Distribution (last start age for withdrawals) - Fixed at 75
        </div>
      </div>

            {/* Scenarios */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              marginBottom: '24px',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '18px',
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
                  value={retirementPlanningInputs.roth401kAgeA || 60}
                  onChange={(e) => handleRetirementPlanningInputChange('roth401kAgeA', e.target.value)}
                  min="31"
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
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '12px', fontWeight: '500' }}>PV of First Payment: {formatCurrency(calculateRoth401kPV('A'))}</div>
              </div>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '18px',
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
                  value={retirementPlanningInputs.roth401kAgeB || 60}
                  onChange={(e) => handleRetirementPlanningInputChange('roth401kAgeB', e.target.value)}
                  min="31"
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
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '12px', fontWeight: '500' }}>PV of First Payment: {formatCurrency(calculateRoth401kPV('B'))}</div>
              </div>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '18px',
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
                  value={retirementPlanningInputs.roth401kAgeC || 60}
                  onChange={(e) => handleRetirementPlanningInputChange('roth401kAgeC', e.target.value)}
                  min="31"
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
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '12px', fontWeight: '500' }}>PV of First Payment: {formatCurrency(calculateRoth401kPV('C'))}</div>
              </div>
      </div>

            {/* Chart */}
            <div style={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: '6px',
              padding: '16px',
              marginBottom: '16px',
              minHeight: '350px'
            }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', textAlign: 'center', color: '#333' }}>
                Roth 401(k) Withdrawals vs. Age Chart
            </div>
              {(() => {
                const chartData = generateRoth401kWithdrawalsChartData();
                const maxValue = Math.max(...chartData.map(d => Math.max(d.seriesA, d.seriesB, d.seriesC)));
                
                // For withdrawal charts, extend Y-axis to double the max value for better visual spacing
                const extendedMaxValue = maxValue * 2;
                
                // Dynamic Y-axis values based on extended max value
                const getYAxisValues = (max) => {
                  if (max === 0) return [0];
                  
                  // Calculate nice intervals - aim for 5-6 steps
                  const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
                  const normalized = max / magnitude;
                  
                  let step;
                  if (normalized <= 1) step = 0.2;
                  else if (normalized <= 2) step = 0.4;
                  else if (normalized <= 5) step = 1;
                  else if (normalized <= 10) step = 2;
                  else step = 5;
                  
                  step *= magnitude;
                  
                  // Ensure we have 5-6 steps
                  const numSteps = Math.ceil(max / step);
                  if (numSteps < 4) {
                    step = max / 5;
                  } else if (numSteps > 8) {
                    step = max / 6;
                  }
                  
                  const values = [];
                  for (let i = 0; i <= Math.ceil(max / step); i++) {
                    const value = i * step;
                    if (value <= max) {
                      values.push(value);
                    }
                  }
                  return values;
                };
                
                const yAxisValues = getYAxisValues(extendedMaxValue);
                const chartWidth = 500;
                const chartHeight = 250;
                const padding = 20;
                const yAxisLabelWidth = 60; // Space for Y-axis labels
                const plotWidth = chartWidth - padding - yAxisLabelWidth;
                const plotHeight = chartHeight - 2 * padding;
                
                return (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <svg width={chartWidth} height={chartHeight} style={{ border: '1px solid #ddd', borderRadius: '4px' }}>
                      {/* Y-axis value labels (horizontal grid lines removed) */}
                      {yAxisValues.map((value, i) => {
                        const ratio = value / extendedMaxValue;
                        return (
                          <g key={i}>
                            <text
                              x={yAxisLabelWidth - 5}
                              y={padding + plotHeight * (1 - ratio) + 4}
                              fontSize="10"
                              fill="#666"
                              textAnchor="end"
                            >
                              {formatCurrency(Math.round(value))}
                            </text>
                          </g>
                        );
                      })}
                      
                      {/* Age labels */}
                      {chartData.filter((_, i) => i % 5 === 0).map((d, i) => (
                        <text
                          key={i}
                          x={yAxisLabelWidth + (plotWidth / (chartData.length - 1)) * (chartData.findIndex(item => item.age === d.age))}
                          y={chartHeight - padding + 15}
                          fontSize="10"
                          fill="#666"
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
                              opacity="0.8"
                            />
                            
                            {/* Series B bar */}
                            <rect
                              x={x + barWidth / 3}
                              y={padding + plotHeight * (1 - d.seriesB / extendedMaxValue)}
                              width={barWidth / 3}
                              height={plotHeight * (d.seriesB / extendedMaxValue)}
                              fill="#94a3b8"
                              opacity="0.8"
                            />
                            
                            {/* Series C bar */}
                            <rect
                              x={x + 2 * barWidth / 3}
                              y={padding + plotHeight * (1 - d.seriesC / extendedMaxValue)}
                              width={barWidth / 3}
                              height={plotHeight * (d.seriesC / extendedMaxValue)}
                              fill="#1e293b"
                              opacity="0.8"
                            />
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                );
              })()}
              
              {/* Legend */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '2px', backgroundColor: '#d8dee9' }}></div>
                  <span style={{ fontSize: '11px', color: '#666' }}>Series A</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '2px', backgroundColor: '#94a3b8' }}></div>
                  <span style={{ fontSize: '11px', color: '#666' }}>Series B</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '2px', backgroundColor: '#1e293b' }}></div>
                  <span style={{ fontSize: '11px', color: '#666' }}>Series C</span>
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
              Note: If the Annual Rate of Return is larger than Withdrawal Rate, your portfolio will increase forever!
              </div>




        </div>
      </div>

        {/* 7. Traditional IRA Balance and Withdrawals */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
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
              Pre-tax. Individual account. $7,000 limit under 50 y/o & under $150,000 income. Lowers taxes now, taxed at withdrawal. No employer match.
              </div>

            {/* Key Parameters */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.6)',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contribution Start Age</div>
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
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Retirement Age</div>
                <input
                  type="number"
                  value={retirementPlanningInputs.retirementAge || ''}
                  onChange={(e) => handleRetirementPlanningInputChange('retirementAge', e.target.value)}
                  min="31"
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
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Annual Rate of Return (%)</div>
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
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employer Match (%)</div>
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
              gap: '16px',
              marginBottom: '24px',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '18px',
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
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monthly Payment</div>
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
                padding: '18px',
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
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monthly Payment</div>
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
                padding: '18px',
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
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monthly Payment</div>
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
              border: '1px solid #e9ecef',
              borderRadius: '6px',
              padding: '16px',
              marginBottom: '16px',
              minHeight: '350px'
            }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', textAlign: 'center', color: '#333' }}>
                Traditional IRA Balance vs. Age Chart
              </div>
              {(() => {
                const chartData = generateTraditionalIRAChartData();
                const maxValue = Math.max(...chartData.map(d => Math.max(d.seriesA, d.seriesB, d.seriesC)));
                
                // Dynamic Y-axis values based on max value
                const getYAxisValues = (max) => {
                  if (max === 0) return [0];
                  
                  // Calculate nice intervals
                  const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
                  const normalized = max / magnitude;
                  
                  let step;
                  if (normalized <= 1) step = 0.2;
                  else if (normalized <= 2) step = 0.5;
                  else if (normalized <= 5) step = 1;
                  else step = 2;
                  
                  step *= magnitude;
                  const steps = Math.ceil(max / step);
                  
                  const values = [];
                  for (let i = 0; i <= steps; i++) {
                    values.push(i * step);
                  }
                  return values;
                };
                
                const yAxisValues = getYAxisValues(maxValue);
                const chartWidth = 500;
                const chartHeight = 250;
                const padding = 20;
                const yAxisLabelWidth = 60; // Space for Y-axis labels
                const plotWidth = chartWidth - padding - yAxisLabelWidth;
                const plotHeight = chartHeight - 2 * padding;
                
                return (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <svg width={chartWidth} height={chartHeight} style={{ border: '1px solid #ddd', borderRadius: '4px' }}>
                      {/* Y-axis value labels (horizontal grid lines removed) */}
                      {yAxisValues.map((value, i) => {
                        const ratio = value / maxValue;
                        return (
                          <g key={i}>
                            <text
                              x={yAxisLabelWidth - 5}
                              y={padding + plotHeight * (1 - ratio) + 4}
                              fontSize="10"
                              fill="#666"
                              textAnchor="end"
                            >
                              {formatCurrency(Math.round(value))}
                            </text>
                          </g>
                        );
                      })}
                      
                      {/* Age labels */}
                      {chartData.filter((_, i) => i % 5 === 0).map((d, i) => (
                        <text
                          key={i}
                          x={yAxisLabelWidth + (plotWidth / (chartData.length - 1)) * (chartData.findIndex(item => item.age === d.age))}
                          y={chartHeight - padding + 15}
                          fontSize="10"
                          fill="#666"
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
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '2px', backgroundColor: '#d8dee9' }}></div>
                  <span style={{ fontSize: '11px', color: '#666' }}>Series A</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '2px', backgroundColor: '#94a3b8' }}></div>
                  <span style={{ fontSize: '11px', color: '#666' }}>Series B</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '2px', backgroundColor: '#1e293b' }}></div>
                  <span style={{ fontSize: '11px', color: '#666' }}>Series C</span>
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
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#e9ecef' }}>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Age</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Year</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Annual Contribution</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Account Balance (FV)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seriesAData.accumulationData.slice(0, 20).map((row, index) => (
                            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{row.age}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{row.year}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{formatCurrency(row.annualContribution)}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{formatCurrency(row.accountBalance)}</td>
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
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#e9ecef' }}>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Age</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Year</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Annual Contribution</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Account Balance (FV)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seriesBData.accumulationData.slice(0, 20).map((row, index) => (
                            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{row.age}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{row.year}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{formatCurrency(row.annualContribution)}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{formatCurrency(row.accountBalance)}</td>
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
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#e9ecef' }}>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Age</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Year</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Annual Contribution</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Account Balance (FV)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seriesCData.accumulationData.slice(0, 20).map((row, index) => (
                            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{row.age}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{row.year}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{formatCurrency(row.annualContribution)}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{formatCurrency(row.accountBalance)}</td>
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
              <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'separate', borderSpacing: '0' }}>
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
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
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
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
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
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
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
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
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
                    }}>Future Value Retirement Balance</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculateTraditionalIRASeriesA().finalBalance)}</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculateTraditionalIRASeriesB().finalBalance)}</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculateTraditionalIRASeriesC().finalBalance)}</td>
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
                    }}>Value in Today's Dollars</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculatePresentValue(calculateTraditionalIRASeriesA().finalBalance, (retirementPlanningInputs.retirementAge || 65) - (retirementPlanningInputs.contributionStartAge || 22)))}</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculatePresentValue(calculateTraditionalIRASeriesB().finalBalance, (retirementPlanningInputs.retirementAge || 65) - (retirementPlanningInputs.contributionStartAge || 22)))}</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculatePresentValue(calculateTraditionalIRASeriesC().finalBalance, (retirementPlanningInputs.retirementAge || 65) - (retirementPlanningInputs.contributionStartAge || 22)))}</td>
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
              Note: Withdrawal Balance calculated from previous Traditional IRA Balance (left)
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
                justifyContent: 'center'
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>RMD</div>
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
                    cursor: 'not-allowed',
                    fontWeight: '700',
                    color: '#111827',
                    boxSizing: 'border-box'
                  }}
                />
          </div>
              <div style={{
                fontSize: '13px',
                color: '#4b5563',
                flex: 1,
                fontWeight: '500',
                lineHeight: '1.6',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '4px'
              }}>
                RMD: Required Minimum Distribution (last start age for withdrawals) - Fixed at 75
        </div>
      </div>

            {/* Scenarios */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              marginBottom: '24px',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '18px',
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
                  value={retirementPlanningInputs.traditionalIRAAgeA || 60}
                  onChange={(e) => handleRetirementPlanningInputChange('traditionalIRAAgeA', e.target.value)}
                  min="31"
                  max={retirementPlanningInputs.rmdAge || 73}
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
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '12px', fontWeight: '500' }}>PV of First Payment: {formatCurrency(calculateTraditionalIRAPV('A'))}</div>
              </div>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '18px',
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
                  value={retirementPlanningInputs.traditionalIRAAgeB || 60}
                  onChange={(e) => handleRetirementPlanningInputChange('traditionalIRAAgeB', e.target.value)}
                  min="31"
                  max={retirementPlanningInputs.rmdAge || 73}
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
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '12px', fontWeight: '500' }}>PV of First Payment: {formatCurrency(calculateTraditionalIRAPV('B'))}</div>
              </div>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '18px',
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
                  value={retirementPlanningInputs.traditionalIRAAgeC || 60}
                  onChange={(e) => handleRetirementPlanningInputChange('traditionalIRAAgeC', e.target.value)}
                  min="31"
                  max={retirementPlanningInputs.rmdAge || 73}
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
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '12px', fontWeight: '500' }}>PV of First Payment: {formatCurrency(calculateTraditionalIRAPV('C'))}</div>
              </div>
      </div>

            {/* Chart Placeholder */}
            {/* Traditional IRA Withdrawals vs Age Chart */}
            <div style={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: '6px',
              padding: '16px',
              marginBottom: '16px',
              minHeight: '350px'
            }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', textAlign: 'center', color: '#333' }}>
                Traditional IRA Withdrawals vs. Age Chart
              </div>
              {(() => {
                const chartData = generateTraditionalIRAWithdrawalsChartData();
                const maxValue = Math.max(...chartData.map(d => Math.max(d.seriesA, d.seriesB, d.seriesC)));
                
                // For withdrawal charts, extend Y-axis to double the max value for better visual spacing
                const extendedMaxValue = maxValue * 2;
                
                // Dynamic Y-axis values based on extended max value
                const getYAxisValues = (max) => {
                  if (max === 0) return [0];
                  
                  // Calculate nice intervals - aim for 5-6 steps
                  const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
                  const normalized = max / magnitude;
                  
                  let step;
                  if (normalized <= 1) step = 0.2;
                  else if (normalized <= 2) step = 0.4;
                  else if (normalized <= 5) step = 1;
                  else if (normalized <= 10) step = 2;
                  else step = 5;
                  
                  step *= magnitude;
                  
                  // Ensure we have 5-6 steps
                  const numSteps = Math.ceil(max / step);
                  if (numSteps < 4) {
                    step = max / 5;
                  } else if (numSteps > 8) {
                    step = max / 6;
                  }
                  
                  const values = [];
                  for (let i = 0; i <= Math.ceil(max / step); i++) {
                    const value = i * step;
                    if (value <= max) {
                      values.push(value);
                    }
                  }
                  return values;
                };
                
                const yAxisValues = getYAxisValues(extendedMaxValue);
                const chartWidth = 500;
                const chartHeight = 250;
                const padding = 20;
                const yAxisLabelWidth = 60; // Space for Y-axis labels
                const plotWidth = chartWidth - padding - yAxisLabelWidth;
                const plotHeight = chartHeight - 2 * padding;
                
                return (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <svg width={chartWidth} height={chartHeight} style={{ border: '1px solid #ddd', borderRadius: '4px' }}>
                      {/* Y-axis value labels (horizontal grid lines removed) */}
                      {yAxisValues.map((value, i) => {
                        const ratio = value / extendedMaxValue;
                        return (
                          <g key={i}>
                            <text
                              x={yAxisLabelWidth - 5}
                              y={padding + plotHeight * (1 - ratio) + 4}
                              fontSize="10"
                              fill="#666"
                              textAnchor="end"
                            >
                              {formatCurrency(Math.round(value))}
                            </text>
                          </g>
                        );
                      })}
                      
                      {/* Age labels */}
                      {chartData.filter((_, i) => i % 5 === 0).map((d, i) => (
                        <text
                          key={i}
                          x={yAxisLabelWidth + (plotWidth / (chartData.length - 1)) * (chartData.findIndex(item => item.age === d.age))}
                          y={chartHeight - padding + 15}
                          fontSize="10"
                          fill="#666"
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
                              opacity="0.8"
                            />
                            
                            {/* Series B bar */}
                            <rect
                              x={x + barWidth / 3}
                              y={padding + plotHeight * (1 - d.seriesB / extendedMaxValue)}
                              width={barWidth / 3}
                              height={plotHeight * (d.seriesB / extendedMaxValue)}
                              fill="#94a3b8"
                              opacity="0.8"
                            />
                            
                            {/* Series C bar */}
                            <rect
                              x={x + 2 * barWidth / 3}
                              y={padding + plotHeight * (1 - d.seriesC / extendedMaxValue)}
                              width={barWidth / 3}
                              height={plotHeight * (d.seriesC / extendedMaxValue)}
                              fill="#1e293b"
                              opacity="0.8"
                            />
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                );
              })()}
              
              {/* Legend */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '2px', backgroundColor: '#d8dee9' }}></div>
                  <span style={{ fontSize: '11px', color: '#666' }}>Series A</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '2px', backgroundColor: '#666' }}></div>
                  <span style={{ fontSize: '11px', color: '#666' }}>Series B</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '2px', backgroundColor: '#dc3545' }}></div>
                  <span style={{ fontSize: '11px', color: '#666' }}>Series C</span>
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
              Note: If the Annual Rate of Return is larger than Withdrawal Rate, your portfolio will increase forever!
            </div>




          </div>
        </div>

        {/* 8. Roth IRA Balance and Withdrawals */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
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
              Post-tax. Individual account. $7,000 limit under 50 yo & under $150,000 income. Tax-free growth and withdrawals. No employer match.
              </div>

            {/* Key Parameters */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.6)',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid rgba(229, 231, 235, 0.8)',
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contribution Start Age</div>
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
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Retirement Age</div>
                <input
                  type="number"
                  value={retirementPlanningInputs.retirementAge || ''}
                  onChange={(e) => handleRetirementPlanningInputChange('retirementAge', e.target.value)}
                  min="31"
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
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Annual Rate of Return (%)</div>
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
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employer Match (%)</div>
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
              gap: '16px',
              marginBottom: '24px',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '18px',
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
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monthly Payment</div>
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
                padding: '18px',
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
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monthly Payment</div>
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
                padding: '18px',
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
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monthly Payment</div>
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
              border: '1px solid #e9ecef',
              borderRadius: '6px',
              padding: '16px',
              marginBottom: '16px',
              minHeight: '350px'
            }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', textAlign: 'center', color: '#333' }}>
                Roth IRA Balance vs. Age Chart
              </div>
              {(() => {
                const chartData = generateRothIRAChartData();
                const maxValue = Math.max(...chartData.map(d => Math.max(d.seriesA, d.seriesB, d.seriesC)));
                
                // Dynamic Y-axis values based on max value
                const getYAxisValues = (max) => {
                  if (max === 0) return [0];
                  
                  // Calculate nice intervals
                  const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
                  const normalized = max / magnitude;
                  
                  let step;
                  if (normalized <= 1) step = 0.2;
                  else if (normalized <= 2) step = 0.5;
                  else if (normalized <= 5) step = 1;
                  else step = 2;
                  
                  step *= magnitude;
                  const steps = Math.ceil(max / step);
                  
                  const values = [];
                  for (let i = 0; i <= steps; i++) {
                    values.push(i * step);
                  }
                  return values;
                };
                
                const yAxisValues = getYAxisValues(maxValue);
                const chartWidth = 500;
                const chartHeight = 250;
                const padding = 20;
                const yAxisLabelWidth = 60; // Space for Y-axis labels
                const plotWidth = chartWidth - padding - yAxisLabelWidth;
                const plotHeight = chartHeight - 2 * padding;
                
                return (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <svg width={chartWidth} height={chartHeight} style={{ border: '1px solid #ddd', borderRadius: '4px' }}>
                      {/* Y-axis value labels (horizontal grid lines removed) */}
                      {yAxisValues.map((value, i) => {
                        const ratio = value / maxValue;
                        return (
                          <g key={i}>
                            <text
                              x={yAxisLabelWidth - 5}
                              y={padding + plotHeight * (1 - ratio) + 4}
                              fontSize="10"
                              fill="#666"
                              textAnchor="end"
                            >
                              {formatCurrency(Math.round(value))}
                            </text>
                          </g>
                        );
                      })}
                      
                      {/* Age labels */}
                      {chartData.filter((_, i) => i % 5 === 0).map((d, i) => (
                        <text
                          key={i}
                          x={yAxisLabelWidth + (plotWidth / (chartData.length - 1)) * (chartData.findIndex(item => item.age === d.age))}
                          y={chartHeight - padding + 15}
                          fontSize="10"
                          fill="#666"
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
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '2px', backgroundColor: '#d8dee9' }}></div>
                  <span style={{ fontSize: '11px', color: '#666' }}>Series A</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '2px', backgroundColor: '#94a3b8' }}></div>
                  <span style={{ fontSize: '11px', color: '#666' }}>Series B</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '2px', backgroundColor: '#1e293b' }}></div>
                  <span style={{ fontSize: '11px', color: '#666' }}>Series C</span>
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
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#e9ecef' }}>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Age</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Year</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Annual Contribution</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Account Balance (FV)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seriesAData.accumulationData.slice(0, 20).map((row, index) => (
                            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{row.age}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{row.year}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{formatCurrency(row.annualContribution)}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{formatCurrency(row.accountBalance)}</td>
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
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#e9ecef' }}>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Age</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Year</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Annual Contribution</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Account Balance (FV)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seriesBData.accumulationData.slice(0, 20).map((row, index) => (
                            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{row.age}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{row.year}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{formatCurrency(row.annualContribution)}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{formatCurrency(row.accountBalance)}</td>
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
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#e9ecef' }}>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Age</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Year</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Annual Contribution</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>Account Balance (FV)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seriesCData.accumulationData.slice(0, 20).map((row, index) => (
                            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{row.age}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{row.year}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{formatCurrency(row.annualContribution)}</td>
                              <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{formatCurrency(row.accountBalance)}</td>
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
              <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'separate', borderSpacing: '0' }}>
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
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
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
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
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
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
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
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
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
                    }}>Future Value Retirement Balance</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculateRothIRASeriesA().finalBalance)}</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculateRothIRASeriesB().finalBalance)}</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculateRothIRASeriesC().finalBalance)}</td>
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
                    }}>Value in Today's Dollars</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculatePresentValue(calculateRothIRASeriesA().finalBalance, (retirementPlanningInputs.retirementAge || 65) - (retirementPlanningInputs.contributionStartAge || 22)))}</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculatePresentValue(calculateRothIRASeriesB().finalBalance, (retirementPlanningInputs.retirementAge || 65) - (retirementPlanningInputs.contributionStartAge || 22)))}</td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#111827',
                      borderRight: '1px solid rgba(229, 231, 235, 0.8)',
                      borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>{formatCurrency(calculatePresentValue(calculateRothIRASeriesC().finalBalance, (retirementPlanningInputs.retirementAge || 65) - (retirementPlanningInputs.contributionStartAge || 22)))}</td>
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
              Note: Withdrawal Balance calculated from previous Roth IRA Balance (left)
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
                justifyContent: 'center'
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>RMD</div>
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
                    cursor: 'not-allowed',
                    fontWeight: '700',
                    color: '#111827',
                    boxSizing: 'border-box'
                  }}
                />
          </div>
              <div style={{
                fontSize: '13px',
                color: '#4b5563',
                flex: 1,
                fontWeight: '500',
                lineHeight: '1.6',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '4px'
              }}>
                RMD: Required Minimum Distribution (last start age for withdrawals) - Fixed at 75
        </div>
      </div>

            {/* Scenarios */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              marginBottom: '24px',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '18px',
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
                  value={retirementPlanningInputs.rothIRAAgeA || 60}
                  onChange={(e) => handleRetirementPlanningInputChange('rothIRAAgeA', e.target.value)}
                  min="31"
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
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '12px', fontWeight: '500' }}>PV of First Payment: {formatCurrency(calculateRothIRAPV('A'))}</div>
              </div>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '18px',
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
                  value={retirementPlanningInputs.rothIRAAgeB || 60}
                  onChange={(e) => handleRetirementPlanningInputChange('rothIRAAgeB', e.target.value)}
                  min="31"
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
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '12px', fontWeight: '500' }}>PV of First Payment: {formatCurrency(calculateRothIRAPV('B'))}</div>
              </div>
              <div style={{
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                padding: '18px',
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
                  value={retirementPlanningInputs.rothIRAAgeC || 60}
                  onChange={(e) => handleRetirementPlanningInputChange('rothIRAAgeC', e.target.value)}
                  min="31"
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
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '12px', fontWeight: '500' }}>PV of First Payment: {formatCurrency(calculateRothIRAPV('C'))}</div>
              </div>
      </div>

            {/* Chart Placeholder */}
            {/* Roth IRA Withdrawals vs Age Chart */}
            <div style={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: '6px',
              padding: '16px',
              marginBottom: '16px',
              minHeight: '350px'
            }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', textAlign: 'center', color: '#333' }}>
                Roth IRA Withdrawals vs. Age Chart
              </div>
              {(() => {
                const chartData = generateRothIRAWithdrawalsChartData();
                const maxValue = Math.max(...chartData.map(d => Math.max(d.seriesA, d.seriesB, d.seriesC)));
                
                // For withdrawal charts, extend Y-axis to double the max value for better visual spacing
                const extendedMaxValue = maxValue * 2;
                
                // Dynamic Y-axis values based on extended max value
                const getYAxisValues = (max) => {
                  if (max === 0) return [0];
                  
                  // Calculate nice intervals - aim for 5-6 steps
                  const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
                  const normalized = max / magnitude;
                  
                  let step;
                  if (normalized <= 1) step = 0.2;
                  else if (normalized <= 2) step = 0.4;
                  else if (normalized <= 5) step = 1;
                  else if (normalized <= 10) step = 2;
                  else step = 5;
                  
                  step *= magnitude;
                  
                  // Ensure we have 5-6 steps
                  const numSteps = Math.ceil(max / step);
                  if (numSteps < 4) {
                    step = max / 5;
                  } else if (numSteps > 8) {
                    step = max / 6;
                  }
                  
                  const values = [];
                  for (let i = 0; i <= Math.ceil(max / step); i++) {
                    const value = i * step;
                    if (value <= max) {
                      values.push(value);
                    }
                  }
                  return values;
                };
                
                const yAxisValues = getYAxisValues(extendedMaxValue);
                const chartWidth = 500;
                const chartHeight = 250;
                const padding = 20;
                const yAxisLabelWidth = 60; // Space for Y-axis labels
                const plotWidth = chartWidth - padding - yAxisLabelWidth;
                const plotHeight = chartHeight - 2 * padding;
                
                return (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <svg width={chartWidth} height={chartHeight} style={{ border: '1px solid #ddd', borderRadius: '4px' }}>
                      {/* Y-axis value labels (horizontal grid lines removed) */}
                      {yAxisValues.map((value, i) => {
                        const ratio = value / extendedMaxValue;
                        return (
                          <g key={i}>
                            <text
                              x={yAxisLabelWidth - 5}
                              y={padding + plotHeight * (1 - ratio) + 4}
                              fontSize="10"
                              fill="#666"
                              textAnchor="end"
                            >
                              {formatCurrency(Math.round(value))}
                            </text>
                          </g>
                        );
                      })}
                      
                      {/* Age labels */}
                      {chartData.filter((_, i) => i % 5 === 0).map((d, i) => (
                        <text
                          key={i}
                          x={yAxisLabelWidth + (plotWidth / (chartData.length - 1)) * (chartData.findIndex(item => item.age === d.age))}
                          y={chartHeight - padding + 15}
                          fontSize="10"
                          fill="#666"
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
                              opacity="0.8"
                            />
                            
                            {/* Series B bar */}
                            <rect
                              x={x + barWidth / 3}
                              y={padding + plotHeight * (1 - d.seriesB / extendedMaxValue)}
                              width={barWidth / 3}
                              height={plotHeight * (d.seriesB / extendedMaxValue)}
                              fill="#94a3b8"
                              opacity="0.8"
                            />
                            
                            {/* Series C bar */}
                            <rect
                              x={x + 2 * barWidth / 3}
                              y={padding + plotHeight * (1 - d.seriesC / extendedMaxValue)}
                              width={barWidth / 3}
                              height={plotHeight * (d.seriesC / extendedMaxValue)}
                              fill="#1e293b"
                              opacity="0.8"
                            />
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                );
              })()}
              
              {/* Legend */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '2px', backgroundColor: '#d8dee9' }}></div>
                  <span style={{ fontSize: '11px', color: '#666' }}>Series A</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '2px', backgroundColor: '#666' }}></div>
                  <span style={{ fontSize: '11px', color: '#666' }}>Series B</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '2px', backgroundColor: '#dc3545' }}></div>
                  <span style={{ fontSize: '11px', color: '#666' }}>Series C</span>
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
              Note: If the Annual Rate of Return is larger than Withdrawal Rate, your portfolio will increase forever!
            </div>




          </div>
        </div>

      
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