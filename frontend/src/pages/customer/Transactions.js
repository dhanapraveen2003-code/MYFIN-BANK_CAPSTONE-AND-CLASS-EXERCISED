import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/shared/Sidebar';
import api from '../../services/api';
import { toast } from 'react-toastify';

export default function TransactionsPage() {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('deposit');
  const fmt = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const fetchData = async () => {
    try {
      const [accRes, txnRes] = await Promise.all([api.get('/accounts/my'), api.get('/transactions/my')]);
      setAccounts(accRes.data.accounts || []);
      setTransactions(txnRes.data.transactions || []);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const primaryAccount = accounts.find(a => a.accountType === 'SAVINGS') || accounts[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) return toast.error('Enter a valid amount');
    if (activeTab === 'withdraw' && primaryAccount && val > primaryAccount.balance) return toast.error('Insufficient balance');
    setSubmitting(true);
    try {
      await api.post(`/transactions/${activeTab}`, { amount: val });
      toast.success(`${activeTab === 'deposit' ? 'Deposit' : 'Withdrawal'} successful!`);
      setAmount('');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Transaction failed'); }
    finally { setSubmitting(false); }
  };

  const typeBadge = t => t.type === 'CREDIT' ? 'badge-success' : 'badge-danger';

  return (
    <div className="page-wrapper"><Sidebar />
      <main className="main-content">
        <div className="page-header"><h2>Transactions</h2><p>Deposit, withdraw and view your passbook</p></div>
        {loading ? <div className="loading"><div className="spinner" /> Loading...</div> : (
          <div className="two-col">
            <div>
              <div className="card">
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                  <button className={`btn ${activeTab === 'deposit' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => setActiveTab('deposit')}>Deposit</button>
                  <button className={`btn ${activeTab === 'withdraw' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => setActiveTab('withdraw')}>Withdraw</button>
                </div>
                <div style={{ background: '#f4f6fb', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', color: '#7a8099', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {primaryAccount?.accountNumber} · {primaryAccount?.accountType}
                    <span className={`badge badge-${primaryAccount?.status === 'ACTIVE' ? 'success' : primaryAccount?.status === 'AT_RISK' ? 'warning' : 'danger'}`} style={{ marginLeft: '8px' }}>{primaryAccount?.status}</span>
                  </div>
                  <div style={{ fontSize: '26px', color: '#27a85f', fontWeight: '600', marginTop: '4px' }}>{fmt(primaryAccount?.balance || 0)}</div>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Amount (₹) *</label>
                    <input type="number" min="1" placeholder={`Enter ${activeTab} amount`} value={amount} onChange={e => setAmount(e.target.value)} />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting || primaryAccount?.status !== 'ACTIVE'}>
                    {submitting ? 'Processing...' : activeTab === 'deposit' ? 'Deposit Money' : 'Withdraw Money'}
                  </button>
                  {primaryAccount?.status !== 'ACTIVE' && <p style={{ color: '#d94040', fontSize: '13px', marginTop: '8px', textAlign: 'center' }}>Account is {primaryAccount?.status} — transactions disabled</p>}
                </form>
              </div>
            </div>

            <div className="card" style={{ height: 'fit-content' }}>
              <h3 className="card-title">Passbook</h3>
              {transactions.length === 0 ? <div className="empty-state"><p>No transactions yet</p></div> : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Txn ID</th><th>Category</th><th>Type</th><th>Amount</th><th>Balance After</th><th>Date</th></tr></thead>
                    <tbody>
                      {transactions.map(t => (
                        <tr key={t.txnId}>
                          <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{t.txnId}</td>
                          <td style={{ fontSize: '12px' }}>{t.transactionCategory}</td>
                          <td><span className={`badge ${typeBadge(t)}`}>{t.type}</span></td>
                          <td style={{ fontWeight: '600' }}>{fmt(t.amount)}</td>
                          <td style={{ color: '#7a8099' }}>{fmt(t.balanceAfterTxn ?? 0)}</td>
                          <td style={{ color: '#7a8099', fontSize: '12px' }}>{new Date(t.date).toLocaleDateString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
