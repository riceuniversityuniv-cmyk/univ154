import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useBudget } from '../contexts/BudgetContext';
import { formatCurrency } from '../utils/formatters';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Week3CreditCard = () => {
  // Get save/load functions from context
  const { saveBudgetData, loadBudgetData } = useBudget();
  
  // State for user inputs (yellow cells) - Default values from Excel
  const [debtAmount, setDebtAmount] = useState('10000');
  const [annualInterestRate, setAnnualInterestRate] = useState('24.35');
  const [userPayment, setUserPayment] = useState('290');
  
  // State for General Loans section
  const [generalLoanAmount, setGeneralLoanAmount] = useState('50000');
  const [generalAnnualRate, setGeneralAnnualRate] = useState('0.08');
  const [generalAnnualRateInput, setGeneralAnnualRateInput] = useState('8'); // Temporary input value for display
  const [generalTerm, setGeneralTerm] = useState('60');

  // State for chart modal
  const [expandedChart, setExpandedChart] = useState(null); // 'userPayment', 'minimumPayment', 'generalLoan', or null

  // Format number for input display (with commas, preserve decimals for cents)
  const formatNumberForInput = (num) => {
    if (!num || num === '') return '';
    
    // Keep as string to preserve decimal input exactly as user types
    const numStr = num.toString();
    
    // If it's just a decimal point, return it as-is
    if (numStr === '.') return '.';
    
    const number = parseFloat(num);
    if (isNaN(number)) return numStr;
    
    // If it has a decimal point, preserve it exactly (don't force 2 decimals)
    if (numStr.includes('.')) {
      const parts = numStr.split('.');
      const intPart = parts[0] || '';
      const decPart = parts[1] || '';
      
      // If intPart is empty (user typing ".5"), don't format
      if (intPart === '') {
        return '.' + decPart;
      }
      
      // Format integer part with commas, keep decimal part as-is
      const formattedInt = parseInt(intPart).toLocaleString('en-US');
      return decPart ? `${formattedInt}.${decPart}` : formattedInt + '.';
    } else {
      // Whole number - format with commas
      return parseInt(numStr).toLocaleString('en-US');
    }
  };

  // Calculated values
  const monthlyRate = (parseFloat(annualInterestRate) || 0) / 100 / 12;

  // Minimum payment formula: interest owed this period + 1% of the current
  // balance, floored at $25, never exceeding what's actually owed (balance
  // + interest). Matches Excel's real formula (`Week 3.1 B - AM Table!N4`:
  // MIN(MAX(interest + 1%*balance, 25), balance+interest)) -- recalculated
  // against the LIVE balance every month in the amortization loop below,
  // not frozen at the original balance the way this used to be computed
  // (which made "minimum payment" mathematically identical to interest-only
  // and the debt could never amortize). See
  // docs/financial-audit-2026-08-11.md finding #2.
  const computeMinimumPayment = (balance, interestForPeriod) =>
    Math.min(Math.max(interestForPeriod + 0.01 * balance, 25), balance + interestForPeriod);

  const debtAmountNum = parseFloat(debtAmount) || 0;
  const minimumPayment = Math.round(computeMinimumPayment(debtAmountNum, debtAmountNum * monthlyRate) * 100) / 100;

  // Auto-save function (without alert)
  const autoSaveWeek3 = () => {
    try {
      const week3Data = {
        debtAmount,
        annualInterestRate,
        userPayment,
        generalLoanAmount,
        generalAnnualRate,
        generalTerm,
        timestamp: new Date().toISOString()
      };
      
      // Save to localStorage silently
      localStorage.setItem('week3_data', JSON.stringify(week3Data));
    } catch (error) {
      console.error('Error auto-saving Week 3 data:', error);
    }
  };

  // Auto-load data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('week3_data');
    if (savedData) {
      try {
        const week3Data = JSON.parse(savedData);
        
        // Load Week 3 specific data
        if (week3Data.debtAmount) setDebtAmount(week3Data.debtAmount);
        if (week3Data.annualInterestRate) setAnnualInterestRate(week3Data.annualInterestRate);
        if (week3Data.userPayment) setUserPayment(week3Data.userPayment);
        if (week3Data.generalLoanAmount) setGeneralLoanAmount(week3Data.generalLoanAmount);
        if (week3Data.generalAnnualRate) {
          setGeneralAnnualRate(week3Data.generalAnnualRate);
          // Update input display value
          const ratePercent = parseFloat(week3Data.generalAnnualRate) * 100;
          if (!isNaN(ratePercent)) {
            setGeneralAnnualRateInput(ratePercent.toString());
          }
        }
        if (week3Data.generalTerm) setGeneralTerm(week3Data.generalTerm);
      } catch (error) {
        console.error('Error loading Week 3 data:', error);
      }
    }
  }, []); // Only run on mount

  // Auto-save with debounce (500ms delay)
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      autoSaveWeek3();
    }, 500); // Wait 500ms after last change before saving

    return () => clearTimeout(saveTimer);
  }, [debtAmount, annualInterestRate, userPayment, generalLoanAmount, generalAnnualRate, generalTerm]);

  // General Loans amortization calculation (Week 3.2 B - AM Table)
  const calculateGeneralLoanAmortization = () => {
    const principal = parseFloat(generalLoanAmount) || 0;
    const monthlyRate = (parseFloat(generalAnnualRate) || 0) / 12;
    const numPayments = parseInt(generalTerm) || 0;

    if (principal <= 0 || monthlyRate <= 0 || numPayments <= 0) {
      return { amortizationTable: [], summary: { interestPaid: 0, principalPaid: 0, totalAmountPaid: 0 } };
    }

    // Calculate monthly payment using PMT formula
    // PMT(rate, nper, pv, fv) = PMT(monthlyRate, numPayments, -principal, 0)
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);

    const amortizationTable = [];
    let loanAmount = principal;
    let isPaidOff = false;
    let month = 1;

    while (!isPaidOff && month <= 600) { // Max 50 years (Excel limit)
      const interest = loanAmount * monthlyRate;
      
      // First month: use full PMT, subsequent months: MIN(PMT, balance + interest)
      const actualPayment = month === 1 ? monthlyPayment : Math.min(monthlyPayment, loanAmount + interest);
      const principalPayment = actualPayment - interest;
      const balance = loanAmount - principalPayment;
      const zeroCounter = Math.abs(balance) <= 0.01 ? 1 : 0;

      amortizationTable.push({
        month,
        loanAmount: loanAmount,
        payment: actualPayment,
        interest: interest,
        principal: principalPayment,
        balance: balance,
        zeroCounter: zeroCounter,
        isPaidOff: zeroCounter === 1
      });

      if (zeroCounter === 1) {
        isPaidOff = true;
      } else {
        loanAmount = balance;
        month++;
      }
    }

    const totalInterest = amortizationTable.reduce((sum, row) => sum + row.interest, 0);
    const totalPrincipal = amortizationTable.reduce((sum, row) => sum + row.principal, 0);
    const totalAmountPaid = amortizationTable.reduce((sum, row) => sum + row.payment, 0);

    return {
      amortizationTable,
      summary: {
        interestPaid: totalInterest,
        principalPaid: totalPrincipal,
        totalAmountPaid: totalAmountPaid
      }
    };
  };

  // Amortization calculation functions
  const calculateUserPaymentAmortization = () => {
    const principal = parseFloat(debtAmount) || 0;
    const monthlyRate = (parseFloat(annualInterestRate) || 0) / 100 / 12;
    const payment = parseFloat(userPayment) || 0;
    
    if (principal <= 0 || monthlyRate <= 0 || payment <= 0) {
      return { amortizationTable: [], summary: { interestPaid: 0, principalPaid: 0, totalAmountPaid: 0 } };
    }

    const amortizationTable = [];
    let month = 1;
    let loanAmount = principal; // C4: Initial loan amount
    let isPaidOff = false;

    while (!isPaidOff && month <= 600) { // Max 50 years (Excel limit)
      // Calculate interest: E4 = C4 * (Annual Interest Rate / 12)
      const interest = loanAmount * monthlyRate;
      
      // Calculate payment: D4 = User Payment (first month), D5+ = MIN(User Payment, Current Balance + Current Interest)
      // Excel: D5 = MIN('Week 3.1 - Credit Card Debt'!$G$7,G4+E5) where G4 is previous balance, E5 is current interest
      // Allow negative principal as per Excel logic
      const actualPayment = month === 1 ? payment : Math.min(payment, loanAmount + interest);
      
      // Calculate principal: F4 = D4 - E4
      const principalPayment = actualPayment - interest;
      
      // Calculate balance: G4 = C4 - F4
      const balance = loanAmount - principalPayment;
      
      // Check if paid off: H4 = IF(G4=ROUND(0,2),1,0)
      const zeroCounter = Math.abs(balance) <= 0.01 ? 1 : 0;
      
      amortizationTable.push({
        month,
        loanAmount: loanAmount, // C4, C5, etc.
        payment: actualPayment, // D4, D5, etc.
        interest: interest, // E4, E5, etc.
        principal: principalPayment, // F4, F5, etc.
        balance: balance, // G4, G5, etc.
        zeroCounter: zeroCounter, // H4, H5, etc.
        isPaidOff: zeroCounter === 1
      });

      if (zeroCounter === 1) {
        isPaidOff = true;
      } else {
        // Next month's loan amount: C5 = G4 (previous balance)
        loanAmount = balance;
        month++;
      }
    }

    // Calculate totals by summing all values from the amortization table (like =SUM('Week 3.1 B - AM Table'!E607:E1048576))
    const totalInterest = amortizationTable.reduce((sum, row) => sum + row.interest, 0);
    const totalPrincipal = amortizationTable.reduce((sum, row) => sum + row.principal, 0);
    const totalAmountPaid = amortizationTable.reduce((sum, row) => sum + row.payment, 0);

    return {
      amortizationTable,
      summary: {
        interestPaid: totalInterest,
        principalPaid: totalPrincipal,
        totalAmountPaid: totalAmountPaid
      }
    };
  };

  const calculateMinimumPaymentAmortization = () => {
    const principal = parseFloat(debtAmount) || 0;
    const monthlyRate = (parseFloat(annualInterestRate) || 0) / 100 / 12;

    if (principal <= 0 || monthlyRate <= 0) {
      return { amortizationTable: [], summary: { interestPaid: 0, principalPaid: 0, totalAmountPaid: 0 } };
    }

    const amortizationTable = [];
    let month = 1;
    let loanAmount = principal; // C4: Initial loan amount
    let isPaidOff = false;

    while (!isPaidOff && month <= 600) { // Max 50 years (Excel limit)
      const calculatedInterest = loanAmount * monthlyRate;

      // Minimum payment recalculated every month against the CURRENT
      // (live, shrinking) balance -- see computeMinimumPayment above.
      const actualPayment = computeMinimumPayment(loanAmount, calculatedInterest);

      // Calculate interest paid: O4 = MIN(N4, M4 * (Annual Interest Rate / 12))
      const interestPaid = Math.min(actualPayment, calculatedInterest);
      
      // Calculate principal: P4 = MAX(N4-O4,0)
      // Excel: P4 = MAX(N4-O4,0) - never negative!
      const principalPayment = Math.max(actualPayment - interestPaid, 0);
      
      // Calculate balance: Q4 = M4 - P4
      const balance = loanAmount - principalPayment;
      
      // Check if paid off: R4 = IF(Q4=ROUND(0,2),1,0)
      const zeroCounter = Math.abs(balance) <= 0.01 ? 1 : 0;
      
      amortizationTable.push({
        month,
        loanAmount: loanAmount, // M4, M5, etc.
        payment: actualPayment, // N4, N5, etc.
        interest: interestPaid, // O4, O5, etc.
        principal: principalPayment, // P4, P5, etc.
        balance: balance, // Q4, Q5, etc.
        zeroCounter: zeroCounter, // R4, R5, etc.
        isPaidOff: zeroCounter === 1
      });

      if (zeroCounter === 1) {
        isPaidOff = true;
      } else {
        // Next month's loan amount: C5 = G4 (previous balance)
        loanAmount = balance;
        month++;
      }
    }

    // Calculate totals by summing all values from the amortization table (like =SUM('Week 3.1 B - AM Table'!E607:E1048576))
    const totalInterest = amortizationTable.reduce((sum, row) => sum + row.interest, 0);
    const totalPrincipal = amortizationTable.reduce((sum, row) => sum + row.principal, 0);
    const totalAmountPaid = amortizationTable.reduce((sum, row) => sum + row.payment, 0);

    return {
      amortizationTable,
      summary: {
        interestPaid: totalInterest,
        principalPaid: totalPrincipal,
        totalAmountPaid: totalAmountPaid
      }
    };
  };

  // Calculate amortization data
  const userPaymentData = calculateUserPaymentAmortization();
  const minimumPaymentData = calculateMinimumPaymentAmortization();
  const generalLoanData = calculateGeneralLoanAmortization();


  // Styling matching Week 1 patterns exactly
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, rgba(255, 253, 231, 0.27) 0%, rgb(255, 252, 240) 50%, rgb(255, 255, 255) 100%)',
      padding: '32px 24px',
      width: '100%',
      fontSize: '14px',
      color: '#111827',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      position: 'relative',
    },
    sectionDivider: {
      height: '1px',
      background: 'linear-gradient(90deg, transparent, rgba(229, 231, 235, 0.6), transparent)',
      margin: '0',
      borderRadius: '1px',
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
    inputSection: {
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      padding: '16px',
      borderRadius: '12px',
      border: '1px solid rgba(229, 231, 235, 0.5)',
      marginBottom: '16px',
      maxWidth: '100%',
      boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.05)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    inputGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px'
    },
    inputColumn: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    },
    inputRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    },
    inputLabel: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      minWidth: '100px'
    },
    input: {
      width: '120px',
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
    },
    readOnlyInput: {
      width: '120px',
      border: '1px solid rgba(229, 231, 235, 0.6)',
      padding: '10px 14px',
      textAlign: 'right',
      backgroundColor: 'rgba(249, 250, 251, 0.8)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      borderRadius: '8px',
      boxSizing: 'border-box',
      fontSize: '14px',
      fontWeight: '600',
      color: '#6b7280',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)',
    },
    calculatedValue: {
      width: '120px',
      textAlign: 'right',
      fontSize: '14px',
      fontWeight: '600',
      color: '#0d1a4b',
      padding: '10px 0px'
    },
    mainLayout: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
      marginBottom: '36px',
      maxWidth: '100%'
    },
    leftSection: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    },
    rightSection: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start'
    },
    summaryGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
      marginTop: '0',
      paddingTop: '0'
    },
    summaryCard: {
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '12px',
      border: '2px solid #e9ecef',
      marginTop: '0',
      marginBottom: '16px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden'
    },
    summaryCardEnhanced: {
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      padding: '24px',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      marginBottom: '16px',
      boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.08)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      overflow: 'hidden'
    },
    summaryCardHeader: {
      display: 'flex',
      alignItems: 'flex-start',
      marginBottom: '16px',
      paddingBottom: '12px',
      borderBottom: '2px solid #f1f3f4'
    },
    summaryCardIcon: {
      width: '24px',
      height: '24px',
      marginRight: '8px',
      color: '#0d1a4b'
    },
    summaryTitle: {
      fontSize: '15px',
      fontWeight: '600',
      color: '#0d1a4b',
      margin: '0',
      textAlign: 'center',
      letterSpacing: '-0.01em',
    },
    chartsSection: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
      marginBottom: '20px',
      maxWidth: '100%'
    },
    chartCard: {
      backgroundColor: 'white',
      padding: '24px',
      borderRadius: '12px',
      border: '2px solid #e9ecef',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      marginBottom: '20px'
    },
    chartCardEnhanced: {
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      padding: '24px',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.08)',
      marginBottom: '20px',
      position: 'relative',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    chartHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '20px',
      paddingBottom: '12px',
      borderBottom: '2px solid #f1f3f4',
      gap: '12px'
    },
    chartIcon: {
      width: '20px',
      height: '20px',
      marginRight: '8px',
      color: '#0d1a4b'
    },
    chartTitle: {
      fontSize: '15px',
      fontWeight: '600',
      color: '#0d1a4b',
      margin: '0',
      textAlign: 'center',
      letterSpacing: '-0.01em',
    },
    sectionTitle: {
      fontSize: '15px',
      fontWeight: '600',
      color: '#0d1a4b',
      marginBottom: '12px',
      textAlign: 'center',
      letterSpacing: '-0.01em',
    },
    summaryTable: {
      marginBottom: '12px'
    },
    summaryRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 12px',
      borderBottom: '1px solid #e0e0e0'
    },
    summaryLabel: {
      fontSize: '14px',
      color: '#666'
    },
    summaryValue: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#0d1a4b'
    },
    chartContainer: {
      height: '200px',
      backgroundColor: 'rgba(249, 250, 251, 0.6)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      border: '1px solid rgba(229, 231, 235, 0.5)',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#6b7280',
      marginTop: '8px',
      boxShadow: 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    },
    note: {
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      border: '1px solid rgba(229, 231, 235, 0.5)',
      padding: '14px 18px',
      borderRadius: '8px',
      textAlign: 'center',
      fontSize: '14px',
      color: '#374151',
      fontWeight: '500',
      boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.05)',
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
    // General Loans Section Styles
    generalLoansSection: {
      marginBottom: '20px'
    },
    generalLoansHeader: {
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
    generalLoansContent: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '24px',
      marginBottom: '32px'
    },
    ratesTable: {
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      padding: '24px',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.08)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    ratesTitle: {
      fontSize: '15px',
      fontWeight: '600',
      color: '#0d1a4b',
      marginBottom: '16px',
      textAlign: 'center',
      letterSpacing: '-0.01em',
    },
    ratesList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    rateItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 12px',
      borderBottom: '1px solid #e0e0e0'
    },
    rateLabel: {
      fontSize: '14px',
      color: '#666'
    },
    rateValue: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#0d1a4b'
    },
    loanDetails: {
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      padding: '24px',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.08)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    loanDetailsTitle: {
      fontSize: '15px',
      fontWeight: '600',
      color: '#0d1a4b',
      marginBottom: '16px',
      textAlign: 'center',
      letterSpacing: '-0.01em',
    },
    loanDetailsList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    loanDetailItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 12px',
      borderBottom: '1px solid #e0e0e0'
    },
    loanDetailLabel: {
      fontSize: '14px',
      color: '#666'
    },
    loanInput: {
      width: '150px',
      border: '2px solid #d1d5db',
      padding: '10px 14px',
      textAlign: 'right',
      backgroundColor: '#fffde7',
      borderRadius: '8px',
      fontWeight: '500',
      boxSizing: 'border-box',
      fontSize: '14px',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      outline: 'none',
    },
    paymentSummary: {
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      padding: '24px',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.08)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    paymentSummaryTitle: {
      fontSize: '15px',
      fontWeight: '600',
      color: '#0d1a4b',
      marginBottom: '16px',
      textAlign: 'center',
      letterSpacing: '-0.01em',
    },
    paymentSummaryList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    paymentSummaryItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 12px',
      borderBottom: '1px solid #e0e0e0'
    },
    paymentSummaryLabel: {
      fontSize: '14px',
      color: '#666'
    },
    paymentSummaryValue: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#0d1a4b'
    }
  };

  // Info Icon Component matching Week 1
  const InfoIcon = () => (
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
  );

  return (
    <div style={styles.container}>
      {/* Credit Card Section */}
      <div style={styles.sectionContainer}>
        {/* Enhanced Header */}
        <div style={styles.enhancedHeader}>
          <span style={{ fontSize: '26px', letterSpacing: '-0.02em' }}>Credit & Debt Management</span>
          </div>

        {/* Info Box - matching Week 1 styling */}
        <div style={styles.infoBox}>
          <InfoIcon />
          <div>
            <strong>How it works:</strong> Enter your credit card debt amount and annual interest rate. Compare the impact of making minimum payments versus your custom payment amount. You can also analyze general loans with fixed monthly payments.
          </div>
          </div>

      {/* Main Content - Left and Right Layout like Excel */}
      <div style={styles.mainLayout}>
        {/* Left Side: Input Parameters */}
        <div style={styles.leftSection}>
          <div 
            style={styles.inputSection}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px 0 rgba(0, 0, 0, 0.12)';
              e.currentTarget.style.border = '1px solid rgba(229, 231, 235, 0.7)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px 0 rgba(0, 0, 0, 0.05)';
              e.currentTarget.style.border = '1px solid rgba(229, 231, 235, 0.5)';
            }}
          >
            <div style={styles.inputGrid}>
              {/* Left Column */}
              <div style={styles.inputColumn}>
                <div style={styles.inputRow}>
                  <div style={styles.inputLabel}>Amount of Credit Card Debt</div>
                  <input
                    type="text"
                    value={debtAmount ? `$${formatNumberForInput(debtAmount)}` : ''}
                    onChange={(e) => {
                      const cleanValue = e.target.value.replace(/[$,]/g, '');
                      const sanitized = cleanValue.replace(/[^0-9.]/g, '');
                      
                      if (sanitized === '') {
                        setDebtAmount('');
                        return;
                      }
                      
                      const firstDotIndex = sanitized.indexOf('.');
                      let numericValue = '';
                      
                      if (firstDotIndex === -1) {
                        numericValue = sanitized;
                      } else {
                        const intPart = sanitized.substring(0, firstDotIndex);
                        const decPart = sanitized.substring(firstDotIndex + 1).slice(0, 2);
                        numericValue = intPart + '.' + decPart;
                      }
                      
                      if (sanitized === '.' || (firstDotIndex !== -1 && sanitized.substring(firstDotIndex + 1) === '')) {
                        setDebtAmount(numericValue);
                        return;
                      }
                      
                      setDebtAmount(numericValue);
                    }}
                    style={styles.input}
                    placeholder="Enter amount"
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
                </div>
                <div style={styles.inputRow}>
                  <div style={styles.inputLabel}>Annual Interest Rate</div>
                  <input
                    type="text"
                    value={annualInterestRate ? `${annualInterestRate}%` : ''}
                    onChange={(e) => {
                      const value = e.target.value.replace('%', '');
                      setAnnualInterestRate(value);
                      const inputEl = e.target;
                      const pos = value.length;
                      requestAnimationFrame(() => {
                        if (inputEl && document.activeElement === inputEl) {
                          inputEl.setSelectionRange(pos, pos);
                        }
                      });
                    }}
                    style={styles.input}
                    placeholder="%Enter rate"
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
                </div>
              </div>

              {/* Right Column */}
              <div style={styles.inputColumn}>
                <div style={styles.inputRow}>
                  <div style={styles.inputLabel}>Minimum Payment</div>
                  <div style={styles.calculatedValue}>
                    {formatCurrency(minimumPayment)}
                  </div>
                </div>
                <div style={styles.inputRow}>
                  <div style={styles.inputLabel}>User Input Payment</div>
                  <input
                    type="text"
                    value={userPayment ? `$${formatNumberForInput(userPayment)}` : ''}
                    onChange={(e) => {
                      const cleanValue = e.target.value.replace(/[$,]/g, '');
                      const sanitized = cleanValue.replace(/[^0-9.]/g, '');
                      
                      if (sanitized === '') {
                        setUserPayment('');
                        return;
                      }
                      
                      const firstDotIndex = sanitized.indexOf('.');
                      let numericValue = '';
                      
                      if (firstDotIndex === -1) {
                        numericValue = sanitized;
                      } else {
                        const intPart = sanitized.substring(0, firstDotIndex);
                        const decPart = sanitized.substring(firstDotIndex + 1).slice(0, 2);
                        numericValue = intPart + '.' + decPart;
                      }
                      
                      if (sanitized === '.' || (firstDotIndex !== -1 && sanitized.substring(firstDotIndex + 1) === '')) {
                        setUserPayment(numericValue);
                        return;
                      }
                      
                      setUserPayment(numericValue);
                    }}
                    style={{
                      ...styles.input,
                      borderColor: parseFloat(userPayment) < minimumPayment && userPayment !== '' ? '#dc3545' : '#d1d5db'
                    }}
                    placeholder="$Enter amount"
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
                        const value = e.target.value.replace(/[$,]/g, '');
                        const numericValue = parseFloat(value);
                        e.target.style.borderColor = (value !== '' && !isNaN(numericValue) && numericValue < minimumPayment) ? '#dc3545' : '#d1d5db';
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
                      // Validation and styling combined
                      const value = e.target.value.replace(/[$,]/g, '');
                      const numericValue = parseFloat(value);
                      
                      // Validation
                      if (value !== '' && !isNaN(numericValue) && numericValue >= 0) {
                        if (numericValue < minimumPayment) {
                          alert(`User Input Payment must be at least the minimum payment amount of ${formatCurrency(minimumPayment)}`);
                          // Reset to minimum payment
                          setUserPayment(minimumPayment.toString());
                        }
                      }
                      
                      // Styling
                      e.target.style.borderColor = (value !== '' && !isNaN(numericValue) && numericValue < minimumPayment) ? '#dc3545' : '#d1d5db';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.backgroundColor = '#fffde7';
                      e.target.style.transform = 'scale(1)';
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Summary Results - Side by Side */}
        <div style={styles.rightSection}>
          <div style={styles.summaryGrid}>
            {/* User Input Payment Summary */}
            <div 
              style={styles.summaryCardEnhanced}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 40px 0 rgba(0, 0, 0, 0.12), 0 6px 20px 0 rgba(0, 0, 0, 0.1), 0 2px 8px 0 rgba(0, 0, 0, 0.06)';
                e.currentTarget.style.border = '1px solid rgba(229, 231, 235, 0.8)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px 0 rgba(0, 0, 0, 0.08)';
                e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.3)';
              }}
            >
              <div style={styles.summaryCardHeader}>
              <h3 style={styles.summaryTitle}>User Input Payment</h3>
              </div>
              <div style={styles.summaryTable}>
                <div style={styles.summaryRow}>
                  <div style={styles.summaryLabel}>Interest Paid</div>
                  <div style={styles.summaryValue}>{formatCurrency(userPaymentData.summary.interestPaid)}</div>
                </div>
                <div style={styles.summaryRow}>
                  <div style={styles.summaryLabel}>Principal Paid</div>
                  <div style={styles.summaryValue}>{formatCurrency(userPaymentData.summary.principalPaid)}</div>
                </div>
                <div style={styles.summaryRow}>
                  <div style={styles.summaryLabel}>Total Amount Paid</div>
                  <div style={styles.summaryValue}>{formatCurrency(userPaymentData.summary.totalAmountPaid)}</div>
                </div>
                <div style={styles.summaryRow}>
                  <div style={styles.summaryLabel}>Months to Pay Off</div>
                  <div style={styles.summaryValue}>
                    {userPaymentData.amortizationTable.length === 600 ? 'Never (600+ months)' : `${userPaymentData.amortizationTable.length} months`}
                  </div>
                </div>
              </div>
            </div>

            {/* Minimum Input Payment Summary */}
            <div 
              style={styles.summaryCardEnhanced}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 40px 0 rgba(0, 0, 0, 0.12), 0 6px 20px 0 rgba(0, 0, 0, 0.1), 0 2px 8px 0 rgba(0, 0, 0, 0.06)';
                e.currentTarget.style.border = '1px solid rgba(229, 231, 235, 0.8)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px 0 rgba(0, 0, 0, 0.08)';
                e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.3)';
              }}
            >
              <div style={styles.summaryCardHeader}>
              <h3 style={styles.summaryTitle}>Minimum Input Payment</h3>
              </div>
              <div style={styles.summaryTable}>
                <div style={styles.summaryRow}>
                  <div style={styles.summaryLabel}>Interest Paid</div>
                  <div style={styles.summaryValue}>{formatCurrency(minimumPaymentData.summary.interestPaid)}</div>
                </div>
                <div style={styles.summaryRow}>
                  <div style={styles.summaryLabel}>Principal Paid</div>
                  <div style={styles.summaryValue}>{formatCurrency(minimumPaymentData.summary.principalPaid)}</div>
                </div>
                <div style={styles.summaryRow}>
                  <div style={styles.summaryLabel}>Total Amount Paid</div>
                  <div style={styles.summaryValue}>{formatCurrency(minimumPaymentData.summary.totalAmountPaid)}</div>
                </div>
                <div style={styles.summaryRow}>
                  <div style={styles.summaryLabel}>Months to Pay Off</div>
                  <div style={styles.summaryValue}>
                    {minimumPaymentData.amortizationTable.length === 600 ? 'Never (600+)' : `${minimumPaymentData.amortizationTable.length}`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section - Side by Side like Excel */}
      <div style={styles.chartsSection}>
        {/* Left Chart: User Input Payment */}
        <div 
          style={{ ...styles.chartCardEnhanced, cursor: 'pointer' }}
          onClick={() => setExpandedChart('userPayment')}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 40px 0 rgba(0, 0, 0, 0.12), 0 6px 20px 0 rgba(0, 0, 0, 0.1), 0 2px 8px 0 rgba(0, 0, 0, 0.06)';
            e.currentTarget.style.border = '1px solid rgba(229, 231, 235, 0.8)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px 0 rgba(0, 0, 0, 0.08)';
            e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.3)';
          }}
        >
          <div style={styles.chartHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <h3 style={{ ...styles.chartTitle, flex: 'none' }}>Debt Payments: Interest vs Principal</h3>
            </div>
            <div style={{ 
              fontSize: '11px', 
              color: '#0d1a4b', 
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              backgroundColor: 'rgba(13, 26, 75, 0.08)',
              borderRadius: '6px',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}>
              <span>Click to expand</span>
            </div>
          </div>
          <div style={{ fontSize: '15px', color: '#666', textAlign: 'center', marginBottom: '10px', fontWeight: '600' }}>User Input Payment</div>
          <div style={styles.chartContainer}>
            <Bar 
              data={{
                labels: userPaymentData.amortizationTable.map((_, index) => index + 1),
                datasets: [
                  {
                    label: 'Principal Payment',
                    data: userPaymentData.amortizationTable.map(month => month.principal),
                    backgroundColor: '#0d1a4b',
                    borderColor: '#0a1440',
                    borderWidth: 0,
                    borderRadius: 4,
                    stack: 'stack1'
                  },
                  {
                    label: 'Interest Payment',
                    data: userPaymentData.amortizationTable.map(month => month.interest),
                    backgroundColor: 'rgba(139, 157, 196, 0.45)',
                    borderColor: 'rgba(107, 127, 168, 0.4)',
                    borderWidth: 0,
                    borderRadius: 4,
                    stack: 'stack1'
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                  intersect: false,
                  mode: 'index'
                },
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: false
                  },
                  tooltip: {
                    animation: {
                      duration: 0
                    },
                    position: 'nearest',
                    backgroundColor: 'rgba(13, 26, 75, 0.95)',
                    padding: 12,
                    titleFont: {
                      size: 14,
                      weight: '600'
                    },
                    bodyFont: {
                      size: 13
                    },
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                      label: function(context) {
                        return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                      }
                    }
                  }
                },
                scales: {
                  x: {
                    grid: { display: false },
                    title: {
                      display: true,
                      text: 'Month'
                    }
                  },
                  y: {
                    grid: { display: false },
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Payment'
                    },
                    ticks: {
                      callback: function(value) {
                        return formatCurrency(value);
                      }
                    }
                  }
                },
                animation: {
                  duration: 0
                }
              }}
              style={{ height: '200px' }}
            />
          </div>
        </div>

        {/* Right Chart: Minimum Input Payment */}
        <div 
          style={{ ...styles.chartCardEnhanced, cursor: 'pointer' }}
          onClick={() => setExpandedChart('minimumPayment')}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 40px 0 rgba(0, 0, 0, 0.12), 0 6px 20px 0 rgba(0, 0, 0, 0.1), 0 2px 8px 0 rgba(0, 0, 0, 0.06)';
            e.currentTarget.style.border = '1px solid rgba(229, 231, 235, 0.8)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px 0 rgba(0, 0, 0, 0.08)';
            e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.3)';
          }}
        >
          <div style={styles.chartHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <h3 style={{ ...styles.chartTitle, flex: 'none' }}>Debt Payments: Interest vs Principal</h3>
            </div>
            <div style={{ 
              fontSize: '11px', 
              color: '#0d1a4b', 
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              backgroundColor: 'rgba(13, 26, 75, 0.08)',
              borderRadius: '6px',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}>
              <span>Click to expand</span>
            </div>
          </div>
          <div style={{ fontSize: '15px', color: '#666', textAlign: 'center', marginBottom: '10px', fontWeight: '600' }}>Minimum Payment</div>
          <div style={styles.chartContainer}>
            <Bar 
              data={{
                labels: minimumPaymentData.amortizationTable.slice(0, 100).map((_, index) => index + 1),
                datasets: [
                  {
                    label: 'Principal Payment',
                    data: minimumPaymentData.amortizationTable.slice(0, 100).map(month => month.principal),
                    backgroundColor: '#0d1a4b',
                    borderColor: '#0a1440',
                    borderWidth: 0,
                    borderRadius: 4,
                    stack: 'stack2'
                  },
                  {
                    label: 'Interest Payment',
                    data: minimumPaymentData.amortizationTable.slice(0, 100).map(month => month.interest),
                    backgroundColor: 'rgba(139, 157, 196, 0.45)',
                    borderColor: 'rgba(107, 127, 168, 0.4)',
                    borderWidth: 0,
                    borderRadius: 4,
                    stack: 'stack2'
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                  intersect: false,
                  mode: 'index'
                },
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: false
                  },
                  tooltip: {
                    animation: {
                      duration: 0
                    },
                    position: 'nearest',
                    backgroundColor: 'rgba(13, 26, 75, 0.95)',
                    padding: 12,
                    titleFont: {
                      size: 14,
                      weight: '600'
                    },
                    bodyFont: {
                      size: 13
                    },
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                      label: function(context) {
                        return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                      }
                    }
                  }
                },
                scales: {
                  x: {
                    grid: { display: false },
                    title: {
                      display: true,
                      text: 'Month'
                    }
                  },
                  y: {
                    grid: { display: false },
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Payment'
                    },
                    ticks: {
                      callback: function(value) {
                        return formatCurrency(value);
                      }
                    }
                  }
                },
                animation: {
                  duration: 0
                }
              }}
              style={{ height: '200px' }}
            />
          </div>
          </div>
        </div>
      </div>

      {/* Section Divider */}
      <div style={styles.sectionDivider}></div>

      {/* General Loans Section */}
      <div style={styles.sectionContainer}>
        {/* Enhanced Header */}
        <div style={styles.enhancedHeader}>
          <span style={{ fontSize: '26px', letterSpacing: '-0.02em' }}>General Loans</span>
        </div>
        
        <div style={styles.generalLoansContent}>
          {/* Left: Average Interest Rates */}
          <div 
            style={styles.ratesTable}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 40px 0 rgba(0, 0, 0, 0.12), 0 6px 20px 0 rgba(0, 0, 0, 0.1), 0 2px 8px 0 rgba(0, 0, 0, 0.06)';
              e.currentTarget.style.border = '1px solid rgba(229, 231, 235, 0.8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px 0 rgba(0, 0, 0, 0.08)';
              e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.3)';
            }}
          >
            <h3 style={styles.ratesTitle}>Average Interest Rates</h3>
            <div style={styles.ratesList}>
              <div style={styles.rateItem}>
                <span style={styles.rateLabel}>New Car</span>
                <span style={styles.rateValue}>6.73%</span>
              </div>
              <div style={styles.rateItem}>
                <span style={styles.rateLabel}>Used Car</span>
                <span style={styles.rateValue}>11.87%</span>
              </div>
              <div style={styles.rateItem}>
                <span style={styles.rateLabel}>Student Loans</span>
                <span style={styles.rateValue}>6.39%</span>
              </div>
              <div style={styles.rateItem}>
                <span style={styles.rateLabel}>Unsecured Loans</span>
                <span style={styles.rateValue}>12.57%</span>
              </div>
            </div>
          </div>

          {/* Middle: Loan Details */}
          <div 
            style={styles.loanDetails}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 40px 0 rgba(0, 0, 0, 0.12), 0 6px 20px 0 rgba(0, 0, 0, 0.1), 0 2px 8px 0 rgba(0, 0, 0, 0.06)';
              e.currentTarget.style.border = '1px solid rgba(229, 231, 235, 0.8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px 0 rgba(0, 0, 0, 0.08)';
              e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.3)';
            }}
          >
            <h3 style={styles.loanDetailsTitle}>Loan Details</h3>
            <div style={styles.loanDetailsList}>
              <div style={styles.loanDetailItem}>
                <span style={styles.loanDetailLabel}>Loan Amount</span>
                <input
                  type="text"
                  value={generalLoanAmount ? `$${formatNumberForInput(generalLoanAmount)}` : ''}
                  onChange={(e) => {
                    const cleanValue = e.target.value.replace(/[$,]/g, '');
                    const sanitized = cleanValue.replace(/[^0-9.]/g, '');
                    
                    if (sanitized === '') {
                      setGeneralLoanAmount('');
                      return;
                    }
                    
                    const firstDotIndex = sanitized.indexOf('.');
                    let numericValue = '';
                    
                    if (firstDotIndex === -1) {
                      numericValue = sanitized;
                    } else {
                      const intPart = sanitized.substring(0, firstDotIndex);
                      const decPart = sanitized.substring(firstDotIndex + 1).slice(0, 2);
                      numericValue = intPart + '.' + decPart;
                    }
                    
                    if (sanitized === '.' || (firstDotIndex !== -1 && sanitized.substring(firstDotIndex + 1) === '')) {
                      setGeneralLoanAmount(numericValue);
                      return;
                    }
                    
                    setGeneralLoanAmount(numericValue);
                  }}
                  style={styles.loanInput}
                  placeholder="Enter amount"
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
              </div>
              <div style={styles.loanDetailItem}>
                <span style={styles.loanDetailLabel}>Annual Interest Rate</span>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                    value={generalAnnualRateInput ? `${generalAnnualRateInput}%` : ''}
                  onChange={(e) => {
                      // Remove % symbol for processing
                      const cleanValue = e.target.value.replace(/[%,]/g, '');
                      
                      // Only allow numbers and at most one decimal point
                      const sanitized = cleanValue.replace(/[^0-9.]/g, '');
                      
                      // Update input display value immediately
                      setGeneralAnnualRateInput(sanitized);
                      
                      // Allow empty string for clearing the field
                      if (sanitized === '') {
                        setGeneralAnnualRate('');
                        return;
                      }
                      
                      // Prevent multiple decimals - find first decimal point
                      const firstDotIndex = sanitized.indexOf('.');
                      let numericValue = '';
                      
                      if (firstDotIndex === -1) {
                        // No decimal point - just numbers
                        numericValue = sanitized;
                      } else {
                        // Has decimal point - take integer part and up to 2 decimal places
                        const intPart = sanitized.substring(0, firstDotIndex);
                        const decPart = sanitized.substring(firstDotIndex + 1).slice(0, 2); // max 2 decimals
                        numericValue = intPart + '.' + decPart;
                      }
                      
                      // Update the actual rate value for calculations
                      const parsedValue = parseFloat(numericValue);
                      if (!isNaN(parsedValue) && parsedValue >= 0) {
                        // Store as decimal for calculations (e.g., 8.57 -> 0.0857)
                        setGeneralAnnualRate((parsedValue / 100).toString());
                      } else if (sanitized === '.' || (firstDotIndex !== -1 && sanitized.substring(firstDotIndex + 1) === '')) {
                        // User is typing a decimal point - keep current value or set to 0
                        const intPart = firstDotIndex === -1 ? '' : sanitized.substring(0, firstDotIndex);
                        if (intPart === '') {
                          setGeneralAnnualRate('0');
                        } else {
                          const parsed = parseFloat(intPart);
                          if (!isNaN(parsed) && parsed >= 0) {
                            setGeneralAnnualRate((parsed / 100).toString());
                          }
                        }
                    } else {
                      setGeneralAnnualRate('');
                    }
                    const inputEl = e.target;
                    const pos = sanitized.length;
                    requestAnimationFrame(() => {
                      if (inputEl && document.activeElement === inputEl) {
                        inputEl.setSelectionRange(pos, pos);
                      }
                    });
                    }}
                  style={styles.loanInput}
                  placeholder="Enter percentage"
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
                    // Update styling
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                    e.target.style.backgroundColor = '#fffde7';
                    e.target.style.transform = 'scale(1)';
                    // On blur, ensure the input value matches the stored rate
                    const currentRate = parseFloat(generalAnnualRate) * 100;
                    if (!isNaN(currentRate)) {
                      setGeneralAnnualRateInput(currentRate.toString());
                    }
                  }}
                />
                </div>
              </div>
              <div style={styles.loanDetailItem}>
                <span style={styles.loanDetailLabel}>Term</span>
                <div 
                  id="term-input-container"
                  style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '48px', minHeight: '48px', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
                  onMouseEnter={(e) => {
                    const input = e.currentTarget.querySelector('input');
                    if (input && document.activeElement !== input) {
                      input.style.borderColor = '#9ca3af';
                      input.style.backgroundColor = '#ffffff';
                      input.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                      e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    const input = e.currentTarget.querySelector('input');
                    if (input && document.activeElement !== input) {
                      input.style.borderColor = '#d1d5db';
                      input.style.backgroundColor = '#fffde7';
                      input.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                >
                <input
                    type="number"
                    min="1"
                    step="0.1"
                    value={generalTerm || ''}
                  onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        setGeneralTerm('');
                        return;
                      }
                      const numValue = parseFloat(value);
                      if (!isNaN(numValue) && numValue >= 0) {
                    setGeneralTerm(value);
                      }
                  }}
                    style={{
                      ...styles.loanInput,
                      padding: '14px 52px 14px 16px',
                      height: '100%',
                      lineHeight: '20px',
                      boxSizing: 'border-box',
                      textAlign: 'right',
                      transform: 'none',
                    }}
                  placeholder="Enter months"
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0d1a4b';
                      e.target.style.boxShadow = '0 0 0 3px rgba(13, 26, 75, 0.12)';
                      e.target.style.backgroundColor = '#fffef0';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)';
                      e.target.style.backgroundColor = '#fffde7';
                    }}
                  />
                  <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#111827', fontSize: '13px', fontWeight: '500', pointerEvents: 'none', lineHeight: 1 }}>months</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Payment Summary */}
          <div 
            style={styles.paymentSummary}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 40px 0 rgba(0, 0, 0, 0.12), 0 6px 20px 0 rgba(0, 0, 0, 0.1), 0 2px 8px 0 rgba(0, 0, 0, 0.06)';
              e.currentTarget.style.border = '1px solid rgba(229, 231, 235, 0.8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px 0 rgba(0, 0, 0, 0.08)';
              e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.3)';
            }}
          >
            <h3 style={styles.paymentSummaryTitle}>Payment Summary</h3>
            <div style={styles.paymentSummaryList}>
              <div style={styles.paymentSummaryItem}>
                <span style={styles.paymentSummaryLabel}>Interest Paid</span>
                <span style={styles.paymentSummaryValue}>{formatCurrency(generalLoanData.summary.interestPaid)}</span>
              </div>
              <div style={styles.paymentSummaryItem}>
                <span style={styles.paymentSummaryLabel}>Principal Paid</span>
                <span style={styles.paymentSummaryValue}>{formatCurrency(generalLoanData.summary.principalPaid)}</span>
              </div>
              <div style={styles.paymentSummaryItem}>
                <span style={styles.paymentSummaryLabel}>Total Amount Paid</span>
                <span style={styles.paymentSummaryValue}>{formatCurrency(generalLoanData.summary.totalAmountPaid)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* General Loan Chart Section */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px', width: '100%' }}>
          <div 
            style={{ ...styles.chartCardEnhanced, cursor: 'pointer', width: 'calc(50% - 8px)', maxWidth: 'calc(50% - 8px)' }}
            onClick={() => setExpandedChart('generalLoan')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 40px 0 rgba(0, 0, 0, 0.12), 0 6px 20px 0 rgba(0, 0, 0, 0.1), 0 2px 8px 0 rgba(0, 0, 0, 0.06)';
              e.currentTarget.style.border = '1px solid rgba(229, 231, 235, 0.8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px 0 rgba(0, 0, 0, 0.08)';
              e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.3)';
            }}
          >
          <div style={styles.chartHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <h3 style={{ ...styles.chartTitle, flex: 'none' }}>General Loan: Interest vs Principal</h3>
              </div>
              <div style={{ 
                fontSize: '11px', 
                color: '#0d1a4b', 
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                backgroundColor: 'rgba(13, 26, 75, 0.08)',
                borderRadius: '6px',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}>
                <span>Click to expand</span>
              </div>
          </div>
          <div style={{ fontSize: '15px', color: '#666', textAlign: 'center', marginBottom: '10px', fontWeight: '600' }}>Fixed Monthly Payment</div>
          <div style={styles.chartContainer}>
            <Bar 
              data={{
                labels: generalLoanData.amortizationTable.map((_, index) => index + 1),
                datasets: [
                  {
                    label: 'Principal Payment',
                    data: generalLoanData.amortizationTable.map(month => month.principal),
                      backgroundColor: '#0d1a4b',
                      borderColor: '#0a1440',
                      borderWidth: 0,
                      borderRadius: 4,
                    stack: 'stack3'
                  },
                  {
                    label: 'Interest Payment',
                    data: generalLoanData.amortizationTable.map(month => month.interest),
                      backgroundColor: 'rgba(139, 157, 196, 0.45)',
                      borderColor: 'rgba(107, 127, 168, 0.4)',
                      borderWidth: 0,
                      borderRadius: 4,
                    stack: 'stack3'
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                  interaction: {
                    intersect: false,
                    mode: 'index'
                  },
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: false
                    },
                    tooltip: {
                      animation: {
                        duration: 0
                      },
                      position: 'nearest',
                      backgroundColor: 'rgba(13, 26, 75, 0.95)',
                      padding: 12,
                      titleFont: {
                        size: 14,
                        weight: '600'
                      },
                      bodyFont: {
                        size: 13
                      },
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      borderWidth: 1,
                      cornerRadius: 8,
                      displayColors: true,
                      callbacks: {
                        label: function(context) {
                          return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                      }
                  }
                },
                scales: {
                  x: {
                    grid: { display: false },
                    title: {
                      display: true,
                      text: 'Month'
                    }
                  },
                  y: {
                    grid: { display: false },
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Payment'
                    },
                    ticks: {
                      callback: function(value) {
                        return formatCurrency(value);
                      }
                    }
                  }
                  },
                  animation: {
                    duration: 0
                }
              }}
              style={{ height: '200px' }}
            />
          </div>
        </div>
      </div>
      </div>

      {/* Note */}
      <div style={{ ...styles.note, marginTop: '24px' }}>
        Note: Adjust Week 1 Budget based on this week's insights
      </div>

      {/* Chart Modal */}
      {expandedChart && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
        display: 'flex', 
            alignItems: 'center',
        justifyContent: 'center', 
            zIndex: 1000,
        padding: '20px',
          }}
          onClick={() => setExpandedChart(null)}
        >
          <div 
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              width: '100%',
              boxShadow: '0 20px 60px 0 rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              position: 'relative',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setExpandedChart(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(13, 26, 75, 0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                color: '#0d1a4b',
                fontWeight: 'bold',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(13, 26, 75, 0.2)';
                e.target.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(13, 26, 75, 0.1)';
                e.target.style.transform = 'scale(1)';
              }}
            >
              ×
            </button>

            {/* Chart Title */}
            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: '700', 
                color: '#0d1a4b',
                margin: 0,
                marginBottom: '8px'
              }}>
                {expandedChart === 'userPayment' && 'Debt Payments: Interest vs Principal'}
                {expandedChart === 'minimumPayment' && 'Debt Payments: Interest vs Principal'}
                {expandedChart === 'generalLoan' && 'General Loan: Interest vs Principal'}
              </h2>
              <div style={{ fontSize: '14px', color: '#666', fontWeight: '600' }}>
                {expandedChart === 'userPayment' && 'User Input Payment'}
                {expandedChart === 'minimumPayment' && 'Minimum Payment'}
                {expandedChart === 'generalLoan' && 'Fixed Monthly Payment'}
              </div>
      </div>

            {/* Expanded Chart */}
            <div style={{ height: '60vh', minHeight: '500px' }}>
              <Bar 
                data={
                  expandedChart === 'userPayment' ? {
                    labels: userPaymentData.amortizationTable.map((_, index) => index + 1),
                    datasets: [
                      {
                        label: 'Principal Payment',
                        data: userPaymentData.amortizationTable.map(month => month.principal),
                        backgroundColor: '#0d1a4b',
                        borderColor: '#0a1440',
                        borderWidth: 0,
                        borderRadius: 4,
                        stack: 'stack1'
                      },
                      {
                        label: 'Interest Payment',
                        data: userPaymentData.amortizationTable.map(month => month.interest),
                        backgroundColor: 'rgba(139, 157, 196, 0.45)',
                        borderColor: 'rgba(107, 127, 168, 0.4)',
                        borderWidth: 0,
                        borderRadius: 4,
                        stack: 'stack1'
                      }
                    ]
                  } : expandedChart === 'minimumPayment' ? {
                    labels: minimumPaymentData.amortizationTable.slice(0, 100).map((_, index) => index + 1),
                    datasets: [
                      {
                        label: 'Principal Payment',
                        data: minimumPaymentData.amortizationTable.slice(0, 100).map(month => month.principal),
                        backgroundColor: '#0d1a4b',
                        borderColor: '#0a1440',
                        borderWidth: 0,
                        borderRadius: 4,
                        stack: 'stack2'
                      },
                      {
                        label: 'Interest Payment',
                        data: minimumPaymentData.amortizationTable.slice(0, 100).map(month => month.interest),
                        backgroundColor: 'rgba(139, 157, 196, 0.45)',
                        borderColor: 'rgba(107, 127, 168, 0.4)',
                        borderWidth: 0,
                        borderRadius: 4,
                        stack: 'stack2'
                      }
                    ]
                  } : {
                    labels: generalLoanData.amortizationTable.map((_, index) => index + 1),
                    datasets: [
                      {
                        label: 'Principal Payment',
                        data: generalLoanData.amortizationTable.map(month => month.principal),
                        backgroundColor: '#0d1a4b',
                        borderColor: '#0a1440',
                        borderWidth: 0,
                        borderRadius: 4,
                        stack: 'stack3'
                      },
                      {
                        label: 'Interest Payment',
                        data: generalLoanData.amortizationTable.map(month => month.interest),
                        backgroundColor: 'rgba(139, 157, 196, 0.45)',
                        borderColor: 'rgba(107, 127, 168, 0.4)',
                        borderWidth: 0,
                        borderRadius: 4,
                        stack: 'stack3'
                      }
                    ]
                  }
                }
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: {
                    intersect: false,
                    mode: 'index'
                  },
                  plugins: {
                    legend: {
                      position: 'top',
                      labels: {
                        font: {
                          size: 18,
                          weight: '600'
                        },
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'rectRounded',
                        boxWidth: 20,
                        boxHeight: 20
                      }
                    },
                    title: {
                      display: false
                    },
                    tooltip: {
                      animation: {
                        duration: 0
                      },
                      position: 'nearest',
                      backgroundColor: 'rgba(13, 26, 75, 0.95)',
                      padding: 16,
                      titleFont: {
                        size: 20,
                        weight: '600'
                      },
                      bodyFont: {
                        size: 16
                      },
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      borderWidth: 1,
                      cornerRadius: 8,
                      displayColors: true,
                      callbacks: {
                        label: function(context) {
                          return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      title: {
                        display: true,
                        text: 'Month',
                        font: {
                          size: 22,
                          weight: '700'
                        },
                        padding: {
                          top: 15,
                          bottom: 15
                        }
                      },
                      ticks: {
                        font: {
                          size: 16,
                          weight: '500'
                        },
                        padding: 12
                      }
                    },
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Payment',
                        font: {
                          size: 22,
                          weight: '700'
                        },
                        padding: {
                          top: 15,
                          bottom: 15
                        }
                      },
                      ticks: {
                        font: {
                          size: 16,
                          weight: '500'
                        },
                        padding: 12,
                        callback: function(value) {
                          return formatCurrency(value);
                        }
                      }
                    }
                  },
                  animation: {
                    duration: 0
                  }
                }}
              />
      </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Week3CreditCard;
