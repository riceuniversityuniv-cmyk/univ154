-- Add an admin-editable topic/module name to global_week_settings.
-- Previously the topic shown in both the Week Access admin table and the
-- student-facing sidebar came from a hardcoded WEEK_TOPIC_LABELS object in
-- WeekAccessContext.jsx, with no way for an admin to rename it. This is
-- the persisted override; WEEK_TOPIC_LABELS remains the fallback for any
-- week whose row hasn't been given a custom label yet.
--
-- Replaces the never-applied "Week #" (display_week_number) admin field,
-- which was removed -- it only controlled a syllabus number nobody read,
-- while this controls the actual module name students see.

ALTER TABLE global_week_settings
    ADD COLUMN IF NOT EXISTS display_topic_label TEXT;

-- Backfill with the topic names already in use, so this migration is a
-- no-op visually until an admin renames one. Matches WEEK_TOPIC_LABELS.
UPDATE global_week_settings SET display_topic_label = CASE week_id
    WHEN 'week-0'  THEN 'Course Introduction'
    WHEN 'week-1'  THEN 'Budgeting'
    WHEN 'week-2'  THEN 'Savings & Emergency Funds'
    WHEN 'week-3'  THEN 'Credit & Debt Management'
    WHEN 'week-4'  THEN 'Income & Taxes'
    WHEN 'week-5'  THEN 'Real Estate & Homeownership'
    WHEN 'week-6'  THEN 'Retirement Planning'
    WHEN 'week-7'  THEN 'Insurance'
    WHEN 'week-9'  THEN 'Markets & Investing'
    WHEN 'week-12' THEN 'Constructing The Goal'
    ELSE NULL
END
WHERE display_topic_label IS NULL;
