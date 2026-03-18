const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const { sendBalanceZeroAlert } = require('../utils/email');

const createTransaction = async (data) => Transaction.create(data);

const getTransactionsByAccount = async (accountNumber) =>
  Transaction.find({ accountNumber }).sort({ date: -1 }).limit(100);

const getAllTransactions = async () =>
  Transaction.find({}).sort({ date: -1 }).limit(200);

const deposit = async (accountNumber, amount) => {
  const account = await Account.findOne({ accountNumber });
  if (!account || account.status !== 'ACTIVE') throw new Error('Account not found or inactive');
  account.balance += Number(amount);
  await account.save();
  const txn = await Transaction.create({
    accountNumber,
    transactionCategory: 'DEPOSIT',
    type: 'CREDIT',
    amount,
    balanceAfterTxn: account.balance,
    description: 'Cash Deposit'
  });
  return { txn, newBalance: account.balance };
};

const withdraw = async (accountNumber, amount) => {
  const account = await Account.findOne({ accountNumber });
  if (!account || account.status !== 'ACTIVE') throw new Error('Account not found or inactive');
  if (account.balance < amount) throw new Error('Insufficient balance');
  account.balance -= Number(amount);
  await account.save();
  if (account.balance === 0) {
    sendBalanceZeroAlert('Customer', accountNumber);
    account.status = 'AT_RISK';
    account.atRiskSince = new Date();
    await account.save();
  }
  const txn = await Transaction.create({
    accountNumber,
    transactionCategory: 'WITHDRAW',
    type: 'DEBIT',
    amount,
    balanceAfterTxn: account.balance,
    description: 'Cash Withdrawal'
  });
  return { txn, newBalance: account.balance };
};

const transfer = async (fromAccountNumber, toAccountNumber, amount, description) => {
  const fromAcc = await Account.findOne({ accountNumber: fromAccountNumber });
  const toAcc = await Account.findOne({ accountNumber: toAccountNumber });
  if (!fromAcc || fromAcc.status !== 'ACTIVE') throw new Error('Your account is inactive');
  if (!toAcc || toAcc.status !== 'ACTIVE') throw new Error('Recipient account not found or inactive');
  if (fromAccountNumber === toAccountNumber) throw new Error('Cannot transfer to same account');
  if (fromAcc.balance < amount) throw new Error('Insufficient balance');

  fromAcc.balance -= Number(amount);
  toAcc.balance += Number(amount);
  await fromAcc.save();
  await toAcc.save();

  // Shared referenceId for both sides
  const refCount = await Transaction.countDocuments();
  const referenceId = 'REF' + String(refCount + 1).padStart(6, '0');

  const debitTxn = await Transaction.create({
    accountNumber: fromAccountNumber,
    referenceId,
    transactionCategory: 'TRANSFER',
    type: 'DEBIT',
    amount,
    balanceAfterTxn: fromAcc.balance,
    description: description || `Transfer to ${toAccountNumber}`
  });

  await Transaction.create({
    accountNumber: toAccountNumber,
    referenceId,
    transactionCategory: 'TRANSFER',
    type: 'CREDIT',
    amount,
    balanceAfterTxn: toAcc.balance,
    description: `Transfer from ${fromAccountNumber}`
  });

  if (fromAcc.balance === 0) {
    sendBalanceZeroAlert('Customer', fromAccountNumber);
    fromAcc.status = 'AT_RISK';
    fromAcc.atRiskSince = new Date();
    await fromAcc.save();
  }

  return { txn: debitTxn, newBalance: fromAcc.balance };
};

module.exports = { createTransaction, getTransactionsByAccount, getAllTransactions, deposit, withdraw, transfer };
