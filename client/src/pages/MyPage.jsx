import { useState, useEffect } from 'react';
import { getSharedBills, getBillShares, markBillSharePaid, getAllDebts, getDebtBalance, getPaychecks, createPaycheck, calculateLeftover, createBill, updateBill, deleteBill, getPersonalBills, updatePayAnchorDate } from '../services/api';
import { MONTHS, YEARS, CATEGORIES, formatDate } from '../constants';

let BLUE_ACCENTS = [
  'linear-gradient(135deg, #4DA3FF, #0080FF)',
  'linear-gradient(135deg, #60B0FF, #1A8CFF)',
  'linear-gradient(135deg, #80C4FF, #3399FF)',
  'linear-gradient(135deg, #1A8CFF, #0066CC)',
  'linear-gradient(135deg, #99CCFF, #4DA3FF)',
  'linear-gradient(135deg, #3399FF, #0055BB)',
];

let PINK_ACCENTS = [
  'linear-gradient(135deg, #FF8FC7, #FF4DA6)',
  'linear-gradient(135deg, #FF69B4, #FF1493)',
  'linear-gradient(135deg, #FFB6C1, #FF69B4)',
  'linear-gradient(135deg, #FF4DA6, #CC0066)',
  'linear-gradient(135deg, #FF82AB, #FF3385)',
  'linear-gradient(135deg, #FFB3D9, #FF66B2)',
];

function MyPage() {
  let [activeTab, setActiveTab] = useState('shared');
  let [sharedBills, setSharedBills] = useState([]);
  let [personalBills, setPersonalBills] = useState([]);
  let [debts, setDebts] = useState([]);
  let [paychecks, setPaychecks] = useState([]);
  let [loading, setLoading] = useState(true);
  let [expandedId, setExpandedId] = useState(null);
  let [billShares, setBillShares] = useState([]);
  let [showPaycheckHistory, setShowPaycheckHistory] = useState(false);
  let [showAddPaycheck, setShowAddPaycheck] = useState(false);
  let [showAddBill, setShowAddBill] = useState(false);
  let [editingBillId, setEditingBillId] = useState(null);
  let [showPaySchedule, setShowPaySchedule] = useState(false);
  let [payAnchorDate, setPayAnchorDate] = useState('');
  let [payScheduleSaved, setPayScheduleSaved] = useState(false);
  let [newPaycheckAmount, setNewPaycheckAmount] = useState('');
  let [newPaycheckDate, setNewPaycheckDate] = useState(new Date().toISOString().split('T')[0]);
  let [newBillName, setNewBillName] = useState('');
  let [newBillAmount, setNewBillAmount] = useState('');
  let [newBillDueDate, setNewBillDueDate] = useState('');
  let [newBillCategory, setNewBillCategory] = useState('Misc.');
  let [newBillIsRecurring, setNewBillIsRecurring] = useState(false);
  let [newIsSetAside, setNewIsSetAside] = useState(false);
  let [newRecurrenceType, setNewRecurrenceType] = useState('monthly');
  let now = new Date();
  let [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  let [selectedMonthNum, setSelectedMonthNum] = useState(String(now.getMonth() + 1).padStart(2, '0'));

  let userId = localStorage.getItem('userId');
  let userName = localStorage.getItem('userName');
  let householdId = localStorage.getItem('householdId');

  let isMo = userName === 'Mo';
  let ACCENTS = isMo ? BLUE_ACCENTS : PINK_ACCENTS;
  let primaryGradient = isMo
    ? 'linear-gradient(135deg, #4DA3FF, #0080FF)'
    : 'linear-gradient(135deg, #FF8FC7, #FF4DA6)';
  let borderColor = isMo ? '#0080FF33' : '#FF4DA633';
  let unpaidColor = isMo ? '#4DA3FF' : '#FF8FC7';

  useEffect(function() {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      let [sharedRes, personalRes, debtsRes, paychecksRes] = await Promise.all([
        getSharedBills(householdId),
        getPersonalBills(householdId, userId),
        getAllDebts(householdId),
        getPaychecks(userId)
      ]);

      setSharedBills(sharedRes.data);
      setPersonalBills(personalRes.data);
      setPaychecks(paychecksRes.data);

      let debtsWithBalance = await Promise.all(
        debtsRes.data
          .filter(d => !d.isShared && d.owner === userId)
          .map(async (debt) => {
            let balanceRes = await getDebtBalance(debt._id);
            return { ...debt, currentBalance: balanceRes.data.balance };
          })
      );
      setDebts(debtsWithBalance);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
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
    let res = await getBillShares(expandedId);
    setBillShares(res.data);
    fetchAll();
  }

  async function handleTogglePersonalPaid(bill) {
    await updateBill(bill._id, { paid: !bill.paid });
    fetchAll();
  }

  async function handleAddPaycheck() {
    if (!newPaycheckAmount) return;
    let res = await createPaycheck({
      earnedBy: userId,
      amount: Number(newPaycheckAmount),
      date: newPaycheckDate
    });
    await calculateLeftover(res.data._id);
    setNewPaycheckAmount('');
    setNewPaycheckDate(new Date().toISOString().split('T')[0]);
    setShowAddPaycheck(false);
    let paychecksRes = await getPaychecks(userId);
    setPaychecks(paychecksRes.data);
  }

  function resetBillForm() {
    setNewBillName('');
    setNewBillAmount('');
    setNewBillDueDate('');
    setNewBillCategory('Misc.');
    setNewBillIsRecurring(false);
    setNewRecurrenceType('monthly');
    setNewIsSetAside(false);
    setShowAddBill(false);
    setEditingBillId(null);
  }

  function startEditBill(bill) {
    setEditingBillId(bill._id);
    setNewBillName(bill.name);
    setNewBillAmount(String(bill.amount));
    setNewBillDueDate(bill.dueDate ? bill.dueDate.slice(0, 10) : '');
    setNewBillCategory(bill.category || 'Misc.');
    setNewBillIsRecurring(bill.isRecurring || false);
    setNewRecurrenceType(bill.recurrenceType || 'monthly');
    setNewIsSetAside(bill.isSetAside || false);
    setShowAddBill(true);
  }

  async function handleSaveBill() {
    if (!newBillName || !newBillAmount) return;
    if (newBillIsRecurring && !newBillDueDate) {
      alert('Recurring bills need a due date to repeat from');
      return;
    }
    try {
      if (editingBillId) {
        await updateBill(editingBillId, {
          name: newBillName,
          amount: Number(newBillAmount),
          dueDate: newBillDueDate || undefined,
          category: newBillCategory,
          isRecurring: newBillIsRecurring,
          recurrenceType: newRecurrenceType,
          isSetAside: newIsSetAside
        });
      } else {
        await createBill({
          name: newBillName,
          amount: Number(newBillAmount),
          dueDate: newBillDueDate || undefined,
          category: newBillCategory,
          isShared: false,
          isRecurring: newBillIsRecurring,
          recurrenceType: newRecurrenceType,
          isSetAside: newIsSetAside,
          owner: userId,
          householdId
        });
      }
      resetBillForm();
      fetchAll();
    } catch (error) {
      console.error(error);
      alert('Failed to save bill');
    }
  }

  async function handleDeleteBill(billId) {
    if (window.confirm('Delete this bill? This cannot be undone.')) {
      await deleteBill(billId);
      fetchAll();
    }
  }

  async function handleUpdatePayAnchor() {
    if (!payAnchorDate) return;
    try {
      await updatePayAnchorDate(payAnchorDate);
      setPayScheduleSaved(true);
      setShowPaySchedule(false);
      setPayAnchorDate('');
      setTimeout(() => setPayScheduleSaved(false), 3000);
    } catch (error) {
      console.error(error);
      alert('Failed to save pay schedule');
    }
  }

  let currentPaycheck = paychecks.sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  let filteredPaychecks = paychecks.filter(p =>
    p.date.slice(0, 7) === `${selectedYear}-${selectedMonthNum}`
  );

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

  let cardGrid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '16px'
  };

  if (loading) return <p style={{ padding: '40px', color: '#fff', background: '#0D1117', minHeight: '100vh' }}>Loading...</p>;

  return (
    <div style={{ background: '#0D1117', minHeight: '100vh', padding: 'clamp(16px, 4vw, 32px)', paddingBottom: '110px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{
          fontSize: 'clamp(20px, 5vw, 24px)',
          margin: 0,
          background: primaryGradient,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>{userName}'s Page</h1>
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
            whiteSpace: 'nowrap'
          }}
        >
          Log Out
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { key: 'shared', label: 'Shared Bills' },
          { key: 'personal', label: 'Personal Bills' },
          { key: 'debt', label: 'Debt' },
          { key: 'paycheck', label: 'Paycheck' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 14px',
              borderRadius: '20px',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              background: activeTab === tab.key ? primaryGradient : '#161B22',
              color: activeTab === tab.key ? (isMo ? '#fff' : '#0D1117') : '#8B949E'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'shared' && (
        <div>
          {sharedBills.length === 0 ? (
            <p style={{ color: '#8B949E' }}>No shared bills</p>
          ) : (
            <div style={cardGrid}>
              {sharedBills.map((bill, index) => {
                let accent = ACCENTS[index % ACCENTS.length];
                let isExpanded = expandedId === bill._id;

                return (
                  <div key={bill._id} style={{
                    background: '#161B22',
                    border: `1px solid ${bill.paid ? '#1DB95444' : borderColor}`,
                    borderRadius: '12px',
                    padding: '16px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', gap: '8px' }}>
                      <p style={{
                        fontWeight: 'bold', fontSize: '15px', margin: 0,
                        minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        background: accent, WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                      }}>{bill.name}</p>
                      <p style={{
                        fontWeight: 'bold', margin: 0, flexShrink: 0,
                        background: accent, WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                      }}>${bill.amount}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', fontSize: '11px', flexWrap: 'wrap' }}>
                      {bill.dueDate && <span style={{ color: '#8B949E' }}>Due: {formatDate(bill.dueDate)}</span>}
                      {bill.isRecurring && <span style={{ color: unpaidColor }}>🔁 Monthly</span>}
                      {bill.isSetAside && <span style={{ color: '#8B949E' }}>💰 Set-aside</span>}
                      <span style={{ color: bill.paid ? '#1DB954' : unpaidColor, fontWeight: 'bold' }}>
                        {bill.paid ? '✓ Paid' : 'Unpaid'}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleExpand(bill._id)}
                      style={{ width: '100%', padding: '6px', background: '#0D1117', border: '1px solid #30363D', borderRadius: '6px', color: '#8B949E', fontSize: '11px', cursor: 'pointer' }}
                    >
                      {isExpanded ? '▲ Hide Split' : '▼ View Split'}
                    </button>

                    {isExpanded && (
                      <div style={{ marginTop: '10px', borderTop: '1px solid #30363D', paddingTop: '10px' }}>
                        {billShares.map(share => {
                          let isMyShare = share.owner === userId;
                          let shareAccent = isMyShare ? primaryGradient
                            : isMo
                              ? 'linear-gradient(135deg, #FF8FC7, #FF4DA6)'
                              : 'linear-gradient(135deg, #4DA3FF, #0080FF)';

                          return (
                            <div key={share._id} style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              padding: '8px 10px', borderRadius: '6px', marginBottom: '6px', gap: '8px',
                              background: isMyShare
                                ? isMo ? 'linear-gradient(135deg, #0d3a6b, #082849)' : 'linear-gradient(135deg, #6b1a4a, #4a1233)'
                                : isMo ? 'linear-gradient(135deg, #6b1a4a, #4a1233)' : 'linear-gradient(135deg, #0d3a6b, #082849)'
                            }}>
                              <div style={{ minWidth: 0 }}>
                                <p style={{
                                  fontWeight: 'bold', fontSize: '12px', margin: 0,
                                  background: shareAccent, WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                                }}>
                                  {isMyShare ? userName : (isMo ? 'Kirah' : 'Mo')}
                                </p>
                                <p style={{ color: '#cfcfcf', fontSize: '11px', margin: 0 }}>${share.amount}</p>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                <span style={{ fontSize: '11px', color: share.paid ? '#1DB954' : '#8B949E' }}>
                                  {share.paid ? '✓' : 'Unpaid'}
                                </span>
                                {isMyShare && (
                                  <button
                                    onClick={() => handleMarkPaid(share._id, share.paid)}
                                    style={{
                                      padding: '4px 8px', borderRadius: '4px', border: 'none',
                                      background: share.paid ? '#30363D' : primaryGradient,
                                      color: 'white', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer'
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
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'personal' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button
              onClick={() => {
                if (showAddBill) {
                  resetBillForm();
                } else {
                  setShowAddBill(true);
                }
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                background: primaryGradient,
                color: isMo ? '#fff' : '#0D1117',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {showAddBill ? '✕ Cancel' : '+ Add Bill'}
            </button>
          </div>

          {showAddBill && (
            <div style={{
              background: '#161B22',
              border: '1px solid #30363D',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '16px'
            }}>
              <h2 style={{ color: '#E8F5E9', fontSize: '15px', marginTop: 0, marginBottom: '14px' }}>
                {editingBillId ? 'Edit Bill' : 'New Personal Bill'}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    placeholder="Bill name"
                    value={newBillName}
                    onChange={e => setNewBillName(e.target.value)}
                    style={{ ...inputStyle, flex: '2 1 140px' }}
                  />
                  <input
                    placeholder="Amount"
                    type="number"
                    value={newBillAmount}
                    onChange={e => setNewBillAmount(e.target.value)}
                    style={{ ...inputStyle, flex: '1 1 90px' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <select
                    value={newBillCategory}
                    onChange={e => setNewBillCategory(e.target.value)}
                    style={{ ...inputStyle, flex: '1 1 120px' }}
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <input
                    type="date"
                    value={newBillDueDate}
                    onChange={e => setNewBillDueDate(e.target.value)}
                    style={{ ...inputStyle, flex: '1 1 120px', colorScheme: 'dark' }}
                  />
                </div>
                <label style={{ color: '#8B949E', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={newBillIsRecurring}
                    onChange={e => setNewBillIsRecurring(e.target.checked)}
                  />
                  🔁 Repeats monthly (rolls to next month after it's paid)
                </label>

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
                    padding: '12px', borderRadius: '8px', border: 'none',
                    background: primaryGradient,
                    color: isMo ? '#fff' : '#0D1117',
                    fontWeight: 'bold', fontSize: '14px', cursor: 'pointer'
                  }}
                >
                  {editingBillId ? 'Save Changes' : 'Save Bill'}
                </button>
              </div>
            </div>
          )}

          {personalBills.length === 0 ? (
            <p style={{ color: '#8B949E' }}>No personal bills</p>
          ) : (
            <div style={cardGrid}>
              {personalBills.map((bill, index) => {
                let accent = ACCENTS[index % ACCENTS.length];
                return (
                  <div key={bill._id} style={{
                    background: '#161B22',
                    border: `1px solid ${bill.paid ? '#1DB95444' : borderColor}`,
                    borderRadius: '12px',
                    padding: '16px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', gap: '8px' }}>
                      <p style={{
                        fontWeight: 'bold', fontSize: '15px', margin: 0,
                        minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        background: accent, WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                      }}>{bill.name}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <p style={{
                          fontWeight: 'bold', margin: 0,
                          background: accent, WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                        }}>${bill.amount}</p>
                        <button
                          onClick={() => startEditBill(bill)}
                          style={{ background: 'none', border: 'none', color: unpaidColor, cursor: 'pointer', fontSize: '14px', padding: '2px' }}
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => handleDeleteBill(bill._id)}
                          style={{ background: 'none', border: 'none', color: '#FF6B6B', cursor: 'pointer', fontSize: '15px', padding: '2px' }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '11px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      <span style={{ color: '#8B949E' }}>{bill.category}</span>
                      {bill.dueDate && <span style={{ color: '#8B949E' }}>Due: {formatDate(bill.dueDate)}</span>}
                      {bill.isRecurring && <span style={{ color: unpaidColor }}>🔁 Monthly</span>}
                      <span style={{ color: bill.paid ? '#1DB954' : unpaidColor, fontWeight: 'bold' }}>
                        {bill.paid ? '✓ Paid' : 'Unpaid'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleTogglePersonalPaid(bill)}
                      style={{
                        width: '100%', padding: '6px', borderRadius: '6px', border: 'none',
                        background: bill.paid ? '#30363D' : primaryGradient,
                        color: bill.paid ? '#8B949E' : (isMo ? '#fff' : '#0D1117'),
                        fontSize: '12px', fontWeight: 'bold', cursor: 'pointer'
                      }}
                    >
                      {bill.paid ? 'Undo Paid' : 'Mark Paid'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'debt' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {debts.length === 0 ? (
            <p style={{ color: '#8B949E' }}>No personal debt</p>
          ) : (
            debts.map((debt, index) => {
              let paidSoFar = debt.startingBalance - debt.currentBalance;
              let percentPaid = Math.max(0, Math.min(100, (paidSoFar / debt.startingBalance) * 100));
              let accent = ACCENTS[index % ACCENTS.length];

              return (
                <div key={debt._id} style={{
                  background: '#161B22',
                  border: '1px solid #30363D',
                  borderRadius: '12px',
                  padding: '20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '8px' }}>
                    <p style={{
                      fontWeight: 'bold', fontSize: '16px', margin: 0,
                      minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      background: accent, WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                    }}>{debt.name}</p>
                    <p style={{ color: '#8B949E', fontSize: '13px', margin: 0, flexShrink: 0 }}>{debt.interestRate}% APR</p>
                  </div>

                  <div style={{ background: '#0D1117', borderRadius: '8px', height: '12px', overflow: 'hidden', marginBottom: '10px' }}>
                    <div style={{ background: accent, height: '100%', width: `${percentPaid}%`, borderRadius: '8px', transition: 'width 0.3s' }} />
                  </div>

                  <p style={{
                    fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', marginTop: 0,
                    background: accent, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                  }}>
                    {percentPaid.toFixed(0)}% paid off
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', flexWrap: 'wrap', gap: '4px' }}>
                    <span style={{ color: '#cfcfcf' }}>${paidSoFar.toFixed(2)} paid of ${debt.startingBalance.toFixed(2)}</span>
                    <span style={{ color: '#cfcfcf' }}>${debt.currentBalance.toFixed(2)} remaining</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'paycheck' && (
        <div>
          <div style={{
            background: '#161B22',
            border: `1px solid ${borderColor}`,
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: '#8B949E', fontSize: '13px', margin: 0 }}>Pay Schedule</p>
              <button
                onClick={() => setShowPaySchedule(!showPaySchedule)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: 'none',
                  background: primaryGradient,
                  color: isMo ? '#fff' : '#0D1117',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {showPaySchedule ? '✕ Cancel' : 'Set Pay Date'}
              </button>
            </div>

            {payScheduleSaved && (
              <p style={{ color: '#1DB954', fontSize: '12px', marginTop: '8px', marginBottom: 0 }}>✓ Pay schedule updated</p>
            )}

            {showPaySchedule && (
              <div style={{ marginTop: '12px' }}>
                <p style={{ color: '#8B949E', fontSize: '12px', marginBottom: '8px', marginTop: 0 }}>
                  Enter your most recent payday — the app will calculate your next pay date from this.
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="date"
                    value={payAnchorDate}
                    onChange={e => setPayAnchorDate(e.target.value)}
                    style={{ ...inputStyle, flex: 1, colorScheme: 'dark' }}
                  />
                  <button
                    onClick={handleUpdatePayAnchor}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '6px',
                      border: 'none',
                      background: primaryGradient,
                      color: isMo ? '#fff' : '#0D1117',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={{
            background: '#161B22',
            border: `1px solid ${borderColor}`,
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            <p style={{ color: '#8B949E', fontSize: '13px', marginBottom: '8px', marginTop: 0 }}>Current Leftover</p>
            {currentPaycheck ? (
              <p style={{
                fontSize: '36px',
                fontWeight: 'bold',
                margin: 0,
                background: primaryGradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                ${currentPaycheck.leftoverAmount?.toFixed(2) ?? '—'}
              </p>
            ) : (
              <p style={{ color: '#8B949E', margin: 0 }}>No paycheck recorded yet</p>
            )}
            {currentPaycheck && (
              <p style={{ color: '#8B949E', fontSize: '12px', marginTop: '6px', marginBottom: 0 }}>
                From paycheck on {formatDate(currentPaycheck.date)}
              </p>
            )}
          </div>

          <button
            onClick={() => setShowAddPaycheck(!showAddPaycheck)}
            style={{
              width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
              background: primaryGradient,
              color: isMo ? '#fff' : '#0D1117', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer',
              marginBottom: '16px'
            }}
          >
            {showAddPaycheck ? '✕ Cancel' : '+ Add Paycheck'}
          </button>

          {showAddPaycheck && (
            <div style={{
              background: '#161B22', border: '1px solid #30363D',
              borderRadius: '12px', padding: '16px', marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <input
                  placeholder="Amount"
                  type="number"
                  value={newPaycheckAmount}
                  onChange={e => setNewPaycheckAmount(e.target.value)}
                  style={{ ...inputStyle, flex: '1 1 100px' }}
                />
                <input
                  type="date"
                  value={newPaycheckDate}
                  onChange={e => setNewPaycheckDate(e.target.value)}
                  style={{ ...inputStyle, flex: '1 1 120px', colorScheme: 'dark' }}
                />
              </div>
              <button
                onClick={handleAddPaycheck}
                style={{
                  width: '100%', padding: '10px', borderRadius: '6px', border: 'none',
                  background: primaryGradient,
                  color: isMo ? '#fff' : '#0D1117', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer'
                }}
              >
                Save Paycheck
              </button>
            </div>
          )}

          <button
            onClick={() => setShowPaycheckHistory(!showPaycheckHistory)}
            style={{
              width: '100%', padding: '8px', background: '#0D1117',
              border: '1px solid #30363D', borderRadius: '8px',
              color: '#8B949E', fontSize: '13px', cursor: 'pointer'
            }}
          >
            {showPaycheckHistory ? '▲ Hide History' : '▼ View Paycheck History'}
          </button>

          {showPaycheckHistory && (
            <div style={{ marginTop: '14px', borderTop: '1px solid #30363D', paddingTop: '14px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
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

              {filteredPaychecks.length === 0 ? (
                <p style={{ color: '#8B949E', fontSize: '13px' }}>No paychecks this month</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredPaychecks.map((p, index) => {
                    let accent = ACCENTS[index % ACCENTS.length];
                    return (
                      <div key={p._id} style={{
                        background: '#161B22', border: '1px solid #30363D',
                        borderRadius: '10px', padding: '14px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                        <div>
                          <p style={{ color: '#8B949E', fontSize: '12px', margin: 0 }}>{formatDate(p.date)}</p>
                          <p style={{
                            fontSize: '15px', fontWeight: 'bold', margin: 0,
                            background: accent, WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                          }}>${p.amount.toFixed(2)}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ color: '#8B949E', fontSize: '11px', margin: 0 }}>Leftover</p>
                          <p style={{
                            fontSize: '15px', fontWeight: 'bold', margin: 0,
                            background: accent, WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                          }}>${p.leftoverAmount?.toFixed(2) ?? '—'}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MyPage;