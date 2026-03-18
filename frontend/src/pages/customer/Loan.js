import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/shared/Sidebar';
import api from '../../services/api';
import { toast } from 'react-toastify';

const RATE_TABLE = [
  { range: 'Up to ₹50,000',       rate: '14.0%' },
  { range: '₹50,001 – ₹2,00,000', rate: '12.5%' },
  { range: '₹2,00,001 – ₹5,00,000', rate: '11.0%' },
  { range: '₹5,00,001 – ₹10,00,000', rate: '10.0%' },
  { range: 'Above ₹10,00,000',    rate: '9.0%' },
];

export default function LoanPage() {
  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState({});
  const [expandedLoan, setExpandedLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('apply');
  const [submitting, setSubmitting] = useState(false);
  const [payingEmi, setPayingEmi] = useState(null);
  const [applyForm, setApplyForm] = useState({ loanAmount: '', tenureMonths: '', purpose: '' });
  const [emi, setEmi] = useState({ principal: '', rate: '', months: '' });
  const [emiResult, setEmiResult] = useState(null);
  const fmt = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const fetchLoans = async () => {
    try { const res = await api.get('/loans/my'); setLoans(res.data.loans); }
    catch { toast.error('Failed to load loans'); }
    finally { setLoading(false); }
  };

  const fetchPayments = async (loanId) => {
    try {
      const res = await api.get(`/loans/${loanId}/payments`);
      setPayments(p => ({ ...p, [loanId]: res.data.payments }));
    } catch { toast.error('Failed to load payment history'); }
  };

  useEffect(() => { fetchLoans(); }, []);

  const handleCalcEmi = (e) => {
    e.preventDefault();
    const p = parseFloat(emi.principal), r = parseFloat(emi.rate), n = parseInt(emi.months);
    if (!p || !r || !n) return toast.error('Enter all fields');
    const mr = r / 12 / 100;
    const val = Math.round((p * mr * Math.pow(1 + mr, n)) / (Math.pow(1 + mr, n) - 1));
    setEmiResult({ emi: val, total: val * n, interest: val * n - p });
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!applyForm.loanAmount || !applyForm.tenureMonths) return toast.error('Fill all required fields');
    if (parseFloat(applyForm.loanAmount) <= 0) return toast.error('Enter a valid loan amount');
    setSubmitting(true);
    try {
      await api.post('/loans/apply', {
        loanAmount: parseFloat(applyForm.loanAmount),
        tenureMonths: parseInt(applyForm.tenureMonths),
        purpose: applyForm.purpose
      });
      toast.success('Application submitted! Admin will review and set your interest rate.');
      setApplyForm({ loanAmount: '', tenureMonths: '', purpose: '' });
      fetchLoans(); setActiveTab('history');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit'); }
    finally { setSubmitting(false); }
  };

  const handlePayEmi = async (loanId) => {
    if (!window.confirm('Pay next EMI installment?')) return;
    setPayingEmi(loanId);
    try {
      const res = await api.post(`/loans/${loanId}/pay-emi`);
      if (res.data.loanClosed) {
        toast.success('🎉 EMI paid! Loan fully repaid and closed.');
      } else {
        toast.success(`EMI paid! ${res.data.remainingEmis} installment(s) remaining.`);
      }
      fetchLoans();
      if (expandedLoan === loanId) fetchPayments(loanId);
    } catch (err) { toast.error(err.response?.data?.message || 'EMI payment failed'); }
    finally { setPayingEmi(null); }
  };

  const toggleExpand = (loanId) => {
    if (expandedLoan === loanId) { setExpandedLoan(null); return; }
    setExpandedLoan(loanId);
    if (!payments[loanId]) fetchPayments(loanId);
  };

  const statusBadge = s => ({ ACTIVE: 'badge-success', APPROVED: 'badge-success', PENDING: 'badge-warning', REJECTED: 'badge-danger', CLOSED: 'badge-info' }[s] || 'badge-info');

  const getProgress = (loan) => {
    if (!loan.emiAmount || loan.status !== 'ACTIVE') return 0;
    const total = loan.loanAmount;
    const paid = total - loan.remainingBalance;
    return Math.min(100, Math.round((paid / total) * 100));
  };

  return (
    <div className="page-wrapper"><Sidebar />
      <main className="main-content">
        <div className="page-header"><h2>Loans</h2><p>Apply for loans, calculate EMI, and track repayments</p></div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {[['apply','Apply for Loan'], ['emi','EMI Calculator'], ['history','My Loans']].map(([t, l]) => (
            <button key={t} className={`btn ${activeTab === t ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab(t)}>{l}</button>
          ))}
        </div>

        {/* EMI CALCULATOR */}
        {activeTab === 'emi' && (
          <div className="two-col">
            <div className="card">
              <h3 className="card-title">EMI Calculator</h3>
              <form onSubmit={handleCalcEmi}>
                <div className="form-group"><label>Loan Amount (₹)</label><input type="number" min="1" placeholder="500000" value={emi.principal} onChange={e => setEmi({ ...emi, principal: e.target.value })} /></div>
                <div className="form-row">
                  <div className="form-group"><label>Rate (% p.a.)</label><input type="number" step="0.1" placeholder="10.5" value={emi.rate} onChange={e => setEmi({ ...emi, rate: e.target.value })} /></div>
                  <div className="form-group"><label>Tenure (Months)</label><input type="number" min="1" placeholder="24" value={emi.months} onChange={e => setEmi({ ...emi, months: e.target.value })} /></div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Calculate EMI</button>
              </form>
            </div>
            {emiResult && (
              <div className="card" style={{ borderTop: '3px solid #1e4db7' }}>
                <h3 className="card-title">Result</h3>
                <div style={{ textAlign: 'center', background: '#f4f6fb', borderRadius: '8px', padding: '20px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#7a8099', textTransform: 'uppercase' }}>Monthly EMI</div>
                  <div style={{ fontSize: '32px', color: '#1e4db7', fontWeight: '600', marginTop: '8px' }}>{fmt(emiResult.emi)}</div>
                </div>
                <table style={{ width: '100%', fontSize: '14px' }}><tbody>
                  <tr><td style={{ padding: '8px 0', color: '#7a8099', borderBottom: '1px solid #dde3f0' }}>Principal</td><td style={{ textAlign: 'right', borderBottom: '1px solid #dde3f0' }}>{fmt(parseFloat(emi.principal))}</td></tr>
                  <tr><td style={{ padding: '8px 0', color: '#7a8099', borderBottom: '1px solid #dde3f0' }}>Total Interest</td><td style={{ textAlign: 'right', borderBottom: '1px solid #dde3f0', color: '#d94040' }}>{fmt(emiResult.interest)}</td></tr>
                  <tr><td style={{ padding: '8px 0', fontWeight: '600' }}>Total Payable</td><td style={{ textAlign: 'right', fontWeight: '600' }}>{fmt(emiResult.total)}</td></tr>
                </tbody></table>
              </div>
            )}
          </div>
        )}

        {/* APPLY */}
        {activeTab === 'apply' && (
          <div className="two-col">
            <div className="card">
              <h3 className="card-title">Loan Application</h3>
              <p style={{ color: '#7a8099', fontSize: '13px', marginBottom: '20px' }}>
                Submit your request. Admin will review and assign an interest rate before approval.
              </p>
              <form onSubmit={handleApply} noValidate>
                <div className="form-group">
                  <label>Loan Amount (₹) *</label>
                  <input type="number" min="1" placeholder="e.g. 100000" value={applyForm.loanAmount} onChange={e => setApplyForm({ ...applyForm, loanAmount: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Tenure (Months) *</label>
                  <input type="number" min="1" max="360" placeholder="e.g. 24" value={applyForm.tenureMonths} onChange={e => setApplyForm({ ...applyForm, tenureMonths: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Purpose <span style={{ color: '#aaa' }}>(optional)</span></label>
                  <input type="text" placeholder="e.g. Home Renovation, Education" value={applyForm.purpose} onChange={e => setApplyForm({ ...applyForm, purpose: e.target.value })} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </form>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="card" style={{ height: 'fit-content' }}>
                <h3 className="card-title">Interest Rate Guide</h3>
                <p style={{ color: '#7a8099', fontSize: '13px', marginBottom: '12px' }}>
                  Indicative rates — final rate is set by admin on approval.
                </p>
                <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                  <thead><tr>
                    <th style={{ textAlign: 'left', padding: '8px 0', color: '#7a8099', borderBottom: '2px solid #dde3f0', fontWeight: '600' }}>Loan Amount</th>
                    <th style={{ textAlign: 'right', padding: '8px 0', color: '#7a8099', borderBottom: '2px solid #dde3f0', fontWeight: '600' }}>Rate (p.a.)</th>
                  </tr></thead>
                  <tbody>
                    {RATE_TABLE.map((r, i) => (
                      <tr key={i}>
                        <td style={{ padding: '8px 0', borderBottom: '1px solid #f0f2f8', color: '#1a1f2e' }}>{r.range}</td>
                        <td style={{ padding: '8px 0', borderBottom: '1px solid #f0f2f8', textAlign: 'right', color: '#1e4db7', fontWeight: '600' }}>{r.rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card" style={{ height: 'fit-content' }}>
                <h3 className="card-title">Guidelines</h3>
                <ul style={{ paddingLeft: '18px', color: '#7a8099', fontSize: '13px', lineHeight: '2', margin: 0 }}>
                  <li>Only one active loan at a time</li>
                  <li>Interest rate is decided by admin</li>
                  <li>Amount credited to your account on approval</li>
                  <li>Pay EMIs from the My Loans tab</li>
                  <li>Loan closes automatically after last EMI</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* MY LOANS */}
        {activeTab === 'history' && (
          <div>
            {loading ? <div className="loading"><div className="spinner" /> Loading...</div> :
              loans.length === 0 ? (
                <div className="card"><div className="empty-state"><p>No loan applications yet.</p><button className="btn btn-primary" onClick={() => setActiveTab('apply')}>Apply for a Loan</button></div></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {loans.map(l => {
                    const progress = getProgress(l);
                    const paidEmis = l.emiAmount ? Math.round((l.loanAmount - l.remainingBalance) / l.emiAmount) : 0;
                    const isExpanded = expandedLoan === l.loanId;
                    return (
                      <div key={l.loanId} className="card" style={{ padding: '0', overflow: 'hidden' }}>
                        {/* Card Header */}
                        <div style={{ padding: '20px 24px', borderBottom: isExpanded ? '1px solid #f0f2f8' : 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#7a8099' }}>{l.loanId}</span>
                                <span className={`badge ${statusBadge(l.status)}`}>{l.status}</span>
                              </div>
                              <div style={{ fontSize: '22px', fontWeight: '700', color: '#1a1f2e' }}>{fmt(l.loanAmount)}</div>
                              {l.purpose && <div style={{ fontSize: '13px', color: '#7a8099', marginTop: '2px' }}>{l.purpose}</div>}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              {l.status === 'ACTIVE' && (
                                <button
                                  className="btn btn-primary"
                                  onClick={() => handlePayEmi(l.loanId)}
                                  disabled={payingEmi === l.loanId}
                                  style={{ minWidth: '110px' }}
                                >
                                  {payingEmi === l.loanId ? 'Processing...' : `Pay EMI ${fmt(l.emiAmount)}`}
                                </button>
                              )}
                              <button className="btn btn-secondary" onClick={() => toggleExpand(l.loanId)}>
                                {isExpanded ? 'Hide Details ▲' : 'View Details ▼'}
                              </button>
                            </div>
                          </div>

                          {/* Quick Stats Row */}
                          <div style={{ display: 'flex', gap: '24px', marginTop: '16px', flexWrap: 'wrap' }}>
                            <Stat label="Interest Rate" value={l.status === 'PENDING' ? 'Pending admin' : `${l.interestRate}% p.a.`} highlight={l.status === 'PENDING'} />
                            <Stat label="Tenure" value={`${l.tenureMonths} months`} />
                            <Stat label="Monthly EMI" value={l.emiAmount ? fmt(l.emiAmount) : '—'} />
                            {l.status === 'ACTIVE' && <Stat label="Remaining" value={fmt(l.remainingBalance)} danger />}
                            {l.status === 'ACTIVE' && <Stat label="EMIs Paid" value={`${paidEmis} / ${l.tenureMonths}`} />}
                          </div>

                          {/* Progress Bar */}
                          {l.status === 'ACTIVE' && (
                            <div style={{ marginTop: '14px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#7a8099', marginBottom: '6px' }}>
                                <span>Repayment Progress</span>
                                <span>{progress}% paid</span>
                              </div>
                              <div style={{ background: '#f0f2f8', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
                                <div style={{ width: `${progress}%`, background: progress === 100 ? '#27a85f' : '#1e4db7', height: '100%', borderRadius: '8px', transition: 'width 0.4s ease' }} />
                              </div>
                            </div>
                          )}
                          {l.status === 'CLOSED' && (
                            <div style={{ marginTop: '12px', background: '#dcfce7', borderRadius: '8px', padding: '10px 14px', color: '#15803d', fontSize: '13px', fontWeight: '500' }}>
                              ✅ Loan fully repaid and closed
                            </div>
                          )}
                          {l.status === 'PENDING' && (
                            <div style={{ marginTop: '12px', background: '#fff7e6', borderRadius: '8px', padding: '10px 14px', color: '#b45309', fontSize: '13px' }}>
                              ⏳ Awaiting admin review. Interest rate will be assigned on approval.
                            </div>
                          )}
                          {l.status === 'REJECTED' && (
                            <div style={{ marginTop: '12px', background: '#fef2f2', borderRadius: '8px', padding: '10px 14px', color: '#b91c1c', fontSize: '13px' }}>
                              ❌ This application was rejected. You may apply for a new loan.
                            </div>
                          )}
                        </div>

                        {/* Expanded EMI History */}
                        {isExpanded && (
                          <div style={{ padding: '20px 24px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1a1f2e', marginBottom: '12px' }}>EMI Payment Schedule</h4>
                            {!payments[l.loanId] ? (
                              <div className="loading"><div className="spinner" /> Loading...</div>
                            ) : payments[l.loanId].length === 0 ? (
                              <p style={{ color: '#7a8099', fontSize: '13px' }}>No EMI records yet.</p>
                            ) : (
                              <div className="table-wrap">
                                <table className="data-table">
                                  <thead><tr><th>EMI #</th><th>Amount</th><th>Due Date</th><th>Paid On</th><th>Reference</th><th>Status</th></tr></thead>
                                  <tbody>{payments[l.loanId].map(p => (
                                    <tr key={p.paymentId}>
                                      <td style={{ fontWeight: '600' }}>#{p.emiNumber}</td>
                                      <td>{fmt(p.amount)}</td>
                                      <td style={{ color: '#7a8099', fontSize: '13px' }}>
                                        {l.startDate ? new Date(new Date(l.startDate).setMonth(new Date(l.startDate).getMonth() + p.emiNumber)).toLocaleDateString('en-IN') : '—'}
                                      </td>
                                      <td style={{ color: '#7a8099', fontSize: '13px' }}>
                                        {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN') : '—'}
                                      </td>
                                      <td style={{ fontFamily: 'monospace', fontSize: '12px', color: '#7a8099' }}>{p.referenceId || '—'}</td>
                                      <td><span className={`badge ${p.status === 'PAID' ? 'badge-success' : 'badge-warning'}`}>{p.status}</span></td>
                                    </tr>
                                  ))}</tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            }
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value, danger, highlight }) {
  return (
    <div>
      <div style={{ fontSize: '11px', color: '#7a8099', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: '600', color: danger ? '#d94040' : highlight ? '#b45309' : '#1a1f2e' }}>{value}</div>
    </div>
  );
}
