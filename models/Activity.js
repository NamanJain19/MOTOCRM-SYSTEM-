const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['lead_added', 'test_ride', 'bike_sold', 'system', 'call_logged', 'delivery', 'sms_sent'],
    required: true
  },
  deliveryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Delivery'
  },
  customerName: {
    type: String
  },
  status: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('Activity', ActivitySchema);
