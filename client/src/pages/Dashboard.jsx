import { useState, useEffect } from 'react';
import { getNextPayDate, getRecentPayDate, getAllBills, updatePayAnchorDate, getHouseholdMembers, getSpendingHousehold } from '../services/api';
import { formatDate } from '../constants';
import NotesSection from '../components/dashboard/NotesSection';
import SpendingChart from '../components/dashboard/SpendingChart';


function Dashboard() {
  let [nextPayDate, setNextPayDate] = useState(null);
  let [periodStart, setPeriodStart] = useState(null);
  let [periodEnd, setPeriodEnd] = useState(null);
  let [spending, setSpending] = useState({});
  let [bills, setBills] = useState([]);
  let [loading, setLoading] = useState(true);

  let [editingPayDate, setEditingPayDate] = useState(false);
  let [payDateInput, setPayDateInput] = useState('');
  let [saving, setSaving] = useState(false);

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

  async function handleSavePayDate() {
    if (!payDateInput) return;
    setSaving(true);
    try {
      await updatePayAnchorDate(payDateInput);
      setEditingPayDate(false);
      setPayDateInput('');
      setLoading(true);
      await fetchData();
    } catch (error) {
      console.error(error);
      alert('Failed to save pay date');
    } finally {
      setSaving(false);
    }
  }

  let upcomingBills = bills
    .filter(bill => !bill.paid && bill.dueDate && !bill.isSetAside)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 6);

  function getBillStyle(bill) {
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
          <div
            onClick={function() {
              if (!editingPayDate) setEditingPayDate(true);
            }}
            style={{
              background: '#161B22',
              border: '1px solid #1DB95433',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 12px rgba(29,185,84,0.08)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <p style={{ color: '#8B949E', fontSize: '13px', margin: 0 }}>Next Pay Date</p>
              {!editingPayDate && (
                <p style={{ color: '#1DB954', fontSize: '11px', margin: 0 }}>tap to edit</p>
              )}
            </div>

            {editingPayDate ? (
              <div onClick={function(e) { e.stopPropagation(); }}>
                <p style={{ color: '#8B949E', fontSize: '11px', marginBottom: '6px' }}>
                  Pick your most recent payday — pay periods count forward from it every 2 weeks
                </p>
                <input
                  type="date"
                  value={payDateInput}
                  onChange={function(e) { setPayDateInput(e.target.value); }}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: '#0D1117',
                    border: '1px solid #1DB95455',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#E8F5E9',
                    fontSize: '16px',
                    marginBottom: '10px',
                    colorScheme: 'dark'
                  }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleSavePayDate}
                    disabled={saving || !payDateInput}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #1DB954, #107C41)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 0',
                      color: '#fff',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      cursor: 'pointer',
                      opacity: saving || !payDateInput ? 0.5 : 1
                    }}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={function() {
                      setEditingPayDate(false);
                      setPayDateInput('');
                    }}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: '1px solid #30363D',
                      borderRadius: '8px',
                      padding: '10px 0',
                      color: '#8B949E',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p style={{
                fontWeight: 'bold',
                fontSize: '20px',
                margin: 0,
                background: 'linear-gradient(135deg, #1DB954, #5C8A3A)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                {nextPayDate ? formatDate(nextPayDate) : 'Not set'}
              </p>
            )}
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
                ? `${formatDate(periodStart)} - ${formatDate(periodEnd)}`
                : 'Not set'}
            </p>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          <div style={{ background: '#161B22', padding: '20px', borderRadius: '12px', border: '1px solid #30363D' }}>
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

          <SpendingChart spending={spending} />
        </div>
      </div>
    <NotesSection householdId={householdId} userId={userId} members={members} />
    </div>
  
  );
}

export default Dashboard;