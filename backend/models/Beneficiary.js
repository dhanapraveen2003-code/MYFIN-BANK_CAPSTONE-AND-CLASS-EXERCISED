const mongoose = require('mongoose');

const beneficiarySchema = new mongoose.Schema({
  beneficiaryId: { type: String, unique: true },
  customerId: { type: String, required: true, ref: 'Customer' },
  beneficiaryName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  branch: { type: String },
  status: { type: String, enum: ['PENDING', 'ACTIVE'], default: 'PENDING' },
  createdAt: { type: Date, default: Date.now }
});

beneficiarySchema.pre('save', async function (next) {
  if (!this.beneficiaryId) {
    const count = await mongoose.model('Beneficiary').countDocuments();
    this.beneficiaryId = 'MYFIN-BEN-' + String(count + 1).padStart(4, '0');
  }
  next();
});

module.exports = mongoose.model('Beneficiary', beneficiarySchema);
