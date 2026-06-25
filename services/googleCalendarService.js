const { google } = require('googleapis');
const IntegrationLog = require('../models/IntegrationLog');
const User = require('../models/User');

class GoogleCalendarService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'
    );
  }

  async getCalendar(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.googleAccessToken) {
        throw new Error('User not authenticated with Google');
      }

      this.oauth2Client.setCredentials({
        access_token: user.googleAccessToken,
        refresh_token: user.googleRefreshToken
      });

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      return calendar;
    } catch (error) {
      console.error('Error getting calendar:', error);
      throw error;
    }
  }

  async createEvent(userId, eventData) {
    try {
      const calendar = await this.getCalendar(userId);
      
      const event = {
        summary: eventData.summary,
        description: eventData.description,
        start: {
          dateTime: eventData.startDateTime,
          timeZone: eventData.timeZone || 'UTC'
        },
        end: {
          dateTime: eventData.endDateTime,
          timeZone: eventData.timeZone || 'UTC'
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 10 }
          ]
        }
      };

      if (eventData.attendees && eventData.attendees.length > 0) {
        event.attendees = eventData.attendees;
      }

      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: event
      });

      // Log successful integration
      await IntegrationLog.create({
        integrationType: 'google_calendar',
        action: 'create_event',
        status: 'success',
        request: eventData,
        response: { eventId: response.data.id, htmlLink: response.data.htmlLink },
        relatedEntity: eventData.relatedEntity,
        userId
      });

      return response.data;
    } catch (error) {
      // Log failed integration
      await IntegrationLog.create({
        integrationType: 'google_calendar',
        action: 'create_event',
        status: 'failed',
        request: eventData,
        error: error.message,
        relatedEntity: eventData.relatedEntity,
        userId
      });
      throw error;
    }
  }

  async updateEvent(userId, eventId, eventData) {
    try {
      const calendar = await this.getCalendar(userId);
      
      const event = {
        summary: eventData.summary,
        description: eventData.description
      };

      if (eventData.startDateTime) {
        event.start = {
          dateTime: eventData.startDateTime,
          timeZone: eventData.timeZone || 'UTC'
        };
      }

      if (eventData.endDateTime) {
        event.end = {
          dateTime: eventData.endDateTime,
          timeZone: eventData.timeZone || 'UTC'
        };
      }

      const response = await calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: event
      });

      // Log successful integration
      await IntegrationLog.create({
        integrationType: 'google_calendar',
        action: 'update_event',
        status: 'success',
        request: { eventId, ...eventData },
        response: { eventId: response.data.id },
        relatedEntity: eventData.relatedEntity,
        userId
      });

      return response.data;
    } catch (error) {
      // Log failed integration
      await IntegrationLog.create({
        integrationType: 'google_calendar',
        action: 'update_event',
        status: 'failed',
        request: { eventId, ...eventData },
        error: error.message,
        relatedEntity: eventData.relatedEntity,
        userId
      });
      throw error;
    }
  }

  async deleteEvent(userId, eventId) {
    try {
      const calendar = await this.getCalendar(userId);
      
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId
      });

      // Log successful integration
      await IntegrationLog.create({
        integrationType: 'google_calendar',
        action: 'delete_event',
        status: 'success',
        request: { eventId },
        response: { deleted: true },
        userId
      });

      return { success: true };
    } catch (error) {
      // Log failed integration
      await IntegrationLog.create({
        integrationType: 'google_calendar',
        action: 'delete_event',
        status: 'failed',
        request: { eventId },
        error: error.message,
        userId
      });
      throw error;
    }
  }

  async syncFollowUp(userId, task, lead) {
    try {
      const eventData = {
        summary: `Follow-Up: ${task.title}`,
        description: `Follow-up with ${lead.name}\nPhone: ${lead.phone}\nEmail: ${lead.email}\n\nNotes: ${task.description || ''}`,
        startDateTime: new Date(task.dueDate).toISOString(),
        endDateTime: new Date(new Date(task.dueDate).getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
        relatedEntity: {
          type: 'task',
          entityId: task._id
        }
      };

      return await this.createEvent(userId, eventData);
    } catch (error) {
      console.error('Error syncing follow-up to calendar:', error);
      throw error;
    }
  }

  async syncTestRide(userId, testRide, lead) {
    try {
      const eventData = {
        summary: `Test Ride: ${lead.name} - ${lead.bikeModel}`,
        description: `Test ride scheduled for ${lead.name}\nPhone: ${lead.phone}\nEmail: ${lead.email}\nBike Model: ${lead.bikeModel}\nSalesperson: ${testRide.salesperson}`,
        startDateTime: new Date(testRide.date).toISOString(),
        endDateTime: new Date(new Date(testRide.date).getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
        relatedEntity: {
          type: 'test_ride',
          entityId: testRide._id
        }
      };

      return await this.createEvent(userId, eventData);
    } catch (error) {
      console.error('Error syncing test ride to calendar:', error);
      throw error;
    }
  }

  async syncDelivery(userId, delivery) {
    try {
      const eventData = {
        summary: `Vehicle Delivery: ${delivery.customerName} - ${delivery.bikeModel}`,
        description: `Vehicle delivery scheduled\nCustomer: ${delivery.customerName}\nPhone: ${delivery.customerPhone}\nEmail: ${delivery.customerEmail}\nBike Model: ${delivery.bikeModel}\nStatus: ${delivery.status}`,
        startDateTime: new Date(delivery.deliveryDate).toISOString(),
        endDateTime: new Date(new Date(delivery.deliveryDate).getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hour duration
        relatedEntity: {
          type: 'delivery',
          entityId: delivery._id
        }
      };

      return await this.createEvent(userId, eventData);
    } catch (error) {
      console.error('Error syncing delivery to calendar:', error);
      throw error;
    }
  }
}

module.exports = new GoogleCalendarService();
