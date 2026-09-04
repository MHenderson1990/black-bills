import { formatDate } from '../../constants';

function PayPeriodCard({ periodStart, periodEnd }) {
  return (
    <div style={{
      background: '#161B22',
      border: '1px solid #FFD70033',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 2px 12px rgba(255,215,0,0.1)'
    }}>
      <p style={{ color: '#8B949E', fontSize: '13px', marginBottom: '6px' }}>Current Pay Period</p>
      <p style={{
        fontWeight: 'bold',
        fontSize: '16px',
        background: 'linear-gradient(135deg, #FFD700, #E6C200)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        {periodStart && periodEnd
          ? `${formatDate(periodStart)} - ${formatDate(periodEnd)}`
          : 'Not set'}
      </p>
    </div>
  );
}

export default PayPeriodCard;