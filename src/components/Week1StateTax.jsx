import React, { useMemo } from 'react';
import { useBudget } from '../contexts/BudgetContext';
import { useAssumptions } from '../contexts/AssumptionsContext';
import { calculateBracketBreakdown } from '../utils/taxEngine';
import { formatCurrency, formatPercent } from '../utils/formatters';

export default function Week1StateTax() {
  const { topInputs, financialCalculations } = useBudget();
  const { assumptions } = useAssumptions();

  // Taxable income comes from the shared engine via BudgetContext --
  // guaranteed to match the Summary and Federal Tax tabs.
  const taxableIncome = financialCalculations.taxableIncome || 0;

  const selectedState = topInputs.location || 'TX';
  const residenceInNYC = topInputs.residenceInNYC === 'Yes';

  // Per-bracket breakdown for the selected state, sourced from the
  // Assumptions table (admin-editable). Replaces the old array-adjacency
  // bracket walk over a flat 50-state array, which produced negative tax
  // below a state's threshold for some states and $0 for every flat-rate
  // state -- see docs/financial-audit-2026-08-11.md findings #3/#4. Every
  // bracket here carries its own explicit upper bound now, so there's no
  // more inferring one state's boundary from an unrelated adjacent row.
  const stateBracketBreakdown = useMemo(
    () => calculateBracketBreakdown(taxableIncome, assumptions.stateBrackets[selectedState] || []),
    [taxableIncome, assumptions.stateBrackets, selectedState]
  );
  const totalStateTax = stateBracketBreakdown.reduce((sum, b) => sum + b.taxInBracket, 0);

  const nycBracketBreakdown = useMemo(() => {
    if (selectedState !== 'NY' || !residenceInNYC) return [];
    return calculateBracketBreakdown(taxableIncome, assumptions.nycBrackets);
  }, [taxableIncome, assumptions.nycBrackets, selectedState, residenceInNYC]);
  const totalNycTax = nycBracketBreakdown.reduce((sum, b) => sum + b.taxInBracket, 0);

  const formatBound = (num) => (num >= 1e12 ? '∞' : formatCurrency(num));

  return (
    <>
    <style>{`
      .week1-state-page .week1st-surface,
      .week1-state-page table tbody tr {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .week1-state-page .week1st-surface:hover {
        transform: translateY(-4px);
        box-shadow: 0 14px 34px rgba(15, 23, 42, 0.12), 0 6px 18px rgba(15, 23, 42, 0.08) !important;
        border-color: rgba(148, 163, 184, 0.45) !important;
      }
      .week1-state-page table tbody tr:hover td {
        background-color: rgba(248, 250, 252, 0.92) !important;
      }
      @media (prefers-reduced-motion: reduce) {
        .week1-state-page .week1st-surface,
        .week1-state-page table tbody tr {
          transition: none !important;
          transform: none !important;
        }
      }
    `}</style>
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }} className="week1-state-page">
      <h1 style={{ color: '#2c3e50', marginBottom: '30px' }}>State Tax</h1>

      {/* Taxable Income Input Section */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '15px',
        marginBottom: '20px',
        border: '1px solid #dee2e6',
        borderRadius: '5px'
      }} className="week1st-surface">
        <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Taxable Income</h3>
        <p style={{ margin: '0', color: '#495057' }}>
          <strong>Value:</strong> {formatCurrency(taxableIncome)}
        </p>
        <p style={{ margin: '5px 0 0 0', color: '#6c757d' }}>
          <strong>State:</strong> {selectedState}
        </p>
      </div>

      {/* Main State Tax Table */}
      <div style={{ marginBottom: '30px' }} className="week1st-surface">
        <h2 style={{ color: '#2c3e50', marginBottom: '15px' }}>{selectedState} State Tax Calculation</h2>
        {stateBracketBreakdown.length === 0 ? (
          <p style={{ color: '#6c757d' }}>No bracket data configured for {selectedState}.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              borderCollapse: 'collapse',
              width: '100%',
              fontSize: '13px',
              border: '1px solid #ddd'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#007bff', color: 'white' }}>
                  <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>Rate</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>Bracket Range</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>Taxable Amount in Bracket</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>Tax in Bracket</th>
                </tr>
              </thead>
              <tbody>
                {stateBracketBreakdown.map((calc, index) => (
                  <tr key={index} style={{ backgroundColor: calc.taxInBracket > 0 ? '#e8f5e8' : '#f8f9fa' }}>
                    <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>
                      {formatPercent(calc.rate)}
                    </td>
                    <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>
                      {formatBound(calc.lower)} &ndash; {formatBound(calc.upper)}
                    </td>
                    <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'right' }}>
                      {formatCurrency(calc.taxableInBracket)}
                    </td>
                    <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'right' }}>
                      {formatCurrency(calc.taxInBracket)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Total */}
      <div style={{ marginBottom: '30px' }} className="week1st-surface">
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '15px',
          border: '1px solid #dee2e6',
          borderRadius: '5px',
          display: 'inline-block'
        }} className="week1st-surface">
          <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>Total {selectedState} State Tax</h4>
          <p style={{ margin: '0', fontSize: '20px', fontWeight: 'bold', color: '#28a745' }}>
            {formatCurrency(totalStateTax)}
          </p>
        </div>
      </div>

      {/* NYC City Tax Section (if applicable) */}
      {selectedState === 'NY' && residenceInNYC && (
        <div style={{ marginBottom: '30px' }} className="week1st-surface">
          <h2 style={{ color: '#2c3e50', marginBottom: '15px' }}>NYC Resident City Tax</h2>
          <div style={{ overflowX: 'auto', marginBottom: '15px' }}>
            <table style={{
              borderCollapse: 'collapse',
              width: '100%',
              fontSize: '13px',
              border: '1px solid #ddd'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#6f42c1', color: 'white' }}>
                  <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>Rate</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>Bracket Range</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>Taxable Amount in Bracket</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>Tax in Bracket</th>
                </tr>
              </thead>
              <tbody>
                {nycBracketBreakdown.map((calc, index) => (
                  <tr key={index} style={{ backgroundColor: calc.taxInBracket > 0 ? '#e8f5e8' : '#f8f9fa' }}>
                    <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>
                      {formatPercent(calc.rate)}
                    </td>
                    <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>
                      {formatBound(calc.lower)} &ndash; {formatBound(calc.upper)}
                    </td>
                    <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'right' }}>
                      {formatCurrency(calc.taxableInBracket)}
                    </td>
                    <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'right' }}>
                      {formatCurrency(calc.taxInBracket)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '15px',
            border: '1px solid #dee2e6',
            borderRadius: '5px',
            display: 'inline-block'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>Total NYC City Tax</h4>
            <p style={{ margin: '0', fontSize: '20px', fontWeight: 'bold', color: '#6f42c1' }}>
              {formatCurrency(totalNycTax)}
            </p>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
