import { useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import TaskBoard from './components/TaskBoard';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [showRegister, setShowRegister] = useState(false);

  const handleLogin = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  if (token && user) {
    return <TaskBoard token={token} user={user} onLogout={handleLogout} />;
  }

  if (showRegister) {
    return <Register onLogin={handleLogin} onSwitchToLogin={() => setShowRegister(false)} />;
  }

  return <Login onLogin={handleLogin} onSwitchToRegister={() => setShowRegister(true)} />;
}
