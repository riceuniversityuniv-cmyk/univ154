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
    WeekAccessAdmin.jsx       Admin UI for per-week access control
    Week1Budgeting.jsx, Week1FederalTax.jsx, Week1StateTax.jsx,
    Week1Summary.jsx, Week2Savings.jsx, Week3CreditCard.jsx,
    Week3CreditCardWrapper.jsx, Week4.jsx, Week5.jsx,
    Week6Retirement.jsx, Week7.jsx, Week9.jsx, Week10.jsx,
    Week11.jsx, Week12.jsx    Week modules (note: not all weeks 1-12 are wired
                               into App.jsx's routes — check there before assuming
                               a week is reachable)
    BudgetForm.jsx, SavingsForm.jsx, CalculationDetails.jsx, ExcelWorkshop.jsx,
    ModuleView.jsx, LectureNotes.jsx   Shared building blocks
    pages/Overview.jsx, pages/Analytics.jsx, pages/BudgetPlanner.jsx
    sidebar-variants/Option3_Minimalist.jsx   Design exploration, not routed
  contexts/
    AuthContext.jsx           Supabase auth session, signIn/signUp/signInWithGoogle/
                               signOut/resetPassword, isAdmin (via utils/adminEmails)
    BudgetContext.jsx         Budget calculation state
    WeekAccessContext.jsx     Per-week unlock state (separate from auth — see below)
  lib/
    supabase.js, supabaseClient.js   Two near-identical Supabase client modules;
                               both read VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.
                               Harmless duplication, not worth merging unless touching
                               this area anyway.
  utils/
    adminEmails.js             Client-side admin allowlist (see gating rules below)
    taxCalculator.js
  data/
    taxData.js, stateTaxData.js
  configs/
    week1Config.js, week2Config.js
supabase/migrations/           Applied in order shown by filename timestamp
email-templates/                Supabase auth email HTML (confirmation, magic-link,
                                 reset-password, change-email)
```

## Database schema (Supabase, `supabase/migrations/`)

- `excel_files` — user-uploaded Excel files/content (JSONB), keyed by `user_email`
- `registered_users` — every signed-up user; populated via an `on_auth_user_created`
  trigger on `auth.users` (see `20250602121000_create_registered_users.sql` and the
  `handle_new_user()` function)
- `week_access` — per-user, per-week access override (`is_available`, `release_date`)
- `global_week_settings` — global per-week availability switch (`is_globally_available`,
  `release_date`)
- RLS is enabled on all four tables. Admin-only policies check
  `auth.jwt() ->> 'email' IN (...)` against a **hardcoded list of admin emails baked
  into the SQL policy itself** (see gating rules below).

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
- **Admin status is checked in two separate places that must be kept in sync**:
  1. Client-side: `src/utils/adminEmails.js` (`adminEmails` array) — controls UI (e.g.
     `isAdmin` in `AuthContext`, shows/hides admin nav).
  2. Database-side: RLS policies in `supabase/migrations/20260810000000_update_admin_emails.sql`
     — controls actual write access to `week_access` / `global_week_settings` /
     `registered_users`. **Adding an admin means updating both** — the JS array alone
     doesn't grant DB write access, and vice versa.
  - Current admin: `riceuniversityuniv@gmail.com` (replaced Beyza-era admin list on 2026-08-10).
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
- **In progress**: re-enabling the Google provider in Supabase (via Management API using
  a user-supplied Personal Access Token, to avoid needing an interactive/MFA browser
  login), and creating/wiring a Google Cloud Console OAuth Client if one doesn't already
  exist for this new Supabase project.
