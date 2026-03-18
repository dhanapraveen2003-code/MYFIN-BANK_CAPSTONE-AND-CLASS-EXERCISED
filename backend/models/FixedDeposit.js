const mongoose = require('mongoose');

const fixedDepositSchema = new mongoose.Schema({
  fdId: { type: String, unique: true },
  accountNumber: { type: String, required: true, ref: 'Account' },
  amount: { type: Number, required: true },
  interestRate: { type: Number, required: true },
  tenureMonths: { type: Number, required: true },
  maturityAmount: { type: Number },
  startDate: { type: Date, default: Date.now },
  maturityDate: { type: Date },
  status: { type: String, enum: ['ACTIVE', 'MATURED', 'BROKEN'], default: 'ACTIVE' }
});

fixedDepositSchema.pre('save', async function (next) {
  if (!this.fdId) {
    const count = await mongoose.model('FixedDeposit').countDocuments();
    this.fdId = 'MYFIN-FD-' + String(count + 1).padStart(4, '0');
  }
  if (!this.maturityAmount) {
    const r = this.interestRate / 100;
    this.maturityAmount = Math.round(this.amount * Math.pow(1 + r / 12, this.tenureMonths));
  }
  if (!this.maturityDate) {
    const d = new Date(this.startDate || Date.now());
    d.setMonth(d.getMonth() + this.tenureMonths);
    this.maturityDate = d;
  }
  next();
});

module.exports = mongoose.model('FixedDeposit', fixedDepositSchema);
