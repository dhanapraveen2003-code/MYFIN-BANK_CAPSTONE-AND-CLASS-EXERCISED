const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { addBeneficiary, getBeneficiariesByCustomer, getAllPending, approveBeneficiary, rejectBeneficiary } = require('../services/beneficiaryService');

// Customer: add beneficiary
router.post('/', protect, async (req, res) => {
  try {
    const ben = await addBeneficiary({ customerId: req.user.customerId, ...req.body });
    res.status(201).json({ success: true, beneficiary: ben });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Customer: get own active beneficiaries
router.get('/my', protect, async (req, res) => {
  try {
    const beneficiaries = await getBeneficiariesByCustomer(req.user.customerId);
    res.json({ success: true, beneficiaries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: get pending
router.get('/pending', protect, adminOnly, async (req, res) => {
  try {
    const beneficiaries = await getAllPending();
    res.json({ success: true, beneficiaries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: approve
router.patch('/:beneficiaryId/approve', protect, adminOnly, async (req, res) => {
  try {
    const ben = await approveBeneficiary(req.params.beneficiaryId);
    res.json({ success: true, beneficiary: ben });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: reject
router.delete('/:beneficiaryId', protect, adminOnly, async (req, res) => {
  try {
    await rejectBeneficiary(req.params.beneficiaryId);
    res.json({ success: true, message: 'Beneficiary rejected and removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
