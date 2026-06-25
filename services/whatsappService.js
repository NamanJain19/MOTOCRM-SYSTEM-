const IntegrationLog = require('../models/IntegrationLog');

class WhatsAppService {
  constructor() {
    this.apiKey = process.env.WHATSAPP_API_KEY;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
  }

  async sendMessage(phoneNumber, message, messageType = 'text', relatedEntity = null, userId = null) {
    try {
      if (!this.apiKey || !this.phoneNumberId) {
        throw new Error('WhatsApp API credentials not configured');
      }

      // Format phone number (remove non-numeric characters and add country code if needed)
      const formattedPhone = phoneNumber.replace(/\D/g, '');
      if (!formattedPhone.startsWith('1') && formattedPhone.length === 10) {
        phoneNumber = '1' + formattedPhone;
      }

      const payload = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: messageType,
        [messageType]: {
          preview_url: true
        }
      };

      if (messageType === 'text') {
        payload.text.body = message;
      }

      const response = await fetch(`${this.apiUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to send WhatsApp message');
      }

      // Log successful integration
      await IntegrationLog.create({
        integrationType: 'whatsapp',
        action: 'send_message',
        status: 'success',
        request: { phoneNumber, message, messageType },
        response: { messageId: data.messages[0]?.id },
        relatedEntity,
        userId
      });

      return { success: true, messageId: data.messages[0]?.id };
    } catch (error) {
      // Log failed integration
      await IntegrationLog.create({
        integrationType: 'whatsapp',
        action: 'send_message',
        status: 'failed',
        request: { phoneNumber, message, messageType },
        error: error.message,
        relatedEntity,
        userId
      });
      throw error;
    }
  }

  async sendFollowUpReminder(lead, task, userId) {
    const message = `Hello ${lead.name}, this is a friendly reminder about your follow-up regarding the ${lead.bikeModel}. ${task.description || 'Please contact us to discuss further.'} Reply STOP to opt out.`;
    return await this.sendMessage(lead.phone, message, 'text', { type: 'task', entityId: task._id }, userId);
  }

  async sendDeliveryNotification(delivery, userId) {
    const message = `Hello ${delivery.customerName}, your ${delivery.bikeModel} is ready for delivery on ${new Date(delivery.deliveryDate).toLocaleDateString()}. Please ensure you have all necessary documents. Reply STOP to opt out.`;
    return await this.sendMessage(delivery.customerPhone, message, 'text', { type: 'delivery', entityId: delivery._id }, userId);
  }

  async sendTestRideReminder(testRide, lead, userId) {
    const message = `Hello ${lead.name}, this is a reminder about your test ride for the ${lead.bikeModel} scheduled on ${new Date(testRide.date).toLocaleString()}. Please arrive on time. Reply STOP to opt out.`;
    return await this.sendMessage(lead.phone, message, 'text', { type: 'test_ride', entityId: testRide._id }, userId);
  }

  async sendLeadNotification(lead, userId) {
    const message = `Hello ${lead.name}, thank you for your interest in the ${lead.bikeModel}. Our team will contact you shortly. Reply STOP to opt out.`;
    return await this.sendMessage(lead.phone, message, 'text', { type: 'lead', entityId: lead._id }, userId);
  }
}

module.exports = new WhatsAppService();
