import React, { useMemo } from 'react';
import { useBudget } from '../contexts/BudgetContext';
import { formatCurrency } from '../utils/formatters';

const styles = {
  container: {
    fontSize: '14px',
    maxWidth: 1400,
    margin: '0 auto',
    padding: '32px 24px',
    backgroundColor: '#fafafa',
    color: '#111827',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  header: {
    fontSize: '24px',
    fontWeight: '600',
    margin: '0 0 32px 0',
    color: '#111827',
    letterSpacing: '-0.01em',
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
    marginTop: 24,
    borderRadius: '10px',
    overflow: 'hidden',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  },
  th: {
    background: '#0d1a4b',
    color: 'white',
    padding: '16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: '13px',
    letterSpacing: '0.01em',
  },
  td: {
    borderBottom: '1px solid #f3f4f6',
    padding: '14px 16px',
    verticalAlign: 'middle',
    fontSize: '14px',
    textAlign: 'left',
    backgroundColor: 'white',
    transition: 'background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  tdValue: {
    textAlign: 'right',
    fontWeight: '500',
    color: '#111827',
  },
  calculatedCell: {
    backgroundColor: '#f9fafb',
    fontWeight: '500',
    color: '#374151',
  },
  sectionTitle: {
    background: '#0d1a4b',
    color: 'white',
    padding: '16px',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: '16px',
    letterSpacing: '0.01em',
  },
  sectionHeader: {
    backgroundColor: '#f0fdf4',
    fontWeight: '600',
    textAlign: 'center',
    color: '#166534',
  },
  formulaNote: {
    fontSize: '11px',
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: '4px',
    fontFamily: 'monospace',
  }
};

export default function Week1Summary() {
  const { topInputs, deductionChoices, financialCalculations, summaryCalculations, userInputs } = useBudget();

  return (
    <>
    <style>{`
      .week1-summary-page .week1s-lift-surface,
      .week1-summary-page .week1s-ref-card,
      .week1-summary-page .week1s-data-table tbody tr {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .week1-summary-page .week1s-lift-surface:hover {
        transform: translateY(-4px);
        box-shadow: 0 14px 34px rgba(15, 23, 42, 0.12), 0 6px 18px rgba(15, 23, 42, 0.08) !important;
        border-color: rgba(148, 163, 184, 0.45) !important;
      }
      .week1-summary-page .week1s-ref-card:hover {
        transform: translateY(-3px);
        border-color: rgba(148, 163, 184, 0.55) !important;
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.1);
      }
      .week1-summary-page .week1s-data-table tbody tr:hover {
        transform: translateY(-1px);
      }
      .week1-summary-page .week1s-data-table tbody tr:hover td {
        background-color: rgba(248, 250, 252, 0.92);
      }
      @media (prefers-reduced-motion: reduce) {
        .week1-summary-page .week1s-lift-surface,
        .week1-summary-page .week1s-ref-card,
        .week1-summary-page .week1s-data-table tbody tr {
          transition: none !important;
          transform: none !important;
        }
      }
    `}</style>
    <div style={styles.container} className="week1-summary-page">
      <h2 style={styles.header}>Summary</h2>
      
      {/* Main Summary Table */}
      <table style={styles.table} className="week1s-data-table week1s-lift-surface">
        <thead>
          <tr>
            <th style={styles.th}>Suggested</th>
            <th style={styles.th}>Value</th>
            <th style={styles.th}></th>
            <th style={styles.th}>User</th>
            <th style={styles.th}>Value</th>
          </tr>
        </thead>
        <tbody>
          {/* Row 2: Headers */}
          <tr>
            <td style={{...styles.td, ...styles.sectionHeader}}>B2: Suggested</td>
            <td style={styles.td}></td>
            <td style={styles.td}></td>
            <td style={{...styles.td, ...styles.sectionHeader}}>E2: User</td>
            <td style={styles.td}></td>
          </tr>
          
          {/* Row 4: Pre-tax Income */}
          <tr>
            <td style={styles.td}><strong>B4:</strong> Pre-tax Income</td>
            <td style={{...styles.td, ...styles.tdValue, ...styles.calculatedCell}}>
              <strong>C4:</strong> {formatCurrency(summaryCalculations.preTaxIncome)}
              <div style={styles.formulaNote}>= 'Week 1 - Budgeting'!$E$6</div>
            </td>
            <td style={styles.td}></td>
            <td style={styles.td}><strong>E4:</strong> Pre-tax Income</td>
            <td style={{...styles.td, ...styles.tdValue, ...styles.calculatedCell}}>
              <strong>F4:</strong> {formatCurrency(summaryCalculations.preTaxIncome)}
              <div style={styles.formulaNote}>= 'Week 1 - Budgeting'!$E$6</div>
            </td>
          </tr>
          
          {/* Row 6: Standard Deduction */}
          <tr>
            <td style={styles.td}><strong>B6:</strong> Standard Deduction (Single Filers 2025)</td>
            <td style={{...styles.td, ...styles.tdValue}}>
              <strong>C6:</strong> {formatCurrency(summaryCalculations.standardDeduction)}
            </td>
            <td style={styles.td}></td>
            <td style={styles.td}><strong>E6:</strong> Standard Deduction (Single Filers 2025)</td>
            <td style={{...styles.td, ...styles.tdValue}}>
              <strong>F6:</strong> {formatCurrency(summaryCalculations.standardDeduction)}
            </td>
          </tr>
          
          {/* Row 7: Pre-Tax Expenses */}
          <tr>
            <td style={styles.td}><strong>B7:</strong> Pre-Tax Expenses</td>
            <td style={{...styles.td, ...styles.tdValue, ...styles.calculatedCell}}>
              <strong>C7:</strong> {formatCurrency(summaryCalculations.suggestedPreTaxExpenses)}
              <div style={styles.formulaNote}>= (('Week 1 - Budgeting'!$G$28+'Week 1 - Budgeting'!$G$38)*12)</div>
            </td>
            <td style={styles.td}></td>
            <td style={styles.td}><strong>E7:</strong> Pre-Tax Expenses</td>
            <td style={{...styles.td, ...styles.tdValue, ...styles.calculatedCell}}>
              <strong>F7:</strong> {formatCurrency(summaryCalculations.userPreTaxExpenses)}
              <div style={styles.formulaNote}>= (('Week 1 - Budgeting'!$E$28+'Week 1 - Budgeting'!$E$38)*12)</div>
            </td>
          </tr>
          
          {/* Row 9: Taxable Income */}
          <tr>
            <td style={styles.td}><strong>B9:</strong> Taxable Income</td>
            <td style={{...styles.td, ...styles.tdValue, ...styles.calculatedCell}}>
              <strong>C9:</strong> {formatCurrency(summaryCalculations.suggestedTaxableIncome)}
              <div style={styles.formulaNote}>= C4-C6-C7</div>
            </td>
            <td style={styles.td}></td>
            <td style={styles.td}><strong>E9:</strong> Taxable Income</td>
            <td style={{...styles.td, ...styles.tdValue, ...styles.calculatedCell}}>
              <strong>F9:</strong> {formatCurrency(summaryCalculations.userTaxableIncome)}
              <div style={styles.formulaNote}>= F4-F6-F7</div>
            </td>
          </tr>
          
          {/* Row 11: Federal Income Tax Payment */}
          <tr>
            <td style={styles.td}><strong>B11:</strong> Federal Income Tax Payment</td>
            <td style={{...styles.td, ...styles.tdValue, ...styles.calculatedCell}}>
              <strong>C11:</strong> {formatCurrency(summaryCalculations.suggestedFederalIncomeTax)}
              <div style={styles.formulaNote}>= 'Week 1 - Federal Tax'!G16</div>
            </td>
            <td style={styles.td}></td>
            <td style={styles.td}><strong>E11:</strong> Federal Income Tax Payment</td>
            <td style={{...styles.td, ...styles.tdValue, ...styles.calculatedCell}}>
              <strong>F11:</strong> {formatCurrency(summaryCalculations.userFederalIncomeTax)}
              <div style={styles.formulaNote}>= 'Week 1 - Federal Tax'!M16</div>
            </td>
          </tr>
          
          {/* Row 12: Federal Social Security Tax Payment */}
          <tr>
            <td style={styles.td}><strong>B12:</strong> Federal Social Security Tax Payment</td>
            <td style={{...styles.td, ...styles.tdValue, ...styles.calculatedCell}}>
              <strong>C12:</strong> {formatCurrency(summaryCalculations.suggestedSocialSecurityTax)}
              <div style={styles.formulaNote}>= 'Week 1 - Federal Tax'!G18</div>
            </td>
            <td style={styles.td}></td>
            <td style={styles.td}><strong>E12:</strong> Federal Social Security Tax Payment</td>
            <td style={{...styles.td, ...styles.tdValue, ...styles.calculatedCell}}>
              <strong>F12:</strong> {formatCurrency(summaryCalculations.userSocialSecurityTax)}
              <div style={styles.formulaNote}>= 'Week 1 - Federal Tax'!M18</div>
            </td>
          </tr>
          
          {/* Row 13: Federal Medicare Tax Payment */}
          <tr>
            <td style={styles.td}><strong>B13:</strong> Federal Medicare Tax Payment</td>
            <td style={{...styles.td, ...styles.tdValue, ...styles.calculatedCell}}>
              <strong>C13:</strong> {formatCurrency(summaryCalculations.suggestedMedicareTax)}
              <div style={styles.formulaNote}>= 'Week 1 - Federal Tax'!G20</div>
            </td>
            <td style={styles.td}></td>
            <td style={styles.td}><strong>E13:</strong> Federal Medicare Tax Payment</td>
            <td style={{...styles.td, ...styles.tdValue, ...styles.calculatedCell}}>
              <strong>F13:</strong> {formatCurrency(summaryCalculations.userMedicareTax)}
              <div style={styles.formulaNote}>= 'Week 1 - Federal Tax'!M20</div>
            </td>
          </tr>
          
          {/* Row 15: State Income Tax Payment */}
          <tr>
            <td style={styles.td}><strong>B15:</strong> State Income Tax Payment</td>
            <td style={{...styles.td, ...styles.tdValue, ...styles.calculatedCell}}>
              <strong>C15:</strong> {formatCurrency(summaryCalculations.suggestedStateIncomeTax)}
              <div style={styles.formulaNote}>= 'Week 1 - State Tax'!H169</div>
            </td>
            <td style={styles.td}></td>
            <td style={styles.td}><strong>E15:</strong> State Income Tax Payment</td>
            <td style={{...styles.td, ...styles.tdValue, ...styles.calculatedCell}}>
              <strong>F15:</strong> {formatCurrency(summaryCalculations.userStateIncomeTax)}
              <div style={styles.formulaNote}>= 'Week 1 - State Tax'!$L$169</div>
            </td>
          </tr>
          
          {/* Row 16: New York City Tax Payment */}
          <tr>
            <td style={styles.td}><strong>B16:</strong> New York City Tax Payment</td>
            <td style={{...styles.td, ...styles.tdValue, ...styles.calculatedCell}}>
              <strong>C16:</strong> {formatCurrency(summaryCalculations.suggestedNYCTax)}
              <div style={styles.formulaNote}>= 'Week 1 - State Tax'!H178</div>
            </td>
            <td style={styles.td}></td>
            <td style={styles.td}><strong>E16:</strong> New York City Tax Payment</td>
            <td style={{...styles.td, ...styles.tdValue, ...styles.calculatedCell}}>
              <strong>F16:</strong> {formatCurrency(summaryCalculations.userNYCTax)}
              <div style={styles.formulaNote}>= 'Week 1 - State Tax'!M178</div>
            </td>
          </tr>
          
          {/* Row 18: After Tax Income - CRITICAL CELLS */}
          <tr style={{ backgroundColor: '#f0fdf4' }}>
            <td style={{...styles.td, fontWeight: '600', color: '#166534'}}><strong>B18:</strong> After Tax Income</td>
            <td style={{...styles.td, ...styles.tdValue, ...styles.calculatedCell, fontWeight: '600', fontSize: '18px', color: '#166534'}}>
              <strong style={{color: '#0d1a4b'}}>C18:</strong> {formatCurrency(summaryCalculations.suggestedAfterTaxIncome)}
              <div style={styles.formulaNote}>= MAX(C9-SUM(C11:C16)+C6,0)</div>
            </td>
            <td style={styles.td}></td>
            <td style={{...styles.td, fontWeight: '600', color: '#166534'}}><strong>E18:</strong> After Tax Income</td>
            <td style={{...styles.td, ...styles.tdValue, ...styles.calculatedCell, fontWeight: '600', fontSize: '18px', color: '#166534'}}>
              <strong style={{color: '#0d1a4b'}}>F18:</strong> {formatCurrency(summaryCalculations.userAfterTaxIncome)}
              <div style={styles.formulaNote}>= MAX(F9-SUM(F11:F16)+F6,0)</div>
            </td>
          </tr>
        </tbody>
      </table>
      
      {/* 0 Pretax Expenses Section */}
      <div style={{ marginTop: '30px' }}>
        <div style={styles.sectionTitle}>0 Pretax Expenses Section</div>
        <table style={styles.table} className="week1s-data-table week1s-lift-surface">
          <thead>
            <tr>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{...styles.td, ...styles.sectionHeader}}><strong>B20:</strong> 0 Pretax Expenses</td>
              <td style={styles.td}></td>
            </tr>
            
            <tr>
              <td style={styles.td}><strong>B22:</strong> Taxable Income</td>
              <td style={{...styles.td, ...styles.tdValue, ...styles.calculatedCell}}>
                <strong>C22:</strong> {formatCurrency(summaryCalculations.zeroPretaxTaxableIncome)}
                <div style={styles.formulaNote}>= C4-C6</div>
              </td>
            </tr>
            
            <tr>
              <td style={styles.td}><strong>B24:</strong> Federal Income Tax Payment</td>
              <td style={{...styles.td, ...styles.tdValue, ...styles.calculatedCell}}>
                <strong>C24:</strong> {formatCurrency(summaryCalculations.suggestedFederalIncomeTax)}
                <div style={styles.formulaNote}>= 'Week 1 - Federal Tax'!T16</div>
              </td>
            </tr>
            
            <tr>
              <td style={styles.td}><strong>B25:</strong> Federal Social Security Tax Payment</td>
              <td style={{...styles.td, ...styles.tdValue, ...styles.calculatedCell}}>
                <strong>C25:</strong> {formatCurrency(summaryCalculations.suggestedSocialSecurityTax)}
                <div style={styles.formulaNote}>= 'Week 1 - Federal Tax'!T18</div>
              </td>
            </tr>
            
            <tr>
              <td style={styles.td}><strong>B26:</strong> Federal Medicare Tax Payment</td>
              <td style={{...styles.td, ...styles.tdValue, ...styles.calculatedCell}}>
                <strong>C26:</strong> {formatCurrency(summaryCalculations.suggestedMedicareTax)}
                <div style={styles.formulaNote}>= 'Week 1 - Federal Tax'!T20</div>
              </td>
            </tr>
            
            <tr>
              <td style={styles.td}><strong>B28:</strong> State Income Tax Payment</td>
              <td style={{...styles.td, ...styles.tdValue, ...styles.calculatedCell}}>
                <strong>C28:</strong> {formatCurrency(summaryCalculations.suggestedStateIncomeTax)}
                <div style={styles.formulaNote}>= 'Week 1 - State Tax'!$P$169</div>
              </td>
            </tr>
            
            <tr>
              <td style={styles.td}><strong>B29:</strong> New York City Tax Payment</td>
              <td style={{...styles.td, ...styles.tdValue, ...styles.calculatedCell}}>
                <strong>C29:</strong> {formatCurrency(summaryCalculations.suggestedNYCTax)}
                <div style={styles.formulaNote}>= 'Week 1 - State Tax'!Q178</div>
              </td>
            </tr>
            
            <tr>
              <td style={styles.td}><strong>B31:</strong> After Tax Income</td>
              <td style={{...styles.td, ...styles.tdValue, ...styles.calculatedCell}}>
                <strong>C31:</strong> {formatCurrency(summaryCalculations.suggestedAfterTaxIncome)}
                <div style={styles.formulaNote}>= MAX(C22-SUM(C24:C29)+C6,0)</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* Key Cell References for Other Sheets - Modern Card */}
      <div style={{ 
        marginTop: '32px', 
        padding: '24px', 
        backgroundColor: 'white', 
        borderRadius: '10px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        border: '1px solid #e5e7eb'
      }} className="week1s-lift-surface">
        <h3 style={{ marginBottom: '20px', color: '#111827', fontSize: '18px', fontWeight: '600' }}>Critical Cell References for Other Sheets</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <div style={{
            padding: '20px',
            backgroundColor: '#fafafa',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
          }} className="week1s-ref-card">
            <h4 style={{ color: '#0d1a4b', marginBottom: '12px', fontSize: '15px', fontWeight: '600' }}>Referenced by Budgeting Sheet:</h4>
            <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.8' }}>
              <div><strong style={{color: '#1e40af'}}>C18:</strong> Suggested After Tax Income → Monthly Income formulas</div>
              <div><strong style={{color: '#1e40af'}}>F18:</strong> User After Tax Income → Monthly Income formulas</div>
            </div>
          </div>
          <div style={{
            padding: '20px',
            backgroundColor: '#fafafa',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
          }} className="week1s-ref-card">
            <h4 style={{ color: '#0d1a4b', marginBottom: '12px', fontSize: '15px', fontWeight: '600' }}>Referenced by Federal Tax Sheet:</h4>
            <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.8' }}>
              <div><strong style={{color: '#1e40af'}}>C4:</strong> Pre-tax Income → Social Security/Medicare calculations</div>
              <div><strong style={{color: '#1e40af'}}>C22:</strong> 0 Pretax Expenses Taxable Income → User Taxable Income</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
