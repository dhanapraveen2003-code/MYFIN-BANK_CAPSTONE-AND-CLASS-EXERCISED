import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function EmiCalculator() {
  const [form, setForm] = useState({ principal: '', rate: '', months: '' });
  const [result, setResult] = useState(null);

  const fmt = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const calculate = (e) => {
    e.preventDefault();
    const p = parseFloat(form.principal);
    const r = parseFloat(form.rate) / 12 / 100;
    const n = parseInt(form.months);
    if (!p || !r || !n) return;
    const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    setResult({
      emi: Math.round(emi),
      total: Math.round(emi * n),
      interest: Math.round(emi * n - p),
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6fb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '12px', padding: '40px', width: '100%', maxWidth: '480px', boxShadow: '0 4px 24px rgba(15,31,61,0.12)' }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '22px', color: '#0f1f3d', marginBottom: '8px' }}>MyFin Bank</div>
        <h2 style={{ fontSize: '24px', color: '#1a1f2e', marginBottom: '24px' }}>EMI Calculator</h2>

        <form onSubmit={calculate} noValidate>
          <div className="form-group">
            <label>Loan Amount (₹) *</label>
            <input type="number" min="1" placeholder="e.g. 500000" value={form.principal} onChange={(e) => setForm({ ...form, principal: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Rate (% p.a.) *</label>
              <input type="number" step="0.1" min="0.1" placeholder="e.g. 10.5" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Tenure (Months) *</label>
              <input type="number" min="1" placeholder="e.g. 24" value={form.months} onChange={(e) => setForm({ ...form, months: e.target.value })} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Calculate EMI</button>
        </form>

        {result && (
          <div style={{ marginTop: '24px', background: '#f4f6fb', borderRadius: '8px', padding: '20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#7a8099', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monthly EMI</div>
              <div style={{ fontSize: '32px', fontFamily: "'DM Serif Display', serif", color: '#1e4db7', marginTop: '6px' }}>{fmt(result.emi)}</div>
            </div>
            <table style={{ width: '100%', fontSize: '14px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '8px 0', color: '#7a8099', borderBottom: '1px solid #dde3f0' }}>Principal</td>
                  <td style={{ textAlign: 'right', borderBottom: '1px solid #dde3f0' }}>{fmt(parseFloat(form.principal))}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', color: '#7a8099', borderBottom: '1px solid #dde3f0' }}>Total Interest</td>
                  <td style={{ textAlign: 'right', borderBottom: '1px solid #dde3f0', color: '#d94040' }}>{fmt(result.interest)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: '600' }}>Total Payable</td>
                  <td style={{ textAlign: 'right', fontWeight: '600' }}>{fmt(result.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#7a8099' }}>
          <Link to="/login" style={{ color: '#1e4db7' }}>← Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
