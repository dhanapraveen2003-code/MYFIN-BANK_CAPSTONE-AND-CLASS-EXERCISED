const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { deposit, withdraw, transfer, getTransactionsByAccount, getAllTransactions } = require('../services/transactionService');
const { getAccountByCustomerId } = require('../services/accountService');

// Customer: get own transactions
router.get('/my', protect, async (req, res) => {
  try {
    const account = await getAccountByCustomerId(req.user.customerId);
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    const transactions = await getTransactionsByAccount(account.accountNumber);
    res.json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Customer: deposit
router.post('/deposit', protect, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Invalid amount' });
    const account = await getAccountByCustomerId(req.user.customerId);
    const result = await deposit(account.accountNumber, amount);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Customer: withdraw
router.post('/withdraw', protect, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Invalid amount' });
    const account = await getAccountByCustomerId(req.user.customerId);
    const result = await withdraw(account.accountNumber, amount);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Customer: transfer
router.post('/transfer', protect, async (req, res) => {
  try {
    const { toAccountNumber, amount, description } = req.body;
    if (!toAccountNumber || !amount || amount <= 0) return res.status(400).json({ success: false, message: 'Account number and valid amount required' });
    const fromAccount = await getAccountByCustomerId(req.user.customerId);
    const result = await transfer(fromAccount.accountNumber, toAccountNumber, amount, description);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Admin: all transactions
router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const transactions = await getAllTransactions();
    res.json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
