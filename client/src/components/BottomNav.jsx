import { Link, useLocation } from 'react-router-dom';

let tabs = [
  { path: '/', label: 'Dashboard', icon: '🏠' },
  { path: '/shared', label: 'Shared', icon: '👥' },
  { path: '/kirah', label: "Kirah", icon: '💗' },
  { path: '/mo', label: "Mo", icon: '💪🏾' },
  { path: '/debt', label: 'Debt', icon: '💳' },
  { path: '/goals', label: 'Goals', icon: '🎯' }
];

function BottomNav() {
  let location = useLocation();

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: '#161B22',
      borderTop: '1px solid #30363D',
      display: 'flex',
      justifyContent: 'space-around',
      padding: '8px 0',
      zIndex: 100
    }}>
      {tabs.map(tab => {
        let isActive = location.pathname === tab.path;
        return (
          <Link
            key={tab.path}
            to={tab.path}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textDecoration: 'none',
              gap: '2px',
              padding: '4px 8px'
            }}
          >
            <span style={{ fontSize: '20px' }}>{tab.icon}</span>
            <span style={{
              fontSize: '11px',
              fontWeight: isActive ? 'bold' : 'normal',
              background: isActive
                ? 'linear-gradient(135deg, #FFD700, #E6C200)'
                : 'none',
              WebkitBackgroundClip: isActive ? 'text' : 'unset',
              WebkitTextFillColor: isActive ? 'transparent' : '#8B949E',
              backgroundClip: isActive ? 'text' : 'unset'
            }}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export default BottomNav;