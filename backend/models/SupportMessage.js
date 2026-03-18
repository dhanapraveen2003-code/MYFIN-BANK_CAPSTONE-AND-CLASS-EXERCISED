const mongoose = require('mongoose');

const supportMessageSchema = new mongoose.Schema({
  messageId: { type: String, unique: true },
  ticketId: { type: String, required: true, ref: 'SupportTicket' },
  senderType: { type: String, enum: ['CUSTOMER', 'ADMIN'], required: true },
  senderId: { type: String, required: true },
  message: { type: String, required: true, trim: true },
  timestamp: { type: Date, default: Date.now }
});

supportMessageSchema.pre('save', async function (next) {
  if (!this.messageId) {
    const count = await mongoose.model('SupportMessage').countDocuments();
    this.messageId = 'MYFIN-MSG-' + String(count + 1).padStart(4, '0');
  }
  next();
});

module.exports = mongoose.model('SupportMessage', supportMessageSchema);
