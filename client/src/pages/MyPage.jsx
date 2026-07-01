import { useState, useEffect } from 'react';
import { getSharedBills, getBillShares, markBillSharePaid, getAllDebts, getDebtBalance, getPaychecks, createPaycheck, calculateLeftover, createBill, updatePayAnchorDate } from '../services/api';
import { MONTHS, YEARS, CATEGORIES } from '../constants';

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
  let [showPaySchedule, setShowPaySchedule] = useState(false);
  let [payAnchorDate, setPayAnchorDate] = useState('');
  let [payScheduleSaved, setPayScheduleSaved] = useState(false);
  let [newPaycheckAmount, setNewPaycheckAmount] = useState('');
  let [newPaycheckDate, setNewPaycheckDate] = useState(new Date().toISOString().split('T')[0]);
  let [newBillName, setNewBillName] = useState('');
  let [newBillAmount, setNewBillAmount] = useState('');
  let [newBillDueDate, setNewBillDueDate] = useState('');
  let [newBillCategory, setNewBillCategory] = useState('Misc.');
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
      let [sharedRes, allBillsRes, debtsRes, paychecksRes] = await Promise.all([
        getSharedBills(householdId),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/bills?householdId=${householdId}&isShared=false`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }).then(r => r.json()),
        getAllDebts(householdId),
        getPaychecks(userId)
      ]);

      setSharedBills(sharedRes.data);
      setPersonalBills(allBillsRes.filter(b => b.owner === userId));
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

  async function handleAddBill() {
    if (!newBillName || !newBillAmount) return;
    await createBill({
      name: newBillName,
      amount: Number(newBillAmount),
      dueDate: newBillDueDate || undefined,
      category: newBillCategory,
      isShared: false,
      owner: userId,
      householdId
    });
    setNewBillName('');
    setNewBillAmount('');
    setNewBillDueDate('');
    setNewBillCategory('Misc.');
    setShowAddBill(false);
    fetchAll();
  }

  async function handleUpdatePayAnchor() {
    if (!payAnchorDate) return;
    await updatePayAnchorDate({ payAnchorDate });
    setPayScheduleSaved(true);
    setShowPaySchedule(false);
    setTimeout(() => setPayScheduleSaved(false), 3000);
  }

  let currentPaycheck = paychecks.sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  let filteredPaychecks = paychecks.filter(p =>
    p.date.slice(0, 7) === `${selectedYear}-${selectedMonthNum}`
  );

  let inputStyle = {
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid #30363D',
    background: '#0D1117',
    color: '#fff',
    fontSize: '13px'
  };

  if (loading) return <p style={{ padding: '40px', color: '#fff', background: '#0D1117', minHeight: '100vh' }}>Loading...</p>;

  return (
    <div style={{ background: '#0D1117', minHeight: '100vh', padding: '32px', paddingBottom: '80px' }}>
      <h1 style={{
        fontSize: '24px',
        marginBottom: '20px',
        background: primaryGradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>{userName}'s Page</h1>

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
              padding: '8px 16px',
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <p style={{
                        fontWeight: 'bold', fontSize: '15px',
                        background: accent, WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                      }}>{bill.name}</p>
                      <p style={{
                        fontWeight: 'bold',
                        background: accent, WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                      }}>${bill.amount}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', fontSize: '11px', flexWrap: 'wrap' }}>
                      {bill.dueDate && <span style={{ color: '#8B949E' }}>Due: {new Date(bill.dueDate).toLocaleDateString()}</span>}
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
                              padding: '8px 10px', borderRadius: '6px', marginBottom: '6px',
                              background: isMyShare
                                ? isMo ? 'linear-gradient(135deg, #0d3a6b, #082849)' : 'linear-gradient(135deg, #6b1a4a, #4a1233)'
                                : isMo ? 'linear-gradient(135deg, #6b1a4a, #4a1233)' : 'linear-gradient(135deg, #0d3a6b, #082849)'
                            }}>
                              <div>
                                <p style={{
                                  fontWeight: 'bold', fontSize: '12px',
                                  background: shareAccent, WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                                }}>
                                  {isMyShare ? userName : (isMo ? 'Kirah' : 'Mo')}
                                </p>
                                <p style={{ color: '#cfcfcf', fontSize: '11px' }}>${share.amount}</p>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
              onClick={() => setShowAddBill(!showAddBill)}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    placeholder="Bill name"
                    value={newBillName}
                    onChange={e => setNewBillName(e.target.value)}
                    style={{ ...inputStyle, flex: 2 }}
                  />
                  <input
                    placeholder="Amount"
                    type="number"
                    value={newBillAmount}
                    onChange={e => setNewBillAmount(e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={newBillCategory}
                    onChange={e => setNewBillCategory(e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <input
                    type="date"
                    value={newBillDueDate}
                    onChange={e => setNewBillDueDate(e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                </div>
                <button
                  onClick={handleAddBill}
                  style={{
                    padding: '10px', borderRadius: '8px', border: 'none',
                    background: primaryGradient,
                    color: isMo ? '#fff' : '#0D1117',
                    fontWeight: 'bold', fontSize: '14px', cursor: 'pointer'
                  }}
                >
                  Save Bill
                </button>
              </div>
            </div>
          )}

          {personalBills.length === 0 ? (
            <p style={{ color: '#8B949E' }}>No personal bills</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {personalBills.map((bill, index) => {
                let accent = ACCENTS[index % ACCENTS.length];
                return (
                  <div key={bill._id} style={{
                    background: '#161B22',
                    border: `1px solid ${bill.paid ? '#1DB95444' : borderColor}`,
                    borderRadius: '12px',
                    padding: '16px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <p style={{
                        fontWeight: 'bold', fontSize: '15px',
                        background: accent, WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                      }}>{bill.name}</p>
                      <p style={{
                        fontWeight: 'bold',
                        background: accent, WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                      }}>${bill.amount}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '11px', flexWrap: 'wrap' }}>
                      <span style={{ color: '#8B949E' }}>{bill.category}</span>
                      {bill.dueDate && <span style={{ color: '#8B949E' }}>Due: {new Date(bill.dueDate).toLocaleDateString()}</span>}
                      <span style={{ color: bill.paid ? '#1DB954' : unpaidColor, fontWeight: 'bold' }}>
                        {bill.paid ? '✓ Paid' : 'Unpaid'}
                      </span>
                    </div>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <p style={{
                      fontWeight: 'bold', fontSize: '16px',
                      background: accent, WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                    }}>{debt.name}</p>
                    <p style={{ color: '#8B949E', fontSize: '13px' }}>{debt.interestRate}% APR</p>
                  </div>

                  <div style={{ background: '#0D1117', borderRadius: '8px', height: '12px', overflow: 'hidden', marginBottom: '10px' }}>
                    <div style={{ background: accent, height: '100%', width: `${percentPaid}%`, borderRadius: '8px', transition: 'width 0.3s' }} />
                  </div>

                  <p style={{
                    fontSize: '13px', fontWeight: 'bold', marginBottom: '4px',
                    background: accent, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                  }}>
                    {percentPaid.toFixed(0)}% paid off
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
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
              <p style={{ color: '#8B949E', fontSize: '13px' }}>Pay Schedule</p>
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
              <p style={{ color: '#1DB954', fontSize: '12px', marginTop: '8px' }}>✓ Pay schedule updated</p>
            )}

            {showPaySchedule && (
              <div style={{ marginTop: '12px' }}>
                <p style={{ color: '#8B949E', fontSize: '12px', marginBottom: '8px' }}>
                  Enter your most recent payday — the app will calculate your next pay date from this.
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="date"
                    value={payAnchorDate}
                    onChange={e => setPayAnchorDate(e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
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
            <p style={{ color: '#8B949E', fontSize: '13px', marginBottom: '8px' }}>Current Leftover</p>
            {currentPaycheck ? (
              <p style={{
                fontSize: '36px',
                fontWeight: 'bold',
                background: primaryGradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                ${currentPaycheck.leftoverAmount?.toFixed(2) ?? '—'}
              </p>
            ) : (
              <p style={{ color: '#8B949E' }}>No paycheck recorded yet</p>
            )}
            {currentPaycheck && (
              <p style={{ color: '#8B949E', fontSize: '12px', marginTop: '6px' }}>
                From paycheck on {new Date(currentPaycheck.date).toLocaleDateString()}
              </p>
            )}
          </div>

          <button
            onClick={() => setShowAddPaycheck(!showAddPaycheck)}
            style={{
              width: '100%', padding: '10px', borderRadius: '8px', border: 'none',
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
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input
                  placeholder="Amount"
                  type="number"
                  value={newPaycheckAmount}
                  onChange={e => setNewPaycheckAmount(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <input
                  type="date"
                  value={newPaycheckDate}
                  onChange={e => setNewPaycheckDate(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
              </div>
              <button
                onClick={handleAddPaycheck}
                style={{
                  width: '100%', padding: '8px', borderRadius: '6px', border: 'none',
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
                          <p style={{ color: '#8B949E', fontSize: '12px' }}>{new Date(p.date).toLocaleDateString()}</p>
                          <p style={{
                            fontSize: '15px', fontWeight: 'bold',
                            background: accent, WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                          }}>${p.amount.toFixed(2)}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ color: '#8B949E', fontSize: '11px' }}>Leftover</p>
                          <p style={{
                            fontSize: '15px', fontWeight: 'bold',
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