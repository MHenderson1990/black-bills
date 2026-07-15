import { useState, useEffect } from 'react';
import { getAllDebts, getDebtBalance, deleteDebt, getDebtTransactions, createDebtTransaction, updateDebtTransaction, deleteDebtTransaction, getHouseholdMembers, createDebt, getDebtPayoff, createDebtPayment, updateDebtPayment, deleteDebtPayment, getDebtPayments } from '../services/api';
import { CATEGORIES, MONTHS, YEARS, formatDate } from '../constants';

function payoffDateLabel(months) {
  let d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function DebtPage() {
  let [debts, setDebts] = useState([]);
  let [members, setMembers] = useState([]);
  let [loading, setLoading] = useState(true);
  let [expandedId, setExpandedId] = useState(null);
  let [expandedView, setExpandedView] = useState('transactions');
  let [transactions, setTransactions] = useState([]);
  let [payments, setPayments] = useState([]);
  let now = new Date();
  let [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  let [selectedMonthNum, setSelectedMonthNum] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  let [newItem, setNewItem] = useState('');
  let [newAmount, setNewAmount] = useState('');
  let [newCategory, setNewCategory] = useState('Misc.');
  let [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  let [newMadeBy, setNewMadeBy] = useState('');
  let [chargeFilter, setChargeFilter] = useState('everyone');
  let [newPaymentAmount, setNewPaymentAmount] = useState('');
  let [newPaymentTransactionId, setNewPaymentTransactionId] = useState('');
  let [newPaymentDate, setNewPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  let [newPaymentMadeBy, setNewPaymentMadeBy] = useState('');
  let [editingTransactionId, setEditingTransactionId] = useState(null);
  let [editingPaymentId, setEditingPaymentId] = useState(null);
  let [showAddDebt, setShowAddDebt] = useState(false);
  let [newDebtName, setNewDebtName] = useState('');
  let [newStartingBalance, setNewStartingBalance] = useState('');
  let [newInterestRate, setNewInterestRate] = useState('');
  let [newIsShared, setNewIsShared] = useState(false);
  let [newOwner, setNewOwner] = useState('');

  let userId = localStorage.getItem('userId');
  let householdId = localStorage.getItem('householdId');

  useEffect(function() {
    fetchDebts();
    fetchMembers();
  }, []);

  async function fetchDebts() {
    try {
      let debtsRes = await getAllDebts(householdId);
      let debtsWithData = await Promise.all(
        debtsRes.data.map(async (debt) => {
          let balanceRes = await getDebtBalance(debt._id);
          let payoffRes = await getDebtPayoff(debt._id);
          return {
            ...debt,
            currentBalance: balanceRes.data.balance,
            startingBalance: balanceRes.data.startingBalance,
            totalCharged: balanceRes.data.totalCharged,
            totalPaid: balanceRes.data.totalPaid,
            payoff: payoffRes.data
          };
        })
      );
      setDebts(debtsWithData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMembers() {
    let res = await getHouseholdMembers(householdId);
    setMembers(res.data);
    if (res.data.length > 0) {
      let me = res.data.find(m => m._id === userId)?._id || res.data[0]._id;
      setNewMadeBy(me);
      setNewPaymentMadeBy(me);
      setNewOwner(me);
    }
  }

  async function handleDelete(debtId) {
    if (window.confirm('Delete this debt? This cannot be undone.')) {
      await deleteDebt(debtId);
      setDebts(debts.filter(d => d._id !== debtId));
    }
  }

  async function toggleExpand(debtId) {
    if (expandedId === debtId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(debtId);
    setExpandedView('transactions');
    setEditingTransactionId(null);
    setEditingPaymentId(null);
    let [tRes, pRes] = await Promise.all([
      getDebtTransactions(debtId),
      getDebtPayments(debtId)
    ]);
    setTransactions([...tRes.data].sort((a, b) => new Date(b.date) - new Date(a.date)));
    setPayments([...pRes.data].sort((a, b) => new Date(b.date) - new Date(a.date)));
  }


  async function handleSaveTransaction(debtId) {
    if (!newItem || !newAmount || !newMadeBy) return;
    let isBoth = newMadeBy === 'both';
    let data = {
      item: newItem,
      madeBy: isBoth ? userId : newMadeBy,
      madeByBoth: isBoth,
      date: newDate,
      amount: Number(newAmount),
      category: newCategory
    };
    try {
      if (editingTransactionId) {
        await updateDebtTransaction(editingTransactionId, data);
      } else {
        await createDebtTransaction({ ...data, debt: debtId });
      }
      setNewItem('');
      setNewAmount('');
      setNewCategory('Misc.');
      setNewDate(new Date().toISOString().split('T')[0]);
      setEditingTransactionId(null);
      let res = await getDebtTransactions(debtId);
      setTransactions([...res.data].sort((a, b) => new Date(b.date) - new Date(a.date)));
      fetchDebts();
    } catch (error) {
      console.error(error);
      alert('Failed to save charge');
    }
  }

  async function handleSavePayment(debtId) {
    if (!newPaymentAmount || !newPaymentMadeBy) return;
    let data = {
      madeBy: newPaymentMadeBy,
      date: newPaymentDate,
      amount: Number(newPaymentAmount),
      transaction: newPaymentTransactionId || undefined
    };
    try {
      if (editingPaymentId) {
        await updateDebtPayment(editingPaymentId, data);
      } else {
        await createDebtPayment({ ...data, debt: debtId });
      }
      setNewPaymentAmount('');
      setNewPaymentDate(new Date().toISOString().split('T')[0]);
      setNewPaymentTransactionId('');
      setEditingPaymentId(null);
      let res = await getDebtPayments(debtId);
      setPayments([...res.data].sort((a, b) => new Date(b.date) - new Date(a.date)));
      let tRes = await getDebtTransactions(debtId);
      setTransactions(tRes.data);
      fetchDebts();
    } catch (error) {
      console.error(error);
      alert('Failed to save payment');
    }
  }

  function startEditTransaction(t) {
    setEditingTransactionId(t._id);
    setNewItem(t.item);
    setNewAmount(String(t.amount));
    setNewCategory(t.category || 'Misc.');
    setNewDate(t.date ? t.date.slice(0, 10) : new Date().toISOString().split('T')[0]);
    setNewMadeBy(t.madeBy);
  }

  function startEditPayment(p) {
    setEditingPaymentId(p._id);
    setNewPaymentAmount(String(p.amount));
    setNewPaymentDate(p.date ? p.date.slice(0, 10) : new Date().toISOString().split('T')[0]);
    setNewPaymentMadeBy(p.madeBy);
  }

  async function handleDeleteTransaction(transactionId, debtId) {
    if (window.confirm('Delete this charge?')) {
      await deleteDebtTransaction(transactionId);
      let res = await getDebtTransactions(debtId);
      setTransactions([...res.data].sort((a, b) => new Date(b.date) - new Date(a.date)));
      fetchDebts();
    }
  }

  async function handleDeletePayment(paymentId, debtId) {
    if (window.confirm('Delete this payment?')) {
      await deleteDebtPayment(paymentId);
      let res = await getDebtPayments(debtId);
      setPayments([...res.data].sort((a, b) => new Date(b.date) - new Date(a.date)));
      let tRes = await getDebtTransactions(debtId);
      setTransactions(tRes.data);
      fetchDebts();
    }
  }

  async function handleAddDebt() {
    if (!newDebtName || !newStartingBalance || newInterestRate === '') return;
    await createDebt({
      name: newDebtName,
      startingBalance: Number(newStartingBalance),
      interestRate: Number(newInterestRate),
      isShared: newIsShared,
      owner: newIsShared ? undefined : (newOwner || userId),
      householdId
    });
    setNewDebtName('');
    setNewStartingBalance('');
    setNewInterestRate('');
    setNewIsShared(false);
    setNewOwner('');
    setShowAddDebt(false);
    fetchDebts();
  }

  function getDebtAccent(debt) {
    if (debt.isShared) return 'linear-gradient(135deg, #B8334D, #8B1E3F)';
    let ownerName = members.find(m => m._id === debt.owner)?.name;
    if (ownerName === 'Mo') return 'linear-gradient(135deg, #4DA3FF, #0080FF)';
    return 'linear-gradient(135deg, #FF8FC7, #FF4DA6)';
  }

  function renderPayoff(debt) {
    let p = debt.payoff;
    if (!p) return null;

    if (p.monthsToPayoff === null || p.monthsToPayoff === undefined) {
      let msg = p.message === 'Payment too low to outpace interest'
        ? '⚠️ Recent payments are too low to outpace interest — balance will grow'
        : 'Add payments to see a payoff projection';
      return (
        <p style={{ color: '#8B949E', fontSize: '12px', margin: '0 0 12px 0' }}>{msg}</p>
      );
    }

    let years = Math.floor(p.monthsToPayoff / 12);
    let months = p.monthsToPayoff % 12;
    let lengthLabel = years > 0
      ? `${years} yr${years > 1 ? 's' : ''}${months > 0 ? ` ${months} mo` : ''}`
      : `${months} mo`;

    return (
      <div style={{
        background: '#0D1117',
        borderRadius: '8px',
        padding: '10px 14px',
        marginBottom: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        fontSize: '12px'
      }}>
        <span style={{ color: '#8B949E' }}>
          Paid off <span style={{ color: '#E8F5E9', fontWeight: 'bold' }}>{payoffDateLabel(p.monthsToPayoff)}</span> ({lengthLabel})
        </span>
        <span style={{ color: '#8B949E' }}>
          Avg payment <span style={{ color: '#E8F5E9', fontWeight: 'bold' }}>${p.averagePayment?.toFixed(2)}</span>/mo
        </span>
      </div>
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
          background: 'linear-gradient(135deg, #B8334D, #8B1E3F)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>Debt</h1>
        <button
          onClick={() => setShowAddDebt(!showAddDebt)}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: 'none',
            background: 'linear-gradient(135deg, #B8334D, #8B1E3F)',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '13px',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          {showAddDebt ? '✕ Cancel' : '+ Add Debt'}
        </button>
      </div>

      {showAddDebt && (
        <div style={{
          background: '#161B22',
          border: '1px solid #30363D',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <h2 style={{ color: '#E8F5E9', fontSize: '15px', marginTop: 0, marginBottom: '14px' }}>New Debt</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                placeholder="Debt name"
                value={newDebtName}
                onChange={e => setNewDebtName(e.target.value)}
                style={{ ...inputStyle, flex: '2 1 140px' }}
              />
              <input
                placeholder="Starting balance"
                type="number"
                value={newStartingBalance}
                onChange={e => setNewStartingBalance(e.target.value)}
                style={{ ...inputStyle, flex: '1 1 110px' }}
              />
              <input
                placeholder="Interest rate %"
                type="number"
                value={newInterestRate}
                onChange={e => setNewInterestRate(e.target.value)}
                style={{ ...inputStyle, flex: '1 1 100px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ color: '#8B949E', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="checkbox"
                  checked={newIsShared}
                  onChange={e => setNewIsShared(e.target.checked)}
                />
                Shared debt
              </label>
              {!newIsShared && (
                <select
                  value={newOwner}
                  onChange={e => setNewOwner(e.target.value)}
                  style={{ ...inputStyle, flex: '1 1 120px' }}
                >
                  {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                </select>
              )}
            </div>
            <button
              onClick={handleAddDebt}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #B8334D, #8B1E3F)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Save Debt
            </button>
          </div>
        </div>
      )}

      {debts.length === 0 ? (
        <p style={{ color: '#8B949E' }}>No debts yet</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {debts.map(debt => {
            let accent = getDebtAccent(debt);
            let isExpanded = expandedId === debt._id;
            let filteredTransactions = transactions
              .filter(t => t.date.slice(0, 7) === `${selectedYear}-${selectedMonthNum}`)
              .filter(t => {
                if (chargeFilter === 'everyone') return true;
                if (chargeFilter === 'both') return t.madeByBoth;
                return !t.madeByBoth && t.madeBy === chargeFilter;
              });
            let filteredPayments = payments.filter(p => p.date.slice(0, 7) === `${selectedYear}-${selectedMonthNum}`);

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
                  }}>
                    {debt.name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    <p style={{ color: '#8B949E', fontSize: '13px', margin: 0 }}>{debt.interestRate}% APR</p>
                    <button
                      onClick={() => handleDelete(debt._id)}
                      style={{ background: 'none', border: 'none', color: '#FF6B6B', cursor: 'pointer', fontSize: '16px', padding: '4px' }}
                    >✕</button>
                  </div>
                </div>

                

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8B949E' }}>Starting balance</span>
                    <span style={{ color: '#cfcfcf' }}>${debt.startingBalance.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8B949E' }}>Total charged</span>
                    <span style={{ color: '#FF8FC7' }}>+${debt.totalCharged.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8B949E' }}>Total paid</span>
                    <span style={{ color: '#1DB954' }}>-${debt.totalPaid.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #30363D', marginTop: '4px', paddingTop: '6px' }}>
                    <span style={{ color: '#E8F5E9', fontWeight: 'bold' }}>Remaining Balance</span>
                    <span style={{
                      fontWeight: 'bold',
                      background: accent, WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                    }}>${debt.currentBalance.toFixed(2)}</span>
                  </div>
                </div>

                {renderPayoff(debt)}

                <button
                  onClick={() => toggleExpand(debt._id)}
                  style={{
                    width: '100%', padding: '8px', background: '#0D1117',
                    border: '1px solid #30363D', borderRadius: '8px',
                    color: '#8B949E', fontSize: '13px', cursor: 'pointer'
                  }}
                >
                  {isExpanded ? '▲ Hide Activity' : '▼ View Activity'}
                </button>

                {isExpanded && (
                  <div style={{ marginTop: '14px', borderTop: '1px solid #30363D', paddingTop: '14px' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <button
                        onClick={() => setExpandedView('transactions')}
                        style={{
                          flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                          fontWeight: 'bold', fontSize: '12px', cursor: 'pointer',
                          background: expandedView === 'transactions' ? accent : '#0D1117',
                          color: expandedView === 'transactions' ? 'white' : '#8B949E'
                        }}
                      >
                        Charges
                      </button>
                      <button
                        onClick={() => setExpandedView('payments')}
                        style={{
                          flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                          fontWeight: 'bold', fontSize: '12px', cursor: 'pointer',
                          background: expandedView === 'payments' ? 'linear-gradient(135deg, #1DB954, #107C41)' : '#0D1117',
                          color: expandedView === 'payments' ? 'white' : '#8B949E'
                        }}
                      >
                        Payments
                      </button>
                    </div>

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

                    {expandedView === 'transactions' && (
                      <>
                      <select
                          value={chargeFilter}
                          onChange={e => setChargeFilter(e.target.value)}
                          style={{ ...inputStyle, marginBottom: '12px', width: '100%' }}
                        >
                          <option value="everyone">Everyone</option>
                          {members.map(m => <option key={m._id} value={m._id}>{m.name} only</option>)}
                          <option value="both">Both (joint) only</option>
                        </select>

                        {!editingTransactionId && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <input
                                placeholder="Item"
                                value={newItem}
                                onChange={e => setNewItem(e.target.value)}
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
                                style={{ ...inputStyle, flex: '1 1 100px' }}
                              >
                                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                              </select>
                              <input
                                type="date"
                                value={newDate}
                                onChange={e => setNewDate(e.target.value)}
                                style={{ ...inputStyle, flex: '1 1 120px', colorScheme: 'dark' }}
                              />
                              <select
                                value={newMadeBy}
                                onChange={e => setNewMadeBy(e.target.value)}
                                style={{ ...inputStyle, flex: '1 1 100px' }}
                              >
                                {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                                <option value="both">Both</option>
                              </select>
                            </div>
                            <button
                              onClick={() => handleSaveTransaction(debt._id)}
                              style={{
                                padding: '10px', borderRadius: '6px', border: 'none',
                                background: accent, color: 'white', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer'
                              }}
                            >
                              Add Charge
                            </button>
                          </div>
                        )}

                        {filteredTransactions.length === 0 ? (
                          <p style={{ color: '#8B949E', fontSize: '13px', marginBottom: '12px' }}>No charges this month</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                            {filteredTransactions.map(t => (
                              <div key={t._id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '8px 12px', background: '#0D1117', borderRadius: '6px', fontSize: '12px', gap: '8px', flexWrap: 'wrap',
                                border: editingTransactionId === t._id ? '1px solid #4DA3FF' : '1px solid transparent'
                              }}>
                                <span style={{ color: '#E8F5E9', width: '140px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.item}</span>
                                <span style={{ color: '#8B949E', width: '60px', flexShrink: 0, textAlign: 'center' }}>
                                  {t.madeByBoth ? 'Both' : (members.find(m => m._id === t.madeBy)?.name || '')}
                                </span>
                                <span style={{ color: '#8B949E', width: '90px', flexShrink: 0, textAlign: 'center' }}>{t.category}</span>
                                <span style={{ color: '#cfcfcf', width: '80px', flexShrink: 0, textAlign: 'center' }}>{formatDate(t.date)}</span>
                                <span style={{ fontWeight: 'bold', color: '#1DB954', width: '70px', flexShrink: 0, textAlign: 'right' }}>
                                  -${Number.isInteger(p.amount) ? p.amount : p.amount.toFixed(2)}
                                </span>
                                <button
                                  onClick={() => startEditTransaction(t)}
                                  style={{ background: 'none', border: 'none', color: '#8B949E', cursor: 'pointer', fontSize: '13px', padding: '2px' }}
                                >✎</button>
                                <button
                                  onClick={() => handleDeleteTransaction(t._id, debt._id)}
                                  style={{ background: 'none', border: 'none', color: '#FF6B6B', cursor: 'pointer', fontSize: '13px', padding: '2px' }}
                                >✕</button>
                                {editingTransactionId === t._id && (
                                  <div style={{ flexBasis: '100%', borderTop: '1px solid #30363D', marginTop: '8px', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }} onClick={e => e.stopPropagation()}>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                      <input
                                        placeholder="Item"
                                        value={newItem}
                                        onChange={e => setNewItem(e.target.value)}
                                        style={{ ...inputStyle, flex: '2 1 120px', padding: '8px' }}
                                      />
                                      <input
                                        placeholder="Amount"
                                        type="number"
                                        value={newAmount}
                                        onChange={e => setNewAmount(e.target.value)}
                                        style={{ ...inputStyle, flex: '1 1 80px', padding: '8px' }}
                                      />
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                      <select
                                        value={newCategory}
                                        onChange={e => setNewCategory(e.target.value)}
                                        style={{ ...inputStyle, flex: '1 1 90px', padding: '8px' }}
                                      >
                                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                      </select>
                                      <input
                                        type="date"
                                        value={newDate}
                                        onChange={e => setNewDate(e.target.value)}
                                        style={{ ...inputStyle, flex: '1 1 110px', padding: '8px', colorScheme: 'dark' }}
                                      />
                                      <select
                                        value={newMadeBy}
                                        onChange={e => setNewMadeBy(e.target.value)}
                                        style={{ ...inputStyle, flex: '1 1 90px', padding: '8px' }}
                                      >
                                        {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                                        <option value="both">Both</option>
                                      </select>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      <button
                                        onClick={() => handleSaveTransaction(debt._id)}
                                        style={{
                                          flex: 1, padding: '8px', borderRadius: '6px', border: 'none',
                                          background: accent, color: 'white', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer'
                                        }}
                                      >
                                        Save Changes
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingTransactionId(null);
                                          setNewItem('');
                                          setNewAmount('');
                                          setNewCategory('Misc.');
                                          setNewDate(new Date().toISOString().split('T')[0]);
                                        }}
                                        style={{
                                          flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #30363D',
                                          background: 'transparent', color: '#8B949E', fontSize: '12px', cursor: 'pointer'
                                        }}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        
                      </>
                    )}

                    {expandedView === 'payments' && (
                      <>
                    <select
                            value={newPaymentTransactionId}
                            onChange={e => setNewPaymentTransactionId(e.target.value)}
                            style={{ ...inputStyle, width: '100%', marginBottom: '8px' }}
                          >
                            <option value="">No specific charge (lump payment)</option>
                            {transactions.filter(t => !t.paid).map(t => (
                              <option key={t._id} value={t._id}>
                                {t.item} — ${t.amount} (${(t.amount - (t.paidSoFar || 0)).toFixed(2)} left)
                              </option>
                            ))}
                          </select>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <input
                              placeholder="Payment amount"
                              type="number"
                              value={newPaymentAmount}
                              onChange={e => setNewPaymentAmount(e.target.value)}
                              style={{ ...inputStyle, flex: '1 1 110px' }}
                            />
                            <input
                              type="date"
                              value={newPaymentDate}
                              onChange={e => setNewPaymentDate(e.target.value)}
                              style={{ ...inputStyle, flex: '1 1 120px', colorScheme: 'dark' }}
                            />
                            <select
                              value={newPaymentMadeBy}
                              onChange={e => setNewPaymentMadeBy(e.target.value)}
                              style={{ ...inputStyle, flex: '1 1 100px' }}
                            >
                              {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                            </select>
                          </div>
                          <button
                            onClick={() => handleSavePayment(debt._id)}
                            style={{
                              padding: '10px', borderRadius: '6px', border: 'none',
                              background: 'linear-gradient(135deg, #1DB954, #107C41)',
                              color: 'white', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer'
                            }}
                          >
                            {editingPaymentId ? 'Save Changes' : 'Add Payment'}
                          </button>
                          {editingPaymentId && (
                            <button
                              onClick={() => {
                                setEditingPaymentId(null);
                                setNewPaymentAmount('');
                                setNewPaymentDate(new Date().toISOString().split('T')[0]);
                              }}
                              style={{
                                padding: '8px', borderRadius: '6px', border: '1px solid #30363D',
                                background: 'transparent', color: '#8B949E', fontSize: '12px', cursor: 'pointer'
                              }}
                            >
                              Cancel Edit
                            </button>
                          )}
                        </div>

                        {filteredPayments.length === 0 ? (
                          <p style={{ color: '#8B949E', fontSize: '13px', marginBottom: '12px' }}>No payments this month</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                            {filteredPayments.map(p => (
                              <div key={p._id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '8px 12px', background: '#0D1117', borderRadius: '6px', fontSize: '12px', gap: '8px',
                                border: editingPaymentId === p._id ? '1px solid #1DB954' : '1px solid transparent'
                              }}>
                                <span style={{ color: '#E8F5E9', width: '160px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {members.find(m => m._id === p.madeBy)?.name || 'Payment'}
                                  {p.transaction?.item && <span style={{ color: '#8B949E' }}> · {p.transaction.item}</span>}
                                </span>
                                <span style={{ color: '#cfcfcf', width: '80px', flexShrink: 0, textAlign: 'center' }}>{formatDate(p.date)}</span>
                                <span style={{ fontWeight: 'bold', color: '#1DB954', width: '70px', flexShrink: 0, textAlign: 'right' }}>
                                  -${Number.isInteger(p.amount) ? p.amount : p.amount.toFixed(2)}
                                </span>
                                <button
                                  onClick={() => startEditPayment(p)}
                                  style={{ background: 'none', border: 'none', color: '#8B949E', cursor: 'pointer', fontSize: '13px', padding: '2px' }}
                                >✎</button>
                                <button
                                  onClick={() => handleDeletePayment(p._id, debt._id)}
                                  style={{ background: 'none', border: 'none', color: '#FF6B6B', cursor: 'pointer', fontSize: '13px', padding: '2px' }}
                                >✕</button>
                              </div>
                            ))}
                          </div>
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
  );
}

export default DebtPage;