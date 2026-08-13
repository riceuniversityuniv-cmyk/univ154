-- Add an admin-editable display order to global_week_settings so the
-- Week Access admin screen can control what position each week/module
-- appears in on the student-facing sidebar (previously a hardcoded
-- array in Option3_Minimalist.jsx).

ALTER TABLE global_week_settings
    ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- Backfill with the order the sidebar has always rendered in, so this
-- migration is a no-op visually until an admin changes anything.
UPDATE global_week_settings SET display_order = CASE week_id
    WHEN 'week-1'  THEN 1
    WHEN 'week-2'  THEN 2
    WHEN 'week-3'  THEN 3
    WHEN 'week-4'  THEN 4
    WHEN 'week-6'  THEN 5
    WHEN 'week-9'  THEN 6
    WHEN 'week-12' THEN 7
    WHEN 'week-7'  THEN 8
    WHEN 'week-5'  THEN 9
    ELSE 99
END
WHERE display_order IS NULL;
