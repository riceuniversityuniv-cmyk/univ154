import React from 'react';

const Week11 = () => {
  const styles = {
    container: { minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '20px', maxWidth: '1520px', margin: '0 auto' },
    sectionContainer: { backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '30px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', border: '1px solid #e9ecef' },
    enhancedHeader: { backgroundColor: '#0d1a4b', color: 'white', padding: '20px 24px', borderRadius: '12px', fontWeight: '700', fontSize: '18px', textAlign: 'center', marginBottom: '20px' },
    placeholderContent: { textAlign: 'center', padding: '40px 20px', color: '#666', fontSize: '16px' },
    comingSoon: { fontSize: '24px', fontWeight: '600', color: '#0d1a4b', marginBottom: '16px' },
  };
  return (
    <div style={styles.container}>
      <div style={styles.sectionContainer}>
        <div style={styles.enhancedHeader}><span style={{ fontSize: '26px', letterSpacing: '-0.02em' }}>Onboarding</span></div>
        <div style={styles.placeholderContent}>
          <div style={styles.comingSoon}>Content coming soon</div>
          <p>This module is under development.</p>
        </div>
      </div>
    </div>
  );
};

export default Week11;
