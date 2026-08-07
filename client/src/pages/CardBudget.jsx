import { useState, useEffect } from 'react';
import { createRunningBudget, getRunningBudgets, updateRunningBudget, deleteRunningBudget, createBudgetEntry, getBudgetEntries, updateBudgetEntry, deleteBudgetEntry } from '../services/api';
import { formatDate } from '../constants';

function CardBudget() {
  let [budgets, setBudgets] = useState([]);
  let [selectedBudgetId, setSelectedBudgetId] = useState('');
  let [loading, setLoading] = useState(true);

  let [showNewBudget, setShowNewBudget] = useState(false);
  let [newBudgetName, setNewBudgetName] = useState('');
  let [editingBudgetId, setEditingBudgetId] = useState(null);

  let [showQuickLog, setShowQuickLog] = useState(null); // 'add' | 'subtract' | null
  let [quickAmount, setQuickAmount] = useState('');
  let [quickNote, setQuickNote] = useState('');

  let [entries, setEntries] = useState([]);
  let [showHistory, setShowHistory] = useState(false);
  let [editingEntryId, setEditingEntryId] = useState(null);

  let userId = localStorage.getItem('userId');
  let householdId = localStorage.getItem('householdId');

  useEffect(function() {
    fetchBudgets();
  }, []);

  useEffect(function() {
    if (selectedBudgetId) {
      fetchEntries(selectedBudgetId);
    } else {
      setEntries([]);
    }
  }, [selectedBudgetId]);

  async function fetchBudgets() {
    try {
      let res = await getRunningBudgets(householdId);
      setBudgets(res.data);
      if (res.data.length > 0 && !selectedBudgetId) {
        setSelectedBudgetId(res.data[0]._id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchEntries(budgetId) {
    let res = await getBudgetEntries(budgetId);
    setEntries(res.data);
  }

  async function handleSaveBudget() {
    if (!newBudgetName.trim()) return;
    if (editingBudgetId) {
      await updateRunningBudget(editingBudgetId, { name: newBudgetName });
    } else {
      await createRunningBudget({ householdId, name: newBudgetName });
    }
    setNewBudgetName('');
    setEditingBudgetId(null);
    setShowNewBudget(false);
    let res = await getRunningBudgets(householdId);
    setBudgets(res.data);
    if (!selectedBudgetId && res.data.length > 0) {
      setSelectedBudgetId(res.data[res.data.length - 1]._id);
    }
  }

  function startEditBudget(budget) {
    setEditingBudgetId(budget._id);
    setNewBudgetName(budget.name);
    setShowNewBudget(true);
  }

  async function handleDeleteBudget(budgetId) {
    if (window.confirm('Delete this budget and all its history? This cannot be undone.')) {
      await deleteRunningBudget(budgetId);
      let res = await getRunningBudgets(householdId);
      setBudgets(res.data);
      if (selectedBudgetId === budgetId) {
        setSelectedBudgetId(res.data.length > 0 ? res.data[0]._id : '');
      }
    }
  }

  async function handleQuickLog() {
    if (!quickAmount) return;
    await createBudgetEntry({
      budget: selectedBudgetId,
      amount: Number(quickAmount),
      type: showQuickLog,
      note: quickNote || undefined,
      loggedBy: userId
    });
    setQuickAmount('');
    setQuickNote('');
    setShowQuickLog(null);
    fetchBudgets();
    fetchEntries(selectedBudgetId);
  }

  function startEditEntry(entry) {
    setEditingEntryId(entry._id);
    setQuickAmount(String(entry.amount));
    setQuickNote(entry.note || '');
    setShowQuickLog(entry.type);
  }

  async function handleSaveEntryEdit() {
    if (!quickAmount) return;
    await updateBudgetEntry(editingEntryId, {
      amount: Number(quickAmount),
      note: quickNote || undefined
    });
    setQuickAmount('');
    setQuickNote('');
    setEditingEntryId(null);
    setShowQuickLog(null);
    fetchBudgets();
    fetchEntries(selectedBudgetId);
  }

  async function handleDeleteEntry(entryId) {
    if (window.confirm('Delete this entry?')) {
      await deleteBudgetEntry(entryId);
      fetchBudgets();
      fetchEntries(selectedBudgetId);
    }
  }

  let selectedBudget = budgets.find(b => b._id === selectedBudgetId);

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
        background: 'linear-gradient(135deg, #FFD700, #E6C200)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>Running Totals</h1>

      {budgets.length > 1 && (
        <select
          value={selectedBudgetId}
          onChange={e => setSelectedBudgetId(e.target.value)}
          style={{ ...inputStyle, width: '100%', marginBottom: '16px' }}
        >
          {budgets.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
        </select>
      )}

      {budgets.length === 0 ? (
        <p style={{ color: '#8B949E', marginBottom: '16px' }}>No running totals yet — create one below.</p>
      ) : selectedBudget && (
        <div style={{
          background: '#161B22',
          border: '1px solid #FFD70044',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <p style={{ color: '#8B949E', fontSize: '13px', margin: 0 }}>{selectedBudget.name}</p>
            <button
              onClick={() => startEditBudget(selectedBudget)}
              style={{ background: 'none', border: 'none', color: '#8B949E', cursor: 'pointer', fontSize: '13px', padding: '2px' }}
            >✎</button>
            <button
              onClick={() => handleDeleteBudget(selectedBudget._id)}
              style={{ background: 'none', border: 'none', color: '#FF6B6B', cursor: 'pointer', fontSize: '13px', padding: '2px' }}
            >✕</button>
          </div>
          <p style={{
            fontSize: '40px', fontWeight: 'bold', margin: 0,
            background: selectedBudget.total >= 0
              ? 'linear-gradient(135deg, #FFD700, #E6C200)'
              : 'linear-gradient(135deg, #FF6B6B, #CC4444)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
          }}>
            ${selectedBudget.total.toFixed(2)}
          </p>

          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button
              onClick={() => { setShowQuickLog('add'); setEditingEntryId(null); setQuickAmount(''); setQuickNote(''); }}
              style={{
                flex: 1, padding: '14px', borderRadius: '10px', border: 'none',
                background: 'linear-gradient(135deg, #1DB954, #107C41)',
                color: 'white', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer'
              }}
            >
              + Add
            </button>
            <button
              onClick={() => { setShowQuickLog('subtract'); setEditingEntryId(null); setQuickAmount(''); setQuickNote(''); }}
              style={{
                flex: 1, padding: '14px', borderRadius: '10px', border: 'none',
                background: 'linear-gradient(135deg, #FF6B6B, #CC4444)',
                color: 'white', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer'
              }}
            >
              − Spend
            </button>
          </div>

          {showQuickLog && (
            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                placeholder="Amount"
                type="number"
                value={quickAmount}
                onChange={e => setQuickAmount(e.target.value)}
                style={{ ...inputStyle }}
                autoFocus
              />
              <input
                placeholder="Note (optional)"
                value={quickNote}
                onChange={e => setQuickNote(e.target.value)}
                style={{ ...inputStyle }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={editingEntryId ? handleSaveEntryEdit : handleQuickLog}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '6px', border: 'none',
                    background: showQuickLog === 'add'
                      ? 'linear-gradient(135deg, #1DB954, #107C41)'
                      : 'linear-gradient(135deg, #FF6B6B, #CC4444)',
                    color: 'white', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer'
                  }}
                >
                  {editingEntryId ? 'Save Changes' : 'Log It'}
                </button>
                <button
                  onClick={() => { setShowQuickLog(null); setEditingEntryId(null); setQuickAmount(''); setQuickNote(''); }}
                  style={{
                    padding: '10px 14px', borderRadius: '6px', border: '1px solid #30363D',
                    background: 'transparent', color: '#8B949E', fontSize: '13px', cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => {
          if (showNewBudget) {
            setEditingBudgetId(null);
            setNewBudgetName('');
          }
          setShowNewBudget(!showNewBudget);
        }}
        style={{
          width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #30363D',
          background: 'transparent', color: '#8B949E', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer',
          marginBottom: '16px'
        }}
      >
        {showNewBudget ? '✕ Cancel' : '+ New Running Total'}
      </button>

      {showNewBudget && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input
            placeholder="Name (e.g. Vacation Fund)"
            value={newBudgetName}
            onChange={e => setNewBudgetName(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            onClick={handleSaveBudget}
            style={{
              padding: '10px 16px', borderRadius: '6px', border: 'none',
              background: 'linear-gradient(135deg, #FFD700, #E6C200)',
              color: '#0D1117', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer'
            }}
          >
            {editingBudgetId ? 'Save' : 'Create'}
          </button>
        </div>
      )}

      {selectedBudget && (
        <>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              width: '100%', padding: '8px', background: '#161B22',
              border: '1px solid #30363D', borderRadius: '8px',
              color: '#8B949E', fontSize: '13px', cursor: 'pointer'
            }}
          >
            {showHistory ? '▲ Hide History' : '▼ View History'}
          </button>

          {showHistory && (
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {entries.length === 0 ? (
                <p style={{ color: '#8B949E', fontSize: '13px' }}>No entries yet</p>
              ) : (
                entries.map(entry => (
                  <div key={entry._id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 12px', background: '#161B22', borderRadius: '8px',
                    border: `1px solid ${entry.type === 'add' ? '#1DB95444' : '#FF6B6B44'}`,
                    gap: '8px', flexWrap: 'wrap'
                  }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{
                        margin: 0, fontWeight: 'bold', fontSize: '14px',
                        color: entry.type === 'add' ? '#1DB954' : '#FF6B6B'
                      }}>
                        {entry.type === 'add' ? '+' : '−'}${entry.amount.toFixed(2)}
                      </p>
                      {entry.note && <p style={{ color: '#8B949E', fontSize: '12px', margin: 0 }}>{entry.note}</p>}
                      <p style={{ color: '#8B949E', fontSize: '11px', margin: 0 }}>{formatDate(entry.date)}</p>
                    </div>
                    <button
                      onClick={() => startEditEntry(entry)}
                      style={{ background: 'none', border: 'none', color: '#8B949E', cursor: 'pointer', fontSize: '13px', padding: '2px' }}
                    >✎</button>
                    <button
                      onClick={() => handleDeleteEntry(entry._id)}
                      style={{ background: 'none', border: 'none', color: '#FF6B6B', cursor: 'pointer', fontSize: '13px', padding: '2px' }}
                    >✕</button>
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