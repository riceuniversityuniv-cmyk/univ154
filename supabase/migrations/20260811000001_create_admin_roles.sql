-- Multi-admin roles: replaces the hardcoded single-admin-email pattern
-- (adminEmails.js array + copy-pasted RLS policy literals) with a real
-- roles table, enforced via RLS, manageable from an in-app Admin Settings
-- screen. See docs/univ154-migration.md.
--
-- Model: exactly one 'master_admin', any number of 'admin'. Any admin can
-- add a new admin. Only the master admin can remove someone else's admin
-- access; any admin (including the master) can remove their own, EXCEPT the
-- master's own row can never be deleted directly -- stepping down must go
-- through transfer_master_admin() below, which is the only path that can
-- ever set role = 'master_admin'. This guarantees there is always exactly
-- one master admin.

CREATE TABLE IF NOT EXISTS admins (
    email TEXT PRIMARY KEY,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'master_admin')),
    granted_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DB-level guarantee (not just app logic) that at most one row can be master.
CREATE UNIQUE INDEX IF NOT EXISTS admins_single_master_admin
    ON admins (role) WHERE role = 'master_admin';

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER helpers: used inside RLS policies (avoids self-referential
-- RLS recursion on the admins table itself) and reusable anywhere an
-- "is this email an admin/master" check is needed.
CREATE OR REPLACE FUNCTION is_admin(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM admins WHERE email = LOWER(check_email)
    );
$$;

CREATE OR REPLACE FUNCTION is_master_admin(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM admins WHERE email = LOWER(check_email) AND role = 'master_admin'
    );
$$;

GRANT EXECUTE ON FUNCTION is_admin(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_master_admin(TEXT) TO authenticated, anon;

-- Policies on admins itself
DROP POLICY IF EXISTS "Admins can view all admins" ON admins;
CREATE POLICY "Admins can view all admins" ON admins
    FOR SELECT USING (is_admin(auth.jwt() ->> 'email'));

-- Any admin can add a new admin, but only ever with role = 'admin' -- there
-- is no INSERT path to master_admin, closing off privilege escalation via a
-- crafted insert.
DROP POLICY IF EXISTS "Admins can add admins" ON admins;
CREATE POLICY "Admins can add admins" ON admins
    FOR INSERT WITH CHECK (
        is_admin(auth.jwt() ->> 'email') AND role = 'admin'
    );

-- Any admin can remove their own row; only the master admin can remove
-- someone else's. The master's own row (role = 'master_admin') never
-- matches this policy, so it can't be deleted directly.
DROP POLICY IF EXISTS "Admins can remove admins" ON admins;
CREATE POLICY "Admins can remove admins" ON admins
    FOR DELETE USING (
        role = 'admin' AND (
            email = LOWER(auth.jwt() ->> 'email')
            OR is_master_admin(auth.jwt() ->> 'email')
        )
    );

-- No UPDATE policy: role changes only ever happen via transfer_master_admin()
-- below (SECURITY DEFINER, bypasses RLS).

-- Transfer master-admin status to any registered user, demoting the caller
-- to a regular admin. Guarantees exactly one master admin at all times.
CREATE OR REPLACE FUNCTION transfer_master_admin(new_master_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    caller_email TEXT := LOWER(auth.jwt() ->> 'email');
    target_email TEXT := LOWER(new_master_email);
BEGIN
    IF NOT is_master_admin(caller_email) THEN
        RAISE EXCEPTION 'Only the master admin can transfer master admin status';
    END IF;

    IF target_email = caller_email THEN
        RAISE EXCEPTION 'You are already the master admin';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM registered_users WHERE email = target_email) THEN
        RAISE EXCEPTION 'Target user must be a registered user';
    END IF;

    UPDATE admins SET role = 'admin' WHERE email = caller_email;

    INSERT INTO admins (email, role, granted_by)
    VALUES (target_email, 'master_admin', caller_email)
    ON CONFLICT (email) DO UPDATE SET role = 'master_admin', granted_by = caller_email;
END;
$$;

GRANT EXECUTE ON FUNCTION transfer_master_admin(TEXT) TO authenticated;

-- Swap the hardcoded single-admin-email literal in the three existing
-- admin-gated policies for the new roles-table check. Same pattern as
-- 20260810000000_update_admin_emails.sql, but pointed at is_admin() instead
-- of a literal list, so future admin changes no longer require a migration.
DROP POLICY IF EXISTS "Admins can manage week access" ON week_access;
CREATE POLICY "Admins can manage week access" ON week_access
    FOR ALL USING (is_admin(auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "Admins can manage global week settings" ON global_week_settings;
CREATE POLICY "Admins can manage global week settings" ON global_week_settings
    FOR ALL USING (is_admin(auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "Admins can manage all registrations" ON registered_users;
CREATE POLICY "Admins can manage all registrations" ON registered_users
    FOR ALL USING (is_admin(auth.jwt() ->> 'email'));

-- Seed: km108@rice.edu is master admin; the prior sole admin
-- (riceuniversityuniv@gmail.com) is kept on as a regular admin rather than
-- dropped. See docs/univ154-migration.md working log for context.
INSERT INTO admins (email, role, granted_by) VALUES
    ('km108@rice.edu', 'master_admin', NULL),
    ('riceuniversityuniv@gmail.com', 'admin', 'km108@rice.edu')
ON CONFLICT (email) DO NOTHING;
