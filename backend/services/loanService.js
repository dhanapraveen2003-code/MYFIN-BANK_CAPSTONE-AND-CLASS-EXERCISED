const Loan = require('../models/Loan');
const LoanPayment = require('../models/LoanPayment');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

// Auto interest rate based on loan amount (admin can override on approval)
const getDefaultInterestRate = (amount) => {
  if (amount <= 50000)   return 14.0;
  if (amount <= 200000)  return 12.5;
  if (amount <= 500000)  return 11.0;
  if (amount <= 1000000) return 10.0;
  return 9.0;
};

const applyLoan = async ({ accountNumber, loanAmount, tenureMonths, purpose }) => {
  if (!loanAmount || loanAmount <= 0) throw new Error('Invalid loan amount');
  if (!tenureMonths || tenureMonths <= 0) throw new Error('Invalid tenure');
  const pending = await Loan.findOne({ accountNumber, status: 'PENDING' });
  if (pending) throw new Error('You already have a pending loan application');
  const active = await Loan.findOne({ accountNumber, status: 'ACTIVE' });
  if (active) throw new Error('You already have an active loan. Close it before applying for a new one');
  const suggestedRate = getDefaultInterestRate(loanAmount);
  return Loan.create({ accountNumber, loanAmount, interestRate: suggestedRate, tenureMonths, purpose });
};

const getLoansByAccount = async (accountNumber) => Loan.find({ accountNumber }).sort({ createdAt: -1 });
const getAllLoans = async () => Loan.find({}).sort({ createdAt: -1 });
const getLoanById = async (loanId) => Loan.findOne({ loanId });

const approveLoan = async (loanId, interestRate) => {
  const loan = await Loan.findOne({ loanId });
  if (!loan || loan.status !== 'PENDING') throw new Error('Loan not found or already processed');
  if (!interestRate || interestRate <= 0) throw new Error('Admin must set a valid interest rate');

  // Admin sets final interest rate, recalculate EMI
  loan.interestRate = parseFloat(interestRate);
  const r = loan.interestRate / 12 / 100;
  const n = loan.tenureMonths;
  const p = loan.loanAmount;
  loan.emiAmount = Math.round((p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
  loan.remainingBalance = p;
  loan.status = 'ACTIVE';
  loan.startDate = new Date();
  await loan.save();

  // Credit the account
  const account = await Account.findOne({ accountNumber: loan.accountNumber });
  account.balance += loan.loanAmount;
  await account.save();

  await Transaction.create({
    accountNumber: loan.accountNumber,
    transactionCategory: 'LOAN_EMI',
    type: 'CREDIT',
    amount: loan.loanAmount,
    balanceAfterTxn: account.balance,
    description: `Loan Disbursed - ${loan.loanId}`
  });

  // Pre-generate all EMI payment records as PENDING
  for (let i = 1; i <= loan.tenureMonths; i++) {
    await LoanPayment.create({ loanId: loan.loanId, emiNumber: i, amount: loan.emiAmount, status: 'PENDING' });
  }
  return loan;
};

const rejectLoan = async (loanId) => {
  const loan = await Loan.findOne({ loanId });
  if (!loan || loan.status !== 'PENDING') throw new Error('Loan not found or already processed');
  loan.status = 'REJECTED';
  await loan.save();
  return loan;
};

const payEmi = async (loanId, accountNumber) => {
  const loan = await Loan.findOne({ loanId });
  if (!loan || loan.status !== 'ACTIVE') throw new Error('Loan not found or not active');
  const nextEmi = await LoanPayment.findOne({ loanId, status: 'PENDING' }).sort({ emiNumber: 1 });
  if (!nextEmi) throw new Error('No pending EMIs');

  const account = await Account.findOne({ accountNumber });
  if (!account || account.balance < nextEmi.amount) throw new Error('Insufficient balance to pay EMI');

  account.balance -= nextEmi.amount;
  await account.save();

  const txn = await Transaction.create({
    accountNumber,
    transactionCategory: 'LOAN_EMI',
    type: 'DEBIT',
    amount: nextEmi.amount,
    balanceAfterTxn: account.balance,
    description: `EMI #${nextEmi.emiNumber} for ${loanId}`
  });

  nextEmi.status = 'PAID';
  nextEmi.paymentDate = new Date();
  nextEmi.referenceId = txn.txnId;
  await nextEmi.save();

  loan.remainingBalance -= nextEmi.amount;
  if (loan.remainingBalance <= 0) { loan.remainingBalance = 0; loan.status = 'CLOSED'; }
  await loan.save();

  const remaining = await LoanPayment.countDocuments({ loanId, status: 'PENDING' });
  return { emi: nextEmi, newBalance: account.balance, remainingEmis: remaining, loanClosed: loan.status === 'CLOSED' };
};

const getLoanPayments = async (loanId) => LoanPayment.find({ loanId }).sort({ emiNumber: 1 });

module.exports = { applyLoan, getLoansByAccount, getAllLoans, getLoanById, approveLoan, rejectLoan, payEmi, getLoanPayments, getDefaultInterestRate };
