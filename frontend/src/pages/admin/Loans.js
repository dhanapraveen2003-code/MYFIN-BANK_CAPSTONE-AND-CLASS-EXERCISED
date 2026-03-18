import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/shared/Sidebar';
import api from '../../services/api';
import { toast } from 'react-toastify';

export default function AdminLoans() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [processing, setProcessing] = useState(null);
  const [approveModal, setApproveModal] = useState(null); // loan object
  const [interestRate, setInterestRate] = useState('');
  const fmt = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const fetchLoans = async () => {
    try { const { data } = await api.get('/loans'); setLoans(data.loans); }
    catch { toast.error('Failed to load loans'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchLoans(); }, []);

  // Suggested rate based on amount
  const getSuggestedRate = (amount) => {
    if (amount <= 50000)    return 14.0;
    if (amount <= 200000)   return 12.5;
    if (amount <= 500000)   return 11.0;
    if (amount <= 1000000)  return 10.0;
    return 9.0;
  };

  const openApproveModal = (loan) => {
    setApproveModal(loan);
    setInterestRate(getSuggestedRate(loan.loanAmount).toString());
  };

  const handleApprove = async () => {
    if (!interestRate || parseFloat(interestRate) <= 0) return toast.error('Enter a valid interest rate');
    setProcessing(approveModal.loanId);
    try {
      await api.patch(`/loans/${approveModal.loanId}/approve`, { interestRate: parseFloat(interestRate) });
      toast.success(`Loan approved at ${interestRate}% p.a. and disbursed!`);
      setApproveModal(null);
      setInterestRate('');
      fetchLoans();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setProcessing(null); }
  };

  const handleReject = async (loanId) => {
    if (!window.confirm('Reject this loan application?')) return;
    setProcessing(loanId);
    try {
      await api.patch(`/loans/${loanId}/reject`);
      toast.success('Loan rejected');
      fetchLoans();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setProcessing(null); }
  };

  const statusBadge = s => ({ ACTIVE: 'badge-success', APPROVED: 'badge-success', PENDING: 'badge-warning', REJECTED: 'badge-danger', CLOSED: 'badge-info' }[s] || 'badge-info');
  const filtered = filter === 'ALL' ? loans : loans.filter(l => l.status === filter);
  const pending = loans.filter(l => l.status === 'PENDING').length;

  // Preview EMI for modal
  const previewEmi = () => {
    if (!approveModal || !interestRate) return null;
    const r = parseFloat(interestRate) / 12 / 100;
    const n = approveModal.tenureMonths;
    const p = approveModal.loanAmount;
    if (!r || !n || !p) return null;
    return Math.round((p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
  };
  const emiPreview = previewEmi();

  return (
    <div className="page-wrapper"><Sidebar />
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div className="page-header" style={{ marginBottom: 0 }}><h2>Loan Requests</h2><p>Review and manage customer loan applications</p></div>
          {pending > 0 && <span className="badge badge-warning" style={{ fontSize: '14px', padding: '6px 14px' }}>{pending} pending review</span>}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {['ALL','PENDING','ACTIVE','REJECTED','CLOSED'].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f)}>
              {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
              {f === 'PENDING' && pending > 0 && <span style={{ marginLeft: '6px', background: '#e8b84b', color: '#0f1f3d', borderRadius: '10px', padding: '1px 6px', fontSize: '11px' }}>{pending}</span>}
            </button>
          ))}
        </div>

        <div className="card">
          {loading ? <div className="loading"><div className="spinner" /> Loading...</div> : filtered.length === 0 ? <div className="empty-state"><p>No loans found</p></div> : (
            <div className="table-wrap"><table className="data-table"><thead><tr>
              <th>Loan ID</th><th>Account</th><th>Amount</th><th>Tenure</th><th>Purpose</th><th>Interest Rate</th><th>EMI</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody>{filtered.map(l => (
              <tr key={l.loanId}>
                <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{l.loanId}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '12px', color: '#7a8099' }}>{l.accountNumber}</td>
                <td style={{ fontWeight: '600' }}>{fmt(l.loanAmount)}</td>
                <td style={{ color: '#7a8099' }}>{l.tenureMonths}m</td>
                <td style={{ color: '#7a8099', fontSize: '13px' }}>{l.purpose || '—'}</td>
                <td>
                  {l.status === 'PENDING'
                    ? <span style={{ color: '#b45309', fontStyle: 'italic', fontSize: '13px' }}>Pending</span>
                    : <span style={{ fontWeight: '600', color: '#1e4db7' }}>{l.interestRate}%</span>}
                </td>
                <td>{l.emiAmount ? `${fmt(l.emiAmount)}/mo` : '—'}</td>
                <td><span className={`badge ${statusBadge(l.status)}`}>{l.status}</span></td>
                <td>{l.status === 'PENDING' ? (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn btn-sm" style={{ background: '#27a85f', color: 'white' }} onClick={() => openApproveModal(l)} disabled={processing === l.loanId}>Approve</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleReject(l.loanId)} disabled={processing === l.loanId}>Reject</button>
                  </div>
                ) : <span style={{ color: '#7a8099', fontSize: '13px' }}>—</span>}
                </td>
              </tr>
            ))}</tbody>
            </table></div>
          )}
        </div>

        {/* Approve Modal */}
        {approveModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
            <div style={{ background: 'white', borderRadius: '14px', padding: '32px', width: '100%', maxWidth: '420px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1a1f2e', marginBottom: '6px' }}>Approve Loan</h3>
              <p style={{ color: '#7a8099', fontSize: '13px', marginBottom: '20px' }}>Set the interest rate for this loan. This cannot be changed after approval.</p>

              <div style={{ background: '#f8faff', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                  <div><span style={{ color: '#7a8099' }}>Loan ID</span><div style={{ fontFamily: 'monospace', fontWeight: '600' }}>{approveModal.loanId}</div></div>
                  <div><span style={{ color: '#7a8099' }}>Amount</span><div style={{ fontWeight: '600', color: '#1e4db7' }}>{fmt(approveModal.loanAmount)}</div></div>
                  <div><span style={{ color: '#7a8099' }}>Tenure</span><div style={{ fontWeight: '600' }}>{approveModal.tenureMonths} months</div></div>
                  <div><span style={{ color: '#7a8099' }}>Purpose</span><div style={{ fontWeight: '600' }}>{approveModal.purpose || '—'}</div></div>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#7a8099', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  Interest Rate (% per annum) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="36"
                  placeholder="e.g. 12.5"
                  value={interestRate}
                  onChange={e => setInterestRate(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #dde3f0', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box' }}
                  autoFocus
                />
                <div style={{ fontSize: '12px', color: '#7a8099', marginTop: '6px' }}>
                  Suggested rate for {fmt(approveModal.loanAmount)}: <b>{getSuggestedRate(approveModal.loanAmount)}% p.a.</b>
                </div>
              </div>

              {emiPreview && (
                <div style={{ background: '#e8f0fe', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#1e4db7', fontSize: '13px', fontWeight: '500' }}>Monthly EMI Preview</span>
                  <span style={{ color: '#1e4db7', fontSize: '18px', fontWeight: '700' }}>{fmt(emiPreview)}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, background: '#27a85f' }}
                  onClick={handleApprove}
                  disabled={processing === approveModal.loanId}
                >
                  {processing === approveModal.loanId ? 'Approving...' : 'Approve & Disburse'}
                </button>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setApproveModal(null); setInterestRate(''); }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
