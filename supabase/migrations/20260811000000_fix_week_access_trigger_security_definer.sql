-- Fix "Database error saving new user" on every new signup (Google and
-- email/password alike).
--
-- create_default_week_access() inserts a default week-1 row into week_access
-- from an AFTER INSERT trigger on auth.users, but was missing
-- SECURITY DEFINER (unlike its sibling handle_new_user(), which has it).
-- Without it, the insert ran as the caller (Supabase's internal auth-admin
-- role during signup), which week_access's RLS policies don't grant INSERT
-- to at all (only "Admins can manage week access" and "Users can view their
-- own week access" exist) -- RLS blocked the insert, raised an unhandled
-- exception, and rolled back the entire auth.users insert.
--
-- See docs/univ154-migration.md for the diagnosis.

CREATE OR REPLACE FUNCTION public.create_default_week_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    INSERT INTO week_access (user_email, week_id, is_available, release_date)
    VALUES (NEW.email, 'week-1', true, NOW())
    ON CONFLICT (user_email, week_id) DO NOTHING;

    RETURN NEW;
EXCEPTION
    WHEN others THEN
        RAISE WARNING 'Error inserting default week_access for email %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$function$;
