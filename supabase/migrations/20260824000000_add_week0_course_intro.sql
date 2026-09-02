-- Add week-0 (Module 1 "Course Introduction" -- Retirement Income Planner
-- exercise) to global_week_settings, unlocked by default and pinned to
-- sidebar position 1. Run this AFTER the earlier pending migration
-- (20260813000000_add_display_order_to_...) so display_order already
-- exists as a column by the time this INSERT references it.
INSERT INTO global_week_settings (week_id, is_globally_available, release_date, display_order)
VALUES ('week-0', true, NULL, 1)
ON CONFLICT (week_id) DO NOTHING;
