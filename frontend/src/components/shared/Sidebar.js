import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const customerLinks = [
  { path: '/dashboard',    label: 'Dashboard' },
  { path: '/transactions', label: 'Transactions' },
  { path: '/transfer',     label: 'Fund Transfer' },
  { path: '/investments',  label: 'Investments' },
  { path: '/loans',        label: 'Loans' },
  { path: '/chat',         label: 'Chat Support' },
  { path: '/profile',      label: 'My Profile' },
];

const adminLinks = [
  { path: '/admin/dashboard',     label: 'Dashboard' },
  { path: '/admin/customers',     label: 'Customers (KYC)' },
  { path: '/admin/accounts',      label: 'Accounts' },
  { path: '/admin/loans',         label: 'Loan Requests' },
  { path: '/admin/beneficiaries', label: 'Beneficiaries' },
  { path: '/admin/chat',          label: 'Support Chat' },
  { path: '/admin/profile',       label: 'My Profile' },
];

function getUser() {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}

export default function Sidebar() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = getUser();
  const links = user?.role === 'ADMIN' ? adminLinks : customerLinks;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    window.location.reload(); // force full reload to reset state
  };

  return (
    <>
      <button onClick={() => setMobileOpen(!mobileOpen)} style={s.menuBtn}>&#9776;</button>
      <aside style={{ ...s.sidebar, ...(mobileOpen ? s.open : {}) }}>
        <div style={s.brand}>
          <span style={s.brandText}>🏦 MyFin Bank</span>
          {user?.role === 'ADMIN' && <span style={s.adminBadge}>Admin</span>}
        </div>

        <nav style={s.nav}>
          {links.map(link => (
            <NavLink key={link.path} to={link.path}
              style={({ isActive }) => ({ ...s.navLink, ...(isActive ? s.active : {}) })}
              onClick={() => setMobileOpen(false)}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div style={s.bottom}>
          <div style={s.userInfo}>
            <div style={s.avatar}>{user?.name?.charAt(0).toUpperCase()}</div>
            <div>
              <div style={s.userName}>{user?.name}</div>
              <div style={s.userRole}>{user?.role}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={s.logoutBtn}>Logout</button>
        </div>
      </aside>
    </>
  );
}

const s = {
  sidebar: { width: '240px', background: '#0f1f3d', minHeight: '100vh', position: 'fixed', top: 0, left: 0, display: 'flex', flexDirection: 'column', zIndex: 50, transition: 'transform 0.25s ease' },
  open: { transform: 'translateX(0)' },
  menuBtn: { display: 'none', position: 'fixed', top: '16px', left: '16px', zIndex: 99, background: '#0f1f3d', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 12px', fontSize: '18px', cursor: 'pointer' },
  brand: { padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '10px' },
  brandText: { color: 'white', fontSize: '18px', fontWeight: '600' },
  adminBadge: { background: '#e8b84b', color: '#0f1f3d', fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '12px' },
  nav: { flex: 1, padding: '16px 0' },
  navLink: { display: 'block', padding: '11px 20px', color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: '400', textDecoration: 'none', transition: 'all 0.15s', borderLeft: '3px solid transparent' },
  active: { color: 'white', background: 'rgba(255,255,255,0.07)', borderLeftColor: '#e8b84b' },
  bottom: { padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' },
  userInfo: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' },
  avatar: { width: '36px', height: '36px', borderRadius: '50%', background: '#1e4db7', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '15px', flexShrink: 0 },
  userName: { color: 'white', fontSize: '13px', fontWeight: '500' },
  userRole: { color: 'rgba(255,255,255,0.45)', fontSize: '11px' },
  logoutBtn: { width: '100%', padding: '9px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '7px', fontSize: '13px', cursor: 'pointer' },
};
