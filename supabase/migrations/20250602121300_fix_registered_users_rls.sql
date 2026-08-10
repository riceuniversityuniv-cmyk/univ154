-- Fix RLS policies for registered_users table
-- Enable RLS
ALTER TABLE registered_users ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can view their own registration
CREATE POLICY "Users can view their own registration" ON registered_users
    FOR SELECT USING (auth.jwt() ->> 'email' = email);

-- Users can insert their own registration (for signup)
CREATE POLICY "Users can insert their own registration" ON registered_users
    FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = email);

-- Only admins can update/delete registrations
CREATE POLICY "Admins can manage all registrations" ON registered_users
    FOR ALL USING (
        auth.jwt() ->> 'email' IN (
            'riceuniversityuniv@gmail.com'
        )
    );

-- Grant necessary permissions (these should already exist but ensuring they're correct)
GRANT SELECT ON registered_users TO anon;
GRANT INSERT ON registered_users TO anon;
GRANT SELECT ON registered_users TO authenticated;
GRANT INSERT ON registered_users TO authenticated;
