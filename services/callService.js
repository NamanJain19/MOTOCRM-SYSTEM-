const IntegrationLog = require('../models/IntegrationLog');

class CallService {
  async logCall(phoneNumber, callType, relatedEntity = null, userId = null, duration = null, notes = null) {
    try {
      // Format phone number
      const formattedPhone = phoneNumber.replace(/\D/g, '');
      if (!formattedPhone.startsWith('1') && formattedPhone.length === 10) {
        phoneNumber = '+1' + formattedPhone;
      } else if (!formattedPhone.startsWith('+')) {
        phoneNumber = '+' + formattedPhone;
      }

      // Log the call activity
      await IntegrationLog.create({
        integrationType: 'call',
        action: callType || 'outgoing_call',
        status: 'success',
        request: { phoneNumber, callType, duration, notes },
        response: { callLogged: true },
        relatedEntity,
        userId
      });

      return { success: true, phoneNumber };
    } catch (error) {
      // Log failed integration
      await IntegrationLog.create({
        integrationType: 'call',
        action: callType || 'outgoing_call',
        status: 'failed',
        request: { phoneNumber, callType, duration, notes },
        error: error.message,
        relatedEntity,
        userId
      });
      throw error;
    }
  }

  async initiateCall(phoneNumber, relatedEntity = null, userId = null) {
    try {
      // Format phone number for tel: link
      const formattedPhone = phoneNumber.replace(/\D/g, '');
      if (!formattedPhone.startsWith('1') && formattedPhone.length === 10) {
        phoneNumber = '+1' + formattedPhone;
      } else if (!formattedPhone.startsWith('+')) {
        phoneNumber = '+' + formattedPhone;
      }

      // Log the call initiation
      await this.logCall(phoneNumber, 'outgoing_call', relatedEntity, userId);

      // Return the tel: link for the frontend to open
      return { 
        success: true, 
        phoneNumber,
        telLink: `tel:${phoneNumber}`
      };
    } catch (error) {
      throw error;
    }
  }

  async logFollowUpCall(lead, task, userId) {
    return await this.logCall(lead.phone, 'follow_up_call', { type: 'task', entityId: task._id }, userId);
  }

  async logTestRideCall(lead, testRide, userId) {
    return await this.logCall(lead.phone, 'test_ride_call', { type: 'test_ride', entityId: testRide._id }, userId);
  }

  async logDeliveryCall(delivery, userId) {
    return await this.logCall(delivery.customerPhone, 'delivery_call', { type: 'delivery', entityId: delivery._id }, userId);
  }

  async logLeadCall(lead, userId) {
    return await this.logCall(lead.phone, 'lead_call', { type: 'lead', entityId: lead._id }, userId);
  }
}

module.exports = new CallService();
