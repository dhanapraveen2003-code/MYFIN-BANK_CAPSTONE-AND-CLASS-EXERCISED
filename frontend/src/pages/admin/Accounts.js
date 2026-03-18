import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/shared/Sidebar';
import api from '../../services/api';
import { toast } from 'react-toastify';

export default function AdminAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState(null);
  const fmt = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const fetch = async () => {
    try { const { data } = await api.get('/accounts'); setAccounts(data.accounts); }
    catch { toast.error('Failed to load accounts'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const handleAction = async (accountNumber, action) => {
    setProcessing(accountNumber);
    try {
      if (action === 'approve') await api.patch(`/accounts/${accountNumber}/approve`);
      else if (action === 'reject') await api.patch(`/accounts/${accountNumber}/reject`);
      else await api.patch(`/accounts/${accountNumber}/status`, { status: action, ...(action === 'DEACTIVATED' ? { deactivationType: 'MANUAL' } : {}) });
      toast.success('Account updated');
      fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setProcessing(null); }
  };

  const statusBadge = s => ({ ACTIVE: 'badge-success', REQUESTED: 'badge-warning', AT_RISK: 'badge-warning', DEACTIVATED: 'badge-danger', REJECTED: 'badge-danger' }[s] || 'badge-info');

  const filtered = accounts.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = a.accountNumber?.toLowerCase().includes(q) || a.customerId?.toLowerCase().includes(q);
    return (filter === 'ALL' || a.status === filter) && matchSearch;
  });

  return (
    <div className="page-wrapper"><Sidebar />
      <main className="main-content">
        <div className="page-header"><h2>Accounts</h2><p>Manage all customer bank accounts and approvals</p></div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {['ALL','REQUESTED','ACTIVE','AT_RISK','DEACTIVATED'].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f)}>
              {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase().replace('_', ' ')}
            </button>
          ))}
          <input type="text" placeholder="Search account # or customer ID..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ marginLeft: 'auto', padding: '7px 14px', border: '1px solid #dde3f0', borderRadius: '8px', fontSize: '14px', outline: 'none', width: '260px' }} />
        </div>

        <div className="card">
          {loading ? <div className="loading"><div className="spinner" /> Loading...</div> : filtered.length === 0 ? <div className="empty-state"><p>No accounts found</p></div> : (
            <div className="table-wrap"><table className="data-table"><thead><tr>
              <th>Account Number</th><th>Customer ID</th><th>Type</th><th>Balance</th><th>Status</th><th>Deactivation</th><th>Actions</th>
            </tr></thead>
            <tbody>{filtered.map(a => (
              <tr key={a.accountNumber}>
                <td style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: '600' }}>{a.accountNumber}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '12px', color: '#7a8099' }}>{a.customerId}</td>
                <td>{a.accountType}</td>
                <td style={{ fontWeight: '600', color: a.balance === 0 ? '#d94040' : '#1a1f2e' }}>{fmt(a.balance)}</td>
                <td><span className={`badge ${statusBadge(a.status)}`}>{a.status}</span></td>
                <td style={{ fontSize: '12px', color: '#7a8099' }}>{a.deactivationType || '—'}</td>
                <td>
                  {a.status === 'REQUESTED' && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-sm" style={{ background: '#27a85f', color: 'white' }} onClick={() => handleAction(a.accountNumber, 'approve')} disabled={processing === a.accountNumber}>Approve</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleAction(a.accountNumber, 'reject')} disabled={processing === a.accountNumber}>Reject</button>
                    </div>
                  )}
                  {a.status === 'ACTIVE' && <button className="btn btn-danger btn-sm" onClick={() => handleAction(a.accountNumber, 'DEACTIVATED')} disabled={processing === a.accountNumber}>Deactivate</button>}
                  {a.status === 'DEACTIVATED' && a.deactivationType === 'MANUAL' && <button className="btn btn-sm" style={{ background: '#27a85f', color: 'white' }} onClick={() => handleAction(a.accountNumber, 'ACTIVE')} disabled={processing === a.accountNumber}>Reactivate</button>}
                  {a.status === 'AT_RISK' && <button className="btn btn-danger btn-sm" onClick={() => handleAction(a.accountNumber, 'DEACTIVATED')} disabled={processing === a.accountNumber}>Force Deactivate</button>}
                </td>
              </tr>
            ))}</tbody>
            </table></div>
          )}
        </div>
      </main>
    </div>
  );
}
