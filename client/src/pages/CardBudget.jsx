import { useState, useEffect } from 'react';
import { getAllDebts, getHouseholdMembers, getRecentPayDate, setCardBudget, getCardBudgetSummary, getCardBudgetHistory, getBudgetPurchases, createDebtTransaction, 
    updateDebtTransaction, deleteDebtTransaction, markTransactionPaid, deleteCardBudget } from '../services/api';
import { CATEGORIES, formatDate } from '../constants';

let GOLD = 'linear-gradient(135deg, #FFD700, #E6C200)';

function CardBudget() {
  let [cards, setCards] = useState([]);
  let [selectedCard, setSelectedCard] = useState('');
  let [members, setMembers] = useState([]);
  let [periodStart, setPeriodStart] = useState(null);
  let [periodEnd, setPeriodEnd] = useState(null);
  let [summary, setSummary] = useState(null);
  let [loading, setLoading] = useState(true);
  let [showSetBudget, setShowSetBudget] = useState(false);
  let [newBudgetAmount, setNewBudgetAmount] = useState('');
  let [newItem, setNewItem] = useState('');
  let [newAmount, setNewAmount] = useState('');
  let [newCategory, setNewCategory] = useState('Misc.');
  let [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  let [newMadeBy, setNewMadeBy] = useState('');
  let [editingPurchaseId, setEditingPurchaseId] = useState(null);
  let [showHistory, setShowHistory] = useState(false);
  let [budgetHistory, setBudgetHistory] = useState([]);
  let [expandedPeriodStart, setExpandedPeriodStart] = useState(null);
  let [expandedPurchases, setExpandedPurchases] = useState([]);

  let userId = localStorage.getItem('userId');
  let householdId = localStorage.getItem('householdId');

  useEffect(function() {
    fetchBase();
  }, []);

  useEffect(function() {
    if (selectedCard && periodStart && periodEnd) {
      fetchSummary();
    }
  }, [selectedCard, periodStart, periodEnd]);

  async function fetchBase() {
    try {
      let [debtsRes, membersRes, recentRes] = await Promise.all([
        getAllDebts(householdId),
        getHouseholdMembers(householdId),
        getRecentPayDate(userId)
      ]);

      let sharedCards = debtsRes.data.filter(d => d.isShared);
      setCards(sharedCards);
      if (sharedCards.length > 0) setSelectedCard(sharedCards[0]._id);

      setMembers(membersRes.data);
      setNewMadeBy(userId);

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

  async function fetchSummary() {
    try {
      let res = await getCardBudgetSummary(householdId, selectedCard, periodStart, periodEnd);
      setSummary(res.data);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleSetBudget() {
    if (!newBudgetAmount) return;
    await setCardBudget({
      householdId,
      debt: selectedCard,
      amount: Number(newBudgetAmount),
      periodStart
    });
    setNewBudgetAmount('');
    setShowSetBudget(false);
    fetchSummary();
  }

  async function handleDeleteBudget() {
    if (window.confirm('Delete this period\'s budget? Logged purchases stay on the debt.')) {
      await deleteCardBudget(householdId, selectedCard, periodStart);
      setShowSetBudget(false);
      fetchSummary();
    }
  }

  async function handleSavePurchase() {
    if (!newItem || !newAmount) return;
    let isBoth = newMadeBy === 'both';
    let data = {
      item: newItem,
      madeBy: isBoth ? userId : newMadeBy,
      madeByBoth: isBoth,
      date: newDate,
      amount: Number(newAmount),
      category: newCategory,
      fromBudget: true
    };
    try {
      if (editingPurchaseId) {
        await updateDebtTransaction(editingPurchaseId, data);
      } else {
        await createDebtTransaction({ ...data, debt: selectedCard });
      }
      setNewItem('');
      setNewAmount('');
      setNewCategory('Misc.');
      setNewDate(new Date().toISOString().split('T')[0]);
      setEditingPurchaseId(null);
      fetchSummary();
    } catch (error) {
      console.error(error);
      alert('Failed to save purchase');
    }
  }

  function startEditPurchase(p) {
    setEditingPurchaseId(p._id);
    setNewItem(p.item);
    setNewAmount(String(p.amount));
    setNewCategory(p.category || 'Misc.');
    setNewDate(p.date ? p.date.slice(0, 10) : new Date().toISOString().split('T')[0]);
    setNewMadeBy(p.madeByBoth ? 'both' : p.madeBy);
  }

  async function handleDeletePurchase(purchaseId) {
    if (window.confirm('Delete this purchase? It will also be removed from the debt.')) {
      await deleteDebtTransaction(purchaseId);
      fetchSummary();
    }
  }

  async function handleMarkPurchasePaid(purchase) {
    if (window.confirm(`Log a $${purchase.amount} payment on this card for "${purchase.item}"?`)) {
      await markTransactionPaid(purchase._id);
      fetchSummary();
    }
  }

  async function toggleHistory() {
    if (showHistory) {
      setShowHistory(false);
      return;
    }
    let res = await getCardBudgetHistory(householdId, selectedCard);
    setBudgetHistory(res.data);
    setShowHistory(true);
  }

  async function togglePeriodExpand(budget) {
    let ps = budget.periodStart;
    if (expandedPeriodStart === ps) {
      setExpandedPeriodStart(null);
      return;
    }
    setExpandedPeriodStart(ps);
    let end = new Date(new Date(ps).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
    let res = await getBudgetPurchases(selectedCard, ps, end);
    setExpandedPurchases(res.data);
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
      <h1 style={{
        fontSize: 'clamp(20px, 5vw, 24px)',
        marginBottom: '20px',
        marginTop: 0,
        background: GOLD,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>Card Budget</h1>

      {cards.length === 0 ? (
        <p style={{ color: '#8B949E' }}>No shared credit cards yet — add a shared debt first.</p>
      ) : !periodStart ? (
        <p style={{ color: '#8B949E' }}>Set your pay schedule to use the card budget.</p>
      ) : (
        <>
          {cards.length > 1 && (
            <select
              value={selectedCard}
              onChange={e => setSelectedCard(e.target.value)}
              style={{ ...inputStyle, width: '100%', marginBottom: '16px' }}
            >
              {cards.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          )}

          <p style={{ color: '#8B949E', fontSize: '13px', marginTop: 0, marginBottom: '16px' }}>
            Pay period: {formatDate(periodStart)} – {formatDate(periodEnd)}
          </p>

          <div style={{
            background: '#161B22',
            border: '1px solid #FFD70044',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            {summary && summary.budgetAmount > 0 ? (
              <>
                <p style={{ color: '#8B949E', fontSize: '13px', marginTop: 0, marginBottom: '8px' }}>Left to Spend</p>
                <p style={{
                  fontSize: '40px', fontWeight: 'bold', margin: 0,
                  background: summary.remaining >= 0 ? GOLD : 'linear-gradient(135deg, #FF6B6B, #CC4444)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                }}>
                  ${summary.remaining.toFixed(2)}
                </p>
                <p style={{ color: '#8B949E', fontSize: '12px', marginTop: '6px', marginBottom: '12px' }}>
                  ${summary.spent.toFixed(2)} spent of ${summary.budgetAmount.toFixed(2)}
                </p>
                <div style={{ background: '#0D1117', borderRadius: '8px', height: '10px', overflow: 'hidden' }}>
                  <div style={{
                    background: summary.remaining >= 0 ? GOLD : 'linear-gradient(135deg, #FF6B6B, #CC4444)',
                    height: '100%',
                    width: `${Math.min(100, (summary.spent / summary.budgetAmount) * 100)}%`,
                    borderRadius: '8px',
                    transition: 'width 0.3s'
                  }} />
                </div>
              </>
            ) : (
              <p style={{ color: '#8B949E', margin: 0 }}>No budget set for this period yet</p>
            )}

            <button
              onClick={() => setShowSetBudget(!showSetBudget)}
              style={{
                marginTop: '14px', padding: '8px 16px', borderRadius: '20px', border: 'none',
                background: GOLD, color: '#0D1117', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer'
              }}
            >
              {showSetBudget ? '✕ Cancel' : (summary && summary.budgetAmount > 0 ? 'Change Budget' : 'Set Budget')}
            </button>

             {summary && summary.budgetAmount > 0 && (
              <button
                onClick={handleDeleteBudget}
                style={{
                  marginTop: '14px', marginLeft: '8px', padding: '8px 16px', borderRadius: '20px',
                  border: '1px solid #FF6B6B', background: 'transparent',
                  color: '#FF6B6B', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer'
                }}
              >
                Delete Budget
              </button>
            )} 

            {showSetBudget && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <input
                  placeholder="Budget amount"
                  type="number"
                  value={newBudgetAmount}
                  onChange={e => setNewBudgetAmount(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  onClick={handleSetBudget}
                  style={{
                    padding: '8px 14px', borderRadius: '6px', border: 'none',
                    background: GOLD, color: '#0D1117', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer'
                  }}
                >
                  Save
                </button>
              </div>
            )}
          </div>

            {!editingPurchaseId && (
          <div style={{
            background: '#161B22',
            border: '1px solid #30363D',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <h2 style={{ color: '#E8F5E9', fontSize: '15px', marginTop: 0, marginBottom: '12px' }}>
              Quick Log Purchase
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  placeholder="What was it?"
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
                onClick={handleSavePurchase}
                style={{
                  padding: '12px', borderRadius: '8px', border: 'none',
                  background: GOLD, color: '#0D1117', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer'
                }}
              >
                Log Purchase
              </button>
              
            </div>
          </div>
            )}

          {summary && summary.purchases.length > 0 && (
            <div style={{
              background: '#161B22',
              border: '1px solid #30363D',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <h2 style={{ color: '#E8F5E9', fontSize: '15px', marginTop: 0, marginBottom: '12px' }}>This Period's Purchases</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {summary.purchases.map(p => (
                  <div key={p._id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px', background: '#0D1117', borderRadius: '6px',
                    fontSize: '12px', gap: '8px', flexWrap: 'wrap',
                    border: editingPurchaseId === p._id ? '1px solid #FFD700' : '1px solid transparent'
                  }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ color: '#E8F5E9', margin: 0, fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.item} {p.paid && <span style={{ color: '#1DB954' }}>✓</span>}
                      </p>
                      <p style={{ color: '#8B949E', margin: 0, fontSize: '11px' }}>
                        {p.madeByBoth ? 'Both' : (members.find(m => m._id === p.madeBy)?.name || '')} · {formatDate(p.date)}
                      </p>
                    </div>
                    <span style={{ fontWeight: 'bold', color: '#E8F5E9' }}>${p.amount}</span>
                    {!p.paid && (
                      <button
                        onClick={() => handleMarkPurchasePaid(p)}
                        style={{
                          padding: '5px 10px', borderRadius: '6px', border: 'none',
                          background: 'linear-gradient(135deg, #1DB954, #107C41)',
                          color: 'white', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer'
                        }}
                      >
                        Mark Paid
                      </button>
                    )}
                    <button
                      onClick={() => startEditPurchase(p)}
                      style={{ background: 'none', border: 'none', color: '#8B949E', cursor: 'pointer', fontSize: '13px', padding: '2px' }}
                    >✎</button>
                    <button
                      onClick={() => handleDeletePurchase(p._id)}
                      style={{ background: 'none', border: 'none', color: '#FF6B6B', cursor: 'pointer', fontSize: '13px', padding: '2px' }}
                    >✕</button>
                    {editingPurchaseId === p._id && (
                      <div style={{ flexBasis: '100%', borderTop: '1px solid #30363D', marginTop: '8px', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <input
                            placeholder="What was it?"
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
                            onClick={handleSavePurchase}
                            style={{
                              flex: 1, padding: '8px', borderRadius: '6px', border: 'none',
                              background: GOLD, color: '#0D1117', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer'
                            }}
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={() => {
                              setEditingPurchaseId(null);
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
            </div>
          )}

          <button
            onClick={toggleHistory}
            style={{
              width: '100%', padding: '8px', background: '#0D1117',
              border: '1px solid #30363D', borderRadius: '8px',
              color: '#8B949E', fontSize: '13px', cursor: 'pointer'
            }}
          >
            {showHistory ? '▲ Hide Budget History' : '▼ View Budget History'}
          </button>

          {showHistory && (
            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {budgetHistory.length === 0 ? (
                <p style={{ color: '#8B949E', fontSize: '13px' }}>No past budgets</p>
              ) : (
                budgetHistory.map(b => (
                  <div
                    key={b._id}
                    onClick={() => togglePeriodExpand(b)}
                    style={{
                      background: '#161B22', border: '1px solid #30363D',
                      borderRadius: '10px', padding: '14px', cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap'
                    }}
                  >
                    <p style={{ color: '#8B949E', fontSize: '12px', margin: 0 }}>
                      Period starting {formatDate(b.periodStart)}
                    </p>
                    <p style={{
                      fontSize: '15px', fontWeight: 'bold', margin: 0,
                      background: GOLD, WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                    }}>${b.amount.toFixed(2)}</p>

                    {expandedPeriodStart === b.periodStart && (
                      <div style={{ flexBasis: '100%', borderTop: '1px solid #30363D', marginTop: '10px', paddingTop: '10px' }} onClick={e => e.stopPropagation()}>
                        {expandedPurchases.length === 0 ? (
                          <p style={{ color: '#8B949E', fontSize: '12px', margin: 0 }}>No purchases this period</p>
                        ) : (
                          expandedPurchases.map(p => (
                            <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '12px', marginBottom: '4px' }}>
                              <span style={{ color: '#E8F5E9', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {p.item} {p.paid && <span style={{ color: '#1DB954' }}>✓</span>}
                              </span>
                              <span style={{ color: '#8B949E', fontSize: '11px' }}>{formatDate(p.date)}</span>
                              <span style={{ color: '#E8F5E9', fontWeight: 'bold' }}>${p.amount}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default CardBudget;