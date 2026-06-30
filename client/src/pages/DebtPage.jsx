import { useState, useEffect } from 'react';
import { getAllDebts, getDebtBalance, deleteDebt, getDebtTransactions, createDebtTransaction, getHouseholdMembers } from '../services/api';
import { CATEGORIES } from '../constants';

let CATEGORIES = ['Misc.', 'Housing', 'Food', 'Utilities', 'Subscriptions', 'Shopping', 'Entertainment', 'Travel'];

function DebtPage() {
  let [debts, setDebts] = useState([]);
  let [members, setMembers] = useState([]);
  let [loading, setLoading] = useState(true);
  let [expandedId, setExpandedId] = useState(null);
  let [transactions, setTransactions] = useState([]);
  let [newItem, setNewItem] = useState('');
  let [newAmount, setNewAmount] = useState('');
  let [newCategory, setNewCategory] = useState('Misc.');
  let [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  let [newMadeBy, setNewMadeBy] = useState('');

  let userId = localStorage.getItem('userId');
  let householdId = localStorage.getItem('householdId');

  useEffect(function() {
    fetchDebts();
    fetchMembers();
  }, []);

  async function fetchDebts() {
    try {
      let debtsRes = await getAllDebts(householdId);

      let debtsWithBalance = await Promise.all(
        debtsRes.data.map(async (debt) => {
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

  async function fetchMembers() {
    let res = await getHouseholdMembers(householdId);
    setMembers(res.data);
    if (res.data.length > 0) {
      setNewMadeBy(res.data.find(m => m._id === userId)?._id || res.data[0]._id);
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
    let res = await getDebtTransactions(debtId);
    setTransactions(res.data);
  }

  async function handleAddTransaction(debtId) {
    if (!newItem || !newAmount || !newMadeBy) return;
    await createDebtTransaction({
      debt: debtId,
      item: newItem,
      madeBy: newMadeBy,
      date: newDate,
      amount: Number(newAmount),
      category: newCategory
    });
    setNewItem('');
    setNewAmount('');
    setNewCategory('Misc.');
    setNewDate(new Date().toISOString().split('T')[0]);
    let res = await getDebtTransactions(debtId);
    setTransactions(res.data);
    fetchDebts();
  }

  function getDebtAccent(debt) {
    if (debt.isShared) return 'linear-gradient(135deg, #B8334D, #8B1E3F)';
    if (debt.owner === userId) return 'linear-gradient(135deg, #7C2D3E, #5C1F2D)';
    return 'linear-gradient(135deg, #A13C5C, #7A2844)';
  }

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
        marginBottom: '24px',
        background: 'linear-gradient(135deg, #B8334D, #8B1E3F)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>Debt</h1>

      {debts.length === 0 ? (
        <p style={{ color: '#8B949E' }}>No debts yet</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {debts.map(debt => {
            let paidSoFar = debt.startingBalance - debt.currentBalance;
            let percentPaid = Math.max(0, Math.min(100, (paidSoFar / debt.startingBalance) * 100));
            let accent = getDebtAccent(debt);
            let isExpanded = expandedId === debt._id;

            return (
              <div key={debt._id} style={{
                background: '#161B22',
                border: '1px solid #30363D',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <p style={{
                    fontWeight: 'bold',
                    fontSize: '16px',
                    background: accent,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    {debt.name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <p style={{ color: '#8B949E', fontSize: '13px' }}>
                      {debt.interestRate}% APR
                    </p>
                    <button
                      onClick={() => handleDelete(debt._id)}
                      style={{ background: 'none', border: 'none', color: '#FF6B6B', cursor: 'pointer', fontSize: '16px', padding: '4px' }}
                    >
                      ✕
                    </button>
                  </div>
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

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '12px' }}>
                  <span style={{ color: '#cfcfcf' }}>${paidSoFar.toFixed(2)} paid of ${debt.startingBalance.toFixed(2)}</span>
                  <span style={{ color: '#cfcfcf' }}>${debt.currentBalance.toFixed(2)} remaining</span>
                </div>

                <button
                  onClick={() => toggleExpand(debt._id)}
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
                  {isExpanded ? '▲ Hide Transactions' : '▼ View Transactions'}
                </button>

                {isExpanded && (
                  <div style={{ marginTop: '14px', borderTop: '1px solid #30363D', paddingTop: '14px' }}>
                    {transactions.length === 0 ? (
                      <p style={{ color: '#8B949E', fontSize: '13px', marginBottom: '12px' }}>No transactions yet</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                        {transactions.map(t => (
                          <div key={t._id} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '8px 12px', background: '#0D1117', borderRadius: '6px', fontSize: '12px'
                          }}>
                            <span style={{ color: '#E8F5E9', flex: 1 }}>{t.item}</span>
                            <span style={{ color: '#8B949E', flex: 1, textAlign: 'center' }}>{t.category}</span>
                            <span style={{ color: '#cfcfcf', flex: 1, textAlign: 'center' }}>{new Date(t.date).toLocaleDateString()}</span>
                            <span style={{ fontWeight: 'bold', color: '#E8F5E9' }}>${t.amount}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          placeholder="Item"
                          value={newItem}
                          onChange={e => setNewItem(e.target.value)}
                          style={{ ...inputStyle, flex: 2 }}
                        />
                        <input
                          placeholder="Amount"
                          type="number"
                          value={newAmount}
                          onChange={e => setNewAmount(e.target.value)}
                          style={{ ...inputStyle, flex: 1 }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <select
                          value={newCategory}
                          onChange={e => setNewCategory(e.target.value)}
                          style={{ ...inputStyle, flex: 1 }}
                        >
                          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        <input
                          type="date"
                          value={newDate}
                          onChange={e => setNewDate(e.target.value)}
                          style={{ ...inputStyle, flex: 1 }}
                        />
                        <select
                          value={newMadeBy}
                          onChange={e => setNewMadeBy(e.target.value)}
                          style={{ ...inputStyle, flex: 1 }}
                        >
                          {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                        </select>
                      </div>
                      <button
                        onClick={() => handleAddTransaction(debt._id)}
                        style={{
                          padding: '8px', borderRadius: '6px', border: 'none',
                          background: accent, color: 'white', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer'
                        }}
                      >
                        Add Transaction
                      </button>
                    </div>
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