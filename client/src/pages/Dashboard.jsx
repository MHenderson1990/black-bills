import { useState, useEffect } from 'react';
import { getNextPayDate, getRecentPayDate, getAllBills, getHouseholdMembers, getSpendingHousehold } from '../services/api';
import { formatDate } from '../constants';
import NotesSection from '../components/dashboard/NotesSection';
import SpendingChart from '../components/dashboard/SpendingChart';
import UpcomingBills from '../components/dashboard/UpcomingBills';
import PayDateCard from '../components/dashboard/PayDateCard';
import PayPeriodCard from '../components/dashboard/PayPeriodCard';


function Dashboard() {
  let [nextPayDate, setNextPayDate] = useState(null);
  let [periodStart, setPeriodStart] = useState(null);
  let [periodEnd, setPeriodEnd] = useState(null);
  let [spending, setSpending] = useState({});
  let [bills, setBills] = useState([]);
  let [loading, setLoading] = useState(true);
  let userId = localStorage.getItem('userId');
  let householdId = localStorage.getItem('householdId');
  let [members, setMembers] = useState([]);

  async function fetchData() {
    try {
      let nextRes = await getNextPayDate(userId);
      let recentRes = await getRecentPayDate(userId);
      let membersRes = await getHouseholdMembers(householdId);
      setMembers(membersRes.data);

      setNextPayDate(nextRes.data.nextPayDate);
      setPeriodStart(recentRes.data.recentPayDate);
      setPeriodEnd(recentRes.data.periodEnd);

      let monthStart = new Date();
      monthStart.setDate(1);
      let monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
      let fmt = (d) => d.toISOString().split('T')[0];

      let spendingRes = await getSpendingHousehold(householdId, fmt(monthStart), fmt(monthEnd));
      setSpending(spendingRes.data);

      let billsRes = await getAllBills(householdId);
      setBills(billsRes.data);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(function() {
    fetchData();
  }, []);

  async function handlePayDateSaved() {
    setLoading(true);
    await fetchData();
  }

  if (loading) return <p style={{ padding: '40px', color: '#fff', background: '#0D1117', minHeight: '100vh' }}>Loading...</p>;

  return (
    <div style={{ background: '#0D1117', minHeight: '100vh' }}>
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
          onClick={function() {
            if (window.confirm('Log out of BlackBills?')) {
              localStorage.clear();
              window.location.href = '/';
            }
          }}
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

      <div style={{ padding: 'clamp(16px, 4vw, 32px)', paddingBottom: '180px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <PayDateCard nextPayDate={nextPayDate} onSaved={handlePayDateSaved} />
          <PayPeriodCard periodStart={periodStart} periodEnd={periodEnd} />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          <UpcomingBills bills={bills} members={members} />
          <SpendingChart spending={spending} />
        </div>
      </div>
    <NotesSection householdId={householdId} userId={userId} members={members} />
    </div>
  
  );
}

export default Dashboard;