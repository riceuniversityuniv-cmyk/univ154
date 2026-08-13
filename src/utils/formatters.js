// Single shared display-formatting module for currency and percent values,
// replacing the ~10 independently hand-rolled formatCurrency/formatPercent
// copies that used to live in BudgetForm.jsx, SavingsForm.jsx, Week1FederalTax.jsx,
// Week1StateTax.jsx, Week1Summary.jsx, Week6Retirement.jsx, Week9.jsx, and
// Week12.jsx. Those copies disagreed on decimal precision (1 vs 2 decimals),
// on whether the "$" was baked into the function or left for the caller to
// splice on, and in a few spots the caller rendered the "$" as a separate
// flex-justified span (`<span>$</span> ... <span>{amount}</span>` with
// `justifyContent: 'space-between'`) -- i.e. Excel's *Accounting* format,
// where the symbol is pinned to the left edge and the number floats to the
// right with a gap between them. That's not what any of these screens want;
// they want Excel's *Currency* format, where the $ sits immediately against
// the first digit as one unit ("$1,234.56"), same as this module produces.
// See docs/univ154-migration.md.

// formatCurrency(1234.5) -> "$1,234.50"
// formatCurrency(-42)    -> "-$42.00"   (sign outside the $, matching Excel's
//                                        default Currency negative style)
export function formatCurrency(value, { decimals = 2 } = {}) {
  const n = Number(value);
  const safe = Number.isFinite(n) ? n : 0;
  const sign = safe < 0 ? '-' : '';
  const formatted = Math.abs(safe).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${sign}$${formatted}`;
}

// formatPercent(0.062)        -> "6.2%"   (fraction, the app-wide convention
//                                          for stored rates -- 5% is 0.05)
// formatPercent(6.2, { alreadyPercent: true }) -> "6.2%" (value is already *100)
export function formatPercent(value, { decimals = 1, alreadyPercent = false } = {}) {
  const n = Number(value);
  const safe = Number.isFinite(n) ? n : 0;
  const pct = alreadyPercent ? safe : safe * 100;
  return `${pct.toFixed(decimals)}%`;
}
