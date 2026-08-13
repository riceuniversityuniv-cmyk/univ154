import React, { useState } from 'react';
import { useWeekAccess, SUPPORTED_WEEK_IDS, WEEK_TOPIC_LABELS } from '../contexts/WeekAccessContext';
import { MdCheckCircle, MdCancel, MdWarning } from 'react-icons/md';

// Course-week label ("Week 5 - Real Estate & Homeownership") is derived
// from the weekId + the shared topic map -- keeps this in sync with the
// sidebar's topic names instead of duplicating them.
const courseWeekLabel = (weekId) => `Week ${weekId.replace('week-', '')} - ${WEEK_TOPIC_LABELS[weekId] || ''}`;

const styles = {
  container: {
    fontSize: '14px',
    maxWidth: 900,
    margin: '0 auto',
    padding: 24,
    color: '#111827',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderRadius: '16px',
    padding: '8px 8px',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08), 0 4px 16px 0 rgba(0, 0, 0, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    background: 'linear-gradient(135deg, rgba(13, 26, 75, 0.95) 0%, rgba(30, 58, 138, 0.9) 100%)',
    color: 'white',
    padding: '14px 16px',
    textAlign: 'left',
    fontWeight: '600',
    fontSize: '13px',
    letterSpacing: '0.01em',
    border: 'none',
  },
  td: {
    padding: '14px 16px',
    verticalAlign: 'middle',
    border: 'none',
    borderBottom: '1px solid rgba(17, 24, 39, 0.06)',
  },
};

export default function WeekAccessAdmin() {
  const {
    globalWeekSettings,
    getOrderedWeekIds,
    updateGlobalWeekSettings,
    bulkUpdateGlobalWeekSettings,
    bulkUpdateWeekOrder,
    isAdmin,
    isLoading
  } = useWeekAccess();

  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // Check if user is admin
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

  const orderedWeekIds = getOrderedWeekIds();

  const handleToggle = async (weekId, nextAvailable) => {
    setIsUpdating(true);
    setMessage('');
    try {
      await updateGlobalWeekSettings(weekId, nextAvailable);
      setMessage(`${courseWeekLabel(weekId)} is now ${nextAvailable ? 'open' : 'closed'} to students.`);
      setMessageType('success');
    } catch (error) {
      setMessage(`Error updating week settings: ${error.message}`);
      setMessageType('error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEnableAll = async () => {
    setIsUpdating(true);
    setMessage('');
    try {
      const updates = Object.fromEntries(SUPPORTED_WEEK_IDS.map(id => [id, true]));
      await bulkUpdateGlobalWeekSettings(updates);
      setMessage('Opened all weeks to students.');
      setMessageType('success');
    } catch (error) {
      setMessage(`Error updating week settings: ${error.message}`);
      setMessageType('error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDisableAll = async () => {
    setIsUpdating(true);
    setMessage('');
    try {
      const updates = Object.fromEntries(SUPPORTED_WEEK_IDS.map(id => [id, false]));
      await bulkUpdateGlobalWeekSettings(updates);
      setMessage('Closed all weeks to students.');
      setMessageType('success');
    } catch (error) {
      setMessage(`Error updating week settings: ${error.message}`);
      setMessageType('error');
    } finally {
      setIsUpdating(false);
    }
  };

  // Move a week to a new 1-indexed module position; everything between
  // its old and new slot shifts, and the whole list is renumbered 1..n
  // in a single write so positions never collide or gap.
  const handleOrderChange = async (weekId, rawPosition) => {
    const count = orderedWeekIds.length;
    const targetPosition = Math.max(1, Math.min(Math.round(rawPosition) || 1, count));
    const currentIndex = orderedWeekIds.indexOf(weekId);
    if (currentIndex === -1 || targetPosition - 1 === currentIndex) return;

    const reordered = orderedWeekIds.filter(id => id !== weekId);
    reordered.splice(targetPosition - 1, 0, weekId);
    const orderMap = Object.fromEntries(reordered.map((id, idx) => [id, idx + 1]));

    setIsUpdating(true);
    setMessage('');
    try {
      await bulkUpdateWeekOrder(orderMap);
      setMessage(`Moved ${courseWeekLabel(weekId)} to Module ${targetPosition}.`);
      setMessageType('success');
    } catch (error) {
      setMessage(`Error updating module order: ${error.message}`);
      setMessageType('error');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{
            display: 'inline-block',
            width: '48px',
            height: '48px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #0d1a4b',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px'
          }}></div>
          <p style={{ color: '#666' }}>Loading week access data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#0d1a4b', margin: 0 }}>Week Access</h1>
        <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '6px' }}>
          Order sets the module position students see in the sidebar.
        </p>
      </div>

      {/* Message Display */}
      {message && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px',
          ...(messageType === 'success'
            ? { backgroundColor: 'rgba(13, 26, 75, 0.05)', color: '#0d1a4b', border: '1px solid rgba(13, 26, 75, 0.15)' }
            : { backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }
          )
        }}>
          {messageType === 'success' ? <MdCheckCircle style={{ fontSize: '18px' }} /> : <MdCancel style={{ fontSize: '18px' }} />}
          <span style={{ fontSize: '13px' }}>{message}</span>
        </div>
      )}

      {/* Bulk actions -- operate on every week directly, no selection needed */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
        <button
          onClick={handleEnableAll}
          disabled={isUpdating}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#0d1a4b',
            borderRadius: '8px',
            border: '1px solid rgba(13, 26, 75, 0.25)',
            cursor: isUpdating ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontWeight: '500',
            opacity: isUpdating ? 0.5 : 1,
            transition: 'background-color 0.2s',
          }}
          onMouseOver={(e) => !isUpdating && (e.currentTarget.style.backgroundColor = 'rgba(13, 26, 75, 0.06)')}
          onMouseOut={(e) => !isUpdating && (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          Open all weeks
        </button>
        <button
          onClick={handleDisableAll}
          disabled={isUpdating}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#6b7280',
            borderRadius: '8px',
            border: '1px solid rgba(107, 114, 128, 0.3)',
            cursor: isUpdating ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontWeight: '500',
            opacity: isUpdating ? 0.5 : 1,
            transition: 'background-color 0.2s',
          }}
          onMouseOver={(e) => !isUpdating && (e.currentTarget.style.backgroundColor = 'rgba(107, 114, 128, 0.08)')}
          onMouseOut={(e) => !isUpdating && (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          Close all weeks
        </button>
      </div>

      {/* Week Table */}
      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.th, width: '70px', textAlign: 'center' }}>Order</th>
              <th style={styles.th}>Week</th>
              <th style={{ ...styles.th, width: '190px', textAlign: 'center' }}>Open to Students</th>
            </tr>
          </thead>
          <tbody>
            {orderedWeekIds.map((weekId, index) => {
              const isGloballyAvailable = globalWeekSettings[weekId]?.isAvailable ?? false;
              const position = index + 1;
              return (
                <tr key={weekId}>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    <input
                      key={`${weekId}-${position}`}
                      type="number"
                      min={1}
                      max={orderedWeekIds.length}
                      defaultValue={position}
                      disabled={isUpdating}
                      onBlur={(e) => handleOrderChange(weekId, parseInt(e.target.value, 10))}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                      style={{
                        width: '52px',
                        padding: '6px 8px',
                        textAlign: 'center',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#0d1a4b',
                        outline: 'none',
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#0d1a4b'; e.target.style.boxShadow = '0 0 0 2px rgba(13, 26, 75, 0.12)'; }}
                    />
                  </td>
                  <td style={styles.td}>
                    <div style={{ fontWeight: '500', color: '#111827' }}>{courseWeekLabel(weekId)}</div>
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    <label
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', cursor: isUpdating ? 'not-allowed' : 'pointer', userSelect: 'none' }}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggle(weekId, !isGloballyAvailable)}
                        disabled={isUpdating}
                        role="switch"
                        aria-checked={isGloballyAvailable}
                        aria-label={`Toggle access for ${courseWeekLabel(weekId)}`}
                        style={{
                          position: 'relative',
                          display: 'inline-block',
                          width: '42px',
                          height: '23px',
                          borderRadius: '999px',
                          background: isGloballyAvailable ? '#0d1a4b' : '#d1d5db',
                          border: 'none',
                          padding: 0,
                          cursor: isUpdating ? 'not-allowed' : 'pointer',
                          opacity: isUpdating ? 0.6 : 1,
                          transition: 'background 0.2s ease-in-out',
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            top: '3px',
                            left: isGloballyAvailable ? '22px' : '3px',
                            width: '17px',
                            height: '17px',
                            borderRadius: '50%',
                            background: '#ffffff',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                            transition: 'left 0.2s ease-in-out',
                          }}
                        />
                      </button>
                      <span style={{ fontSize: '12px', fontWeight: '500', color: isGloballyAvailable ? '#0d1a4b' : '#9ca3af', minWidth: '38px', textAlign: 'left' }}>
                        {isGloballyAvailable ? 'Open' : 'Closed'}
                      </span>
                    </label>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
