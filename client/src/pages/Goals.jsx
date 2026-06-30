import { useState, useEffect } from 'react';
import { getAllSavingsGoals, getSavingsGoalAmount } from '../services/api';

function Goals() {
  let [goals, setGoals] = useState([]);
  let [loading, setLoading] = useState(true);
  let [activeTab, setActiveTab] = useState('shared');

  let userId = localStorage.getItem('userId');
  let householdId = localStorage.getItem('householdId');

  useEffect(function() {
    async function fetchData() {
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
    fetchData();
  }, []);

  let filteredGoals = goals.filter(goal => {
  if (activeTab === 'shared') return goal.isShared;
  if (activeTab === 'kirah') return !goal.isShared && goal.owner !== userId;
  if (activeTab === 'mo') return !goal.isShared && goal.owner === userId;
  return false;
});

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
                  {goal.targetDate && (
                    <p style={{ color: '#8B949E', fontSize: '13px' }}>
                      Target: {new Date(goal.targetDate).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div style={{
                  background: '#0D1117',
                  borderRadius: '8px',
                  height: '12px',
                  overflow: 'hidden',
                  marginBottom: '10px'
                }}>
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

                <p style={{ color: '#cfcfcf', fontSize: '13px' }}>
                  ${goal.currentAmount.toFixed(2)} of ${goal.targetAmount.toFixed(2)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Goals;