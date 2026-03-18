const Customer = require('../models/Customer');
const Account = require('../models/Account');

const registerCustomer = async ({ name, email, password, phone, address, govIdType, govIdNumber, govIdDocumentPath }) => {
  const existing = await Customer.findOne({ email });
  if (existing) throw new Error('Email already registered');
  const customer = await Customer.create({ name, email, password, phone, address, govIdType, govIdNumber, govIdDocumentPath });
  // Create both account types as REQUESTED
  await Account.create({ customerId: customer.customerId, accountType: 'SAVINGS' });
  return customer;
};

const findByEmail = async (email) => Customer.findOne({ email });
const findById = async (customerId) => Customer.findOne({ customerId });
const getAllCustomers = async () => Customer.find({}).select('-password');
const updateCustomer = async (customerId, updates) => Customer.findOneAndUpdate({ customerId }, updates, { new: true }).select('-password');
const toggleStatus = async (customerId, status) => Customer.findOneAndUpdate({ customerId }, { status }, { new: true });

module.exports = { registerCustomer, findByEmail, findById, getAllCustomers, updateCustomer, toggleStatus };
