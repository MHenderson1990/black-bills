import { useState, useEffect } from 'react';
import { createNote, getAllNotes, updateNote, deleteNote } from '../../services/api';
import { MONTHS, YEARS } from '../../constants';
import NoteItem from './NoteItem';

function NotesSection({ householdId, userId, members }) {
  let [notes, setNotes] = useState([]);
  let [newNoteText, setNewNoteText] = useState('');
  let [editingNoteId, setEditingNoteId] = useState(null);
  let [showAllNotes, setShowAllNotes] = useState(false);
  let [error, setError] = useState('');
  let now = new Date();
  let [notesSelectedYear, setNotesSelectedYear] = useState(String(now.getFullYear()));
  let [notesSelectedMonthNum, setNotesSelectedMonthNum] = useState(String(now.getMonth() + 1).padStart(2, '0'));

  useEffect(function() {
    refreshNotes();
  }, []);

  async function refreshNotes() {
    try {
      let notesRes = await getAllNotes(householdId);
      setNotes(notesRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load notes');
    }
  }

  async function handleSaveNote() {
    if (!newNoteText.trim()) return;
    try {
      setError('');
      if (editingNoteId) {
        await updateNote(editingNoteId, { text: newNoteText });
      } else {
        await createNote({ householdId, author: userId, text: newNoteText });
      }
      setNewNoteText('');
      setEditingNoteId(null);
      await refreshNotes();
    } catch (err) {
      console.error(err);
      setError('Failed to save note');
    }
  }

  async function handleToggleSeen(note) {
    try {
      setError('');
      await updateNote(note._id, { seen: !note.seen });
      await refreshNotes();
    } catch (err) {
      console.error(err);
      setError('Failed to update note');
    }
  }

  function startEditNote(note) {
    setEditingNoteId(note._id);
    setNewNoteText(note.text);
  }

  async function handleDeleteNote(noteId) {
    if (window.confirm('Delete this note?')) {
      try {
        setError('');
        await deleteNote(noteId);
        await refreshNotes();
      } catch (err) {
        console.error(err);
        setError('Failed to delete note');
      }
    }
  }

  let recentNotes = notes.slice(0, 3);
  let monthNotes = notes.filter(n =>
    new Date(n.date).toISOString().slice(0, 7) === `${notesSelectedYear}-${notesSelectedMonthNum}`
  );

  return (
    <div style={{ background: '#161B22', padding: '20px', borderRadius: '12px', border: '1px solid #30363D', marginTop: '20px', paddingBottom: '100px' }}>
      <h2 style={{ fontSize: '16px', marginBottom: '16px', color: '#E8F5E9' }}>Notes</h2>

      {error && (
        <p style={{ color: '#FF6B6B', fontSize: '12px', marginBottom: '10px' }}>{error}</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
        <textarea
          placeholder="Leave a note..."
          value={newNoteText}
          onChange={e => setNewNoteText(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box', minHeight: '60px',
            padding: '10px', borderRadius: '8px', border: '1px solid #30363D',
            background: '#0D1117', color: '#fff', fontSize: '14px', resize: 'vertical'
          }}
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleSaveNote}
            style={{
              flex: 1, padding: '10px', borderRadius: '6px', border: 'none',
              background: 'linear-gradient(135deg, #FFD700, #E6C200)',
              color: '#0D1117', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer'
            }}
          >
            {editingNoteId ? 'Save Changes' : 'Post Note'}
          </button>
          {editingNoteId && (
            <button
              onClick={() => { setEditingNoteId(null); setNewNoteText(''); }}
              style={{
                padding: '10px 14px', borderRadius: '6px', border: '1px solid #30363D',
                background: 'transparent', color: '#8B949E', fontSize: '13px', cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {recentNotes.length === 0 ? (
        <p style={{ color: '#8B949E', fontSize: '13px' }}>No notes yet</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {recentNotes.map(note => (
            <NoteItem
              key={note._id}
              note={note}
              currentUserId={userId}
              members={members}
              onEdit={startEditNote}
              onDelete={handleDeleteNote}
              onToggleSeen={handleToggleSeen}
            />
          ))}
        </div>
      )}

      <button
        onClick={() => setShowAllNotes(!showAllNotes)}
        style={{
          width: '100%', padding: '8px', marginTop: '12px', background: '#0D1117',
          border: '1px solid #30363D', borderRadius: '8px',
          color: '#8B949E', fontSize: '13px', cursor: 'pointer'
        }}
      >
        {showAllNotes ? '▲ Hide All Notes' : '▼ View All Notes'}
      </button>

      {showAllNotes && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <select
              value={notesSelectedMonthNum}
              onChange={e => setNotesSelectedMonthNum(e.target.value)}
              style={{
                flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #30363D',
                background: '#0D1117', color: '#fff', fontSize: '14px'
              }}
            >
              {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <select
              value={notesSelectedYear}
              onChange={e => setNotesSelectedYear(e.target.value)}
              style={{
                flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #30363D',
                background: '#0D1117', color: '#fff', fontSize: '14px'
              }}
            >
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {monthNotes.length === 0 ? (
            <p style={{ color: '#8B949E', fontSize: '13px' }}>No notes this month</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {monthNotes.map(note => (
                <NoteItem
                  key={note._id}
                  note={note}
                  currentUserId={userId}
                  members={members}
                  onEdit={startEditNote}
                  onDelete={handleDeleteNote}
                  onToggleSeen={handleToggleSeen}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotesSection;