const mongoose = require('mongoose');

const IntegrationLogSchema = new mongoose.Schema({
  integrationType: {
    type: String,
    enum: ['google_calendar', 'whatsapp', 'sms', 'call'],
    required: true
  },
  action: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'pending'
  },
  request: {
    type: mongoose.Schema.Types.Mixed
  },
  response: {
    type: mongoose.Schema.Types.Mixed
  },
  error: {
    type: String
  },
  relatedEntity: {
    type: {
      type: String,
      enum: ['lead', 'task', 'test_ride', 'delivery']
    },
    entityId: mongoose.Schema.Types.ObjectId
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('IntegrationLog', IntegrationLogSchema);
