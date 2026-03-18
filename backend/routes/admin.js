const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const Customer = require('../models/Customer');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const Loan = require('../models/Loan');
const FixedDeposit = require('../models/FixedDeposit');
const RecurringDeposit = require('../models/RecurringDeposit');
const SupportTicket = require('../models/SupportTicket');
const Beneficiary = require('../models/Beneficiary');

router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const [
      totalCustomers, activeCustomers, pendingKyc, rejectedCustomers,
      totalAccounts, activeAccounts, atRiskAccounts, requestedAccounts,
      totalTransactions,
      pendingLoans, activeLoans,
      activeFDs, activeRDs,
      openTickets, inProgressTickets,
      pendingBeneficiaries
    ] = await Promise.all([
      Customer.countDocuments(),
      Customer.countDocuments({ status: 'ACTIVE' }),
      Customer.countDocuments({ status: 'PENDING_VERIFICATION' }),
      Customer.countDocuments({ status: 'REJECTED' }),
      Account.countDocuments(),
      Account.countDocuments({ status: 'ACTIVE' }),
      Account.countDocuments({ status: 'AT_RISK' }),
      Account.countDocuments({ status: 'REQUESTED' }),
      Transaction.countDocuments(),
      Loan.countDocuments({ status: 'PENDING' }),
      Loan.countDocuments({ status: 'ACTIVE' }),
      FixedDeposit.countDocuments({ status: 'ACTIVE' }),
      RecurringDeposit.countDocuments({ status: 'ACTIVE' }),
      SupportTicket.countDocuments({ status: 'OPEN' }),
      SupportTicket.countDocuments({ status: 'IN_PROGRESS' }),
      Beneficiary.countDocuments({ status: 'PENDING' })
    ]);

    const balanceAgg = await Account.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }]);
    const loanAgg = await Loan.aggregate([{ $match: { status: 'ACTIVE' } }, { $group: { _id: null, total: { $sum: '$loanAmount' } } }]);
    const fdAgg = await FixedDeposit.aggregate([{ $match: { status: 'ACTIVE' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
    const rdAgg = await RecurringDeposit.aggregate([{ $match: { status: 'ACTIVE' } }, { $group: { _id: null, total: { $sum: '$monthlyAmount' } } }]);

    res.json({
      success: true,
      stats: {
        customers: { total: totalCustomers, active: activeCustomers, pendingKyc, rejected: rejectedCustomers },
        accounts: { total: totalAccounts, active: activeAccounts, atRisk: atRiskAccounts, requested: requestedAccounts, totalBalance: balanceAgg[0]?.total || 0 },
        transactions: { total: totalTransactions },
        loans: { pending: pendingLoans, active: activeLoans, totalDisbursed: loanAgg[0]?.total || 0 },
        investments: { activeFDs, activeRDs, totalFDAmount: fdAgg[0]?.total || 0, totalRDMonthly: rdAgg[0]?.total || 0 },
        support: { open: openTickets, inProgress: inProgressTickets },
        beneficiaries: { pending: pendingBeneficiaries }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get admin profile
router.get('/profile', protect, async (req, res) => {
  try {
    const Admin = require('../models/Admin');
    const admin = await Admin.findOne({ adminId: req.user.adminId }).select('-password');
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    res.json({ success: true, admin });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update admin profile (name, email, password)
router.put('/profile', protect, async (req, res) => {
  try {
    const Admin = require('../models/Admin');
    const admin = await Admin.findOne({ adminId: req.user.adminId });
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    const { name, email, currentPassword, newPassword } = req.body;

    if (name) admin.name = name;
    if (email) admin.email = email;

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ success: false, message: 'Current password is required' });
      const match = await admin.comparePassword(currentPassword);
      if (!match) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
      admin.password = newPassword;
    }

    await admin.save();
    res.json({ success: true, message: 'Profile updated successfully', admin: { adminId: admin.adminId, name: admin.name, email: admin.email, role: admin.role, createdAt: admin.createdAt } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
