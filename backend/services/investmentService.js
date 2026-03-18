const FixedDeposit = require('../models/FixedDeposit');
const RecurringDeposit = require('../models/RecurringDeposit');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

const createFD = async ({ accountNumber, amount, interestRate, tenureMonths }) => {
  const account = await Account.findOne({ accountNumber });
  if (!account || account.status !== 'ACTIVE') throw new Error('Account not found or inactive');
  if (account.balance < amount) throw new Error('Insufficient balance');

  account.balance -= Number(amount);
  await account.save();

  const fd = await FixedDeposit.create({ accountNumber, amount, interestRate: interestRate || 7, tenureMonths });

  await Transaction.create({
    accountNumber,
    transactionCategory: 'FD_INVESTMENT',
    type: 'DEBIT',
    amount,
    balanceAfterTxn: account.balance,
    description: `Fixed Deposit Created - ${fd.fdId}`
  });

  return { fd, newBalance: account.balance };
};

const createRD = async ({ accountNumber, monthlyAmount, interestRate, tenureMonths }) => {
  const account = await Account.findOne({ accountNumber });
  if (!account || account.status !== 'ACTIVE') throw new Error('Account not found or inactive');
  if (account.balance < monthlyAmount) throw new Error('Insufficient balance for first installment');

  account.balance -= Number(monthlyAmount);
  await account.save();

  const rd = await RecurringDeposit.create({ accountNumber, monthlyAmount, interestRate: interestRate || 6, tenureMonths, paidInstallments: 1 });

  await Transaction.create({
    accountNumber,
    transactionCategory: 'RD_INSTALLMENT',
    type: 'DEBIT',
    amount: monthlyAmount,
    balanceAfterTxn: account.balance,
    description: `RD Installment #1 - ${rd.rdId}`
  });

  return { rd, newBalance: account.balance };
};

const payRDInstallment = async (rdId, accountNumber) => {
  const rd = await RecurringDeposit.findOne({ rdId });
  if (!rd || rd.status !== 'ACTIVE') throw new Error('RD not found or not active');
  const account = await Account.findOne({ accountNumber });
  if (!account || account.balance < rd.monthlyAmount) throw new Error('Insufficient balance');

  account.balance -= rd.monthlyAmount;
  await account.save();

  rd.paidInstallments += 1;
  if (rd.paidInstallments >= rd.tenureMonths) rd.status = 'MATURED';
  await rd.save();

  await Transaction.create({
    accountNumber,
    transactionCategory: 'RD_INSTALLMENT',
    type: 'DEBIT',
    amount: rd.monthlyAmount,
    balanceAfterTxn: account.balance,
    description: `RD Installment #${rd.paidInstallments} - ${rdId}`
  });

  return { rd, newBalance: account.balance };
};

const getFDsByAccount = async (accountNumber) => FixedDeposit.find({ accountNumber });
const getRDsByAccount = async (accountNumber) => RecurringDeposit.find({ accountNumber });
const getAllFDs = async () => FixedDeposit.find({});
const getAllRDs = async () => RecurringDeposit.find({});

module.exports = { createFD, createRD, payRDInstallment, getFDsByAccount, getRDsByAccount, getAllFDs, getAllRDs };
