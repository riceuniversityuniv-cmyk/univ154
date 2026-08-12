# Financial Formula & Methodology Audit — 2026-08-11

Full-codebase audit of every financial calculation in the UNIV154 tool: tax/FICA,
budgeting recommendations, savings goals, credit-card/loan amortization, mortgage
amortization, retirement projections, HDHP insurance comparison, and portfolio
withdrawal modeling. Conducted via three parallel code-exploration passes (tax
engine; budgeting/savings/credit-card; retirement/other weeks) plus personal
line-by-line verification of the two most severe findings.

**Verdict: the tool is not currently fully correct.** Several confirmed bugs
produce materially wrong dollar amounts under realistic, plausible inputs — not
edge cases a student would be unlikely to hit. Separately, the tax/FICA
calculation is implemented **four independent times** in four different files,
and those four copies have already drifted apart, so different tabs of the same
app can disagree about the same user's tax bill today.

No code was changed as part of this audit — this is a read-only findings report.

---

## Severity legend

- **Critical** — produces a materially wrong dollar figure under realistic inputs a
  student would plausibly enter; not a narrow edge case.
- **High** — a real bug, but with a narrower trigger condition or smaller dollar
  impact than Critical.
- **Medium** — real but low-visibility: internal inconsistency, dead code risk, or
  an edge case a student is less likely to hit.
- **Low** — a defensible simplification/design choice, flagged because it could
  surprise a student expecting a more standard formula, not because it's "wrong."

`✔ personally verified` = I independently read the exact lines myself and confirm
the finding. Everything else rests on the exploration agents' inspection (which in
many cases includes the agent numerically re-running the algorithm against the
repo's own data to reproduce the bad output — noted per-finding below).

---

## Summary table

| # | Severity | Area | File:line | Issue |
|---|---|---|---|---|
| 1 | Critical ✔ | Tax/FICA | `BudgetContext.jsx:253,637` | Social Security tax caps the *tax dollar amount* at the *wage-base dollar figure* instead of capping income first — effectively uncapped below ~$2.84M income |
| 2 | Critical ✔ | Credit Card | `Week3CreditCard.jsx:69-70,257-326` | "Minimum Payment" = interest-only on the frozen original balance, reused every month — principal payment is always ~0, debt mathematically never pays off |
| 3 | Critical | Tax/State | `taxCalculator.js:131-187` | State-bracket walk produces **negative** tax for DE/ID/MS/MO/ND/OH below their first bracket threshold |
| 4 | Critical | Tax/State | `Week1StateTax.jsx:24-49` | Separate state-bracket walk shows **$0.00** tax for ~20 flat-rate states regardless of income, and taxes DE/ID/MS/MO/ND/OH on their *entire* income even below threshold |
| 5 | Critical | Insurance | `Week7.jsx:143` | HDHP-vs-traditional comparison always adds the *full* deductible to out-of-pocket cost, even when medical expenses are below it |
| 6 | Critical | Retirement | `Week6Retirement.jsx:1575-1577` | Roth 401(k) "Balance vs Age" chart formula has an extra `(1+r)` factor, diverging from its own accumulation table |
| 7 | Critical | Portfolio | `Week9.jsx:190-191` | "Value in Today's Dollars" discounts by a fixed 80-year horizon regardless of when the peak balance actually occurs — understates by ~7x under default inputs |
| 8 | High | Tax/FICA | `taxData.js:15` + 5 hardcoded copies | Social Security wage base is the 2025 figure ($176,100); 2026 SSA figure is $184,500 |
| 9 | High | Tax | `BudgetContext.jsx:190-191` vs `taxCalculator.js:118` | Taxable-income formula subtracts pre-tax 401k/insurance in one engine, not the other — Summary tab vs Federal/State tabs diverge whenever those fields are nonzero |
| 10 | High | Tax/State | `BudgetContext.jsx` HI/CA/WI arrays vs `stateTaxData.js` | Independently-typed state-bracket data has drifted: HI missing a bracket + fabricated top bracket; CA fabricated top bracket; WI $80 threshold typo |
| 11 | High | Retirement | `Week12.jsx:582-587` | Employer 401(k) match computed regardless of whether the employee contributes anything (gated only on age) |
| 12 | High | Retirement | `Week12.jsx:385-404,601-603` | RMD divisor table hardcoded only through age 90; RMDs silently become $0 past that age |
| 13 | Medium | Tax | `BudgetContext.jsx:584-589,691-696` vs `taxCalculator.js:194-201` | NYC tax rates rounded to 4 decimal places vs the precise published rates — small precision-loss divergence |
| 14 | Medium | Budgeting/Retirement | `BudgetForm.jsx:996` vs `SavingsForm.jsx:937` | Roth 401(k) annual cap is $24,499.92 in one place, $23,500 (correct 2025 IRS limit) in another |
| 15 | Medium | Dead code | `CalculationDetails.jsx`, `configs/week1Config.js`, `configs/week2Config.js` | Not imported anywhere; describe an older allocation model that no longer matches the live app |
| 16 | Medium | Dead code | `BudgetContext.jsx:807-854` (`savingsCalculations`) | Hardcoded 4%/60-month FV block, superseded by `SavingsForm.jsx`'s live user-rate implementation, but still computed every render |
| 17 | Medium | Dead code | `BudgetForm.jsx` (`financialCalculations` from `taxCalculator.js`) | Computed every render but never rendered — a fully separate, already-diverged tax engine kept alive as an unused `useMemo` dependency |
| 18 | Medium | Mortgage | `Week5.jsx:117-233` | Contradictory comments about whether bi-weekly payment should be `monthly/2` (what's actually used) or a "corrected" true bi-weekly PMT (never computed); displayed "Principal Paid" is hardcoded to the loan amount rather than the actual summed principal |
| 19 | Medium | Savings | `SavingsForm.jsx:826-844` | NPER/sinking-fund formulas are mathematically correct but divide by `monthlyRate`, which is unguarded against a 0% entry → `NaN`/`Infinity` |
| 20 | Medium | Retirement | `Week6Retirement.jsx:556` vs `1056` | 401(k) tables index years from 0, IRA tables from 1 — same underlying math, inconsistent displayed "Year" column |
| 21 | Medium | Retirement | `Week6Retirement.jsx:464-475,2200-2373` | Dead "contribution limit × after-tax-rate" branch, never rendered; meanwhile the *live* calculators enforce no IRS contribution limit at all |
| 22 | Low | Budgeting | `BudgetForm.jsx:1010-1026` | Rent recommendation mixes a percentage-of-income housing budget with fixed-dollar utility assumptions, which can floor recommended rent to $0 for lower incomes |
| 23 | Low | Budgeting | `BudgetForm.jsx:1137-1141` | "Emergency Fund" is a flat 2%-of-income ongoing contribution rate, not a computed target balance (e.g. months-of-expenses) |
| 24 | Low | Retirement | `Week6Retirement.jsx:533-535,788-790` | Employer 401(k) match has no salary-based or dollar cap; Roth 401(k) employer-match dollars are commingled into the tax-free bucket rather than modeled as a separate taxable sub-account |
| 25 | Low | Retirement | `Week6Retirement.jsx:580-598` | Withdrawal phase is % of *current* balance each year (declining-balance/perpetuity draw), not the commonly-expected "4% rule" (fixed amount, inflation-adjusted) — UI does self-disclose this, so not mislabeled |
| 26 | Low | Portfolio | `Week9.jsx:128` | Flat 15% long-term capital gains rate (vs. Week 12's more accurate bracket-stacked LTCG engine) |
| 27 | Low | Tax | Whole app | No Additional Medicare Tax (0.9% on wages > $200,000) modeled anywhere |
| 28 | Low | Tax | `taxCalculator.js:15-19` | Standard deduction hardcoded to single-filer only; stale comment says "$15,000" but code returns $16,100; MFJ/HoH/blind/age logic fully commented out and dead |
| 29 | Low | Data quality | `stateTaxData.js` | No tax-year stamp; 50-state figures not independently re-verified state-by-state against each state's DOR in this pass — flagged as unverified bulk data |

---

## 1. The core structural problem: four independent tax engines

Federal income tax, Social Security, Medicare, state tax, and NYC tax are each
computed from scratch in **four separate places**, with no shared source of truth:

1. `src/utils/taxCalculator.js` → `calculateFinancials()` — feeds
   `financialCalculations` in context; in practice only `taxableIncome` from this
   object is ever displayed (see #17 below — the rest is dead weight).
2. `src/components/Week1FederalTax.jsx` — its own local federal-bracket table and
   its own bracket-tracker walk, purely for that tab's display.
3. `src/components/Week1StateTax.jsx` — its own local state-bracket walk (three
   parallel "Suggested / User / 0-Pretax" columns) plus its own NYC table.
4. `src/contexts/BudgetContext.jsx` → `summaryCalculations` — a full
   reimplementation with its own hardcoded 7-bracket federal table, its own
   hand-typed 50-state bracket object, and its own NYC brackets, feeding the
   Summary tab.

Each was very likely transcribed independently from the same source Excel
workbook, and each has since drifted from the others in different ways (see #8–10,
#13 below). **This means the Federal Tax tab, State Tax tab, and Summary tab can
show different tax figures for the identical inputs today**, and any future
bracket update (e.g. the annual IRS/state adjustments) has to be applied correctly
in four places to stay consistent — a maintenance model that has already failed
once (the four copies already disagree).

---

## 2. Critical findings (detail)

### 2.1 Social Security tax cap applied to the wrong operand ✔ personally verified

**`src/contexts/BudgetContext.jsx:253` and `:637`** (identical bug, both the
"Suggested" and "User" columns):
```js
const suggestedSocialSecurityTax = Math.min(preTaxIncome * 0.062, 176100); // MIN(preTaxIncome * 6.2%, 176100)
const userSocialSecurityTax       = Math.min(preTaxIncome * 0.062, 176100); // MIN(preTaxIncome * 6.2%, 176100)
```
**Correct formula:** Social Security tax = `min(wages, wage_base_limit) × 6.2%`. The
wage-base limit caps the *income subject to tax*, not the *resulting tax dollar
amount*. Correct max tax at the 2025 base = `176100 × 0.062 = $10,918.20`.

**What the code does:** caps the *computed tax dollars* at `176100` — a number
that's actually the wage-base *income* figure, not a tax-dollar figure. Since
`preTaxIncome × 0.062` only reaches `176100` once `preTaxIncome ≈ $2,840,323`, the
`Math.min(...)` **never engages for any realistic salary**. Below ~$2.84M, Social
Security tax on the Summary tab grows linearly forever at a flat 6.2% of gross
income with no cap — directly contradicting the correctly-capped version in
`Week1FederalTax.jsx:167` (`Math.min(taxableIncome * 0.062, 176100 * 0.062)`, which
*is* the correct shape) and `taxCalculator.js:122-123`.

**Impact:** this feeds directly into `suggestedAfterTaxIncome`/
`userAfterTaxIncome`, which is the sole income base for every "Recommended Spend"
dollar figure and every "% of income" figure across Week 1 Budgeting and Week 2
Savings. At $500,000 income, the Summary tab computes ~$31,000 of SS tax where the
correct capped figure is $10,918.20 — a ~$20,000 overstatement that understates
every downstream recommended budget line.

*Also stale regardless of the cap-shape bug:* `176100` is the **2025** SS wage
base; SSA's announced 2026 figure (effective for a tool labeled "2026") is
**$184,500**. This same stale constant appears in `taxData.js:15`,
`Week1FederalTax.jsx:167,368`, and both lines above — 6 hardcoded copies total.

### 2.2 Credit-card "Minimum Payment" can never pay off debt ✔ personally verified

**`src/components/Week3CreditCard.jsx:69-70`:**
```js
// Minimum payment = Interest for Month 1 (Week 3.1 B - AM Table!E4)
const monthlyRate = (parseFloat(annualInterestRate) || 0) / 100 / 12;
const minimumPayment = Math.round(((parseFloat(debtAmount) || 0) * monthlyRate) * 100) / 100;
```
This is explicitly documented as "interest for month 1" — i.e.
`MinimumPayment = OriginalBalance × MonthlyRate`, a fixed dollar figure computed
once. That fixed figure is then reused as the payment for *every* month in
`calculateMinimumPaymentAmortization()` (`Week3CreditCard.jsx:257-326`), instead of
being recalculated against the shrinking balance the way a real card minimum
(typically ~1–3% of current balance, or interest + a small principal floor) would
be.

**Traced the math:** in month 1, `loanAmount` is still the original `debtAmount`,
so `calculatedInterest = debtAmount × monthlyRate` — **exactly** the same formula
used to derive `minimumPayment` in the first place. So `interestPaid = minPayment`
and `principalPayment = max(minPayment − minPayment, 0) = 0`. The balance doesn't
move. Every subsequent month repeats this identically, because the balance never
changed. This is an exact mathematical fixed point (modulo a fraction-of-a-cent
rounding nudge from `Math.round(...×100)/100`, which just changes "never pays off"
into "takes centuries"). The loop is capped at 600 months
(`Week3CreditCard.jsx:271`) purely as a safety valve, and the UI displays **"Never
(600+)"** for essentially every realistic input — the minimum-payment comparison
column is not a functioning comparison, it always shows the same degenerate
result regardless of the numbers entered.

By contrast, the user-specified-payment track
(`calculateUserPaymentAmortization()`, lines 190-255) correctly recalculates
interest against the current, shrinking balance each month and amortizes
normally — the bug is specific to how "minimum payment" is *defined*, not to the
amortization loop mechanics in general.

*Secondary inconsistency:* the user-payment track allows negative principal
(balance grows if payment < interest, "per Excel logic," line 214) while the
minimum-payment track floors principal at 0 (line 285) — different sign-handling
conventions for what should be the same amortization formula, though this is moot
given #2.2's fixed point makes it unreachable in the minimum-payment track today.

### 2.3 State tax: negative tax below threshold in one engine

**`src/utils/taxCalculator.js:131-187`** — the bracket-tracker walk never checks
whether `taxableIncome` is *below* the current bracket's `lowerBound`; it only
zeroes tax via two other conditions (wrong state / already-applied-in-earlier-
bracket). For any state whose lowest listed bracket has `lowerBound > 0` — **DE,
ID, MS, MO, ND, OH** in `stateTaxData.js` — a taxpayer below that threshold gets a
**negative** tax that reduces total tax and inflates after-tax income. Reproduced
by re-running the algorithm:
```
MS taxableIncome=5000  -> stateIncomeTax = -220.00   (should be 0)
MS taxableIncome=9000  -> stateIncomeTax = -44.00    (should be 0)
ID taxableIncome=2000  -> stateIncomeTax = -152.23   (should be 0)
MO taxableIncome=500   -> stateIncomeTax = -16.26    (should be 0)
ND taxableIncome=20000 -> stateIncomeTax = -555.26   (should be 0)
OH taxableIncome=10000 -> stateIncomeTax = -441.38   (should be 0)
```

### 2.4 State tax: $0 for flat-rate states, over-taxed for threshold states, in a *second* engine

**`src/components/Week1StateTax.jsx:24-49`** — a completely separate
implementation of the same state-bracket walk, with different (also wrong)
behavior. Its `tracker=3` branch (fires whenever the *next row in the flat data
array* belongs to a different state — i.e., for any single-bracket/flat-rate
state) computes `(nextBracket.lowerBound − bracket.lowerBound) × rate`, using the
**next state's** threshold as if it were this state's own upper bound. Since many
states' first bracket starts at `lowerBound: 0`, this collapses to `(0−0)×rate=0`.
Reproduced:
```
GA taxableIncome=80000 -> stateTax total = 0.00   (should be ~$4,312, 5.39% flat)
IL taxableIncome=80000 -> stateTax total = 0.00   (should be ~$3,960, 4.95% flat)
IN, IA, KY, LA, MI, PA, UT, CO -> all $0.00 at $80,000 income
```
This affects roughly **20 of the 50+ jurisdictions** — every state whose real tax
code is a single flat rate shows **$0.00 state tax on the State Tax tab regardless
of income.**

The same component's default `else` branch (`appliedTracker = 1`, "tax the whole
income at this bracket's rate") produces the *opposite* problem for the DE/ID/MS/
MO/ND/OH threshold states from §2.3 — instead of negative tax below threshold,
this engine taxes the **entire** income at the top bracket's rate even when below
it (e.g. MS at $5,000 income → **+$220.00**, versus taxCalculator.js's **−$220.00**
for the identical input — the two engines disagree in both sign and magnitude for
the same edge case).

### 2.5 HDHP out-of-pocket cost ignores whether the deductible was actually met

**`src/components/Week7.jsx:116-154`:**
```js
const coinsuranceAmount = Math.max(medicalExpensesNum - deductibleNum, 0) * (coinsuranceRateNum / 100);
const totalOutOfPocket = deductibleNum + coinsuranceAmount;   // <-- always adds the FULL deductible
const outOfPocketCosts = Math.min(totalOutOfPocket, maxOutOfPocketNum);
```
**Correct formula:** `outOfPocket = min(medicalExpenses, deductible) + max(medicalExpenses − deductible, 0) × coinsuranceRate` —
you only pay up to what you actually spent inside the deductible phase. As
written, `totalOutOfPocket` unconditionally adds the entire deductible regardless
of whether medical expenses reach it. A user who enters `$500` of expected medical
expenses against the HDHP's `$5,000` deductible (`Week7.jsx:72`) sees
`totalOutOfPocket = $5,000 + $0 = $5,000` — a **$4,500 overstatement** of what they
would actually owe. This is masked by the page's default `expectedMedicalExpenses
= $11,000` (line 5), which exceeds both plans' deductibles, so the default view
looks correct; it only surfaces once a user models a lower/healthier-year expense
scenario — a very plausible use of exactly this comparison tool.

### 2.6 Roth 401(k) chart diverges from its own data table

**`src/components/Week6Retirement.jsx:1547-1588`** — unlike every sibling
"generate…ChartData" function in this file (Traditional 401k, Traditional IRA,
Roth IRA — all of which correctly pull `accountBalance` from the real
`calculate*SeriesX()` output), `generateRoth401kChartData` recomputes balances
with its own closed form:
```js
const seriesABalance = totalAnnualContributionA * ((Math.pow(1 + returnRate, year + 1) - 1) / returnRate) * (1 + returnRate);
```
The correct closed form (matching the recurrence used by the real accumulation
table, `balance_n = balance_{n-1}(1+r) + C`) is `FV_n = C·[(1+r)^{n+1} − 1]/r` —
**no trailing `×(1+r)`**. At `year=0`, the real table shows `accountBalance = C`
(the first contribution, no growth yet); this chart formula computes `C·(1+r)` —
already wrong at year 0, and the error compounds by a further factor of `(1+r)`
every subsequent year. Result: the "Roth 401(k) Balance vs. Age" chart shows
inflated numbers relative to the Roth 401(k) table and withdrawal figures shown
elsewhere on the same page for the same Series A/B/C, while every other account
type's chart correctly matches its own table.

### 2.7 "Value in Today's Dollars" uses a fixed, usually-wrong time horizon

**`src/components/Week9.jsx:190-191`:**
```js
const nper = Math.max(0, maxAge - currentAgeForPV);   // = maxAge(102) - minAge(22) = 80, ALWAYS
const valueTodayDollars = maxEndingBalance / Math.pow(1 + inflationRate, nper);
```
`maxEndingBalance` is the peak balance across the full 22–102 age sweep, which
typically occurs at whatever age withdrawals begin (default `withdrawStartAge =
45`), **not** at age 102. But the discounting period `nper` is hardcoded to the
full 80-year span regardless of when that peak actually occurred, so the figure is
systematically over-discounted (understated). Under default inputs (peak around
age 45, i.e. 23 years out) with `inflationRate = 3.5%`: correct discount factor
`(1.035)^23 ≈ 2.19×` vs. the code's `(1.035)^80 ≈ 15.68×` — the displayed "today's
dollars" figure can be understated by roughly a factor of 7.

---

## 3. High-severity findings (detail)

### 3.1 Taxable income formula diverges between the Summary tab and Federal/State tabs

- `taxCalculator.js:118`: `taxableIncome = preTaxIncome − standardDeduction` (never
  subtracts 401(k)/insurance pre-tax expenses). This is what
  `Week1FederalTax.jsx` and `Week1StateTax.jsx` both display as "Taxable Income."
- `BudgetContext.jsx:190-191`: `suggestedTaxableIncome = preTaxIncome −
  standardDeduction − suggestedPreTaxExpenses` (does subtract them). This feeds
  the Summary tab only.

For any user with a nonzero 401(k) contribution or insurance premium, the Federal
Tax and State Tax tabs will show a materially **higher** Taxable Income — and
therefore different tax dollars — than the Summary tab, for identical inputs.

### 3.2 State-bracket data has drifted between its two independent copies

`stateTaxData.js` (used by `taxCalculator.js`/`Week1StateTax.jsx`) and
`BudgetContext.jsx`'s separately hand-typed 50-state object (used by the Summary
tab) disagree in at least three places:
- **HI**: `BudgetContext.jsx` (lines 317-330) omits the real 7.9% bracket present
  in `stateTaxData.js` (lines 38-49) and adds a fabricated 12% top bracket that
  doesn't exist in the other file (which tops out at 11%).
- **CA**: `BudgetContext.jsx` (lines 278-289) splits `stateTaxData.js`'s single
  13.3%-and-up bracket (lines 12-21) and adds a fabricated 14.3% top bracket — a
  figure that also doesn't match the real-world combined CA top rate (13.3% + 1%
  Mental Health Services Tax surcharge = 14.4%; neither file models the surcharge
  correctly, and `BudgetContext.jsx`'s invented figure is off by 0.1pp from the
  real number too).
- **WI**: `BudgetContext.jsx:504` has the 5.3% bracket starting at `$29,370`;
  `stateTaxData.js:156` has it starting at `$29,290` — an $80 transcription
  mismatch between the two supposedly-identical constants.

### 3.3 Employer 401(k) match decoupled from actual employee contribution (Week 12)

**`src/components/Week12.jsx:582-587`:**
```js
const contributes = age <= retirementAge;
const contribution401k = contributes ? limit401k * contribution401kPct : 0;
...
const employerMatch = contributes ? salary * employerMatchPct : 0;
```
`employerMatch` is gated only on `contributes` (age-based), not on whether
`contribution401kPct > 0`. Setting the contribution percentage to 0 still credits
a full `salary × employerMatchPct` employer match every year — real employer
matches require a corresponding employee contribution. Also note Week 12 defines
"Employer Match %" as a percentage of **salary**, while Week 6
(`Week6Retirement.jsx:533-535`) defines the same-named concept as a percentage of
the **employee's own contribution** — the same UI label means two different things
in two different modules of the same app.

### 3.4 RMD table silently stops past age 90

**`src/components/Week12.jsx:385-404, 596-603`:** `RMD_DIVISOR_BY_AGE` only has
entries for ages 73–90. Past age 90, the lookup returns `undefined`, and the code
treats that as `rmd = 0` rather than continuing to apply the real IRS Uniform
Lifetime Table (which extends well past 90). Not triggered under default inputs
(`currentAge=22`, 60-year projection reaches age 81 only), but any user who raises
the starting age far enough will see RMDs silently vanish past 90.

---

## 4. Medium and Low findings

See the summary table above (#13–29) for the full list with file:line references;
each was detailed by the exploration passes with code excerpts. Grouped briefly:

- **Precision/consistency drift** that doesn't change pass/fail correctness but
  means different tabs won't agree to the penny: NYC rate rounding (#13), Roth
  401(k) cap inconsistency (#14).
- **Dead code** that isn't currently user-visible but represents wasted
  computation and future-drift risk if someone assumes it's live: `CalculationDetails.jsx`/`configs/*.js` (#15), `BudgetContext.jsx`'s
  unused `savingsCalculations` block (#16), `BudgetForm.jsx`'s unused
  `financialCalculations`/`taxCalculator.js` engine (#17), Week 6's dead
  contribution-limit branch (#21).
- **Real but narrow-trigger bugs**: Week 5's bi-weekly payment
  comment/logic mismatch and hardcoded "Principal Paid" total (#18), a 0%-rate
  `NaN` in `SavingsForm.jsx` (#19), inconsistent year-indexing between Week 6's
  401(k) and IRA tables (#20).
- **Defensible simplifications worth knowing about**, not bugs to fix reflexively:
  Rent recommendation's mixed percentage/fixed-dollar basis (#22), Emergency Fund
  modeled as a contribution rate rather than a target balance (#23), uncapped
  employer match / commingled Roth match dollars in Week 6 (#24), the withdrawal
  phase being a declining-balance draw rather than the classic "4% rule" (#25, the
  UI does self-disclose this), flat 15% LTCG in Week 9 vs. Week 12's bracket-aware
  version (#26), no Additional Medicare Tax anywhere in the app (#27), and
  `taxCalculator.js`'s single-filer-only standard deduction with dead
  married/HoH/blind logic and a stale "$15,000" comment (#28).
- **Unverified bulk data** (#29): `stateTaxData.js`'s 50-state figures were not
  independently checked state-by-state against each state's Department of Revenue
  in this pass — only cross-referenced against `BudgetContext.jsx`'s duplicate
  copy (which surfaced #10 above) and spot-checked federal/NY figures against
  published 2026 numbers.

---

## 5. What was confirmed correct (no action needed)

To be clear about what's *working*, not just what's broken:

- **Federal bracket-stacking algorithm** — the marginal/progressive tax math
  itself (`taxCalculator.js:85-102`, `Week4.jsx:69-90`, `Week12.jsx:413-419`) is
  textbook-correct everywhere it appears, including the ordinary-income-then-
  capital-gains stacking logic in Week 12. The *bug* is in the duplicated,
  drifted constants and FICA handling around it, not this core algorithm.
- **2026 federal bracket thresholds and standard deduction** in `taxData.js`
  (10%/12%/22%/24%/32%/35%/37% at the published breakpoints, $16,100 single
  standard deduction) match the published 2026 IRS figures (Rev. Proc. 2025-32).
- **`SavingsForm.jsx`'s NPER and sinking-fund formulas** (#19's formula itself,
  not its 0%-rate edge case) are correct, standard closed-form solutions matching
  Excel's `NPER`/annuity-payment functions.
- **General Loans standard amortization** (`Week3CreditCard.jsx:128-187`) and
  **mortgage amortization** (`Week5.jsx:97-170`) both use the textbook PMT formula
  and correctly recompute interest against the live, shrinking balance each
  period — unlike the credit-card "minimum payment" bug (§2.2), these converge
  properly.
- **Percentage-as-decimal handling** throughout `BudgetForm.jsx`'s recommended-
  spend calculations, `SavingsForm.jsx`'s rate parsing, and
  `Week3CreditCard.jsx`'s rate conversions — no instances found of a percentage
  like 5% being treated as `5` instead of `0.05`.
- **NYC bracket-stacking** in `taxCalculator.js` and `Week1StateTax.jsx` (the
  precise, unrounded version) is correctly implemented.
- **Loop termination/convergence safeguards** — all amortization loops cap at 600
  months and use an epsilon-tolerant "paid off" check, correctly preventing
  infinite loops even where the underlying formula is broken (§2.2).

---

## 6. Recommendations (not executed in this pass)

1. **Fix the seven Critical findings first** (§2) — these are the ones most likely
   to show a student a materially wrong number under ordinary use, not a contrived
   edge case.
2. **When fixing, consolidate the four tax/FICA engines into one shared module**
   (per the project owner's stated preference), rather than patching the same
   numeric bug in four separate files again. This is the only way to stop this
   category of drift from recurring — the four copies have already disagreed at
   least three times independently (SS cap, state brackets, HI/CA/WI data) despite
   presumably starting from the same source spreadsheet.
3. **Update the stale 2025 Social Security wage base to the 2026 SSA figure**
   ($184,500) everywhere it's hardcoded, ideally as part of #2 so it only needs
   updating in one place going forward.
4. **Spot-check `stateTaxData.js`'s 50-state figures** against each state's 2025/
   2026 published tax tables before trusting it as authoritative — this pass only
   cross-referenced it against its own duplicate in `BudgetContext.jsx`.
5. **Remove or clearly mark dead code** (`CalculationDetails.jsx`,
   `configs/week1Config.js`, `configs/week2Config.js`, the unused
   `savingsCalculations` block, the unused `financialCalculations` engine) so a
   future editor doesn't mistake it for live logic or waste time keeping it in
   sync with real bracket updates.

No source files were modified to produce this report.

---

## 7. Addendum (2026-08-12): compared against the master Excel workbook

The user asked whether the bugs above already exist in the source spreadsheet
(`Spring 2026\Tool\Final Master Copy - Web Based Application.xlsx`) or were
introduced while porting it to React. Extracted every formula directly from the
workbook's XML (`xl/worksheets/sheetN.xml`) via openpyxl — not re-typed by eye —
and traced each of the 7 Critical findings back to its source cell.

**Important context first: the Excel workbook's own "Week N" sheet-group labels
do not correspond to the web app's "Week N" component names.** The workbook has
58 sheets grouped by content, e.g. Excel's "Week 9 - Insurance" is the source for
the web app's `Week7.jsx`, and Excel's "Week 7 - The Goal" (with sub-sheets
"Fed Ordinary 2026," "Tax Engine," "Projection Engine," etc.) is the source for
`Week12.jsx`. Comparisons below are matched by calculation content, not by label.

### Verdict per finding

| # | Finding | Excel formula | Verdict |
|---|---|---|---|
| 1 | SS tax cap bug | `Week 1 B - Federal Tax!G18`: `=MIN('Week 1 B - Summary'!$C$4*$B$20,$B$17)` — literally `MIN(income × 6.2%, 176100)` | **Inherited.** Byte-for-byte the same wrong shape as `BudgetContext.jsx`. `Week1FederalTax.jsx`'s differently-written (and coincidentally correct) version is the outlier, not Excel. |
| 2 | Credit-card minimum payment never converges | `Week 3.1 B - AM Table!N4`: `=MIN(MAX(O4+0.01*M4,25),M4+O4)`, recalculated every month against the live balance `M` | **Introduced during the port.** Excel's real minimum-payment formula is the standard `interest + 1% of balance, $25 floor` — and it amortizes correctly, verified by hand-tracing 12 months (principal payment shrinks from $100.00 → $89.53 but stays positive throughout). The web app's interest-only, frozen-at-original-balance formula has no counterpart in Excel at all. |
| 3 | Negative state tax below threshold (`taxCalculator.js`) | `Week 1 B - State Tax!H32` (DE, first bracket, lowerBound $2,000): `=IF(F32=2,($C$2-D32)*C32,...)` | **Inherited.** Traced by hand at $1,000 taxable income: Excel returns `(1000-2000)*0.022 = -$22.00`. Same missing "is income below this bracket's own floor" check as the web port. |
| 4 | $0 tax for flat-rate states (`Week1StateTax.jsx`) | `Week 1 B - State Tax!H39` (GA, single bracket, lowerBound $0): `=IF(F39=3,($C$2-D39)*C39,...)` | **Introduced during the port.** Excel's tracker-3 branch multiplies by *taxable income*, not by the next state's threshold — at $80,000 it correctly returns $4,312.00 (5.39% flat). `Week1StateTax.jsx` substituted `nextBracket.lowerBound` for `taxableIncome` in this branch, which Excel's formula never does. The same file's *other* bug (taxing DE/ID/MS/MO/ND/OH's full income below threshold) is also its own invention — Excel's structurally different nested-IF produces the negative-tax bug (#3) instead, never a full-income overcharge. |
| 5 | HDHP always charges the full deductible | `Week 9 - Insurance!D25`: `=MIN(D11 + (MAX(D4-D11,0)*(D14)), D17)` | **Inherited.** Identical shape to `Week7.jsx`'s formula — `Week7.jsx`'s own code comment even transcribes this exact Excel formula. Excel has the identical defect: it doesn't check whether medical expenses actually reached the deductible before adding the full deductible amount. |
| 6 | Roth 401(k) chart has an extra `(1+r)` factor | `Week 5 B - Roth 401(k) - Ser A!G5`: `=G4*(1+'Week 5.3 - Roth 401(k)'!$I$6)+F5` (feeds the chart directly) | **Introduced during the port.** Excel's chart isn't a separate formula at all — it just plots this same accumulation column that the table also reads from, so table and chart can never disagree in Excel. The web app's `generateRoth401kChartData` reimplements its own closed form (with the extra `(1+r)`) instead of reusing the real table data the way every sibling chart function does — a bug with no Excel counterpart. |
| 7 | "Value in today's dollars" wrong discount horizon | `Week 6 - Markets & Investing!D53`: `='Week 6 B - General Data'!N90/(1+…!$F$4)^…!$B$90` | **Introduced during the port.** Excel discounts the literal *last row* of the projection by that *same row's* own age — always self-consistent by construction, and Excel never searches for a "peak balance" elsewhere in the sweep. `Week9.jsx` added a `MAX()`-across-the-sweep peak-finding step that doesn't exist in Excel at all, then paired it with a discount exponent that still assumes the fixed full-span horizon — the mismatch, and the very concept of a searched-for peak, is a web-only addition. |

### What this means

Of the 7 Critical findings, **3 are faithfully inherited from the master
spreadsheet** (SS tax cap, negative state tax for threshold states, HDHP
deductible) — the web app reproduced Excel's own bugs correctly. **4 were
introduced during the React port** and have no counterpart in Excel: the
credit-card minimum-payment formula was replaced with a materially different
(and broken) one; `Week1StateTax.jsx`'s two state-tax bugs are both novel
reimplementation errors, not present in either Excel or the *other* web tax
engine (`taxCalculator.js`, which correctly mirrors Excel's negative-tax bug but
not the $0/over-tax ones); the Roth 401(k) chart and the Week 9 "today's
dollars" figure both added logic (a custom closed-form chart calc; a
peak-balance search) that doesn't exist in the source spreadsheet, and that
added logic is where each bug lives.

**Practical implication for fixing:** the 3 inherited bugs need a decision from
whoever owns the course content — do you want the web tool to match the
spreadsheet's original math (bugs and all, for consistency with what's taught
in class), or should the port take the opportunity to correct them? The 4
introduced bugs don't have that ambiguity — they're straightforward
port-fidelity bugs, fixable by making the code match Excel's actual (correct, in
these 4 cases) formulas.

This addendum checked the 7 Critical findings only, given the effort involved in
manually tracing each formula through the workbook's XML. The remaining 22
High/Medium/Low findings have not yet been checked against Excel — ask if you'd
like those traced too.
