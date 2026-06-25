const mongoose = require('mongoose');

const SMSHistorySchema = new mongoose.Schema({
  to: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Sent', 'Failed', 'Pending'],
    default: 'Pending'
  },
  error: {
    type: String,
    default: ''
  },
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    index: true
  },
  deliveryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Delivery',
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('SMSHistory', SMSHistorySchema);
