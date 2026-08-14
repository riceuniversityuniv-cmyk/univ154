-- Add an admin-editable "Week N" syllabus number to global_week_settings.
-- Previously this label was derived purely from the weekId string
-- (e.g. 'week-5' -> "Week 5"), with no way for an admin to change it --
-- only the sidebar *position* (display_order) was editable. This is a
-- separate, independent field: display_week_number is the syllabus label
-- shown in the Week Access admin table; display_order is still what
-- controls student-facing sidebar position. See WeekAccessContext.jsx.

ALTER TABLE global_week_settings
    ADD COLUMN IF NOT EXISTS display_week_number INTEGER;

-- Backfill with the number every week's id already implies, so this
-- migration is a no-op visually until an admin changes one.
UPDATE global_week_settings SET display_week_number = CASE week_id
    WHEN 'week-1'  THEN 1
    WHEN 'week-2'  THEN 2
    WHEN 'week-3'  THEN 3
    WHEN 'week-4'  THEN 4
    WHEN 'week-5'  THEN 5
    WHEN 'week-6'  THEN 6
    WHEN 'week-7'  THEN 7
    WHEN 'week-9'  THEN 9
    WHEN 'week-12' THEN 12
    ELSE NULL
END
WHERE display_week_number IS NULL;
