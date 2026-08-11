# Design: Combined Admin page + "Preview as Student" toggle

Date: 2026-08-11
Status: Approved

## Problem

The sidebar currently shows two separate admin links — "Admin Panel"
(`/dashboard/admin/week-access`, week unlock controls) and "Admin Settings"
(`/dashboard/admin/settings`, admin roster management). The user wants these
combined into a single section, plus a way for an admin to see the app the
way a regular (non-admin) user/viewer sees it, without actually losing admin
rights.

## Goals

1. One sidebar entry for admin functionality instead of two.
2. A way for an admin to toggle into "student view" and back, from anywhere
   in the app, without signing out or using a second account.

## Non-goals

- No changes to the underlying permission model (RLS, `admins` table,
  `is_admin()`/`is_master_admin()`, `transfer_master_admin()`). This is a
  client-side rendering concern only.
- No new roles or permission levels.
- No persistence of preview state across page reloads (see Decision below).

## Design

### 1. Combined Admin page

- New wrapper component `src/components/AdminPanel.jsx`: renders a small tab
  header ("Week Access" / "Manage Admins") and an `<Outlet/>` for the active
  tab's content. Gates on the effective admin flag (see §3) — shows the
  existing "Access Denied" state if false, otherwise renders the tab UI.
- Routing (`App.jsx`), nested under the existing `/dashboard/*` tree:
  ```
  admin                      -> <AdminPanel/>
    index                    -> redirect to "week-access"
    week-access               -> <WeekAccessAdmin/>   (unchanged component)
    manage                    -> <AdminSettingsPanel/> (unchanged component,
                                                          renamed route from
                                                          "settings" to "manage"
                                                          to match the tab label
                                                          — no external links
                                                          reference the old URL)
  ```
- `WeekAccessAdmin.jsx` and `AdminSettingsPanel.jsx` themselves are NOT
  merged/rewritten — they keep their existing internals. Only their access
  gate source changes for `AdminSettingsPanel` (see §3).
- Sidebar (`Option3_Minimalist.jsx`): the two `SidebarLink`s for
  "Admin Panel" / "Admin Settings" become one link, text **"Admin"**,
  `href="/dashboard/admin/week-access"`.
- `SidebarLink`'s active-match (`Dashboard.jsx`) needs a special case again
  for this one link: active whenever `location.pathname.startsWith('/dashboard/admin')`,
  not just exact match (safe now that there's only one admin link, unlike
  the two-link case that active-match was previously simplified away from).

### 2. "Preview as Student" toggle

- New state in `DashboardContent` (`Dashboard.jsx`, the component that
  already computes real `isAdmin` from `useAuth()` and wraps everything in
  `WeekAccessProvider`): `previewAsStudent` (boolean, `useState(false)`).
- `effectiveIsAdmin = isAdmin && !previewAsStudent`. This is what gets
  passed to `WeekAccessProvider`'s `isAdmin` prop (replacing the raw
  `isAdmin`) and down to `DashboardContentInner` for sidebar rendering.
- The real `isAdmin` (unaffected by the toggle) is passed down separately
  so the toggle control itself is only ever shown to actual admins, and
  stays clickable regardless of current preview state.
- Sidebar (`Option3_Minimalist.jsx`): new toggle switch in the bottom
  profile area (near the existing "Hide sidebar" checkbox / Logout button),
  rendered only when the real admin flag is true. Label: **"Preview as
  Student"**. Standard on/off switch, no confirmation dialog needed (fully
  reversible, no data changes).
- Turning the toggle **on** while currently on an `/dashboard/admin/*`
  route navigates to `/dashboard/excel/week-1` (the same landing route the
  index redirect already uses) instead of leaving the admin on an
  "Access Denied" page they didn't intend to hit.
- Turning it **off** does not force navigation — just restores admin nav
  and unlocks admin-only content in place.

### 3. Wiring detail: effective vs. real admin flag

- `WeekAccessContext` already takes `isAdmin` as a prop and is the single
  source `WeekAccessAdmin.jsx` and the sidebar's week-lock logic
  (`isWeekAccessible`) read from — so passing `effectiveIsAdmin` instead of
  the raw value automatically makes week-locking and the Week Access tab
  respect preview mode, no additional plumbing needed there.
- `AdminSettingsPanel.jsx`'s own top-of-component access gate currently
  reads `useAuth().isAdmin` directly (the real, un-toggleable value). Change
  it to read the effective value via `useWeekAccess().isAdmin` instead
  (same context, already effective per the point above), so the Manage
  Admins tab is consistently blocked during preview too. `isMasterAdmin`
  and other real-auth reads in that file are untouched (moot once the
  top gate blocks rendering).

### Decision: no persistence of preview state

`previewAsStudent` is plain component state, not written to
`localStorage` (unlike the existing `univ154_sidebar_fixed` flag). A page
reload always starts back in normal Admin view. Rationale: an admin who
refreshes mid-preview and forgets they'd turned it on could otherwise
mistake "I lost admin access" for a real bug. Given how cheap it is to
re-toggle, resetting on reload is the safer default.

## Wording

- Sidebar link: "Admin" (was "Admin Panel" + "Admin Settings")
- Tabs: "Week Access", "Manage Admins" (was "Admin Settings" as a page title)
- Toggle: "Preview as Student"

## Files touched

- `src/App.jsx` — route restructuring under `/dashboard/admin`
- `src/components/AdminPanel.jsx` — new, tab header + `Outlet`
- `src/components/Dashboard.jsx` — `previewAsStudent` state, effective vs.
  real admin flag, prop threading, active-link match special case
- `src/components/sidebar-variants/Option3_Minimalist.jsx` — single "Admin"
  link, new preview toggle control
- `src/components/AdminSettingsPanel.jsx` — access gate source change only
  (`useAuth().isAdmin` → `useWeekAccess().isAdmin`)
- `src/components/WeekAccessAdmin.jsx` — no changes expected (already reads
  effective `isAdmin` via `useWeekAccess()`)

## Testing

- `npm run build` clean.
- Manual/browser click-test (this session has no login credentials for the
  real admin accounts — flag as a follow-up, same as prior admin-roles work):
  sign in as an admin, confirm the single "Admin" link, both tabs render
  their existing content, toggle "Preview as Student" on (nav collapses to
  student view, locked weeks lock, navigates off an admin page if you were
  on one) and off (admin view restored), confirm URLs
  `/dashboard/admin/week-access` and `/dashboard/admin/manage` both work
  directly/on refresh.
