const mongoose = require('mongoose');

const passwordResetTokenSchema = new mongoose.Schema({
  tokenId: { type: String, unique: true },
  userId: { type: String, required: true },         // customerId or adminId
  userRole: { type: String, enum: ['CUSTOMER', 'ADMIN'], default: 'CUSTOMER' },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

passwordResetTokenSchema.pre('save', async function (next) {
  if (!this.tokenId) {
    const count = await mongoose.model('PasswordResetToken').countDocuments();
    this.tokenId = 'MYFIN-OTP-' + String(count + 1).padStart(4, '0');
  }
  next();
});

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
