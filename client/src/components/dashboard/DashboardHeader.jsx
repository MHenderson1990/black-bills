function DashboardHeader() {
  function handleLogout() {
    if (window.confirm('Log out of BlackBills?')) {
      localStorage.clear();
      window.location.href = '/';
    }
  }

  return (
    <div style={{
      background: '#161B22',
      borderBottom: '1px solid #30363D',
      padding: 'clamp(16px, 4vw, 32px)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '12px'
    }}>
      <h1 style={{
        fontSize: 'clamp(22px, 5vw, 28px)',
        margin: 0,
        fontWeight: 'bold',
        background: 'linear-gradient(135deg, #FFD700, #E6C200)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        BlackBills Dashboard
      </h1>
      <button
        onClick={handleLogout}
        style={{
          padding: '8px 16px',
          borderRadius: '20px',
          border: '1px solid #30363D',
          background: 'transparent',
          color: '#8B949E',
          fontWeight: 'bold',
          fontSize: '13px',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}
      >
        Log Out
      </button>
    </div>
  );
}

export default DashboardHeader;