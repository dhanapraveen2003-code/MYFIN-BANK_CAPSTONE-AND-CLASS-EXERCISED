const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  loanId: { type: String, unique: true },
  accountNumber: { type: String, required: true, ref: 'Account' },
  loanAmount: { type: Number, required: true },
  interestRate: { type: Number, required: true },
  tenureMonths: { type: Number, required: true },
  emiAmount: { type: Number },
  remainingBalance: { type: Number },
  purpose: { type: String },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'CLOSED'],
    default: 'PENDING'
  },
  startDate: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

loanSchema.pre('save', async function (next) {
  if (!this.loanId) {
    const count = await mongoose.model('Loan').countDocuments();
    this.loanId = 'MYFIN-LN-' + String(count + 1).padStart(4, '0');
  }
  if (this.loanAmount && this.interestRate && this.tenureMonths && !this.emiAmount) {
    const r = this.interestRate / 12 / 100;
    const n = this.tenureMonths;
    const p = this.loanAmount;
    this.emiAmount = Math.round((p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
    this.remainingBalance = this.loanAmount;
  }
  next();
});

module.exports = mongoose.model('Loan', loanSchema);
