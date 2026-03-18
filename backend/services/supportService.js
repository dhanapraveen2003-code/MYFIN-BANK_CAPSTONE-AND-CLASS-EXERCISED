const SupportTicket = require('../models/SupportTicket');
const SupportMessage = require('../models/SupportMessage');

const createTicket = async ({ customerId, subject }) =>
  SupportTicket.create({ customerId, subject });

const getTicketsByCustomer = async (customerId) =>
  SupportTicket.find({ customerId }).sort({ createdAt: -1 });

const getAllTickets = async () =>
  SupportTicket.find({}).sort({ createdAt: -1 });

const updateTicketStatus = async (ticketId, status) =>
  SupportTicket.findOneAndUpdate({ ticketId }, { status }, { new: true });

const addMessage = async ({ ticketId, senderType, senderId, message }) => {
  const ticket = await SupportTicket.findOne({ ticketId });
  if (!ticket) throw new Error('Ticket not found');
  if (ticket.status === 'OPEN' && senderType === 'ADMIN') {
    await SupportTicket.findOneAndUpdate({ ticketId }, { status: 'IN_PROGRESS' });
  }
  return SupportMessage.create({ ticketId, senderType, senderId, message });
};

const getMessagesByTicket = async (ticketId) =>
  SupportMessage.find({ ticketId }).sort({ timestamp: 1 });

module.exports = { createTicket, getTicketsByCustomer, getAllTickets, updateTicketStatus, addMessage, getMessagesByTicket };
