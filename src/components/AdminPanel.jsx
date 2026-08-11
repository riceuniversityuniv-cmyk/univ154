import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useWeekAccess } from '../contexts/WeekAccessContext';
import { MdWarning } from 'react-icons/md';

// Shared shell for the combined Admin section: a tab header ("Week Access" /
// "Manage Admins") plus an <Outlet/> for whichever tab's route is active.
// WeekAccessAdmin.jsx and AdminSettingsPanel.jsx keep their own internals
// unchanged -- this just replaces the two separate sidebar links/pages with
// one gated shell around both.
//
// Gates on the *effective* admin flag from WeekAccessContext (not
// useAuth().isAdmin directly) so this page -- and everything nested under
// it -- correctly locks out while "Preview as Student" is on. See
// docs/superpowers/specs/2026-08-11-admin-consolidation-and-preview-mode-design.md.

const TABS = [
  { path: '/dashboard/admin/week-access', label: 'Week Access' },
  { path: '/dashboard/admin/manage', label: 'Manage Admins' },
];

export default function AdminPanel() {
  const { isAdmin } = useWeekAccess();
  const location = useLocation();

  if (!isAdmin) {
    return (
      <div style={{ fontSize: '14px', maxWidth: 900, margin: '0 auto', padding: 24, color: '#333' }}>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <MdWarning style={{ fontSize: '48px', color: '#ef4444', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444', marginBottom: '16px' }}>Access Denied</h2>
          <p style={{ color: '#666' }}>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          padding: '24px 24px 0',
        }}
      >
        {TABS.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              style={{
                padding: '10px 20px',
                borderRadius: '10px 10px 0 0',
                fontSize: '14px',
                fontWeight: '600',
                textDecoration: 'none',
                color: isActive ? '#002060' : '#666',
                backgroundColor: isActive ? '#fdfdfd' : 'transparent',
                border: isActive ? '1px solid #e0e0e0' : '1px solid transparent',
                borderBottom: isActive ? '1px solid #fdfdfd' : '1px solid transparent',
                marginBottom: '-1px',
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
      <Outlet />
    </div>
  );
}
