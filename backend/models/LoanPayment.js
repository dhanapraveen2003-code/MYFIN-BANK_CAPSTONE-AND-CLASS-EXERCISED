const mongoose = require('mongoose');

const loanPaymentSchema = new mongoose.Schema({
  paymentId: { type: String, unique: true },
  loanId: { type: String, required: true, ref: 'Loan' },
  emiNumber: { type: Number, required: true },
  amount: { type: Number, required: true },
  paymentDate: { type: Date },
  referenceId: { type: String },
  status: { type: String, enum: ['PENDING', 'PAID'], default: 'PENDING' }
});

loanPaymentSchema.pre('save', async function (next) {
  if (!this.paymentId) {
    const count = await mongoose.model('LoanPayment').countDocuments();
    this.paymentId = 'MYFIN-PAY-' + String(count + 1).padStart(4, '0');
  }
  next();
});

module.exports = mongoose.model('LoanPayment', loanPaymentSchema);
