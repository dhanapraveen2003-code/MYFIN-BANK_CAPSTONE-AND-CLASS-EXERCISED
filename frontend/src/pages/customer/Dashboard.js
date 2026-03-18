import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/shared/Sidebar';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [fds, setFds] = useState([]);
  const [rds, setRds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accRes, txnRes, fdRes, rdRes] = await Promise.all([
          api.get('/accounts/my'), api.get('/transactions/my'),
          api.get('/investments/fd/my'), api.get('/investments/rd/my')
        ]);
        setAccounts(accRes.data.accounts || []);
        setTransactions((txnRes.data.transactions || []).slice(0, 5));
        setFds(fdRes.data.fds || []);
        setRds(rdRes.data.rds || []);
      } catch { toast.error('Failed to load dashboard'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const fmt = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  const savings = accounts.find(a => a.accountType === 'SAVINGS');
  const current = accounts.find(a => a.accountType === 'CURRENT');
  const totalFD = fds.reduce((s, f) => s + f.amount, 0);
  const totalRD = rds.reduce((s, r) => s + r.monthlyAmount * r.paidInstallments, 0);

  const statusColor = s => ({ ACTIVE: '#27a85f', AT_RISK: '#e67e22', DEACTIVATED: '#d94040', REQUESTED: '#7a8099' }[s] || '#7a8099');
  const txnBadge = t => ['DEPOSIT', 'CREDIT'].includes(t.type) ? 'badge-success' : 'badge-danger';

  return (
    <div className="page-wrapper"><Sidebar />
      <main className="main-content">
        <div className="page-header"><h2>Welcome, {user?.name?.split(' ')[0]} 👋</h2><p>Here's your account overview</p></div>
        {loading ? <div className="loading"><div className="spinner" /> Loading...</div> : (
          <>
            {/* AT_RISK warning */}
            {accounts.some(a => a.status === 'AT_RISK') && (
              <div style={{ background: '#fef9ec', border: '1px solid #f5c842', borderRadius: '8px', padding: '14px 18px', marginBottom: '20px', color: '#c78e0a', fontSize: '14px' }}>
                ⚠️ One or more accounts are AT RISK due to zero balance. Please deposit funds within 24 hours to avoid auto-deactivation.
              </div>
            )}

            <div className="stats-grid">
              {savings && (
                <div className="stat-card" style={{ borderTop: `3px solid ${statusColor(savings.status)}` }}>
                  <div className="stat-label">Savings Account</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: '600', color: '#0f1f3d', margin: '6px 0' }}>{savings.accountNumber}</div>
                  <div className="stat-value" style={{ fontSize: '22px', color: '#27a85f' }}>{fmt(savings.balance)}</div>
                  <div className="stat-sub"><span className={`badge badge-${savings.status === 'ACTIVE' ? 'success' : savings.status === 'AT_RISK' ? 'warning' : 'danger'}`}>{savings.status}</span></div>
                </div>
              )}
              {current && (
                <div className="stat-card" style={{ borderTop: `3px solid ${statusColor(current.status)}` }}>
                  <div className="stat-label">Current Account</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: '600', color: '#0f1f3d', margin: '6px 0' }}>{current.accountNumber}</div>
                  <div className="stat-value" style={{ fontSize: '22px', color: '#1e4db7' }}>{fmt(current.balance)}</div>
                  <div className="stat-sub"><span className={`badge badge-${current.status === 'ACTIVE' ? 'success' : 'warning'}`}>{current.status}</span></div>
                </div>
              )}
              <div className="stat-card" style={{ borderTop: '3px solid #e8b84b' }}>
                <div className="stat-label">Fixed Deposits</div>
                <div className="stat-value" style={{ fontSize: '22px' }}>{fmt(totalFD)}</div>
                <div className="stat-sub">{fds.filter(f => f.status === 'ACTIVE').length} active FD{fds.length !== 1 ? 's' : ''}</div>
              </div>
              <div className="stat-card" style={{ borderTop: '3px solid #9b59b6' }}>
                <div className="stat-label">Recurring Deposits</div>
                <div className="stat-value" style={{ fontSize: '22px' }}>{fmt(totalRD)}</div>
                <div className="stat-sub">{rds.filter(r => r.status === 'ACTIVE').length} active RD{rds.length !== 1 ? 's' : ''}</div>
              </div>
            </div>

            <div className="card" style={{ marginBottom: '24px' }}>
              <h3 className="card-title">Quick Actions</h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {[['Deposit / Withdraw','/transactions'],['Fund Transfer','/transfer'],['Investments','/investments'],['Apply for Loan','/loans'],['Support Chat','/chat']].map(([label, path]) => (
                  <button key={path} className={path === '/transactions' ? 'btn btn-primary' : 'btn btn-secondary'} onClick={() => navigate(path)}>{label}</button>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="card-title">Recent Transactions</h3>
              {transactions.length === 0 ? <div className="empty-state"><p>No transactions yet</p></div> : (
                <div className="table-wrap"><table className="data-table"><thead><tr><th>Txn ID</th><th>Category</th><th>Type</th><th>Amount</th><th>Balance After</th><th>Date</th></tr></thead>
                  <tbody>{transactions.map(t => (
                    <tr key={t.txnId}>
                      <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{t.txnId}</td>
                      <td style={{ fontSize: '13px' }}>{t.transactionCategory}</td>
                      <td><span className={`badge ${txnBadge(t)}`}>{t.type}</span></td>
                      <td style={{ fontWeight: '600' }}>{fmt(t.amount)}</td>
                      <td style={{ color: '#7a8099' }}>{fmt(t.balanceAfterTxn ?? 0)}</td>
                      <td style={{ color: '#7a8099', fontSize: '13px' }}>{new Date(t.date).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}</tbody>
                </table></div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
