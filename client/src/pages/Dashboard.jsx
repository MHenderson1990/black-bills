import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getNextPayDate, getRecentPayDate, getSpendingByCategory, getAllBills } from '../services/api';

let CATEGORY_GRADIENTS = [
  ['#1DB954', '#107C41'],
  ['#FFD700', '#E6C200'],
  ['#7A9A6E', '#5C7A52'],
  ['#D4AF37', '#B8941F'],
  ['#5C8A3A', '#3E6B2F'],
  ['#B8860B', '#9A6F08'],
  ['#3E6B2F', '#2A4D20'],
  ['#C9A227', '#A8851C']
];

function Dashboard() {
  let [nextPayDate, setNextPayDate] = useState(null);
  let [periodStart, setPeriodStart] = useState(null);
  let [periodEnd, setPeriodEnd] = useState(null);
  let [spending, setSpending] = useState({});
  let [bills, setBills] = useState([]);
  let [loading, setLoading] = useState(true);

  let userId = localStorage.getItem('userId');
  let householdId = localStorage.getItem('householdId');

  useEffect(function() {
    async function fetchData() {
      try {
        let nextRes = await getNextPayDate(userId);
        let recentRes = await getRecentPayDate(userId);

        setNextPayDate(nextRes.data.nextPayDate);
        setPeriodStart(recentRes.data.recentPayDate);
        setPeriodEnd(recentRes.data.periodEnd);

        if (recentRes.data.recentPayDate && recentRes.data.periodEnd) {
          let spendingRes = await getSpendingByCategory(
            userId,
            recentRes.data.recentPayDate,
            recentRes.data.periodEnd
          );
          setSpending(spendingRes.data);
        }

        let billsRes = await getAllBills(householdId);
        setBills(billsRes.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  let pieData = Object.keys(spending).map(category => ({
    name: category,
    value: spending[category]
  }));

  let upcomingBills = bills
    .filter(bill => !bill.paid && bill.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 6);

  function getBillStyle(bill) {
    if (bill.isShared) {
      return {
        background: 'linear-gradient(135deg, #5c4a00, #3d3000)',
        accent: 'linear-gradient(135deg, #FFD700, #E6C200)'
      };
    }
    if (bill.owner === userId) {
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

  if (loading) return <p style={{ padding: '40px', color: '#fff', background: '#0D1117', minHeight: '100vh' }}>Loading...</p>;

  return (
    <div style={{ background: '#0D1117', minHeight: '100vh' }}>
      <div style={{
        background: '#161B22',
        borderBottom: '1px solid #30363D',
        padding: '32px'
      }}>
        <h1 style={{
          fontSize: '28px',
          margin: 0,
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #FFD700, #E6C200)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          BlackBills Dashboard
        </h1>
      </div>

      <div style={{ padding: '32px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <div style={{
            background: '#161B22',
            border: '1px solid #1DB95433',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 12px rgba(29,185,84,0.08)'
          }}>
            <p style={{ color: '#8B949E', fontSize: '13px', marginBottom: '6px' }}>Next Pay Date</p>
            <p style={{
              fontWeight: 'bold',
              fontSize: '20px',
              background: 'linear-gradient(135deg, #1DB954, #5C8A3A)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              {nextPayDate ? new Date(nextPayDate).toLocaleDateString() : 'Not set'}
            </p>
          </div>

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
                ? `${new Date(periodStart).toLocaleDateString()} - ${new Date(periodEnd).toLocaleDateString()}`
                : 'Not set'}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ background: '#161B22', padding: '24px', borderRadius: '12px', border: '1px solid #30363D' }}>
            <h2 style={{ fontSize: '16px', marginBottom: '16px', color: '#E8F5E9' }}>Upcoming Bills</h2>
            {upcomingBills.length === 0 ? (
              <p style={{ color: '#8B949E' }}>No upcoming bills</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {upcomingBills.map(bill => {
                  let style = getBillStyle(bill);
                  return (
                    <div key={bill._id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 16px',
                      borderRadius: '10px',
                      background: style.background
                    }}>
                      <div>
                        <p style={{
                          fontWeight: 'bold',
                          fontSize: '15px',
                          background: style.accent,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}>
                          {bill.name}
                        </p>
                        <p style={{ color: '#cfcfcf', fontSize: '12px' }}>
                          {new Date(bill.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <p style={{
                        fontWeight: 'bold',
                        fontSize: '16px',
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

          <div style={{ background: '#161B22', padding: '24px', borderRadius: '12px', border: '1px solid #30363D' }}>
            <h2 style={{ fontSize: '16px', marginBottom: '16px', color: '#E8F5E9' }}>Spending By Category</h2>
            {pieData.length === 0 ? (
              <p style={{ color: '#8B949E' }}>No spending data for this period</p>
            ) : (
              <>
                <svg width="0" height="0">
                  <defs>
                    {pieData.map((entry, index) => {
                      let [start, end] = CATEGORY_GRADIENTS[index % CATEGORY_GRADIENTS.length];
                      return (
                        <linearGradient key={index} id={`pieGrad${index}`} x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor={start} />
                          <stop offset="100%" stopColor={end} />
                        </linearGradient>
                      );
                    })}
                  </defs>
                </svg>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={{ fill: '#E8F5E9' }}>
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={`url(#pieGrad${index})`} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#161B22', border: '1px solid #30363D', color: '#fff' }} />
                    <Legend wrapperStyle={{ color: '#E8F5E9' }} />
                  </PieChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;