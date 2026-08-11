import React from 'react';
import { useWeekAccess } from '../contexts/WeekAccessContext';
import { MdWarning } from 'react-icons/md';
import WeekAccessAdmin from './WeekAccessAdmin';
import AdminSettingsPanel from './AdminSettingsPanel';

// Shared shell for the combined Admin section: Week Access management
// stacked above Manage Admins, on a single page/route (no tabs). Both keep
// their own internals unchanged.
//
// Gates on the *effective* admin flag from WeekAccessContext (not
// useAuth().isAdmin directly) so this page -- and everything nested under
// it -- correctly locks out while "Preview as Student" is on. See
// docs/superpowers/specs/2026-08-11-admin-consolidation-and-preview-mode-design.md.

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
      <WeekAccessAdmin />
      <AdminSettingsPanel />
    </div>
  );
}
