import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SharedBills from './pages/SharedBills';
import KirahPage from './pages/KirahPage';
import MoPage from './pages/MoPage';
import DebtPage from './pages/DebtPage';
import Goals from './pages/Goals';
import BottomNav from './components/BottomNav';

function App() {
  let token = localStorage.getItem('token');

  if (!token) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/shared" element={<SharedBills />} />
        <Route path="/kirah" element={<KirahPage />} />
        <Route path="/mo" element={<MoPage />} />
        <Route path="/debt" element={<DebtPage />} />
        <Route path="/goals" element={<Goals />} />
      </Routes>
      <BottomNav />
    </Router>
  );
}

export default App;