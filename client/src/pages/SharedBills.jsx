import { useState, useEffect } from 'react';
import { getSharedBills, getBillShares, markBillSharePaid, createBill, updateBill, deleteBill, getHouseholdMembers, 
  getSharedBillsWithHistory, getRecentPayDate, recalculateLeftover } from '../services/api';
import { CATEGORIES, MONTHS, YEARS, formatDate } from '../constants';

let GOLD_ACCENTS = [
  'linear-gradient(135deg, #FFD700, #E6C200)',
  'linear-gradient(135deg, #E6A817, #C48A00)',
  'linear-gradient(135deg, #D4AF37, #B8941F)',
  'linear-gradient(135deg, #FFC125, #E6A800)',
  'linear-gradient(135deg, #C9A227, #A8851C)',
  'linear-gradient(135deg, #F0C040, #D4A010)',
];

function SharedBills() {
  let [bills, setBills] = useState([]);
  let [loading, setLoading] = useState(true);
  let [expandedId, setExpandedId] = useState(null);
  let [billShares, setBillShares] = useState([]);
  let [members, setMembers] = useState({});
  let [periodStart, setPeriodStart] = useState(null);
  let [periodEnd, setPeriodEnd] = useState(null);
  let [showAddForm, setShowAddForm] = useState(false);
  let [editingBillId, setEditingBillId] = useState(null);
  let [newName, setNewName] = useState('');
  let [newAmount, setNewAmount] = useState('');
  let [newDueDate, setNewDueDate] = useState('');
  let [newCategory, setNewCategory] = useState('Misc.');
  let [newIsRecurring, setNewIsRecurring] = useState(false);
  let [newRecurrenceType, setNewRecurrenceType] = useState('monthly');
  let [newIsSetAside, setNewIsSetAside] = useState(false);
  let [showHistory, setShowHistory] = useState(false);
  let now = new Date();
  let [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  let [selectedMonthNum, setSelectedMonthNum] = useState(String(now.getMonth() + 1).padStart(2, '0'));

  let userId = localStorage.getItem('userId');
  let householdId = localStorage.getItem('householdId');

  useEffect(function() {
    fetchBills();
    fetchMembers();
  }, [showHistory]);

  async function fetchBills() {
    try {
      let res = await getSharedBillsWithHistory(householdId);
      setBills([...res.data].sort((a, b) => new Date(b.dueDate || 0) - new Date(a.dueDate || 0)));

      let recentRes = await getRecentPayDate(userId);
      if (recentRes.data.recentPayDate && recentRes.data.periodEnd) {
        setPeriodStart(recentRes.data.recentPayDate);
        setPeriodEnd(recentRes.data.periodEnd);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMembers() {
    try {
      let res = await getHouseholdMembers(householdId);
      let map = {};
      for (let user of res.data) {
        map[user._id] = user.name;
      }
      setMembers(map);
    } catch (error) {
      console.error(error);
    }
  }

  async function toggleExpand(billId) {
    if (expandedId === billId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(billId);
    let res = await getBillShares(billId);
    setBillShares(res.data);
  }

  async function handleMarkPaid(shareId, currentPaidStatus) {
    await markBillSharePaid(shareId, { paid: !currentPaidStatus });
    await recalculateLeftover(userId);
    let res = await getBillShares(expandedId);
    setBillShares(res.data);
    fetchBills();
  }

  function resetForm() {
    setNewName('');
    setNewAmount('');
    setNewDueDate('');
    setNewCategory('Misc.');
    setNewIsRecurring(false);
    setNewRecurrenceType('monthly');
    setNewIsSetAside(false);
    setShowAddForm(false);
    setEditingBillId(null);
  }

  function startEdit(bill) {
    setEditingBillId(bill._id);
    setNewName(bill.name);
    setNewAmount(String(bill.amount));
    setNewDueDate(bill.dueDate ? bill.dueDate.slice(0, 10) : '');
    setNewCategory(bill.category || 'Misc.');
    setNewIsRecurring(bill.isRecurring || false);
    setNewRecurrenceType(bill.recurrenceType || 'monthly');
    setNewIsSetAside(bill.isSetAside || false);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSaveBill() {
    if (!newName || !newAmount) return;
    if (newIsRecurring && !newDueDate) {
      alert('Recurring bills need a due date to repeat from');
      return;
    }
    try {
      if (editingBillId) {
        await updateBill(editingBillId, {
          name: newName,
          amount: Number(newAmount),
          dueDate: newDueDate || undefined,
          category: newCategory,
          isRecurring: newIsRecurring,
          recurrenceType: newRecurrenceType,
          isSetAside: newIsSetAside
        });
      } else {
        await createBill({
          name: newName,
          amount: Number(newAmount),
          dueDate: newDueDate || undefined,
          category: newCategory,
          isShared: true,
          isRecurring: newIsRecurring,
          recurrenceType: newRecurrenceType,
          isSetAside: newIsSetAside,
          householdId
        });
      }
      await recalculateLeftover(userId);
      resetForm();
      fetchBills();
      if (expandedId) {
        let res = await getBillShares(expandedId);
        setBillShares(res.data);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to save bill');
    }
  }

  async function handleDelete(billId) {
    if (window.confirm('Delete this bill? This cannot be undone.')) {
      await deleteBill(billId);
      await recalculateLeftover(userId);
      setBills(bills.filter(b => b._id !== billId));
    }
  }

  function visibleBills(list) {
    if (showHistory) {
      // history mode: everything due in the selected month, archived or not
      return list.filter(bill =>
        !bill.dueDate ||
        bill.dueDate.slice(0, 7) === `${selectedYear}-${selectedMonthNum}`
      );
    }
    // default mode: everything due in the current pay period, archived included
    if (!periodStart || !periodEnd) return list;
    return list.filter(bill =>
      !bill.dueDate ||
      (bill.dueDate >= periodStart && bill.dueDate <= periodEnd)
    );
  }

  let inputStyle = {
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #30363D',
    background: '#0D1117',
    color: '#fff',
    fontSize: '16px',
    minWidth: 0,
    boxSizing: 'border-box'
  };

  if (loading) return <p style={{ padding: '40px', color: '#fff', background: '#0D1117', minHeight: '100vh' }}>Loading...</p>;

  return (
    <div style={{ background: '#0D1117', minHeight: '100vh', padding: 'clamp(16px, 4vw, 32px)', paddingBottom: '110px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{
          fontSize: 'clamp(20px, 5vw, 24px)',
          margin: 0,
          background: 'linear-gradient(135deg, #FFD700, #E6C200)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>Shared Bills</h1>
        <button
        onClick={() => setShowHistory(!showHistory)}
        style={{
          padding: '6px 14px',
          borderRadius: '20px',
          border: '1px solid #30363D',
          background: showHistory ? '#30363D' : 'transparent',
          color: '#8B949E',
          fontSize: '12px',
          cursor: 'pointer',
          marginBottom: '16px'
        }}
      >
        {showHistory ? 'Hide History' : 'Show History'}
      </button>
      {showHistory && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <select
            value={selectedMonthNum}
            onChange={e => setSelectedMonthNum(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          >
            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          >
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      )}
      {!showHistory && periodStart && (
        <p style={{ color: '#8B949E', fontSize: '12px', marginTop: 0, marginBottom: '16px' }}>
          Showing bills due this pay period ({formatDate(periodStart)} – {formatDate(periodEnd)})
        </p>
      )}
        <button
          onClick={() => {
            if (showAddForm) {
              resetForm();
            } else {
              setShowAddForm(true);
            }
          }}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: 'none',
            background: 'linear-gradient(135deg, #FFD700, #E6C200)',
            color: '#0D1117',
            fontWeight: 'bold',
            fontSize: '13px',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          {showAddForm ? '✕ Cancel' : '+ Add Bill'}
        </button>
      </div>

      {showAddForm && (
        <div style={{
          background: '#161B22',
          border: '1px solid #30363D',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <h2 style={{ color: '#E8F5E9', fontSize: '15px', marginTop: 0, marginBottom: '14px' }}>
            {editingBillId ? 'Edit Bill' : 'New Shared Bill'}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                placeholder="Bill name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                style={{ ...inputStyle, flex: '2 1 140px' }}
              />
              <input
                placeholder="Amount"
                type="number"
                value={newAmount}
                onChange={e => setNewAmount(e.target.value)}
                style={{ ...inputStyle, flex: '1 1 90px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                style={{ ...inputStyle, flex: '1 1 120px' }}
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <input
                type="date"
                value={newDueDate}
                onChange={e => setNewDueDate(e.target.value)}
                style={{ ...inputStyle, flex: '1 1 120px', colorScheme: 'dark' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ color: '#8B949E', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={newIsRecurring}
                  onChange={e => setNewIsRecurring(e.target.checked)}
                />
                🔁 Repeats
              </label>
              {newIsRecurring && (
                <select
                  value={newRecurrenceType}
                  onChange={e => setNewRecurrenceType(e.target.value)}
                  style={{ ...inputStyle, flex: '1 1 160px' }}
                >
                  <option value="monthly">Every month</option>
                  <option value="4weeks">Every 4 weeks (2 paychecks)</option>
                </select>
              )}
            </div>
            <label style={{ color: '#8B949E', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={newIsSetAside}
                onChange={e => setNewIsSetAside(e.target.checked)}
              />
              💰 Set-aside tracker (excluded from totals & Dashboard)
            </label>
            <button
              onClick={handleSaveBill}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #FFD700, #E6C200)',
                color: '#0D1117',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              {editingBillId ? 'Save Changes' : 'Save Bill'}
            </button>
          </div>
        </div>
      )}

      {visibleBills(bills).length === 0 ? (
        <p style={{ color: '#8B949E' }}>No shared bills yet</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {visibleBills(bills).map((bill, index) => {
            let isExpanded = expandedId === bill._id;
            let accent = GOLD_ACCENTS[index % GOLD_ACCENTS.length];

            return (
              <div key={bill._id} style={{
                background: bill.paid ? 'rgba(29, 185, 84, 0.12)' : '#161B22',
                border: `1px solid ${bill.paid ? '#1DB95488' : '#FFD70044'}`,
                borderRadius: '12px',
                padding: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '10px' }}>
                  <p style={{
                    fontWeight: 'bold',
                    fontSize: '16px',
                    margin: 0,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    background: accent,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    {bill.name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <p style={{
                      fontWeight: 'bold',
                      margin: 0,
                      background: accent,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>${bill.amount}</p>
                    <button
                      onClick={() => startEdit(bill)}
                      style={{ background: 'none', border: 'none', color: '#FFD700', cursor: 'pointer', fontSize: '15px', padding: '4px' }}
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleDelete(bill._id)}
                      style={{ background: 'none', border: 'none', color: '#FF6B6B', cursor: 'pointer', fontSize: '16px', padding: '4px' }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', fontSize: '12px', flexWrap: 'wrap' }}>
                  <span style={{ color: '#8B949E' }}>{bill.category}</span>
                  {bill.dueDate && (
                    <span style={{ color: '#8B949E' }}>Due: {formatDate(bill.dueDate)}</span>
                  )}
                  {bill.isRecurring && (
                    <span style={{ color: '#FFD700' }}>🔁 {bill.recurrenceType === '4weeks' ? '4 wks' : 'Monthly'}</span>
                  )}
                  {bill.isSetAside && <span style={{ color: '#8B949E' }}>💰 Set-aside</span>}
                  <span style={{
                    color: bill.paid ? '#1DB954' : '#FFD700',
                    fontWeight: 'bold'
                  }}>
                    {bill.paid ? '✓ Paid' : 'Unpaid'}

                  {bill.isArchived && <span style={{ color: '#8B949E' }}>📁 Archived</span>}
                  </span>
                </div>

                <button
                  onClick={() => toggleExpand(bill._id)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: '#0D1117',
                    border: '1px solid #30363D',
                    borderRadius: '8px',
                    color: '#8B949E',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  {isExpanded ? '▲ Hide Split' : '▼ View Split'}
                </button>

                {isExpanded && (
                  <div style={{ marginTop: '14px', borderTop: '1px solid #30363D', paddingTop: '14px' }}>
                    {billShares.length === 0 ? (
                      <p style={{ color: '#8B949E', fontSize: '13px' }}>No shares found</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {billShares.map(share => {
                          let isMyShare = share.owner === userId;
                          let shareAccent = isMyShare
                            ? 'linear-gradient(135deg, #4DA3FF, #0080FF)'
                            : 'linear-gradient(135deg, #FF8FC7, #FF4DA6)';

                          return (
                            <div key={share._id} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '10px 14px',
                              borderRadius: '8px',
                              gap: '10px',
                              background: isMyShare
                                ? 'linear-gradient(135deg, #0d3a6b, #082849)'
                                : 'linear-gradient(135deg, #6b1a4a, #4a1233)'
                            }}>
                              <div style={{ minWidth: 0 }}>
                                <p style={{
                                  fontWeight: 'bold',
                                  fontSize: '14px',
                                  margin: 0,
                                  background: shareAccent,
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                  backgroundClip: 'text'
                                }}>
                                  {members[share.owner] || (isMyShare ? 'Me' : 'Partner')}
                                </p>
                                <p style={{ color: '#cfcfcf', fontSize: '12px', margin: 0 }}>${share.amount}</p>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                                <span style={{
                                  fontSize: '12px',
                                  color: share.paid ? '#1DB954' : '#8B949E'
                                }}>
                                  {share.paid ? '✓ Paid' : 'Unpaid'}
                                </span>
                                {isMyShare && (
                                  <button
                                    onClick={() => handleMarkPaid(share._id, share.paid)}
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: '6px',
                                      border: 'none',
                                      background: share.paid
                                        ? '#30363D'
                                        : 'linear-gradient(135deg, #4DA3FF, #0080FF)',
                                      color: 'white',
                                      fontSize: '12px',
                                      fontWeight: 'bold',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {share.paid ? 'Undo' : 'Mark Paid'}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SharedBills;