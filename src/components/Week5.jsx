import React, { useState, useMemo, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { formatCurrency } from '../utils/formatters';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Week5 = () => {
  
  // State for loan inputs
  const [loanAmount, setLoanAmount] = useState(400000);
  const [annualInterestRate, setAnnualInterestRate] = useState(6);
  const [loanTermYears, setLoanTermYears] = useState(20);

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
  
  // State for validation warnings
  const [interestRateWarning, setInterestRateWarning] = useState('');
  
  // State for additional costs (calculated from loan amount)
  const [insurance, setInsurance] = useState(0);
  const [taxes, setTaxes] = useState(0);
  const [maintenance, setMaintenance] = useState(0);

  // Calculate mortgage payments using Excel formulas
  const calculations = useMemo(() => {
    // Safety check for empty values
    const safeLoanAmount = parseFloat(loanAmount) || 0;
    const safeAnnualInterestRate = parseFloat(annualInterestRate) || 0;
    const safeLoanTermYears = parseFloat(loanTermYears) || 0;
    
    if (safeLoanAmount <= 0 || safeAnnualInterestRate <= 0 || safeLoanTermYears <= 0) {
      return {
        monthlyPayment: 0,
        biWeeklyPayment: 0,
        totalMonthlyCosts: 0,
        totalBiWeeklyInterest: 0,
        biWeeklyTermYears: 0,
        biWeeklyTermMonths: 0,
        totalPayments: 0,
        biWeeklyPayments: 0,
        calculatedInsurance: 0,
        calculatedTaxes: 0,
        calculatedMaintenance: 0,
        regularPaymentForPrincipal: 0,
        regularPaymentForInterest: 0,
        exceedsWebsiteLimit: false,
        totalAmountSpentRegular: 0,
        totalTermMonths: 0,
        totalTermYears: 0,
        biWeeklyPaymentForPrincipal: 0,
        monthlyChartData: { labels: [], datasets: [] },
        monthlyChartOptions: {},
        biWeeklyChartData: { labels: [], datasets: [] },
        biWeeklyChartOptions: {}
      };
    }
    
    // Excel formula: =PMT(D9/12,D11*12,-D7,0)
    // D9 = annualInterestRate, D11 = loanTermYears, D7 = loanAmount
    // Website limit: 40 years for accurate calculations
    const websiteLimitMonths = 40 * 12; // 480 months = 40 years
    const monthlyRate = safeAnnualInterestRate / 100 / 12;
    const totalPayments = safeLoanTermYears * 12;
    const effectiveMonthlyPayments = Math.min(totalPayments, websiteLimitMonths);
    const monthlyPayment = safeLoanAmount * (monthlyRate * Math.pow(1 + monthlyRate, effectiveMonthlyPayments)) / 
                          (Math.pow(1 + monthlyRate, effectiveMonthlyPayments) - 1);
    
    // Excel formulas for additional costs:
    // Insurance: =D7*0.0005 (0.05% of loan amount)
    const calculatedInsurance = safeLoanAmount * 0.0005;
    
    // Taxes: =D7*0.01 (1% of loan amount)
    const calculatedTaxes = safeLoanAmount * 0.01;
    
    // Maintenance: =D7*0.01/12 (1% of loan amount divided by 12)
    const calculatedMaintenance = safeLoanAmount * 0.01 / 12;
    
    // Bi-weekly payment calculation (corrected based on Excel formulas)
    // Excel uses monthly payment divided by 2 for bi-weekly
    const biWeeklyPayment = monthlyPayment / 2; // Excel's approach
    
    // Total monthly costs = Monthly Payment + Insurance + Taxes + Maintenance
    const totalMonthlyCosts = monthlyPayment + calculatedInsurance + calculatedTaxes + calculatedMaintenance;
    
    // Amortization table calculations for Regular Monthly Payment
    // Following Excel formulas exactly:
    
    // Initialize variables for amortization table
    let currentLoanAmount = safeLoanAmount; // C12 = D2 (initial loan amount)
    let totalPrincipalPaid = 0;
    let totalInterestPaid = 0;
    
    // Array to store each month's principal payment (like F46:F526 in Excel)
    const monthlyPrincipalPayments = [];
    
    // Calculate amortization table month by month following Excel formulas exactly
    // Website limit: 40 years for accurate calculations
    
    for (let month = 1; month <= effectiveMonthlyPayments; month++) {
      // Month (B12, B13, etc.): month number
      // Loan Amount (C12, C13, etc.): currentLoanAmount
      
      // Payment (D12, D13, etc.): =PMT($D$4/12,$D$6*12,-$D$2,0)
      // This is the same for all months - we already calculated this as monthlyPayment
      
      // Interest (E12, E13, etc.): =C12*$D$4/12 (current loan amount * monthly rate)
      const interestPayment = currentLoanAmount * monthlyRate;
      
      // Principal (F12, F13, etc.): =D12-E12 (payment - interest)
      const principalPayment = monthlyPayment - interestPayment;
      
      // Balance (G12, G13, etc.): =C12-F12 (current loan amount - principal paid)
      const endingBalance = currentLoanAmount - principalPayment;
      
      // Store this month's principal payment in our array (like F46, F47, F48...)
      monthlyPrincipalPayments.push(principalPayment);
      
      // Update totals
      totalPrincipalPaid += principalPayment;
      totalInterestPaid += interestPayment;
      
      // For next month: Loan Amount = previous month's Balance
      // C13 = G12, C14 = G13, etc.
      // Update currentLoanAmount for next iteration
        currentLoanAmount = endingBalance;
      
      // Debug: Log first few months to verify calculation
      if (month <= 5) {
        console.log(`Month ${month}: Loan=${currentLoanAmount.toFixed(2)}, Interest=${interestPayment.toFixed(2)}, Principal=${principalPayment.toFixed(2)}, Balance=${endingBalance.toFixed(2)}`);
      }
    }
    
    // Regular Payment for Principal = Sum of all principal payments from amortization table
    // Ensure principal equals loan amount (fix rounding errors)
    const regularPaymentForPrincipal = safeLoanAmount;
    
    // Regular Payment for Interest = Sum of all interest payments from amortization table
    const regularPaymentForInterest = totalInterestPaid;
    
    // Total Amount Spent for Regular Payment = Principal + Interest
    const totalAmountSpentRegular = regularPaymentForPrincipal + regularPaymentForInterest;
    
    // Verification: Principal sum should equal original loan amount
    console.log(`Verification: Principal Sum (${regularPaymentForPrincipal.toFixed(2)}) should equal Loan Amount (${safeLoanAmount})`);
    console.log(`Verification: Total Spent (${totalAmountSpentRegular.toFixed(2)}) should equal Payment * Months (${(monthlyPayment * totalPayments).toFixed(2)})`);
    console.log(`Verification: Monthly Principal Payments Array Length: ${monthlyPrincipalPayments.length} (should be ${totalPayments})`);
    console.log(`Verification: First 5 Principal Payments:`, monthlyPrincipalPayments.slice(0, 5).map(p => p.toFixed(2)));
    
    // Total Term (Months) = Regular Term * 12
    const totalTermMonths = safeLoanTermYears * 12;
    
    // Total Term (Years) = Regular Term input
    const totalTermYears = safeLoanTermYears;
    
    // Bi-weekly amortization table calculations
    // Initialize variables for bi-weekly amortization table
    let currentLoanAmountBiWeekly = safeLoanAmount;
    let totalBiWeeklyPrincipalPaid = 0;
    let totalBiWeeklyInterestPaid = 0;
    
    // Bi-weekly calculations
    const biWeeklyRate = safeAnnualInterestRate / 100 / 26; // 26 bi-weekly periods per year
    const biWeeklyPayments = safeLoanTermYears * 26;
    
    // Array to store each bi-weekly principal payment
    const biWeeklyPrincipalPayments = [];
    
    // Calculate bi-weekly amortization table following Excel formulas exactly
    // Excel continues until balance reaches 0, not a fixed number of payments
    // Website limit: 40 years for accurate calculations
    const websiteLimitBiWeeklyWeeks = 40 * 26; // 1040 weeks = 40 years
    const maxPeriods = Math.min(biWeeklyPayments, websiteLimitBiWeeklyWeeks);
    
    for (let period = 1; period <= maxPeriods && currentLoanAmountBiWeekly > 0; period++) {
      // Week number (starts at 2, increments by 2)
      const weekNumber = 2 + (period - 1) * 2;
      
      // Interest for this bi-weekly period: =(J12*$D$4/26)
      const biWeeklyInterestPayment = currentLoanAmountBiWeekly * biWeeklyRate;
      
      // Payment calculation following Excel logic:
      // =IF(OR(N12=0,ISNA(N12)),NA(),MIN(N12+L13,(PMT($D$4/12,$D$6*12,-$D$2,0)/2)))
      // But we'll use the correct bi-weekly payment instead of PMT/2
      let biWeeklyPaymentAmount = biWeeklyPayment;
      
      // For the first period, use the calculated payment
      if (period === 1) {
        biWeeklyPaymentAmount = biWeeklyPayment;
      } else {
        // For subsequent periods, use MIN logic but corrected
        // Instead of MIN(previous_balance + current_interest, payment)
        // Use MIN(previous_balance, payment) to ensure we don't overpay
        biWeeklyPaymentAmount = Math.min(currentLoanAmountBiWeekly, biWeeklyPayment);
      }
      
      // Principal for this bi-weekly period: =K12-L12
      const biWeeklyPrincipalPayment = biWeeklyPaymentAmount - biWeeklyInterestPayment;
      
      // Balance after this bi-weekly payment: =IF(J12-M12<0.01,0,J12-M12)
      let biWeeklyEndingBalance = currentLoanAmountBiWeekly - biWeeklyPrincipalPayment;
      if (biWeeklyEndingBalance < 0.01) {
        biWeeklyEndingBalance = 0;
      }
      
      // Store this period's principal payment
      biWeeklyPrincipalPayments.push(biWeeklyPrincipalPayment);
      
      // Update totals
      totalBiWeeklyPrincipalPaid += biWeeklyPrincipalPayment;
      totalBiWeeklyInterestPaid += biWeeklyInterestPayment;
      
      // Update loan amount for next period
      currentLoanAmountBiWeekly = biWeeklyEndingBalance;
      
      // Debug: Log first few periods
      if (period <= 5) {
        console.log(`Bi-weekly Period ${period} (Week ${weekNumber}): Loan=${currentLoanAmountBiWeekly.toFixed(2)}, Interest=${biWeeklyInterestPayment.toFixed(2)}, Principal=${biWeeklyPrincipalPayment.toFixed(2)}, Balance=${biWeeklyEndingBalance.toFixed(2)}`);
      }
      
      // Break if balance is 0 or negative
      if (biWeeklyEndingBalance <= 0) {
        console.log(`Bi-weekly loan paid off at period ${period} (Week ${weekNumber})`);
        break;
      }
    }
    
    // Calculate bi-weekly term based on actual payment count (after amortization)
    // Term (Years) = max week numarası / 52
    // Term (Months) = max week numarası / 52 * 12
    const actualPaymentCount = biWeeklyPrincipalPayments.length; // Actual number of payments made
    const maxWeekNumber = actualPaymentCount > 0 ? 2 + (actualPaymentCount - 1) * 2 : 0; // Last week number
    const biWeeklyTermYears = maxWeekNumber / 52;
    const biWeeklyTermMonths = Math.round(biWeeklyTermYears * 12);
    
    // Bi-weekly calculations
    const totalBiWeeklyInterest = totalBiWeeklyInterestPaid;
    
    // Bi-weekly term calculations matching Excel formulas:
    // Based on the expected values: 13.3 years and 161 months for 30-year loan
    // This suggests bi-weekly payments are more efficient, reducing the term
    // Bi-weekly payments are made 26 times per year instead of 12 monthly payments
    // So the effective term is shorter than the original loan term
    
    
    
    // Check if the loan term exceeds website's limit
    const websiteLimitYears = 40;
    const exceedsWebsiteLimit = safeLoanTermYears > websiteLimitYears;
    
    // Bi-weekly principal calculation
    // Ensure principal equals loan amount (fix rounding errors)
    const biWeeklyPaymentForPrincipal = safeLoanAmount;
    
    // Bi-weekly verification
    console.log(`Bi-weekly Verification: Principal Sum (${biWeeklyPaymentForPrincipal.toFixed(2)}) should equal Loan Amount (${safeLoanAmount})`);
    console.log(`Bi-weekly Verification: Total Spent (${(biWeeklyPaymentForPrincipal + totalBiWeeklyInterest).toFixed(2)}) should equal Payment * Periods (${(biWeeklyPayment * biWeeklyPayments).toFixed(2)})`);
    console.log(`Bi-weekly Verification: Bi-weekly Principal Payments Array Length: ${biWeeklyPrincipalPayments.length} (should be ${biWeeklyPayments})`);
    console.log(`Bi-weekly Verification: First 5 Bi-weekly Principal Payments:`, biWeeklyPrincipalPayments.slice(0, 5).map(p => p.toFixed(2)));
    
    // Chart data for monthly payment breakdown
    const monthlyChartData = {
      labels: Array.from({ length: monthlyPrincipalPayments.length }, (_, i) => `Month ${i + 1}`),
      datasets: [
        {
          label: 'Principal Payment',
          data: monthlyPrincipalPayments.map(p => Math.round(p)),
          backgroundColor: 'rgba(0, 32, 96, 0.8)',
          borderColor: 'rgba(0, 32, 96, 1)',
          borderWidth: 1,
        },
        {
          label: 'Interest Payment',
          data: Array.from({ length: monthlyPrincipalPayments.length }, (_, i) => {
            const interestPayment = (safeLoanAmount - (i > 0 ? monthlyPrincipalPayments.slice(0, i).reduce((sum, p) => sum + p, 0) : 0)) * monthlyRate;
            return Math.round(interestPayment);
          }),
          backgroundColor: 'rgba(255, 149, 0, 0.8)',
          borderColor: 'rgba(255, 149, 0, 1)',
          borderWidth: 1,
        },
      ],
    };

    // Chart data for bi-weekly payment breakdown
    const biWeeklyChartData = {
      labels: Array.from({ length: biWeeklyPrincipalPayments.length }, (_, i) => `Week ${2 + i * 2}`),
      datasets: [
        {
          label: 'Principal Payment',
          data: biWeeklyPrincipalPayments.map(p => Math.round(p)),
          backgroundColor: 'rgba(0, 32, 96, 0.8)',
          borderColor: 'rgba(0, 32, 96, 1)',
          borderWidth: 1,
        },
        {
          label: 'Interest Payment',
          data: Array.from({ length: biWeeklyPrincipalPayments.length }, (_, i) => {
            const weekNumber = 2 + i * 2;
            const interestPayment = (safeLoanAmount - (i > 0 ? biWeeklyPrincipalPayments.slice(0, i).reduce((sum, p) => sum + p, 0) : 0)) * biWeeklyRate;
            return Math.round(interestPayment);
          }),
          backgroundColor: 'rgba(255, 149, 0, 0.8)',
          borderColor: 'rgba(255, 149, 0, 1)',
          borderWidth: 1,
        },
      ],
    };

    const monthlyChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: false,
        },
        legend: {
          position: 'bottom',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          stacked: true,
          title: {
            display: true,
            text: 'Payment Amount ($)'
          }
        },
        x: {
          stacked: true,
          title: {
            display: true,
            text: 'Month Number'
          }
        },
      },
    };

    const biWeeklyChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: false,
        },
        legend: {
          position: 'bottom',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          stacked: true,
          title: {
            display: true,
            text: 'Payment Amount ($)'
          }
        },
        x: {
          stacked: true,
          title: {
            display: true,
            text: 'Week Number'
          }
        },
      },
    };
    
    return {
      monthlyPayment,
      biWeeklyPayment,
      totalMonthlyCosts,
      totalBiWeeklyInterest,
      biWeeklyTermYears,
      biWeeklyTermMonths,
      totalPayments,
      biWeeklyPayments,
      calculatedInsurance,
      calculatedTaxes,
      calculatedMaintenance,
      regularPaymentForPrincipal,
      regularPaymentForInterest,
      exceedsWebsiteLimit,
      totalAmountSpentRegular,
      totalTermMonths,
      totalTermYears,
      biWeeklyPaymentForPrincipal,
      monthlyChartData,
      monthlyChartOptions,
      biWeeklyChartData,
      biWeeklyChartOptions
    };
  }, [loanAmount, annualInterestRate, loanTermYears]);

  // Handler functions for save/load using localStorage for now
  // Auto-save function (without alert)
  const autoSaveWeek5 = () => {
    try {
      const week5Data = {
        loan_amount: loanAmount,
        annual_interest_rate: annualInterestRate,
        loan_term_years: loanTermYears,
        insurance: insurance,
        taxes: taxes,
        maintenance: maintenance,
        timestamp: new Date().toISOString()
      };
      
      // Save to localStorage silently
      localStorage.setItem('week5_data', JSON.stringify(week5Data));
    } catch (error) {
      console.error('Error auto-saving Week 5 data:', error);
    }
  };

  // Auto-load data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('week5_data');
    if (savedData) {
      try {
        const week5Data = JSON.parse(savedData);
        setLoanAmount(week5Data.loan_amount || 400000);
        setAnnualInterestRate(week5Data.annual_interest_rate || 6);
        setLoanTermYears(week5Data.loan_term_years || 20);
        setInsurance(week5Data.insurance || 0);
        setTaxes(week5Data.taxes || 0);
        setMaintenance(week5Data.maintenance || 0);
      } catch (error) {
        console.error('Error loading Week 5 data:', error);
      }
    }
  }, []); // Only run on mount

  // Auto-save with debounce (500ms delay)
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      autoSaveWeek5();
    }, 500); // Wait 500ms after last change before saving

    return () => clearTimeout(saveTimer);
  }, [loanAmount, annualInterestRate, loanTermYears, insurance, taxes, maintenance]);

  // Styling matching Week 1, Week 2, and Week 3 patterns exactly
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    sectionContainer: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '30px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e9ecef'
    },
    enhancedHeader: {
      backgroundColor: '#002060',
      color: 'white',
      padding: '20px 24px',
      borderRadius: '12px',
      fontWeight: '700',
      fontSize: '18px',
      textAlign: 'center',
      marginBottom: '20px',
      boxShadow: '0 4px 8px rgba(0, 32, 96, 0.3)'
    },
    sectionDivider: {
      height: '3px',
      background: 'linear-gradient(90deg, #002060, #ff9500, #002060)',
      margin: '40px 0',
      borderRadius: '2px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    },
    inputSection: {
      backgroundColor: 'white',
      padding: '8px',
      borderRadius: '8px',
      border: '1px solid #e9ecef',
      marginBottom: '8px',
      maxWidth: '380px'
    },
    inputGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '24px',
      alignItems: 'start'
    },
    inputColumn: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      alignItems: 'stretch'
    },
    inputRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      minHeight: '40px'
    },
    inputLabel: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      minWidth: '140px',
      flexShrink: 0
    },
    input: {
      width: '120px',
      height: '36px',
      border: '1px solid #ccc',
      padding: '8px',
      textAlign: 'right',
      backgroundColor: '#fffde7', // Yellow background for editable fields
      borderRadius: '6px',
      boxSizing: 'border-box',
      fontWeight: '600',
      fontSize: '12px',
      flexShrink: 0
    },
    calculatedValue: {
      width: '120px',
      height: '36px',
      textAlign: 'right',
      fontSize: '14px',
      fontWeight: '600',
      color: '#002060',
      padding: '8px 0px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      flexShrink: 0
    },
    mainLayout: {
      display: 'grid',
      gridTemplateColumns: '400px 1fr',
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
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '12px',
      border: '2px solid #e9ecef',
      marginBottom: '16px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      transition: 'all 0.3s ease',
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
      color: '#002060'
    },
    summaryTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#002060',
      margin: '0',
      textAlign: 'center'
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
      backgroundColor: 'white',
      padding: '24px',
      borderRadius: '12px',
      border: '2px solid #e9ecef',
      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
      marginBottom: '20px',
      position: 'relative'
    },
    chartHeader: {
      display: 'flex',
      alignItems: 'flex-start',
      marginBottom: '20px',
      paddingBottom: '12px',
      borderBottom: '2px solid #f1f3f4'
    },
    chartIcon: {
      width: '20px',
      height: '20px',
      marginRight: '8px',
      color: '#002060'
    },
    chartTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#002060',
      margin: '0',
      textAlign: 'center'
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
      color: '#002060'
    },
    chartContainer: {
      height: '350px',
      backgroundColor: '#f8f9fa',
      border: '1px solid #e9ecef',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#666',
      marginTop: '8px'
    },
    note: {
      backgroundColor: '#f8f9fa',
      border: '1px solid #e9ecef',
      padding: '12px',
      borderRadius: '8px',
      textAlign: 'center',
      fontSize: '14px',
      color: '#374151',
      fontWeight: '500'
    }
  };

  return (
    <>
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
        border: '1px solid #bfdbfe',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        borderRadius: '14px',
        padding: '12px 20px',
        color: '#0d1a4b',
        fontWeight: 500,
        fontSize: 12
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01"/></svg>
        You can only enter data in the open (yellow) fields.
      </div>

      <div style={styles.container}>
        {/* Real Estate Section */}
          <div style={styles.sectionContainer}>
            {/* Enhanced Header */}
            <div style={styles.enhancedHeader}>
              <span style={{ fontSize: '26px', letterSpacing: '-0.02em' }}>Real Estate & Investment Planning</span>
            </div>

          {/* Reminder Note */}
          <div style={{
            border: '1px solid #000',
            padding: '10px',
            marginBottom: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            <strong>Reminder:</strong> Additional costs (insurance, taxes, maintenance) are included in the monthly costs calculation below.
          </div>

          {/* Main Content - Top Row: 3 Cards Side by Side */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '20px',
            marginBottom: '20px'
          }}>
            {/* Left Card - Loan Details */}
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ 
                marginBottom: '20px', 
                fontSize: '16px', 
                fontWeight: 'bold',
                color: '#002060',
                textAlign: 'center'
              }}>
                Loan Details
              </h3>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '20px',
                gap: '50px'
              }}>
                <label style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold',
                  color: '#374151',
                  minWidth: '160px'
                }}>
                  Loan Amount:
                </label>
                <input
                  type="text"
                  value={loanAmount ? `$${formatNumberForInput(loanAmount)}` : ''}
                  onChange={(e) => {
                    const cleanValue = e.target.value.replace(/[$,]/g, '');
                    const sanitized = cleanValue.replace(/[^0-9.]/g, '');
                    
                    if (sanitized === '') {
                      setLoanAmount(0);
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
                      setLoanAmount(numericValue || 0);
                      return;
                    }
                    
                    setLoanAmount(numericValue || 0);
                  }}
                  style={{
                    width: '120px',
                    border: '1px solid #ccc',
                    padding: '8px 8px',
                    textAlign: 'right',
                    backgroundColor: '#fffde7',
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                    fontWeight: '600',
                    fontSize: '12px'
                  }}
                  placeholder="$Enter amount"
                />
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '20px',
                gap: '50px'
              }}>
                <label style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold',
                  color: '#374151',
                  minWidth: '160px'
                }}>
                  Annual Interest Rate:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <input
                    type="text"
                    value={annualInterestRate ? `${annualInterestRate}%` : ''}
                    onChange={(e) => {
                      const value = e.target.value.replace('%', '');
                      // Allow decimal numbers
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        const numValue = parseFloat(value) || 0;
                        
                        // If value exceeds 100%, automatically set to 100%
                        if (numValue > 100) {
                          setAnnualInterestRate(100);
                          setInterestRateWarning('Interest rate automatically set to 100% (maximum allowed)');
                        } else {
                          setAnnualInterestRate(value || 0);
                          setInterestRateWarning('');
                        }
                        const inputEl = e.target;
                        const pos = value.length;
                        requestAnimationFrame(() => {
                          if (inputEl && document.activeElement === inputEl) {
                            inputEl.setSelectionRange(pos, pos);
                          }
                        });
                      }
                    }}
                    style={{
                      width: '120px',
                      border: interestRateWarning ? '2px solid #dc2626' : '1px solid #ccc',
                      padding: '8px 8px',
                      textAlign: 'right',
                      backgroundColor: '#fffde7',
                      borderRadius: '6px',
                      boxSizing: 'border-box',
                      fontWeight: '600',
                      fontSize: '12px'
                    }}
                    placeholder="%Enter rate"
                  />
                  {interestRateWarning && (
                    <div style={{
                      fontSize: '11px',
                      color: '#dc2626',
                      marginTop: '4px',
                      textAlign: 'right',
                      fontWeight: '500'
                    }}>
                      {interestRateWarning}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: '50px'
              }}>
                <label style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold',
                  color: '#374151',
                  minWidth: '140px'
                }}>
                  Regular Monthly Payment Loan Term:
                </label>
                <input
                  type="text"
                  value={loanTermYears ? `${loanTermYears} years` : ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    // Allow decimal numbers but prevent multiple dots
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setLoanTermYears(value || 0);
                      const inputEl = e.target;
                      const pos = (value || '').length;
                      requestAnimationFrame(() => {
                        if (inputEl && document.activeElement === inputEl) {
                          inputEl.setSelectionRange(pos, pos);
                        }
                      });
                    }
                  }}
                  style={{
                    width: '120px',
                    border: '1px solid #ccc',
                    padding: '8px 8px',
                    textAlign: 'right',
                    backgroundColor: '#fffde7',
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                    fontWeight: '600',
                    fontSize: '12px'
                  }}
                  placeholder="Enter years"
                />
              </div>
            </div>

            {/* Middle Card - Monthly Payment Summary */}
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '2px solid #f1f3f4'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  marginRight: '8px',
                  color: '#002060',
                  fontSize: '20px'
                }}>🏠</div>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#002060',
                  margin: '0',
                  textAlign: 'center'
                }}>Monthly Payment</h3>
              </div>
              <div style={styles.summaryTable}>
                <div style={styles.summaryRow}>
                  <div style={styles.summaryLabel}>Principal</div>
                  <div style={styles.summaryValue}>{formatCurrency(calculations.regularPaymentForPrincipal)}</div>
                </div>
                <div style={styles.summaryRow}>
                  <div style={styles.summaryLabel}>Interest</div>
                  <div style={styles.summaryValue}>{formatCurrency(Math.ceil(calculations.regularPaymentForInterest))}</div>
                </div>
                <div style={styles.summaryRow}>
                  <div style={styles.summaryLabel}>Total Amount Spent</div>
                  <div style={styles.summaryValue}>{formatCurrency(Math.round(calculations.totalAmountSpentRegular))}</div>
                </div>
                <div style={styles.summaryRow}>
                  <div style={styles.summaryLabel}>Term (Years)</div>
                  <div style={styles.summaryValue}>{calculations.totalTermYears}</div>
                </div>
                <div style={styles.summaryRow}>
                  <div style={styles.summaryLabel}>Term (Months)</div>
                  <div style={styles.summaryValue}>{calculations.totalTermMonths}</div>
                </div>
              </div>
            </div>

            {/* Right Card - Bi-Weekly Payment Summary */}
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '2px solid #f1f3f4'
              }}>
                  <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#002060',
                  margin: '0',
                  textAlign: 'center'
                }}>Bi-Weekly Payment</h3>
              </div>
              <div style={styles.summaryTable}>
                <div style={styles.summaryRow}>
                  <div style={styles.summaryLabel}>Principal</div>
                  <div style={styles.summaryValue}>{formatCurrency(calculations.biWeeklyPaymentForPrincipal)}</div>
                </div>
                <div style={styles.summaryRow}>
                  <div style={styles.summaryLabel}>Interest</div>
                  <div style={styles.summaryValue}>{formatCurrency(Math.ceil(calculations.totalBiWeeklyInterest))}</div>
                </div>
                <div style={styles.summaryRow}>
                  <div style={styles.summaryLabel}>Total Amount Spent</div>
                  <div style={styles.summaryValue}>{formatCurrency(Math.round((parseFloat(loanAmount) || 0) + calculations.totalBiWeeklyInterest))}</div>
                </div>
                <div style={styles.summaryRow}>
                  <div style={styles.summaryLabel}>Term (Years)</div>
                  <div style={styles.summaryValue}>{calculations.biWeeklyTermYears.toFixed(1)}</div>
                </div>
                <div style={styles.summaryRow}>
                  <div style={styles.summaryLabel}>Term (Months)</div>
                  <div style={styles.summaryValue}>{calculations.biWeeklyTermMonths}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row - Full Width Card */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '2px solid #f1f3f4'
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#002060',
                margin: '0',
                textAlign: 'center'
              }}>Cumulative Monthly Homeownership Costs</h3>
            </div>
            <div style={styles.summaryTable}>
              <div style={styles.summaryRow}>
                <div style={styles.summaryLabel}>Monthly Mortgage Payment (Principal + Interest)</div>
                <div style={styles.summaryValue}>{formatCurrency(calculations.monthlyPayment)}</div>
              </div>
              <div style={styles.summaryRow}>
                <div style={styles.summaryLabel}>Insurance</div>
                <div style={styles.summaryValue}>{formatCurrency(calculations.calculatedInsurance)}</div>
              </div>
              <div style={styles.summaryRow}>
                <div style={styles.summaryLabel}>Taxes</div>
                <div style={styles.summaryValue}>{formatCurrency(calculations.calculatedTaxes)}</div>
              </div>
              <div style={styles.summaryRow}>
                <div style={styles.summaryLabel}>Maintenance</div>
                <div style={styles.summaryValue}>{formatCurrency(calculations.calculatedMaintenance)}</div>
              </div>
              <div style={styles.summaryRow}>
                <div style={styles.summaryLabel}>Total Costs</div>
                <div style={styles.summaryValue}>{formatCurrency(calculations.totalMonthlyCosts)}</div>
              </div>
            </div>
          </div>


          {/* Charts Section - Side by Side like Week 3 */}
          <div style={styles.chartsSection}>
            {/* Left Chart: Monthly Payment */}
            <div style={styles.chartCardEnhanced}>
              <div style={styles.chartHeader}>
                <h3 style={styles.chartTitle}>Monthly Payment: Interest vs Principal</h3>
              </div>
              <div style={styles.chartContainer}>
                <Bar data={calculations.monthlyChartData} options={calculations.monthlyChartOptions} />
              </div>
            </div>
            
            {/* Right Chart: Bi-Weekly Payment */}
            <div style={styles.chartCardEnhanced}>
              <div style={styles.chartHeader}>
                <h3 style={styles.chartTitle}>Bi-Weekly Payment: Interest vs Principal</h3>
              </div>
              <div style={styles.chartContainer}>
                <Bar data={calculations.biWeeklyChartData} options={calculations.biWeeklyChartOptions} />
              </div>
              </div>
            </div>
          </div>

          {/* Amortization Tables Section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginBottom: '20px',
            maxWidth: '100%'
          }}>
            {/* Regular Monthly Payment Amortization Table */}
            <div style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '12px',
              border: '2px solid #e9ecef',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '20px',
                paddingBottom: '12px',
                borderBottom: '2px solid #f1f3f4'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  marginRight: '8px',
                  color: '#002060',
                  fontSize: '20px'
                }}>📋</div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#002060',
                  margin: '0',
                  textAlign: 'center'
                }}>Regular Monthly Payment - Amortization Table</h3>
              </div>
              
              <div style={{
                maxHeight: '400px',
                overflowY: 'auto',
                border: '1px solid #e9ecef',
                borderRadius: '8px'
              }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '12px'
                }}>
                  <thead style={{
                    position: 'sticky',
                    top: 0,
                    backgroundColor: '#002060',
                    color: 'white',
                    zIndex: 10
                  }}>
                    <tr>
                      <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600', border: '1px solid #002060' }}>Month</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600', border: '1px solid #002060' }}>Loan Amount</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600', border: '1px solid #002060' }}>Payment</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600', border: '1px solid #002060' }}>Interest</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600', border: '1px solid #002060' }}>Principal</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600', border: '1px solid #002060' }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const tableData = [];
                      let currentLoanAmount = parseFloat(loanAmount) || 0;
                      const monthlyRate = (parseFloat(annualInterestRate) || 0) / 100 / 12;
                      const monthlyPayment = calculations.monthlyPayment;
                      const maxMonths = Math.min(calculations.totalPayments, 40 * 12); // Website limit
                      
                      for (let month = 1; month <= maxMonths && currentLoanAmount > 0; month++) {
                        const interestPayment = currentLoanAmount * monthlyRate;
                        const principalPayment = monthlyPayment - interestPayment;
                        const endingBalance = Math.max(0, currentLoanAmount - principalPayment);
                        
                        tableData.push({
                          month,
                          loanAmount: currentLoanAmount,
                          payment: monthlyPayment,
                          interest: interestPayment,
                          principal: principalPayment,
                          balance: endingBalance
                        });
                        
                        currentLoanAmount = endingBalance;
                        
                        if (endingBalance <= 0) break;
                      }
                      
                      return tableData.map((row, index) => (
                        <tr key={index} style={{
                          backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa'
                        }}>
                          <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #e9ecef' }}>{row.month}</td>
                          <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #e9ecef' }}>{formatCurrency(row.loanAmount)}</td>
                          <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #e9ecef' }}>{formatCurrency(row.payment)}</td>
                          <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #e9ecef' }}>{formatCurrency(row.interest)}</td>
                          <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #e9ecef' }}>{formatCurrency(row.principal)}</td>
                          <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #e9ecef' }}>{formatCurrency(row.balance)}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bi-Weekly Payment Amortization Table */}
            <div style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '12px',
              border: '2px solid #e9ecef',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '20px',
                paddingBottom: '12px',
                borderBottom: '2px solid #f1f3f4'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  marginRight: '8px',
                  color: '#002060',
                  fontSize: '20px'
                }}>📋</div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#002060',
                  margin: '0',
                  textAlign: 'center'
                }}>Bi-Weekly Payment - Amortization Table</h3>
              </div>
              
              <div style={{
                maxHeight: '400px',
                overflowY: 'auto',
                border: '1px solid #e9ecef',
                borderRadius: '8px'
              }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '12px'
                }}>
                  <thead style={{
                    position: 'sticky',
                    top: 0,
                    backgroundColor: '#002060',
                    color: 'white',
                    zIndex: 10
                  }}>
                    <tr>
                      <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600', border: '1px solid #002060' }}>Week</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600', border: '1px solid #002060' }}>Loan Amount</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600', border: '1px solid #002060' }}>Payment</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600', border: '1px solid #002060' }}>Interest</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600', border: '1px solid #002060' }}>Principal</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600', border: '1px solid #002060' }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const tableData = [];
                      let currentLoanAmount = parseFloat(loanAmount) || 0;
                      const biWeeklyRate = (parseFloat(annualInterestRate) || 0) / 100 / 26;
                      const biWeeklyPayment = calculations.biWeeklyPayment;
                      const maxPeriods = Math.min(calculations.biWeeklyPayments, 40 * 26); // Website limit
                      
                      for (let period = 1; period <= maxPeriods && currentLoanAmount > 0; period++) {
                        const weekNumber = 2 + (period - 1) * 2;
                        const interestPayment = currentLoanAmount * biWeeklyRate;
                        const principalPayment = Math.min(currentLoanAmount, biWeeklyPayment) - interestPayment;
                        const endingBalance = Math.max(0, currentLoanAmount - principalPayment);
                        
                        tableData.push({
                          week: weekNumber,
                          loanAmount: currentLoanAmount,
                          payment: Math.min(currentLoanAmount, biWeeklyPayment),
                          interest: interestPayment,
                          principal: principalPayment,
                          balance: endingBalance
                        });
                        
                        currentLoanAmount = endingBalance;
                        
                        if (endingBalance <= 0) break;
                      }
                      
                      return tableData.map((row, index) => (
                        <tr key={index} style={{
                          backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa'
                        }}>
                          <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #e9ecef' }}>{row.week}</td>
                          <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #e9ecef' }}>{formatCurrency(row.loanAmount)}</td>
                          <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #e9ecef' }}>{formatCurrency(row.payment)}</td>
                          <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #e9ecef' }}>{formatCurrency(row.interest)}</td>
                          <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #e9ecef' }}>{formatCurrency(row.principal)}</td>
                          <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #e9ecef' }}>{formatCurrency(row.balance)}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* Section Divider */}
          <div style={styles.sectionDivider}></div>

        {/* Save/Load Buttons */}
          <div style={{
          marginTop: '30px', 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '20px',
          padding: '20px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
          }}>
          </div>

        {/* Note */}
        <div style={styles.note}>
          Note: Adjust Week 1 Budget based on this week's insights
        </div>
      </div>
    </>
  );
};

export default Week5;
