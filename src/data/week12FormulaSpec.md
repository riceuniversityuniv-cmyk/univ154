# Week 12 Formula Spec (Working Notes)

This file is the single source of truth for formula inputs shared by the user for `Week12` (Constructing The Goal).

Status: **authoritative for Week12 only** (do not default to older module constants when they conflict).

## Batch 1 - Tax Assumptions and Brackets (2026)

## Workbook Cell Map (A1 References)

This section maps values to workbook-style addresses so formulas like
`'Week 7 B - Fed Ordinary 2026'!$B$3:$B$9` can be implemented directly.

### Sheet: `Week 7 B - Assumptions`

- Title cell: `B1`
- Labels: `B2:B13`
- Values: `C2:C13`

| Item | Value | Cell |
|---|---:|---|
| CPI / Inflation (used to index tax brackets + contribution limits) | 3% | `C2` |
| Portfolio annual return (nominal) | 7% | `C3` |
| Default 401(k) employee limit in 2026 | $24,500 | `C4` |
| Default IRA limit in 2026 | $7,500 | `C5` |
| Social Security tax rate (employee) | 6.20% | `C6` |
| Social Security wage base (2026) | $184,500 | `C7` |
| Medicare tax rate (employee) | 1.45% | `C8` |
| Additional Medicare rate | 0.90% | `C9` |
| Additional Medicare threshold (single) | $200,000 | `C10` |
| Federal standard deduction (single) 2026 | $16,100 | `C11` |
| RMD start age (traditional accounts) [hidden] | 73 | `C12` |
| Penalty-free retirement withdrawal age [hidden] | 59.5 | `C13` |

### Sheet: `Week 7 B - Fed Ordinary 2026`

- Title cell: `B1` (sheet title text shown in screenshot)
- Header row: `B2:D2` (`Lower`, `Upper`, `Rate`)
- Data rows: `3:9`

Canonical formula ranges:

- Lower bounds: `'Week 7 B - Fed Ordinary 2026'!$B$3:$B$9`
- Upper bounds: `'Week 7 B - Fed Ordinary 2026'!$C$3:$C$9`
- Rates: `'Week 7 B - Fed Ordinary 2026'!$D$3:$D$9`

### Sheet: `Week 7 B - Fed LTCG 2026`

- Title cell: `B1`
- Header row: `B2:D2` (`Lower`, `Upper`, `Rate`)
- Data rows: `3:5`

Canonical formula ranges:

- Lower bounds: `'Week 7 B - Fed LTCG 2026'!$B$3:$B$5`
- Upper bounds: `'Week 7 B - Fed LTCG 2026'!$C$3:$C$5`
- Rates: `'Week 7 B - Fed LTCG 2026'!$D$3:$D$5`

### Sheet: `Week 7 B - State Tax Brackets`

- Title cell: `B1`
- Header row: `B2:E2` (`State`, `Lower`, `Upper`, `Rate`)
- Data rows: `3:163` (AK through WY + DC, per screenshots)

Canonical formula ranges:

- State codes: `'Week 7 B - State Tax Brackets'!$B$3:$B$163`
- Lower bounds: `'Week 7 B - State Tax Brackets'!$C$3:$C$163`
- Upper bounds: `'Week 7 B - State Tax Brackets'!$D$3:$D$163`
- Rates: `'Week 7 B - State Tax Brackets'!$E$3:$E$163`
- Full table: `'Week 7 B - State Tax Brackets'!$B$3:$E$163`

Implementation note:

- Preserve row order exactly as shared. Some formulas may depend on ordered bracket rows.

- Existing `src/data/stateTaxData.js` is close but not guaranteed identical to this Week12 table.
- Week12 should use the user-shared state rows/ranges as the source of truth.

### Validation Checkpoints (Spot Checks)

Use these checkpoints to quickly confirm the workbook map is still aligned:

#### `Week 7 B - Assumptions`

- `B1` = `Week 7 B - Assumptions`
- `C2` = `3%`
- `C3` = `7%`
- `C4` = `$24,500`
- `C5` = `$7,500`
- `C11` = `$16,100`
- `C13` = `59.5`

#### `Week 7 B - Fed Ordinary 2026`

- `B2:D2` = `Lower | Upper | Rate`
- `B3:C3:D3` = `$0 | $12,400 | 10%`
- `B9:C9:D9` = `$640,600 | $1,000,000,000,000 | 37%`

#### `Week 7 B - Fed LTCG 2026`

- `B2:D2` = `Lower | Upper | Rate`
- `B3:C3:D3` = `$0 | $49,450 | 0%`
- `B5:C5:D5` = `$545,500 | $1,000,000,000,000 | 20%`

#### `Week 7 B - State Tax Brackets`

- Header: `B2:E2` = `State | Lower | Upper | Rate`
- First data row: `B3:E3` = `AK | $0 | $1,000,000,000,000 | 0.00%`
- Next rows: `B4:E4` = `AL | $0 | $500 | 2.00%`; `B5:E5` = `AL | $500 | $3,000 | 4.00%`
- Last data row: `B163:E163` = `WY | $0 | $1,000,000,000,000 | 0.00%`

---

## Workflow Notes

When more formula batches are provided, append them below in numbered sections:

- Batch 2: Sheet cell formulas / flow
- Batch 3: Retirement-to-goal bridge logic
- Batch 4: Chart series definitions
- Batch 5: Edge cases and validation rules

---

## Batch 2 - `Week 7 B - Projection Engine` (Inferred Pre-Formula Map)

Source: user-shared screenshot + tabular export for Year `0..59` (ages `22..81`).

### Sheet Layout (A1)

Assumed from screenshot row/column labels:

- Sheet name: `Week 7 B - Projection Engine`
- Title: `B1`
- Header row: `B2:R2`
- Data rows: `3:62` (Year 0 in row 3 through Year 59 in row 62)

Column map:

- `B`: Year #
- `C`: Age
- `D`: Salary (nominal)
- `E`: 401k Limit
- `F`: IRA Limit
- `G`: 401k Contrib
- `H`: IRA Contrib
- `I`: Broker Contrib
- `J`: Employer Match
- `K`: Trad Balance
- `L`: Roth Balance
- `M`: Broker Balance
- `N`: Broker Basis (cum contrib)
- `O`: RMD
- `P`: YearsToRetire (helper)
- `Q`: `43` (helper constant shown in header area)
- `R`: Trad Balance (pre-RMD)

### Inferred Logic (from values)

#### 1) Time axis

- `Year #` increments by 1 from 0 to 59.
- `Age` starts at 22 and increments with year.

#### 2) Salary and limits

- `Salary (nominal)` grows by `4%` YoY in sample (`3% CPI + 1% extra raise` from user inputs).
- `401k Limit` grows by CPI (`3%`) from 24,500.
- `IRA Limit` grows by CPI (`3%`) from 7,500.

#### 3) Contributions

- `401k Contrib` = `% of 401k limit` (example: 50%).
- `IRA Contrib` = `% of IRA limit` (example: 100%).
- `Broker Contrib` starts at user input (2,000) and grows by nominal broker contribution rate
  (observed `5%` = `3% CPI + 2% user broker growth`).
- `Employer Match` = salary * employer match % (example: 3%).
- Contributions (G/H/I/J) are nonzero through age 65 row, then become 0 at age 66+.

#### 4) Balance evolution (core engine)

Observed formulas are consistent with annual recurrence:

- `Trad pre-RMD` (`R_t`) = `K_(t-1) * (1 + nominalReturn) + G_t + J_t`
- `RMD` (`O_t`) = `IF(Age_t >= RMDStartAge, R_t / divisor(age_t), 0)`
- `Trad Balance` (`K_t`) = `R_t - O_t`

- `Roth Balance` (`L_t`) = `L_(t-1) * (1 + nominalReturn) + H_t`
- `Broker Balance` (`M_t`) = `M_(t-1) * (1 + nominalReturn) + I_t`
- `Broker Basis` (`N_t`) = `N_(t-1) + I_t`

Where nominal return from assumptions is `7%`.

#### 5) RMD divisor behavior

RMD begins at age 73 in sample and matches IRS Uniform Lifetime style divisors:

- 73: 26.5
- 74: 25.5
- 75: 24.6
- 76: 23.7
- 77: 22.9
- 78: 22.0
- 79: 21.1
- 80: 20.2
- 81: 19.4

### Numeric Spot Checks (consistency)

- Year 1 Trad: `17,298 = 0*1.07 + 12,618 + 4,680`
- Year 2 Trad: `36,372 ≈ 17,298*1.07 + 12,996 + 4,867`
- Year 44 (age 66) Trad: `7,149,052 ≈ 6,681,357*1.07` (contribs zero)
- Year 51 (age 73) pre-RMD: `11,479,815.65`; RMD `433,200.59`; post-RMD Trad `11,046,615`
- Broker basis freezes after retirement contributions stop: `300,286` persists.

### Open items to confirm when formulas are shared

- Exact absolute references used in formulas (e.g. assumption cells and named ranges).
- Whether broker balance later applies withdrawals/taxes in this sheet or downstream sheets only.

### Confirmed formula received after initial inference

- Years-to-retire helper formula:
  - `=MAX(0,'Week 7 - The Goal'!$G$12 - 'Week 7 - The Goal'!$G$10)`
  - Interpretation: `RetirementAge - CurrentAge`, floored at zero.
  - This confirms `Week 7 - The Goal`:
    - Current age cell: `G10`
    - Retirement age cell: `G12`

---

## Batch 3 - `Week 7 - The Goal` (Brokerage Account Sheet Map)

Source: user-shared screenshot labeled `Brokerage Account`.

### Sheet Layout (A1)

- Sheet tab/title text cell: `B1` = `Week 7 - The Goal`
- Main header block: visually merged dark-blue title anchored at `B2` (spanning across row 2)
- Prompt/label column: `B`
- User-entry / linked-value column: `G`
- Contribution helper box: column `I` near rows `24:29`
- Auto-result links: `G47:G53` (with row gaps)

### Row-Level Cell Map (with column letters + row numbers)

| Section | Field | Label Cell | Value / Formula Cell | Current Value or Formula |
|---|---|---|---|---|
| Your goal | How much you want to live on each year (after tax, in today's dollars) | `B5` | `G5` | `$80,000` |
| Your goal | Percent of your portfolio you withdraw yearly | `B7` | `G7` | `4%` |
| Your timeline | Your current age | `B10` | `G10` | `22` |
| Your timeline | The age you want to retire | `B12` | `G12` | `65` |
| Your salary and taxes | Annual Pre-Tax Income (Salary before tax, today's dollars) | `B17` | `G17` | `='Week 1 - Budgeting'!E6` |
| Your salary and taxes | Extra raise above inflation | `B19` | `G19` | `1%` |
| Your salary and taxes | State you live in while working | `B21` | `G21` | `TX` |
| Your salary and taxes | State you expect to live in during retirement | `B22` | `G22` | `TX` |
| How you invest each year | % of the 401(k) max limit you invest each year | `B25` | `G25` | `50%` |
| How you invest each year | Employer match on your 401(k) | `B27` | `G27` | `3%` |
| How you invest each year | % of the IRA max limit you invest each year (0 to 1) | `B29` | `G29` | `100%` |
| How you invest each year | Annual brokerage account contribution | `B31` | `G31` | `$2,000` |
| How you invest each year | Annual brokerage contribution growth rate | `B33` | `G33` | `2%` |
| Advanced income | Businesses (takes none of your time) | `B37` | `G37` | `$0` |
| Advanced income | Real estate (rent net of expenses) | `B39` | `G39` | `$0` |
| Advanced income | Notes / IOUs | `B41` | `G41` | `$0` |
| Advanced income | Royalties / Intellectual Property | `B43` | `G43` | `$0` |
| Your results (automatic) | Total retirement income (after tax, in today's dollars) | `B47` | `G47` | `='Week 7 B - Results'!C3` |
| Your results (automatic) | After-tax income from advanced sources | `B48` | `G48` | `='Week 7 B - Results'!C4` |
| Your results (automatic) | Portfolio income | `B49` | `G49` | `='Week 7 B - Results'!C5` |
| Your results (automatic) | Gap vs your goal (positive = extra, negative = shortfall) | `B51` | `G51` | `='Week 7 B - Results'!C6` |
| Your results (automatic) | Retirement portfolio balance | `B53` | `G53` | `='Week 7 B - Results'!C7` |

### Contribution Helper Box (`I` column)

- Box title text appears near `I24`: `This Year's Contributions`
- 401(k) contribution helper formula: `I25 = G25*'Week 7 B - Assumptions'!C4`
- IRA contribution helper formula: `I29 = G29*'Week 7 B - Assumptions'!C5`

### Formula Inputs to Use in Week12 Calculations

Use these cells as canonical inputs from this sheet:

- Target retirement income (after tax): `G5`
- Withdrawal rate: `G7`
- Current age: `G10`
- Retirement age: `G12`
- Annual Pre-Tax Income input: `G17` (linked value from `='Week 1 - Budgeting'!E6`)
- Extra raise above inflation: `G19`
- Working state: `G21`
- Retirement state: `G22`
- 401(k) contribution percent of limit: `G25`
- Employer match percent: `G27`
- IRA contribution percent of limit: `G29`
- Brokerage annual contribution: `G31`
- Brokerage contribution growth rate: `G33`
- Advanced income inputs: `G37`, `G39`, `G41`, `G43`

---

## Batch 4 - `Week 7 B - Results` (Cell Map + Formula Wiring)

Source: user-shared screenshot of `Week 7 B - Results`.

### Sheet Layout (A1)

- Sheet title: `B1` = `Week 7 B - Results`
- Output block used by main tab: rows `3:7`
- Core calculation block: rows `9:27`
- Label column: `B`
- Formula/value column: `C`

### Outputs Used By Main Tab

| Row | Label Cell | Value Cell | Formula |
|---:|---|---|---|
| 3 | `B3` | `C3` | `=C24` |
| 4 | `B4` | `C4` | `=C11` |
| 5 | `B5` | `C5` | `=C23` |
| 6 | `B6` | `C6` | `=C26` |
| 7 | `B7` | `C7` | `=C27` |

### Core Calculation Rows

| Row | Label (`B`) | Formula (`C`) |
|---:|---|---|
| 9 | Years to retirement | `=MAX(0,'Week 7 - The Goal'!$G$12-'Week 7 - The Goal'!$G$10)` |
| 10 | Inflation factor to retirement | `=(1+'Week 7 B - Assumptions'!C2)^C9` |
| 11 | Outside income (today's $) | `='Week 7 - The Goal'!$G$36+'Week 7 - The Goal'!$G$38+'Week 7 - The Goal'!$G$40+'Week 7 - The Goal'!$G$42` |
| 12 | Outside income (nominal at retirement) | `=C11*C10` |
| 13 | Row in projection table at retirement | `=C9+3` |
| 14 | Traditional balance at retirement (nominal) | `=@INDEX('Week 7 B - Projection Engine'!$K:$K,C13)` |
| 15 | Roth balance at retirement (nominal) | `=@INDEX('Week 7 B - Projection Engine'!$L:$L,C13)` |
| 16 | Brokerage balance at retirement (nominal) | `=@INDEX('Week 7 B - Projection Engine'!$M:$M,C13)` |
| 17 | Brokerage cost basis at retirement (nominal) | `=@INDEX('Week 7 B - Projection Engine'!$N:$N,C13)` |
| 18 | Traditional withdrawal (nominal) | `=C14*'Week 7 - The Goal'!$G$7` |
| 19 | Total withdrawals (nominal) | `=(C14+C15+C16)*'Week 7 - The Goal'!$G$7` |
| 20 | Brokerage gains portion of withdrawal (LTCG income, nominal) | `=IF(C16=0,0,MAX(0,(C16-C17)/C16)*(C16*'Week 7 - The Goal'!$G$7))` |
| 21 | Taxes on withdrawals (nominal) | `='Week 7 B - Tax Engine'!C31` |
| 22 | After-tax investment income (nominal) | `=C19-C21` |
| 23 | After-tax investment income (today's $) | `=C22/C10` |
| 24 | Total retirement income after tax (today's $) | `=C11+C23` |
| 25 | Goal (today's $) | `='Week 7 - The Goal'!$G$5` |
| 26 | Gap vs goal (today's $) | `=C24-C25` |
| 27 | Total investment balance at retirement (nominal) | `=C14+C15+C16` |

### Cross-Sheet Dependencies (from this page)

- `Week 7 - The Goal`: `G5`, `G7`, `G10`, `G12`, `G36`, `G38`, `G40`, `G42`
- `Week 7 B - Assumptions`: `C2`
- `Week 7 B - Projection Engine`: columns `K:L:M:N` using row index `C13`
- `Week 7 B - Tax Engine`: `C31`

### Consistency note (resolved)

- `Goal` is the user-entered value in **"How much you want to live on each year (after tax, in today's dollars)"**.
- Canonical cell for this input in formulas: `'Week 7 - The Goal'!$G$5`.

---

## Batch 5 - `Week 7 B - Tax Engine` (Known Formulas Captured)

Source: user screenshot + user-provided long formulas in text.

### Sheet Intent

`Week 7 B - Tax Engine` computes:

- working-year tax baseline (federal + state + payroll),
- retirement-year tax on withdrawals (ordinary + LTCG + state),
- final total taxes used by `Week 7 B - Results!C21` / `C31` pathway.

### Confirmed formulas (verbatim from user)

#### Federal ordinary tax (year 0)

`=SUMPRODUCT((C9>'Week 7 B - Fed Ordinary 2026'!$B$3:$B$9)*((C9>'Week 7 B - Fed Ordinary 2026'!$C$3:$C$9)*('Week 7 B - Fed Ordinary 2026'!$C$3:$C$9-'Week 7 B - Fed Ordinary 2026'!$B$3:$B$9) + (C9<='Week 7 B - Fed Ordinary 2026'!$C$3:$C$9)*(C9-'Week 7 B - Fed Ordinary 2026'!$B$3:$B$9))*'Week 7 B - Fed Ordinary 2026'!$D$3:$D$9)`

#### State tax (working state, year 0)

`=SUMPRODUCT(('Week 7 B - State Tax Brackets'!$B$3:$B$5001=C5)*(C11>'Week 7 B - State Tax Brackets'!$C$3:$C$5001)*((C11>'Week 7 B - State Tax Brackets'!$D$3:$D$5001)*('Week 7 B - State Tax Brackets'!$D$3:$D$5001-'Week 7 B - State Tax Brackets'!$C$3:$C$5001) + (C11<='Week 7 B - State Tax Brackets'!$D$3:$D$5001)*(C11-'Week 7 B - State Tax Brackets'!$C$3:$C$5001))*'Week 7 B - State Tax Brackets'!$E$3:$E$5001)`

#### Federal ordinary tax on ordinary income (retirement-year indexed brackets)

`=SUMPRODUCT((C20>('Week 7 B - Fed Ordinary 2026'!$B$3:$B$9*(1+C4)^C3))*((C20>('Week 7 B - Fed Ordinary 2026'!$C$3:$C$9*(1+C4)^C3))*((('Week 7 B - Fed Ordinary 2026'!$C$3:$C$9*(1+C4)^C3)-('Week 7 B - Fed Ordinary 2026'!$B$3:$B$9*(1+C4)^C3))) + (C20<=('Week 7 B - Fed Ordinary 2026'!$C$3:$C$9*(1+C4)^C3))*(C20-('Week 7 B - Fed Ordinary 2026'!$B$3:$B$9*(1+C4)^C3)))*'Week 7 B - Fed Ordinary 2026'!$D$3:$D$9)`

#### State tax in retirement (retirement state, indexed brackets)

`=SUMPRODUCT(('Week 7 B - State Tax Brackets'!$B$3:$B$5001=C6)*(C28>('Week 7 B - State Tax Brackets'!$C$3:$C$5001*(1+C4)^C3))*((C28>('Week 7 B - State Tax Brackets'!$D$3:$D$5001*(1+C4)^C3))*((('Week 7 B - State Tax Brackets'!$D$3:$D$5001*(1+C4)^C3)-('Week 7 B - State Tax Brackets'!$C$3:$C$5001*(1+C4)^C3))) + (C28<=('Week 7 B - State Tax Brackets'!$D$3:$D$5001*(1+C4)^C3))*(C28-('Week 7 B - State Tax Brackets'!$C$3:$C$5001*(1+C4)^C3)))*'Week 7 B - State Tax Brackets'!$E$3:$E$5001)`

#### Payroll tax (SS + Medicare + addl Medicare, year 0)

`=MIN(C8,'Week 7 B - Assumptions'!$C$7)*'Week 7 B - Assumptions'!$C$6 + C8*'Week 7 B - Assumptions'!$C$8 + MAX(0,C8-'Week 7 B - Assumptions'!$C$10)*'Week 7 B - Assumptions'!$C$9`

### Row map completed from screenshot (column `C`, by row)

Input pulls:

- `C3` = `=MAX(0,'Week 7 - The Goal'!G12 - 'Week 7 - The Goal'!G10)`
- `C4` = `='Week 7 B - Assumptions'!C2`
- `C5` = `='Week 7 - The Goal'!$G$20`
- `C6` = `='Week 7 - The Goal'!$G$22`

Working-year baseline:

- `C8` = `='Week 7 - The Goal'!G16`
- `C9` = `=MAX(0,C8 - 'Week 7 B - Assumptions'!C11)`
- `C10` = *(Federal ordinary tax year 0; long formula captured above)*
- `C11` = `=C9`
- `C12` = *(State tax working state year 0; long formula captured above)*
- `C13` = *(Payroll formula captured above)*
- `C14` = `=C8-(C10+C12+C13)`

Retirement-withdrawal tax block:

- `C16` = `=MAX(0,C19-C17)`  (standard deduction leftover after ordinary applies to LTCG)
- `C17` = `='Week 7 B - Results'!C18`
- `C18` = `='Week 7 B - Results'!C20`
- `C19` = `='Week 7 B - Assumptions'!C11*(1+C4)^C3`
- `C20` = `=MAX(0,C17-C19)`
- `C21` = *(Federal ordinary tax on ordinary income; long indexed-bracket formula captured above)*
- `C22` = `='Week 7 B - Fed LTCG 2026'!C3*(1+C4)^C3`
- `C23` = `='Week 7 B - Fed LTCG 2026'!C4*(1+C4)^C3`
- `C24` = `=MAX(0,MIN(MAX(0,C18-C16),MAX(0,C22-C20)))`
- `C25` = `=MAX(0,MIN(MAX(0,C18-C16)-C24,MAX(0,C23-MAX(C20,C22))))`
- `C26` = `=MAX(0,MAX(0,C18-C16)-C24-C25)`
- `C27` = `=C25*0.15 + C26*0.2`
- `C28` = `=MAX(0,(C17+C18)-C19)`
- `C29` = *(State tax in retirement; long indexed-bracket formula captured above)*
- `C30` = `=C21+C27`
- `C31` = `=C30+C29`

### Dependency notes confirmed by these formulas

- Working state in Tax Engine is referenced from `C5` and currently maps to `'Week 7 - The Goal'!$G$20`.
- Retirement state in Tax Engine is referenced from `C6`.
- Year-to-retirement / indexing uses `C3` and inflation `C4`.
- State bracket formulas intentionally reference broad ranges `B3:E5001` (not tightly bounded to row 163).
