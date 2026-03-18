import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/shared/Sidebar';
import api from '../../services/api';
import { toast } from 'react-toastify';

export default function AdminBeneficiaries() {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const fetch = async () => {
    try { const { data } = await api.get('/beneficiaries/pending'); setBeneficiaries(data.beneficiaries); }
    catch { toast.error('Failed to load beneficiaries'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const handleAction = async (beneficiaryId, action) => {
    setProcessing(beneficiaryId);
    try {
      if (action === 'approve') await api.patch(`/beneficiaries/${beneficiaryId}/approve`);
      else await api.delete(`/beneficiaries/${beneficiaryId}`);
      toast.success(`Beneficiary ${action === 'approve' ? 'approved' : 'rejected'}`);
      fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setProcessing(null); }
  };

  return (
    <div className="page-wrapper"><Sidebar />
      <main className="main-content">
        <div className="page-header"><h2>Beneficiary Approvals</h2><p>Review and approve pending beneficiary requests</p></div>
        <div className="card">
          {loading ? <div className="loading"><div className="spinner" /> Loading...</div> : beneficiaries.length === 0 ? (
            <div className="empty-state"><p>No pending beneficiary requests</p></div>
          ) : (
            <div className="table-wrap"><table className="data-table"><thead><tr>
              <th>Beneficiary ID</th><th>Customer ID</th><th>Name</th><th>Account Number</th><th>Branch</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody>{beneficiaries.map(b => (
              <tr key={b.beneficiaryId}>
                <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{b.beneficiaryId}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '12px', color: '#7a8099' }}>{b.customerId}</td>
                <td style={{ fontWeight: '500' }}>{b.beneficiaryName}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{b.accountNumber}</td>
                <td style={{ color: '#7a8099' }}>{b.branch || '-'}</td>
                <td><span className="badge badge-warning">{b.status}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn btn-sm" style={{ background: '#27a85f', color: 'white' }} onClick={() => handleAction(b.beneficiaryId, 'approve')} disabled={processing === b.beneficiaryId}>Approve</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleAction(b.beneficiaryId, 'reject')} disabled={processing === b.beneficiaryId}>Reject</button>
                  </div>
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
