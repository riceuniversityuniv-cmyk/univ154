-- Add week-0 (Module 1 "Course Introduction" -- Retirement Income Planner
-- exercise) to global_week_settings, unlocked by default and pinned to
-- sidebar position 1 / syllabus "Week 1" label. Run this AFTER the two
-- earlier pending migrations (20260814000000_add_display_week_number_to_...
-- and 20260817000000_add_admins_...) so display_order/display_week_number
-- already exist as columns by the time this INSERT references them.
INSERT INTO global_week_settings (week_id, is_globally_available, release_date, display_order, display_week_number)
VALUES ('week-0', true, NULL, 1, 1)
ON CONFLICT (week_id) DO NOTHING;
