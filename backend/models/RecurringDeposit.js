const mongoose = require('mongoose');

const recurringDepositSchema = new mongoose.Schema({
  rdId: { type: String, unique: true },
  accountNumber: { type: String, required: true, ref: 'Account' },
  monthlyAmount: { type: Number, required: true },
  tenureMonths: { type: Number, required: true },
  interestRate: { type: Number, required: true },
  startDate: { type: Date, default: Date.now },
  maturityDate: { type: Date },
  paidInstallments: { type: Number, default: 0 },
  status: { type: String, enum: ['ACTIVE', 'MATURED', 'BROKEN'], default: 'ACTIVE' }
});

recurringDepositSchema.pre('save', async function (next) {
  if (!this.rdId) {
    const count = await mongoose.model('RecurringDeposit').countDocuments();
    this.rdId = 'MYFIN-RD-' + String(count + 1).padStart(4, '0');
  }
  if (!this.maturityDate) {
    const d = new Date(this.startDate || Date.now());
    d.setMonth(d.getMonth() + this.tenureMonths);
    this.maturityDate = d;
  }
  next();
});

module.exports = mongoose.model('RecurringDeposit', recurringDepositSchema);
