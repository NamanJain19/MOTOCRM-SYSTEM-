const Lead = require('../models/Lead');
const Activity = require('../models/Activity');
const Task = require('../models/Task');

exports.getLeads = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const query = {};

    // Search
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { phone: searchRegex },
        { bikeModel: searchRegex },
        { city: searchRegex },
        { notes: searchRegex }
      ];
    }

    // Filters
    if (req.query.status && req.query.status !== 'All') {
      query.status = req.query.status;
    }
    if (req.query.source && req.query.source !== 'All') {
      query.leadSource = req.query.source;
    }

    const dateRange = req.query.dateRange || 'All';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';

    if (dateRange !== 'All') {
      const now = new Date();
      let startOfRange;

      if (dateRange === '7days') {
        startOfRange = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (dateRange === '30days') {
        startOfRange = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (dateRange === '3months') {
        startOfRange = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      } else if (dateRange === '6months') {
        startOfRange = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      } else if (dateRange === '12months') {
        startOfRange = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      } else if (dateRange === 'custom') {
        if (startDate) {
          startOfRange = new Date(startDate);
        }
      }

      if (startOfRange) {
        query.createdAt = { $gte: startOfRange };
      }

      if (dateRange === 'custom' && endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (query.createdAt) {
          query.createdAt.$lte = end;
        } else {
          query.createdAt = { $lte: end };
        }
      }
    }

    let leads = [];
    let totalLeadsCount = 0;
    try {
      const [leadsRaw, totalCount] = await Promise.all([
        Lead.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Lead.countDocuments(query)
      ]);
      leads = leadsRaw;
      totalLeadsCount = totalCount;

      // Map deliveries to leads
      const leadIds = leads.map(l => l._id);
      const Delivery = require('../models/Delivery');
      const deliveries = await Delivery.find({ lead: { $in: leadIds } }).lean();
      const deliveryMap = {};
      deliveries.forEach(d => {
        if (d.lead) {
          deliveryMap[d.lead.toString()] = d;
        }
      });
      
      leads = leads.map(l => {
        const leadObj = l.toObject ? l.toObject() : l;
        leadObj.delivery = deliveryMap[leadObj._id.toString()] || null;
        return leadObj;
      });
    } catch (dbErr) {
      console.warn('DB error fetching leads:', dbErr.message);
      leads = [];
      totalLeadsCount = 0;
    }

    const totalPages = Math.ceil(totalLeadsCount / limit) || 1;

    res.render('leads/index', {
      title: 'Leads',
      leads,
      currentPage: page,
      totalPages,
      totalLeadsCount,
      search: req.query.search || '',
      selectedStatus: req.query.status || 'All',
      selectedSource: req.query.source || 'All',
      selectedDateRange: dateRange,
      startDate,
      endDate
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

exports.getAddLead = (req, res) => {
  res.render('leads/add', { title: 'Add New Lead' });
};

exports.createLead = async (req, res) => {
  try {
    const {
      name, email, phone, alternativeContact, homeAddress,
      bikeModel, preferredColor, conditionPreference, city,
      leadSource, status, targetBudget, financingInterest,
      preferredContactMethod, followUpDate, notes
    } = req.body;

    const leadData = {
      name,
      email,
      phone,
      alternativeContact,
      homeAddress,
      bikeModel,
      preferredColor,
      conditionPreference: conditionPreference || 'New',
      city,
      leadSource,
      status: status || 'New',
      targetBudget: Number(targetBudget) || 0,
      financingInterest: financingInterest || 'No',
      preferredContactMethod: preferredContactMethod || 'Email',
      followUpDate: followUpDate ? new Date(followUpDate) : new Date(),
      notes,
      closedAt: (status === 'Sold' || status === 'Delivered') ? new Date() : null
    };

    try {
      const newLead = new Lead(leadData);
      await newLead.save();

      // Create activity
      const activity = new Activity({
        title: `New lead added: ${newLead.name}`,
        description: `Interested in ${newLead.bikeModel}. Budget: $${newLead.targetBudget}.`,
        type: 'lead_added'
      });
      await activity.save();

      // Create a pending follow up task
      const task = new Task({
        lead: newLead._id,
        title: `Initial Lead Follow-up: ${newLead.name}`,
        description: `Follow up via ${newLead.preferredContactMethod} regarding ${newLead.bikeModel}.`,
        dueDate: newLead.followUpDate,
        priority: 'NORMAL',
        status: 'Pending'
      });
      await task.save();
    } catch (dbErr) {
      console.error('Failed to save lead in DB:', dbErr.message);
    }

    res.redirect('/leads');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

exports.getEditLead = async (req, res) => {
  try {
    const { id } = req.params;
    let lead = null;

    try {
      lead = await Lead.findById(id);
    } catch (dbErr) {
      console.warn('DB Lead fetch error:', dbErr.message);
    }

    if (!lead) {
      return res.status(404).send('Lead not found');
    }

    res.render('leads/edit', {
      title: 'Edit Lead',
      lead
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

exports.updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (updateData.targetBudget) {
      updateData.targetBudget = Number(updateData.targetBudget) || 0;
    }
    if (updateData.followUpDate) {
      updateData.followUpDate = new Date(updateData.followUpDate);
    }
    if (updateData.status) {
      if (updateData.status === 'Sold' || updateData.status === 'Delivered') {
        updateData.closedAt = new Date();
      } else {
        updateData.closedAt = null;
      }
    }

    try {
      const oldLead = await Lead.findById(id);
      if (!oldLead) {
        return res.status(404).send('Lead not found');
      }

      const updatedLead = await Lead.findByIdAndUpdate(id, updateData, { new: true });

      // Log activity if status changed
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

        // Also add a new task if status is "Test Ride Booked"
        if (updatedLead.status === 'Test Ride Booked') {
          const task = new Task({
            lead: updatedLead._id,
            title: `Test Ride: ${updatedLead.bikeModel}`,
            description: `Customer: ${updatedLead.name} • Scheduled Test Ride.`,
            dueDate: updatedLead.followUpDate,
            priority: 'URGENT',
            status: 'Pending'
          });
          await task.save();
        }
      }
    } catch (dbErr) {
      console.error('Failed to update lead:', dbErr.message);
    }

    res.redirect('/leads');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

exports.deleteLead = async (req, res) => {
  try {
    const { id } = req.params;
    try {
      await Lead.findByIdAndDelete(id);
      await Task.deleteMany({ lead: id });
    } catch (dbErr) {
      console.error('Failed to delete lead:', dbErr.message);
    }
    res.redirect('/leads');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

exports.bulkDeleteLeads = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No leads selected' });
    }
    try {
      await Lead.deleteMany({ _id: { $in: ids } });
      await Task.deleteMany({ lead: { $in: ids } });
    } catch (dbErr) {
      console.error('Failed bulk deleting leads:', dbErr.message);
    }
    return res.json({ success: true, message: `Successfully deleted ${ids.length} leads.` });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
