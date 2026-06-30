import { useState, useEffect } from 'react';
import { getAllSavingsGoals, getSavingsGoalAmount, deleteSavingsGoal, getContributions, createContribution, getHouseholdMembers } from '../services/api';
import { MONTHS, YEARS } from '../constants';

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

  let userId = localStorage.getItem('userId');
  let householdId = localStorage.getItem('householdId');

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

  let filteredGoals = goals.filter(goal => {
    if (activeTab === 'shared') return goal.isShared;
    if (activeTab === 'kirah') return !goal.isShared && goal.owner !== userId;
    if (activeTab === 'mo') return !goal.isShared && goal.owner === userId;
    return false;
  });

  let inputStyle = {
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid #30363D',
    background: '#0D1117',
    color: '#fff',
    fontSize: '13px'
  };

  function memberName(id) {
    return members.find(m => m._id === id)?.name || 'Unknown';
  }

  if (loading) return <p style={{ padding: '40px', color: '#fff', background: '#0D1117', minHeight: '100vh' }}>Loading...</p>;

  return (
    <div style={{ background: '#0D1117', minHeight: '100vh', padding: '32px', paddingBottom: '80px' }}>
      <h1 style={{
        fontSize: '24px',
        marginBottom: '20px',
        background: 'linear-gradient(135deg, #1DB954, #5C8A3A)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>Goals</h1>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[
          { key: 'shared', label: 'Shared' },
          { key: 'kirah', label: "Kirah's" },
          { key: 'mo', label: "Mo's" }
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
        <p style={{ color: '#8B949E' }}>No {activeTab} goals yet</p>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <p style={{
                    fontWeight: 'bold',
                    fontSize: '16px',
                    background: 'linear-gradient(135deg, #1DB954, #5C8A3A)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    {goal.name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {goal.targetDate && (
                      <p style={{ color: '#8B949E', fontSize: '13px' }}>
                        Target: {new Date(goal.targetDate).toLocaleDateString()}
                      </p>
                    )}
                    <button
                      onClick={() => handleDelete(goal._id)}
                      style={{ background: 'none', border: 'none', color: '#FF6B6B', cursor: 'pointer', fontSize: '16px', padding: '4px' }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div style={{ background: '#0D1117', borderRadius: '8px', height: '12px', overflow: 'hidden', marginBottom: '10px' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #1DB954, #5C8A3A)',
                    height: '100%',
                    width: `${percentSaved}%`,
                    borderRadius: '8px',
                    transition: 'width 0.3s'
                  }} />
                </div>

                <p style={{
                  fontSize: '13px',
                  fontWeight: 'bold',
                  marginBottom: '4px',
                  background: 'linear-gradient(135deg, #1DB954, #5C8A3A)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  {percentSaved.toFixed(0)}% saved
                </p>

                <p style={{ color: '#cfcfcf', fontSize: '13px', marginBottom: '12px' }}>
                  ${goal.currentAmount.toFixed(2)} of ${goal.targetAmount.toFixed(2)}
                </p>

                <button
                  onClick={() => toggleExpand(goal._id)}
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
                            padding: '8px 12px', background: '#0D1117', borderRadius: '6px', fontSize: '12px'
                          }}>
                            <span style={{ color: '#E8F5E9', flex: 1 }}>{memberName(c.contributedBy)}</span>
                            <span style={{ color: '#cfcfcf', flex: 1, textAlign: 'center' }}>{new Date(c.date).toLocaleDateString()}</span>
                            <span style={{ fontWeight: 'bold', color: '#E8F5E9' }}>${c.amount}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          placeholder="Amount"
                          type="number"
                          value={newAmount}
                          onChange={e => setNewAmount(e.target.value)}
                          style={{ ...inputStyle, flex: 1 }}
                        />
                        <input
                          type="date"
                          value={newDate}
                          onChange={e => setNewDate(e.target.value)}
                          style={{ ...inputStyle, flex: 1 }}
                        />
                        <select
                          value={newContributedBy}
                          onChange={e => setNewContributedBy(e.target.value)}
                          style={{ ...inputStyle, flex: 1 }}
                        >
                          {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                        </select>
                      </div>
                      <button
                        onClick={() => handleAddContribution(goal._id)}
                        style={{
                          padding: '8px', borderRadius: '6px', border: 'none',
                          background: 'linear-gradient(135deg, #1DB954, #5C8A3A)', color: 'white', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer'
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