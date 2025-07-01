const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  wallet: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  profile: { type: Object },
});

module.exports = mongoose.model('User', UserSchema); 