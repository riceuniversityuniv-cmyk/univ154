# UNIV154 Financial Literacy Tool — Reference & Working Log

Rice UNIV154 course tool: React/Vite SPA + Supabase backend. Originally built by
Beyza Ispir under her personal accounts; being consolidated onto Rice's own
GitHub/Supabase/Netlify so the course doesn't depend on a former student's
personal accounts.

## Current architecture (as of 2026-08-11)

| Layer | Where | Notes |
|---|---|---|
| Code | `github.com/riceuniversityuniv-cmyk/univ154` | Fork of `beyzaispiir/univ154`. `riceuniversityuniv-cmyk` has admin/push access. Fork relationship is cosmetic only (GitHub "forked from" label) — no functional impact, not worth detaching (needs a GitHub Support ticket). |
| Hosting | Netlify site → `https://riceuniv154.netlify.app` | Auto-deploys from `main` on push. Confirmed live (bundle contains the current admin email string). |
| Backend | Supabase project ref `zyznmhbtpniluhkyowbb` (`https://zyznmhbtpniluhkyowbb.supabase.co`) | The live, correct backend. Fresh project created during the migration — **not** the same project the app originally used. |
| Local dev | `.env.local` (gitignored) with `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` pointed at the project above | Anon/publishable key extracted from the live bundle (`sb_publishable_...` format) since it's safe for client-side use. |

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
