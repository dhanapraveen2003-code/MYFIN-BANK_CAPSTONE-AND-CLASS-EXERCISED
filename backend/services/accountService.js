const Account = require('../models/Account');

const getAccountByCustomerId = async (customerId) => Account.findOne({ customerId, status: { $in: ['ACTIVE', 'AT_RISK'] } });
const getAllAccountsByCustomerId = async (customerId) => Account.find({ customerId });
const getAllAccounts = async () => Account.find({});
const getAccountByNumber = async (accountNumber) => Account.findOne({ accountNumber });
const updateAccount = async (accountNumber, updates) => Account.findOneAndUpdate({ accountNumber }, updates, { new: true });

const approveAccount = async (accountNumber) => Account.findOneAndUpdate({ accountNumber }, { status: 'ACTIVE' }, { new: true });
const rejectAccount = async (accountNumber) => Account.findOneAndUpdate({ accountNumber }, { status: 'REJECTED' }, { new: true });

const checkAndSetAtRisk = async (accountNumber) => {
  const account = await Account.findOne({ accountNumber });
  if (!account || account.status !== 'ACTIVE') return;
  if (account.balance <= 0 && account.status === 'ACTIVE') {
    account.status = 'AT_RISK';
    account.atRiskSince = new Date();
    await account.save();
  }
  return account;
};

module.exports = { getAccountByCustomerId, getAllAccountsByCustomerId, getAllAccounts, getAccountByNumber, updateAccount, approveAccount, rejectAccount, checkAndSetAtRisk };
