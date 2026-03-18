const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createFD, createRD, payRDInstallment, getFDsByAccount, getRDsByAccount } = require('../services/investmentService');
const { getAccountByCustomerId } = require('../services/accountService');

// Customer: create FD
router.post('/fd', protect, async (req, res) => {
  try {
    const account = await getAccountByCustomerId(req.user.customerId);
    const result = await createFD({ accountNumber: account.accountNumber, ...req.body });
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Customer: create RD
router.post('/rd', protect, async (req, res) => {
  try {
    const account = await getAccountByCustomerId(req.user.customerId);
    const result = await createRD({ accountNumber: account.accountNumber, ...req.body });
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Customer: pay RD installment
router.post('/rd/:rdId/pay', protect, async (req, res) => {
  try {
    const account = await getAccountByCustomerId(req.user.customerId);
    const result = await payRDInstallment(req.params.rdId, account.accountNumber);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Customer: get own FDs
router.get('/fd/my', protect, async (req, res) => {
  try {
    const account = await getAccountByCustomerId(req.user.customerId);
    const fds = await getFDsByAccount(account.accountNumber);
    res.json({ success: true, fds });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Customer: get own RDs
router.get('/rd/my', protect, async (req, res) => {
  try {
    const account = await getAccountByCustomerId(req.user.customerId);
    const rds = await getRDsByAccount(account.accountNumber);
    res.json({ success: true, rds });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
