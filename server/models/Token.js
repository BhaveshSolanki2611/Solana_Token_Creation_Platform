const mongoose = require('mongoose');

const TokenSchema = new mongoose.Schema({
  mint: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  symbol: { type: String, required: true },
  decimals: { type: Number, required: true },
  supply: { type: String, required: true },
  owner: { type: String, required: true },
  mintAuthority: { type: String },
  freezeAuthority: { type: String },
  description: { type: String },
  image: { type: String },
  website: { type: String },
  twitter: { type: String },
  telegram: { type: String },
  discord: { type: String },
  network: { type: String, default: 'devnet' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Token', TokenSchema); 