const mongoose = require('mongoose');

const TransactionLogSchema = new mongoose.Schema({
  type: { type: String, enum: ['mint', 'burn', 'transfer'], required: true },
  mint: { type: String, required: true },
  from: { type: String },
  to: { type: String },
  amount: { type: String, required: true },
  decimals: { type: Number, required: true },
  txSignature: { type: String },
  timestamp: { type: Date, default: Date.now },
  network: { type: String, enum: ['devnet', 'testnet', 'mainnet-beta'], default: 'devnet' },
  meta: { type: Object },
});

// Create compound index for faster queries
TransactionLogSchema.index({ mint: 1, network: 1, timestamp: -1 });

module.exports = mongoose.model('TransactionLog', TransactionLogSchema); 