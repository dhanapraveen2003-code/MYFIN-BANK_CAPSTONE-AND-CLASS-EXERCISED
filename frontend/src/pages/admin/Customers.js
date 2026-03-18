import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/shared/Sidebar';
import api from '../../services/api';
import { toast } from 'react-toastify';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [processing, setProcessing] = useState(null);

  const fetch = async () => {
    try { const { data } = await api.get('/customers'); setCustomers(data.customers); }
    catch { toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const handleAction = async (customerId, action) => {
    setProcessing(customerId);
    try {
      await api.patch(`/customers/${customerId}/${action}`);
      toast.success(`Customer ${action === 'approve' ? 'approved' : 'rejected'}`);
      fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
    finally { setProcessing(null); }
  };

  const statusBadge = s => s === 'ACTIVE' ? 'badge-success' : s === 'PENDING_VERIFICATION' ? 'badge-warning' : 'badge-danger';

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.customerId?.toLowerCase().includes(q);
    const matchFilter = filter === 'ALL' || c.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="page-wrapper"><Sidebar />
      <main className="main-content">
        <div className="page-header"><h2>Customers</h2><p>Manage KYC and customer accounts</p></div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {['ALL','PENDING_VERIFICATION','ACTIVE','REJECTED'].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f)}>
              {f === 'PENDING_VERIFICATION' ? 'Pending KYC' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
          <input type="text" placeholder="Search name, email, ID..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ marginLeft: 'auto', padding: '7px 14px', border: '1px solid #dde3f0', borderRadius: '8px', fontSize: '14px', outline: 'none', width: '240px' }} />
        </div>

        <div className="card">
          {loading ? <div className="loading"><div className="spinner" /> Loading...</div> : filtered.length === 0 ? <div className="empty-state"><p>No customers found</p></div> : (
            <div className="table-wrap"><table className="data-table"><thead><tr>
              <th>Customer ID</th><th>Name</th><th>Email</th><th>KYC</th><th>Status</th><th>Registered</th><th>Actions</th>
            </tr></thead>
            <tbody>{filtered.map(c => (
              <tr key={c.customerId}>
                <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{c.customerId}</td>
                <td style={{ fontWeight: '500' }}>{c.name}</td>
                <td style={{ color: '#7a8099' }}>{c.email}</td>
                <td style={{ fontSize: '13px', color: '#7a8099' }}>
                  {c.govIdType && <><strong>{c.govIdType}</strong>: {c.govIdNumber}</>}
                  {c.govIdDocumentPath && <div><a href={`http://localhost:5000/${c.govIdDocumentPath}`} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#1e4db7' }}>View Document</a></div>}
                </td>
                <td><span className={`badge ${statusBadge(c.status)}`}>{c.status}</span></td>
                <td style={{ fontSize: '13px', color: '#7a8099' }}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                <td>
                  {c.status === 'PENDING_VERIFICATION' && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-sm" style={{ background: '#27a85f', color: 'white' }} onClick={() => handleAction(c.customerId, 'approve')} disabled={processing === c.customerId}>Approve</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleAction(c.customerId, 'reject')} disabled={processing === c.customerId}>Reject</button>
                    </div>
                  )}
                  {c.status === 'ACTIVE' && <button className="btn btn-danger btn-sm" onClick={() => handleAction(c.customerId, 'reject')}>Deactivate</button>}
                  {c.status === 'REJECTED' && <button className="btn btn-sm" style={{ background: '#27a85f', color: 'white' }} onClick={() => handleAction(c.customerId, 'approve')}>Reactivate</button>}
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
