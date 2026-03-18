const express = require('express');
const router = express.Router();
const { loginCustomer, loginAdmin, forgotPassword, resetPassword } = require('../services/authService');
const { registerCustomer } = require('../services/customerService');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
router.get('/test-email', async (req, res) => {
  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: { rejectUnauthorized: false }
    });
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'MyFin Test',
      text: 'Email is working!'
    });
    res.json({ success: true, message: 'Email sent!', user: process.env.EMAIL_USER, passLength: process.env.EMAIL_PASS?.length });
  } catch (err) {
    res.json({ success: false, error: err.message, user: process.env.EMAIL_USER, passLength: process.env.EMAIL_PASS?.length });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Customer register with KYC upload
router.post('/register', upload.single('govIdDocument'), async (req, res) => {
  try {
    const { name, email, password, phone, address, govIdType, govIdNumber } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    const govIdDocumentPath = req.file ? req.file.path : null;
    const customer = await registerCustomer({ name, email, password, phone, address, govIdType, govIdNumber, govIdDocumentPath });
    res.status(201).json({ success: true, message: 'Registration submitted. Awaiting KYC verification.', customerId: customer.customerId });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Customer login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    const { customer, token } = await loginCustomer(email, password);
    res.json({ success: true, token, user: { id: customer.customerId, name: customer.name, email: customer.email, role: 'CUSTOMER' } });
  } catch (err) {
    res.status(401).json({ success: false, message: err.message });
  }
});

// Admin login (separate endpoint)
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    const { admin, token } = await loginAdmin(email, password);
    res.json({ success: true, token, user: { id: admin.adminId, name: admin.name, email: admin.email, role: 'ADMIN' } });
  } catch (err) {
    res.status(401).json({ success: false, message: err.message });
  }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email, role } = req.body;
    const result = await forgotPassword(email, role || 'CUSTOMER');
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword, role } = req.body;
    const result = await resetPassword(email, otp, newPassword, role || 'CUSTOMER');
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Get current user
router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: req.user, role: req.role });
});

module.exports = router;

// One-time admin registration helper (protect this route in production)
router.post('/register-admin', async (req, res) => {
  try {
    const Admin = require('../models/Admin');
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'All fields required' });
    const existing = await Admin.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });
    const admin = await Admin.create({ name, email, password });
    res.status(201).json({ success: true, message: 'Admin created', adminId: admin.adminId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
