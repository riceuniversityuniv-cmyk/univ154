import React, { useState } from 'react';
import { useWeekAccess } from '../contexts/WeekAccessContext';
import { MdPublic, MdCheckCircle, MdCancel, MdWarning } from 'react-icons/md';

// Import the same styles from Week1Budgeting
const styles = {
  // Main table
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
  
  // Table row types
  sectionHeader: { 
    fontWeight: '600',
    backgroundColor: '#f5f5f5',
    color: '#333'
  },
  totalRow: { 
    backgroundColor: '#f5f5f5',
    fontWeight: '600' 
  },

  // Main container
  container: { 
    fontSize: '14px',
    maxWidth: 900, 
    margin: '0 auto', 
    padding: 24, 
    backgroundColor: '#fdfdfd',
    color: '#333'
  },
  
  // Header
  header: { 
    fontSize: '14px', 
    fontWeight: '600',
    margin: '20px 0 10px 0', 
    color: '#333' 
  }
};

export default function WeekAccessAdmin() {
  const { 
    globalWeekSettings,
    updateGlobalWeekSettings,
    bulkUpdateGlobalWeekSettings,
    isAdmin,
    isLoading 
  } = useWeekAccess();
  
  const [selectedWeeks, setSelectedWeeks] = useState([]);
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

  const weekLabels = {
    'week-1': 'Week 1 - Budgeting',
    'week-2': 'Week 2 - Savings & Emergency Funds',
    'week-3': 'Week 3 - Credit & Debt Management',
    'week-4': 'Week 4 - Income & Taxes',
    'week-5': 'Week 5 - Real Estate & Homeownership',
    'week-6': 'Week 6 - Retirement Planning',
    'week-7': 'Week 7 - Insurance',
    'week-9': 'Week 9 - Markets & Investing',
    'week-12': 'Week 12 - Constructing The Goal'
  };

  const handleWeekToggle = (weekId) => {
    setSelectedWeeks(prev => 
      prev.includes(weekId) 
        ? prev.filter(id => id !== weekId)
        : [...prev, weekId]
    );
  };

  const handleSelectAll = () => {
    setSelectedWeeks(Object.keys(weekLabels));
  };

  const handleDeselectAll = () => {
    setSelectedWeeks([]);
  };

  const handleGlobalBulkUpdate = async (isAvailable) => {
    if (selectedWeeks.length === 0) {
      setMessage('Please select at least one week.');
      setMessageType('error');
      return;
    }

    setIsUpdating(true);
    setMessage('');

    try {
      const updates = {};
      selectedWeeks.forEach(weekId => {
        updates[weekId] = isAvailable;
      });

      await bulkUpdateGlobalWeekSettings(updates);
      
      setMessage(`Successfully ${isAvailable ? 'enabled' : 'disabled'} access for ${selectedWeeks.length} week(s) for all users.`);
      setMessageType('success');
      setSelectedWeeks([]);
    } catch (error) {
      setMessage(`Error updating week settings: ${error.message}`);
      setMessageType('error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGlobalIndividualUpdate = async (weekId, isAvailable) => {
    setIsUpdating(true);
    setMessage('');

    try {
      await updateGlobalWeekSettings(weekId, isAvailable);
      setMessage(`Successfully ${isAvailable ? 'enabled' : 'disabled'} access for ${weekLabels[weekId]} for all users.`);
      setMessageType('success');
    } catch (error) {
      setMessage(`Error updating week settings: ${error.message}`);
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
            borderTop: '4px solid #002060',
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#002060', margin: 0 }}>Week Access</h1>
        </div>
      </div>

      {/* Message Display */}
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

      {/* Week Availability Management */}
      <div>
        {/* Bulk Actions */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '12px', 
          justifyContent: 'center',
          marginBottom: '20px'
        }}>
          <button
            onClick={handleSelectAll}
            style={{
              padding: '8px 16px',
              backgroundColor: '#002060',
              color: 'white',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#001a4d'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#002060'}
          >
            Select All
          </button>
          <button
            onClick={handleDeselectAll}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6b7280',
              color: 'white',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#4b5563'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#6b7280'}
          >
            Deselect All
          </button>
          
          {selectedWeeks.length > 0 && (
            <>
              <button
                onClick={() => handleGlobalBulkUpdate(true)}
                disabled={isUpdating}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#059669',
                  color: 'white',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: isUpdating ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  opacity: isUpdating ? 0.5 : 1,
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => !isUpdating && (e.target.style.backgroundColor = '#047857')}
                onMouseOut={(e) => !isUpdating && (e.target.style.backgroundColor = '#059669')}
              >
                {isUpdating ? 'Updating...' : `Enable Access (${selectedWeeks.length})`}
              </button>
              <button
                onClick={() => handleGlobalBulkUpdate(false)}
                disabled={isUpdating}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: isUpdating ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  opacity: isUpdating ? 0.5 : 1,
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => !isUpdating && (e.target.style.backgroundColor = '#b91c1c')}
                onMouseOut={(e) => !isUpdating && (e.target.style.backgroundColor = '#dc2626')}
              >
                {isUpdating ? 'Updating...' : `Disable Access (${selectedWeeks.length})`}
              </button>
            </>
          )}
        </div>

        {/* Week Table */}
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{...styles.th, width: '50px'}}>Select</th>
              <th style={{...styles.th, textAlign: 'left'}}>Week</th>
              <th style={{...styles.th, width: '150px'}}>Status</th>
              <th style={{...styles.th, width: '200px'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(weekLabels).map(([weekId, label]) => {
              const isGloballyAvailable = globalWeekSettings[weekId]?.isAvailable ?? false;
              return (
                <tr key={weekId}>
                  <td style={{...styles.td, textAlign: 'center'}}>
                    <input
                      type="checkbox"
                      checked={selectedWeeks.includes(weekId)}
                      onChange={() => handleWeekToggle(weekId)}
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: '#002060'
                      }}
                    />
                  </td>
                  <td style={{...styles.td, textAlign: 'left'}}>
                    <div style={{ fontWeight: '500', color: '#002060' }}>{label}</div>
                  </td>
                  <td style={{...styles.td, textAlign: 'center'}}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      ...(isGloballyAvailable
                        ? { backgroundColor: '#dcfce7', color: '#166534' }
                        : { backgroundColor: '#fee2e2', color: '#dc2626' }
                      )
                    }}>
                      {isGloballyAvailable ? 'Access Enabled' : 'Access Disabled'}
                    </span>
                  </td>
                  <td style={{...styles.td, textAlign: 'center'}}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleGlobalIndividualUpdate(weekId, true)}
                        disabled={isUpdating || isGloballyAvailable}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#059669',
                          color: 'white',
                          borderRadius: '4px',
                          border: 'none',
                          cursor: (isUpdating || isGloballyAvailable) ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                          opacity: (isUpdating || isGloballyAvailable) ? 0.5 : 1,
                          transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => !(isUpdating || isGloballyAvailable) && (e.target.style.backgroundColor = '#047857')}
                        onMouseOut={(e) => !(isUpdating || isGloballyAvailable) && (e.target.style.backgroundColor = '#059669')}
                      >
                        Enable
                      </button>
                      <button
                        onClick={() => handleGlobalIndividualUpdate(weekId, false)}
                        disabled={isUpdating || !isGloballyAvailable}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#dc2626',
                          color: 'white',
                          borderRadius: '4px',
                          border: 'none',
                          cursor: (isUpdating || !isGloballyAvailable) ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                          opacity: (isUpdating || !isGloballyAvailable) ? 0.5 : 1,
                          transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => !(isUpdating || !isGloballyAvailable) && (e.target.style.backgroundColor = '#b91c1c')}
                        onMouseOut={(e) => !(isUpdating || !isGloballyAvailable) && (e.target.style.backgroundColor = '#dc2626')}
                      >
                        Disable
                      </button>
                    </div>
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