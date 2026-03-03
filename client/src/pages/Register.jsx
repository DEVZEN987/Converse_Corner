import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../lib/api';
import './Auth.css';

export default function Register() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // ✅ VALIDATION CHECKS
    if (!form.username.trim()) {
      setError('Username is required');
      return;
    }
    
    if (form.username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    
    if (form.username.length > 20) {
      setError('Username must be less than 20 characters');
      return;
    }
    
    if (!form.email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!form.email.includes('@') || !form.email.includes('.')) {
      setError('Please enter a valid email');
      return;
    }
    
    if (!form.password) {
      setError('Password is required');
      return;
    }
    
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      const { token, user: u } = await authApi.register(form);
      login(u, token);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Register</h1>
        {error && <div className="alert alert-error">{error}</div>}
        
        <label>
          Username
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            required
          />
        </label>
        
        {/* Password strength indicator */}
        {form.password && form.password.length < 6 && (
          <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '-10px', marginBottom: '10px' }}>
            ⚠️ Password too weak (min 6 characters)
          </p>
        )}
        
        <label>
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>
        
        <label>
          Password
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </label>
        
        <label>
          Confirm Password
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />
        </label>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
        
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}