const Lead = require('../models/Lead');
const Activity = require('../models/Activity');
const Task = require('../models/Task');

// Render the Kanban board pipeline
exports.getPipeline = async (req, res) => {
  try {
    let leads = [];
    try {
      leads = await Lead.find({});
    } catch (dbErr) {
      console.warn('DB error fetching pipeline leads:', dbErr.message);
      leads = [];
    }

    // Fetch and map deliveries to leads
    let deliveries = [];
    try {
      const Delivery = require('../models/Delivery');
      deliveries = await Delivery.find().lean();
    } catch (dErr) {
      console.warn('Could not fetch deliveries for pipeline:', dErr.message);
    }
    const deliveryMap = {};
    deliveries.forEach(d => {
      if (d.lead) {
        deliveryMap[d.lead.toString()] = d;
      }
    });

    const leadsWithDelivery = leads.map(l => {
      const leadObj = l.toObject ? l.toObject() : l;
      leadObj.delivery = deliveryMap[leadObj._id.toString()] || null;
      return leadObj;
    });

    // Initialize pipeline stage lists
    const stages = {
      'New': [],
      'Contacted': [],
      'Interested': [],
      'Test Ride Booked': [],
      'Negotiation': [],
      'Sold': [],
      'Delivered': [],
      'Lost': []
    };

    // Group leads into stages
    leadsWithDelivery.forEach(lead => {
      if (stages[lead.status] !== undefined) {
        stages[lead.status].push(lead);
      } else {
        // Fallback for unexpected status
        stages['New'].push(lead);
      }
    });

    res.render('pipeline', {
      title: 'Lead Pipeline',
      stages,
      allLeads: leads // Useful to pass full details for search/modal if needed
    });
  } catch (error) {
    console.error('Error rendering pipeline:', error);
    res.status(500).send('Internal Server Error');
  }
};

// Update lead status dynamically via AJAX post
exports.updateLeadStatus = async (req, res) => {
  try {
    const { leadId, newStatus } = req.body;
    
    // Validate status values
    const allowedStatuses = ['New', 'Contacted', 'Interested', 'Test Ride Booked', 'Negotiation', 'Sold', 'Delivered', 'Lost'];
    if (!allowedStatuses.includes(newStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid lead status.' });
    }

    const oldLead = await Lead.findById(leadId);
    if (!oldLead) {
      return res.status(404).json({ success: false, message: 'Lead not found.' });
    }

    const updateFields = { status: newStatus };
    if (newStatus === 'Sold' || newStatus === 'Delivered') {
      updateFields.closedAt = new Date();
    } else {
      updateFields.closedAt = null;
    }

    const updatedLead = await Lead.findByIdAndUpdate(leadId, updateFields, { new: true });

    // Replicate activity logging logic when status changes
    if (oldLead.status !== updatedLead.status) {
      let type = 'lead_added';
      if (updatedLead.status === 'Sold' || updatedLead.status === 'Delivered') type = 'bike_sold';
      else if (updatedLead.status === 'Test Ride Booked') type = 'test_ride';

      const activity = new Activity({
        title: `Lead status updated: ${updatedLead.name}`,
        description: `Status changed from ${oldLead.status} to ${updatedLead.status} for ${updatedLead.bikeModel}.`,
        type: type
      });
      await activity.save();

      // Create a pending test ride follow-up task
      if (updatedLead.status === 'Test Ride Booked') {
        const task = new Task({
          lead: updatedLead._id,
          title: `Test Ride: ${updatedLead.bikeModel}`,
          description: `Customer: ${updatedLead.name} • Scheduled Test Ride.`,
          dueDate: updatedLead.followUpDate || new Date(),
          priority: 'URGENT',
          status: 'Pending'
        });
        await task.save();
      }
    }

    res.json({ success: true, lead: updatedLead });
  } catch (error) {
    console.error('Error updating lead status:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
