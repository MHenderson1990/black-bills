import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { getSharedBills, getSharedBillsWithHistory, getBillShares, getAllDebts, getDebtBalance, getPaychecks, getHouseholdMembers, getPersonalBills, getPersonalBillsWithHistory, 
  getRecentPayDate, getSpendingCashflow, getPaycheckBreakdown, getMySharedCharges } from '../services/api';
import { MONTHS, YEARS, formatDate } from '../constants';

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

let BLUE_PIE = [
  ['#CCE5FF', '#99CCFF'],
  ['#4DA3FF', '#1A8CFF'],
  ['#0059B3', '#003D80'],
  ['#80C4FF', '#4DA3FF'],
  ['#0080FF', '#0066CC'],
  ['#B3D9FF', '#80C4FF'],
  ['#1A8CFF', '#0059B3'],
  ['#66B2FF', '#3399FF']
];
let PINK_PIE = [
  ['#FFD6E8', '#FFB3D9'],
  ['#FF4DA6', '#FF1493'],
  ['#B30059', '#800040'],
  ['#FF8FC7', '#FF66B2'],
  ['#FF1493', '#CC0066'],
  ['#FFC7DE', '#FF8FC7'],
  ['#E60073', '#B30059'],
  ['#FF66B2', '#FF3385']
];

function TheirPage() {
  let [activeTab, setActiveTab] = useState('overview');
  let [sharedBills, setSharedBills] = useState([]);
  let [personalBills, setPersonalBills] = useState([]);
  let [debts, setDebts] = useState([]);
  let [paychecks, setPaychecks] = useState([]);
  let [spending, setSpending] = useState({});
  let [periodStart, setPeriodStart] = useState(null);
  let [periodEnd, setPeriodEnd] = useState(null);
  let [showHistory, setShowHistory] = useState(false);
  let [otherId, setOtherId] = useState(null);
  let [otherName, setOtherName] = useState('');
  let [loading, setLoading] = useState(true);
  let [expandedId, setExpandedId] = useState(null);
  let [billShares, setBillShares] = useState([]);
  let [showPaycheckHistory, setShowPaycheckHistory] = useState(false);
  let [otherSharedCharges, setOtherSharedCharges] = useState([]);
  let [showSettled, setShowSettled] = useState(false);
  let [expandedPaycheckId, setExpandedPaycheckId] = useState(null);
  let [paycheckBreakdown, setPaycheckBreakdown] = useState(null);
  let now = new Date();
  let [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  let [selectedMonthNum, setSelectedMonthNum] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  

  let userId = localStorage.getItem('userId');
  let userName = localStorage.getItem('userName');
  let householdId = localStorage.getItem('householdId');

  let isMo = userName === 'Mo';
  // "Their" theme is the OPPOSITE of the logged in user
  let ACCENTS = isMo ? PINK_ACCENTS : BLUE_ACCENTS;
  let PIE_GRADIENTS = isMo ? PINK_PIE : BLUE_PIE;
  let primaryGradient = isMo
    ? 'linear-gradient(135deg, #FF8FC7, #FF4DA6)'
    : 'linear-gradient(135deg, #4DA3FF, #0080FF)';
  let borderColor = isMo ? '#FF4DA633' : '#0080FF33';
  let unpaidColor = isMo ? '#FF8FC7' : '#4DA3FF';

  useEffect(function() {
    fetchAll();
  }, [showHistory]);

  async function fetchAll() {
    try {
      let membersRes = await getHouseholdMembers(householdId);
      let other = membersRes.data.find(m => m._id !== userId);
      if (!other) {
        setLoading(false);
        return;
      }
      setOtherId(other._id);
      setOtherName(other.name);

      let [sharedRes, personalRes, debtsRes, paychecksRes, recentRes] = await Promise.all([
        getSharedBillsWithHistory(householdId),
        getPersonalBillsWithHistory(householdId, other._id),
        getAllDebts(householdId),
        getPaychecks(other._id),
        getRecentPayDate(other._id)
      ]);

      setSharedBills([...sharedRes.data].sort((a, b) => new Date(b.dueDate || 0) - new Date(a.dueDate || 0)));
      setPersonalBills([...personalRes.data].sort((a, b) => new Date(b.dueDate || 0) - new Date(a.dueDate || 0)));
      setPaychecks(paychecksRes.data);

      if (recentRes.data.recentPayDate && recentRes.data.periodEnd) {
        setPeriodStart(recentRes.data.recentPayDate);
        setPeriodEnd(recentRes.data.periodEnd);
        let spendingRes = await getSpendingCashflow(
          other._id,
          recentRes.data.recentPayDate,
          recentRes.data.periodEnd
        );
        setSpending(spendingRes.data);
      }

      let debtsWithBalance = await Promise.all(
        debtsRes.data
          .filter(d => !d.isShared && d.owner === other._id)
          .map(async (debt) => {
            let balanceRes = await getDebtBalance(debt._id);
            return { ...debt, currentBalance: balanceRes.data.balance };
          })
      );
      setDebts(debtsWithBalance);

      let chargesRes = await getMySharedCharges(householdId, other._id);
      setOtherSharedCharges(chargesRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function togglePaycheckBreakdown(paycheckId) {
    if (expandedPaycheckId === paycheckId) {
      setExpandedPaycheckId(null);
      setPaycheckBreakdown(null);
      return;
    }
    setExpandedPaycheckId(paycheckId);
    setPaycheckBreakdown(null);
    let res = await getPaycheckBreakdown(paycheckId);
    setPaycheckBreakdown(res.data);
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

let unpaidOtherCharges = otherSharedCharges.filter(c => !c.paid);
  let settledOtherCharges = otherSharedCharges.filter(c =>
    c.paid &&
    (c.paidDate || c.date).slice(0, 7) === `${selectedYear}-${selectedMonthNum}`
  );

  let currentPaycheck = paychecks.sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  let filteredPaychecks = paychecks.filter(p =>
    p.date.slice(0, 7) === `${selectedYear}-${selectedMonthNum}`
  );

  let pieData = Object.keys(spending).map(category => ({
    name: category,
    value: spending[category]
  }));

  let periodTotal = pieData.reduce((total, slice) => total + slice.value, 0);

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

  let cardGrid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '16px'
  };

  let historyToggleStyle = {
    padding: '6px 14px',
    borderRadius: '20px',
    border: '1px solid #30363D',
    background: showHistory ? '#30363D' : 'transparent',
    color: '#8B949E',
    fontSize: '12px',
    cursor: 'pointer'
  };

  if (loading) return <p style={{ padding: '40px', color: '#fff', background: '#0D1117', minHeight: '100vh' }}>Loading...</p>;

  return (
    <div style={{ background: '#0D1117', minHeight: '100vh', padding: 'clamp(16px, 4vw, 32px)', paddingBottom: '110px' }}>
      <h1 style={{
        fontSize: 'clamp(20px, 5vw, 24px)',
        marginBottom: '20px',
        marginTop: 0,
        background: primaryGradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>{otherName}'s Page</h1>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { key: 'overview', label: 'Overview' },
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
              color: activeTab === tab.key ? (isMo ? '#0D1117' : '#fff') : '#8B949E'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div>
          {!periodStart ? (
            <p style={{ color: '#8B949E' }}>{otherName || 'They'} hasn't set a pay schedule yet, so there's no period overview to show.</p>
          ) : (
            <>
              <p style={{ color: '#8B949E', fontSize: '13px', marginTop: 0, marginBottom: '16px' }}>
                Pay period: {formatDate(periodStart)} – {formatDate(periodEnd)}
              </p>

              <div style={{ background: '#161B22', padding: '20px', borderRadius: '12px', border: `1px solid ${borderColor}`, marginBottom: '16px' }}>
                <h2 style={{ fontSize: '16px', marginTop: 0, marginBottom: '16px', color: '#E8F5E9' }}>{otherName}'s Spending This Period</h2>
                {pieData.length === 0 ? (
                  <p style={{ color: '#8B949E' }}>No expenses this period</p>
                ) : (
                  <>
                    <svg width="0" height="0">
                      <defs>
                        {pieData.map((entry, index) => {
                          let [gradStart, gradEnd] = PIE_GRADIENTS[index % PIE_GRADIENTS.length];
                          return (
                            <linearGradient key={index} id={`theirPieGrad${index}`} x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor={gradStart} />
                              <stop offset="100%" stopColor={gradEnd} />
                            </linearGradient>
                          );
                        })}
                      </defs>
                    </svg>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={85}
                          labelLine={false}
                          label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                            if (percent < 0.05) return null;
                            let RADIAN = Math.PI / 180;
                            let radius = innerRadius + (outerRadius - innerRadius) * 0.55;
                            let x = cx + radius * Math.cos(-midAngle * RADIAN);
                            let y = cy + radius * Math.sin(-midAngle * RADIAN);
                            return (
                              <text x={x} y={y} fill="#0D1117" fontSize={13} fontWeight="bold" textAnchor="middle" dominantBaseline="central">
                                {(percent * 100).toFixed(0)}%
                              </text>
                            );
                          }}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={index} fill={`url(#theirPieGrad${index})`} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => `$${Number(value).toFixed(2)}`}
                          contentStyle={{ background: '#161B22', border: '1px solid #30363D', color: '#fff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
                      {pieData.map((entry, index) => {
                        let [swatchColor] = PIE_GRADIENTS[index % PIE_GRADIENTS.length];
                        let pct = periodTotal > 0 ? ((entry.value / periodTotal) * 100).toFixed(0) : 0;
                        return (
                          <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: swatchColor, flexShrink: 0 }} />
                            <span style={{ color: '#E8F5E9', flex: 1 }}>{entry.name}</span>
                            <span style={{ color: '#8B949E' }}>{pct}%</span>
                            <span style={{ color: '#E8F5E9', fontWeight: 'bold', minWidth: '70px', textAlign: 'right' }}>${entry.value.toFixed(2)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              <div style={{
                background: '#161B22',
                border: `1px solid ${borderColor}`,
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <p style={{ color: '#8B949E', fontSize: '13px', marginTop: 0, marginBottom: '8px' }}>Total Expenses This Period</p>
                <p style={{
                  fontSize: '30px',
                  fontWeight: 'bold',
                  margin: 0,
                  background: primaryGradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  ${periodTotal.toFixed(2)}
                </p>
                <p style={{ color: '#8B949E', fontSize: '11px', marginTop: '6px', marginBottom: 0 }}>
                  Personal bills + their share of household bills + debt charges due this period
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'shared' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
            <button onClick={() => setShowHistory(!showHistory)} style={historyToggleStyle}>
              {showHistory ? 'Hide History' : 'Show History'}
            </button>
          </div>

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

          {visibleBills(sharedBills).length === 0 ? (
            <p style={{ color: '#8B949E' }}>No shared bills</p>
          ) : (
            <div style={cardGrid}>
              {visibleBills(sharedBills).map((bill, index) => {
                let accent = ACCENTS[index % ACCENTS.length];
                let isExpanded = expandedId === bill._id;

                return (
                  <div key={bill._id} style={{
                    background: bill.paid ? 'rgba(29, 185, 84, 0.12)' : '#161B22',
                    border: `1px solid ${bill.paid ? '#1DB95488' : borderColor}`,
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
                      {bill.isRecurring && (
                        <span style={{ color: unpaidColor }}>🔁 {bill.recurrenceType === '4weeks' ? '4 wks' : 'Monthly'}</span>
                      )}
                      {bill.isSetAside && <span style={{ color: '#8B949E' }}>💰 Set-aside</span>}
                      {bill.isArchived && <span style={{ color: '#8B949E' }}>📁 Archived</span>}
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
                          let isOtherShare = share.owner === otherId;
                          let shareAccent = isOtherShare ? primaryGradient
                            : isMo
                              ? 'linear-gradient(135deg, #4DA3FF, #0080FF)'
                              : 'linear-gradient(135deg, #FF8FC7, #FF4DA6)';

                          return (
                            <div key={share._id} style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              padding: '8px 10px', borderRadius: '6px', marginBottom: '6px', gap: '8px',
                              background: isOtherShare
                                ? isMo ? 'linear-gradient(135deg, #6b1a4a, #4a1233)' : 'linear-gradient(135deg, #0d3a6b, #082849)'
                                : isMo ? 'linear-gradient(135deg, #0d3a6b, #082849)' : 'linear-gradient(135deg, #6b1a4a, #4a1233)'
                            }}>
                              <div style={{ minWidth: 0 }}>
                                <p style={{
                                  fontWeight: 'bold', fontSize: '12px', margin: 0,
                                  background: shareAccent, WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                                }}>
                                  {isOtherShare ? otherName : userName}
                                </p>
                                <p style={{ color: '#cfcfcf', fontSize: '11px', margin: 0 }}>${share.amount}</p>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                <span style={{ fontSize: '11px', color: share.paid ? '#1DB954' : '#8B949E' }}>
                                  {share.paid ? '✓ Paid' : 'Unpaid'}
                                </span>
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
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
            <button onClick={() => setShowHistory(!showHistory)} style={historyToggleStyle}>
              {showHistory ? 'Hide History' : 'Show History'}
            </button>
          </div>

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

          {visibleBills(personalBills).length === 0 ? (
            <p style={{ color: '#8B949E' }}>No personal bills</p>
          ) : (
            <div style={cardGrid}>
              {visibleBills(personalBills).map((bill, index) => {
                let accent = ACCENTS[index % ACCENTS.length];
                return (
                  <div key={bill._id} style={{
                    background: bill.paid ? 'rgba(29, 185, 84, 0.12)' : '#161B22',
                    border: `1px solid ${bill.paid ? '#1DB95488' : borderColor}`,
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
                    <div style={{ display: 'flex', gap: '8px', fontSize: '11px', flexWrap: 'wrap' }}>
                      <span style={{ color: '#8B949E' }}>{bill.category}</span>
                      {bill.dueDate && <span style={{ color: '#8B949E' }}>Due: {formatDate(bill.dueDate)}</span>}
                      {bill.isRecurring && (
                        <span style={{ color: unpaidColor }}>🔁 {bill.recurrenceType === '4weeks' ? '4 wks' : 'Monthly'}</span>
                      )}
                      {bill.isSetAside && <span style={{ color: '#8B949E' }}>💰 Set-aside</span>}
                      {bill.isArchived && <span style={{ color: '#8B949E' }}>📁 Archived</span>}
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
          {unpaidOtherCharges.length > 0 && (
            <div style={{
              background: '#161B22',
              border: `1px solid ${borderColor}`,
              borderRadius: '12px',
              padding: '16px'
            }}>
              <h2 style={{ fontSize: '15px', marginTop: 0, marginBottom: '12px', color: '#E8F5E9' }}>
                {otherName}'s Charges on Shared Cards
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {unpaidOtherCharges.map(charge => (
                  <div key={charge._id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px', background: '#0D1117', borderRadius: '6px',
                    fontSize: '12px', gap: '8px', flexWrap: 'wrap'
                  }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ color: '#E8F5E9', margin: 0, fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{charge.item}</p>
                      <p style={{ color: '#8B949E', margin: 0, fontSize: '11px' }}>{charge.debtName} · {formatDate(charge.date)}</p>
                    </div>
                    <span style={{ fontWeight: 'bold', color: '#E8F5E9' }}>${charge.amount}</span>
                    {charge.paidSoFar > 0 && (
                      <span style={{ color: '#1DB954', fontSize: '10px' }}>${charge.paidSoFar} paid</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={() => setShowSettled(!showSettled)}
            style={{
              width: '100%', padding: '8px', background: '#0D1117',
              border: '1px solid #30363D', borderRadius: '8px',
              color: '#8B949E', fontSize: '13px', cursor: 'pointer'
            }}
          >
            {showSettled ? '▲ Hide Settled Charges' : '▼ View Settled Charges'}
          </button>

          {showSettled && (
            <div style={{ background: '#161B22', border: '1px solid #30363D', borderRadius: '12px', padding: '16px' }}>
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
              {settledOtherCharges.length === 0 ? (
                <p style={{ color: '#8B949E', fontSize: '13px', margin: 0 }}>Nothing settled this month</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {settledOtherCharges.map(charge => (
                    <div key={charge._id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 12px', background: '#0D1117', borderRadius: '6px',
                      fontSize: '12px', gap: '8px'
                    }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ color: '#E8F5E9', margin: 0, fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {charge.item} <span style={{ color: '#1DB954' }}>✓</span>
                        </p>
                        <p style={{ color: '#8B949E', margin: 0, fontSize: '11px' }}>
                          {charge.debtName} · {charge.paidDate ? `paid ${formatDate(charge.paidDate)}` : formatDate(charge.date)}
                        </p>
                      </div>
                      <span style={{ fontWeight: 'bold', color: '#1DB954' }}>${charge.amount}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
                      <div
                        key={p._id}
                        onClick={() => togglePaycheckBreakdown(p._id)}
                        style={{
                          background: '#161B22', border: '1px solid #30363D',
                          borderRadius: '10px', padding: '14px',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          cursor: 'pointer', flexWrap: 'wrap'
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
                        {expandedPaycheckId === p._id && (
                          <div style={{ flexBasis: '100%', borderTop: '1px solid #30363D', marginTop: '10px', paddingTop: '10px' }} onClick={e => e.stopPropagation()}>
                            {!paycheckBreakdown ? (
                              <p style={{ color: '#8B949E', fontSize: '12px', margin: 0 }}>Loading...</p>
                            ) : (
                              <>
                                <p style={{ color: '#8B949E', fontSize: '11px', margin: '0 0 8px 0' }}>
                                  Window: {formatDate(paycheckBreakdown.periodStart)} – {formatDate(paycheckBreakdown.periodEnd)}
                                </p>
                                {paycheckBreakdown.items.length === 0 ? (
                                  <p style={{ color: '#8B949E', fontSize: '12px', margin: 0 }}>Nothing counted in this window</p>
                                ) : (
                                  paycheckBreakdown.items.map((item, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '12px', marginBottom: '4px' }}>
                                      <span style={{ color: '#E8F5E9', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                                      <span style={{ color: '#8B949E', fontSize: '11px' }}>{item.type}</span>
                                      <span style={{ color: '#E8F5E9', fontWeight: 'bold' }}>-${item.amount.toFixed(2)}</span>
                                    </div>
                                  ))
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #30363D', marginTop: '8px', paddingTop: '8px', fontSize: '12px' }}>
                                  <span style={{ color: '#8B949E' }}>Computed leftover</span>
                                  <span style={{ color: '#1DB954', fontWeight: 'bold' }}>${paycheckBreakdown.computedLeftover.toFixed(2)}</span>
                                </div>
                                {Math.abs(paycheckBreakdown.computedLeftover - (paycheckBreakdown.storedLeftover ?? paycheckBreakdown.computedLeftover)) > 0.01 && (
                                  <p style={{ color: '#FFD700', fontSize: '11px', margin: '6px 0 0 0' }}>
                                    ⚠️ Stored leftover (${paycheckBreakdown.storedLeftover?.toFixed(2)}) differs — data changed since this was calculated
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        )}
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

export default TheirPage;