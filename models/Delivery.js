const mongoose = require('mongoose');

const DeliverySchema = new mongoose.Schema({
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: false,
    index: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerEmail: {
    type: String,
    trim: true,
    default: ''
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true
  },
  bikeModel: {
    type: String,
    required: true,
    trim: true
  },
  bikeColor: {
    type: String,
    trim: true,
    default: ''
  },
  deliveryDate: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Preparing', 'Ready for Delivery', 'Delivered', 'Cancelled'],
    default: 'Pending',
    index: true
  },
  rcStatus: {
    type: String,
    enum: ['Pending', 'Submitted', 'Approved', 'Received'],
    default: 'Pending'
  },
  insuranceStatus: {
    type: String,
    enum: ['Pending', 'Active', 'Expired'],
    default: 'Pending'
  },
  accessoriesChecklist: [
    {
      item: { type: String, required: true },
      checked: { type: Boolean, default: false }
    }
  ],
  customerSignature: {
    type: String,
    default: ''
  },
  deliveryNotes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

DeliverySchema.index({ status: 1, deliveryDate: 1 });

module.exports = mongoose.model('Delivery', DeliverySchema);
