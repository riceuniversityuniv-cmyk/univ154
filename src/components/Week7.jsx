import React, { useState, useMemo, useEffect } from 'react';
import { formatCurrency } from '../utils/formatters';

const Week7 = () => {
  // State for insurance comparison
  const [expectedMedicalExpenses, setExpectedMedicalExpenses] = useState(11000);
  const [hoveredTerm, setHoveredTerm] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

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

  const sanitizeDecimalInput = (rawValue, maxDecimals = 2) => {
    const cleaned = rawValue.replace(/[^0-9.]/g, '');
    const firstDotIndex = cleaned.indexOf('.');

    if (firstDotIndex === -1) return cleaned;

    const intPart = cleaned.slice(0, firstDotIndex);
    const decimalPart = cleaned.slice(firstDotIndex + 1).replace(/\./g, '').slice(0, maxDecimals);
    return `${intPart}.${decimalPart}`;
  };

  const toNumber = (value) => {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  // formatCurrency/formatPercent now come from src/utils/formatters.js (module import above).

  // Definitions for tooltips
  const definitions = {
    'Annual Premium': 'Yearly "membership fee" you pay just to have insurance',
    'Deductible': 'Amount you pay first before insurance helps',
    'Coinsurance Rate': 'Percentage of each bill you still pay after deductible',
    'Max Paid Out-of-Pocket': 'Maximum you\'ll ever pay in a year; after that, insurance pays 100%',
    'Employer HSA Contribution': 'Free money from your employer for medical costs',
    'Out-of-Pocket Medical Costs': 'What you actually pay for care in a year',
    'Less Employer HSA Contribution': 'Subtract employer\'s HSA money to see true yearly cost'
  };
  const defaultHdhpPlan = {
    annualPremium: '6000',
    deductible: '5000',
    coinsuranceRate: '20', // 20% stored as percentage (20)
    maxOutOfPocket: '8000',
    employerHSA: '500',
    // Recommendation values
    annualPremiumRec: 6000,
    deductibleRec: 5000,
    coinsuranceRateRec: 20,
    maxOutOfPocketRec: 8000,
    employerHSARec: 500
  };

  const defaultNormalPlan = {
    annualPremium: '8000',
    deductible: '1000',
    coinsuranceRate: '20', // 20% stored as percentage (20)
    maxOutOfPocket: '4000',
    employerHSA: '0',
    // Recommendation values
    annualPremiumRec: 8000,
    deductibleRec: 1000,
    coinsuranceRateRec: 20,
    maxOutOfPocketRec: 4000,
    employerHSARec: 0
  };

  const normalizePlanForState = (plan, defaults) => ({
    ...defaults,
    ...(plan || {}),
    annualPremium: plan?.annualPremium == null ? defaults.annualPremium : String(plan.annualPremium),
    deductible: plan?.deductible == null ? defaults.deductible : String(plan.deductible),
    coinsuranceRate: plan?.coinsuranceRate == null ? defaults.coinsuranceRate : String(plan.coinsuranceRate),
    maxOutOfPocket: plan?.maxOutOfPocket == null ? defaults.maxOutOfPocket : String(plan.maxOutOfPocket),
    employerHSA: plan?.employerHSA == null ? defaults.employerHSA : String(plan.employerHSA),
    annualPremiumRec: Number.isFinite(Number(plan?.annualPremiumRec)) ? Number(plan.annualPremiumRec) : defaults.annualPremiumRec,
    deductibleRec: Number.isFinite(Number(plan?.deductibleRec)) ? Number(plan.deductibleRec) : defaults.deductibleRec,
    coinsuranceRateRec: Number.isFinite(Number(plan?.coinsuranceRateRec)) ? Number(plan.coinsuranceRateRec) : defaults.coinsuranceRateRec,
    maxOutOfPocketRec: Number.isFinite(Number(plan?.maxOutOfPocketRec)) ? Number(plan.maxOutOfPocketRec) : defaults.maxOutOfPocketRec,
    employerHSARec: Number.isFinite(Number(plan?.employerHSARec)) ? Number(plan.employerHSARec) : defaults.employerHSARec,
  });

  const [hdhpPlan, setHdhpPlan] = useState(defaultHdhpPlan);
  const [normalPlan, setNormalPlan] = useState(defaultNormalPlan);

  // Calculate costs for each plan using Excel formula: =MIN(C10 + (MAX(C4-C10,0)*(C12/100)), C14)
  // Where: C10=deductible, C4=medicalExpenses, C12=coinsuranceRate, C14=maxOutOfPocket
  const calculatePlanCosts = (plan, medicalExpenses) => {
    if (!plan) {
      return { outOfPocketCosts: 0, totalAnnualCost: 0 };
    }
    
    const { annualPremium, deductible, coinsuranceRate, maxOutOfPocket, employerHSA } = plan;
    const annualPremiumNum = toNumber(annualPremium);
    const deductibleNum = toNumber(deductible);
    const coinsuranceRateNum = toNumber(coinsuranceRate);
    const maxOutOfPocketNum = toNumber(maxOutOfPocket);
    const employerHSANum = toNumber(employerHSA);
    const medicalExpensesNum = toNumber(medicalExpenses);
    
    // Excel formula breakdown:
    // C10 = deductible
    // C4 = medicalExpenses  
    // C12 = coinsuranceRate
    // C14 = maxOutOfPocket
    
    // Calculate coinsurance amount: MAX(C4-C10,0)*(C12/100)
    // Only apply coinsurance if medical expenses exceed deductible
    // Note: coinsuranceRate is 20 (20%), so we divide by 100 to get decimal
    const coinsuranceAmount = Math.max(medicalExpensesNum - deductibleNum, 0) * (coinsuranceRateNum / 100);

    // Deductible phase: you only pay up to what you actually spent inside
    // it, not the full deductible unconditionally -- was previously always
    // adding the entire deductible even when medical expenses never
    // reached it (e.g. $500 of expenses against a $5,000 deductible showed
    // $5,000 owed instead of $500). Correct formula:
    // min(medicalExpenses, deductible) + coinsurance on the excess. Same
    // shape as Excel's `Week 9 - Insurance!D25` (inherited bug, fixed here
    // to match the corrected master workbook). See
    // docs/financial-audit-2026-08-11.md finding #5.
    const deductiblePortion = Math.min(medicalExpensesNum, deductibleNum);
    const totalOutOfPocket = deductiblePortion + coinsuranceAmount;

    // Apply max out-of-pocket limit: MIN(totalOutOfPocket, C14)
    const outOfPocketCosts = Math.min(totalOutOfPocket, maxOutOfPocketNum);
    
    const totalAnnualCost = annualPremiumNum + outOfPocketCosts - employerHSANum;
    
    return {
      outOfPocketCosts,
      totalAnnualCost
    };
  };

  // Memoize calculations to prevent unnecessary recalculations
  const hdhpCosts = useMemo(() => {
    try {
      return calculatePlanCosts(hdhpPlan, expectedMedicalExpenses);
    } catch (error) {
      console.error('Error calculating HDHP costs:', error);
      return { outOfPocketCosts: 0, totalAnnualCost: 0 };
    }
  }, [hdhpPlan, expectedMedicalExpenses]);

  const normalCosts = useMemo(() => {
    try {
      return calculatePlanCosts(normalPlan, expectedMedicalExpenses);
    } catch (error) {
      console.error('Error calculating Normal costs:', error);
      return { outOfPocketCosts: 0, totalAnnualCost: 0 };
    }
  }, [normalPlan, expectedMedicalExpenses]);

  const savings = useMemo(() => {
    return normalCosts.totalAnnualCost - hdhpCosts.totalAnnualCost;
  }, [normalCosts.totalAnnualCost, hdhpCosts.totalAnnualCost]);

  const cheaperPlan = savings > 0 ? 'HDHP Plan' : 'Traditional Plan';

  // Auto-save helpers
  const autoSaveWeek7 = () => {
    try {
      const week7Data = {
        week: 7,
        expectedMedicalExpenses,
        hdhpPlan,
        normalPlan,
        timestamp: new Date().toISOString()
      };

      localStorage.setItem('week7_data', JSON.stringify(week7Data));
      return true;
    } catch (error) {
      console.error('Error auto-saving Week 7 data:', error);
      return false;
    }
  };

  const loadWeek7Data = () => {
    const savedData = localStorage.getItem('week7_data');
    if (!savedData) return false;

    const week7Data = JSON.parse(savedData);
    if (week7Data.expectedMedicalExpenses != null) {
      setExpectedMedicalExpenses(week7Data.expectedMedicalExpenses);
    }
    if (week7Data.hdhpPlan) {
      setHdhpPlan(normalizePlanForState(week7Data.hdhpPlan, defaultHdhpPlan));
    }
    if (week7Data.normalPlan) {
      setNormalPlan(normalizePlanForState(week7Data.normalPlan, defaultNormalPlan));
    }
    return true;
  };

  // Auto-load on mount
  useEffect(() => {
    try {
      loadWeek7Data();
    } catch (error) {
      console.error('Error loading Week 7 data:', error);
    }
  }, []);

  // Auto-save with debounce (500ms)
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      autoSaveWeek7();
    }, 500);

    return () => clearTimeout(saveTimer);
  }, [expectedMedicalExpenses, hdhpPlan, normalPlan]);

  // Styling aligned with Week 6 Retirement page
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
    subCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      padding: '24px',
      borderRadius: '12px',
      border: '1px solid rgba(229, 231, 235, 0.5)',
      boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.08)',
      marginBottom: '24px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    subHeader: {
      fontSize: '17px',
      fontWeight: 600,
      color: 'rgba(13, 26, 75, 0.9)',
      margin: '0 0 12px 0',
      letterSpacing: '-0.02em',
      textAlign: 'center',
    },
    titleUnderline: {
      height: '1px',
      backgroundColor: 'rgba(0, 0, 0, 0.12)',
      margin: '10px auto 20px auto',
      borderRadius: '1px',
      maxWidth: '360px',
      width: '100%',
    },
    table: {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: 0,
      marginTop: 12,
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid rgba(229, 231, 235, 0.5)',
      marginBottom: 18,
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.06)',
    },
    th: {
      background: 'linear-gradient(135deg, rgba(13, 26, 75, 0.95) 0%, rgba(30, 58, 138, 0.9) 100%)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      color: 'white',
      padding: '15px 16px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      textAlign: 'center',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      fontSize: '15px',
    },
    td: {
      border: '1px solid rgba(229, 231, 235, 0.5)',
      padding: '14px 16px',
      verticalAlign: 'middle',
      textAlign: 'center',
      backgroundColor: 'white',
      transition: 'background-color 0.15s ease',
    },
    input: {
      width: '120px',
      border: '2px solid #d1d5db',
      padding: '10px 12px',
      textAlign: 'right',
      backgroundColor: '#fffde7',
      borderRadius: '8px',
      boxSizing: 'border-box',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      outline: 'none',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)',
    },
    recommendationText: {
      fontSize: '11px',
      color: '#6b7280',
      fontStyle: 'italic',
      marginTop: '4px',
      textAlign: 'right',
    },
    costGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '24px',
      alignItems: 'stretch',
    },
    costCard: {
      backgroundColor: 'rgba(248, 250, 252, 0.92)',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid rgba(229, 231, 235, 0.9)',
      boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.05)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    costCardTitle: {
      fontSize: '16px',
      fontWeight: 700,
      color: '#0d1a4b',
      marginBottom: '16px',
      letterSpacing: '-0.01em',
    },
    metricRow: {
      marginBottom: '12px',
      fontSize: '14px',
      display: 'flex',
      justifyContent: 'space-between',
      gap: '12px',
      color: '#475569',
    },
    metricValue: {
      fontWeight: 600,
      color: '#0d1a4b',
      textAlign: 'right',
    },
    totalRow: {
      borderTop: '1px solid rgba(13, 26, 75, 0.25)',
      paddingTop: '12px',
      marginTop: '12px',
      fontSize: '15px',
      display: 'flex',
      justifyContent: 'space-between',
      gap: '12px',
      fontWeight: 700,
      color: '#0d1a4b',
    },
    summaryBanner: {
      borderRadius: '10px',
      padding: '14px 18px',
      textAlign: 'center',
      marginBottom: '16px',
      fontSize: '15px',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      border: '1px solid',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    noteBanner: {
      borderRadius: '10px',
      padding: '14px 18px',
      textAlign: 'center',
      marginBottom: '24px',
      border: '1px solid rgba(13, 26, 75, 0.15)',
      backgroundColor: 'rgba(248, 250, 252, 0.85)',
      color: '#334155',
      fontWeight: 500,
      fontSize: '14px',
    },
    tooltip: {
      position: 'fixed',
      zIndex: 10000,
      background: 'linear-gradient(135deg, rgba(13, 26, 75, 0.98) 0%, rgba(30, 58, 138, 0.96) 100%)',
      color: 'white',
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
      animation: 'week7FadeIn 0.2s ease-in-out',
      transform: 'translateX(-50%)',
    },
  };

  return (
    <>
      <style>{`
        @keyframes week7FadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to { opacity: 0.97; transform: translateX(-50%) translateY(0); }
        }
        .week7-insurance-page input,
        .week7-lift-surface,
        .week7-info-surface,
        .week7-data-table tbody tr {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .week7-insurance-page input:hover:not(:focus) {
          border-color: #9ca3af !important;
          background-color: #ffffff !important;
          box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03) !important;
          transform: translateY(-2px) scale(1.01) !important;
        }
        .week7-insurance-page input:focus {
          border-color: #0d1a4b !important;
          background-color: #fffef0 !important;
          box-shadow: 0 0 0 3px rgba(13, 26, 75, 0.12) !important;
          transform: translateY(-1px) scale(1.01) !important;
          outline: none;
        }
        .week7-lift-surface:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 34px rgba(15, 23, 42, 0.12), 0 6px 18px rgba(15, 23, 42, 0.08) !important;
          border-color: rgba(148, 163, 184, 0.45) !important;
        }
        .week7-info-surface:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(13, 26, 75, 0.12);
          border-color: rgba(13, 26, 75, 0.25) !important;
          background-color: rgba(13, 26, 75, 0.08) !important;
        }
        .week7-data-table tbody tr:hover {
          transform: translateY(-1px);
        }
        .week7-data-table tbody tr:hover td {
          background-color: rgba(248, 250, 252, 0.95) !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .week7-insurance-page input,
          .week7-lift-surface,
          .week7-info-surface,
          .week7-data-table tbody tr {
            transition: none !important;
            transform: none !important;
          }
        }
      `}</style>
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

      {/* Tooltip */}
      {hoveredTerm && (
        <div style={{
          ...styles.tooltip,
          left: `${tooltipPosition.x}px`,
          top: `${tooltipPosition.y - 60}px`,
        }}>
          {/* Arrow pointing down */}
          <div style={{
            position: 'absolute',
            bottom: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '8px solid rgba(13, 26, 75, 0.97)'
          }}></div>
          
          <div style={{ lineHeight: '1.4', fontSize: '12px' }}>{definitions[hoveredTerm]}</div>
        </div>
      )}

      <div style={styles.container} className="week7-insurance-page">
          <div style={styles.sectionContainer} className="week7-lift-surface">
            {/* Enhanced Header */}
            <div style={styles.enhancedHeader}>
              <span style={{ fontSize: '26px', letterSpacing: '-0.02em' }}>Insurance & Risk Management</span>
            </div>

            <div style={styles.infoBox} className="week7-info-surface">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d1a4b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <div>
                <strong>How it works:</strong> Estimate your annual medical spending, compare HDHP vs traditional plan inputs, and review the annual total cost breakdown to choose the lower-cost option.
              </div>
            </div>
            
          {/* Expected Annual Medical Expenses Input */}
          <div style={styles.subCard} className="week7-lift-surface">
            <div style={styles.subHeader}>
              Expected Annual Medical Expenses
            </div>
            <div style={styles.titleUnderline} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <input
                type="text"
                value={expectedMedicalExpenses ? `$${formatNumberForInput(expectedMedicalExpenses)}` : ''}
                onChange={(e) => {
                  const cleanValue = e.target.value.replace(/[$,]/g, '');
                  const sanitized = cleanValue.replace(/[^0-9.]/g, '');
                  
                  if (sanitized === '') {
                    setExpectedMedicalExpenses(0);
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
                    setExpectedMedicalExpenses(numericValue || 0);
                    return;
                  }
                  
                  const numValue = parseFloat(numericValue) || 0;
                  setExpectedMedicalExpenses(numValue);
                }}
                style={{
                  ...styles.input,
                  width: '150px',
                  fontSize: '15px',
                  fontWeight: 600,
                }}
              />
            </div>
          </div>

          {/* Insurance Plan Comparison Table */}
          <div style={styles.subCard} className="week7-lift-surface">
            <div style={styles.subHeader}>
              Plan Comparison
            </div>
            <div style={styles.titleUnderline} />
            <div style={{
              fontSize: '12px',
              color: '#64748b',
              textAlign: 'center',
              marginBottom: '16px',
              fontStyle: 'italic'
            }}>
              Hover category labels to view quick definitions.
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table} className="week7-data-table">
                <thead>
                  <tr>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>HDHP Plan</th>
                    <th style={styles.th}>Traditional Plan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td 
                      style={{
                        ...styles.td,
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        setHoveredTerm('Annual Premium');
                        setTooltipPosition({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseLeave={() => setHoveredTerm(null)}
                    >
                      Annual Premium
                      <div style={{ ...styles.recommendationText, textAlign: 'left' }}>
                        Recommendation
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div>
                        <input
                          type="text"
                          value={hdhpPlan.annualPremium === '' || hdhpPlan.annualPremium == null ? '' : `$${hdhpPlan.annualPremium}`}
                          onChange={(e) => {
                            const cleanValue = sanitizeDecimalInput(e.target.value.replace(/[$,]/g, ''), 2);
                            setHdhpPlan({ ...hdhpPlan, annualPremium: cleanValue });
                          }}
                          style={styles.input}
                        />
                        <div style={styles.recommendationText}>
                          {formatCurrency(hdhpPlan.annualPremiumRec)}
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div>
                        <input
                          type="text"
                          value={normalPlan.annualPremium === '' || normalPlan.annualPremium == null ? '' : `$${normalPlan.annualPremium}`}
                          onChange={(e) => {
                            const cleanValue = sanitizeDecimalInput(e.target.value.replace(/[$,]/g, ''), 2);
                            setNormalPlan({ ...normalPlan, annualPremium: cleanValue });
                          }}
                          style={styles.input}
                        />
                        <div style={styles.recommendationText}>
                          {formatCurrency(normalPlan.annualPremiumRec)}
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td 
                      style={{
                        ...styles.td,
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        setHoveredTerm('Deductible');
                        setTooltipPosition({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseLeave={() => setHoveredTerm(null)}
                    >
                      Deductible
                      <div style={{ ...styles.recommendationText, textAlign: 'left' }}>
                        Recommendation
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div>
                        <input
                          type="text"
                          value={hdhpPlan.deductible === '' || hdhpPlan.deductible == null ? '' : `$${hdhpPlan.deductible}`}
                          onChange={(e) => {
                            const cleanValue = sanitizeDecimalInput(e.target.value.replace(/[$,]/g, ''), 2);
                            setHdhpPlan({ ...hdhpPlan, deductible: cleanValue });
                          }}
                          style={styles.input}
                        />
                        <div style={styles.recommendationText}>
                          {formatCurrency(hdhpPlan.deductibleRec)}
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div>
                        <input
                          type="text"
                          value={normalPlan.deductible === '' || normalPlan.deductible == null ? '' : `$${normalPlan.deductible}`}
                          onChange={(e) => {
                            const cleanValue = sanitizeDecimalInput(e.target.value.replace(/[$,]/g, ''), 2);
                            setNormalPlan({ ...normalPlan, deductible: cleanValue });
                          }}
                          style={styles.input}
                        />
                        <div style={styles.recommendationText}>
                          {formatCurrency(normalPlan.deductibleRec)}
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td 
                      style={{
                        ...styles.td,
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        setHoveredTerm('Coinsurance Rate');
                        setTooltipPosition({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseLeave={() => setHoveredTerm(null)}
                    >
                      Coinsurance Rate
                      <div style={{ ...styles.recommendationText, textAlign: 'left' }}>
                        Recommendation
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div>
                        <input
                          type="text"
                          value={hdhpPlan.coinsuranceRate === '' || hdhpPlan.coinsuranceRate == null ? '' : `${hdhpPlan.coinsuranceRate}%`}
                          onChange={(e) => {
                            const cleanValue = sanitizeDecimalInput(e.target.value.replace(/[%,\s]/g, ''), 2);
                            if (cleanValue === '') {
                              setHdhpPlan({ ...hdhpPlan, coinsuranceRate: '' });
                              return;
                            }

                            const numValue = parseFloat(cleanValue);
                            if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                              setHdhpPlan({ ...hdhpPlan, coinsuranceRate: cleanValue });
                              const inputEl = e.target;
                              const pos = cleanValue.length;
                              requestAnimationFrame(() => {
                                if (inputEl && document.activeElement === inputEl) {
                                  inputEl.setSelectionRange(pos, pos);
                                }
                              });
                            }
                          }}
                          style={styles.input}
                        />
                        <div style={styles.recommendationText}>
                          {hdhpPlan.coinsuranceRateRec}%
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div>
                        <input
                          type="text"
                          value={normalPlan.coinsuranceRate === '' || normalPlan.coinsuranceRate == null ? '' : `${normalPlan.coinsuranceRate}%`}
                          onChange={(e) => {
                            const cleanValue = sanitizeDecimalInput(e.target.value.replace(/[%,\s]/g, ''), 2);
                            if (cleanValue === '') {
                              setNormalPlan({ ...normalPlan, coinsuranceRate: '' });
                              return;
                            }

                            const numValue = parseFloat(cleanValue);
                            if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                              setNormalPlan({ ...normalPlan, coinsuranceRate: cleanValue });
                              const inputEl = e.target;
                              const pos = cleanValue.length;
                              requestAnimationFrame(() => {
                                if (inputEl && document.activeElement === inputEl) {
                                  inputEl.setSelectionRange(pos, pos);
                                }
                              });
                            }
                          }}
                          style={styles.input}
                        />
                        <div style={styles.recommendationText}>
                          {normalPlan.coinsuranceRateRec}%
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td 
                      style={{
                        ...styles.td,
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        setHoveredTerm('Max Paid Out-of-Pocket');
                        setTooltipPosition({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseLeave={() => setHoveredTerm(null)}
                    >
                      Max Paid Out-of-Pocket
                      <div style={{ ...styles.recommendationText, textAlign: 'left' }}>
                        Recommendation
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div>
                        <input
                          type="text"
                          value={hdhpPlan.maxOutOfPocket === '' || hdhpPlan.maxOutOfPocket == null ? '' : `$${hdhpPlan.maxOutOfPocket}`}
                          onChange={(e) => {
                            const cleanValue = sanitizeDecimalInput(e.target.value.replace(/[$,]/g, ''), 2);
                            setHdhpPlan({ ...hdhpPlan, maxOutOfPocket: cleanValue });
                          }}
                          style={styles.input}
                        />
                        <div style={styles.recommendationText}>
                          {formatCurrency(hdhpPlan.maxOutOfPocketRec)}
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div>
                        <input
                          type="text"
                          value={normalPlan.maxOutOfPocket === '' || normalPlan.maxOutOfPocket == null ? '' : `$${normalPlan.maxOutOfPocket}`}
                          onChange={(e) => {
                            const cleanValue = sanitizeDecimalInput(e.target.value.replace(/[$,]/g, ''), 2);
                            setNormalPlan({ ...normalPlan, maxOutOfPocket: cleanValue });
                          }}
                          style={styles.input}
                        />
                        <div style={styles.recommendationText}>
                          {formatCurrency(normalPlan.maxOutOfPocketRec)}
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td 
                      style={{
                        ...styles.td,
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        setHoveredTerm('Employer HSA Contribution');
                        setTooltipPosition({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseLeave={() => setHoveredTerm(null)}
                    >
                      Employer HSA Contribution
                      <div style={{ ...styles.recommendationText, textAlign: 'left' }}>
                        Recommendation
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div>
                        <input
                          type="text"
                          value={hdhpPlan.employerHSA === '' || hdhpPlan.employerHSA == null ? '' : `$${hdhpPlan.employerHSA}`}
                          onChange={(e) => {
                            const cleanValue = sanitizeDecimalInput(e.target.value.replace(/[$,]/g, ''), 2);
                            setHdhpPlan({ ...hdhpPlan, employerHSA: cleanValue });
                          }}
                          style={styles.input}
                        />
                        <div style={styles.recommendationText}>
                          {formatCurrency(hdhpPlan.employerHSARec)}
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div>
                        <input
                          type="text"
                          value={normalPlan.employerHSA === '' || normalPlan.employerHSA == null ? '' : `$${normalPlan.employerHSA}`}
                          onChange={(e) => {
                            const cleanValue = sanitizeDecimalInput(e.target.value.replace(/[$,]/g, ''), 2);
                            setNormalPlan({ ...normalPlan, employerHSA: cleanValue });
                          }}
                          style={styles.input}
                        />
                        <div style={styles.recommendationText}>
                          {formatCurrency(normalPlan.employerHSARec)}
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>


          {/* Total Annual Cost Calculation */}
          <div style={styles.subCard} className="week7-lift-surface">
            <div style={styles.subHeader}>
              Total Annual Cost Calculation
            </div>
            <div style={styles.titleUnderline} />

            <div style={styles.costGrid}>
              <div style={styles.costCard} className="week7-lift-surface">
                <div style={styles.costCardTitle}>
                  HDHP Plan
                </div>
                
                <div style={styles.metricRow}>
                  <span>Out-of-Pocket Medical Costs:</span>
                  <span style={styles.metricValue}>
                    {formatCurrency(hdhpCosts.outOfPocketCosts)}
                  </span>
                </div>
                
                <div style={styles.metricRow}>
                  <span>Less Employer HSA Contribution:</span>
                  <span style={{ ...styles.metricValue, color: '#16a34a' }}>
                    ({formatCurrency(hdhpPlan.employerHSA)})
                  </span>
                </div>
                
                <div style={styles.metricRow}>
                  <span>Annual Premium:</span>
                  <span style={styles.metricValue}>
                    {formatCurrency(hdhpPlan.annualPremium)}
                  </span>
                </div>
                
                <div style={styles.totalRow}>
                  <span>Total Annual Cost:</span>
                  <span>{formatCurrency(hdhpCosts.totalAnnualCost)}</span>
                </div>
              </div>

              <div style={styles.costCard} className="week7-lift-surface">
                <div style={styles.costCardTitle}>
                  Traditional Plan
                </div>
                
                <div style={styles.metricRow}>
                  <span>Out-of-Pocket Medical Costs:</span>
                  <span style={styles.metricValue}>
                    {formatCurrency(normalCosts.outOfPocketCosts)}
                  </span>
                </div>
                
                <div style={styles.metricRow}>
                  <span>Less Employer HSA Contribution:</span>
                  <span style={{ ...styles.metricValue, color: '#16a34a' }}>
                    ({formatCurrency(normalPlan.employerHSA)})
                  </span>
                </div>
                
                <div style={styles.metricRow}>
                  <span>Annual Premium:</span>
                  <span style={styles.metricValue}>
                    {formatCurrency(normalPlan.annualPremium)}
                  </span>
                </div>
                
                <div style={styles.totalRow}>
                  <span>Total Annual Cost:</span>
                  <span>{formatCurrency(normalCosts.totalAnnualCost)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div
            style={{
              ...styles.summaryBanner,
              backgroundColor: savings > 0 ? 'rgba(240, 253, 244, 0.9)' : 'rgba(254, 242, 242, 0.9)',
              borderColor: savings > 0 ? 'rgba(22, 163, 74, 0.45)' : 'rgba(220, 38, 38, 0.45)',
              color: savings > 0 ? '#166534' : '#991b1b',
            }}
            className="week7-lift-surface"
          >
            <div style={{ 
              margin: '0',
              color: 'inherit',
              fontSize: '15px',
              fontWeight: '600'
            }}>
              {savings > 0 ? '' : '❌ '} {cheaperPlan} is cheaper by {formatCurrency(Math.abs(savings))}
            </div>
          </div>

          {/* Note */}
          <div style={styles.noteBanner}>
            <div style={{ 
              margin: '0', 
              color: '#374151', 
              fontWeight: '500', 
              fontSize: '14px'
            }}>
              <strong>Note:</strong> Adjust Week 1 Budget based on this week's insights
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Week7;