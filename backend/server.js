require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const fs = require('fs');

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/customers',    require('./routes/customer'));
app.use('/api/accounts',     require('./routes/account'));
app.use('/api/transactions', require('./routes/transaction'));
app.use('/api/loans',        require('./routes/loan'));
app.use('/api/investments',  require('./routes/investment'));
app.use('/api/beneficiaries',require('./routes/beneficiary'));
app.use('/api/support',      require('./routes/support'));
app.use('/api/admin',        require('./routes/admin'));

// MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/myfinbank';
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB error:', err));

// Cron: every hour check AT_RISK accounts older than 24h → AUTO deactivate
setInterval(async () => {
  try {
    const Account = require('./models/Account');
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await Account.updateMany(
      { status: 'AT_RISK', atRiskSince: { $lt: cutoff } },
      { status: 'DEACTIVATED', deactivationType: 'AUTO' }
    );
  } catch (e) { console.error('Cron error:', e.message); }
}, 60 * 60 * 1000);

// Socket.io — scoped per customerId room
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] } });

io.on('connection', (socket) => {
  socket.on('joinRoom', (customerId) => socket.join(customerId));

  socket.on('sendMessage', (data) => {
    // data: { ticketId, customerId, message, senderType }
    io.to(data.customerId).emit('receiveMessage', data);
  });

  socket.on('disconnect', () => {});
});

app.set('io', io);

app.get('/', (req, res) => res.send('MyFin Bank Backend Running — DB Handbook Compliant'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
