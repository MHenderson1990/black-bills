import { useState, useEffect } from 'react';
import { getAllDebts, getDebtBalance } from '../services/api';

function DebtPage() {
  let [debts, setDebts] = useState([]);
  let [loading, setLoading] = useState(true);

  let userId = localStorage.getItem('userId');
  let householdId = localStorage.getItem('householdId');

  useEffect(function() {
    async function fetchData() {
      try {
        let debtsRes = await getAllDebts(householdId);
            console.log('debts from API:', debtsRes.data);
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
    fetchData();
  }, []);

  function getDebtAccent(debt) {
  if (debt.isShared) return 'linear-gradient(135deg, #B8334D, #8B1E3F)';
  if (debt.owner === userId) return 'linear-gradient(135deg, #7C2D3E, #5C1F2D)';
  return 'linear-gradient(135deg, #A13C5C, #7A2844)';
}

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
                  <p style={{ color: '#8B949E', fontSize: '13px' }}>
                    {debt.interestRate}% APR
                  </p>
                </div>

                <div style={{
                  background: '#0D1117',
                  borderRadius: '8px',
                  height: '12px',
                  overflow: 'hidden',
                  marginBottom: '10px'
                }}>
                  <div style={{
                    background: accent,
                    height: '100%',
                    width: `${percentPaid}%`,
                    borderRadius: '8px',
                    transition: 'width 0.3s'
                  }} />
                </div>

                  <p style={{
                    fontSize: '13px',
                    fontWeight: 'bold',
                    marginBottom: '4px',
                    background: accent,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                }}>
                {percentPaid.toFixed(0)}% paid off
            </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#cfcfcf' }}>
                    ${paidSoFar.toFixed(2)} paid of ${debt.startingBalance.toFixed(2)}
                  </span>
                  <span style={{ color: '#cfcfcf' }}>
                    ${debt.currentBalance.toFixed(2)} remaining
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DebtPage;