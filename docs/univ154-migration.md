# UNIV154 Financial Literacy Tool — Reference & Working Log

Rice UNIV154 course tool: React/Vite SPA + Supabase backend. Originally built by
Beyza Ispir under her personal accounts; being consolidated onto Rice's own
GitHub/Supabase/Netlify so the course doesn't depend on a former student's
personal accounts.

## 🔴 ACTIVE — pick up here next session

**About to push (2026-08-17, later same day):** two more local commits on
top of the chart-padding one — `ba02a76` (Module 1 income-row alignment,
Module 9 portfolio input-box alignment, Brokerage chart title/axis-border
fix) and a docs commit. See the two matching 2026-08-17 working-log
entries below for detail, especially the Brokerage chart's deliberate
Line-chart-only axis-border exception — don't blanket-revert that to
"no border" thinking it's inconsistent with the Module 3 spec, it's
intentional. Still no authenticated browser credentials in this
environment, so none of today's chart/table changes have been visually
confirmed live; if something looks off, check there first.

**Pushed to `main` / live on Cloudflare Pages (2026-08-17, earlier same day).** The chart
best-practice rollout + the whole 2026-08-14 UI/UX pass (20 commits total,
`5dcdda1`..`c0425f9`) are now deployed — user explicitly said go. Pre-push
sanity check this session: `npm run build` clean, `npm run dev` +
Playwright screenshot of the login page (widened card renders correctly,
zero console errors) — **not** a full per-chart visual pass across all 4
chart files, since that requires an authenticated admin session this
session didn't have credentials for. If a chart looks off live, that's the
first place to check.

**Standing instruction from the user (2026-08-17): check `localhost:5173`
before deploying, going forward.** Default workflow for future sessions:
implement → `npm run build` → `npm run dev` + have the user (or Playwright,
credentials permitting) confirm on localhost → only then push to `main`.
Don't skip straight to a push on a "looks right in the diff" basis.

Two things a future session needs to know before touching this further:
- Two migrations are sitting unapplied — same manual Supabase Dashboard →
  SQL Editor process as always, nothing here auto-applies migrations:
  - `supabase/migrations/20260814000000_add_display_week_number_to_global_week_settings.sql`
    — until run, the admin "Week #" field in Week Access works in the UI
    but silently doesn't persist, falls back to the value derived from
    `weekId`.
  - `supabase/migrations/20260817000000_add_admins_mkemp_mk258.sql` — adds
    `mk258@rice.edu` and `mkemp@bowersockcapital.com` as admins. Until run,
    neither can access admin features (and `AuthContext.jsx`'s
    `isValidEmail` allow-list change that lets mkemp's non-standard domain
    sign in at all is already live, but useless without this row).
- Local dev server workflow for previewing without spending a Cloudflare
  build: `npm run dev` (already wired to live Supabase via `.env.local`),
  then have the user check `http://localhost:5173` themselves, or use
  Playwright MCP screenshots if credentials aren't available in-session.
  This is now the standard "preview before deploy" answer for this repo —
  see the 2026-08-14 login-card entry for precedent.

## Current architecture (as of 2026-08-13)

> **The live site students use is `https://univ154.pages.dev` (Cloudflare Pages). Full stop.**
> Netlify (`riceuniv154.netlify.app`) is a dormant leftover from before the Cloudflare
> switch — still connected to the repo, but not in use and not what anyone should be
> checking or worrying about day to day. If a future session (me or otherwise) starts
> talking about Netlify credits/billing as if it's the active deploy target, that's
> wrong — point back to this line.

| Layer | Where | Notes |
|---|---|---|
| Code | `github.com/riceuniversityuniv-cmyk/univ154` | Fork of `beyzaispiir/univ154`. `riceuniversityuniv-cmyk` has admin/push access. Fork relationship is cosmetic only (GitHub "forked from" label) — no functional impact, not worth detaching (needs a GitHub Support ticket). |
| Hosting (**primary, live**) | Cloudflare Pages → `https://univ154.pages.dev` | Auto-deploys from `main` on push, ~1-2 min build. **This is the URL to give students.** Canonical since 2026-08-13 — see working log entry below for why. |
| Hosting (legacy, dormant, not in use) | Netlify site → `https://riceuniv154.netlify.app` | Still connected and would auto-deploy from `main`, but nobody is pointed at this URL and it doesn't need monitoring. Was paused Aug 13 – Sep 9 2026 due to free-tier credit exhaustion (the reason we moved off it); left connected rather than decommissioned since there's no cost to leaving it. |
| Backend | Supabase project ref `zyznmhbtpniluhkyowbb` (`https://zyznmhbtpniluhkyowbb.supabase.co`) | The live, correct backend. Fresh project created during the migration — **not** the same project the app originally used. Shared by both hosting targets above — switching hosts doesn't touch this. |
| Local dev | `.env.local` (gitignored) with `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` pointed at the project above | Anon/publishable key extracted from the live bundle (`sb_publishable_...` format) since it's safe for client-side use. |

### Deployment limits (Cloudflare Pages — the one that matters now)
- **500 builds/month**, 1 concurrent build, unlimited bandwidth/requests — flat cap,
  no credit-per-deploy spend-down like Netlify had. Normal push cadence for this
  project won't come close.
- Check current usage: `dash.cloudflare.com` → account → **Workers & Pages** → the
  `univ154` Pages project → **Deployments** tab (each row is one build) or the
  account-level Usage/Overview page for the month-to-date build count.
- Netlify's old 300-credits/month (~15 credits/deploy) limit is **not relevant**
  anymore — it only applied to the dormant Netlify host above, not to Cloudflare.

### Dead legacy site — do not spend time on this
`https://univ154.netlify.app` (the URL in this repo's own README) still resolves and
serves a page, but its Supabase backend, project ref `ssuheqfhbcuekkddomko`, **no
longer exists** (`ERR_NAME_NOT_RESOLVED` / DNS `NXDOMAIN` — fully deleted, not just
paused). Every backend-dependent action on that site (login, data load) is broken.
It's presumably still under Beyza's Netlify account. Not something we control;
recommend it eventually gets taken down or redirected to `riceuniv154.netlify.app`
so nobody lands on it by following the README/old bookmarks.

## File map

```
src/
  App.jsx                    Route table. Wraps /dashboard/* in ProtectedRoute (auth gate).
  components/
    Login.jsx, SignUp.jsx, SignUpSuccess.jsx, UpdatePassword.jsx   Auth screens
    Dashboard.jsx             Authenticated shell / nav
    WeekAccessAdmin.jsx       Admin UI for per-week access control (rendered at
                               /dashboard/admin/week-access, one of AdminPanel.jsx's tabs)
    AdminSettingsPanel.jsx    Admin UI for managing admins themselves (add/remove
                               admins, transfer master admin) -- rendered at
                               /dashboard/admin/manage -- see gating rules below
    AssumptionsAdmin.jsx      Admin UI for the legislative/financial constants
                               (FICA, federal/LTCG/state/NYC brackets, RMD table,
                               401k/IRA limits, CPI/portfolio-return assumptions)
                               every tax calculator reads via useAssumptions() --
                               rendered at /dashboard/admin/assumptions
    AdminPanel.jsx            Tab shell for /dashboard/admin/* (Week Access / Manage
                               Admins / Assumptions), <Outlet/> for the three above
    Week1Budgeting.jsx, Week1FederalTax.jsx, Week1StateTax.jsx,
    Week1Summary.jsx, Week2Savings.jsx, Week3CreditCard.jsx,
    Week3CreditCardWrapper.jsx, Week4.jsx, Week5.jsx,
    Week6Retirement.jsx, Week7.jsx, Week9.jsx, Week10.jsx,
    Week11.jsx, Week12.jsx    Week modules (note: not all weeks 1-12 are wired
                               into App.jsx's routes — check there before assuming
                               a week is reachable). Week1FederalTax/Week1StateTax/
                               Week4/Week6Retirement/Week9/Week12 all read tax/FICA/
                               RMD/LTCG figures from utils/taxEngine.js +
                               useAssumptions() (see Database schema and 2026-08-12
                               working-log entry below) -- no more per-file hardcoded
                               bracket tables.
    BudgetForm.jsx, SavingsForm.jsx, ExcelWorkshop.jsx,
    ModuleView.jsx, LectureNotes.jsx   Shared building blocks
    pages/Overview.jsx, pages/Analytics.jsx, pages/BudgetPlanner.jsx
    sidebar-variants/Option3_Minimalist.jsx   Design exploration, not routed
  contexts/
    AuthContext.jsx           Supabase auth session, signIn/signUp/signInWithGoogle/
                               signOut/resetPassword, isAdmin (via utils/adminEmails)
    BudgetContext.jsx         Budget calculation state; `financialCalculations` /
                               `summaryCalculations` both delegate to
                               utils/taxEngine.js's calculateFullTax(), fed by
                               useAssumptions() -- no local tax logic of its own
                               anymore (see 2026-08-12 working-log entry)
    WeekAccessContext.jsx     Per-week unlock state (separate from auth — see below)
    AssumptionsContext.jsx    Legislative/financial constants (assumptions_scalars /
                               assumptions_brackets / assumptions_rmd_divisors),
                               mirrors WeekAccessContext.jsx's pattern -- fetch on
                               mount, admin-gated mutators, falls back to
                               config/assumptionsDefaults.js if the fetch fails.
                               Wraps WeekAccessProvider in Dashboard.jsx.
  lib/
    supabase.js, supabaseClient.js   Two near-identical Supabase client modules;
                               both read VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.
                               Harmless duplication, not worth merging unless touching
                               this area anyway.
  utils/
    adminApi.js                 Supabase calls for the `admins` roles table (see
                                 gating rules below) -- replaced adminEmails.js
    assumptionsApi.js           Supabase calls for the assumptions_* tables (see
                                 Database schema below)
    taxEngine.js                Single shared tax/FICA/RMD/LTCG calculation engine --
                                 pure functions taking an `assumptions` object, no
                                 hardcoded constants. Replaces taxCalculator.js
                                 (deleted) and the ~7 other independently-duplicated
                                 tax engines that used to live in BudgetContext.jsx,
                                 Week1FederalTax.jsx, Week1StateTax.jsx, Week4.jsx,
                                 Week6Retirement.jsx, Week9.jsx, Week12.jsx.
  config/
    assumptionsDefaults.js      Bundled fallback snapshot of the assumptions_* table
                                 contents (same values, extracted from the same Excel
                                 workbook the DB was seeded from) -- used by
                                 AssumptionsContext.jsx before first fetch / on error.
supabase/migrations/           Applied in order shown by filename timestamp
email-templates/                Supabase auth email HTML (confirmation, magic-link,
                                 reset-password, change-email)
```

`taxCalculator.js`, `data/taxData.js`, `data/stateTaxData.js`, `CalculationDetails.jsx`,
`configs/week1Config.js`, `configs/week2Config.js` were deleted 2026-08-12 (dead code /
superseded by `taxEngine.js` + the Assumptions table -- see working log).

## Database schema (Supabase, `supabase/migrations/`)

- `excel_files` — user-uploaded Excel files/content (JSONB), keyed by `user_email`
- `registered_users` — every signed-up user; populated via an `on_auth_user_created`
  trigger on `auth.users` (see `20250602121000_create_registered_users.sql` and the
  `handle_new_user()` function)
- `week_access` — per-user, per-week access override (`is_available`, `release_date`).
  **Currently vestigial**: seeded by a trigger on every signup (week-1 row) but no UI
  reads from it — `WeekAccessContext` only ever queries `global_week_settings`. Looks
  like a per-student-override feature that was scaffolded but never wired up.
- `global_week_settings` — global per-week availability switch (`is_globally_available`,
  `release_date`) — this is the table `WeekAccessAdmin.jsx` actually reads/writes
- `admins` — admin roles table (`email` PK, `role` ∈ `admin`/`master_admin`,
  `granted_by`, `created_at`). Added 2026-08-11, replaces the old hardcoded-email-array
  pattern (see gating rules below). A partial unique index on `role` where
  `role = 'master_admin'` enforces exactly one master admin at the DB level.
- RLS is enabled on all five tables. Admin-only policies on `week_access`,
  `global_week_settings`, and `registered_users` call `is_admin(auth.jwt() ->> 'email')`
  — a `SECURITY DEFINER` helper function that checks the `admins` table (see gating
  rules below). `admins` itself has its own SELECT/INSERT/DELETE policies (no UPDATE
  policy — role changes only happen via the `transfer_master_admin()` RPC).
- `assumptions_scalars` (`key` PK, `value` NUMERIC, `label`, `category`, `updated_at`,
  `updated_by`), `assumptions_brackets` (`id` PK, `table_name` ∈
  `federal_ordinary`/`federal_ltcg`/`state`/`nyc`, `group_key` = state code or NULL,
  `sort_order`, `lower`, `upper`, `rate`), `assumptions_rmd_divisors` (`age` PK,
  `divisor`). Added 2026-08-12 (`20260812000000_create_assumptions.sql`) — the
  legislative/financial constants every tax calculator reads via
  `src/utils/taxEngine.js` + `useAssumptions()`, editable at
  `/dashboard/admin/assumptions`. Same RLS shape as `global_week_settings`: public
  `SELECT USING (true)` (every calculator needs to read these, not just admins) +
  `is_admin(auth.jwt() ->> 'email')`-gated `ALL` for writes. Seed data was extracted
  directly from the live master Excel workbook's `Assumptions` tab (openpyxl, not
  re-typed) — see 2026-08-12 working-log entry for the exact extraction/verification
  process. `upper = 1000000000000` represents "no upper bound" (matches the
  `LARGE_NUMBER` convention `Week12.jsx` already used pre-consolidation).

## Non-obvious gating rules

- **Auth guard on `/dashboard/*`**: `App.jsx` wraps the dashboard route tree in
  `ProtectedRoute` (redirects to `/` if no session). **This was commented out** ("Temporarily
  commented out for development") before 2026-08-11 — anyone could reach every week
  module without signing in. Restored 2026-08-11 (commit `1a5bb5b`). If you ever see it
  commented out again, that's a real access-control regression, not a stylistic choice.
- **Two independent gates on module content**: (1) `ProtectedRoute` — must be signed in
  at all to reach `/dashboard`; (2) `week_access` / `global_week_settings` — per-week
  🔒 unlock state shown even to signed-in users, managed via `WeekAccessAdmin.jsx` /
  `WeekAccessContext.jsx`. Don't confuse the two when debugging "I can't get into Week X."
- **Admin status is DB-backed via an `admins` roles table** (as of 2026-08-11,
  replacing the old hardcoded-array + copy-pasted-RLS-literal pattern from 2026-08-10):
  - Table: `admins (email PK, role IN ('admin','master_admin'), granted_by, created_at)`.
  - Two roles: any number of `admin`, exactly **one** `master_admin` (DB-enforced via
    a partial unique index on `role`).
  - Enforcement is RLS, via two `SECURITY DEFINER` helper functions —
    `is_admin(email)` / `is_master_admin(email)` — referenced both by `admins`'s own
    policies and by the pre-existing admin-only policies on `week_access` /
    `global_week_settings` / `registered_users`.
  - **Permissions**: any admin can add a new admin (INSERT, always as plain `admin` —
    no INSERT path to `master_admin`, closing off privilege escalation) and can remove
    *themselves*. Only the master admin can remove someone *else's* admin access
    (DELETE). Master status moves via `transfer_master_admin(new_email)`, a
    `SECURITY DEFINER` RPC — the only path that can ever set `role = 'master_admin'` —
    which demotes the caller to `admin` in the same transaction, and can target *any*
    registered user (not just existing admins).
  - **In-app UI**: `src/components/AdminSettingsPanel.jsx` at
    `/dashboard/admin/settings` — add/remove admins, transfer master admin. No more
    hand-editing code or shipping a SQL migration to change who's an admin.
  - `AuthContext.jsx`'s `checkAdminStatus` is now `async` (queries `admins` instead of
    a sync array lookup) and exposes both `isAdmin` and `isMasterAdmin`, plus
    `refreshAdminStatus()` for the Admin Settings page to call after a self-affecting
    change (step down / transfer master away from self) so *your own* session updates
    immediately rather than waiting for the next token refresh. Revocation of *someone
    else's* admin access is eventual-consistency (reflected next `TOKEN_REFRESHED` /
    next login, up to ~1hr) by deliberate choice — RLS always rejects the actual DB
    write immediately regardless of what the revoked user's stale client-side `isAdmin`
    state still shows, so this is a UI-lag tradeoff, not a security gap.
  - Current roles: `km108@rice.edu` = master admin, `riceuniversityuniv@gmail.com` =
    admin (demoted from master when km108 was made master — the prior sole admin
    was kept on as a regular admin rather than dropped).
- **Email allowlist for signup/login**: `@rice.edu`, `@alumni.rice.edu`, `@gmail.com`,
  `@yahoo.com` only (`isValidEmail` in `AuthContext.jsx`); anything else is signed out
  immediately after a successful Supabase auth.
- **Google OAuth is provider-gated in Supabase, not just Google Cloud Console**: Supabase
  Auth → Providers → Google has its own on/off toggle plus Client ID/Secret fields,
  independent of whatever's registered in Google Cloud Console. If it's off (or the
  Client ID/Secret fields are empty), Supabase rejects the request with
  `400 {"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}`
  **before the browser ever reaches Google** — a very fast way to confirm this specific
  cause vs. a redirect-URI mismatch (which would fail only after Google's consent screen).

## § Working log (append-only)

### 2026-08-17 — Module 1 income-row alignment, Module 9 input-box alignment, Brokerage chart title/axis fix
User follow-up after the chart-padding pass above: three more UI fixes.

- **Module 1 (`BudgetForm.jsx`)**: "Monthly Income (After Taxes & Pre-Tax
  Expense Items)" row's two currency cells had no `textAlign` override
  (base `styles.td` doesn't set one, so they rendered left-aligned) —
  added `textAlign: 'right'` to match every other numeric cell in the
  table (`styles.input`/`styles.readOnly` are both `textAlign: 'right'`
  elsewhere in this same file).
- **Module 9 portfolio allocation table (`Week9.jsx`)**: the four input
  columns (Annual Return, Scenario 1-3 Weight) looked center-aligned even
  though `styles.inputYellow` already sets `textAlign: 'right'` — the
  *text inside* each input was right-aligned, but the fixed-120px-wide
  input box was centered inside its (wider) `<td>` because the base
  `styles.td` is `textAlign: 'center'`. Right-aligned the wrapping `<td>`
  on all 16 input cells (4 rows × 4 columns) so the box itself sits at the
  column's right edge, not just the digits inside it. **Lesson: "input
  looks centered" can mean either the text-within-input or the
  box-within-cell is centered — they're independent and this file had the
  first one right and the second one wrong.**
- **Module 9 Brokerage Account Balance chart**: user reported the chart
  title looked wrong and there were no visible axis lines.
  - Title: this chart never got the `<h3>` title treatment every other
    chart in the tool uses — it was relying on Chart.js's in-canvas
    `plugins.title` (16px) instead. Added a real `<h3>` above the chart
    (bumped the file's unused `styles.chartTitle` from 16px→20px to match
    house spec, reused it) and turned the in-canvas title off.
  - Axis lines: this is a `Line` chart, the only one outside
    `Week12.jsx`'s investments chart, and (per the Module 3 spec) had
    `border: { display: false }` on both axes like everything else. On a
    `Bar` chart the bars' own baseline visually anchors the axis even with
    no border; a `Line` chart has no such baseline, so with the border off
    it read as data floating with no reference frame. Turned the axis
    border back on (`display: true, color: '#000000', width: 1`) for this
    chart specifically — **a deliberate, chart-type-specific exception to
    the house "no axis border" rule, not a reversal of it for Bar charts.**
    If another Line chart shows up in the tool, give it the same
    treatment; don't blanket-apply this to Bar charts.
- Verified: `npm run build` clean, `npx eslint` on both touched files
  shows only pre-existing unrelated `no-unused-vars` errors. Still no
  authenticated browser session available in this environment.

### 2026-08-17 — Charts: top-of-canvas padding + finished the leftover font-shrink rollout
User asked for two things: (1) Module 3's charts had their top y-axis label
sitting too close to the top edge of the canvas, and (2) apply the same
axis-line/chart-title rule to every other module's charts for consistency.

- **Root cause of (1)**: none of the Chart.js `options` blocks set
  `layout.padding.top` (or set it too small, in Week9's case — `top: 8`),
  so Chart.js draws the top gridline/tick flush against the canvas edge
  with no headroom.
- **Fix**: added/raised `layout: { padding: { top: 20 } }` on every
  Chart.js chart in the tool — all 4 inline+modal blocks in
  `Week3CreditCard.jsx` (Module 3), `Week5.jsx`'s shared
  `monthlyChartOptions` (covers both Monthly/Bi-Weekly since
  `biWeeklyChartOptions` spreads it), `Week9.jsx` (bumped existing `top: 8`
  → `20`), and both `Week12.jsx` blocks (`sharedBarOptions`,
  `lineOptions`).
- **Bug caught along the way**: `Week12.jsx`'s `sharedBarOptions` had two
  separate `layout` keys in the same object literal (a leftover duplicate)
  — JS object literals silently let the second key win, so my first
  `layout.padding.top` insertion was being overwritten by the pre-existing
  second `layout: { padding: {..., top: 6} }` a few lines down. Build
  compiled clean either way (not a syntax error) — only caught by grepping
  for a second `layout:` in the same file after the fact. **Lesson: after
  inserting a new key into an object literal via sed/line-number edits,
  grep the whole object for a pre-existing key of the same name — duplicate
  object keys are a silent bug, not a lint/build error.**
- **Found an already-in-progress, uncommitted rollout while investigating**:
  `Week3CreditCard.jsx`, `Week9.jsx`, and `Week12.jsx` all had matching
  uncommitted edits already sitting in the working tree shrinking the
  Module 3 chart-spec fonts (legend 18→15, axis titles 22→17, ticks 19→16)
  — consistent across all three files, clearly a prior session's
  in-progress work that was never committed. `Week5.jsx` had the same edit
  already committed (from the previous turn's Module 9 table-alignment fix,
  where it rode along bundled into that commit). Treated this as the real,
  current house spec (not the older 18/22/19 one still written in this
  doc's spec block above) since it was already fully self-consistent across
  every file that had it — finished it out by committing it alongside the
  padding fix rather than reverting it. **The spec block further down this
  doc (font sizes 18/22/19) is now stale** — the live sizes are 15/17/16;
  not rewriting the historical entry, just flagging it here so a future
  session doesn't copy the outdated numbers.
- **Left alone**: `Week4.jsx` (no charts — its pending diff is an unrelated
  `formatCurrency(...)` → `formatCurrency(..., { decimals: 0 })` cleanup,
  not touched) and the same unrelated decimals cleanup inside `Week9.jsx`'s
  scenario-summary table (separable by hunk, left unstaged). Also left
  `Week6Retirement.jsx` alone — its charts are hand-rolled SVG from a
  separate prior migration pass, out of scope for a Chart.js-options fix.
- Verified: `npm run build` clean, `npx eslint` on all 4 touched files
  shows only pre-existing unrelated `no-unused-vars` errors (not on lines
  touched). No authenticated browser check (still no login credentials in
  this environment — see the 2026-08-17 entry below and several earlier
  ones for the same recurring limitation).

### 2026-08-17 — Pushed the whole local backlog live + added two admins
User asked to push all local progress to the live site, and separately
established a standing workflow rule: check `localhost:5173` before
deploying, going forward (not just for in-progress feature work — for any
future push).

- **Deploy**: 20 commits (`5dcdda1`..`c0425f9`, everything from the
  2026-08-14 UI/UX pass through the 2026-08-15 chart rollout plus this
  session's admin commit) pushed to `main`. `npm run build` clean;
  `npm run dev` + Playwright screenshot of the login page confirmed no
  console errors and the widened card rendered correctly before pushing.
  Did not do a full authenticated per-chart visual pass (no admin
  credentials available in-session) — see 🔴 ACTIVE for what to check if
  something looks off live.
- **New admins**: added `mk258@rice.edu` and `mkemp@bowersockcapital.com`
  via `supabase/migrations/20260817000000_add_admins_mkemp_mk258.sql`
  (not yet applied — manual SQL Editor step, same as always).
  `mkemp@bowersockcapital.com`'s domain isn't in `AuthContext.jsx`'s
  sign-in allow-list (`@rice.edu`/`@alumni.rice.edu`/`@gmail.com`/
  `@yahoo.com`) — asked the user how to handle it rather than guessing;
  they chose a one-off exact-address exception
  (`ALLOWED_EXACT_EMAILS`) over opening the whole
  `@bowersockcapital.com` domain. `mk258@rice.edu` needed no allow-list
  change.

### 2026-08-15 — Chart best-practice spec rolled out to every remaining chart (Week5, Week6Retirement, Week9, Week12)
Applied the spec from the entry directly below to every chart in the tool
that wasn't already done in Module 3. One commit per file, `npm run build`
clean after each. **Week7.jsx has no charts** (checked — only decorative
inline `<svg>` icons), so it's out of scope, not skipped.

- **Week5.jsx** (`8cfc49a`) — 2 Chart.js `Bar` charts (Monthly / Bi-Weekly
  Payment, side-by-side 2-up like Module 3's User Input/Minimum Payment
  pair — left that layout alone, didn't force 100% width). Legend/axis
  fonts, `border: {display:false}` on both scales, card border → none,
  chart title 14→20px, container 420→520px. Y-axis `stepSize` couldn't be
  a fixed dollar figure like Module 3's (loan amount is a free-text user
  input, so the payment range varies a lot) — used `maxTicksLimit: 6`
  instead so Chart.js auto-picks round numbers at any scale.
- **Week9.jsx** (`2568de6`) — 1 Chart.js `Line` chart (Brokerage Account
  Balance). Already had `stepSize: chartMaxY/5` (someone had independently
  landed on the same "~5 labels" rule) and `grid:{display:false}` — just
  needed `border:{display:false}` added, fonts bumped to spec, and the
  `chartWrapper` div's border removed (that div is chart-only, unlike the
  broader `subCard` class it sits inside, which is reused for non-chart
  sections and was deliberately left alone). Container 420→520px; bumped
  the outer card's `minHeight` 560→660px so the taller chart doesn't get
  clipped.
- **Week12.jsx** (`981ffc9`) — 1 `Bar` (money-source breakdown) + 1 `Line`
  (investments over time), both in the Goal tab. Both already use a custom
  HTML legend row under the chart instead of Chart.js's built-in legend
  (colored-dot `<span>`s) — left that as-is, didn't force Chart.js legend
  styling onto a chart that intentionally doesn't show one. Didn't invent
  new axis titles where none existed (the Bar chart has never had axis
  titles) — only bumped what was already there: tick font 11→19px, axis
  border off, existing "Age" title on the Line chart 12→22px, card border
  → none, chart title 16→20px, both containers 360/400→520px.
- **Week6Retirement.jsx** (`8976241`) — hand-rolled SVG, not Chart.js (see
  spec note below on why). 8 structurally-identical chart blocks
  (Traditional/Roth × 401k/IRA × Balance/Withdrawals). Verified every
  target substring's occurrence count matched 8 (or 16/24 for
  per-chart-×-2-or-3 elements) with a Python script before doing a
  count-checked global replace — safer than 8 manual edits given the
  file's 9,700 lines. Changes: axis tick `fontSize` 12→19, legend label
  text 11px `#666` → 18px `#000000` weight 600, `chartHeight` 400→520,
  `yAxisLabelWidth` 100→130 (bigger tick font needs a wider label gutter
  or the $ figures clip), wrapper `border` → none (was two different
  values pre-existing across the 8 — `rgba(229,231,235,0.8)` on 2 charts,
  `#e9ecef` on 6 — both replaced), wrapper `minHeight` 480px/350px → 620px
  uniformly, chart title 14-16px → 20px. Gridlines were already off (prior
  session's work per the code comment "horizontal grid lines removed") and
  there was never an axis border line drawn in the SVG, so those two parts
  of the spec were already satisfied here.

**Not done this session**: visual confirmation on `localhost:5173` — see
🔴 ACTIVE above.

### 2026-08-15 — Module 3 chart best practices established (Chart.js spec); NOT YET rolled out to other modules
Iterative live-preview session (7 rounds against `localhost:5173`) landed on a
final Chart.js v4 (`react-chartjs-2` `Bar`) configuration for
`Week3CreditCard.jsx`'s three inline charts ("User Input Payment",
"Minimum Payment", "General Loan" — all "Interest vs. Principal") and their
shared "click to expand" modal. **This is now the house style for every
`Bar`/Chart.js chart in the tool** — the explicit next step (see 🔴 ACTIVE
above) is applying it to Week5/Week6Retirement/Week7/Week9/Week12. All
commits below are local-only on `main`, not pushed: `c667507`, `18a578d`,
`0e58b3f`, `a3d2a60`, `74c38a0`, `d0d185d`, `6cb0fcd`.

**Why this took 7 rounds (read before repeating the mistakes):**
- Chart.js v4 has **three independent visual layers per axis** that all look
  like "a border/gridline" to a non-dev eye but are configured completely
  separately: `scales.<axis>.grid` (gridlines across the plot), `scales.<axis>.border`
  (the axis line itself, a v3.7+/v4-only property), and `ticks` (the label
  text). On top of that, this codebase ALSO has a plain CSS `border` on the
  `chartContainer` wrapper `<div>` (a real box border around the whole
  canvas, unrelated to Chart.js) — four things total that can each
  independently produce "there's a border/line I don't want." When a user
  says "remove the border," check all four before declaring it fixed.
- `onMouseEnter`/`onMouseLeave` handlers in this file directly mutate
  `e.currentTarget.style.border` — editing a card's *base* style object is
  not enough if the hover handlers re-apply an old border value on
  mouse-leave (which can end up being the resting state). **Grep for
  `e.currentTarget.style.border` on any chart card you touch and fix all
  matching occurrences, not just the base style.**
- Per-chart `<Bar options={...}>` blocks are **NOT** shared objects in this
  file — three structurally-identical inline charts + one modal chart are
  four independently-coded option blocks. A fix to one does not propagate;
  budget to edit each one (this is exactly what makes a multi-file rollout
  mechanical but not a single find/replace).
- Small incremental font bumps (13→14→16px) read as "no visible change" to
  the user even though they were real changes. Jump straight to the final
  spec sizes below rather than nudging by 1-2px at a time.

**The spec** (apply to every `<Bar options={...}>` block, inline AND any
expand/modal view):
```js
plugins: {
  legend: {
    position: 'bottom',
    labels: {
      color: '#000000',
      font: { size: 18, weight: '600' },
      padding: 20,
      usePointStyle: true,
      pointStyle: 'rectRounded',
      boxWidth: 20,
      boxHeight: 20
    },
  },
  // title/tooltip: unchanged from whatever the file already had
},
scales: {
  x: {
    grid: { display: false },
    border: { display: false },
    title: {
      display: true, text: '<axis label>', color: '#000000',
      font: { size: 22, weight: '700' },
      padding: { top: 15 }              // modal uses { top: 15, bottom: 15 }
    },
    ticks: {
      color: '#000000',
      font: { size: 19, weight: '500' }
    }
  },
  y: {
    grid: { display: false },
    border: { display: false },
    beginAtZero: true,
    title: {
      display: true, text: '<axis label>', color: '#000000',
      font: { size: 22, weight: '700' },
      padding: { bottom: 15 }           // modal uses { top: 15, bottom: 15 }
    },
    ticks: {
      color: '#000000',
      stepSize: 100,                    // tune per chart's actual value range —
                                         // goal is ~4-5 labels on the y-axis, not
                                         // literally always $100 (Module 3's charts
                                         // happen to live in the $0-500 range)
      font: { size: 19, weight: '500' },
      callback: function(value) { return formatCurrency(value, { decimals: 0 }); }
    }
  }
}
```
Plus, at the CSS/layout level (not Chart.js options):
- Chart card wrapper width: match the full-width banner above it (`100%`,
  not a `calc(50% - 8px)` two-up layout) — this was Module 3's specific
  "match the General Loans banner width" ask; re-derive the right width per
  module rather than copying `100%` blindly if a module's layout differs.
- Chart card title (`<h3>`) font size: `20px` (was `15px`).
- Chart container height: `520px` (was `420px`) — both the shared
  container style's `height` AND any inline `style={{ height: '...px' }}`
  on the same wrapper need bumping together, they're separate properties in
  this file.
- Any CSS `border` on the chart's outer container div (distinct from Chart.js's
  `scales.*.border` above): `none`.
- Any `onMouseEnter`/`onMouseLeave` handlers on that same wrapper: also set
  their `style.border` mutations to `'none'`.

**Verification pattern used each round**: `npm run build` (clean every
time), then ask the user to hard-refresh `localhost:5173` and confirm
visually — do NOT declare a chart "fixed" from reading the diff alone, this
file's chart cards have enough overlapping style sources (base style +
hover handlers + Chart.js options + CSS wrapper) that a change can compile
clean and still not be visible for a reason not yet found.

**Rollout status**: done as of 2026-08-15 — see the "Chart best-practice
spec rolled out" working-log entry directly above this one for what
happened in each file (Week5, Week9, Week12, Week6Retirement's SVG
translation; Week7 has no charts). The notes below are kept for historical
context on the open questions that entry resolved:
- `Week6Retirement.jsx`'s charts are hand-rolled SVG, not Chart.js `Bar`
  components (per the 2026-08-14 "chart elegance pass" entry) — this
  spec's Chart.js `options` block doesn't directly apply there; translated
  to the SVG code's equivalent knobs (see entry above).
- Whether every other module's y-axis should literally use `stepSize: 100`
  or a value tuned to that chart's own range wasn't asked — used the
  "~4-5 labels" rule of thumb per chart's actual range instead of a
  hardcoded 100 (see entry above for what each file ended up using).

### 2026-08-14 — Big UI/UX + spacing pass across ~17 files (three rounds, all local-only, not pushed)
User did a full pass through the live tool and flagged a large batch of
layout/polish/correctness issues, then two further refinement rounds after
reviewing locally each time. Every round was implemented, verified with
`npm run build` (clean each time) + `npm run lint` (diffed against a
git-stash baseline of ~163 pre-existing errors to confirm zero new
regressions), and previewed by the user on `npm run dev` at
`localhost:5173` before deciding whether to continue — **nothing from any
of the three rounds has been pushed to `main` or deployed.** Committed
locally only, per the user's explicit "save but don't deploy, I'm not done
yet" request.

**Round 1** (~15 items): sticky Budget Status banner in Module 1; widened
sidebar 320px→360px so "Real Estate & Homeownership" doesn't clip; new
`src/styles/tableHeaderStyle.js` shared soft-tint header style, replacing
each file's own solid-navy "blue box" `th`/`sectionTitle` (BudgetForm,
Week1FederalTax, Week1Summary, Week1StateTax, Week6Retirement, Week7,
Week9, WeekAccessAdmin, AdminSettingsPanel); new editable "Week #" field in
Week Access admin (separate from sidebar Order), backed by a new
`display_week_number` column — see the ACTIVE section above, migration not
yet applied; Manage Admins role badges redesigned to text + left accent
bar (bar later removed in round 2, kept color-coded text); fixed Module 3
(Week3CreditCard) default credit-card payment starting below the computed
minimum — was hardcoded `'290'`, now lazily derived from
`computeMinimumPayment` against the same default balance/rate so it can
never start below minimum again; chart elegance pass on Week5 (Real
Estate) and Week6Retirement's hand-rolled SVG charts; Retirement Planning
summary-table border cleanup + split into a tab bar (Summary / Traditional
401k / Roth 401k / Traditional IRA / Roth IRA) — one 9,600-line component,
kept as a single file with `activeTab` state gating each section rather
than splitting into separate components, to avoid prop-drilling shared
calculations; global number-input spinner-arrow removal via `index.css`;
Goal tab (Week12) goal-emphasis card + "when you reach it" timeline
sentence, results shown as whole dollars; removed the copy-pasted "Note:
Adjust Week 1 Budget based on this week's insights" boilerplate (found
duplicated across 5 files, not just Module 8 — removed from all 5); Module
1 table Total $ right-aligned, "% of Monthly Income" column widened;
Real Estate module emoji removal + banner text fixed to "Real Estate &
Homeownership" (was inconsistently "& Investment Planning" in one spot).

**Round 2** (refinements after local review caught things round 1 missed):
Order input in Week Access admin made yellow to match the input
convention (was still plain gray); admin role badges lost the left accent
bar per user feedback, kept only the color-coded text; AssumptionsAdmin
tab brought up to the yellow-input/soft-header convention (missed
entirely in round 1); "Clear All" button added to Module 1 budgeting
table; charts resized bigger across the board (Week3CreditCard chart
containers 200px→300px height; Week6Retirement SVG charts widened
500→760/250→400 with larger fonts; Goal tab chart containers ~270px→360px
and 305px→400px); Module 4 (Week1FederalTax/Week1StateTax/Week1Summary)
cents removed from all dollar figures, plus two header styles round 1 had
missed (Week1FederalTax's `sectionTitle`, Week1StateTax's separate NYC
bracket table); Retirement Planning Summary tab's cramped 12px gray
per-account description text replaced with a real "Account Types at a
Glance" comparison table, plus a hover tooltip on the word "Deferral" in
the Monthly Deferral Calculator title (styled like Week7's tooltip but
gold text, no "Recommendation" content); Module 8 (Week7 Insurance) lost
its "Recommendation" row entirely, gained comma-formatted dollar inputs
via the existing-but-underused `formatNumberForInput` helper, and lost
cents in the Total Annual Cost Calculation section; Goal tab (Week12)
cents removed from salary field + chart axis ticks; Module 9 (Week5 Real
Estate) cents removed everywhere **except** the amortization tables, which
keep full precision by design.

**Round 3** (negative-space/spacing pass, prompted by a screenshot showing
large empty gutters around Module 1): `Dashboard.jsx`'s outer content
wrapper widened `max-w-[1400px]` → `max-w-[1760px]`; the `maxWidth:
'1200px'` page-container cap that 11 files each defined independently
(BudgetForm, SavingsForm, Week3CreditCard, Week4, Week5, Week6Retirement,
Week7, Week9, Week10, Week11, Week12) bumped consistently to `1520px`
(all occurrences per file, including secondary banner/button-row/table
maxWidths in BudgetForm, so nothing misaligns within a page); Module 1's
"User Inputted Data" card widened `450px`→`680px` to fill the void that
used to sit empty beside it (its rows already use `justifyContent:
space-between`, so this needed no other markup changes). Two `1100px`
maxWidths inside Week6Retirement (the new Account Types table and the
Retirement Account Budgeting table) were deliberately left alone — those
were purpose-tuned narrower in round 2, not instances of the generic
1200px page cap. Sidebar width (360px, set in round 1) intentionally left
untouched per the user's request.

- Design decisions during round 1 were confirmed via `AskUserQuestion`
  before implementing: soft-tint headers over pill/gradient alternatives,
  text+accent-bar badges over icon pills, doing the retirement tab-split
  in the same batch rather than a follow-up, one combined deploy instead
  of shipping each item separately.
- Round 3's specific fix for Module 1's empty-card problem (widen the card
  vs. center it vs. add a new companion panel) was also confirmed via
  `AskUserQuestion` — user picked "widen the card," explicitly ruling out
  adding new content just to fill space.
- `Week3CreditCard.jsx.backup` (a stray uncommitted backup file already
  sitting in the repo) was deliberately left untouched throughout — not
  the live component, out of scope.

### 2026-08-14 — Widened login card (no more dead gutters) + OAuth 404 fix handed to user as a dashboard-only change
Picked up the 2026-08-13 evening handoff (Google OAuth → dead Netlify 404,
login card looking cramped). Confirmed both root causes the handoff already
suspected, using the user's actual screenshots (1920px-wide desktop Chrome)
this time instead of a code-only read.

- **Login card layout — fixed, code change, verified visually before
  pushing.** `src/components/Login.jsx`: outer container `max-w-[400px]` →
  `max-w-[560px]`; the gradient logo card's inline `padding: '20px 110px'` →
  `'20px 60px'` (110px/side was tuned for the old 400px-wide parent — left
  unscaled it would've just added dead space *inside* the card instead of
  using the extra width); email input placeholder shortened from the full
  four-domain string (which was clipping mid-word — `…username@alumni.rice.e…`)
  to `"username@rice.edu, @gmail.com, or @yahoo.com"` (the full domain list is
  still shown in the red validation warning when the typed email doesn't
  match, so nothing was lost, just moved out of the placeholder). Confirmed
  `max-w-[400px]` predates the Cloudflare migration in git history — this was
  never actually caused by the hosting switch, just a design that was never
  tuned for a wide desktop viewport and only got noticed now.
  - User explicitly chose "widen the existing centered card" over a
    split-screen or decorative-background redesign — smallest visual change,
    keeps the current look, just stops it reading as broken on a large
    monitor. Gutters are still visible at 560px on a 1920px-wide screen by
    design (a centered card was never going to be full-bleed) — that trade-off
    was made explicitly, not missed.
  - **Verified without spending a Cloudflare Pages build**: ran `npm run dev`
    locally (already wired to the live Supabase backend via `.env.local`) and
    used the Playwright MCP tool to screenshot the login page at 1920×1080
    (matching the user's screenshots) and at 390×844 (mobile) before touching
    git at all. This is the reusable answer to "how do I preview without
    deploying" for this repo going forward — no separate preview
    infrastructure needed, the pieces already existed.
  - `npm run build` clean.
- **Google OAuth 404 — fixed, confirmed live.** No tool in this session had
  Supabase Management API access (no stored PAT, no MCP server for it), so the
  user made the change themselves rather than generate a new PAT: Supabase
  project `zyznmhbtpniluhkyowbb` → Authentication → URL Configuration → Site
  URL = `https://univ154.pages.dev`, Redirect URLs allow-list +=
  `https://univ154.pages.dev/**` (Supabase's allow-list uses `**` glob
  syntax, typed literally). This exactly matched the 2026-08-13 evening
  handoff's prime suspect. Verified live with Playwright: clicking "Continue
  with Google" on `univ154.pages.dev` now lands on Google's account chooser
  with `redirect_to=https://univ154.pages.dev/` in the URL, instead of
  bouncing to the dead Netlify 404.
- Takeaway reinforcing the 2026-08-13 "latest" entry: the OAuth allow-list has
  now broken exactly this way twice across two different hosting migrations
  (Netlify→Netlify rename, then Netlify→Cloudflare) — worth remembering that
  *any* future hosting change for this project needs a Supabase Auth URL
  Configuration check as a standard step, not an afterthought discovered via a
  broken login.

### 2026-08-13 (evening) — Google OAuth redirects to dead Netlify 404 + login-card layout regression; handed off mid-investigation
User tried logging into the live site both ways (email/password wasn't mentioned as
failing, but Google sign-in specifically) and landed on Netlify's stock "Site not
found" error page (Netlify Internal ID `01KZY9T1YTZ39MSE6C6R26S4MH`), not the app.
User also flagged that the login/onboarding card's logo sizing and spacing looks
"screwed up" compared to before, and attributed both to the Cloudflare switch.
User is switching Claude accounts (session running low on usage) before this could
be fixed, so this is a handoff entry, not a resolution — see the "🔴 ACTIVE" section
at the top of this doc for the condensed version a fresh session should read first.

- **Google redirect bug, not yet confirmed root cause.** Checked
  `AuthContext.jsx:257` — `redirectTo: \`${window.location.origin}/\`` — this is
  dynamic, not a hardcoded Netlify URL, so the frontend code itself isn't the bug.
  That points at Supabase's Auth → URL Configuration screen (Site URL / Redirect
  URLs allow-list) for project `zyznmhbtpniluhkyowbb` still being pointed at
  `https://riceuniv154.netlify.app` from before the Cloudflare cutover — Supabase
  falls back to the configured Site URL when the requested `redirectTo` isn't on
  its allow-list, which would explain landing on a Netlify URL from a Cloudflare
  page. This is the same *category* of bug as the 2026-08-13 "later same day" entry
  below (`uri_allow_list` pointed at a stale Netlify URL that time too) — not
  independently confirmed yet, just the strongest lead. Nobody has opened the
  Supabase dashboard to check this screen this session.
- **Login card layout, not yet confirmed root cause.** Read `Login.jsx` — the
  gradient card wrapping the UNIV154 logo has `padding: '20px 110px'` (110px each
  side) inside a `max-w-[400px]` container, which only leaves ~180px for a
  145px-tall logo image plus heading text. This is suspicious on its face but
  wasn't visually verified in a browser (no screenshot of the *current broken*
  render was diffed against this code path in this session — the two screenshots
  the user provided show the card readable but noticeably narrow/cramped with a
  lot of dead gray gutter space on either side, consistent with the max-width
  container being much narrower than the viewport, which is expected responsive
  behavior — whether that counts as "screwed up" vs. always-was-this-way wasn't
  resolved). Needs a live browser check, not just a code read, before touching CSS.
- **Not yet done**: opening Supabase dashboard, opening Google Cloud Console,
  opening the live site in a browser to reproduce either issue directly. This
  entry exists purely so those next steps aren't lost across the account switch.

### 2026-08-13 (latest) — Clarified doc to prevent future "are we still on Netlify?" confusion
User asked how to track Cloudflare deploy limits; the assistant's answer led with
Netlify's billing page (technically accurate — Netlify is still connected — but
worded in a way that read as if Netlify were the active host), which understandably
confused the user since the whole point of the prior session was moving *off*
Netlify. No architecture actually changed; this was a documentation clarity fix.
- Added a blunt callout at the top of the architecture table stating the live URL
  in one sentence, explicitly flagging that Netlify-as-active-host is a wrong
  conclusion if any future session drifts toward it.
- Added a **Deployment limits** section right under the architecture table with
  Cloudflare's actual numbers (500 builds/month flat, no credit system) and where
  to check usage (`dash.cloudflare.com` → Workers & Pages → `univ154` → Deployments),
  since that's the only limit that matters going forward — Netlify's 300-credit
  system only applies to the dormant host and shouldn't be part of the answer to
  "how do I avoid running into this again."
- **Takeaway**: when a repo has a dormant-but-still-connected legacy service (like
  Netlify here), lead answers with the live/primary system first and only mention
  the dormant one if directly relevant — don't present them as parallel options,
  even when both are technically "connected."

### 2026-08-13 — App-wide currency/percent formatting: new `src/utils/formatters.js`, fixed an accounting-format bug
User asked for two things: (1) `AssumptionsAdmin.jsx`'s currency inputs read as
Excel's *Accounting* format (a fixed-position `$` decoration next to a
right-aligned input — big gap before short numbers) instead of Excel's
*Currency* format (`$` glued to the first digit, whole thing right-aligned as
one unit); (2) `$`/`%` formatting was inconsistent across the student-facing
modules (Week1–12, Budget, Savings) — some screens showed no `$` at all
(`Week1FederalTax.jsx`, `Week1Summary.jsx` never had a currency symbol),
`BudgetForm.jsx` had four genuine accounting-format spots
(`<span>$</span>` + `<span>{amount}</span>` inside a `justifyContent:
'space-between'` div), and a dozen components each hand-rolled their own
`formatCurrency`/`formatPercent` with disagreeing decimal precision (1 vs 2
decimals) and inconsistent `$`-baking (some functions returned `"1,234.56"`
and made the caller splice on `$`, others returned `"$1,234.56"` already).
- **New `src/utils/formatters.js`**: single `formatCurrency(value, {decimals=2})`
  (always bakes in `$`, always 2 decimals, comma-grouped, `-$X` for
  negatives) and `formatPercent(value, {decimals=1, alreadyPercent=false})`
  (expects a fraction by default — 0.062 → "6.2%" — since that's the
  app-wide convention for stored rates; pass `alreadyPercent: true` for the
  handful of call sites that already carry a *100 value, e.g. Week9's
  blended-return calcs).
- Swept onto the shared functions: `BudgetForm.jsx`, `SavingsForm.jsx`,
  `Week1FederalTax.jsx`, `Week1StateTax.jsx`, `Week1Summary.jsx`, `Week4.jsx`,
  `Week5.jsx`, `Week6Retirement.jsx` (9600+ lines, ~110 call sites),
  `Week7.jsx`, `Week9.jsx`, `Week12.jsx`, `Week3CreditCard.jsx`. Left local
  helpers alone only where they serve a genuinely different job than display
  formatting (e.g. Week12's `formatCurrencyInput`/`formatPercent`, which echo
  back a partially-typed raw input string, not a computed value).
- **`AssumptionsAdmin.jsx`'s `CurrencyInput`**: previously overlaid a
  decorative `$` at a fixed `left: 10px` next to a `textAlign: 'right'`
  input — classic Accounting format. Fixed by baking `$` into the formatted
  *text itself* (`formatCurrencyDisplay` now returns `"$176,100"`), and
  showing the plain unformatted number only while the field is focused (via
  a new `toRaw` prop), reformatting back to `"$176,100"` on blur — same
  behavior Excel itself uses (raw value while editing a cell, formatted
  display once you move off it). Removed the now-unused `inputAffixLeft`
  style/spans.
- Did **not** touch plain editable text inputs that already show `$` glued
  directly to typed digits (e.g. `` `$${formatNumberForInput(x)}` `` in
  Week5/Week7/Week3CreditCard/SavingsForm) — those aren't the accounting-format
  bug, just simpler un-comma-grouped `$` inputs; left as scope-limited since
  the user's complaint was specifically about format (symbol position), not
  every remaining inconsistency.
- Bulk mechanical edits (Week6Retirement's ~110 call sites) were done via
  small Node regex scripts rather than hand-editing, ordered carefully
  (double-`$` template-literal cases before single-`$` JSX-text cases) to
  avoid a first-pass bug where the single-`$` cleanup step re-matched and
  corrupted the double-`$` cases it had just fixed — caught by re-grepping
  every `formatCurrency(` call site before moving on, not by the build (Vite
  happily compiled the corrupted `` `{formatCurrency(x)}` `` — a literal,
  never-evaluated template string — with no error).

### 2026-08-10 — Migration to Rice's own GitHub/Supabase (prior session)
Forked `beyzaispiir/univ154` to `riceuniversityuniv-cmyk/univ154`, stood up a fresh
Supabase project (`zyznmhbtpniluhkyowbb`) and pointed Netlify (`riceuniv154.netlify.app`)
at the fork. Along the way:
- Fixed a `week_access` migration that referenced a `user_profiles` table nothing in
  this repo creates (retargeted to the real `auth.users`-based trigger; dropped a
  dead backfill `INSERT` since the new DB has no legacy users). Commit `0fca4a8`.
- Downgraded `react`/`react-dom`/`@types/react(-dom)` from `^19` to `^18` — `@fluentui/react-components@9.64.0`
  peer-requires React `<19`, and npm's resolver was hard-failing on the `@types` peer
  mismatch during Netlify builds. Commit `1457d70`.
- Bumped Netlify's `NODE_VERSION` to `20` — Node 18's bundled npm hits a known bug
  (npm/cli#4828) installing `@tailwindcss/oxide`'s optional native binary. Commit `8ab5461`.
- Replaced Beyza-era hardcoded admin emails with `riceuniversityuniv@gmail.com` in both
  `src/utils/adminEmails.js` and the three admin RLS policies. Commit `92db767`
  / `20260810000000_update_admin_emails.sql`.
- **Note**: the RLS migration's comment references `docs/univ154-migration.md` (this
  file) as if it already existed — it didn't get created in that session. This file
  is that doc, created retroactively 2026-08-11.

### 2026-08-11 — Diagnosed "Google login broken," found and fixed a real access-control bug
User reported Google sign-in broken on `riceuniv154.netlify.app` and suspected the
GitHub migration hadn't fully landed. Investigation (read-only `gh api` + live
Playwright checks) found the migration had actually already landed correctly (see
2026-08-10 above) — the remaining issues were narrower:
- **Confirmed root cause of Google login**: Supabase project `zyznmhbtpniluhkyowbb`
  has the Google provider disabled/unconfigured — clicking "Continue with Google" hits
  `zyznmhbtpniluhkyowbb.supabase.co/auth/v1/authorize` and gets back
  `400 validation_failed: Unsupported provider: provider is not enabled` immediately,
  before Google is ever involved.
- **Confirmed the old site is a dead duplicate** (see "Dead legacy site" above) — not
  in scope to fix.
- **Found and fixed, independently of the login bug**: `ProtectedRoute` was commented
  out in `App.jsx`, so `/dashboard/*` (all week modules) was reachable by anyone
  without signing in. Restored it. Commit `1a5bb5b`, pushed to `main` directly (user
  approved pushing ahead of the Google fix since it's a clear, verified, no-downside fix).
- Cloned the repo locally into `...\UNIV 154\Web-Based Tool` as the ongoing local
  working copy for this project; set up `.env.local` (gitignored) using the anon/publishable
  key pulled from the live bundle, so `npm run dev` works against the real backend without
  needing separate throwaway credentials.
- Re-enabled the Google provider via the Supabase Management API (user supplied a
  Personal Access Token — avoids needing an interactive/MFA browser login for this).
  Also found and fixed a **second** bug while in there: `site_url` /
  `uri_allow_list` (Supabase's redirect allowlist) were still pointed at
  `https://zesty-sundae-3cee34.netlify.app` (an old/auto-generated Netlify site name),
  not `https://riceuniv154.netlify.app` — would have broken *any* redirect-based auth
  flow (Google OAuth, email confirmation links, password reset), not just Google.
- Created a fresh Google Cloud OAuth 2.0 Client (`riceuniversityuniv@gmail.com`'s Cloud
  project) since none existed for this Supabase project; wired Client ID/Secret into
  Supabase, redirect URI `https://zyznmhbtpniluhkyowbb.supabase.co/auth/v1/callback`
  into the Google Cloud OAuth client. Confirmed live: clicking "Continue with Google" now
  reaches Google's real consent screen with no `redirect_uri_mismatch`/provider errors.
- **Found and fixed a second, more fundamental bug via user's console/URL evidence**:
  every *new* user creation (Google OR email/password — same code path) was failing
  with GoTrue error `Database error saving new user`. Root cause: `auth.users` has two
  AFTER INSERT triggers, `on_auth_user_created` (→ `handle_new_user()`, feeds
  `registered_users`) and `create_week_access_on_user_registration`
  (→ `create_default_week_access()`, feeds `week_access`). The first has
  `SECURITY DEFINER` (runs as table owner `postgres`, bypasses RLS) and has exception
  handling; the second had **neither** — its plain `INSERT` ran as the restricted
  Supabase-internal auth role, which `week_access`'s RLS policies don't grant INSERT to
  at all (only an admin-only policy and a users-can-view-their-own policy exist), so RLS
  blocked it, threw unhandled, and rolled back the *entire* `auth.users` insert.
  Confirmed via `pg_proc`/`pg_policy` inspection (Management API SQL access), not
  guessed. Fixed by adding `SECURITY DEFINER` + the same `ON CONFLICT`/exception-handling
  pattern as `handle_new_user()`, applied live and captured as
  `supabase/migrations/20260811000000_fix_week_access_trigger_security_definer.sql`
  (the *previous* fix to this same trigger, on 2026-08-10, was applied ad hoc and never
  made it into a tracked migration file — gap now closed).
- User confirmed real Google sign-in now works end-to-end (lands on the dashboard).
  Follow-up complaint: the redirect back to "/" briefly flashed the Login form before
  hard-navigating to `/dashboard` via `window.location.href` (full page reload — felt
  laggy). Root cause: `AuthContext`'s `SIGNED_IN` handler delayed navigation by 1s via
  `setTimeout` and used a hard reload instead of client-side routing, and `Login`/`SignUp`
  had no awareness of an already-established session so they rendered unconditionally
  while the redirect was pending. Fixed by adding `PublicOnlyRoute` (`App.jsx`, mirrors
  the existing `ProtectedRoute`) wrapping `/` and `/signup`: shows a spinner while
  `AuthContext`'s initial session check (`loading`) is unresolved, then declaratively
  redirects to `/dashboard` via React Router the instant `user` is set — no flash, no
  full reload. Removed the now-redundant `window.location.href` call from
  `AuthContext.jsx`. Commit `d8d7702`.
- **User confirmed live on `riceuniv154.netlify.app`**: Google sign-in now goes straight
  into the tool, no login-page flash, no lag. This closes out the original "Google login
  broken" report end-to-end (provider config → redirect allowlist → OAuth client →
  new-user DB trigger → post-redirect UX, all five layers were broken and are now fixed).

### 2026-08-11 — Multi-admin roles: DB-backed `admins` table + in-app Admin Settings
Replaced the hardcoded-single-admin-email pattern (JS array + copy-pasted RLS policy
literal, kept in sync by hand) with a real `admins` roles table and an in-app UI, per
user request to add `km108@rice.edu` as an admin and set up self-service admin
management without needing code changes or SQL migrations going forward.
- New table `admins` (email PK, role admin/master_admin, granted_by, created_at) with
  a DB-enforced single-master-admin invariant (partial unique index). New
  `SECURITY DEFINER` helpers `is_admin()`/`is_master_admin()` and RPC
  `transfer_master_admin()`. Existing admin-only RLS policies on `week_access`,
  `global_week_settings`, `registered_users` repointed from the hardcoded email list
  to `is_admin()`. Migration:
  `supabase/migrations/20260811000001_create_admin_roles.sql`, applied live via the
  Management API (same approach as the 2026-08-11 `week_access` trigger fix) and
  verified via `pg_policies`/`pg_proc`/`pg_indexes` introspection.
- Seeded `km108@rice.edu` as master admin and kept `riceuniversityuniv@gmail.com` on
  as a regular admin (demoted from its prior master status, not removed) — see
  gating rules above for the full permission model (who can add/remove/transfer).
- New `src/components/AdminSettingsPanel.jsx` at `/dashboard/admin/settings` (roster,
  add admin, remove admin, transfer master admin), new `src/utils/adminApi.js`
  (Supabase calls), deleted `src/utils/adminEmails.js` (only consumer was
  `AuthContext.jsx`, now DB-backed).
- While touching `AuthContext.jsx`'s admin-check logic, fixed a latent bug in the
  `TOKEN_REFRESHED` handler: it was passing the whole `session.user` object into
  `checkAdminStatus` instead of `session.user.email` like every other call site —
  harmless before (silently returned `false` against the old sync array lookup), but
  needed fixing now that the same function does a real DB query.
- Also fixed `Dashboard.jsx`'s `SidebarLink` active-state matcher: it had a
  `startsWith('/dashboard/admin/')` special case for the (previously only) admin
  route, which would've made both admin nav links highlight as active simultaneously
  now that there are two (`admin/week-access` and `admin/settings`). Now exact-match
  only.
- Not yet click-tested end-to-end in the browser (no login credentials for the real
  admin accounts in this session) — DB state and RLS policies verified directly via
  SQL introspection; `npm run build` passes clean. Follow-up: sign in as
  `km108@rice.edu` and confirm the Admin Settings page's add/remove/transfer flows
  live.

### 2026-08-11 — Multi-admin roles feature was never deployed; merged to `main` and pushed
Root cause of "logged out/in, don't see Admin Settings": the entire multi-admin-roles
feature above was committed to a local-only branch (`feature/multi-admin-roles`) and
never merged to `main` or pushed. `origin/main` — what Netlify actually builds and
deploys — had none of it. The Supabase side (migration, RLS, RPC) was already live
from earlier in the session; only the frontend was stuck undeployed. Confirmed via
`git log origin/main` lacking the feature commit before fixing.
- Merged `feature/multi-admin-roles` into `main` (`--no-ff`) and pushed
  (`932b9df..e3b9e5c`) — this triggers the Netlify production deploy. `npm run build`
  verified clean pre-push; local branch deleted post-merge.
- Also added a real clickable sidebar collapse/expand toggle button
  (`src/components/Dashboard.jsx`), per user request. `MdChevronLeft`/`MdChevronRight`
  and a `toggleSidebar` handler were already threaded through as props to
  `MinimalistSidebar` (`src/components/sidebar-variants/Option3_Minimalist.jsx`) but no
  button was ever rendered — the only existing control was a small "Hide sidebar"
  checkbox at the bottom of the sidebar. Added a round button pinned to the sidebar's
  right edge that flips `MdChevronLeft`/`MdChevronRight` and slides with the sidebar.
- **Takeaway**: this repo's default deploy trigger is a push to `main` (Netlify), but
  the standing instruction is "commit only when asked; branch first off `main`" for
  safety. When a user asks for a feature to be live/working, branching+committing
  alone isn't enough — merging and pushing to `main` is a separate, explicit step that
  needs to actually happen (or be explicitly deferred and said out loud), not silently
  left on a feature branch.

### 2026-08-11 — Combined Admin Panel/Settings into one tabbed section, added "Preview as Student"
Per user request: the two separate admin sidebar links/pages became one, and
admins got a way to see the app as a regular viewer without losing admin
rights. Design: `docs/superpowers/specs/2026-08-11-admin-consolidation-and-preview-mode-design.md`.
Branch: `feature/admin-consolidation-preview-mode`.
- New `src/components/AdminPanel.jsx`: tab shell ("Week Access" / "Manage
  Admins") + `<Outlet/>`, nested under `/dashboard/admin`. Route
  `admin/settings` renamed to `admin/manage` to match the tab label (no
  external links referenced the old URL). `WeekAccessAdmin.jsx` and
  `AdminSettingsPanel.jsx` kept their internals as-is.
- Sidebar: the two admin `SidebarLink`s collapsed into one "Admin" link.
  `SidebarLink`'s active-match regained a `startsWith('/dashboard/admin')`
  special case (safe now with only one admin link — this same special case
  was removed on 2026-08-11 earlier this session specifically because there
  were two).
- **New client-side-only admin/effective-admin split**: `Dashboard.jsx` now
  computes `effectiveIsAdmin = isAdmin && !previewAsStudent` and feeds *that*
  into `WeekAccessProvider` and sidebar rendering, while the *real* `isAdmin`
  from `useAuth()` is threaded through separately so the "Preview as Student"
  toggle itself stays visible/clickable regardless of current preview state.
  `AdminPanel.jsx` and `AdminSettingsPanel.jsx`'s access gates both read the
  effective value (via `useWeekAccess().isAdmin`) so admin pages correctly
  lock out during preview too. This does not touch RLS/permissions at all —
  purely a rendering-layer toggle; real admin writes still go through
  Supabase's actual role check regardless of what this flag shows client-side.
- Preview state is deliberately **not persisted** (plain `useState`, no
  `localStorage`) — a reload always starts back in normal Admin view, so a
  mid-preview refresh can't be mistaken for having lost admin access.
  Toggling preview on while sitting on an admin route navigates to the
  student landing page instead of showing that page's own Access Denied.
- `npm run build` clean. **Not click-tested live** — same constraint as the
  earlier multi-admin-roles work this session: no login credentials for the
  real admin accounts in this session. Follow-up: sign in as `km108@rice.edu`,
  confirm both Admin tabs render their existing content at
  `/dashboard/admin/week-access` and `/dashboard/admin/manage`, and exercise
  the Preview as Student toggle (nav collapses, weeks lock, toggle stays
  clickable, navigates off an admin page when toggled on from one).

### 2026-08-11 — Combined Admin tabs into one stacked page, removed fluff text, fixed sidebar issues
Per user request: the "Week Access" / "Manage Admins" tabs (added earlier
this session) became one page with Week Access on top and Manage Admins
below, and four sidebar/UI bugs got fixed. Design:
`docs/superpowers/specs/2026-08-11-admin-simplify-sidebar-fixes-design.md`.
Branch: `feature/admin-simplify-sidebar-fixes`. Visually verified via a
throwaway local auth bypass + Playwright screenshots (reverted before
commit, not part of the diff) since this session has no real admin login
credentials — same constraint noted elsewhere in this doc.
- `AdminPanel.jsx`: dropped the tab header/`<Outlet/>` routing; now renders
  `<WeekAccessAdmin/>` then `<AdminSettingsPanel/>` stacked under a single
  route `/dashboard/admin`. `App.jsx`'s old `admin/week-access` and
  `admin/manage` routes now redirect to `/dashboard/admin`.
- Stripped explanatory copy from both panels: subtitle taglines, the
  "Control week availability..." / "Pick from registered users..." /
  "Hand master admin status..." helper paragraphs, the per-row "Week ID:
  week-x" subtext, and the "Instructions:" box at the bottom of Week
  Access. Headers, table content, buttons, and success/error messages were
  kept — those are functional, not fluff.
- Sidebar Admin nav link (`Option3_Minimalist.jsx`): wrapped its icon in
  the same circular gradient badge the module links use (was a bare 18px
  icon), and fixed `SidebarLink`'s (`Dashboard.jsx`) inner `flex-1` span
  overriding the link's `justify-center` for admin-style links, which had
  been left-shifting/clipping the icon+label instead of centering it.
- Removed hover-driven sidebar expand/collapse (`Dashboard.jsx`): deleted
  the 20px left-edge hover-trigger div, the sidebar's own
  mouseenter/mouseleave handlers, and the `sidebarHovered` state.
  Visibility is now driven solely by `sidebarCollapsed`, changed only by
  the toggle button. Updated the stale "Hide sidebar" tooltip copy that
  referenced hover.
- Toggle button: when collapsed it sat at `left: 0` with `translateX(-50%)`,
  clipping half of it off-screen. Changed to `left: 14px` (its own radius)
  when collapsed so the full circle stays on-screen, flush with the edge.
- `npm run build` clean.

### 2026-08-11 — Follow-up: Admin icon still centered, not left-aligned; toggle button too small
The prior entry's "centering" fix for the Admin sidebar icon overcorrected —
it made the icon+label group centered as a unit instead of left-aligning it
flush with the module icons below, which is what was actually wanted.
Corrected, and enlarged the sidebar toggle button per follow-up feedback:
- `Option3_Minimalist.jsx`: Admin nav link now uses `variant="module"` and
  embeds its icon in the `text` prop the same way module rows build their
  `twoToneLabel` (icon + text in one flex span), instead of using the
  separate `icon` prop. This makes it go through the exact same padding/
  layout path as module links, so the icon lines up at the same x-position.
- `Dashboard.jsx` (`SidebarLink`): removed the `isAdminLink`-only
  `justify-center` branch on the inner content span — admin and module
  links now share one plain left-aligned `flex items-center flex-1
  min-w-0`, no special-casing.
- Toggle button grown from 28px to 36px (icon 18px to 22px); collapsed-state
  `left` offset bumped from 14px to 18px (its new radius) so it still sits
  fully on-screen, flush with the edge, at the larger size.
- Verified visually via the same temporary `ProtectedRoute`/`isAdmin`
  bypass technique as the prior entry (reverted before commit — no auth
  logic shipped changed). `npm run build` clean.

### 2026-08-11 — Sidebar cleanup: Preview toggle moved to top, dropped Hide-sidebar checkbox and Rice logo
Per user request, three changes to `Option3_Minimalist.jsx`'s sidebar chrome:
- "Preview as Student" toggle (real-admin-only) moved from the bottom user-profile
  block to a new section directly under the logo, before the nav — same markup/
  behavior, just relocated so it's visible without scrolling to the bottom.
- Removed the "Hide sidebar" checkbox + its hover tooltip entirely (along with the
  now-unused `showHideSidebarTooltip` state and the `useState` import it was the
  only consumer of). This was the only UI control for the `sidebarFixed` /
  `onSidebarFixedChange` props `Dashboard.jsx` still passes down — left those
  props as harmless dead weight in `Dashboard.jsx` (React ignores unused props)
  rather than touching that state/localStorage logic, since removing the *button*
  was the ask, not the underlying collapsed-start behavior. Sidebar visibility is
  still fully controlled by the toggle-button/`toggleSidebar` path documented in
  the 2026-08-11 "Combined Admin tabs" entry above.
- Removed the Rice University logo image above Logout — that section is now just
  the Logout button. `riceLogo` dropped from this component's props (still
  imported and passed by `Dashboard.jsx`, just unused now).
- `npm run build` clean. Not click-tested live (same no-admin-credentials
  constraint noted elsewhere in this doc).

### 2026-08-11 — "Changes not showing" was browser cache, not a deploy failure; verified via bundle fingerprinting
User reported not seeing the sidebar changes above on `riceuniv154.netlify.app` after
they were pushed. No Netlify CLI/API access in this session, so verification was done
indirectly:
- `git log`/`branch -vv` confirmed local `main` matched `origin/main` exactly — the
  push itself was never in question.
- Fetched the live `index.html` + its referenced JS bundle via `curl` and diffed it
  against a fresh local `npm run build`. The two builds' output filenames had
  different content hashes (`index-Bo8vEz70.js` live vs `index-CRKhXW6M.js` local),
  which looked suspicious at first, but grepping both bundles for strings unique to
  the shipped changes (`"Hide sidebar"` → 0 in both, `"Preview as Student"` → 2 in
  both, `"Rice University Logo"` → 4 in both) plus near-identical byte sizes (a
  ~106-byte difference, consistent with cross-machine build non-determinism, not
  different source) confirmed the live bundle *did* contain the current code.
  `Cache-Status: fwd=miss` on the response also ruled out a stale Netlify Edge cache.
- **Conclusion**: deploy pipeline is fine; the mismatch was the user's own browser
  caching the old bundle. Told user to hard-refresh (Ctrl+Shift+R) or check they're
  on `riceuniv154.netlify.app` and not the dead `univ154.netlify.app` lookalike.
- **Takeaway for future "I don't see my changes" reports**: don't just re-check
  `git log` — fingerprint the actually-served bundle's content against a fresh local
  build before concluding the deploy is stale. A differing content-hash filename
  alone is not proof of stale content.

### 2026-08-11 — Preview-as-Student toggle sizing + more left padding on nav icons
Follow-up polish request after the user confirmed they could see the relocated
toggle (see above) but wanted it more consistent with the rest of the sidebar:
- `Option3_Minimalist.jsx`'s "Preview as Student" label font size bumped from 12px
  to 13px to match the module nav items' text size (was noticeably smaller before).
- Toggle switch enlarged from 34×18px (14px knob) to 46×25px (19px knob), same
  3px inset on all sides so the knob travel math still centers correctly.
- Nav icon circles' left padding increased again — `<nav>`'s `pl-6` (24px) bumped
  to `pl-10` (40px), stacking with `SidebarLink`'s own `px-4` (16px) for a 56px
  total inset from the sidebar's left edge (up from 40px). This is the second
  bump to this same spacing this session (see "left-align admin icon" commit
  earlier in git history) — the user wanted more than that first pass gave.
- `npm run build` clean.

### 2026-08-11 — Nav icon spacing pushed further; Preview-as-Student left-aligned with Admin row
User said the prior `pl-10` bump (see above) still wasn't enough and asked for the
"Preview as Student" row to line up with "Admin" specifically:
- `<nav>`'s left padding bumped again, `pl-10` (40px) → `pl-16` (64px) — combined
  with `SidebarLink`'s own `px-4` (16px), the module/Admin icon circles now start
  80px from the sidebar's left edge (was 56px, was 40px before that).
- The "Preview as Student" row lives outside `<nav>` (it's rendered above it, not
  as a `SidebarLink`), so it had its own independent padding (`px-6` = 24px) that
  didn't track the nav's — that's why it looked left-shifted relative to "Admin"
  even after both had been bumped once. Replaced its `px-6` class with explicit
  `paddingLeft: '80px'` / `paddingRight: '16px'` so it's pinned to exactly the
  same left inset as the Admin icon, not just independently increased.
- Confirmed its font size (13px) already matched Admin's label (13px) from the
  prior pass — no change needed there.
- `npm run build` clean.

### 2026-08-11 — ROOT CAUSE FOUND: Tailwind's default spacing scale wasn't loading at all (`@tailwind` v3 directives under a v4 package)
After the user pushed back a *third* time that spacing changes weren't visible, stopped
trusting "the push succeeded" as sufficient and instead diffed the actual compiled CSS
(local fresh build vs. live) for the literal utility class rules, not just marker
strings. Finding: **`.pl-16{}`, `.pr-4{}`, `.px-6{}`, `.p-4{}` — none of them existed
anywhere in the output CSS.** Neither did `mt-*`, `gap-*`, `w-4`-style scale classes,
`space-y-*`, etc. Only arbitrary-bracket values (`pl-[100px]`, `px-[12px]`) and
non-scale utilities (`opacity-25`, `text-[15px]`) were present. `grep -c "--spacing"`
on the compiled CSS came back **0**.
- **Cause**: `package.json` has `tailwindcss@^4.1.7` / `@tailwindcss/postcss@^4.1.7`
  (Tailwind v4), but `src/index.css` still had the Tailwind v3 entry syntax —
  `@tailwind base; @tailwind components; @tailwind utilities;` — instead of v4's
  `@import "tailwindcss";`. Under v4's PostCSS plugin, the old three-directive form
  generates *some* output (base reset, non-scale utilities) but never loads the
  default theme's `--spacing` variable, so every utility class whose value is
  computed from the spacing scale (`calc(var(--spacing) * N)`) silently resolves to
  nothing and gets dropped. It fails silent — no build warning, no error, `npm run
  build` exits 0 either way.
- **Impact was app-wide, not just the sidebar**: this is why *every* previous
  spacing/padding tweak this session (`pl-6` → `pl-10` → `pl-16`, `px-6` on the
  Preview-as-Student row, etc.) had **zero visual effect** on the deployed site —
  the classes were being pushed and deployed correctly the whole time, they just
  never compiled into real CSS. The earlier "browser cache" diagnosis for the first
  complaint was consistent with the evidence gathered at the time (content markers
  matched) but was the wrong root cause for the padding-specific complaints — text
  content changes (Preview toggle relocation, Hide-sidebar removal) don't depend on
  the spacing scale so those *did* render; only the `pl-*`/`px-*`/`pr-*` spacing
  changes were silently no-ops.
- **Fix**: replaced `src/index.css`'s three `@tailwind` lines with
  `@import "tailwindcss";`. Rebuilt — compiled CSS size jumped **21.5kB → 46.6kB**,
  `--spacing` now appears 97 times, and `.pl-16{padding-left:calc(var(--spacing) *
  16)}` etc. are present. This retroactively "activates" every spacing-scale
  utility class already written throughout the whole app (not just this session's
  edits) — components elsewhere may visibly shift padding/margin/gap for the first
  time now that those classes actually apply. Smoke-tested `npm run dev` boots
  clean (200 OK) post-fix.
- **Takeaway for future "I don't see my changes" reports involving spacing/sizing**:
  don't stop at grepping for content marker *strings* in the bundle — those only
  prove text/JSX structure shipped, not that a given Tailwind utility class
  actually compiled to a CSS rule. Grep the compiled CSS for the literal selector
  (`.pl-16{`) when the change in question is a spacing/layout utility class.

### 2026-08-11 — `pl-16` nav padding was way too large once the spacing-scale fix landed; cut back to `pl-4`
- Once the `src/index.css` fix above made the spacing scale real, `pl-16` (64px) +
  `SidebarLink`'s own `px-4` (16px) produced an 80px gutter between the sidebar's
  left edge and the module icons — visibly excessive (user marked up a screenshot
  showing the empty strip that needed to go). Every earlier round's padding numbers
  in `Option3_Minimalist.jsx` (`pl-6` → `pl-10` → `pl-16`) were chosen while the
  utility was a no-op, so none of them were ever validated against real rendered
  output.
- Reduced `<nav>` from `pl-16 pr-4` to `pl-4 pr-4` (16px left gutter). Updated the
  Preview-as-Student row's inline `paddingLeft` from `80px` to `32px` (`16px` nav
  gutter + `16px` `SidebarLink` `px-4`) to keep it left-aligned with the Admin row's
  icon, per the existing alignment rule.
- Verified via clean rebuild that `.pl-4{padding-left:calc(var(--spacing) * 4)}`
  compiles and is applied; `.pl-16{...}` still appears in the CSS output but is
  unused dead weight — Tailwind v4's automatic content scanner picked up the
  literal string "pl-16" out of this doc file's own working-log prose (no
  `@source`/`content` restriction is scoping the scan to `src/` only), not from any
  component. Harmless, not worth chasing.
- **Takeaway**: after any fix that makes previously-dead utility classes real, don't
  assume prior "spacing" values chosen while the classes were dead are still
  correct — they need to be re-eyeballed against actual rendered output, since they
  were tuned blind.

### 2026-08-11 — Comprehensive financial-formula audit; four independent tax engines found, several confirmed dollar-value bugs
Per user request, audited every financial calculation in the app (tax/FICA,
budgeting, savings, credit card, mortgage, retirement, HDHP insurance, portfolio
withdrawal) for correctness — read-only, no code changes. Full report:
`docs/financial-audit-2026-08-11.md`.
- **Headline structural finding**: federal/state/FICA tax is computed by **four
  independent, hand-duplicated implementations** (`src/utils/taxCalculator.js`,
  `Week1FederalTax.jsx`, `Week1StateTax.jsx`, `BudgetContext.jsx`'s
  `summaryCalculations`), each with its own copy of the bracket tables. They've
  already drifted apart (different FICA base, different state-bracket data, NYC
  rate rounding) — the Federal Tax tab, State Tax tab, and Summary tab can
  disagree about the same user's tax bill today.
- **Confirmed critical bugs** (personally verified, not just agent-reported):
  `BudgetContext.jsx:253,637` caps Social Security tax's *dollar amount* against
  the wage-base *dollar figure* instead of capping income first — SS tax is
  effectively uncapped below ~$2.84M income on the Summary tab, vs. correctly
  capped on the Federal Tax tab. `Week3CreditCard.jsx:69-70,257-326`'s "Minimum
  Payment" is interest-only on the frozen original balance reused every month —
  traced the math and confirmed principal payment is always ~0, so that
  amortization track can never pay off any debt (always hits the 600-month cap).
- Five more Critical-severity bugs (unverified by me directly, but numerically
  reproduced by the exploration agents against the repo's own data): negative
  state tax for DE/ID/MS/MO/ND/OH below their threshold in one engine, $0.00
  state tax for ~20 flat-rate states in a second engine, an HDHP out-of-pocket
  calculator that always adds the full deductible even when medical expenses are
  below it (`Week7.jsx`), a Roth 401(k) chart with an extra `(1+r)` factor that
  diverges from its own data table (`Week6Retirement.jsx`), and a "value in
  today's dollars" figure that discounts by a fixed 80-year horizon regardless of
  when the peak balance actually occurs (`Week9.jsx`, understates by ~7x under
  default inputs).
- ~20 more High/Medium/Low findings cataloged in the report: stale 2025 SS wage
  base (2026's real figure is $184,500), taxable-income formula that diverges
  between the Summary tab and Federal/State tabs whenever pre-tax expenses are
  nonzero, drifted state-bracket data for HI/CA/WI between the two independent
  50-state datasets, Week 12's employer match uncoupled from actual employee
  contribution, an RMD table that silently stops past age 90, several dead-code
  paths (`CalculationDetails.jsx`, `configs/week1Config.js`/`week2Config.js`, an
  unused `savingsCalculations` block, an unused `financialCalculations` engine),
  and a handful of defensible-but-worth-knowing pedagogical simplifications.
- **User decision**: report only this session, no fixes applied. If/when fixing
  happens, user's stated preference is to consolidate the four tax engines into
  one shared module rather than patch each of the four copies separately — noted
  as the top recommendation in the report.
- Also confirmed correct and not touched: the core marginal/progressive tax
  bracket-stacking algorithm (appears multiple places, always correct), 2026
  federal bracket thresholds and standard deduction, `SavingsForm.jsx`'s NPER/
  sinking-fund formulas, General Loans and mortgage amortization (both correctly
  recompute interest against the live shrinking balance), and percentage-as-
  decimal handling throughout (no "5% treated as 5" bugs found anywhere).

### 2026-08-12 — Traced the 7 Critical audit bugs against the master Excel workbook: 3 inherited, 4 introduced during the port
User asked whether the financial-formula audit's findings (above) already exist
in the source spreadsheet (`...\UNIV 154\Spring 2026\Tool\Final Master Copy -
Web Based Application.xlsx`) or were introduced while porting to React.
Extracted every formula directly from the workbook's XML (`xl/worksheets/
sheetN.xml`, via openpyxl on a local copy — the OneDrive original is
lock-protected while open) rather than re-typing by eye. Full comparison
appended as §7 of `docs/financial-audit-2026-08-11.md` and mirrored in the
published artifact.
- **Key context discovered**: the Excel workbook's own "Week N" sheet-group
  labels do **not** correspond to the web app's "Week N" component names — e.g.
  Excel's "Week 9 - Insurance" is the source for the web app's `Week7.jsx`, and
  Excel's "Week 7 - The Goal" (+ "Tax Engine"/"Projection Engine"/etc. sub-sheets)
  is the source for `Week12.jsx`. Had to match by calculation content, not by
  label, to compare correctly.
- **3 of 7 Critical bugs are faithfully inherited from Excel** — the web app
  reproduced the spreadsheet's own bugs correctly: the SS-tax-cap formula
  (`=MIN(income*6.2%,176100)`, same wrong shape as `BudgetContext.jsx`), the
  negative-state-tax-below-threshold bug (hand-traced: Excel itself returns
  −$22.00 for DE at $1,000 taxable income), and the HDHP always-charges-full-
  deductible bug (Excel's `Week 9 - Insurance!D25` is the exact same formula
  `Week7.jsx`'s own code comment already quotes).
- **4 of 7 are introduced during the React port**, with no Excel counterpart:
  - Credit-card minimum payment (`Week3CreditCard.jsx`'s worst bug): Excel's
    real formula is the standard "interest + 1% of balance, $25 floor,"
    recalculated every month against the live balance, and it amortizes
    correctly (hand-traced 12 months, principal payment stays positive
    throughout). The web port replaced this with an interest-only figure frozen
    at the original balance — a different, broken formula with no source in
    Excel at all.
  - Both of `Week1StateTax.jsx`'s state-tax bugs ($0 for flat-rate states,
    over-taxing threshold states below their floor) are novel reimplementation
    errors — Excel's tracker-3 branch correctly multiplies by taxable income
    (verified: GA at $80,000 → correct $4,312.00 in Excel), and Excel's
    differently-structured nested-IF can only ever produce the negative-tax bug
    above, never an over-tax.
  - The Roth 401(k) chart divergence and the Week 9 "value in today's dollars"
    bug both trace to logic the web app *added* that doesn't exist in Excel at
    all: Excel's chart just plots the same accumulation column the table reads
    from (can never disagree with itself), and Excel discounts the literal last
    row of the projection by that same row's own age (self-consistent by
    construction) rather than searching for a peak balance elsewhere in the
    sweep the way `Week9.jsx` does.
- **Practical implication flagged in the report**: the 3 inherited bugs are a
  content decision (match what's taught in class, bugs and all, or take the
  port as a chance to correct them) — the 4 introduced bugs are unambiguous
  port-fidelity fixes, since Excel already has the correct formula to copy from.
- Only the 7 Critical findings were checked against Excel this session (manual
  effort per formula); the other 22 High/Medium/Low findings from the original
  audit have not yet been traced. Accidentally created a `scratchpad_dump/`
  folder inside the actual repo working tree while extracting formulas —
  caught and deleted before anything was committed.

### 2026-08-12 — Built a fully-fixed Excel workbook with a front-loaded legislative-constants tab
Produced `Final Master Copy - Web Based Application (Fixed).xlsx` in
`Spring 2026\Tool\` (original left untouched) — **not** a web app change, this is
the source spreadsheet the web app was ported from. Built entirely via openpyxl
against the real XML (no hand-retyping), verified with a real Excel COM
recalculation pass (`win32com.client`, `CalculateFullRebuild`) plus targeted
numeric spot-checks against hand-computed bracket math.
- **New first sheet, `0 - Legislative Assumptions`**: every statutory constant
  (FICA rate/wage base, Medicare + Additional Medicare rate/threshold, federal
  ordinary + LTCG brackets, standard deduction, 401(k)/IRA limits, RMD start age,
  penalty-free withdrawal age, full RMD divisor table ages 72–120, and the full
  50-state + NYC bracket table) now lives in exactly one place with named ranges
  (`SS_Rate`, `SS_WageBase`, `FedOrdinaryBrackets`, `StateBracketsReference`,
  etc.). A `Change Log` sheet (2nd tab) documents every change made.
- **Discovery**: the "four independent tax engines" problem already existed
  *inside Excel*, not just the web port — `Week 1 B - Federal Tax` hand-typed its
  own copy of the federal brackets, separate from `Week 7 B - Fed Ordinary 2026`'s
  clean copy. Reconciled the state-bracket data across all duplicate copies
  first (`Week 7 B - State Tax Brackets` vs `Week 1 B - State Tax`'s embedded
  161-row table) and confirmed they were byte-identical (no drift) before
  repointing — including catching that a naive key-based diff falsely flagged a
  "mismatch" on NY because the sheet reuses the label `'NY'` for both the real
  NY state brackets (rows 107–115) *and* a separate NYC city-tax block (rows
  173–176); re-scoping the diff to the correct row ranges resolved it cleanly.
- **Fixed 3 confirmed bugs** (all previously traced to Excel in the 2026-08-11
  addendum): the SS-tax-cap shape (`Week 1 B - Federal Tax!G18/M18/T18`, capped
  tax dollars instead of income before the cap), the HDHP out-of-pocket formula
  (`Week 9 - Insurance!D25/F25`, always added the full deductible), and the
  state-tax bracket-walk's missing "income below this bracket's own floor → $0"
  check. That last one turned out to be copy-exploded across **four sheets**,
  not just `Week 1 B - State Tax` (495 cells) — the same buggy pattern also
  drives every age/year column of the retirement withdrawal projections in
  `Week 5 B - State Tax Tr 401(k)` (49,995 cells) and `Week 5 B - State Tax Tr
  IRA` (49,994 cells). Fixed via a regex-based formula-shape transform (not a
  per-cell rewrite) applied uniformly across all ~100,500 matching cells.
- **Self-caught bug in my own fix**: the first build pass repointed each sheet's
  "Lower Bound" column to the wrong master-tab column (state abbreviation
  instead of the numeric lower bound), which silently zeroed out every state's
  computed tax. Caught by numeric spot-checking (not formula-text review alone)
  — DE at $100k taxable income returned $0 instead of the expected ~$4,400.
  Patched (487 cells) and re-verified with a fresh COM recalculation before
  shipping the file.
- **Also identified, not changed**: `Week 5 B- Roth 401(k) State Tax` is a
  correctly-shaped but entirely orphaned duplicate engine (zero references
  anywhere in the workbook) — flagged in the Change Log as safe to delete in a
  future cleanup, not touched this pass. `Week 7 B`'s retirement-projection
  state-tax model uses a single flat rate per state (no bracket walk), which
  understates tax for graduated states at higher incomes — a design limitation
  of that module, not new drift, also flagged rather than restructured (out of
  scope: would require rebuilding that module's lookup mechanism).
- Per user decision, only the 7 Critical findings' Excel-side bugs were in scope
  for this fix; the other 22 High/Medium/Low findings from the audit were not
  addressed here.

### 2026-08-12 (follow-up) — Deeper sweep found one more real bug; re-verified and re-shipped
User asked to double-check the Assumptions tab was exhaustive and the whole
workbook flows correctly. Built a full literal-value inventory (every distinct
numeric literal embedded in any formula, across all 60 sheets, ~200k formula
cells) instead of relying on the original curated candidate list — that list had
already missed one real bug, which is exactly why the broader sweep mattered.
- **Found**: `Week 1 - Budgeting!C32/C34` hand-typed a third, separate copy of the
  401(k)/IRA limits (`=ROUNDDOWN(24500/12,2)` etc.), not linked to the
  Assumptions tab. Worse — `G46`/`G48` (the Roth 401(k)/Roth IRA recommended-
  contribution caps) used *different, stale* hardcoded ceilings (`1958.33` ≈
  $23,500/yr, `583.33` ≈ $7,000/yr — old IRS limits) that didn't even match
  `C32`/`C34`'s own $24,500/$7,500 in the same sheet. The displayed "Max Monthly
  Contribution" and the actual enforced recommendation cap silently disagreed.
  Fixed all four to reference `Limit401k`/`LimitIRA` (via `C32`/`C34`), logged as
  Change Log row 11.
- Investigated every other flagged candidate from the full sweep and confirmed
  they were false positives or out of scope: month/row counters in amortization
  tables (the bulk of ~600 distinct literals found), pedagogical budget-category
  caps (not legislative), a sheet-name substring match, and a 20%-down-payment
  PMI threshold hardcoded 360 times down one mortgage amortization column (real
  but a lending convention, not tax law, and not actually duplicated across
  multiple engines — decided not to centralize it, flagged as considered).
- Re-ran the full Excel COM recalculation + error scan after the fix (clean,
  zero real errors) and a targeted numeric check confirming the Roth 401(k) cap
  now engages at exactly $2,041.66/mo and Roth IRA at $625.00/mo for a
  high-income test case. Re-copied the corrected file over the delivered
  `Final Master Copy - Web Based Application (Fixed).xlsx`.

### 2026-08-12 (final pass) — Requested "one last comprehensive check"; found and fixed a Change Log formula-injection bug
Ran a structural + value-level audit rather than more spot checks:
- **Structural integrity vs. the original workbook**: compared data validations
  (75 = 75), conditional-formatting rule groups (43 = 43), and merged-cell
  ranges (97 → 99, the +2 accounted for exactly by the two new sheets, verified
  no pre-existing sheet's merge count changed) after 5+ openpyxl load/save
  round-trips. No silent corruption from repeated resaving.
- **Found**: 6 cells in the `Change Log` sheet's "old/new formula" documentation
  columns were text like `=IF(E7=0,0,...)` — starting with `=`, so Excel
  silently evaluated them as *live formulas* referencing blank cells on that
  sheet instead of displaying them as descriptive text (they happened to
  resolve to `0` rather than an error, so the earlier error-cell scan didn't
  catch it). Fixed by prefixing each with `Old:`/`New:` so they store as text.
- **Zero remaining occurrences** of the old buggy tracker-formula shape
  anywhere in the workbook (regex-verified across all 60 sheets).
- **Value-level consistency sweep**: 1,125 automated checks comparing every
  repointed cell's post-recalc cached value against its source value on the
  Assumptions tab (all federal/LTCG brackets, FICA scalars, RMD table, and the
  full 50-state + NYC bracket table across all 3 consuming sheets) — 1,124/1,125
  matched exactly; the one apparent mismatch was the verification script's own
  Python `round()` vs. Excel's `ROUNDDOWN()` truncation semantics, not a
  workbook defect.
- Re-delivered the corrected file to the same path after this pass.

### 2026-08-12 (color-coding pass) — Applied the workbook's own blue/green input-vs-link convention to every repointed cell
User asked to fix color coding: cells that were blue hardcodes should be green
now that they're links. Investigated the workbook's own existing convention
first rather than assuming one: `FF0000FF` (blue) = hardcoded input,
`FF388600` (green) = cross-sheet link, default/theme color = same-sheet
calculated formula — confirmed by sampling cells of each known kind before
touching anything.
- Discovered the *original* workbook applied this convention inconsistently —
  e.g. `Week 1 B - Federal Tax`'s hand-typed bracket table was blue, but
  `Week 7 B - Assumptions`/`Fed Ordinary 2026`/`Fed LTCG 2026`/`Lists` (RMD
  table) and `Week 1 - Budgeting!C32/C34` held equally-hardcoded numbers with
  no color override at all (default black). Decided to recolor **all** cells
  that now link to `0 - Legislative Assumptions` green, not only the ones that
  happened to be blue before — the alternative (leaving some links green and
  others default-colored) would just be a different inconsistency.
- Recolored 1,135 cells green (every cell across `Week 1 B - Federal Tax`,
  `Week 1 B - Summary`, `Week 1 B - State Tax`, both `Week 5 B - State Tax Tr
  *` sheets, `Week 7 B - Assumptions`/`Fed Ordinary 2026`/`Fed LTCG 2026`/
  `Lists`, and `Week 1 - Budgeting!C32/C34` that now point at the Assumptions
  tab) and 800 cells blue on `0 - Legislative Assumptions` itself (the actual
  hardcoded data now lives there, so it gets the input color).
- Deliberately left bug-fix cells alone (`Week 1 B - Federal Tax!G18/M18/T18`,
  `Week 9 - Insurance!D25/F25`, `Week 1 - Budgeting!G46/G48`, the ~100k
  state-tax tracker cells) — these were already formulas before the fix
  (never hardcoded), just buggy, so their existing default/black coloring was
  already correct and untouched.
- Verified via COM recalculation (clean) and by re-reading a sample of green,
  blue, and deliberately-untouched cells to confirm the right ones changed and
  the right ones didn't. Re-delivered to the same path.

### 2026-08-12 (reference-sync pass) — User edited the workbook directly in Excel; corrected the reference map here rather than reverting
Between my color-coding delivery and this pass, the workbook's file timestamp
moved and its structure changed without any action from me — traced to the
user opening the file in Excel and editing it directly (OneDrive autosaves
those edits back to the same path, no explicit "Save" needed). **Confirmed
with the user this was intentional** before doing anything else, rather than
assuming corruption and overwriting their edits.

**What changed, and current authoritative state:**
- `0 - Legislative Assumptions` renamed to **`Assumptions`**, and its internal
  layout shifted (the user inserted a column and trimmed a couple of header
  rows). All 17 named ranges still resolve correctly — Excel auto-updated
  every formula that pointed at this tab, nothing broke. **Current addresses
  (read live from the defined names, not assumed):**
  | Name | Cell/Range |
  |---|---|
  | `SS_Rate` | `Assumptions!D3` |
  | `SS_WageBase` | `Assumptions!D4` |
  | `Medicare_Rate` | `Assumptions!D5` |
  | `AddlMedicare_Rate` | `Assumptions!D6` |
  | `AddlMedicare_Threshold` | `Assumptions!D7` |
  | `FedStdDeduction_Single` | `Assumptions!D10` |
  | `Limit401k` | `Assumptions!D29` |
  | `LimitIRA` | `Assumptions!D30` |
  | `RMD_StartAge` | `Assumptions!D31` |
  | `PenaltyFreeWithdrawalAge` | `Assumptions!D32` |
  | `CPI_Inflation` | `Assumptions!D86` |
  | `Portfolio_Return` | `Assumptions!D87` |
  | `FedOrdinaryBrackets` | `Assumptions!C13:E19` |
  | `FedLTCGBrackets` | `Assumptions!C24:E26` |
  | `RMDDivisorTable` | `Assumptions!C35:D83` |
  | `StateBracketsReference` | `Assumptions!C91:F251` |
  | `NYCBracketsReference` | `Assumptions!C255:F258` |
  Any earlier working-log entry above that cites an `0 - Legislative
  Assumptions` cell address (e.g. `B15`, `B91`, `C5`) describes the state **at
  the time it was built**, not the current file — use this table instead going
  forward. Referencing by name (`SS_WageBase`, etc.) rather than address is
  exactly why this still works after the user's edit.
- **`Change Log` tab deleted by the user, permanently** — per their explicit
  instruction, not restored. **This working-log doc is now the sole
  change-history record for the workbook**; there is no in-file changelog
  anymore. Future fixes to this workbook should be logged here only.
- The user also deleted an unused helper "row index" column (column A — a
  plain `1, 2, 3…` counter, e.g. `A8: =A7+1`) from `Week 5 B - State Tax Tr
  IRA` and `Week 5 B- Roth 401(k) State Tax`. Confirmed via column-level
  formula-count diffing that this column was never referenced by any tax
  calculation in either sheet — harmless cleanup, nothing downstream affected.
- Colors (green links / blue master-tab inputs) and every prior bug fix (SS
  cap, HDHP, state-tax tracker) were re-verified intact and unaffected by the
  user's edits.

### 2026-08-12 — Consolidated all tax/FICA/retirement engines onto one shared, DB-backed Assumptions system
Per user request ("update the tool so all of the formulas now flow correctly
and add an admin-only Assumptions tab"), replaced the ~8 independently
hand-duplicated tax/FICA/RMD/LTCG calculation engines
(`taxCalculator.js`, `BudgetContext.jsx` x2, `Week1FederalTax.jsx`,
`Week1StateTax.jsx`, `Week4.jsx`, `Week6Retirement.jsx`, `Week9.jsx`,
`Week12.jsx`) with a single shared engine (`src/utils/taxEngine.js`) driven
by a new DB-backed, admin-editable Assumptions config
(`assumptions_scalars`/`assumptions_brackets`/`assumptions_rmd_divisors` —
see Database schema above). Branch `feature/assumptions-consolidation`.

- **Seed data provenance**: every constant (FICA rate/wage base, Medicare +
  Additional Medicare, federal ordinary + LTCG brackets, standard deduction,
  401(k)/IRA limits, RMD start age, penalty-free withdrawal age, full RMD
  divisor table ages 72–120, CPI/portfolio-return assumptions, and the full
  50-state + DC + NYC bracket tables) was extracted directly from the live
  master Excel workbook's `Assumptions` tab via openpyxl (not re-typed) —
  same discipline as the 2026-08-12 (earlier) Excel-fix sessions. Applied to
  the live Supabase project (`zyznmhbtpniluhkyowbb`) via the Management API
  using a one-time PAT the user generated and shared for this session only
  (not stored anywhere in the repo). Verified via SQL introspection: 12
  scalars, 175 bracket rows (7 federal ordinary + 3 LTCG + 4 NYC + 161
  state), 49 RMD divisor rows, 6 RLS policies (2 per table), all matching
  exactly.
- **Fixed all 7 Critical audit findings** (`docs/financial-audit-2026-08-11.md`)
  in one pass, verified with 26 automated numeric spot-checks against hand-
  computed expected values (SS cap at $500k income, DE/MS/ID/MO/ND/OH below
  their thresholds now correctly return $0 instead of negative, GA/IL/7 more
  flat-rate states now correctly tax instead of $0, Roth 401(k) chart now
  reads the real accumulation table like its siblings, Week 9 "today's
  dollars" now discounts from the age the peak balance actually occurred,
  Week 3 credit-card minimum payment now recalculates against the live
  balance each month and actually amortizes (10k debt at 24.35% now pays
  off in 304 months instead of hitting the 600-month "Never" cap), Week 7
  HDHP out-of-pocket now only charges what was actually spent inside the
  deductible). Also fixed 6 more High/Medium findings while touching the
  same code: stale/disagreeing 401(k)/IRA cap literals across
  `BudgetForm.jsx`/`SavingsForm.jsx`/`Week6Retirement.jsx` (three different
  values — 2041.66/625, 1958.33/583.33, 23500/7000 — now all one source),
  the RMD table's >90 cutoff (DB table covers 72–120), Week 12's employer
  match no longer credited when the employee contributes 0%, and Additional
  Medicare Tax (previously modeled only in Week12.jsx) added to the shared
  engine — confirmed via the live Excel workbook this isn't new pedagogy:
  `Week 7 B - Assumptions!C10/C11` already references
  `AddlMedicare_Rate`/`AddlMedicare_Threshold`.
- **New files**: `src/utils/taxEngine.js` (engine), `src/utils/assumptionsApi.js`
  (Supabase calls, mirrors `adminApi.js`'s pattern), `src/contexts/AssumptionsContext.jsx`
  (mirrors `WeekAccessContext.jsx`'s pattern, wraps `WeekAccessProvider` in
  `Dashboard.jsx`), `src/config/assumptionsDefaults.js` (bundled fallback
  snapshot), `src/components/AssumptionsAdmin.jsx` (admin UI), and the
  migration itself.
- **Admin UI decision**: `/dashboard/admin` went back to **real tabs** (Week
  Access / Manage Admins / Assumptions) — reverses the 2026-08-11 "combine
  into one stacked page" decision, made when both panels were short. The
  Assumptions tab is bulky enough (51 states' worth of bracket tables, a
  49-row RMD table) that stacking no longer made sense. `AdminPanel.jsx` is
  now a thin tab-bar shell with an `<Outlet/>`; `App.jsx`'s `admin/*` routes
  changed from "redirect old two-tab URLs to the combined page" back to real
  nested routes (`admin/week-access`, `admin/manage`, `admin/assumptions`,
  with `admin` index redirecting to `admin/week-access`).
- **Deleted 6 dead files** (confirmed zero remaining importers before
  deleting): `taxCalculator.js`, `data/taxData.js`, `data/stateTaxData.js`
  (all three superseded by `taxEngine.js` + the Assumptions table),
  `CalculationDetails.jsx`, `configs/week1Config.js`, `configs/week2Config.js`
  (pre-existing dead code the audit had already flagged).
- **Verification**: `npm run build` clean (133 modules, no errors); 26
  automated numeric checks in `taxEngine.js` covering all 7 Critical
  findings + the new Additional Medicare Tax + the extended RMD range, all
  passing; `npm run dev` boots and serves 200. **Not click-tested live** as
  an authenticated admin — same no-credentials constraint noted throughout
  this doc. Follow-up: sign in as `km108@rice.edu`, exercise the new
  Assumptions tab's edit/save flows for each section (scalars, federal
  brackets, LTCG brackets, RMD table, per-state brackets, NYC brackets), and
  spot-check a few week modules (Federal Tax, State Tax, Summary, Week 6
  Retirement, Week 9, Week 12) to confirm they now agree with each other on
  the same inputs.
- **Not in scope for this pass** (per the approved plan): the remaining ~15
  High/Medium/Low audit findings not listed above (e.g. Week 5's mortgage
  bi-weekly-payment comment/logic mismatch, `SavingsForm.jsx`'s 0%-rate
  `NaN` guard, Week 6's 401(k)-vs-IRA year-indexing inconsistency) were left
  untouched — flagged in the original audit report as lower-severity,
  narrower-trigger issues, not addressed here.

## Status as of end of 2026-08-11 session
- **⚠️ Important for next session**: `src/index.css` was fixed this session (`@tailwind`
  v3 directives → `@import "tailwindcss";`) because Tailwind's default spacing scale
  was silently not loading — see the "ROOT CAUSE FOUND" entry above. This makes
  every `p*`/`m*`/`gap-*`/`w-<n>`/`space-y-*` class *app-wide* actually apply for
  the first time. Watch for unexpected layout shifts in screens not touched this
  session (Login, Excel Workshop, Admin panel, etc.) — they may have been relying
  on those classes doing nothing, and now they'll visibly render. Not something to
  "fix" preemptively — just be aware if the user reports new-looking spacing
  elsewhere and check this change first before assuming a fresh bug.
- **Fixed and confirmed live**: Google OAuth end-to-end, new-user signup (Google and
  email/password, was previously broken for *everyone*), unauthenticated `/dashboard/*`
  access, login-page flash/lag on OAuth redirect.
- **Pushed to `main` this session, not yet click-tested live**: multi-admin roles
  (DB-backed `admins` table + `/dashboard/admin/settings` UI, `km108@rice.edu` as
  master admin) and the sidebar collapse/expand toggle button — both merged and pushed
  (`e3b9e5c`), `npm run build` clean, but not yet exercised in a real browser session
  against production (no login credentials for the admin accounts in this session).
  Follow-up: sign in as `km108@rice.edu` and confirm Admin Settings' add/remove/transfer
  flows and the sidebar toggle both work as expected post-deploy.
- **Not yet done — pick up next session**: a broader authenticated-screen smoke test was
  planned but not executed — clicking through Dashboard, each wired Week module (1, 2, 3,
  4, 5, 6/Retirement, 7, 9, 12 — Week10/11 exist as files but aren't wired into `App.jsx`
  routes), Excel Workshop, and the Admin panel (`WeekAccessAdmin`, as the admin account
  `riceuniversityuniv@gmail.com`), watching the browser console for errors; also the
  email/password signup flow and "forgot password" flow haven't been click-tested since
  the DB trigger fix (should work now, just not yet verified). Nothing currently indicates
  these are broken — this is verification, not a known bug.
- **Flagged, not acted on (leave as-is unless user asks)**: dead legacy site
  `univ154.netlify.app` (deleted Supabase backend, presumably still under Beyza's Netlify
  account); `riceuniversityuniv-cmyk/univ154`'s cosmetic GitHub "forked from" label.
- **Declined as infeasible**: renaming the Supabase project ref prefix
  (`zyznmhbtpniluhkyowbb`) while keeping the `supabase.co` suffix — project refs are
  permanent; only alternative is a paid custom domain. User chose to leave it as-is.

### 2026-08-13 — Week 1 Budgeting layout cleanup + sidebar marquee removal
- `BudgetForm.jsx`'s floating "Budget Status" indicator (fixed, right-of-screen,
  mid-page) and the bottom "Budget Summary" card were two separate widgets showing
  overlapping data (total expenses, over/under amount, utilization %). Merged into
  one `Budget Status Banner` rendered once, directly under the "Budget Planning"
  header — a 3-column grid (Total Expenses | Budget Status + badge | Utilization +
  progress bar). Both old blocks were deleted outright, not hidden.
- The "User Inputted Data" top inputs (`styles.topInput`, `styles.selectInput`) now
  render right-aligned text (`textAlign: 'right'`, plus `textAlignLast: 'right'` on
  the `<select>`s) to match the rest of the table's right-aligned number inputs —
  previously left-aligned, inconsistent with everything below it.
- Removed the "You can only enter data in the open (yellow) fields." floating badge
  from `Week1Budgeting.jsx` entirely (was the component's only purpose — file now
  just renders `BudgetForm` directly).
- Sidebar (`sidebar-variants/Option3_Minimalist.jsx`): removed the marquee/rotating
  hover-scroll effect on module labels (`.module-text-marquee-*` classes + the
  `sidebar-module-marquee` keyframe animation in `src/index.css`) — labels now just
  wrap onto a second line (`white-space: normal`) instead of scrolling on hover.
  Sidebar width bumped 280px → 320px so full module names (e.g. "Module 9 – Real
  Estate & Homeownership") have room without needing the marquee. The toggle
  button's `left` offset in `Dashboard.jsx` (follows the sidebar's right edge) was
  updated to match, `280px` → `320px`.

### 2026-08-13 — Week Access admin: editable module order, drop Select column, de-slop status UI
- Sidebar "Module N" order used to be a hardcoded array in
  `Option3_Minimalist.jsx` (`weekIds = ['week-1', ..., 'week-5']`), unrelated to
  each week's `week-N` id. Made it admin-editable: new `display_order` int
  column on `global_week_settings` (migration
  `20260813000000_add_display_order_to_global_week_settings.sql`, backfilled to
  match the old hardcoded order so this is a no-op until an admin changes it).
  **Not yet applied to the live DB** — no service-role/CLI credentials in this
  session; user needs to paste the migration into the Supabase SQL Editor (same
  flow as `APPLY_MIGRATION.md`) before the Order column in `WeekAccessAdmin.jsx`
  will actually persist across reloads.
- `WeekAccessContext.jsx` now exports `SUPPORTED_WEEK_IDS` and
  `WEEK_TOPIC_LABELS` (single source of truth for the topic name per weekId —
  was duplicated between `WeekAccessAdmin.jsx`'s `weekLabels` and
  `Option3_Minimalist.jsx`'s `topicLabels`) and adds `getOrderedWeekIds()` +
  `bulkUpdateWeekOrder(orderMap)`. Editing one row's order in the admin table
  renumbers the whole list 1..n in a single bulk upsert — never duplicate or
  gapped positions. `Dashboard.jsx` passes `getOrderedWeekIds()` down as the
  sidebar's `weekIds` prop instead of the sidebar hardcoding its own order.
- Fixed a bug this surfaced: `updateGlobalWeekSettings`/
  `bulkUpdateGlobalWeekSettings`'s local-state updates were replacing each
  week's whole settings object (dropping `order`) instead of merging — every
  Enable/Disable click would silently reset that week's in-memory order back to
  the default until the next page reload. Now merges (`...prev[weekId]`).
- `WeekAccessAdmin.jsx` rewrite: removed the checkbox "Select" column and the
  selection-dependent bulk toolbar (Select All / Deselect All / Enable(N) /
  Disable(N)) — replaced with plain "Open all weeks" / "Close all weeks"
  buttons that act on every week directly, no selection state needed. Replaced
  the bright green/red status pill + separate Enable/Disable buttons with one
  toggle switch per row (navy/gray, matches the sidebar's existing "Preview as
  Student" toggle) — user flagged the old red/green as "AI slop." Table
  gridlines (per-cell borders) removed in favor of a subtle bottom-only row
  divider, matching the glassmorphism card style used elsewhere in the app.

### 2026-08-13 (later same day) — "Changes not showing" was a broken Netlify↔GitHub connection this time, not browser cache
Same symptom as the 2026-08-11 incident (user hard-refreshed, still saw old UI)
but a different root cause — don't assume it's always browser cache:
- Content-fingerprinted the live bundle against a fresh local build (same
  method as 2026-08-11): grepped both for strings unique to the pushed changes
  (`"Open all weeks"`, `"Select All"`, `"You can only enter data..."`). Live
  bundle had 0/1/8 of those respectively; local build had 1/0/0. Confirms the
  live site is genuinely serving pre-`0cdb14a` code, not a caching artifact —
  `curl` bypasses browser cache entirely, so this wasn't the user's browser.
- Checked GitHub directly (`gh api repos/.../hooks`, `.../commits/<sha>/statuses`,
  `.../commits/<sha>/check-runs`) — all empty. **Netlify was never notified of
  the push at all.** This repo (`riceuniversityuniv-cmyk/univ154`) is a *fork*
  (`"fork": true` in the repo API response). Forking doesn't carry over a
  GitHub App's repo access grant — Netlify's GitHub integration has to be
  explicitly pointed at / granted access to the fork, and that connection has
  apparently been dropped or was never (re)established after the fork, even
  though deploys worked as recently as 2026-08-11.
- **Fix requires the user's Netlify dashboard access** (no CLI/API credentials
  available in this session — `npx netlify status` → "Not logged in"): either
  relink the site's "Linked repository" under Site configuration → Build &
  deploy → Continuous deployment, or on GitHub's side add this repo to the
  Netlify GitHub App's repository access list at
  `github.com/settings/installations`.
- **Takeaway**: the 2026-08-11 entry's method (fingerprint live vs. local
  bundle content) is the right first move for *any* "I don't see my changes"
  report — it tells you whether to chase browser cache, CDN cache, or (this
  time) a dead CI/CD trigger. Don't assume the previous incident's specific
  cause repeats; verify from scratch each time.

### 2026-08-13 (later still) — Real root cause was Netlify credit exhaustion; added Cloudflare Pages as second host, now primary
After fixing the GitHub↔Netlify connection above, deploys *still* didn't show
up. Logged into Netlify's billing page directly (`app.netlify.com` → team
`riceuniversityuniv-cmyk` → Billing) and found the actual cause: this is a
personal/free-tier Netlify team, **300 credits/month**, production deploys
cost ~15 credits each, billing cycle Aug 10 → Sep 9 2026. This session's own
debugging (repeated redeploys while chasing the connection issue) burned
20 deploys = 300.7/300 credits, i.e. hit the cap. The 29.8 "operational"
credits left over keep the *already-published* site online but can't fund
new deploys. No payment method on file and user does not want to pay. Netlify
auto-resumes on **2026-09-09** with zero config changes needed — it's a
billing-cycle reset, not a bug.

Decision: rather than wait ~4 weeks with no way to ship changes, set up
**Cloudflare Pages** (`pages.dev`) as a second free host for the same GitHub
repo (`riceuniversityuniv-cmyk/univ154`), and made it the primary/canonical
URL going forward (Netlify is not being actively used, but the connection is
fixed and it will silently start deploying again on its own after Sep 9 —
left as-is, not decommissioned).

- **Live URL: `https://univ154.pages.dev`** — confirmed rendering the login
  page correctly (proves Supabase env vars were baked into the build).
- Setup gotcha #1 — stale GitHub App install: Cloudflare's "Connect GitHub"
  kept bouncing to GitHub's existing app-installation settings page instead
  of completing OAuth, because the "Cloudflare Workers and Pages" GitHub App
  was already installed on `riceuniversityuniv-cmyk` from an earlier
  abandoned attempt. Fix: uninstall at
  `github.com/settings/installations/153510942`, then re-click "Connect
  GitHub" from Cloudflare to trigger a fresh Install & Authorize flow.
- Setup gotcha #2 — wrong Cloudflare product: the newer unified "Create a
  Worker" flow deploys the site as a static-assets-only Worker, which
  **cannot** have environment variables at all ("Variables cannot be added to
  a Worker that only has static assets"). Since Vite needs `VITE_SUPABASE_URL`
  / `VITE_SUPABASE_ANON_KEY` present *at build time* to bake them into the
  bundle, this product path is a dead end for this app. Use the classic
  Cloudflare **Pages** flow instead:
  `dash.cloudflare.com/?to=/:account/pages/new/provider/github` — same repo,
  React (Vite) preset, build command `npm run build`, output dir `dist`, and
  the two `VITE_*` vars added under the Pages project's environment variables.
- Cloudflare Pages free tier: 500 builds/month, 1 concurrent build,
  unlimited bandwidth/requests, no credit-cost-per-deploy system like
  Netlify's — normal push cadence for this project won't come close.
- Supabase itself is unaffected by any of this — it's a separate service the
  built site calls over the network regardless of which host serves the
  static files, so switching hosts changes nothing about student data or
  security (that's governed by Supabase RLS policies, not by which CDN
  serves `index.html`).
