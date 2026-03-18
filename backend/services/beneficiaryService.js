const Beneficiary = require('../models/Beneficiary');

const addBeneficiary = async ({ customerId, beneficiaryName, accountNumber, branch }) => {
  return Beneficiary.create({ customerId, beneficiaryName, accountNumber, branch });
};

const getBeneficiariesByCustomer = async (customerId) =>
  Beneficiary.find({ customerId, status: 'ACTIVE' });

const getAllPending = async () => Beneficiary.find({ status: 'PENDING' });

const approveBeneficiary = async (beneficiaryId) =>
  Beneficiary.findOneAndUpdate({ beneficiaryId }, { status: 'ACTIVE' }, { new: true });

const rejectBeneficiary = async (beneficiaryId) =>
  Beneficiary.findOneAndDelete({ beneficiaryId });

module.exports = { addBeneficiary, getBeneficiariesByCustomer, getAllPending, approveBeneficiary, rejectBeneficiary };
