const twilio = require('twilio');
const IntegrationLog = require('../models/IntegrationLog');

class SMSService {
  constructor() {
    this.client = null;
    this.init();
  }

  init() {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (sid && token && sid.startsWith('AC') && sid !== 'your-twilio-account-sid' && token !== 'your-twilio-auth-token') {
      try {
        this.client = twilio(sid, token);
        console.log('SMS Service Enabled');
      } catch (error) {
        console.error('Failed to initialize Twilio client:', error.message);
        console.log('SMS Service Disabled');
      }
    } else {
      console.warn('Twilio credentials not configured or invalid (accountSid must start with AC).');
      console.log('SMS Service Disabled');
    }
  }

  async sendSMS(phoneNumber, message, relatedEntity = null, userId = null) {
    try {
      if (!this.client) {
        throw new Error('Twilio credentials not configured');
      }

      // Format phone number
      const formattedPhone = phoneNumber.replace(/\D/g, '');
      if (!formattedPhone.startsWith('1') && formattedPhone.length === 10) {
        phoneNumber = '+1' + formattedPhone;
      } else if (!formattedPhone.startsWith('+')) {
        phoneNumber = '+' + formattedPhone;
      }

      const response = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      // Log successful integration
      try {
        await IntegrationLog.create({
          integrationType: 'sms',
          action: 'send_sms',
          status: 'success',
          request: { phoneNumber, message },
          response: { messageId: response.sid, status: response.status },
          relatedEntity,
          userId
        });
      } catch (dbError) {
        console.warn('Failed to write successful SMS integration log to database:', dbError.message);
      }

      return { success: true, messageId: response.sid };
    } catch (error) {
      let customError = error.message;

      // Categorize specific errors
      if (error.code === 20003 || error.status === 401) {
        console.error('[SMS Error] Authentication failed: Invalid SID or Auth Token.');
        customError = 'Authentication failed: Invalid Twilio SID or Auth Token.';
      } else if (error.code === 21211) {
        console.error('[SMS Error] Invalid recipient phone number:', phoneNumber);
        customError = 'Invalid recipient phone number.';
      } else if (error.code === 21608) {
        console.error('[SMS Error] Recipient number is unverified in Twilio sandbox.');
        customError = 'Recipient number is unverified in Twilio sandbox.';
      } else if (error.code === 21606) {
        console.error('[SMS Error] The From phone number is invalid.');
        customError = 'Invalid Twilio sender phone number.';
      } else {
        console.error('[SMS Error] Failed to send SMS:', error.message);
      }

      // Log failed integration
      try {
        await IntegrationLog.create({
          integrationType: 'sms',
          action: 'send_sms',
          status: 'failed',
          request: { phoneNumber, message },
          error: customError,
          relatedEntity,
          userId
        });
      } catch (dbError) {
        console.warn('Failed to write failed SMS integration log to database:', dbError.message);
      }
      throw new Error(customError);
    }
  }

  async sendOTP(phoneNumber, otp, relatedEntity = null, userId = null) {
    const message = `Your MotoCRM verification code is: ${otp}. This code will expire in 10 minutes. Do not share this code with anyone.`;
    return await this.sendSMS(phoneNumber, message, relatedEntity, userId);
  }

  async sendFollowUpReminder(lead, task, userId) {
    const message = `Hello ${lead.name}, this is a reminder about your follow-up regarding the ${lead.bikeModel}. ${task.description || 'Please contact us to discuss further.'} Reply STOP to opt out.`;
    return await this.sendSMS(lead.phone, message, { type: 'task', entityId: task._id }, userId);
  }

  async sendDeliveryUpdate(delivery, status, userId) {
    const message = `Hello ${delivery.customerName}, your ${delivery.bikeModel} delivery status has been updated to: ${status}. Contact us for more details. Reply STOP to opt out.`;
    return await this.sendSMS(delivery.customerPhone, message, { type: 'delivery', entityId: delivery._id }, userId);
  }

  async sendAppointmentReminder(lead, appointmentDate, appointmentType, userId) {
    const message = `Hello ${lead.name}, this is a reminder about your ${appointmentType} scheduled on ${new Date(appointmentDate).toLocaleString()}. Please arrive on time. Reply STOP to opt out.`;
    return await this.sendSMS(lead.phone, message, { type: 'lead', entityId: lead._id }, userId);
  }
}

module.exports = new SMSService();
