import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../lib/api';
import './Auth.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);
  try {
    const { token, user: u } = await authApi.login({ username, password });
    login(u, token);
    
    // ✅ Redirect admin to /admin, users to dashboard
    if (u.role === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      navigate(from, { replace: true });
    }
  } catch (err) {
    if (err.response?.status === 403) {
      setError('🚫 Your account has been suspended due to a report.');
    } else {
      setError(err.response?.data?.message || err.message || 'Login failed');
    }
  } finally {
    setLoading(false);
  }
}; 


return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Login</h1>
       {error && (
  <div className={`alert ${error.includes('suspended') ? 'alert-banned' : 'alert-error'}`}>
    {error.includes('suspended') ? (
      <>
        <span style={{ fontSize: '20px' }}>u⚠️</span>
        <span>{error}</span>
      </>
    ) : error}
  </div>
)}
        <label>
          Username or Email
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <p>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}