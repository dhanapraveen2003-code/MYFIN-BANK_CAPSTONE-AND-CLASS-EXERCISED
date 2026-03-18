const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  adminId: { type: String, unique: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, default: 'ADMIN' },
  createdAt: { type: Date, default: Date.now }
});

adminSchema.pre('save', async function (next) {
  if (!this.adminId) {
    const count = await mongoose.model('Admin').countDocuments();
    this.adminId = 'MYFIN-ADMIN-' + String(count + 1).padStart(4, '0');
  }
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

adminSchema.methods.comparePassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);
