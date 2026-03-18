import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '', govIdType: 'AADHAAR', govIdNumber: '' });
  const [govFile, setGovFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters';
    if (!form.govIdNumber.trim()) e.govIdNumber = 'Government ID number is required';
    if (!govFile) e.govFile = 'Please upload your ID document';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('govIdDocument', govFile);
      await api.post('/auth/register', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Registration submitted! Awaiting KYC approval from admin.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.brand}>🏦 MyFin Bank</div>
        <h2 style={s.title}>Create Account</h2>
        <p style={s.sub}>Fill in your details and upload a government ID. Admin will verify before activation.</p>

        <form onSubmit={handleSubmit} noValidate encType="multipart/form-data">
          <div className="form-row">
            <div className="form-group">
              <label>Full Name *</label>
              <input type="text" placeholder="John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={errors.name ? { borderColor: '#d94040' } : {}} />
              {errors.name && <span style={s.err}>{errors.name}</span>}
            </div>
            <div className="form-group">
              <label>Email Address *</label>
              <input type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={errors.email ? { borderColor: '#d94040' } : {}} />
              {errors.email && <span style={s.err}>{errors.email}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Password *</label>
            <input type="password" placeholder="Minimum 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={errors.password ? { borderColor: '#d94040' } : {}} />
            {errors.password && <span style={s.err}>{errors.password}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone Number</label>
              <input type="tel" placeholder="+91 9999999999" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input type="text" placeholder="Your address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>

          <div style={s.kycBox}>
            <div style={s.kycTitle}>KYC — Government ID</div>
            <div className="form-row">
              <div className="form-group">
                <label>ID Type *</label>
                <select value={form.govIdType} onChange={e => setForm({ ...form, govIdType: e.target.value })}>
                  <option value="AADHAAR">Aadhaar Card</option>
                  <option value="PAN">PAN Card</option>
                </select>
              </div>
              <div className="form-group">
                <label>ID Number *</label>
                <input type="text" placeholder={form.govIdType === 'AADHAAR' ? '1234-5678-9012' : 'ABCDE1234F'} value={form.govIdNumber} onChange={e => setForm({ ...form, govIdNumber: e.target.value })} style={errors.govIdNumber ? { borderColor: '#d94040' } : {}} />
                {errors.govIdNumber && <span style={s.err}>{errors.govIdNumber}</span>}
              </div>
            </div>
            <div className="form-group">
              <label>Upload ID Document *</label>
              <input type="file" accept="image/*,.pdf" onChange={e => setGovFile(e.target.files[0])} style={{ padding: '8px 0' }} />
              {govFile && <span style={{ fontSize: '12px', color: '#27a85f', marginTop: '4px', display: 'block' }}>✓ {govFile.name}</span>}
              {errors.govFile && <span style={s.err}>{errors.govFile}</span>}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '8px' }} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Registration'}
          </button>
        </form>

        <p style={s.footer}>Already have an account? <Link to="/login" style={{ color: '#1e4db7', fontWeight: '500' }}>Sign in</Link></p>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: '#f4f6fb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  card: { background: 'white', borderRadius: '12px', padding: '40px', width: '100%', maxWidth: '580px', boxShadow: '0 4px 24px rgba(15,31,61,0.12)', border: '1px solid #dde3f0' },
  brand: { fontSize: '22px', color: '#0f1f3d', marginBottom: '16px', fontWeight: '600' },
  title: { fontSize: '24px', color: '#1a1f2e', marginBottom: '6px' },
  sub: { color: '#7a8099', fontSize: '13px', marginBottom: '24px' },
  kycBox: { background: '#f8f9fd', border: '1px solid #dde3f0', borderRadius: '8px', padding: '16px', marginBottom: '16px' },
  kycTitle: { fontWeight: '600', fontSize: '13px', color: '#0f1f3d', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  err: { color: '#d94040', fontSize: '12px', marginTop: '4px', display: 'block' },
  footer: { textAlign: 'center', color: '#7a8099', fontSize: '14px', marginTop: '20px' }
};
