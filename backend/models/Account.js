const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  accountNumber: { type: String, unique: true },
  customerId: { type: String, required: true, ref: 'Customer' },
  accountType: { type: String, enum: ['SAVINGS', 'CURRENT'], required: true },
  balance: { type: Number, default: 0 },
  overdraftLimit: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['REQUESTED', 'ACTIVE', 'AT_RISK', 'DEACTIVATED', 'REJECTED'],
    default: 'REQUESTED'
  },
  deactivationType: { type: String, enum: ['AUTO', 'MANUAL', null], default: null },
  atRiskSince: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

accountSchema.pre('save', async function (next) {
  if (!this.accountNumber) {
    const count = await mongoose.model('Account').countDocuments();
    const prefix = this.accountType === 'SAVINGS' ? 'MYFIN-SACC-' : 'MYFIN-CACC-';
    this.accountNumber = prefix + String(count + 1).padStart(4, '0');
  }
  next();
});

module.exports = mongoose.model('Account', accountSchema);
