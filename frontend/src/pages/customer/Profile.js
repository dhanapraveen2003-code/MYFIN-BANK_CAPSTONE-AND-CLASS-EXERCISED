import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/shared/Sidebar';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [submitting, setSubmitting] = useState(false);
  const fmt = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/customers/profile/me');
      setProfile(res.data.user);
      setAccounts(res.data.accounts || []);
      setForm({ name: res.data.user.name, phone: res.data.user.phone || '', address: res.data.user.address || '' });
    } catch { toast.error('Failed to load profile'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchProfile(); }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name cannot be empty');
    setSubmitting(true);
    try {
      await api.put('/customers/profile/me', form);
      toast.success('Profile updated!');
      setEditing(false);
      fetchProfile();
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    finally { setSubmitting(false); }
  };

  const statusBadge = s => ({ ACTIVE: 'badge-success', AT_RISK: 'badge-warning', DEACTIVATED: 'badge-danger', REQUESTED: 'badge-info' }[s] || 'badge-info');

  return (
    <div className="page-wrapper"><Sidebar />
      <main className="main-content">
        <div className="page-header"><h2>My Profile</h2><p>Personal information and account details</p></div>
        {loading ? <div className="loading"><div className="spinner" /> Loading...</div> : (
          <div className="two-col">
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #dde3f0' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#1e4db7', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '600' }}>
                  {profile?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#1a1f2e' }}>{profile?.name}</div>
                  <div style={{ color: '#7a8099', fontSize: '14px' }}>{profile?.email}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#7a8099', marginTop: '2px' }}>{profile?.customerId}</div>
                  <span className={`badge badge-${profile?.status === 'ACTIVE' ? 'success' : 'warning'}`} style={{ marginTop: '4px' }}>{profile?.status}</span>
                </div>
              </div>

              {!editing ? (
                <>
                  {[
                    { label: 'Full Name', value: profile?.name },
                    { label: 'Email', value: profile?.email },
                    { label: 'Phone', value: profile?.phone || '—' },
                    { label: 'Address', value: profile?.address || '—' },
                    { label: 'Gov ID Type', value: profile?.govIdType || '—' },
                    { label: 'Gov ID Number', value: profile?.govIdNumber || '—' },
                    { label: 'Customer ID', value: profile?.customerId },
                    { label: 'Member Since', value: new Date(profile?.createdAt).toLocaleDateString('en-IN') },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f2f8', fontSize: '14px' }}>
                      <span style={{ color: '#7a8099', fontWeight: '500' }}>{label}</span>
                      <span style={{ color: '#1a1f2e', fontWeight: '500', maxWidth: '200px', textAlign: 'right' }}>{value}</span>
                    </div>
                  ))}
                  <button className="btn btn-primary" style={{ marginTop: '20px', width: '100%' }} onClick={() => setEditing(true)}>Edit Profile</button>
                </>
              ) : (
                <form onSubmit={handleUpdate} noValidate>
                  <div className="form-group"><label>Full Name *</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                  <div className="form-group"><label>Phone</label><input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                  <div className="form-group"><label>Address</label><input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditing(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</button>
                  </div>
                </form>
              )}
            </div>

            <div className="card" style={{ height: 'fit-content' }}>
              <h3 className="card-title">My Accounts</h3>
              {accounts.length === 0 ? <div className="empty-state"><p>No accounts found</p></div> : accounts.map(acc => (
                <div key={acc.accountNumber} style={{ background: '#f4f6fb', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#0f1f3d' }}>{acc.accountNumber}</span>
                    <span className={`badge ${statusBadge(acc.status)}`}>{acc.status}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#7a8099', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {[['Type', acc.accountType], ['Balance', fmt(acc.balance)], ...(acc.overdraftLimit ? [['Overdraft Limit', fmt(acc.overdraftLimit)]] : [])].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}><span>{k}</span><span style={{ color: '#1a1f2e', fontWeight: '500' }}>{v}</span></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
