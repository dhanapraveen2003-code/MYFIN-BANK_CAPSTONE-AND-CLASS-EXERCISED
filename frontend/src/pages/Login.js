import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const endpoint = isAdmin ? '/auth/admin/login' : '/auth/login';
      const { data } = await api.post(endpoint, { email: form.email, password: form.password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (onLogin) onLogin(data.user);
      toast.success('Welcome back!');
      navigate(data.user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.brand}>🏦 MyFin Bank</div>
        <h2 style={s.title}>Sign In</h2>

        <div style={s.toggle}>
          <button type="button" style={{ ...s.toggleBtn, ...(isAdmin ? {} : s.toggleActive) }} onClick={() => setIsAdmin(false)}>Customer</button>
          <button type="button" style={{ ...s.toggleBtn, ...(isAdmin ? s.toggleActive : {}) }} onClick={() => setIsAdmin(true)}>Admin</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" placeholder="you@example.com" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              style={errors.email ? { borderColor: '#d94040' } : {}} />
            {errors.email && <span style={s.err}>{errors.email}</span>}
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="Enter your password" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              style={errors.password ? { borderColor: '#d94040' } : {}} />
            {errors.password && <span style={s.err}>{errors.password}</span>}
          </div>
          <div style={{ textAlign: 'right', marginBottom: '16px' }}>
            <Link to="/forgot-password" style={{ fontSize: '13px', color: '#1e4db7' }}>Forgot password?</Link>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
            {loading ? 'Signing in...' : `Sign In as ${isAdmin ? 'Admin' : 'Customer'}`}
          </button>
        </form>

        {!isAdmin && (
          <p style={s.footer}>Don't have an account?{' '}
            <Link to="/register" style={{ color: '#1e4db7', fontWeight: '500' }}>Create account</Link>
          </p>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: '#f4f6fb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  card: { background: 'white', borderRadius: '12px', padding: '40px', width: '100%', maxWidth: '420px', boxShadow: '0 4px 24px rgba(15,31,61,0.12)', border: '1px solid #dde3f0' },
  brand: { fontSize: '22px', color: '#0f1f3d', marginBottom: '20px', fontWeight: '600' },
  title: { fontSize: '24px', color: '#1a1f2e', marginBottom: '20px' },
  toggle: { display: 'flex', background: '#f4f6fb', borderRadius: '8px', padding: '4px', marginBottom: '24px' },
  toggleBtn: { flex: 1, padding: '8px', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', background: 'transparent', color: '#7a8099', fontWeight: '500' },
  toggleActive: { background: 'white', color: '#0f1f3d', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
  err: { color: '#d94040', fontSize: '12px', marginTop: '4px', display: 'block' },
  footer: { textAlign: 'center', color: '#7a8099', fontSize: '14px', marginTop: '20px' }
};
