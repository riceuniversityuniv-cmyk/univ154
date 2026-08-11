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
    AdminSettingsPanel.jsx    Admin UI for managing admins themselves (add/remove
                               admins, transfer master admin) -- see gating rules below
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
    adminApi.js                 Supabase calls for the `admins` roles table (see
                                 gating rules below) -- replaced adminEmails.js
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

## Status as of end of 2026-08-11 session
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
