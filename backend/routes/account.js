const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { getAccountByCustomerId, getAllAccountsByCustomerId, getAllAccounts, getAccountByNumber, approveAccount, rejectAccount, updateAccount } = require('../services/accountService');

// Customer: get own accounts
router.get('/my', protect, async (req, res) => {
  try {
    const accounts = await getAllAccountsByCustomerId(req.user.customerId);
    res.json({ success: true, accounts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: get all accounts
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const accounts = await getAllAccounts();
    res.json({ success: true, accounts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: approve account
router.patch('/:accountNumber/approve', protect, adminOnly, async (req, res) => {
  try {
    const account = await approveAccount(req.params.accountNumber);
    res.json({ success: true, message: 'Account approved', account });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: reject account
router.patch('/:accountNumber/reject', protect, adminOnly, async (req, res) => {
  try {
    const account = await rejectAccount(req.params.accountNumber);
    res.json({ success: true, message: 'Account rejected', account });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: manually activate / deactivate
router.patch('/:accountNumber/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const update = { status };
    if (status === 'DEACTIVATED') update.deactivationType = 'MANUAL';
    const account = await updateAccount(req.params.accountNumber, update);
    res.json({ success: true, account });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
