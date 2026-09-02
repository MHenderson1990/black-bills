import { formatDate } from '../../constants';

function getBillStyle(bill, members) {
  if (bill.isShared) {
    return {
      background: 'linear-gradient(135deg, #5c4a00, #3d3000)',
      accent: 'linear-gradient(135deg, #FFD700, #E6C200)'
    };
  }
  let ownerName = members.find(m => m._id === bill.owner)?.name;
  if (ownerName === 'Mo') {
    return {
      background: 'linear-gradient(135deg, #0d3a6b, #082849)',
      accent: 'linear-gradient(135deg, #4DA3FF, #0080FF)'
    };
  }
  return {
    background: 'linear-gradient(135deg, #6b1a4a, #4a1233)',
    accent: 'linear-gradient(135deg, #FF8FC7, #FF4DA6)'
  };
}

function UpcomingBills({ bills, members }) {
  let upcomingBills = bills
    .filter(bill => !bill.paid && bill.dueDate && !bill.isSetAside)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 6);

  return (
    <div style={{ background: '#161B22', padding: '20px', borderRadius: '12px', border: '1px solid #30363D' }}>
      <h2 style={{ fontSize: '16px', marginBottom: '16px', color: '#E8F5E9' }}>Upcoming Bills</h2>
      {upcomingBills.length === 0 ? (
        <p style={{ color: '#8B949E' }}>No upcoming bills</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {upcomingBills.map(bill => {
            let style = getBillStyle(bill, members);
            return (
              <div key={bill._id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 16px',
                borderRadius: '10px',
                background: style.background,
                gap: '12px'
              }}>
                 <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <p style={{
                      fontWeight: 'bold',
                      fontSize: '15px',
                      background: style.accent,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      margin: 0
                    }}>
                      {bill.name}
                    </p>
                    {bill.isAutopay && (
                      <span style={{
                        flexShrink: 0,
                        fontSize: '9px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid #FF6B6B',
                        color: '#FF6B6B'
                      }}>
                        Autopay
                      </span>
                    )}
                  </div>
                  <p style={{ color: '#cfcfcf', fontSize: '12px', margin: 0 }}>
                    {formatDate(bill.dueDate)}
                  </p>
                  </div>
                <p style={{
                  fontWeight: 'bold',
                  fontSize: '16px',
                  whiteSpace: 'nowrap',
                  margin: 0,
                  background: style.accent,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  ${bill.amount}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default UpcomingBills;