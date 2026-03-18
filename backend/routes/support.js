const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { createTicket, getTicketsByCustomer, getAllTickets, updateTicketStatus, addMessage, getMessagesByTicket } = require('../services/supportService');

// Customer: create ticket
router.post('/tickets', protect, async (req, res) => {
  try {
    const ticket = await createTicket({ customerId: req.user.customerId, subject: req.body.subject });
    res.status(201).json({ success: true, ticket });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Customer: own tickets
router.get('/tickets/my', protect, async (req, res) => {
  try {
    const tickets = await getTicketsByCustomer(req.user.customerId);
    res.json({ success: true, tickets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: all tickets
router.get('/tickets', protect, adminOnly, async (req, res) => {
  try {
    const tickets = await getAllTickets();
    res.json({ success: true, tickets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: update ticket status
router.patch('/tickets/:ticketId/status', protect, adminOnly, async (req, res) => {
  try {
    const ticket = await updateTicketStatus(req.params.ticketId, req.body.status);
    res.json({ success: true, ticket });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Customer or Admin: send message in a ticket
router.post('/tickets/:ticketId/messages', protect, async (req, res) => {
  try {
    const senderType = req.role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER';
    const senderId = req.role === 'ADMIN' ? req.user.adminId : req.user.customerId;
    const msg = await addMessage({ ticketId: req.params.ticketId, senderType, senderId, message: req.body.message });
    res.status(201).json({ success: true, message: msg });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Customer or Admin: get messages for a ticket
router.get('/tickets/:ticketId/messages', protect, async (req, res) => {
  try {
    const messages = await getMessagesByTicket(req.params.ticketId);
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
