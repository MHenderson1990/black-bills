import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Login() {
  let [email, setEmail] = useState('');
  let [password, setPassword] = useState('');
  let [error, setError] = useState('');
  let navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      let res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userId', res.data._id);
      localStorage.setItem('userName', res.data.name);
      localStorage.setItem('householdId', res.data.householdId);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#FAF9F6'
    }}>
      <form onSubmit={handleSubmit} style={{
        background: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        width: '320px'
      }}>
        <h1 style={{ color: '#107C41', marginBottom: '24px', fontSize: '24px', textAlign: 'center' }}>
          BlackBills
        </h1>
        {error && <p style={{ color: '#D4380D', marginBottom: '12px', fontSize: '14px' }}>{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '12px', border: '1px solid #ddd', borderRadius: '6px' }}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '16px', border: '1px solid #ddd', borderRadius: '6px' }}
          required
        />
        <button type="submit" style={{
          width: '100%',
          padding: '12px',
          background: '#107C41',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}>
          Log In
        </button>
      </form>
    </div>
  );
}

export default Login;