import React, { useState, useEffect } from 'react';
import { useAssumptions } from '../contexts/AssumptionsContext';
import { MdCheckCircle, MdCancel, MdWarning, MdAdd, MdDelete } from 'react-icons/md';

// Admin UI for the legislative/financial constants every tax/retirement
// calculator in the app now reads from (src/utils/taxEngine.js +
// useAssumptions()), instead of the ~8 independently hand-transcribed
// copies this replaced. See docs/financial-audit-2026-08-11.md and
// docs/univ154-migration.md.
//
// Same visual language as WeekAccessAdmin.jsx / AdminSettingsPanel.jsx
// (shared styles shape, message banner, loading spinner, isAdmin gate).

const styles = {
  container: {
    fontSize: '14px',
    maxWidth: 900,
    margin: '0 auto',
    padding: 24,
    backgroundColor: '#fdfdfd',
    color: '#333',
  },
  section: {
    marginTop: '24px',
    padding: '20px',
    backgroundColor: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
  },
  sectionHeader: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#002060',
    marginBottom: '4px',
  },
  sectionSubtext: {
    fontSize: '12px',
    color: '#888',
    marginBottom: '16px',
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
    marginTop: 12,
    borderRadius: '10px',
    overflow: 'hidden',
    border: '1px solid #e0e0e0',
  },
  th: {
    backgroundColor: '#002060',
    color: 'white',
    padding: '10px',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: '13px',
  },
  td: {
    border: '1px solid #e0e0e0',
    padding: '8px 10px',
    verticalAlign: 'middle',
  },
  input: {
    padding: '6px 10px',
    borderRadius: '6px',
    border: '1px solid #d0d0d0',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box',
    textAlign: 'right',
  },
  inputGroup: {
    position: 'relative',
    width: '100%',
  },
  inputAffixRight: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
    fontSize: '13px',
    pointerEvents: 'none',
  },
  primaryButton: {
    padding: '8px 16px',
    backgroundColor: '#002060',
    color: 'white',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  secondaryButton: {
    padding: '6px 12px',
    backgroundColor: '#6b7280',
    color: 'white',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
  },
  dangerButton: {
    padding: '4px 8px',
    backgroundColor: '#dc2626',
    color: 'white',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
  },
};

// Metadata for the scalar fields. assumptions.scalars itself is just a flat
// { key: number } map (decimal form for rates) -- labels/categories/display
// types live here rather than round-tripping through the DB, since nothing
// else in the app needs them.
const SCALAR_FIELDS = [
  { key: 'ss_rate', label: 'Social Security tax rate (employee)', category: 'FICA / Payroll Tax', type: 'rate' },
  { key: 'ss_wage_base', label: 'Social Security wage base', category: 'FICA / Payroll Tax', type: 'currency' },
  { key: 'medicare_rate', label: 'Medicare tax rate (employee)', category: 'FICA / Payroll Tax', type: 'rate' },
  { key: 'addl_medicare_rate', label: 'Additional Medicare tax rate', category: 'FICA / Payroll Tax', type: 'rate' },
  { key: 'addl_medicare_threshold', label: 'Additional Medicare tax threshold (single)', category: 'FICA / Payroll Tax', type: 'currency' },
  { key: 'std_deduction_single', label: 'Standard deduction (single filer)', category: 'Federal Income Tax', type: 'currency' },
  { key: 'limit_401k', label: '401(k) annual employee contribution limit', category: 'Retirement Accounts', type: 'currency' },
  { key: 'limit_ira', label: 'IRA annual contribution limit', category: 'Retirement Accounts', type: 'currency' },
  { key: 'rmd_start_age', label: 'RMD required start age', category: 'Retirement Accounts', type: 'number' },
  { key: 'penalty_free_withdrawal_age', label: 'Penalty-free withdrawal age', category: 'Retirement Accounts', type: 'number' },
  { key: 'cpi_inflation', label: 'CPI / inflation assumption', category: 'Course Modeling Assumptions (instructor defaults, not law)', type: 'rate' },
  { key: 'portfolio_return', label: 'Portfolio annual nominal return assumption', category: 'Course Modeling Assumptions (instructor defaults, not law)', type: 'rate' },
];
const SCALAR_CATEGORIES = [...new Set(SCALAR_FIELDS.map((f) => f.category))];

// Rounds away floating-point noise (e.g. 6.2000000000000006 -> 6.2,
// 7.649999999999999 -> 7.65) that shows up whenever a decimal rate is
// multiplied by 100 for display. Purely cosmetic -- doesn't clamp precision
// on what actually gets saved, just what's rendered while editing.
const clean = (num, decimals = 3) => {
  const n = Number(num);
  if (Number.isNaN(n)) return 0;
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
};

// Bakes the $ into the formatted string itself ("$176,100") rather than
// pinning it as a fixed-position decoration next to a right-aligned input --
// the latter is Excel's *Accounting* format (symbol flush left, digits flush
// right, gap between for anything shorter than the widest row). This is
// Excel's *Currency* format instead: symbol sits directly against the first
// digit, and the whole "$176,100" string is what's right-aligned as one unit.
const formatCurrencyDisplay = (num) => {
  const n = Number(num);
  if (num === '' || num === undefined || num === null || Number.isNaN(n)) return '';
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
};

const formatBoundForInput = (num) => (num >= 1e12 ? '' : formatCurrencyDisplay(num));
const parseBoundInput = (str) => (str === '' || str === undefined ? 1e12 : Number(String(str).replace(/[$,]/g, '')));
// What to show while the field is focused: the plain unformatted number, no
// $ and no commas, so the cursor isn't fighting formatting characters --
// matches Excel's own behavior of showing the raw value while editing a
// currency-formatted cell, only reformatting once you move off it.
const toRawInput = (value) => String(value ?? '').replace(/[$,]/g, '');
const toRawBoundInput = (value) => (Number(value) >= 1e12 ? '' : toRawInput(value));

// Dollar input that displays "$176,100" (Currency format, symbol glued to
// the number) when blurred, and the plain "176100" while focused/being
// typed into. Keeps its own local text while focused so typing "1,200"
// doesn't fight the cursor. onChange always receives the $/comma-stripped
// raw string, same shape a plain <input type="number"> onChange's
// e.target.value would give a caller, so it drops into the existing
// draft-state handlers as-is.
function CurrencyInput({ value, onChange, formatter = formatCurrencyDisplay, toRaw = toRawInput, placeholder, disabled, style }) {
  const [text, setText] = useState(() => formatter(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(formatter(value));
  }, [value, focused]);

  return (
    <input
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      style={style}
      value={text}
      disabled={disabled}
      onFocus={(e) => {
        setFocused(true);
        setText(toRaw(value));
        e.target.select();
      }}
      onChange={(e) => {
        setText(e.target.value);
        onChange(e.target.value.replace(/[$,]/g, ''));
      }}
      onBlur={() => setFocused(false)}
    />
  );
}

// Reusable lower/upper/rate row editor, used for Federal Ordinary, Federal
// LTCG, per-state, and NYC bracket tables -- built once instead of
// duplicating the same add/remove/save row UI four times.
function BracketTableEditor({ rows, onSave, isUpdating }) {
  const [draft, setDraft] = useState(rows);

  useEffect(() => {
    setDraft(rows);
  }, [rows]);

  const updateRow = (index, field, value) => {
    setDraft((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const addRow = () => {
    const lastUpper = draft.length > 0 ? draft[draft.length - 1].upper : 0;
    setDraft((prev) => [...prev, { lower: lastUpper >= 1e12 ? 0 : lastUpper, upper: 1e12, rate: 0 }]);
  };

  const removeRow = (index) => {
    setDraft((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const cleaned = draft
      .map((row) => ({
        lower: Number(row.lower) || 0,
        upper: parseBoundInput(row.upper === '' ? undefined : row.upper),
        rate: Number(row.rate) || 0,
      }))
      .sort((a, b) => a.lower - b.lower);
    onSave(cleaned);
  };

  return (
    <div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Lower Bound</th>
            <th style={styles.th}>Upper Bound (blank = no limit)</th>
            <th style={styles.th}>Rate (%)</th>
            <th style={{ ...styles.th, width: '60px' }}></th>
          </tr>
        </thead>
        <tbody>
          {draft.map((row, index) => (
            <tr key={index}>
              <td style={styles.td}>
                <CurrencyInput
                  style={styles.input}
                  value={row.lower}
                  onChange={(v) => updateRow(index, 'lower', v)}
                />
              </td>
              <td style={styles.td}>
                <CurrencyInput
                  style={styles.input}
                  placeholder="no limit"
                  formatter={formatBoundForInput}
                  toRaw={toRawBoundInput}
                  value={row.upper}
                  onChange={(v) => updateRow(index, 'upper', v)}
                />
              </td>
              <td style={styles.td}>
                <div style={styles.inputGroup}>
                  <input
                    style={{ ...styles.input, paddingRight: '24px' }}
                    type="number"
                    step="0.001"
                    value={clean(row.rate * 100)}
                    onChange={(e) => updateRow(index, 'rate', (Number(e.target.value) || 0) / 100)}
                  />
                  <span style={styles.inputAffixRight}>%</span>
                </div>
              </td>
              <td style={{ ...styles.td, textAlign: 'center' }}>
                <button style={styles.dangerButton} onClick={() => removeRow(index)} disabled={isUpdating}>
                  <MdDelete style={{ fontSize: '14px', verticalAlign: 'middle' }} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
        <button style={styles.secondaryButton} onClick={addRow} disabled={isUpdating}>
          <MdAdd style={{ fontSize: '14px', verticalAlign: 'middle' }} /> Add Bracket
        </button>
        <button style={styles.primaryButton} onClick={handleSave} disabled={isUpdating}>
          {isUpdating ? 'Saving...' : 'Save Brackets'}
        </button>
      </div>
    </div>
  );
}

export default function AssumptionsAdmin() {
  const { assumptions, isLoading, isAdmin, bulkUpdateScalars, replaceBracketSet, replaceRmdDivisors } = useAssumptions();

  const [scalarDrafts, setScalarDrafts] = useState({});
  const [rmdDraft, setRmdDraft] = useState([]);
  const [selectedState, setSelectedState] = useState('NY');
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    setScalarDrafts(assumptions.scalars);
  }, [assumptions.scalars]);

  useEffect(() => {
    const rows = Object.entries(assumptions.rmdDivisors)
      .map(([age, divisor]) => ({ age: Number(age), divisor }))
      .sort((a, b) => a.age - b.age);
    setRmdDraft(rows);
  }, [assumptions.rmdDivisors]);

  if (!isAdmin) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <MdWarning style={{ fontSize: '48px', color: '#ef4444', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444', marginBottom: '16px' }}>Access Denied</h2>
          <p style={{ color: '#666' }}>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{
            display: 'inline-block', width: '48px', height: '48px',
            border: '4px solid #f3f3f3', borderTop: '4px solid #002060',
            borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px',
          }}></div>
          <p style={{ color: '#666' }}>Loading assumptions...</p>
        </div>
      </div>
    );
  }

  const runUpdate = async (fn, successMessage) => {
    setIsUpdating(true);
    setMessage('');
    try {
      await fn();
      setMessage(successMessage);
      setMessageType('success');
    } catch (error) {
      setMessage(`Error: ${error.message}`);
      setMessageType('error');
    } finally {
      setIsUpdating(false);
    }
  };

  const saveScalarCategory = (category) => {
    const fields = SCALAR_FIELDS.filter((f) => f.category === category);
    const updates = {};
    fields.forEach((f) => {
      updates[f.key] = Number(scalarDrafts[f.key]) || 0;
    });
    runUpdate(() => bulkUpdateScalars(updates), `Saved ${category}.`);
  };

  const saveRmdDivisors = () => {
    const cleaned = rmdDraft
      .map((row) => ({ age: Number(row.age) || 0, divisor: Number(row.divisor) || 0 }))
      .sort((a, b) => a.age - b.age);
    runUpdate(() => replaceRmdDivisors(cleaned), 'Saved RMD divisor table.');
  };

  const addRmdRow = () => {
    const lastAge = rmdDraft.length > 0 ? rmdDraft[rmdDraft.length - 1].age : 71;
    setRmdDraft((prev) => [...prev, { age: lastAge + 1, divisor: 0 }]);
  };
  const removeRmdRow = (index) => {
    setRmdDraft((prev) => prev.filter((_, i) => i !== index));
  };
  const updateRmdRow = (index, field, value) => {
    setRmdDraft((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const stateOptions = Object.keys(assumptions.stateBrackets).sort();

  return (
    <div style={styles.container}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#002060', margin: 0 }}>Assumptions</h1>
      </div>

      {message && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center',
          gap: '8px', marginBottom: '20px',
          ...(messageType === 'success'
            ? { backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }
            : { backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }),
        }}>
          {messageType === 'success' ? <MdCheckCircle style={{ fontSize: '20px' }} /> : <MdCancel style={{ fontSize: '20px' }} />}
          <span style={{ fontSize: '14px' }}>{message}</span>
        </div>
      )}

      {/* Scalar fields, grouped by category */}
      {SCALAR_CATEGORIES.map((category) => (
        <div key={category} style={styles.section}>
          <div style={styles.sectionHeader}>{category}</div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, textAlign: 'left' }}>Rule</th>
                <th style={{ ...styles.th, width: '160px' }}>Value</th>
              </tr>
            </thead>
            <tbody>
              {SCALAR_FIELDS.filter((f) => f.category === category).map((f) => (
                <tr key={f.key}>
                  <td style={{ ...styles.td, textAlign: 'left' }}>{f.label}</td>
                  <td style={styles.td}>
                    {f.type === 'currency' ? (
                      <CurrencyInput
                        style={styles.input}
                        value={scalarDrafts[f.key] ?? 0}
                        onChange={(v) =>
                          setScalarDrafts((prev) => ({ ...prev, [f.key]: Number(v) || 0 }))
                        }
                      />
                    ) : f.type === 'rate' ? (
                      <div style={styles.inputGroup}>
                        <input
                          style={{ ...styles.input, paddingRight: '24px' }}
                          type="number"
                          step="0.001"
                          value={clean((scalarDrafts[f.key] ?? 0) * 100)}
                          onChange={(e) => {
                            const raw = Number(e.target.value) || 0;
                            setScalarDrafts((prev) => ({ ...prev, [f.key]: raw / 100 }));
                          }}
                        />
                        <span style={styles.inputAffixRight}>%</span>
                      </div>
                    ) : (
                      <input
                        style={styles.input}
                        type="number"
                        step="1"
                        value={scalarDrafts[f.key] ?? 0}
                        onChange={(e) => {
                          const raw = Number(e.target.value) || 0;
                          setScalarDrafts((prev) => ({ ...prev, [f.key]: raw }));
                        }}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            style={{ ...styles.primaryButton, marginTop: '12px' }}
            onClick={() => saveScalarCategory(category)}
            disabled={isUpdating}
          >
            {isUpdating ? 'Saving...' : `Save ${category.split(' (')[0]}`}
          </button>
        </div>
      ))}

      {/* Federal Ordinary Brackets */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>Federal Ordinary Income Tax Brackets</div>
        <div style={styles.sectionSubtext}>Single filer. Rate applies to income within each bracket.</div>
        <BracketTableEditor
          rows={assumptions.federalOrdinaryBrackets}
          isUpdating={isUpdating}
          onSave={(rows) => runUpdate(() => replaceBracketSet('federal_ordinary', null, rows), 'Saved federal ordinary brackets.')}
        />
      </div>

      {/* Federal LTCG Brackets */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>Federal Long-Term Capital Gains Brackets</div>
        <div style={styles.sectionSubtext}>Single filer.</div>
        <BracketTableEditor
          rows={assumptions.federalLtcgBrackets}
          isUpdating={isUpdating}
          onSave={(rows) => runUpdate(() => replaceBracketSet('federal_ltcg', null, rows), 'Saved federal LTCG brackets.')}
        />
      </div>

      {/* RMD Divisor Table */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>RMD Divisor Table</div>
        <div style={styles.sectionSubtext}>IRS Uniform Lifetime Table -- divisor by age.</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Age</th>
              <th style={styles.th}>Divisor</th>
              <th style={{ ...styles.th, width: '60px' }}></th>
            </tr>
          </thead>
          <tbody>
            {rmdDraft.map((row, index) => (
              <tr key={index}>
                <td style={styles.td}>
                  <input style={styles.input} type="number" value={row.age} onChange={(e) => updateRmdRow(index, 'age', e.target.value)} />
                </td>
                <td style={styles.td}>
                  <input style={styles.input} type="number" step="0.1" value={clean(row.divisor, 1)} onChange={(e) => updateRmdRow(index, 'divisor', e.target.value)} />
                </td>
                <td style={{ ...styles.td, textAlign: 'center' }}>
                  <button style={styles.dangerButton} onClick={() => removeRmdRow(index)} disabled={isUpdating}>
                    <MdDelete style={{ fontSize: '14px', verticalAlign: 'middle' }} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
          <button style={styles.secondaryButton} onClick={addRmdRow} disabled={isUpdating}>
            <MdAdd style={{ fontSize: '14px', verticalAlign: 'middle' }} /> Add Age
          </button>
          <button style={styles.primaryButton} onClick={saveRmdDivisors} disabled={isUpdating}>
            {isUpdating ? 'Saving...' : 'Save RMD Table'}
          </button>
        </div>
      </div>

      {/* State Income Tax Brackets */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>State Income Tax Brackets</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <label style={{ fontSize: '13px', color: '#495057' }}>State:</label>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            style={{ ...styles.input, width: 'auto', textAlign: 'left' }}
          >
            {stateOptions.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>
        <BracketTableEditor
          key={selectedState}
          rows={assumptions.stateBrackets[selectedState] || []}
          isUpdating={isUpdating}
          onSave={(rows) => runUpdate(() => replaceBracketSet('state', selectedState, rows), `Saved ${selectedState} brackets.`)}
        />
      </div>

      {/* NYC Brackets */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>NYC Resident City Tax Brackets</div>
        <BracketTableEditor
          rows={assumptions.nycBrackets}
          isUpdating={isUpdating}
          onSave={(rows) => runUpdate(() => replaceBracketSet('nyc', null, rows), 'Saved NYC brackets.')}
        />
      </div>
    </div>
  );
}
