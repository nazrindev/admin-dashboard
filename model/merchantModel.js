const mongoose = require('mongoose');

const merchantSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { collection: 'users' });

const Merchant = mongoose.model('Merchant', merchantSchema);

module.exports = Merchant;