import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/shared/Sidebar';
import api from '../../services/api';
import { toast } from 'react-toastify';

export default function TransferPage() {
  const [accounts, setAccounts] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [form, setForm] = useState({ toAccountNumber: '', amount: '', description: '' });
  const [newBen, setNewBen] = useState({ beneficiaryName: '', accountNumber: '', branch: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [addingBen, setAddingBen] = useState(false);
  const [lastTxn, setLastTxn] = useState(null);
  const [tab, setTab] = useState('transfer');

  const fmt = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const fetchData = async () => {
    const [accRes, benRes] = await Promise.all([api.get('/accounts/my'), api.get('/beneficiaries/my')]);
    setAccounts(accRes.data.accounts || []);
    setBeneficiaries(benRes.data.beneficiaries || []);
  };

  useEffect(() => { fetchData(); }, []);

  const primaryAccount = accounts.find(a => a.accountType === 'SAVINGS') || accounts[0];

  const validate = () => {
    const e = {};
    if (!form.toAccountNumber.trim()) e.toAccountNumber = 'Recipient account number is required';
    if (!form.amount || parseFloat(form.amount) <= 0) e.amount = 'Enter a valid amount';
    else if (primaryAccount && parseFloat(form.amount) > primaryAccount.balance) e.amount = 'Insufficient balance';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await api.post('/transactions/transfer', { toAccountNumber: form.toAccountNumber.trim(), amount: parseFloat(form.amount), description: form.description });
      toast.success('Transfer successful!');
      setLastTxn(res.data.txn);
      setForm({ toAccountNumber: '', amount: '', description: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transfer failed');
    } finally { setSubmitting(false); }
  };

  const handleAddBeneficiary = async (e) => {
    e.preventDefault();
    if (!newBen.beneficiaryName.trim() || !newBen.accountNumber.trim()) return toast.error('Name and account number required');
    setAddingBen(true);
    try {
      await api.post('/beneficiaries', newBen);
      toast.success('Beneficiary added! Awaiting admin approval.');
      setNewBen({ beneficiaryName: '', accountNumber: '', branch: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add beneficiary');
    } finally { setAddingBen(false); }
  };

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="page-header"><h2>Fund Transfer</h2><p>Transfer money or manage saved beneficiaries</p></div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {['transfer', 'beneficiaries'].map(t => (
            <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>
              {t === 'transfer' ? 'Transfer Money' : 'Beneficiaries'}
            </button>
          ))}
        </div>

        {tab === 'transfer' && (
          <div className="two-col">
            <div className="card">
              <div style={{ background: '#f4f6fb', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', color: '#7a8099', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Available Balance</div>
                <div style={{ fontSize: '26px', color: '#27a85f', marginTop: '4px', fontWeight: '600' }}>{fmt(primaryAccount?.balance || 0)}</div>
                <div style={{ fontSize: '12px', color: '#7a8099', marginTop: '4px' }}>{primaryAccount?.accountNumber}</div>
              </div>

              {beneficiaries.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '500', color: '#7a8099', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>Saved Beneficiaries</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {beneficiaries.map(b => (
                      <button key={b.beneficiaryId} className="btn btn-secondary btn-sm"
                        onClick={() => setForm({ ...form, toAccountNumber: b.accountNumber, description: `Transfer to ${b.beneficiaryName}` })}>
                        {b.beneficiaryName}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleTransfer} noValidate>
                <div className="form-group">
                  <label>Recipient Account Number *</label>
                  <input type="text" placeholder="e.g. MYFIN-SACC-0005" value={form.toAccountNumber}
                    onChange={e => setForm({ ...form, toAccountNumber: e.target.value })}
                    style={errors.toAccountNumber ? { borderColor: '#d94040' } : {}} />
                  {errors.toAccountNumber && <span style={{ color: '#d94040', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.toAccountNumber}</span>}
                </div>
                <div className="form-group">
                  <label>Amount (₹) *</label>
                  <input type="number" min="1" placeholder="Enter amount" value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    style={errors.amount ? { borderColor: '#d94040' } : {}} />
                  {errors.amount && <span style={{ color: '#d94040', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.amount}</span>}
                </div>
                <div className="form-group">
                  <label>Description (optional)</label>
                  <input type="text" placeholder="e.g. Rent payment" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
                  {submitting ? 'Processing...' : 'Transfer Now'}
                </button>
              </form>
            </div>

            <div>
              {lastTxn && (
                <div className="card" style={{ borderTop: '3px solid #27a85f', marginBottom: '20px' }}>
                  <h3 className="card-title" style={{ color: '#27a85f' }}>✓ Transfer Successful</h3>
                  <table style={{ width: '100%', fontSize: '14px' }}><tbody>
                    <tr><td style={{ padding: '8px 0', color: '#7a8099' }}>Transaction ID</td><td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{lastTxn.txnId}</td></tr>
                    <tr><td style={{ padding: '8px 0', color: '#7a8099' }}>Reference ID</td><td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{lastTxn.referenceId}</td></tr>
                    <tr><td style={{ padding: '8px 0', color: '#7a8099' }}>Amount</td><td style={{ fontWeight: '600' }}>{fmt(lastTxn.amount)}</td></tr>
                    <tr><td style={{ padding: '8px 0', color: '#7a8099' }}>Balance After</td><td style={{ color: '#27a85f', fontWeight: '600' }}>{fmt(lastTxn.balanceAfterTxn)}</td></tr>
                  </tbody></table>
                </div>
              )}
              <div className="card">
                <h3 className="card-title">Transfer Info</h3>
                <ul style={{ paddingLeft: '18px', color: '#7a8099', fontSize: '14px', lineHeight: '2' }}>
                  <li>Transfers are instant within MyFin Bank</li>
                  <li>Both sender and recipient get a transaction record</li>
                  <li>Both records share the same Reference ID</li>
                  <li>Save frequent recipients as beneficiaries</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {tab === 'beneficiaries' && (
          <div className="two-col">
            <div className="card">
              <h3 className="card-title">Add Beneficiary</h3>
              <p style={{ color: '#7a8099', fontSize: '13px', marginBottom: '20px' }}>Admin must approve before the beneficiary becomes active.</p>
              <form onSubmit={handleAddBeneficiary} noValidate>
                <div className="form-group">
                  <label>Beneficiary Name *</label>
                  <input type="text" placeholder="e.g. Rahul Sharma" value={newBen.beneficiaryName} onChange={e => setNewBen({ ...newBen, beneficiaryName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Account Number *</label>
                  <input type="text" placeholder="e.g. MYFIN-SACC-0005" value={newBen.accountNumber} onChange={e => setNewBen({ ...newBen, accountNumber: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Branch</label>
                  <input type="text" placeholder="e.g. Mumbai Main Branch" value={newBen.branch} onChange={e => setNewBen({ ...newBen, branch: e.target.value })} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={addingBen}>
                  {addingBen ? 'Submitting...' : 'Add Beneficiary'}
                </button>
              </form>
            </div>

            <div className="card">
              <h3 className="card-title">Active Beneficiaries</h3>
              {beneficiaries.length === 0 ? (
                <div className="empty-state"><p>No active beneficiaries yet</p></div>
              ) : (
                <div className="table-wrap">
                  <table className="data-table"><thead><tr><th>Name</th><th>Account</th><th>Branch</th></tr></thead>
                    <tbody>
                      {beneficiaries.map(b => (
                        <tr key={b.beneficiaryId}>
                          <td style={{ fontWeight: '500' }}>{b.beneficiaryName}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{b.accountNumber}</td>
                          <td style={{ color: '#7a8099' }}>{b.branch || '-'}</td>
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
