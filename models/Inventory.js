const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  bikeModel: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  stockQuantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  reservedBikes: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  soldBikes: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  lowStockThreshold: {
    type: Number,
    required: true,
    min: 0,
    default: 2
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Inventory', InventorySchema);
