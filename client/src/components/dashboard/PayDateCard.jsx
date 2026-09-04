import { useState } from 'react';
import { updatePayAnchorDate } from '../../services/api';
import { formatDate } from '../../constants';

function PayDateCard({ nextPayDate, onSaved }) {
  let [editingPayDate, setEditingPayDate] = useState(false);
  let [payDateInput, setPayDateInput] = useState('');
  let [saving, setSaving] = useState(false);

  async function handleSavePayDate() {
    if (!payDateInput) return;
    setSaving(true);
    try {
      await updatePayAnchorDate(payDateInput);
      setEditingPayDate(false);
      setPayDateInput('');
      await onSaved();
    } catch (error) {
      console.error(error);
      alert('Failed to save pay date');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      onClick={function() {
        if (!editingPayDate) setEditingPayDate(true);
      }}
      style={{
        background: '#161B22',
        border: '1px solid #1DB95433',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(29,185,84,0.08)',
        cursor: 'pointer'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <p style={{ color: '#8B949E', fontSize: '13px', margin: 0 }}>Next Pay Date</p>
        {!editingPayDate && (
          <p style={{ color: '#1DB954', fontSize: '11px', margin: 0 }}>tap to edit</p>
        )}
      </div>

      {editingPayDate ? (
        <div onClick={function(e) { e.stopPropagation(); }}>
          <p style={{ color: '#8B949E', fontSize: '11px', marginBottom: '6px' }}>
            Pick your most recent payday — pay periods count forward from it every 2 weeks
          </p>
          <input
            type="date"
            value={payDateInput}
            onChange={function(e) { setPayDateInput(e.target.value); }}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: '#0D1117',
              border: '1px solid #1DB95455',
              borderRadius: '8px',
              padding: '10px 12px',
              color: '#E8F5E9',
              fontSize: '16px',
              marginBottom: '10px',
              colorScheme: 'dark'
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSavePayDate}
              disabled={saving || !payDateInput}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #1DB954, #107C41)',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 0',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                opacity: saving || !payDateInput ? 0.5 : 1
              }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={function() {
                setEditingPayDate(false);
                setPayDateInput('');
              }}
              style={{
                flex: 1,
                background: 'transparent',
                border: '1px solid #30363D',
                borderRadius: '8px',
                padding: '10px 0',
                color: '#8B949E',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p style={{
          fontWeight: 'bold',
          fontSize: '20px',
          margin: 0,
          background: 'linear-gradient(135deg, #1DB954, #5C8A3A)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          {nextPayDate ? formatDate(nextPayDate) : 'Not set'}
        </p>
      )}
    </div>
  );
}

export default PayDateCard;