const Task = require('../models/Task');
const Lead = require('../models/Lead');
const Activity = require('../models/Activity');
const TestRide = require('../models/TestRide');
const User = require('../models/User');
const Settings = require('../models/Settings');
const mongoose = require('mongoose');
const googleCalendarService = require('../services/googleCalendarService');
const whatsappService = require('../services/whatsappService');
const smsService = require('../services/smsService');
const callService = require('../services/callService');

// Render follow-ups list page
exports.getFollowUps = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    let todayQueue = [];
    let recentlyCompleted = [];
    let overdue = [];
    let completedCount = 0;
    let users = [];

    try {
      // 1. Fetch Today's Queue (Pending and due today)
      todayQueue = await Task.find({
        status: 'Pending',
        dueDate: { $gte: startOfToday, $lte: endOfToday }
      }).populate('lead').populate('assignedTo');

      // 2. Fetch Recently Completed tasks
      recentlyCompleted = await Task.find({
        status: 'Completed'
      }).populate('lead').populate('assignedTo').sort({ completedAt: -1 }).limit(5);

      // 3. Fetch Overdue tasks (Pending or Missed and due before today)
      overdue = await Task.find({
        status: { $in: ['Pending', 'Missed'] },
        dueDate: { $lt: startOfToday }
      }).populate('lead').populate('assignedTo');

      // Count tasks completed today
      completedCount = await Task.countDocuments({
        status: 'Completed',
        completedAt: { $gte: startOfToday, $lte: endOfToday }
      });

      // Fetch active users for reassignment dropdowns
      users = await User.find({ status: 'Active' }).sort({ name: 1 });
    } catch (dbErr) {
      console.warn('DB Task query failed:', dbErr.message);
    }

    // Default calculations for KPIs (e.g., target 0% if no tasks today)
    const totalTodayTasks = todayQueue.length + completedCount;
    const dailyTargetPercentage = totalTodayTasks > 0 ? Math.round((completedCount / totalTodayTasks) * 100) : 0;
    const followUpsLogged = completedCount; // true count from database

    res.render('follow-ups', {
      title: 'Follow Ups',
      todayQueue,
      recentlyCompleted,
      overdue,
      users,
      metrics: {
        dailyTarget: dailyTargetPercentage,
        followUpsLogged
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

// Fetch unified calendar events for Calendar View
exports.getEvents = async (req, res) => {
  try {
    const tasks = await Task.find().populate('lead').populate('assignedTo').lean();
    const testRides = await TestRide.find().populate('lead').lean();

    const events = [];

    // Format Tasks
    tasks.forEach(task => {
      let color = '#3b82f6'; // blue default
      if (task.status === 'Completed') {
        color = '#10b981'; // emerald
      } else if (task.status === 'Missed') {
        color = '#ef4444'; // rose/red
      } else if (task.priority === 'URGENT') {
        color = '#f43f5e'; // rose
      } else if (task.priority === 'HIGH') {
        color = '#f97316'; // orange
      }

      events.push({
        id: task._id,
        title: `[Follow-Up] ${task.title}`,
        start: task.dueDate,
        description: task.description || `Follow up with customer.`,
        extendedProps: {
          type: 'task',
          status: task.status,
          priority: task.priority,
          lead: task.lead || null,
          assignedTo: task.assignedTo || null
        },
        backgroundColor: color,
        borderColor: color,
        textColor: '#ffffff'
      });
    });

    // Format TestRides
    testRides.forEach(tr => {
      let color = '#8b5cf6'; // purple
      if (tr.status === 'Completed') {
        color = '#059669'; // dark green
      } else if (tr.status === 'Cancelled') {
        color = '#6b7280'; // gray
      }

      const leadName = tr.lead ? tr.lead.name : 'Unknown';
      const bikeModel = tr.lead ? tr.lead.bikeModel : 'Unknown Bike';

      events.push({
        id: tr._id,
        title: `[Test Ride] ${leadName} - ${bikeModel}`,
        start: tr.date,
        description: `Scheduled Test Ride with salesperson ${tr.salesperson}.`,
        extendedProps: {
          type: 'test_ride',
          status: tr.status,
          salesperson: tr.salesperson,
          lead: tr.lead || null
        },
        backgroundColor: color,
        borderColor: color,
        textColor: '#ffffff'
      });
    });

    res.json(events);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

// Complete Task
exports.markTaskDone = async (req, res) => {
  try {
    const { id } = req.params;
    try {
      const task = await Task.findById(id).populate('lead');
      if (task) {
        task.status = 'Completed';
        task.completedAt = new Date();
        await task.save();

        // Log activity
        const leadName = task.lead ? task.lead.name : 'Unknown Customer';
        const activity = new Activity({
          title: `Follow-up completed: ${task.title}`,
          description: `Logged follow-up for client: ${leadName}.`,
          type: 'system'
        });
        await activity.save();
      }
    } catch (dbErr) {
      console.error('Failed to complete task:', dbErr.message);
    }
    
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.json({ success: true, message: 'Follow-up marked as completed.' });
    }
    res.redirect('/follow-ups');
  } catch (error) {
    console.error(error);
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
    res.status(500).send('Internal Server Error');
  }
};

// Reschedule Task (updates date and sets status back to 'Pending')
exports.rescheduleTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { newDate } = req.body;
    try {
      const task = await Task.findById(id).populate('lead');
      if (task) {
        task.dueDate = new Date(newDate);
        task.status = 'Pending'; // reset status
        task.priority = req.body.priority || task.priority;
        await task.save();

        // Log activity
        const leadName = task.lead ? task.lead.name : 'Unknown Customer';
        const activity = new Activity({
          title: `Follow-up rescheduled: ${task.title}`,
          description: `Rescheduled follow-up for client: ${leadName} to ${new Date(newDate).toLocaleDateString()}.`,
          type: 'system'
        });
        await activity.save();
      }
    } catch (dbErr) {
      console.error('Failed to reschedule task:', dbErr.message);
    }

    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.json({ success: true, message: 'Follow-up rescheduled successfully.' });
    }
    res.redirect('/follow-ups');
  } catch (error) {
    console.error(error);
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
    res.status(500).send('Internal Server Error');
  }
};

// Mark Task as Missed
exports.markTaskMissed = async (req, res) => {
  try {
    const { id } = req.params;
    try {
      const task = await Task.findById(id).populate('lead');
      if (task) {
        task.status = 'Missed';
        await task.save();

        // Log activity
        const leadName = task.lead ? task.lead.name : 'Unknown Customer';
        const activity = new Activity({
          title: `Follow-up marked as missed: ${task.title}`,
          description: `Marked follow-up as missed for client: ${leadName}.`,
          type: 'system'
        });
        await activity.save();
      }
    } catch (dbErr) {
      console.error('Failed to mark task as missed:', dbErr.message);
    }

    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.json({ success: true, message: 'Follow-up marked as missed.' });
    }
    res.redirect('/follow-ups');
  } catch (error) {
    console.error(error);
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
    res.status(500).send('Internal Server Error');
  }
};

// Reassign a single follow-up task
exports.reassignTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
        return res.status(400).json({ success: false, message: 'Invalid User ID.' });
      }
      return res.status(400).send('Invalid User ID');
    }

    const task = await Task.findById(id).populate('lead');
    if (!task) {
      if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
        return res.status(404).json({ success: false, message: 'Task not found.' });
      }
      return res.status(404).send('Task not found');
    }

    const user = await User.findById(userId);
    if (!user) {
      if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }
      return res.status(404).send('User not found');
    }

    task.assignedTo = user._id;
    await task.save();

    // Log activity
    const leadName = task.lead ? task.lead.name : 'Unknown Customer';
    const activity = new Activity({
      title: `Follow-up reassigned: ${task.title}`,
      description: `Reassigned follow-up for client ${leadName} to salesperson ${user.name}.`,
      type: 'system'
    });
    await activity.save();

    // Sync with Google Calendar if enabled
    try {
      const settings = await Settings.findOne({ userId: req.session.userId });
      if (settings && settings.integrations.googleCalendar.enabled && task.lead) {
        await googleCalendarService.syncFollowUp(req.session.userId, task, task.lead);
      }
    } catch (calendarError) {
      console.error('Google Calendar sync error:', calendarError);
    }

    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.json({ success: true, message: `Task reassigned to ${user.name}.` });
    }
    res.redirect('/follow-ups');
  } catch (error) {
    console.error(error);
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
    res.status(500).send('Internal Server Error');
  }
};

// Reassign all overdue tasks to another user
exports.reassignAllOverdueTasks = async (req, res) => {
  try {
    const { userId } = req.body;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
        return res.status(400).json({ success: false, message: 'Invalid User ID.' });
      }
      return res.status(400).send('Invalid User ID');
    }

    const user = await User.findById(userId);
    if (!user) {
      if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }
      return res.status(404).send('User not found');
    }

    const result = await Task.updateMany(
      {
        status: { $in: ['Pending', 'Missed'] },
        dueDate: { $lt: startOfToday }
      },
      {
        $set: { assignedTo: user._id }
      }
    );

    // Log activity
    const activity = new Activity({
      title: `Overdue follow-ups reassigned`,
      description: `Reassigned all overdue tasks to salesperson ${user.name}.`,
      type: 'system'
    });
    await activity.save();

    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.json({ success: true, message: `Reassigned ${result.modifiedCount} overdue tasks to ${user.name}.` });
    }
    res.redirect('/follow-ups');
  } catch (error) {
    console.error(error);
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
    res.status(500).send('Internal Server Error');
  }
};

// Log Call Activity
exports.logCallActivity = async (req, res) => {
  try {
    let { taskId, testRideId, leadId } = req.body;
    let lead = null;
    let contextTitle = '';
    let relatedEntity = null;

    // Sanitize string 'null' / 'undefined'
    if (taskId === 'null' || taskId === 'undefined') taskId = null;
    if (testRideId === 'null' || testRideId === 'undefined') testRideId = null;
    if (leadId === 'null' || leadId === 'undefined') leadId = null;

    if (taskId && mongoose.Types.ObjectId.isValid(taskId)) {
      const task = await Task.findById(taskId).populate('lead');
      if (task && task.lead) {
        lead = task.lead;
        contextTitle = `for follow-up: "${task.title}"`;
        relatedEntity = { type: 'task', entityId: task._id };
      }
    }
    
    if (!lead && testRideId && mongoose.Types.ObjectId.isValid(testRideId)) {
      const tr = await TestRide.findById(testRideId).populate('lead');
      if (tr && tr.lead) {
        lead = tr.lead;
        contextTitle = `for scheduled test ride on ${new Date(tr.date).toLocaleDateString()}`;
        relatedEntity = { type: 'test_ride', entityId: tr._id };
      }
    }
    
    if (!lead && leadId && mongoose.Types.ObjectId.isValid(leadId)) {
      lead = await Lead.findById(leadId);
      relatedEntity = { type: 'lead', entityId: lead._id };
    }

    if (lead) {
      // Log call using call service
      await callService.logCall(lead.phone, 'outgoing_call', relatedEntity, req.session.userId);

      const activity = new Activity({
        title: `Outgoing Call: ${lead.name}`,
        description: `Placed an outgoing call to ${lead.name} (${lead.phone}) ${contextTitle}.`,
        type: 'call_logged'
      });
      await activity.save();

      return res.json({ success: true, message: `Call logged successfully for ${lead.name}.`, telLink: `tel:${lead.phone.replace(/\D/g, '')}` });
    }

    res.status(400).json({ success: false, message: 'Lead or related context not found.' });
  } catch (error) {
    console.error('Error logging call activity:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
