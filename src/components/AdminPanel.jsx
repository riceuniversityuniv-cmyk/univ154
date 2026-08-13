import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useWeekAccess } from '../contexts/WeekAccessContext';
import { MdWarning } from 'react-icons/md';

// Tab shell for the Admin section: Week Access / Manage Admins / Assumptions,
// each rendered via nested routes (<Outlet/>). Real tabs, replacing the
// earlier single-stacked-page layout -- reinstated because the Assumptions
// tab is bulky (FICA/federal/LTCG scalars, a 49-row RMD divisor table, and
// 51 jurisdictions' worth of state brackets), so one long scrolling page no
// longer made sense once it was added. See docs/univ154-migration.md.
//
// Gates on the *effective* admin flag from WeekAccessContext (not
// useAuth().isAdmin directly) so this page -- and everything nested under
// it -- correctly locks out while "Preview as Student" is on.

const tabs = [
  { path: '/dashboard/admin/week-access', label: 'Week Access' },
  { path: '/dashboard/admin/manage', label: 'Manage Admins' },
  { path: '/dashboard/admin/assumptions', label: 'Assumptions' },
];

const tabBarStyle = {
  display: 'flex',
  gap: '8px',
  justifyContent: 'center',
  borderBottom: '2px solid #e0e0e0',
  marginBottom: '32px',
};

const tabStyle = ({ isActive }) => ({
  padding: '18px 36px',
  fontSize: '20px',
  fontWeight: '700',
  color: isActive ? '#002060' : '#6b7280',
  borderBottom: isActive ? '4px solid #002060' : '4px solid transparent',
  marginBottom: '-2px',
  textDecoration: 'none',
  transition: 'color 0.2s',
});

export default function AdminPanel() {
  const { isAdmin } = useWeekAccess();

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
      <nav style={tabBarStyle}>
        {tabs.map((tab) => (
          <NavLink key={tab.path} to={tab.path} style={tabStyle}>
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
