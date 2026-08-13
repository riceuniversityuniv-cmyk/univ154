import React, { useEffect } from 'react';
import { useBudget } from '../contexts/BudgetContext';
import { useAssumptions } from '../contexts/AssumptionsContext';
import { calculateBracketBreakdown } from '../utils/taxEngine';
import { formatCurrency, formatPercent } from '../utils/formatters';

const Week4 = () => {
  const { summaryCalculations, topInputs } = useBudget();
  const { assumptions } = useAssumptions();
  
  // Auto-save function (without alert)
  const autoSaveWeek4 = () => {
    try {
      const week4Data = {
        // Week 4 is read-only, but we can save the summary calculations
        summaryCalculations: summaryCalculations,
        topInputs: topInputs,
        timestamp: new Date().toISOString()
      };
      
      // Save to localStorage silently
      localStorage.setItem('week4_data', JSON.stringify(week4Data));
    } catch (error) {
      console.error('Error auto-saving Week 4 data:', error);
    }
  };

  // Auto-save with debounce (500ms delay)
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      autoSaveWeek4();
    }, 500); // Wait 500ms after last change before saving

    return () => clearTimeout(saveTimer);
  }, [summaryCalculations, topInputs]);
  
  // Get Week 1 SUGGESTED data directly from summaryCalculations (Week 1 B - Summary)
  const week4Data = {
    // C4: Pre-tax Income
    preTaxIncome: summaryCalculations.preTaxIncome || 0,
    
    // C6: Standard Deduction (Single Filer)
    standardDeduction: summaryCalculations.standardDeduction || 0,
    
    // C7: Pre-Tax Expenses (Health Insurance, Tr. 401k, Tr. IRA) * 12 - SUGGESTED
    preTaxExpenses: summaryCalculations.suggestedPreTaxExpenses || 0,
    
    // C9: Taxable Income - SUGGESTED
    taxableIncome: summaryCalculations.suggestedTaxableIncome || 0,
    
    // C11: Federal Income Tax Payment - SUGGESTED
    federalIncomeTax: summaryCalculations.suggestedFederalIncomeTax || 0,
    
    // C12: Federal Social Security Tax Payment - SUGGESTED
    federalSocialSecurityTax: summaryCalculations.suggestedSocialSecurityTax || 0,
    
    // C13: Federal Medicare Tax Payment - SUGGESTED
    federalMedicareTax: summaryCalculations.suggestedMedicareTax || 0,
    
    // C15: State Income Tax Payment - SUGGESTED
    stateIncomeTax: summaryCalculations.suggestedStateIncomeTax || 0,
    
    // C16: NY City Income Tax Payment - SUGGESTED
    nyCityIncomeTax: summaryCalculations.suggestedNYCTax || 0,
    
    // C18: After Tax Income - SUGGESTED
    afterTaxIncome: summaryCalculations.suggestedAfterTaxIncome || 0
  };


  // Both bracket breakdowns now come from the single shared taxEngine.js,
  // driven by the admin-editable Assumptions table, instead of a locally
  // hardcoded federal bracket table and a second, independent re-derivation
  // from stateTaxData -- this display can no longer drift from the totals
  // shown on the Summary tab above it. See
  // docs/financial-audit-2026-08-11.md (four+ independent tax engines).
  const federalBracketBreakdown = calculateBracketBreakdown(week4Data.taxableIncome, assumptions.federalOrdinaryBrackets);
  const stateBracketBreakdown = calculateBracketBreakdown(week4Data.taxableIncome, assumptions.stateBrackets[topInputs.location] || []);

  // Get dynamic table title based on state
  const getStateTaxTableTitle = (state) => {
    const stateNames = {
      'NY': 'NY State Income Tax',
      'CA': 'CA State Income Tax', 
      'TX': 'TX State Income Tax',
      'FL': 'FL State Income Tax',
      'WA': 'WA State Income Tax',
      'NV': 'NV State Income Tax',
      'SD': 'SD State Income Tax',
      'WY': 'WY State Income Tax',
      'TN': 'TN State Income Tax',
      'NH': 'NH State Income Tax'
    };
    return stateNames[state] || `${state} State Income Tax`;
  };

  // Styling matching Week 3 patterns exactly
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
    mainContent: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '24px',
      marginBottom: '32px',
      maxWidth: '100%'
    },
    leftSection: {
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      padding: '24px',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.08)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    rightSection: {
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      padding: '24px',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.08)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    sectionTitle: {
      fontSize: '15px',
      fontWeight: '600',
      color: '#0d1a4b',
      marginBottom: '20px',
      textAlign: 'center',
      letterSpacing: '-0.01em',
      paddingBottom: '12px',
      borderBottom: '2px solid #f1f3f4'
    },
    dataRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 16px',
      borderBottom: '1px solid rgba(229, 231, 235, 0.6)',
      transition: 'all 0.2s ease'
    },
    dataLabel: {
      fontSize: '14px',
      color: '#374151',
      fontWeight: '500',
      flex: '1'
    },
    dataValue: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#0d1a4b',
      backgroundColor: 'rgba(249, 250, 251, 0.8)',
      padding: '8px 12px',
      borderRadius: '8px',
      border: '1px solid rgba(229, 231, 235, 0.6)',
      minWidth: '120px',
      textAlign: 'right',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)',
    },
    highlightRow: {
      backgroundColor: 'rgba(13, 26, 75, 0.08)',
      padding: '16px',
      borderRadius: '12px',
      margin: '24px 0',
      border: '2px solid rgba(13, 26, 75, 0.2)',
      boxShadow: '0 4px 12px 0 rgba(13, 26, 75, 0.1)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    tableContainer: {
      marginTop: '24px'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '13px',
      backgroundColor: 'rgba(255, 255, 255, 0.6)',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.05)',
    },
    tableHeader: {
      background: 'linear-gradient(135deg, rgba(13, 26, 75, 0.95) 0%, rgba(30, 58, 138, 0.9) 100%)',
      color: 'white',
      padding: '12px 8px',
      textAlign: 'center',
      fontWeight: '600',
      fontSize: '13px',
      letterSpacing: '-0.01em',
    },
    tableCell: {
      border: '1px solid rgba(229, 231, 235, 0.5)',
      padding: '10px 8px',
      textAlign: 'center',
      fontSize: '13px',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      transition: 'background-color 0.2s ease',
    },
    tableRow: {
      transition: 'background-color 0.2s ease',
      cursor: 'default',
    },
    noteBox: {
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
      marginTop: '24px',
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
  };

  // Info Icon Component matching Week 3
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
      {/* Section Container - matching Week 3 layered design */}
      <div style={styles.sectionContainer}>
        {/* Enhanced Header */}
        <div style={styles.enhancedHeader}>
          <span style={{ fontSize: '26px', letterSpacing: '-0.02em' }}>Income Taxes</span>
        </div>
        
        {/* Info Box - matching Week 3 styling */}
        <div style={styles.infoBox}>
          <InfoIcon />
          <div>
            <strong>How it works:</strong> This page displays your tax calculations based on Week 1 budget data. Tax calculations exclude detailed state/city rules and provide a close estimate of After-Tax Income rather than exact figures.
          </div>
        </div>

        {/* Main Content Grid */}
        <div style={styles.mainContent}>
          {/* Left Section - After-Tax Income Summary */}
          <div 
            style={styles.leftSection}
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
            <div style={styles.sectionTitle}>
              After-Tax Income Summary
            </div>
            
            <div style={styles.dataRow}>
              <span style={styles.dataLabel}>Pre-tax Income</span>
              <span style={styles.dataValue}>{formatCurrency(week4Data.preTaxIncome)}</span>
            </div>
            
            <div style={styles.dataRow}>
              <span style={styles.dataLabel}>Standard Deduction (Single Filer)</span>
              <span style={styles.dataValue}>{formatCurrency(week4Data.standardDeduction)}</span>
            </div>
            
            <div style={styles.dataRow}>
              <span style={styles.dataLabel}>Pre-Tax Expenses (Health Insurance, Tr. 401k, Tr. IRA)</span>
              <span style={styles.dataValue}>{formatCurrency(week4Data.preTaxExpenses)}</span>
            </div>
            
            <div style={styles.dataRow}>
              <span style={styles.dataLabel}>Taxable Income</span>
              <span style={styles.dataValue}>{formatCurrency(week4Data.taxableIncome)}</span>
            </div>
            
            <div style={styles.dataRow}>
              <span style={styles.dataLabel}>Federal Income Tax Payment</span>
              <span style={styles.dataValue}>{formatCurrency(week4Data.federalIncomeTax)}</span>
            </div>
            
            <div style={styles.dataRow}>
              <span style={styles.dataLabel}>Federal Social Security Tax Payment</span>
              <span style={styles.dataValue}>{formatCurrency(week4Data.federalSocialSecurityTax)}</span>
            </div>
            
            <div style={styles.dataRow}>
              <span style={styles.dataLabel}>Federal Medicare Tax Payment</span>
              <span style={styles.dataValue}>{formatCurrency(week4Data.federalMedicareTax)}</span>
            </div>
            
            <div style={styles.dataRow}>
              <span style={styles.dataLabel}>State Income Tax Payment</span>
              <span style={styles.dataValue}>{formatCurrency(week4Data.stateIncomeTax)}</span>
            </div>
            
            <div style={styles.dataRow}>
              <span style={styles.dataLabel}>NY City Income Tax Payment</span>
              <span style={styles.dataValue}>{formatCurrency(week4Data.nyCityIncomeTax)}</span>
            </div>
            
            <div style={styles.highlightRow}>
              <span style={{
                fontSize: '15px',
                color: '#0d1a4b',
                fontWeight: '700'
              }}>After Tax Income</span>
              <span style={{
                fontSize: '15px',
                color: '#0d1a4b',
                fontWeight: '700',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '2px solid rgba(13, 26, 75, 0.3)',
                minWidth: '140px',
                textAlign: 'right',
                boxShadow: '0 2px 8px 0 rgba(13, 26, 75, 0.15)',
              }}>
                {formatCurrency(week4Data.afterTaxIncome)}
              </span>
            </div>
          </div>

          {/* Right Section - Tax Tables */}
          <div 
            style={styles.rightSection}
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
            {/* Federal Income Tax Table */}
            <div style={styles.tableContainer}>
              <div style={styles.sectionTitle}>
                Federal Income Tax
              </div>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>Tax Rate</th>
                    <th style={styles.tableHeader}>Over</th>
                    <th style={styles.tableHeader}>But Not Over</th>
                    <th style={styles.tableHeader}>Taxes Paid Per Bracket</th>
                  </tr>
                </thead>
                <tbody>
                  {federalBracketBreakdown.map((bracket, index) => (
                    <tr
                      key={index}
                      style={styles.tableRow}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 253, 231, 0.6)';
                        Array.from(e.currentTarget.children).forEach(cell => {
                          cell.style.backgroundColor = 'rgba(255, 253, 231, 0.6)';
                        });
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        Array.from(e.currentTarget.children).forEach(cell => {
                          cell.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                        });
                      }}
                    >
                      <td style={styles.tableCell}>{formatPercent(bracket.rate)}</td>
                      <td style={styles.tableCell}>{formatCurrency(bracket.lower)}</td>
                      <td style={styles.tableCell}>
                        {bracket.upper >= 1e12 ? '...' : `${formatCurrency(bracket.upper)}`}
                      </td>
                      <td style={styles.tableCell}>
                        {formatCurrency(bracket.taxInBracket)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Dynamic State Income Tax Table */}
            <div style={styles.tableContainer}>
              <div style={styles.sectionTitle}>
                {getStateTaxTableTitle(topInputs.location)}
              </div>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>Tax Rate</th>
                    <th style={styles.tableHeader}>Over</th>
                    <th style={styles.tableHeader}>But Not Over</th>
                    <th style={styles.tableHeader}>Taxes Paid Per Bracket</th>
                  </tr>
                </thead>
                <tbody>
                  {stateBracketBreakdown.map((bracket, index) => (
                    <tr
                      key={index}
                      style={styles.tableRow}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 253, 231, 0.6)';
                        Array.from(e.currentTarget.children).forEach(cell => {
                          cell.style.backgroundColor = 'rgba(255, 253, 231, 0.6)';
                        });
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        Array.from(e.currentTarget.children).forEach(cell => {
                          cell.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                        });
                      }}
                    >
                      <td style={styles.tableCell}>{formatPercent(bracket.rate)}</td>
                      <td style={styles.tableCell}>{formatCurrency(bracket.lower)}</td>
                      <td style={styles.tableCell}>
                        {bracket.upper >= 1e12 ? '…' : `${formatCurrency(bracket.upper)}`}
                      </td>
                      <td style={styles.tableCell}>
                        {formatCurrency(bracket.taxInBracket)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Note */}
      <div style={{ ...styles.note, marginTop: '24px', marginBottom: '0' }}>
        Note: Adjust Week 1 Budget based on this week's insights
      </div>
    </div>
  );
};

export default Week4;
