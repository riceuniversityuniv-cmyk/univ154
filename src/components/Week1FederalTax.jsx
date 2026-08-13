import React, { useMemo } from 'react';
import { useBudget } from '../contexts/BudgetContext';
import { useAssumptions } from '../contexts/AssumptionsContext';
import { calculateBracketBreakdown, calculateFICA } from '../utils/taxEngine';
import { formatCurrency, formatPercent } from '../utils/formatters';

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
    textAlign: 'center',
    backgroundColor: 'white',
    transition: 'background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  inputCell: {
    backgroundColor: '#fffde7',
    border: '1px solid #d1d5db',
    padding: '10px 14px',
    textAlign: 'right',
    borderRadius: '8px',
    width: '100%',
    boxSizing: 'border-box',
    fontSize: '14px',
    fontWeight: '500',
    outline: 'none',
  },
  calculatedCell: {
    backgroundColor: '#f9fafb',
    fontWeight: '500',
    color: '#374151',
  },
  summaryCell: {
    backgroundColor: '#f0fdf4',
    fontWeight: '600',
    color: '#166534',
  },
  sectionTitle: {
    background: '#0d1a4b',
    color: 'white',
    padding: '16px',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: '16px',
    letterSpacing: '0.01em',
  }
};

export default function Week1FederalTax() {
  const { topInputs, financialCalculations } = useBudget();
  const { assumptions } = useAssumptions();

  // Taxable income comes from the shared engine via BudgetContext (this is
  // P2 in Excel, referencing 'Week 1 - Summary'!C22) -- guaranteed to match
  // what the Summary tab shows since both now go through taxEngine.js.
  const taxableIncome = financialCalculations.taxableIncome || 0;
  const preTaxIncome = parseFloat(topInputs.preTaxIncome) || 0;

  const bracketBreakdown = useMemo(
    () => calculateBracketBreakdown(taxableIncome, assumptions.federalOrdinaryBrackets),
    [taxableIncome, assumptions.federalOrdinaryBrackets]
  );

  const totalFederalIncomeTax = bracketBreakdown.reduce((sum, b) => sum + b.taxInBracket, 0);

  // FICA is computed on gross wages (preTaxIncome), matching Excel's
  // `Week 1 B - Federal Tax!G18` formula (which pulls income from the
  // Summary sheet, not this sheet's own post-deduction taxable-income
  // cell) -- fixes the pre-consolidation bug where this tab applied FICA
  // to taxable income instead of gross income. See taxEngine.js.
  const { socialSecurityTax, medicareTax, additionalMedicareTax } = calculateFICA(preTaxIncome, assumptions);

  return (
    <>
    <style>{`
      .week1-federal-page .week1f-lift-surface,
      .week1-federal-page .week1f-card,
      .week1-federal-page .week1f-metric-card,
      .week1-federal-page .week1f-input,
      .week1-federal-page .week1f-data-table tbody tr {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .week1-federal-page .week1f-lift-surface:hover,
      .week1-federal-page .week1f-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 14px 34px rgba(15, 23, 42, 0.12), 0 6px 18px rgba(15, 23, 42, 0.08) !important;
        border-color: rgba(148, 163, 184, 0.45) !important;
      }
      .week1-federal-page .week1f-metric-card:hover {
        transform: translateY(-3px);
        border-color: rgba(148, 163, 184, 0.55) !important;
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.1);
      }
      .week1-federal-page .week1f-input:hover {
        border-color: #9ca3af !important;
        background-color: #ffffff !important;
        box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03) !important;
        transform: translateY(-1px);
      }
      .week1-federal-page .week1f-data-table tbody tr:hover {
        transform: translateY(-1px);
      }
      @media (prefers-reduced-motion: reduce) {
        .week1-federal-page .week1f-lift-surface,
        .week1-federal-page .week1f-card,
        .week1-federal-page .week1f-metric-card,
        .week1-federal-page .week1f-input,
        .week1-federal-page .week1f-data-table tbody tr {
          transition: none !important;
          transform: none !important;
        }
      }
    `}</style>
    <div style={styles.container} className="week1-federal-page">
      <h2 style={styles.header}>Federal Tax</h2>

      {/* Input Section - User Taxable Income */}
      <div style={{
        marginBottom: '32px',
        padding: '24px',
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        border: '1px solid #e5e7eb'
      }} className="week1f-card week1f-lift-surface">
        <h3 style={{ marginBottom: '16px', color: '#111827', fontSize: '18px', fontWeight: '600' }}>User Taxable Income</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <label style={{ fontWeight: '500', color: '#374151', fontSize: '14px' }}>User Taxable Income:</label>
          <input
            className="week1f-input"
            style={styles.inputCell}
            type="number"
            value={taxableIncome}
            readOnly
            placeholder="='Week 1 - Summary'!C22"
          />
          <span style={{ color: '#6b7280', fontSize: '12px', fontStyle: 'italic' }}>
            (from the Summary tab)
          </span>
        </div>
      </div>

      {/* Main Federal Tax Calculation Table */}
      <div style={{ marginBottom: '30px' }} className="week1f-lift-surface">
        <div style={styles.sectionTitle}>Federal Income Tax Calculation</div>
        <table style={styles.table} className="week1f-data-table">
          <thead>
            <tr>
              <th style={styles.th}>Tax Rate</th>
              <th style={styles.th}>Bracket Range</th>
              <th style={styles.th}>Taxable Amount in Bracket</th>
              <th style={styles.th}>Tax in Bracket</th>
            </tr>
          </thead>
          <tbody>
            {bracketBreakdown.map((calc, index) => (
              <tr
                key={index}
                onMouseEnter={(e) => {
                  Array.from(e.currentTarget.children).forEach(td => {
                    if (!td.style.backgroundColor.includes('f9fafb')) {
                      td.style.backgroundColor = '#f9fafb';
                    }
                  });
                }}
                onMouseLeave={(e) => {
                  Array.from(e.currentTarget.children).forEach(td => {
                    if (td.style.backgroundColor === '#f9fafb') {
                      td.style.backgroundColor = td.classList.contains('calculated') ? '#f9fafb' : 'white';
                    }
                  });
                }}
              >
                <td style={styles.td}>{formatPercent(calc.rate)}</td>
                <td style={styles.td}>
                  {formatCurrency(calc.lower)} &ndash; {calc.upper >= 1e12 ? '∞' : formatCurrency(calc.upper)}
                </td>
                <td style={{...styles.td, ...styles.calculatedCell}} className="calculated">
                  {formatCurrency(calc.taxableInBracket)}
                </td>
                <td style={{...styles.td, ...styles.calculatedCell}} className="calculated">
                  {formatCurrency(calc.taxInBracket)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Final Summary Section - Modern Card Design */}
      <div style={{
        padding: '32px',
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        border: '1px solid #e5e7eb',
        marginTop: '32px'
      }} className="week1f-card week1f-lift-surface">
        <h3 style={{ marginBottom: '24px', color: '#111827', fontSize: '20px', fontWeight: '600' }}>Tax Payment Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          <div style={{
            textAlign: 'center',
            padding: '24px',
            backgroundColor: '#fafafa',
            borderRadius: '10px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          }} className="week1f-metric-card">
            <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#6b7280' }}>Total Federal Income Tax</div>
            <div style={{ fontSize: '28px', fontWeight: '600', color: '#0d1a4b' }}>
              {formatCurrency(totalFederalIncomeTax)}
            </div>
          </div>
          <div style={{
            textAlign: 'center',
            padding: '24px',
            backgroundColor: '#fafafa',
            borderRadius: '10px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          }} className="week1f-metric-card">
            <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#6b7280' }}>Social Security Tax Payment</div>
            <div style={{ fontSize: '28px', fontWeight: '600', color: '#0d1a4b' }}>
              {formatCurrency(socialSecurityTax)}
            </div>
          </div>
          <div style={{
            textAlign: 'center',
            padding: '24px',
            backgroundColor: '#fafafa',
            borderRadius: '10px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          }} className="week1f-metric-card">
            <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#6b7280' }}>Medicare Tax Payment</div>
            <div style={{ fontSize: '28px', fontWeight: '600', color: '#0d1a4b' }}>
              {formatCurrency(medicareTax)}
            </div>
          </div>
          {additionalMedicareTax > 0 && (
            <div style={{
              textAlign: 'center',
              padding: '24px',
              backgroundColor: '#fafafa',
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            }} className="week1f-metric-card">
              <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#6b7280' }}>Additional Medicare Tax</div>
              <div style={{ fontSize: '28px', fontWeight: '600', color: '#0d1a4b' }}>
                {formatCurrency(additionalMedicareTax)}
              </div>
            </div>
          )}
        </div>

        <div style={{
          marginTop: '32px',
          padding: '20px',
          backgroundColor: '#f0f9ff',
          borderRadius: '10px',
          border: '1px solid #bfdbfe'
        }} className="week1f-metric-card">
          <h4 style={{ marginBottom: '12px', color: '#1e40af', fontSize: '16px', fontWeight: '600' }}>Assumptions used</h4>
          <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.8' }}>
            <div>Social Security wage base: {formatCurrency(assumptions.scalars.ss_wage_base)}</div>
            <div>Social Security rate: {formatPercent(assumptions.scalars.ss_rate)}</div>
            <div>Medicare rate: {formatPercent(assumptions.scalars.medicare_rate)}</div>
            <div>Standard deduction: {formatCurrency(assumptions.scalars.std_deduction_single)}</div>
            <div style={{ marginTop: '8px', fontStyle: 'italic' }}>
              Editable by admins in the Assumptions tab.
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
