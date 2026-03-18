const nodemailer = require('nodemailer');

const getTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: { rejectUnauthorized: false }
  });
};

const sendBalanceZeroAlert = async (customerName, accountNumber) => {
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: 'Alert: Customer Balance Reached Zero',
      html: `<p>Account <b>${accountNumber}</b> (${customerName}) has reached zero balance.</p>`
    });
  } catch (err) {
    console.error('Balance alert email error:', err.message);
  }
};

const sendOtpEmail = async (to, name, otp) => {
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"MyFin Bank" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'MyFin Bank - Password Reset OTP',
      html: `
        <div style="font-family:Arial;padding:20px;max-width:480px;margin:auto;">
          <h2 style="color:#1e4db7;">🏦 MyFin Bank</h2>
          <p>Hi <b>${name}</b>,</p>
          <p>Your OTP for password reset is:</p>
          <div style="background:#f4f6fb;padding:20px;text-align:center;border-radius:8px;margin:20px 0;">
            <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1e4db7;">${otp}</span>
          </div>
          <p>This OTP is valid for <b>10 minutes</b>. Do not share it with anyone.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
          <p style="color:#999;font-size:12px;">If you did not request a password reset, please ignore this email.</p>
        </div>`
    });
  } catch (err) {
    console.error('OTP email error:', err.message);
    throw err;
  }
};

const sendAtRiskAlert = async (customerEmail, accountNumber) => {
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: customerEmail,
      subject: 'MyFin Bank - Account At Risk',
      html: `<p>Your account <b>${accountNumber}</b> balance has reached zero. Please deposit funds within 24 hours to avoid deactivation.</p>`
    });
  } catch (err) {
    console.error('At-risk email error:', err.message);
  }
};

module.exports = { sendBalanceZeroAlert, sendOtpEmail, sendAtRiskAlert };
