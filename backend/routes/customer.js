const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { getAllCustomers, findById, updateCustomer, toggleStatus } = require('../services/customerService');
const { getAllAccountsByCustomerId } = require('../services/accountService');

// Admin: get all customers
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const customers = await getAllCustomers();
    res.json({ success: true, customers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: get single customer with accounts
router.get('/:customerId', protect, adminOnly, async (req, res) => {
  try {
    const customer = await findById(req.params.customerId);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    const accounts = await getAllAccountsByCustomerId(req.params.customerId);
    res.json({ success: true, customer, accounts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: update customer
router.put('/:customerId', protect, adminOnly, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const customer = await updateCustomer(req.params.customerId, { name, phone, address });
    res.json({ success: true, customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: approve KYC
router.patch('/:customerId/approve', protect, adminOnly, async (req, res) => {
  try {
    const customer = await toggleStatus(req.params.customerId, 'ACTIVE');
    res.json({ success: true, message: 'Customer approved', customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: reject KYC
router.patch('/:customerId/reject', protect, adminOnly, async (req, res) => {
  try {
    const customer = await toggleStatus(req.params.customerId, 'REJECTED');
    res.json({ success: true, message: 'Customer rejected', customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Customer: get own profile
router.get('/profile/me', protect, async (req, res) => {
  try {
    const accounts = await getAllAccountsByCustomerId(req.user.customerId);
    res.json({ success: true, user: req.user, accounts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Customer: update own profile
router.put('/profile/me', protect, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const customer = await updateCustomer(req.user.customerId, { name, phone, address });
    res.json({ success: true, customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
