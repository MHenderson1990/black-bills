import { formatDate } from '../../constants';

function getNoteAccent(note, members) {
  let ownerName = members.find(m => m._id === note.author)?.name;
  return ownerName === 'Mo'
    ? 'linear-gradient(135deg, #4DA3FF, #0080FF)'
    : 'linear-gradient(135deg, #FF8FC7, #FF4DA6)';
}

function NoteItem({ note, currentUserId, members, onEdit, onDelete, onToggleSeen }) {
  let accent = getNoteAccent(note, members);

  return (
    <div style={{
      background: '#0D1117', borderRadius: '8px', padding: '10px 12px',
      borderLeft: `3px solid transparent`,
      borderImage: `${accent} 1`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ display: 'none' }}></span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#8B949E', fontSize: '11px' }}>{formatDate(note.date)}</span>
          {note.author !== currentUserId && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#8B949E', fontSize: '11px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={note.seen}
                onChange={() => onToggleSeen(note)}
              />
              Seen
            </label>
          )}
          {note.author === currentUserId && note.seen && (
            <span style={{ color: '#1DB954', fontSize: '11px' }}>✓ Seen</span>
          )}
          <button
            onClick={() => onEdit(note)}
            style={{ background: 'none', border: 'none', color: '#8B949E', cursor: 'pointer', fontSize: '12px', padding: '2px' }}
          >✎</button>
          <button
            onClick={() => onDelete(note._id)}
            style={{ background: 'none', border: 'none', color: '#FF6B6B', cursor: 'pointer', fontSize: '12px', padding: '2px' }}
          >✕</button>
        </div>
      </div>
      <p style={{
        fontSize: '13px', margin: 0, whiteSpace: 'pre-wrap', fontWeight: 'bold',
        background: accent, WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent', backgroundClip: 'text'
      }}>{note.text}</p>
    </div>
  );
}

export default NoteItem;