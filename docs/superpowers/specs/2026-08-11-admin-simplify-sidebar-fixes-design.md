# Design: Simplify Admin section, fix sidebar issues

Date: 2026-08-11

## Problem

The Admin section (`/dashboard/admin`) is currently two tabs ("Week Access" /
"Manage Admins") with a lot of explanatory copy that isn't needed. Separately,
the collapsible sidebar has a click-only requirement violation (hover also
expands/collapses it), a clipped toggle button, and a misaligned/clipped Admin
nav icon.

## Changes

1. **One Admin page, not two tabs.** `AdminPanel.jsx` drops its tab header and
   `<Outlet/>` routing. It renders `<WeekAccessAdmin/>` then
   `<AdminSettingsPanel/>` stacked, in that order, under a single route
   `/dashboard/admin`. `App.jsx`'s `admin/week-access` and `admin/manage`
   routes redirect to `/dashboard/admin` (index) so no stale links 404.

2. **Strip explanatory text.** Remove subtitle taglines, helper paragraphs,
   the "Week ID: week-x" subtext, and the "Instructions:" box in
   `WeekAccessAdmin.jsx` / `AdminSettingsPanel.jsx`. Keep headers, table
   content, buttons, and success/error status messages — those are
   functional, not fluff.

3. **Sidebar Admin icon.** Wrap the Admin link's icon in the same circular
   badge (`Option3_Minimalist.jsx`'s `ModuleIcon` pattern) the module links
   use, so it's visually consistent. Fix the inner `flex-1` span overriding
   the link's `justify-center`, which was left-shifting/clipping the
   icon+label.

4. **Click-only sidebar toggle.** Remove the left-edge hover-trigger strip
   and the sidebar's own mouse-enter/leave auto-show/hide in `Dashboard.jsx`.
   Visibility is driven solely by `sidebarCollapsed` state, changed only by
   the toggle button.

5. **Un-clip the toggle button.** When collapsed, the button sits at
   `left: 0` with `translateX(-50%)`, pushing half of it off-screen.
   Reposition so the full button stays on-screen in both states.

## Out of scope

- No changes to `week_access`/`admins` data model, RLS, or Supabase calls.
- No changes to the "Preview as Student" toggle or "Hide sidebar" checkbox
  behavior beyond removing hover-related copy in its tooltip if it no longer
  applies.

## Verification

`npm run build` clean. No login credentials for real admin accounts in this
session (same constraint as prior sessions per
`docs/univ154-migration.md`) — verified via code inspection + local dev
server render, not a live authenticated click-test.
