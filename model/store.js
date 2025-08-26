// models/storeModel.js
const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true },
  businessName: { type: String, required: true },
  address: String,
  phone: String,
  logoUrl: String,
  website: String,
  description: String,
  type: { type: String },
  rating: { type: Number, default: 0 },
  openTime: { type: String },
  closeTime: { type: String },
  supportDelivery: { type: Boolean, default: false },
  sameDayDelivery: { type: Boolean, default: false },
  verified: { type: Boolean, default: false },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Store', storeSchema);
