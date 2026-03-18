import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/shared/Sidebar';
import api from '../../services/api';
import { toast } from 'react-toastify';

export default function InvestmentsPage() {
  const [accounts, setAccounts] = useState([]);
  const [fds, setFds] = useState([]);
  const [rds, setRds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [fdForm, setFdForm] = useState({ amount: '', interestRate: '7', tenureMonths: '12' });
  const [rdForm, setRdForm] = useState({ monthlyAmount: '', interestRate: '6', tenureMonths: '12' });
  const [submitting, setSubmitting] = useState(false);

  const fmt = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const fetchAll = async () => {
    try {
      const [accRes, fdRes, rdRes] = await Promise.all([api.get('/accounts/my'), api.get('/investments/fd/my'), api.get('/investments/rd/my')]);
      setAccounts(accRes.data.accounts || []);
      setFds(fdRes.data.fds || []);
      setRds(rdRes.data.rds || []);
    } catch { toast.error('Failed to load investment data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const primaryAccount = accounts.find(a => a.accountType === 'SAVINGS') || accounts[0];

  const handleCreateFD = async (e) => {
    e.preventDefault();
    if (!fdForm.amount || parseFloat(fdForm.amount) <= 0) return toast.error('Enter valid amount');
    setSubmitting(true);
    try {
      await api.post('/investments/fd', { amount: parseFloat(fdForm.amount), interestRate: parseFloat(fdForm.interestRate), tenureMonths: parseInt(fdForm.tenureMonths) });
      toast.success('Fixed Deposit created!');
      setFdForm({ amount: '', interestRate: '7', tenureMonths: '12' });
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleCreateRD = async (e) => {
    e.preventDefault();
    if (!rdForm.monthlyAmount || parseFloat(rdForm.monthlyAmount) <= 0) return toast.error('Enter valid amount');
    setSubmitting(true);
    try {
      await api.post('/investments/rd', { monthlyAmount: parseFloat(rdForm.monthlyAmount), interestRate: parseFloat(rdForm.interestRate), tenureMonths: parseInt(rdForm.tenureMonths) });
      toast.success('Recurring Deposit created!');
      setRdForm({ monthlyAmount: '', interestRate: '6', tenureMonths: '12' });
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handlePayRD = async (rdId) => {
    try {
      await api.post(`/investments/rd/${rdId}/pay`);
      toast.success('RD installment paid!');
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const fdMaturity = p => Math.round(parseFloat(p || 0) * Math.pow(1 + parseFloat(fdForm.interestRate) / 100 / 12, parseInt(fdForm.tenureMonths)));
  const rdMaturity = p => { const n = parseInt(rdForm.tenureMonths); const r = parseFloat(rdForm.interestRate) / 100 / 12; return Math.round(parseFloat(p || 0) * n + parseFloat(p || 0) * n * (n + 1) * r / 2); };

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="page-header"><h2>Investments</h2><p>Manage your Fixed Deposits and Recurring Deposits</p></div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {['overview', 'fd', 'rd'].map(t => (
            <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab(t)}>
              {t === 'overview' ? 'Overview' : t === 'fd' ? 'Create FD' : 'Create RD'}
            </button>
          ))}
        </div>

        {loading ? <div className="loading"><div className="spinner" /> Loading...</div> : (
          <>
            {tab === 'overview' && (
              <>
                <div className="stats-grid" style={{ marginBottom: '24px' }}>
                  <div className="stat-card" style={{ borderTop: '3px solid #27a85f' }}>
                    <div className="stat-label">Available Balance</div>
                    <div className="stat-value" style={{ fontSize: '22px', color: '#27a85f' }}>{fmt(primaryAccount?.balance || 0)}</div>
                  </div>
                  <div className="stat-card" style={{ borderTop: '3px solid #e8b84b' }}>
                    <div className="stat-label">Active FDs</div>
                    <div className="stat-value">{fds.filter(f => f.status === 'ACTIVE').length}</div>
                    <div className="stat-sub">{fmt(fds.reduce((s, f) => s + f.amount, 0))} total invested</div>
                  </div>
                  <div className="stat-card" style={{ borderTop: '3px solid #9b59b6' }}>
                    <div className="stat-label">Active RDs</div>
                    <div className="stat-value">{rds.filter(r => r.status === 'ACTIVE').length}</div>
                    <div className="stat-sub">{fmt(rds.reduce((s, r) => s + r.monthlyAmount, 0))}/month</div>
                  </div>
                </div>

                {fds.length > 0 && (
                  <div className="card" style={{ marginBottom: '24px' }}>
                    <h3 className="card-title">Fixed Deposits</h3>
                    <div className="table-wrap">
                      <table className="data-table"><thead><tr><th>FD ID</th><th>Amount</th><th>Rate</th><th>Tenure</th><th>Maturity Amount</th><th>Maturity Date</th><th>Status</th></tr></thead>
                        <tbody>
                          {fds.map(fd => (
                            <tr key={fd.fdId}>
                              <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{fd.fdId}</td>
                              <td style={{ fontWeight: '600' }}>{fmt(fd.amount)}</td>
                              <td>{fd.interestRate}%</td>
                              <td>{fd.tenureMonths} months</td>
                              <td style={{ color: '#27a85f', fontWeight: '600' }}>{fmt(fd.maturityAmount)}</td>
                              <td style={{ color: '#7a8099', fontSize: '13px' }}>{new Date(fd.maturityDate).toLocaleDateString('en-IN')}</td>
                              <td><span className={`badge badge-${fd.status === 'ACTIVE' ? 'success' : fd.status === 'MATURED' ? 'info' : 'danger'}`}>{fd.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {rds.length > 0 && (
                  <div className="card">
                    <h3 className="card-title">Recurring Deposits</h3>
                    <div className="table-wrap">
                      <table className="data-table"><thead><tr><th>RD ID</th><th>Monthly</th><th>Rate</th><th>Progress</th><th>Maturity Date</th><th>Status</th><th>Action</th></tr></thead>
                        <tbody>
                          {rds.map(rd => (
                            <tr key={rd.rdId}>
                              <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{rd.rdId}</td>
                              <td style={{ fontWeight: '600' }}>{fmt(rd.monthlyAmount)}</td>
                              <td>{rd.interestRate}%</td>
                              <td>{rd.paidInstallments}/{rd.tenureMonths} paid</td>
                              <td style={{ color: '#7a8099', fontSize: '13px' }}>{new Date(rd.maturityDate).toLocaleDateString('en-IN')}</td>
                              <td><span className={`badge badge-${rd.status === 'ACTIVE' ? 'success' : rd.status === 'MATURED' ? 'info' : 'danger'}`}>{rd.status}</span></td>
                              <td>{rd.status === 'ACTIVE' && rd.paidInstallments < rd.tenureMonths && (
                                <button className="btn btn-primary btn-sm" onClick={() => handlePayRD(rd.rdId)}>Pay Installment</button>
                              )}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {fds.length === 0 && rds.length === 0 && (
                  <div className="card"><div className="empty-state"><p>No investments yet. Use the tabs above to create a FD or RD.</p></div></div>
                )}
              </>
            )}

            {tab === 'fd' && (
              <div className="two-col">
                <div className="card">
                  <h3 className="card-title">Create Fixed Deposit</h3>
                  <form onSubmit={handleCreateFD} noValidate>
                    <div className="form-group"><label>Lump Sum Amount (₹) *</label>
                      <input type="number" min="1" placeholder="e.g. 50000" value={fdForm.amount} onChange={e => setFdForm({ ...fdForm, amount: e.target.value })} />
                    </div>
                    <div className="form-row">
                      <div className="form-group"><label>Interest Rate (% p.a.)</label>
                        <input type="number" step="0.1" min="1" value={fdForm.interestRate} onChange={e => setFdForm({ ...fdForm, interestRate: e.target.value })} />
                      </div>
                      <div className="form-group"><label>Tenure (Months)</label>
                        <input type="number" min="1" value={fdForm.tenureMonths} onChange={e => setFdForm({ ...fdForm, tenureMonths: e.target.value })} />
                      </div>
                    </div>
                    {fdForm.amount > 0 && <div style={{ background: '#f4f6fb', borderRadius: '8px', padding: '14px', marginBottom: '20px', fontSize: '14px' }}>
                      <strong>Estimated Maturity Amount:</strong> <span style={{ color: '#27a85f', fontWeight: '600' }}>{fmt(fdMaturity(fdForm.amount))}</span>
                      <div style={{ color: '#7a8099', fontSize: '12px', marginTop: '4px' }}>Interest: {fmt(fdMaturity(fdForm.amount) - parseFloat(fdForm.amount || 0))}</div>
                    </div>}
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>{submitting ? 'Creating...' : 'Create Fixed Deposit'}</button>
                  </form>
                </div>
                <div className="card" style={{ height: 'fit-content' }}>
                  <h3 className="card-title">FD Details</h3>
                  <ul style={{ paddingLeft: '18px', color: '#7a8099', fontSize: '14px', lineHeight: '2' }}>
                    <li>One-time lump sum investment</li><li>Default rate: 7% per annum</li>
                    <li>Each FD gets a unique MYFIN-FD-XXXX ID</li><li>Maturity amount pre-calculated at creation</li>
                  </ul>
                </div>
              </div>
            )}

            {tab === 'rd' && (
              <div className="two-col">
                <div className="card">
                  <h3 className="card-title">Create Recurring Deposit</h3>
                  <form onSubmit={handleCreateRD} noValidate>
                    <div className="form-group"><label>Monthly Amount (₹) *</label>
                      <input type="number" min="1" placeholder="e.g. 2000" value={rdForm.monthlyAmount} onChange={e => setRdForm({ ...rdForm, monthlyAmount: e.target.value })} />
                    </div>
                    <div className="form-row">
                      <div className="form-group"><label>Interest Rate (% p.a.)</label>
                        <input type="number" step="0.1" min="1" value={rdForm.interestRate} onChange={e => setRdForm({ ...rdForm, interestRate: e.target.value })} />
                      </div>
                      <div className="form-group"><label>Tenure (Months)</label>
                        <input type="number" min="1" value={rdForm.tenureMonths} onChange={e => setRdForm({ ...rdForm, tenureMonths: e.target.value })} />
                      </div>
                    </div>
                    {rdForm.monthlyAmount > 0 && <div style={{ background: '#f4f6fb', borderRadius: '8px', padding: '14px', marginBottom: '20px', fontSize: '14px' }}>
                      <strong>Estimated Maturity Amount:</strong> <span style={{ color: '#27a85f', fontWeight: '600' }}>{fmt(rdMaturity(rdForm.monthlyAmount))}</span>
                    </div>}
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>{submitting ? 'Creating...' : 'Create Recurring Deposit'}</button>
                  </form>
                </div>
                <div className="card" style={{ height: 'fit-content' }}>
                  <h3 className="card-title">RD Details</h3>
                  <ul style={{ paddingLeft: '18px', color: '#7a8099', fontSize: '14px', lineHeight: '2' }}>
                    <li>Monthly fixed installment</li><li>Default rate: 6% per annum</li>
                    <li>Each RD gets a unique MYFIN-RD-XXXX ID</li><li>Track paid installments on the overview tab</li>
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
