-- Add two new admins per user request 2026-08-17: mk258@rice.edu and
-- mkemp@bowersockcapital.com. The latter's domain isn't one of the normally
-- allowed sign-in domains, so it's also carved into AuthContext.jsx's
-- isValidEmail allow-list (ALLOWED_EXACT_EMAILS) as a one-off exact-address
-- exception rather than opening all of @bowersockcapital.com. See
-- docs/univ154-migration.md working log.
INSERT INTO admins (email, role, granted_by) VALUES
    ('mk258@rice.edu', 'admin', NULL),
    ('mkemp@bowersockcapital.com', 'admin', NULL)
ON CONFLICT (email) DO NOTHING;
