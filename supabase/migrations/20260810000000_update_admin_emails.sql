-- Replace the original (Beyza's team's) hardcoded admin emails with this
-- instance's own admin account across all three admin-gated RLS policies.
-- See docs/univ154-migration.md.

DROP POLICY IF EXISTS "Admins can manage week access" ON week_access;
CREATE POLICY "Admins can manage week access" ON week_access
    FOR ALL USING (
        auth.jwt() ->> 'email' IN (
            'riceuniversityuniv@gmail.com'
        )
    );

DROP POLICY IF EXISTS "Admins can manage global week settings" ON global_week_settings;
CREATE POLICY "Admins can manage global week settings" ON global_week_settings
    FOR ALL USING (
        auth.jwt() ->> 'email' IN (
            'riceuniversityuniv@gmail.com'
        )
    );

DROP POLICY IF EXISTS "Admins can manage all registrations" ON registered_users;
CREATE POLICY "Admins can manage all registrations" ON registered_users
    FOR ALL USING (
        auth.jwt() ->> 'email' IN (
            'riceuniversityuniv@gmail.com'
        )
    );
