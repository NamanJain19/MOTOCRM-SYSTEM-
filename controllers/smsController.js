const SMSHistory = require('../models/SMSHistory');
const Activity = require('../models/Activity');
const Lead = require('../models/Lead');
const Delivery = require('../models/Delivery');
const smsService = require('../services/smsService');

exports.sendSMS = async (req, res) => {
  const { to, message, leadId, deliveryId } = req.body;

  if (!to || !message) {
    return res.status(400).json({ success: false, message: 'Recipient phone number and message are required.' });
  }

  // Create pending history record
  const smsLog = new SMSHistory({
    to,
    message,
    leadId: leadId || null,
    deliveryId: deliveryId || null,
    status: 'Pending'
  });

  try {
    await smsLog.save();

    // Call service to send SMS
    const result = await smsService.sendSMS(to, message, null, req.session.userId);

    if (result.success) {
      smsLog.status = 'Sent';
      await smsLog.save();

      // Determine customer name for logging
      let customerName = 'Customer';
      if (leadId) {
        const lead = await Lead.findById(leadId);
        if (lead) customerName = lead.name;
      } else if (deliveryId) {
        const delivery = await Delivery.findById(deliveryId);
        if (delivery) customerName = delivery.customerName;
      }

      // Log Activity
      const activity = new Activity({
        title: `SMS Sent: ${customerName}`,
        description: `SMS successfully sent to ${customerName} (${to}): "${message}"`,
        type: 'sms_sent',
        deliveryId: deliveryId || null,
        customerName: customerName
      });
      await activity.save();

      return res.json({ success: true, message: 'SMS sent successfully.', smsLog });
    } else {
      throw new Error('Failed to send SMS');
    }
  } catch (error) {
    console.error('Error sending SMS:', error);
    smsLog.status = 'Failed';
    smsLog.error = error.message;
    await smsLog.save();

    // Log Activity for failure
    let customerName = 'Customer';
    if (leadId) {
      const lead = await Lead.findById(leadId).lean();
      if (lead) customerName = lead.name;
    } else if (deliveryId) {
      const delivery = await Delivery.findById(deliveryId).lean();
      if (delivery) customerName = delivery.customerName;
    }

    const activity = new Activity({
      title: `SMS Failed: ${customerName}`,
      description: `Failed to send SMS to ${customerName} (${to}): "${message}". Error: ${error.message}`,
      type: 'sms_sent',
      deliveryId: deliveryId || null,
      customerName: customerName
    });
    await activity.save();

    return res.status(500).json({ success: false, message: error.message, smsLog });
  }
};

exports.getSMSHistory = async (req, res) => {
  try {
    const { leadId, deliveryId } = req.query;
    const query = {};
    if (leadId) query.leadId = leadId;
    if (deliveryId) query.deliveryId = deliveryId;

    const history = await SMSHistory.find(query).sort({ createdAt: -1 }).lean();
    res.json({ success: true, history });
  } catch (error) {
    console.error('Error fetching SMS history:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
