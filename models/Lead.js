const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    default: ''
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  alternativeContact: {
    type: String,
    trim: true,
    default: ''
  },
  homeAddress: {
    type: String,
    trim: true,
    default: ''
  },
  bikeModel: {
    type: String,
    required: true,
    trim: true
  },
  preferredColor: {
    type: String,
    trim: true,
    default: ''
  },
  conditionPreference: {
    type: String,
    enum: ['New', 'Used'],
    default: 'New'
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  leadSource: {
    type: String,
    enum: ['WhatsApp', 'Facebook', 'Instagram', 'Website', 'Walk-in', 'Referral'],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['New', 'Contacted', 'Interested', 'Test Ride Booked', 'Negotiation', 'Sold', 'Delivered', 'Lost'],
    default: 'New',
    index: true
  },
  targetBudget: {
    type: Number,
    default: 0
  },
  financingInterest: {
    type: String,
    enum: ['Yes', 'No'],
    default: 'No'
  },
  preferredContactMethod: {
    type: String,
    enum: ['Email', 'Phone', 'SMS', 'WhatsApp'],
    default: 'Email'
  },
  followUpDate: {
    type: Date,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  closedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('Lead', LeadSchema);
