import { useState, useEffect } from 'react';
import { getAllSavingsGoals, getSavingsGoalAmount, deleteSavingsGoal, getContributions, createContribution, getHouseholdMembers, createSavingsGoal } from '../services/api';
import { MONTHS, YEARS, formatDate } from '../constants';

function Goals() {
  let [goals, setGoals] = useState([]);
  let [members, setMembers] = useState([]);
  let [loading, setLoading] = useState(true);
  let [activeTab, setActiveTab] = useState('shared');
  let [expandedId, setExpandedId] = useState(null);
  let [contributions, setContributions] = useState([]);
  let now = new Date();
  let [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  let [selectedMonthNum, setSelectedMonthNum] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  let [newAmount, setNewAmount] = useState('');
  let [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  let [newContributedBy, setNewContributedBy] = useState('');
  let [showAddGoal, setShowAddGoal] = useState(false);
  let [newGoalName, setNewGoalName] = useState('');
  let [newTargetAmount, setNewTargetAmount] = useState('');
  let [newTargetDate, setNewTargetDate] = useState('');
  let [newIsShared, setNewIsShared] = useState(true);
  let [newOwner, setNewOwner] = useState('');

  let userId = localStorage.getItem('userId');
  let householdId = localStorage.getItem('householdId');

  let otherMember = members.find(m => m._id !== userId);

  useEffect(function() {
    fetchGoals();
    fetchMembers();
  }, []);

  async function fetchGoals() {
    try {
      let goalsRes = await getAllSavingsGoals(householdId);
      let goalsWithAmount = await Promise.all(
        goalsRes.data.map(async (goal) => {
          let amountRes = await getSavingsGoalAmount(goal._id);
          return { ...goal, currentAmount: amountRes.data.currentAmount };
        })
      );
      setGoals(goalsWithAmount);
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
      setNewContributedBy(res.data.find(m => m._id === userId)?._id || res.data[0]._id);
      setNewOwner(res.data.find(m => m._id === userId)?._id || res.data[0]._id);
    }
  }

  async function handleDelete(goalId) {
    if (window.confirm('Delete this goal? This cannot be undone.')) {
      await deleteSavingsGoal(goalId);
      setGoals(goals.filter(g => g._id !== goalId));
    }
  }

  async function toggleExpand(goalId) {
    if (expandedId === goalId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(goalId);
    let res = await getContributions(goalId);
    setContributions(res.data);
  }

  async function handleAddContribution(goalId) {
    if (!newAmount || !newContributedBy) return;
    await createContribution({
      savingsGoal: goalId,
      contributedBy: newContributedBy,
      date: newDate,
      amount: Number(newAmount)
    });
    setNewAmount('');
    setNewDate(new Date().toISOString().split('T')[0]);
    let res = await getContributions(goalId);
    setContributions(res.data);
    fetchGoals();
  }

  async function handleAddGoal() {
    if (!newGoalName || !newTargetAmount) return;
    await createSavingsGoal({
      name: newGoalName,
      targetAmount: Number(newTargetAmount),
      targetDate: newTargetDate || undefined,
      isShared: newIsShared,
      owner: newIsShared ? undefined : (newOwner || userId),
      householdId
    });
    setNewGoalName('');
    setNewTargetAmount('');
    setNewTargetDate('');
    setNewIsShared(true);
    setNewOwner('');
    setShowAddGoal(false);
    fetchGoals();
  }

  let filteredGoals = goals.filter(goal => {
    if (activeTab === 'shared') return goal.isShared;
    if (activeTab === 'mine') return !goal.isShared && goal.owner === userId;
    if (activeTab === 'theirs') return !goal.isShared && goal.owner !== userId;
    return false;
  });

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

  function memberName(id) {
    return members.find(m => m._id === id)?.name || 'Unknown';
  }

  if (loading) return <p style={{ padding: '40px', color: '#fff', background: '#0D1117', minHeight: '100vh' }}>Loading...</p>;

  return (
    <div style={{ background: '#0D1117', minHeight: '100vh', padding: 'clamp(16px, 4vw, 32px)', paddingBottom: '110px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{
          fontSize: 'clamp(20px, 5vw, 24px)',
          margin: 0,
          background: 'linear-gradient(135deg, #1DB954, #5C8A3A)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>Goals</h1>
        <button
          onClick={() => setShowAddGoal(!showAddGoal)}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: 'none',
            background: 'linear-gradient(135deg, #1DB954, #5C8A3A)',
            color: '#0D1117',
            fontWeight: 'bold',
            fontSize: '13px',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          {showAddGoal ? '✕ Cancel' : '+ Add Goal'}
        </button>
      </div>

      {showAddGoal && (
        <div style={{
          background: '#161B22',
          border: '1px solid #30363D',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <h2 style={{ color: '#E8F5E9', fontSize: '15px', marginTop: 0, marginBottom: '14px' }}>New Goal</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                placeholder="Goal name"
                value={newGoalName}
                onChange={e => setNewGoalName(e.target.value)}
                style={{ ...inputStyle, flex: '2 1 140px' }}
              />
              <input
                placeholder="Target amount"
                type="number"
                value={newTargetAmount}
                onChange={e => setNewTargetAmount(e.target.value)}
                style={{ ...inputStyle, flex: '1 1 100px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="date"
                value={newTargetDate}
                onChange={e => setNewTargetDate(e.target.value)}
                style={{ ...inputStyle, flex: 1, colorScheme: 'dark' }}
                placeholder="Target date (optional)"
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ color: '#8B949E', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="checkbox"
                  checked={newIsShared}
                  onChange={e => setNewIsShared(e.target.checked)}
                />
                Shared goal
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
              onClick={handleAddGoal}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #1DB954, #5C8A3A)',
                color: '#0D1117',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Save Goal
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { key: 'shared', label: 'Shared' },
          { key: 'mine', label: 'Mine' },
          { key: 'theirs', label: otherMember ? `${otherMember.name}'s` : 'Theirs' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 20px',
              borderRadius: '20px',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              background: activeTab === tab.key
                ? 'linear-gradient(135deg, #1DB954, #5C8A3A)'
                : '#161B22',
              color: activeTab === tab.key ? '#0D1117' : '#8B949E'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredGoals.length === 0 ? (
        <p style={{ color: '#8B949E' }}>No goals here yet</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredGoals.map(goal => {
            let percentSaved = Math.max(0, Math.min(100, (goal.currentAmount / goal.targetAmount) * 100));
            let isExpanded = expandedId === goal._id;
            let filteredContributions = contributions.filter(c => c.date.slice(0, 7) === `${selectedYear}-${selectedMonthNum}`);

            return (
              <div key={goal._id} style={{
                background: '#161B22',
                border: '1px solid #30363D',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '8px' }}>
                  <p style={{
                    fontWeight: 'bold', fontSize: '16px', margin: 0,
                    minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    background: 'linear-gradient(135deg, #1DB954, #5C8A3A)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                  }}>
                    {goal.name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    {goal.targetDate && (
                      <p style={{ color: '#8B949E', fontSize: '13px', margin: 0 }}>
                        Target: {formatDate(goal.targetDate)}
                      </p>
                    )}
                    <button
                      onClick={() => handleDelete(goal._id)}
                      style={{ background: 'none', border: 'none', color: '#FF6B6B', cursor: 'pointer', fontSize: '16px', padding: '4px' }}
                    >✕</button>
                  </div>
                </div>

                <div style={{ background: '#0D1117', borderRadius: '8px', height: '12px', overflow: 'hidden', marginBottom: '10px' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #1DB954, #5C8A3A)',
                    height: '100%', width: `${percentSaved}%`, borderRadius: '8px', transition: 'width 0.3s'
                  }} />
                </div>

                <p style={{
                  fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', marginTop: 0,
                  background: 'linear-gradient(135deg, #1DB954, #5C8A3A)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                }}>
                  {percentSaved.toFixed(0)}% saved
                </p>

                <p style={{ color: '#cfcfcf', fontSize: '13px', marginBottom: '12px', marginTop: 0 }}>
                  ${goal.currentAmount.toFixed(2)} of ${goal.targetAmount.toFixed(2)}
                </p>

                <button
                  onClick={() => toggleExpand(goal._id)}
                  style={{
                    width: '100%', padding: '8px', background: '#0D1117',
                    border: '1px solid #30363D', borderRadius: '8px',
                    color: '#8B949E', fontSize: '13px', cursor: 'pointer'
                  }}
                >
                  {isExpanded ? '▲ Hide Contributions' : '▼ View Contributions'}
                </button>

                {isExpanded && (
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

                    {filteredContributions.length === 0 ? (
                      <p style={{ color: '#8B949E', fontSize: '13px', marginBottom: '12px' }}>No contributions this month</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                        {filteredContributions.map(c => (
                          <div key={c._id} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '8px 12px', background: '#0D1117', borderRadius: '6px', fontSize: '12px', gap: '8px'
                          }}>
                            <span style={{ color: '#E8F5E9', flex: 1 }}>{memberName(c.contributedBy)}</span>
                            <span style={{ color: '#cfcfcf', flex: 1, textAlign: 'center' }}>{formatDate(c.date)}</span>
                            <span style={{ fontWeight: 'bold', color: '#E8F5E9' }}>${c.amount}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <input
                          placeholder="Amount"
                          type="number"
                          value={newAmount}
                          onChange={e => setNewAmount(e.target.value)}
                          style={{ ...inputStyle, flex: '1 1 90px' }}
                        />
                        <input
                          type="date"
                          value={newDate}
                          onChange={e => setNewDate(e.target.value)}
                          style={{ ...inputStyle, flex: '1 1 120px', colorScheme: 'dark' }}
                        />
                        <select
                          value={newContributedBy}
                          onChange={e => setNewContributedBy(e.target.value)}
                          style={{ ...inputStyle, flex: '1 1 100px' }}
                        >
                          {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                        </select>
                      </div>
                      <button
                        onClick={() => handleAddContribution(goal._id)}
                        style={{
                          padding: '10px', borderRadius: '6px', border: 'none',
                          background: 'linear-gradient(135deg, #1DB954, #5C8A3A)',
                          color: '#0D1117', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer'
                        }}
                      >
                        Add Contribution
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

export default Goals;