import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('CUSTOMER');
  const [email, setEmail] = useState('');
  const [form, setForm] = useState({ otp: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error('Enter your email');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email, role });
      toast.success('OTP sent to your email!');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!form.otp || !form.newPassword || !form.confirmPassword) return toast.error('Fill all fields');
    if (form.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    if (form.newPassword !== form.confirmPassword) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp: form.otp, newPassword: form.newPassword, role });
      toast.success('Password reset successful! Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.brand}>🏦 MyFin Bank</div>
        <h2 style={s.title}>{step === 1 ? 'Forgot Password' : 'Reset Password'}</h2>
        <p style={s.sub}>
          {step === 1 ? 'Select your account type and enter your registered email.' : `Enter the OTP sent to ${email}`}
        </p>

        {step === 1 ? (
          <form onSubmit={handleSendOtp}>
            <div style={s.toggle}>
              <button
                type="button"
                style={{ ...s.toggleBtn, ...(role === 'CUSTOMER' ? s.toggleActive : {}) }}
                onClick={() => setRole('CUSTOMER')}
              >
                Customer
              </button>
              <button
                type="button"
                style={{ ...s.toggleBtn, ...(role === 'ADMIN' ? s.toggleActive : {}) }}
                onClick={() => setRole('ADMIN')}
              >
                Admin
              </button>
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset}>
            <div style={{ ...s.roleTag, background: role === 'ADMIN' ? '#fff3e0' : '#e8f0fe', color: role === 'ADMIN' ? '#e65100' : '#1e4db7' }}>
              {role} · {email}
            </div>
            <div className="form-group">
              <label>OTP Code</label>
              <input
                type="text"
                placeholder="6-digit OTP"
                maxLength={6}
                value={form.otp}
                onChange={e => setForm({ ...form, otp: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                placeholder="Minimum 6 characters"
                value={form.newPassword}
                onChange={e => setForm({ ...form, newPassword: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="Re-enter new password"
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            <button type="button" className="btn btn-secondary" style={{ width: '100%', marginTop: '10px' }} onClick={() => setStep(1)}>
              ← Back
            </button>
          </form>
        )}

        <p style={s.footer}><Link to="/login" style={{ color: '#1e4db7' }}>← Back to Login</Link></p>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: '#f4f6fb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  card: { background: 'white', borderRadius: '12px', padding: '40px', width: '100%', maxWidth: '420px', boxShadow: '0 4px 24px rgba(15,31,61,0.12)', border: '1px solid #dde3f0' },
  brand: { fontSize: '22px', color: '#0f1f3d', marginBottom: '20px', fontWeight: '600' },
  title: { fontSize: '24px', color: '#1a1f2e', marginBottom: '6px' },
  sub: { color: '#7a8099', fontSize: '13px', marginBottom: '24px' },
  footer: { textAlign: 'center', fontSize: '14px', marginTop: '20px' },
  toggle: { display: 'flex', background: '#f4f6fb', borderRadius: '8px', padding: '4px', marginBottom: '20px', gap: '4px' },
  toggleBtn: { flex: 1, padding: '8px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', background: 'transparent', color: '#7a8099', transition: 'all 0.2s' },
  toggleActive: { background: 'white', color: '#1e4db7', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' },
  roleTag: { padding: '8px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '500', marginBottom: '16px' }
};
