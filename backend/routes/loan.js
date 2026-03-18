const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { applyLoan, getLoansByAccount, getAllLoans, getLoanById, approveLoan, rejectLoan, payEmi, getLoanPayments } = require('../services/loanService');
const { getAccountByCustomerId } = require('../services/accountService');

// Customer: calculate EMI
router.post('/calculate-emi', (req, res) => {
  const { principal, rate, months } = req.body;
  if (!principal || !rate || !months) return res.status(400).json({ success: false, message: 'All fields required' });
  const r = rate / 12 / 100;
  const n = months;
  const p = principal;
  const emi = Math.round((p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
  res.json({ success: true, emi, totalPayable: emi * n, totalInterest: emi * n - p });
});

// Customer: apply (no interestRate — admin decides on approval)
router.post('/apply', protect, async (req, res) => {
  try {
    const account = await getAccountByCustomerId(req.user.customerId);
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    const { loanAmount, tenureMonths, purpose } = req.body;
    const loan = await applyLoan({ accountNumber: account.accountNumber, loanAmount, tenureMonths, purpose });
    res.status(201).json({ success: true, loan, message: 'Application submitted! Admin will review and set your interest rate.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Customer: my loans
router.get('/my', protect, async (req, res) => {
  try {
    const account = await getAccountByCustomerId(req.user.customerId);
    const loans = await getLoansByAccount(account.accountNumber);
    res.json({ success: true, loans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Customer: pay EMI
router.post('/:loanId/pay-emi', protect, async (req, res) => {
  try {
    const account = await getAccountByCustomerId(req.user.customerId);
    const result = await payEmi(req.params.loanId, account.accountNumber);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Customer: get EMI payment history
router.get('/:loanId/payments', protect, async (req, res) => {
  try {
    const payments = await getLoanPayments(req.params.loanId);
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: all loans
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const loans = await getAllLoans();
    res.json({ success: true, loans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: approve with interest rate
router.patch('/:loanId/approve', protect, adminOnly, async (req, res) => {
  try {
    const { interestRate } = req.body;
    const loan = await approveLoan(req.params.loanId, interestRate);
    res.json({ success: true, message: 'Loan approved and disbursed', loan });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Admin: reject
router.patch('/:loanId/reject', protect, adminOnly, async (req, res) => {
  try {
    const loan = await rejectLoan(req.params.loanId);
    res.json({ success: true, message: 'Loan rejected', loan });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
