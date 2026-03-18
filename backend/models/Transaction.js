const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  txnId: { type: String, unique: true },
  accountNumber: { type: String, required: true, ref: 'Account' },
  referenceId: { type: String },
  transactionCategory: {
    type: String,
    enum: ['DEPOSIT', 'WITHDRAW', 'TRANSFER', 'FD_INVESTMENT', 'RD_INSTALLMENT', 'LOAN_EMI'],
    required: true
  },
  type: { type: String, enum: ['DEBIT', 'CREDIT'], required: true },
  amount: { type: Number, required: true, min: 1 },
  balanceAfterTxn: { type: Number },
  description: { type: String },
  date: { type: Date, default: Date.now }
});

transactionSchema.pre('save', async function (next) {
  if (!this.txnId) {
    const count = await mongoose.model('Transaction').countDocuments();
    this.txnId = 'MYFIN-TXN-' + String(count + 1).padStart(6, '0');
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
