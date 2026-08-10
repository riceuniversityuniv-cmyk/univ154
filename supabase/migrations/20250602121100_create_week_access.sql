-- Create week_access table to manage student access to different weeks
CREATE TABLE IF NOT EXISTS week_access (
    id SERIAL PRIMARY KEY,
    user_email TEXT NOT NULL,
    week_id TEXT NOT NULL,
    is_available BOOLEAN DEFAULT FALSE,
    release_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_email, week_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_week_access_user_email ON week_access(user_email);
CREATE INDEX IF NOT EXISTS idx_week_access_week_id ON week_access(week_id);

-- NOTE: Original upstream migration backfilled week-1 access for existing
-- users via `SELECT ... FROM user_profiles`, but no migration in this repo
-- ever creates a `user_profiles` table (the real table is `registered_users`).
-- Removed here since this is a fresh database with no existing users to
-- backfill anyway. See docs/univ154-migration.md.

-- Enable RLS (Row Level Security)
ALTER TABLE week_access ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can only see their own week access
CREATE POLICY "Users can view their own week access" ON week_access
    FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

-- Only admins can insert/update week access
CREATE POLICY "Admins can manage week access" ON week_access
    FOR ALL USING (
        auth.jwt() ->> 'email' IN (
            'riceuniversityuniv@gmail.com'
        )
    );

-- Create function to automatically create week access for new users
CREATE OR REPLACE FUNCTION create_default_week_access()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert week 1 access for new user
    INSERT INTO week_access (user_email, week_id, is_available, release_date)
    VALUES (NEW.email, 'week-1', true, NOW());
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new user registrations
-- NOTE: original upstream migration fired this off a nonexistent
-- `user_profiles` table; real signups insert into Supabase's `auth.users`
-- (see the on_auth_user_created trigger in the registered_users migration),
-- so that's what this fires off instead.
DROP TRIGGER IF EXISTS create_week_access_on_user_registration ON auth.users;
CREATE TRIGGER create_week_access_on_user_registration
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_week_access();