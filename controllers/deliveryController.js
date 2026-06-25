const Delivery = require('../models/Delivery');
const Lead = require('../models/Lead');
const Activity = require('../models/Activity');
const Task = require('../models/Task');
const Settings = require('../models/Settings');
const googleCalendarService = require('../services/googleCalendarService');
const whatsappService = require('../services/whatsappService');
const smsService = require('../services/smsService');
const callService = require('../services/callService');

// Get Deliveries Dashboard
exports.getDeliveries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const query = {};

    // Search filter
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { customerName: searchRegex },
        { customerPhone: searchRegex },
        { bikeModel: searchRegex },
        { deliveryNotes: searchRegex }
      ];
    }

    // Status filter
    if (req.query.status && req.query.status !== 'All') {
      query.status = req.query.status;
    }

    // Fetch deliveries
    const deliveries = await Delivery.find(query)
      .populate('lead')
      .sort({ deliveryDate: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await Delivery.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit) || 1;

    // Calculate delivery metrics for header widgets
    const counts = {
      total: await Delivery.countDocuments(),
      pending: await Delivery.countDocuments({ status: 'Pending' }),
      preparing: await Delivery.countDocuments({ status: 'Preparing' }),
      ready: await Delivery.countDocuments({ status: 'Ready for Delivery' }),
      delivered: await Delivery.countDocuments({ status: 'Delivered' })
    };

    res.render('deliveries/index', {
      title: 'Vehicle Deliveries',
      deliveries,
      counts,
      currentPage: page,
      totalPages,
      totalCount,
      search: req.query.search || '',
      selectedStatus: req.query.status || 'All'
    });
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    res.status(500).send('Internal Server Error');
  }
};

// GET Add Delivery Form
exports.getAddDelivery = async (req, res) => {
  try {
    // Fetch active leads to optionally link
    const leads = await Lead.find({ status: { $ne: 'Lost' } }).sort({ name: 1 }).lean();
    res.render('deliveries/add', { title: 'Schedule Delivery', leads });
  } catch (error) {
    console.error('Error loading add delivery form:', error);
    res.status(500).send('Internal Server Error');
  }
};

// POST Create Delivery
exports.createDelivery = async (req, res) => {
  try {
    const { leadId, customerName, customerEmail, customerPhone, bikeModel, deliveryDate, status, notes } = req.body;
    const salesExecutive = req.session.userName || 'Sales Executive';

    // Build default checklist items
    const checklistItems = [
      { item: 'Helmet Provided', checked: false },
      { item: 'Primary + Spare Keys', checked: false },
      { item: 'Toolkit & First Aid Kit', checked: false },
      { item: 'Owner Manual', checked: false },
      { item: 'Extended Warranty Card', checked: false }
    ];

    const delivery = new Delivery({
      lead: leadId || null,
      customerName,
      customerEmail: customerEmail || '',
      customerPhone,
      bikeModel,
      deliveryDate: new Date(deliveryDate),
      status: status || 'Pending',
      accessoriesChecklist: checklistItems,
      deliveryNotes: notes || ''
    });

    await delivery.save();

    // If initial status is Delivered, update lead status to Delivered
    if (delivery.status === 'Delivered' && leadId) {
      await Lead.findByIdAndUpdate(leadId, { status: 'Delivered' });

      // Close pending tasks
      await Task.updateMany(
        { lead: leadId, status: 'Pending' },
        { status: 'Completed', completedAt: new Date(), notes: 'Closed automatically upon vehicle delivery.' }
      );

      // Create post-delivery follow-up if enabled
      const settingsObj = await Settings.findOne({ userId: req.session.userId });
      const isFollowUpEnabled = settingsObj ? settingsObj.notifications.followUpReminders : true;
      if (isFollowUpEnabled) {
        const postDeliveryTask = new Task({
          lead: leadId,
          title: `Post-Delivery Follow-Up: ${customerName}`,
          description: `Contact customer to collect feedback on their new ${bikeModel} and verify documents handover.`,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          priority: 'NORMAL',
          status: 'Pending'
        });
        await postDeliveryTask.save();
      }

      // Send WhatsApp notification if enabled
      if (settingsObj && settingsObj.integrations.whatsapp.enabled) {
        try {
          await whatsappService.sendDeliveryNotification(delivery, req.session.userId);
        } catch (whatsappError) {
          console.error('WhatsApp notification error:', whatsappError);
        }
      }

      // Send SMS notification if enabled
      if (settingsObj && settingsObj.integrations.sms.enabled) {
        try {
          await smsService.sendDeliveryUpdate(delivery, 'Delivered', req.session.userId);
        } catch (smsError) {
          console.error('SMS notification error:', smsError);
        }
      }
    }

    // Sync with Google Calendar if enabled
    try {
      const settingsObj = await Settings.findOne({ userId: req.session.userId });
      if (settingsObj && settingsObj.integrations.googleCalendar.enabled) {
        await googleCalendarService.syncDelivery(req.session.userId, delivery);
      }
    } catch (calendarError) {
      console.error('Google Calendar sync error:', calendarError);
    }

    // Log Activity
    const formattedDate = new Date(deliveryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const activityType = delivery.status === 'Delivered' ? 'bike_sold' : 'delivery';
    const activityTitle = delivery.status === 'Delivered' 
      ? `Vehicle Delivered: ${customerName}` 
      : `Delivery Scheduled: ${customerName}`;
    const activityDesc = delivery.status === 'Delivered'
      ? `${customerName} received ${bikeModel} on ${formattedDate}. Status: Delivered. Sales Executive: ${salesExecutive}.`
      : `Delivery of ${bikeModel} scheduled for ${formattedDate}. Status: ${delivery.status}. Sales Executive: ${salesExecutive}.`;

    const activity = new Activity({
      title: activityTitle,
      description: activityDesc,
      type: activityType,
      deliveryId: delivery._id,
      customerName: delivery.customerName,
      status: delivery.status
    });
    await activity.save();

    // Create a Task reminder if pending
    if (delivery.status !== 'Delivered') {
      const task = new Task({
        lead: leadId || null,
        title: `Prepare Delivery: ${customerName}`,
        description: `Complete RC/Insurance verification and accessories checklist for ${bikeModel}.`,
        dueDate: new Date(deliveryDate),
        priority: 'HIGH',
        status: 'Pending'
      });
      await task.save();
    }

    res.redirect('/deliveries');
  } catch (error) {
    console.error('Error creating delivery:', error);
    res.status(500).send('Internal Server Error');
  }
};

// GET Edit Delivery Form
exports.getEditDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const delivery = await Delivery.findById(id).populate('lead').lean();
    if (!delivery) {
      return res.status(404).send('Delivery record not found');
    }
    res.render('deliveries/edit', { title: 'Manage Delivery', delivery });
  } catch (error) {
    console.error('Error loading edit delivery form:', error);
    res.status(500).send('Internal Server Error');
  }
};

// POST Update Delivery
exports.updateDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rcStatus, insuranceStatus, signature, notes, checklist } = req.body;
    const salesExecutive = req.session.userName || 'Sales Executive';

    const delivery = await Delivery.findById(id);
    if (!delivery) {
      return res.status(404).send('Delivery record not found');
    }

    const previousStatus = delivery.status;

    // Update statuses and notes
    delivery.status = status;
    delivery.rcStatus = rcStatus;
    delivery.insuranceStatus = insuranceStatus;
    delivery.deliveryNotes = notes || '';
    if (signature) {
      delivery.customerSignature = signature;
    }

    // Update checklist items
    if (delivery.accessoriesChecklist && delivery.accessoriesChecklist.length > 0) {
      delivery.accessoriesChecklist.forEach(itemObj => {
        // If the item name is present in checklist body array (checked), check it
        const isChecked = Array.isArray(checklist) 
          ? checklist.includes(itemObj.item) 
          : (checklist === itemObj.item);
        itemObj.checked = !!isChecked;
      });
    }

    await delivery.save();

    const formattedDate = new Date(delivery.deliveryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    // Log Activity and trigger integrations if status changed to Delivered
    if (status === 'Delivered' && previousStatus !== 'Delivered') {
      const activity = new Activity({
        title: `Vehicle Delivered: ${delivery.customerName}`,
        description: `${delivery.customerName} received ${delivery.bikeModel} on ${formattedDate}. Status: Delivered. Sales Executive: ${salesExecutive}.`,
        type: 'bike_sold',
        deliveryId: delivery._id,
        customerName: delivery.customerName,
        status: 'Delivered'
      });
      await activity.save();

      // If there is an associated lead, mark lead status as Delivered
      if (delivery.lead) {
        await Lead.findByIdAndUpdate(delivery.lead, { status: 'Delivered' });

        // Close pending tasks
        await Task.updateMany(
          { lead: delivery.lead, status: 'Pending' },
          { status: 'Completed', completedAt: new Date(), notes: 'Closed automatically upon vehicle delivery.' }
        );

        // Create post-delivery follow-up if enabled
        const settingsObj = await Settings.findOne({ userId: req.session.userId });
        const isFollowUpEnabled = settingsObj ? settingsObj.notifications.followUpReminders : true;
        if (isFollowUpEnabled) {
          const postDeliveryTask = new Task({
            lead: delivery.lead,
            title: `Post-Delivery Follow-Up: ${delivery.customerName}`,
            description: `Contact customer to collect feedback on their new ${delivery.bikeModel} and verify documents handover.`,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            priority: 'NORMAL',
            status: 'Pending'
          });
          await postDeliveryTask.save();
        }
      }
    } else if (status !== previousStatus) {
      const activity = new Activity({
        title: `Delivery Updated: ${delivery.customerName}`,
        description: `Delivery status for ${delivery.bikeModel} changed from ${previousStatus} to ${status}. RC: ${rcStatus}, Insurance: ${insuranceStatus}. Sales Executive: ${salesExecutive}.`,
        type: 'delivery',
        deliveryId: delivery._id,
        customerName: delivery.customerName,
        status: status
      });
      await activity.save();
    } else {
      // General update (checklist or notes)
      const activity = new Activity({
        title: `Delivery Updated: ${delivery.customerName}`,
        description: `Delivery checklist/notes updated for ${delivery.bikeModel}. Status: ${status}. Sales Executive: ${salesExecutive}.`,
        type: 'delivery',
        deliveryId: delivery._id,
        customerName: delivery.customerName,
        status: status
      });
      await activity.save();
    }

    // Send SMS notification if enabled and status changed
    if (status !== previousStatus) {
      const settingsObj = await Settings.findOne({ userId: req.session.userId });
      if (settingsObj && settingsObj.integrations.sms.enabled) {
        try {
          await smsService.sendDeliveryUpdate(delivery, status, req.session.userId);
        } catch (smsError) {
          console.error('SMS notification error during updateDelivery:', smsError);
        }
      }
    }

    res.redirect('/deliveries');
  } catch (error) {
    console.error('Error updating delivery:', error);
    res.status(500).send('Internal Server Error');
  }
};

// POST Delete Delivery
exports.deleteDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const salesExecutive = req.session.userName || 'Sales Executive';
    const delivery = await Delivery.findById(id);
    
    if (delivery) {
      const activity = new Activity({
        title: `Delivery Cancelled: ${delivery.customerName}`,
        description: `Delivery schedule of ${delivery.bikeModel} for ${delivery.customerName} was deleted. Sales Executive: ${salesExecutive}.`,
        type: 'delivery',
        deliveryId: delivery._id,
        customerName: delivery.customerName,
        status: 'Cancelled'
      });
      await activity.save();
      await Delivery.findByIdAndDelete(id);
    }
    res.redirect('/deliveries');
  } catch (error) {
    console.error('Error deleting delivery:', error);
    res.status(500).send('Internal Server Error');
  }
};
