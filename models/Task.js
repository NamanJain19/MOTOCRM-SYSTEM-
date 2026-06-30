const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: false,
    index: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  dueDate: {
    type: Date,
    required: true,
    index: true
  },
  priority: {
    type: String,
    enum: ['URGENT', 'HIGH', 'NORMAL'],
    default: 'NORMAL'
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Missed'],
    default: 'Pending',
    index: true
  },
  completedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

TaskSchema.index({ status: 1, dueDate: 1 });

module.exports = mongoose.model('Task', TaskSchema);

