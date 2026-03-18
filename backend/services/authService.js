const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const Admin = require('../models/Admin');
const PasswordResetToken = require('../models/PasswordResetToken');

const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET || 'myfin_secret', { expiresIn: process.env.JWT_EXPIRE || '7d' });

const loginCustomer = async (email, password) => {
  const customer = await Customer.findOne({ email });
  if (!customer) throw new Error('Invalid credentials');
  if (customer.status === 'PENDING_VERIFICATION') throw new Error('Account pending KYC verification. Please wait for admin approval.');
  if (customer.status === 'REJECTED') throw new Error('Account was rejected. Contact support.');
  const match = await customer.comparePassword(password);
  if (!match) throw new Error('Invalid credentials');
  return { customer, token: generateToken(customer.customerId, 'CUSTOMER') };
};

const loginAdmin = async (email, password) => {
  const admin = await Admin.findOne({ email });
  if (!admin) throw new Error('Invalid credentials');
  const match = await admin.comparePassword(password);
  if (!match) throw new Error('Invalid credentials');
  return { admin, token: generateToken(admin.adminId, 'ADMIN') };
};

const forgotPassword = async (email, role = 'CUSTOMER') => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  if (role === 'ADMIN') {
    const admin = await Admin.findOne({ email });
    if (!admin) throw new Error('No admin account found with this email');
    await PasswordResetToken.create({ userId: admin.adminId, userRole: 'ADMIN', otp, expiresAt });
    const { sendOtpEmail } = require('../utils/email');
    await sendOtpEmail(email, admin.name, otp);
  } else {
    const customer = await Customer.findOne({ email });
    if (!customer) throw new Error('No account found with this email');
    await PasswordResetToken.create({ userId: customer.customerId, userRole: 'CUSTOMER', otp, expiresAt });
    const { sendOtpEmail } = require('../utils/email');
    await sendOtpEmail(email, customer.name, otp);
  }

  return { message: 'OTP sent to your email' };
};

const resetPassword = async (email, otp, newPassword, role = 'CUSTOMER') => {
  if (role === 'ADMIN') {
    const admin = await Admin.findOne({ email });
    if (!admin) throw new Error('Invalid request');
    const record = await PasswordResetToken.findOne({ userId: admin.adminId, userRole: 'ADMIN', otp, used: false });
    if (!record) throw new Error('Invalid OTP');
    if (record.expiresAt < new Date()) throw new Error('OTP has expired');
    admin.password = newPassword;
    await admin.save();
    record.used = true;
    await record.save();
  } else {
    const customer = await Customer.findOne({ email });
    if (!customer) throw new Error('Invalid request');
    const record = await PasswordResetToken.findOne({ userId: customer.customerId, userRole: 'CUSTOMER', otp, used: false });
    if (!record) throw new Error('Invalid OTP');
    if (record.expiresAt < new Date()) throw new Error('OTP has expired');
    customer.password = newPassword;
    await customer.save();
    record.used = true;
    await record.save();
  }
  return { message: 'Password reset successful' };
};

module.exports = { loginCustomer, loginAdmin, forgotPassword, resetPassword };