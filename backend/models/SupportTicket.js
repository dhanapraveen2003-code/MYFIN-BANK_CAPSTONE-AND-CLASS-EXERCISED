const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  ticketId: { type: String, unique: true },
  customerId: { type: String, required: true, ref: 'Customer' },
  subject: { type: String, required: true },
  status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED'], default: 'OPEN' },
  createdAt: { type: Date, default: Date.now }
});

supportTicketSchema.pre('save', async function (next) {
  if (!this.ticketId) {
    const count = await mongoose.model('SupportTicket').countDocuments();
    this.ticketId = 'MYFIN-TKT-' + String(count + 1).padStart(4, '0');
  }
  next();
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
