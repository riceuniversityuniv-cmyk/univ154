import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWeekAccess } from '../contexts/WeekAccessContext';
import {
  fetchAllAdmins,
  fetchAllRegisteredUsers,
  addAdmin,
  removeAdmin,
  transferMasterAdmin,
} from '../utils/adminApi';
import { MdCheckCircle, MdCancel, MdWarning, MdDelete, MdPersonAdd, MdSwapHoriz, MdStar } from 'react-icons/md';

// Same styling pattern as WeekAccessAdmin.jsx, for visual consistency
// between the two admin pages.
const styles = {
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
    marginTop: 20,
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #e0e0e0'
  },
  th: {
    backgroundColor: '#002060',
    color: 'white',
    padding: '12px',
    borderBottom: '1px solid #e0e0e0',
    textAlign: 'center',
    fontWeight: '600'
  },
  td: {
    border: '1px solid #e0e0e0',
    padding: '10px 12px',
    verticalAlign: 'middle'
  },
  container: {
    fontSize: '14px',
    maxWidth: 900,
    margin: '0 auto',
    padding: 24,
    backgroundColor: '#fdfdfd',
    color: '#333'
  },
  section: {
    marginTop: '32px',
    padding: '20px',
    backgroundColor: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
  },
  sectionHeader: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#002060',
    marginBottom: '12px',
  },
  input: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #d0d0d0',
    fontSize: '14px',
    flex: 1,
    minWidth: '220px',
  },
  primaryButton: {
    padding: '8px 16px',
    backgroundColor: '#002060',
    color: 'white',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  dangerButton: {
    padding: '6px 12px',
    backgroundColor: '#dc2626',
    color: 'white',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
  },
};

const roleBadge = (role) => (
  <span style={{
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    ...(role === 'master_admin'
      ? { backgroundColor: '#fef3c7', color: '#92400e' }
      : { backgroundColor: '#dbeafe', color: '#1e40af' })
  }}>
    {role === 'master_admin' && <MdStar style={{ fontSize: '14px' }} />}
    {role === 'master_admin' ? 'Master Admin' : 'Admin'}
  </span>
);

export default function AdminSettingsPanel() {
  const { user, isMasterAdmin, refreshAdminStatus } = useAuth();
  // Effective admin flag (respects "Preview as Student"), not the raw
  // useAuth().isAdmin -- also already gated one level up by AdminPanel.jsx,
  // this is defense in depth. See WeekAccessContext / AdminPanel.jsx.
  const { isAdmin } = useWeekAccess();

  const [admins, setAdmins] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [transferTargetEmail, setTransferTargetEmail] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [adminRows, userRows] = await Promise.all([
        fetchAllAdmins(),
        fetchAllRegisteredUsers(),
      ]);
      setAdmins(adminRows);
      setRegisteredUsers(userRows);
    } catch (error) {
      console.error('Error loading admin settings data:', error);
      setMessage(`Error loading data: ${error.message}`);
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, loadData]);

  if (!isAdmin) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <MdWarning style={{ fontSize: '48px', color: '#ef4444', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444', marginBottom: '16px' }}>Access Denied</h2>
          <p style={{ color: '#666' }}>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const adminEmailSet = new Set(admins.map((a) => a.email));
  const nonAdminUsers = registeredUsers.filter((u) => !adminEmailSet.has(u.email?.toLowerCase()));
  // Anyone already an admin is eligible to receive master admin, plus every
  // other registered user (transfer is allowed to any registered user).
  const transferCandidates = registeredUsers.filter((u) => u.email?.toLowerCase() !== user?.email?.toLowerCase());

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    const email = newAdminEmail.trim().toLowerCase();
    if (!email) return;

    setIsUpdating(true);
    setMessage('');
    try {
      await addAdmin(email, user?.email);
      setMessage(`${email} is now an admin.`);
      setMessageType('success');
      setNewAdminEmail('');
      await loadData();
    } catch (error) {
      setMessage(`Error adding admin: ${error.message}`);
      setMessageType('error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveAdmin = async (email) => {
    const isSelf = email === user?.email?.toLowerCase();
    const confirmed = window.confirm(
      isSelf
        ? 'Remove your own admin access? You will lose access to admin pages.'
        : `Remove admin access for ${email}?`
    );
    if (!confirmed) return;

    setIsUpdating(true);
    setMessage('');
    try {
      await removeAdmin(email);
      setMessage(`Removed admin access for ${email}.`);
      setMessageType('success');
      if (isSelf) {
        await refreshAdminStatus();
      }
      await loadData();
    } catch (error) {
      setMessage(`Error removing admin: ${error.message}`);
      setMessageType('error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTransferMaster = async (e) => {
    e.preventDefault();
    const email = transferTargetEmail.trim().toLowerCase();
    if (!email) return;

    const confirmed = window.confirm(
      `Transfer master admin status to ${email}? You will be demoted to a regular admin.`
    );
    if (!confirmed) return;

    setIsUpdating(true);
    setMessage('');
    try {
      await transferMasterAdmin(email);
      setMessage(`Master admin transferred to ${email}. You are now a regular admin.`);
      setMessageType('success');
      setTransferTargetEmail('');
      await refreshAdminStatus();
      await loadData();
    } catch (error) {
      setMessage(`Error transferring master admin: ${error.message}`);
      setMessageType('error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#002060', margin: 0 }}>Manage Admins</h1>
        </div>
      </div>

      {message && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px',
          ...(messageType === 'success'
            ? { backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }
            : { backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }
          )
        }}>
          {messageType === 'success' ? <MdCheckCircle style={{ fontSize: '20px' }} /> : <MdCancel style={{ fontSize: '20px' }} />}
          <span style={{ fontSize: '14px' }}>{message}</span>
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{
            display: 'inline-block',
            width: '48px',
            height: '48px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #002060',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px'
          }}></div>
          <p style={{ color: '#666' }}>Loading admin data...</p>
        </div>
      ) : (
        <>
          {/* Roster */}
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#002060', marginBottom: '8px', textAlign: 'center' }}>
              Current Admins
            </h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, textAlign: 'left' }}>Email</th>
                  <th style={{ ...styles.th, width: '160px' }}>Role</th>
                  <th style={{ ...styles.th, width: '180px' }}>Granted By</th>
                  <th style={{ ...styles.th, width: '140px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => {
                  const isSelf = admin.email === user?.email?.toLowerCase();
                  const canRemove = admin.role === 'admin' && (isSelf || isMasterAdmin);
                  return (
                    <tr key={admin.email}>
                      <td style={{ ...styles.td, textAlign: 'left' }}>
                        {admin.email}{isSelf && <span style={{ color: '#666' }}> (you)</span>}
                      </td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>{roleBadge(admin.role)}</td>
                      <td style={{ ...styles.td, textAlign: 'center', color: '#666' }}>{admin.granted_by || '—'}</td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        {canRemove && (
                          <button
                            onClick={() => handleRemoveAdmin(admin.email)}
                            disabled={isUpdating}
                            style={{ ...styles.dangerButton, opacity: isUpdating ? 0.5 : 1, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <MdDelete style={{ fontSize: '14px' }} /> {isSelf ? 'Step down' : 'Remove'}
                          </button>
                        )}
                        {admin.role === 'master_admin' && !isSelf && (
                          <span style={{ color: '#999', fontSize: '12px' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add admin -- any admin can do this */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <MdPersonAdd style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Add an Admin
            </div>
            <form onSubmit={handleAddAdmin} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
              <input
                list="non-admin-users"
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="user@rice.edu"
                style={styles.input}
                required
              />
              <datalist id="non-admin-users">
                {nonAdminUsers.map((u) => (
                  <option key={u.email} value={u.email} />
                ))}
              </datalist>
              <button type="submit" disabled={isUpdating} style={{ ...styles.primaryButton, opacity: isUpdating ? 0.5 : 1 }}>
                {isUpdating ? 'Adding...' : 'Add Admin'}
              </button>
            </form>
          </div>

          {/* Transfer master admin -- master only */}
          {isMasterAdmin && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <MdSwapHoriz style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                Transfer Master Admin
              </div>
              <form onSubmit={handleTransferMaster} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
                <input
                  list="transfer-candidates"
                  type="email"
                  value={transferTargetEmail}
                  onChange={(e) => setTransferTargetEmail(e.target.value)}
                  placeholder="user@rice.edu"
                  style={styles.input}
                  required
                />
                <datalist id="transfer-candidates">
                  {transferCandidates.map((u) => (
                    <option key={u.email} value={u.email} />
                  ))}
                </datalist>
                <button
                  type="submit"
                  disabled={isUpdating}
                  style={{ ...styles.dangerButton, padding: '8px 16px', fontSize: '14px', opacity: isUpdating ? 0.5 : 1 }}
                >
                  {isUpdating ? 'Transferring...' : 'Transfer Master Admin'}
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}
