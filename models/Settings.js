const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  // Profile Settings
  dealershipName: {
    type: String,
    default: 'Harley-Davidson NYC'
  },
  dealershipLocation: {
    type: String,
    default: '370 10th Ave, New York'
  },
  dealershipPhone: {
    type: String,
    default: ''
  },
  dealershipEmail: {
    type: String,
    default: ''
  },

  // Hours of Operation
  hours: [{
    days: String,
    hours: String,
    status: { type: String, enum: ['open', 'closed'], default: 'open' }
  }],

  // Notification Settings
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    pushNotifications: { type: Boolean, default: true },
    newLeads: { type: Boolean, default: true },
    followUpReminders: { type: Boolean, default: true },
    testRideAlerts: { type: Boolean, default: true },
    systemNotifications: { type: Boolean, default: true }
  },


  // Integration Settings
  integrations: {
    googleCalendar: { 
      enabled: { type: Boolean, default: true },
      calendarId: { type: String, default: 'primary' }
    },
    whatsapp: { 
      enabled: { type: Boolean, default: false },
      apiKey: { type: String, default: '' },
      phoneNumberId: { type: String, default: '' }
    },
    sms: { 
      enabled: { type: Boolean, default: false },
      accountSid: { type: String, default: '' },
      authToken: { type: String, default: '' },
      phoneNumber: { type: String, default: '' }
    }
  },

  // CRM Configuration Settings
  crmConfig: {
    defaultLeadStatus: { type: String, default: 'New' },
    autoAssignLeads: { type: Boolean, default: false },
    followUpReminderDays: { type: Number, default: 3 },
    leadAssignmentMethod: { type: String, enum: ['Round Robin', 'Manual', 'Load Balanced'], default: 'Round Robin' },
    pipelineStages: { 
      type: [String], 
      default: ['New', 'Contacted', 'Interested', 'Test Ride Booked', 'Negotiation', 'Sold', 'Delivered', 'Lost'] 
    }
  },

  // Theme Settings
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light'
  },

  // Security Settings
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  sessionTimeout: {
    type: Number,
    default: 3600 // 1 hour in seconds
  },

  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp before saving
SettingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (typeof next === 'function') {
    next();
  }
});

module.exports = mongoose.model('Settings', SettingsSchema);
