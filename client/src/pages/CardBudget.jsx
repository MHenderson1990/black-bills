import { useState, useEffect } from 'react';
import { createRunningBudget, getRunningBudgets, updateRunningBudget, deleteRunningBudget, createBudgetEntry, getBudgetEntries, updateBudgetEntry, deleteBudgetEntry } from '../services/api';
import { formatDate } from '../constants';
import styles from './CardBudget.module.css';

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

  if (loading) return <p className={styles.loading}>Loading...</p>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Running Totals</h1>

      {budgets.length > 1 && (
        <select
          value={selectedBudgetId}
          onChange={e => setSelectedBudgetId(e.target.value)}
          className={`${styles.input} ${styles.budgetSelect}`}
        >
          {budgets.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
        </select>
      )}

      {budgets.length === 0 ? (
        <p className={styles.emptyState}>No running totals yet — create one below.</p>
      ) : selectedBudget && (
               <div className={styles.card}>
          <div className={styles.cardHeader}>
            <p className={styles.cardHeaderLabel}>{selectedBudget.name}</p>
            <button
              onClick={() => startEditBudget(selectedBudget)}
              className={styles.iconBtn}
            >✎</button>
            <button
              onClick={() => handleDeleteBudget(selectedBudget._id)}
              className={styles.deleteBtn}
            >✕</button>
          </div>
          <p className={`${styles.total} ${selectedBudget.total >= 0 ? styles.totalPositive : styles.totalNegative}`}>
            ${selectedBudget.total.toFixed(2)}
          </p>

          <div className={styles.actionsRow}>
            <button
              onClick={() => { setShowQuickLog('add'); setEditingEntryId(null); setQuickAmount(''); setQuickNote(''); }}
              className={styles.addBtn}
            >
              + Add
            </button>
            <button
              onClick={() => { setShowQuickLog('subtract'); setEditingEntryId(null); setQuickAmount(''); setQuickNote(''); }}
              className={styles.subtractBtn}
            >
              − Spend
            </button>
          </div>

          {showQuickLog && (
            <div className={styles.quickLogForm}>
              <input
                placeholder="Amount"
                type="number"
                value={quickAmount}
                onChange={e => setQuickAmount(e.target.value)}
                className={styles.input}
                autoFocus
              />
              <input
                placeholder="Note (optional)"
                value={quickNote}
                onChange={e => setQuickNote(e.target.value)}
                className={styles.input}
              />
              <div className={styles.quickLogActions}>
                <button
                  onClick={editingEntryId ? handleSaveEntryEdit : handleQuickLog}
                  className={`${styles.saveBtn} ${showQuickLog === 'add' ? styles.saveBtnAdd : styles.saveBtnSubtract}`}
                >
                  {editingEntryId ? 'Save Changes' : 'Log It'}
                </button>
                <button
                  onClick={() => { setShowQuickLog(null); setEditingEntryId(null); setQuickAmount(''); setQuickNote(''); }}
                  className={styles.cancelBtn}
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
        className={styles.newBudgetToggle}
      >
        {showNewBudget ? '✕ Cancel' : '+ New Running Total'}
      </button>

      {showNewBudget && (
        <div className={styles.newBudgetRow}>
          <input
            placeholder="Name (e.g. Vacation Fund)"
            value={newBudgetName}
            onChange={e => setNewBudgetName(e.target.value)}
            className={`${styles.input} ${styles.newBudgetInput}`}
          />
          <button
            onClick={handleSaveBudget}
            className={styles.createBtn}
          >
            {editingBudgetId ? 'Save' : 'Create'}
          </button>
        </div>
      )}

      {selectedBudget && (
        <>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={styles.historyToggle}
          >
            {showHistory ? '▲ Hide History' : '▼ View History'}
          </button>

          {showHistory && (
            <div className={styles.historyList}>
              {entries.length === 0 ? (
                <p className={styles.emptyState}>No entries yet</p>
              ) : (
                entries.map(entry => (
                  <div
                    key={entry._id}
                    className={`${styles.entry} ${entry.type === 'add' ? styles.entryAdd : styles.entrySubtract}`}
                  >
                    <div className={styles.entryInfo}>
                      <p className={`${styles.entryAmount} ${entry.type === 'add' ? styles.entryAmountAdd : styles.entryAmountSubtract}`}>
                        {entry.type === 'add' ? '+' : '−'}${entry.amount.toFixed(2)}
                      </p>
                      {entry.note && <p className={styles.entryNote}>{entry.note}</p>}
                      <p className={styles.entryDate}>{formatDate(entry.date)}</p>
                    </div>
                    <button
                      onClick={() => startEditEntry(entry)}
                      className={styles.iconBtn}
                    >✎</button>
                    <button
                      onClick={() => handleDeleteEntry(entry._id)}
                      className={styles.deleteBtn}
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