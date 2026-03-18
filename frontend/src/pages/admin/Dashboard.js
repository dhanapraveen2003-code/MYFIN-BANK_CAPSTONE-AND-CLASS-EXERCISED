import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/shared/Sidebar';
import api from '../../services/api';
import { toast } from 'react-toastify';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats').then(res => setStats(res.data.stats)).catch(() => toast.error('Failed to load stats')).finally(() => setLoading(false));
  }, []);

  const fmt = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  const S = ({ label, value, sub, color }) => (
    <div className="stat-card" style={{ borderTop: `3px solid ${color || '#1e4db7'}` }}>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ fontSize: '24px', color: color }}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );

  return (
    <div className="page-wrapper"><Sidebar />
      <main className="main-content">
        <div className="page-header"><h2>Admin Dashboard</h2><p>Live overview of all banking operations</p></div>
        {loading ? <div className="loading"><div className="spinner" /> Loading...</div> : stats && (
          <>
            <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: '600', color: '#7a8099', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customers</div>
            <div className="stats-grid" style={{ marginBottom: '24px' }}>
              <S label="Total Customers" value={stats.customers.total} color="#1e4db7" />
              <S label="Active" value={stats.customers.active} color="#27a85f" />
              <S label="Pending KYC" value={stats.customers.pendingKyc} color="#e67e22" sub="Needs review" />
              <S label="Rejected" value={stats.customers.rejected} color="#d94040" />
            </div>

            <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: '600', color: '#7a8099', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Accounts</div>
            <div className="stats-grid" style={{ marginBottom: '24px' }}>
              <S label="Total Accounts" value={stats.accounts.total} color="#1e4db7" />
              <S label="Requested" value={stats.accounts.requested} color="#e67e22" sub="Pending approval" />
              <S label="AT_RISK" value={stats.accounts.atRisk} color="#d94040" sub="Zero balance" />
              <S label="Total Bank Balance" value={fmt(stats.accounts.totalBalance)} color="#27a85f" />
            </div>

            <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: '600', color: '#7a8099', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Loans & Investments</div>
            <div className="stats-grid" style={{ marginBottom: '24px' }}>
              <S label="Pending Loans" value={stats.loans.pending} color="#e67e22" sub="Needs decision" />
              <S label="Active Loans" value={stats.loans.active} color="#1e4db7" sub={fmt(stats.loans.totalDisbursed) + ' disbursed'} />
              <S label="Active FDs" value={stats.investments.activeFDs} color="#e8b84b" sub={fmt(stats.investments.totalFDAmount) + ' held'} />
              <S label="Active RDs" value={stats.investments.activeRDs} color="#9b59b6" sub={fmt(stats.investments.totalRDMonthly) + '/month'} />
            </div>

            <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: '600', color: '#7a8099', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Support & Transactions</div>
            <div className="stats-grid">
              <S label="Open Tickets" value={stats.support.open} color="#e67e22" />
              <S label="In Progress" value={stats.support.inProgress} color="#1e4db7" />
              <S label="Total Transactions" value={stats.transactions.total} color="#27a85f" />
              <S label="Pending Beneficiaries" value={stats.beneficiaries.pending} color="#e67e22" />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
