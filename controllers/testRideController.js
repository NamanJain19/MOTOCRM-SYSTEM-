const TestRide = require('../models/TestRide');
const Lead = require('../models/Lead');
const Activity = require('../models/Activity');
const Settings = require('../models/Settings');
const googleCalendarService = require('../services/googleCalendarService');
const whatsappService = require('../services/whatsappService');
const smsService = require('../services/smsService');

// Get all test rides
exports.getTestRides = async (req, res) => {
  try {
    const testRides = await TestRide.find()
      .populate('lead')
      .sort({ date: -1 });

    const leads = await Lead.find().sort({ name: 1 });

    res.render('test-rides/index', {
      title: 'Test Rides',
      testRides,
      leads
    });
  } catch (error) {
    console.error('Error fetching test rides:', error);
    res.status(500).send('Internal Server Error');
  }
};

// Schedule a new test ride
exports.createTestRide = async (req, res) => {
  try {
    const { leadId, date, salesperson } = req.body;

    const testRide = new TestRide({
      lead: leadId,
      date: new Date(date),
      salesperson,
      status: 'Scheduled'
    });

    await testRide.save();

    // Log activity
    const lead = await Lead.findById(leadId);
    if (lead) {
      const activity = new Activity({
        title: `Test ride scheduled: ${lead.bikeModel}`,
        description: `Scheduled for ${lead.name} on ${new Date(date).toLocaleString()} with salesperson ${salesperson}.`,
        type: 'test_ride'
      });
      await activity.save();

      // Sync with Google Calendar if enabled
      try {
        const settings = await Settings.findOne({ userId: req.session.userId });
        if (settings && settings.integrations.googleCalendar.enabled) {
          await googleCalendarService.syncTestRide(req.session.userId, testRide, lead);
        }

        // Send WhatsApp reminder if enabled
        if (settings && settings.integrations.whatsapp.enabled) {
          await whatsappService.sendTestRideReminder(testRide, lead, req.session.userId);
        }

        // Send SMS reminder if enabled
        if (settings && settings.integrations.sms.enabled) {
          await smsService.sendAppointmentReminder(lead, date, 'Test Ride', req.session.userId);
        }
      } catch (integrationError) {
        console.error('Integration error:', integrationError);
      }
    }

    res.redirect('/test-rides');
  } catch (error) {
    console.error('Error scheduling test ride:', error);
    res.status(500).send('Internal Server Error');
  }
};

// Update test ride status
exports.updateTestRideStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const testRide = await TestRide.findById(id).populate('lead');
    if (!testRide) {
      return res.status(404).send('Test ride not found');
    }

    testRide.status = status;
    await testRide.save();

    // Log activity
    const activity = new Activity({
      title: `Test ride status updated: ${status}`,
      description: `Test ride for ${testRide.lead ? testRide.lead.name : 'Unknown Customer'} is now ${status}.`,
      type: 'test_ride'
    });
    await activity.save();

    res.redirect('/test-rides');
  } catch (error) {
    console.error('Error updating test ride status:', error);
    res.status(500).send('Internal Server Error');
  }
};

// Delete a test ride
exports.deleteTestRide = async (req, res) => {
  try {
    const { id } = req.params;

    const testRide = await TestRide.findById(id).populate('lead');
    if (testRide) {
      const activity = new Activity({
        title: `Test ride deleted`,
        description: `Cancelled/deleted test ride schedule for ${testRide.lead ? testRide.lead.name : 'Unknown Customer'}.`,
        type: 'system'
      });
      await activity.save();
      await TestRide.findByIdAndDelete(id);
    }

    res.redirect('/test-rides');
  } catch (error) {
    console.error('Error deleting test ride:', error);
    res.status(500).send('Internal Server Error');
  }
};
