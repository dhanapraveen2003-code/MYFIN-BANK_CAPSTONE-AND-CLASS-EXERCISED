import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/shared/Sidebar';
import api from '../../services/api';
import { toast } from 'react-toastify';

export default function AdminProfile() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [showPwdSection, setShowPwdSection] = useState(false);

  useEffect(() => {
    api.get('/admin/profile')
      .then(res => {
        setAdmin(res.data.admin);
        setForm({ name: res.data.admin.name, email: res.data.admin.email });
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async () => {
    if (!form.name.trim() || !form.email.trim()) return toast.error('Name and email are required');
    setSaving(true);
    try {
      const res = await api.put('/admin/profile', { name: form.name, email: form.email });
      setAdmin(res.data.admin);
      setEditMode(false);
      // Update localStorage so sidebar name updates
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...user, name: res.data.admin.name, email: res.data.admin.email }));
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!pwdForm.currentPassword || !pwdForm.newPassword || !pwdForm.confirmPassword)
      return toast.error('Fill all password fields');
    if (pwdForm.newPassword !== pwdForm.confirmPassword)
      return toast.error('New passwords do not match');
    if (pwdForm.newPassword.length < 6)
      return toast.error('New password must be at least 6 characters');
    setChangingPwd(true);
    try {
      await api.put('/admin/profile', {
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword
      });
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPwdSection(false);
      toast.success('Password changed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally { setChangingPwd(false); }
  };

  const fmt = (dateStr) => new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) return (
    <div className="page-wrapper"><Sidebar />
      <main className="main-content"><div className="loading"><div className="spinner" /> Loading...</div></main>
    </div>
  );

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h2>My Profile</h2>
          <p>Manage your admin account details</p>
        </div>

        <div style={s.grid}>
          {/* Profile Card */}
          <div style={s.card}>
            {/* Avatar + Name Header */}
            <div style={s.profileHeader}>
              <div style={s.avatar}>
                {admin?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={s.adminName}>{admin?.name}</div>
                <div style={s.adminId}>{admin?.adminId}</div>
                <span style={s.badge}>ADMIN</span>
              </div>
            </div>

            <hr style={s.divider} />

            {/* Info Fields */}
            {!editMode ? (
              <>
                <div style={s.infoGrid}>
                  <InfoRow label="Full Name" value={admin?.name} />
                  <InfoRow label="Email Address" value={admin?.email} />
                  <InfoRow label="Admin ID" value={admin?.adminId} />
                  <InfoRow label="Role" value={admin?.role} />
                  <InfoRow label="Member Since" value={fmt(admin?.createdAt)} />
                </div>
                <button className="btn btn-primary" style={s.editBtn} onClick={() => setEditMode(true)}>
                  Edit Profile
                </button>
              </>
            ) : (
              <>
                <div style={s.formGroup}>
                  <label style={s.label}>Full Name</label>
                  <input
                    style={s.input}
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Enter your name"
                  />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Email Address</label>
                  <input
                    style={s.input}
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="Enter your email"
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveProfile} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => {
                    setEditMode(false);
                    setForm({ name: admin.name, email: admin.email });
                  }}>
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Account Stats */}
            <div style={s.card}>
              <div style={s.cardTitle}>Account Information</div>
              <div style={s.statGrid}>
                <div style={s.statBox}>
                  <div style={s.statLabel}>Account Status</div>
                  <span style={{ ...s.badge, background: '#dcfce7', color: '#15803d', fontSize: '13px' }}>Active</span>
                </div>
                <div style={s.statBox}>
                  <div style={s.statLabel}>Account Type</div>
                  <div style={s.statValue}>Administrator</div>
                </div>
                <div style={s.statBox}>
                  <div style={s.statLabel}>Admin ID</div>
                  <div style={{ ...s.statValue, fontFamily: 'monospace', color: '#1e4db7' }}>{admin?.adminId}</div>
                </div>
                <div style={s.statBox}>
                  <div style={s.statLabel}>Joined</div>
                  <div style={s.statValue}>{fmt(admin?.createdAt)}</div>
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={s.cardTitle}>Change Password</div>
                <button
                  style={s.togglePwdBtn}
                  onClick={() => setShowPwdSection(!showPwdSection)}
                >
                  {showPwdSection ? 'Cancel' : 'Change'}
                </button>
              </div>

              {!showPwdSection ? (
                <p style={{ color: '#7a8099', fontSize: '13px', margin: 0 }}>
                  Keep your account secure by using a strong password. Click "Change" to update your password.
                </p>
              ) : (
                <>
                  <div style={s.formGroup}>
                    <label style={s.label}>Current Password</label>
                    <input
                      style={s.input}
                      type="password"
                      placeholder="Enter current password"
                      value={pwdForm.currentPassword}
                      onChange={e => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                    />
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.label}>New Password</label>
                    <input
                      style={s.input}
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={pwdForm.newPassword}
                      onChange={e => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                    />
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.label}>Confirm New Password</label>
                    <input
                      style={s.input}
                      type="password"
                      placeholder="Re-enter new password"
                      value={pwdForm.confirmPassword}
                      onChange={e => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                    />
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '8px' }}
                    onClick={handleChangePassword}
                    disabled={changingPwd}
                  >
                    {changingPwd ? 'Updating...' : 'Update Password'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f0f2f8' }}>
      <span style={{ color: '#7a8099', fontSize: '13px' }}>{label}</span>
      <span style={{ color: '#1a1f2e', fontSize: '14px', fontWeight: '500' }}>{value}</span>
    </div>
  );
}

const s = {
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' },
  card: { background: 'white', borderRadius: '12px', padding: '28px', boxShadow: '0 1px 4px rgba(15,31,61,0.07)', border: '1px solid #e8ecf4' },
  profileHeader: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' },
  avatar: { width: '72px', height: '72px', borderRadius: '50%', background: '#1e4db7', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '700', flexShrink: 0 },
  adminName: { fontSize: '20px', fontWeight: '600', color: '#1a1f2e', marginBottom: '4px' },
  adminId: { fontSize: '13px', color: '#7a8099', marginBottom: '8px', fontFamily: 'monospace' },
  badge: { background: '#e8b84b', color: '#0f1f3d', fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '12px', letterSpacing: '0.05em' },
  divider: { border: 'none', borderTop: '1px solid #f0f2f8', margin: '0 0 20px 0' },
  infoGrid: { marginBottom: '20px' },
  editBtn: { width: '100%', marginTop: '4px' },
  formGroup: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '12px', fontWeight: '600', color: '#7a8099', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', border: '1.5px solid #dde3f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  cardTitle: { fontSize: '15px', fontWeight: '600', color: '#1a1f2e' },
  statGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' },
  statBox: { background: '#f8faff', borderRadius: '8px', padding: '14px' },
  statLabel: { fontSize: '11px', color: '#7a8099', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' },
  statValue: { fontSize: '14px', color: '#1a1f2e', fontWeight: '600' },
  togglePwdBtn: { padding: '6px 14px', border: '1.5px solid #1e4db7', borderRadius: '6px', background: 'transparent', color: '#1e4db7', fontSize: '13px', fontWeight: '500', cursor: 'pointer' },
};
