const Settings = require('../models/Settings');
const User = require('../models/User');
const Activity = require('../models/Activity');

exports.getSettings = async (req, res) => {
  try {
    const userId = req.session.userId;

    // Get user's settings
    let settings = await Settings.findOne({ userId });

    // If settings don't exist, create default settings
    if (!settings) {
      settings = new Settings({
        userId,
        dealershipName: 'Harley-Davidson NYC',
        dealershipLocation: '370 10th Ave, New York',
        dealershipPhone: '',
        dealershipEmail: '',
        hours: [
          { days: 'Monday - Friday', hours: '09:00 AM - 07:00 PM', status: 'open' },
          { days: 'Saturday', hours: '10:00 AM - 05:00 PM', status: 'open' },
          { days: 'Sunday', hours: 'Closed', status: 'closed' }
        ],
        notifications: {
          email: true,
          sms: false,
          pushNotifications: true
        },
        integrations: {
          googleCalendar: { 
            enabled: false,
            calendarId: 'primary'
          },
          whatsapp: { 
            enabled: false,
            apiKey: '',
            phoneNumberId: ''
          },
          sms: { 
            enabled: false,
            accountSid: '',
            authToken: '',
            phoneNumber: ''
          }
        },
        crmConfig: {
          defaultLeadStatus: 'New',
          autoAssignLeads: false,
          followUpReminderDays: 3
        },
        theme: 'light',
        twoFactorEnabled: false,
        sessionTimeout: 3600
      });
      await settings.save();
    }

    // Get all users
    const users = await User.find({}, 'name email role status phone avatar').lean();

    // Add avatar initials for display
    const usersWithAvatars = users.map(user => ({
      ...user,
      initials: user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'U',
      avatarBg: 'bg-brand-orange text-white'
    }));

    res.render('settings', {
      title: 'Settings',
      settings: settings.toObject(),
      users: usersWithAvatars,
      activeTab: req.query.tab || 'my-profile'
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).render('settings', {
      title: 'Settings',
      settings: {},
      users: [],
      error: 'Error loading settings',
      activeTab: req.query.tab || 'my-profile'
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.session.userId;


    const { dealershipName, dealershipLocation, dealershipPhone, dealershipEmail, hours } = req.body;

    let settings = await Settings.findOne({ userId });

    if (!settings) {
      settings = new Settings({ userId });
    }

    if (dealershipName !== undefined) settings.dealershipName = dealershipName;
    if (dealershipLocation !== undefined) settings.dealershipLocation = dealershipLocation;
    if (dealershipPhone !== undefined) settings.dealershipPhone = dealershipPhone;
    if (dealershipEmail !== undefined) settings.dealershipEmail = dealershipEmail;

    // Handle hours array
    if (hours) {
      const hoursArray = [];
      if (Array.isArray(hours)) {
        // If hours is already an array
        hours.forEach((hr, index) => {
          if (hr.days) {
            hoursArray.push({
              days: hr.days,
              hours: hr.hours || 'Closed',
              status: hr.status || 'closed'
            });
          }
        });
      } else if (typeof hours === 'object') {
        // If hours is an object with numeric keys (from form)
        Object.keys(hours).forEach(key => {
          const hr = hours[key];
          if (hr && hr.days) {
            hoursArray.push({
              days: hr.days,
              hours: hr.hours || 'Closed',
              status: hr.status || 'closed'
            });
          }
        });
      }
      if (hoursArray.length > 0) {
        settings.hours = hoursArray;
      }
    }

    await settings.save();

    // Return JSON for AJAX requests, redirect for standard form submissions
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.json({ success: true, message: 'Profile updated successfully' });
    } else {
      return res.redirect('/settings?tab=dealership-profile&success=profile');
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.json({ success: false, message: 'Error updating profile. Please try again.' });
    } else {
      return res.redirect('/settings?tab=dealership-profile&error=profile');
    }
  }
};

exports.updateCRMConfig = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { defaultLeadStatus, autoAssignLeads, followUpReminderDays, leadAssignmentMethod, pipelineStages } = req.body;

    let settings = await Settings.findOne({ userId });

    if (!settings) {
      settings = new Settings({ userId });
    }

    // Parse pipelineStages
    let stagesArray = ['New', 'Contacted', 'Interested', 'Test Ride Booked', 'Negotiation', 'Sold', 'Lost'];
    if (pipelineStages) {
      stagesArray = pipelineStages.split(',').map(s => s.trim()).filter(Boolean);
    }

    // Store CRM configuration
    settings.crmConfig = {
      defaultLeadStatus: defaultLeadStatus || 'New',
      autoAssignLeads: autoAssignLeads === 'true' || autoAssignLeads === true,
      followUpReminderDays: parseInt(followUpReminderDays) || 3,
      leadAssignmentMethod: leadAssignmentMethod || 'Round Robin',
      pipelineStages: stagesArray
    };

    await settings.save();

    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.json({ success: true, message: 'CRM configuration updated successfully' });
    } else {
      return res.redirect('/settings?tab=crm-configurations&success=crm');
    }
  } catch (error) {
    console.error('Error updating CRM config:', error);
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.json({ success: false, message: 'Error updating CRM configuration. Please try again.' });
    } else {
      return res.redirect('/settings?tab=crm-configurations&error=crm');
    }
  }
};

exports.updateSecurity = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { twoFactorEnabled, sessionTimeout } = req.body;

    let settings = await Settings.findOne({ userId });

    if (!settings) {
      settings = new Settings({ userId });
    }

    settings.twoFactorEnabled = twoFactorEnabled === 'true';
    settings.sessionTimeout = (parseInt(sessionTimeout) * 60) || 3600;

    await settings.save();
    
    // Sync timeout in active session
    req.session.sessionTimeout = settings.sessionTimeout;

    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.json({ success: true, message: 'Security settings updated successfully' });
    } else {
      return res.redirect('/settings?tab=security&success=security');
    }
  } catch (error) {
    console.error('Error updating security:', error);
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.json({ success: false, message: 'Error updating security settings. Please try again.' });
    } else {
      return res.redirect('/settings?tab=security&error=security');
    }
  }
};

exports.updateTheme = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { theme } = req.body;

    if (!['light', 'dark'].includes(theme)) {
      return res.status(400).json({ success: false, error: 'Invalid theme' });
    }

    let settings = await Settings.findOne({ userId });

    if (!settings) {
      settings = new Settings({ userId, theme });
    } else {
      settings.theme = theme;
    }

    await settings.save();

    res.json({ success: true, theme });
  } catch (error) {
    console.error('Error updating theme:', error);
    res.status(500).json({ success: false, error: 'Error updating theme' });
  }
};

exports.updateNotifications = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { email, sms, pushNotifications, newLeads, followUpReminders, testRideAlerts, systemNotifications } = req.body;

    let settings = await Settings.findOne({ userId });

    if (!settings) {
      settings = new Settings({ userId });
    }

    settings.notifications = {
      email: email === 'true' || email === 'on' || email === true,
      sms: sms === 'true' || sms === 'on' || sms === true,
      pushNotifications: pushNotifications === 'true' || pushNotifications === 'on' || pushNotifications === true,
      newLeads: newLeads === 'true' || newLeads === 'on' || newLeads === true,
      followUpReminders: followUpReminders === 'true' || followUpReminders === 'on' || followUpReminders === true,
      testRideAlerts: testRideAlerts === 'true' || testRideAlerts === 'on' || testRideAlerts === true,
      systemNotifications: systemNotifications === 'true' || systemNotifications === 'on' || systemNotifications === true
    };

    await settings.save();

    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.json({ success: true, message: 'Notification preferences updated successfully' });
    } else {
      return res.redirect('/settings?tab=notifications&success=notifications');
    }
  } catch (error) {
    console.error('Error updating notifications:', error);
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.json({ success: false, message: 'Error updating notifications. Please try again.' });
    } else {
      return res.redirect('/settings?tab=notifications&error=notifications');
    }
  }
};

exports.toggleNotification = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { type } = req.params;

    let settings = await Settings.findOne({ userId });

    if (!settings) {
      settings = new Settings({ userId });
    }

    if (type in settings.notifications) {
      settings.notifications[type] = !settings.notifications[type];
      await settings.save();
    }

    res.json({ success: true, notifications: settings.notifications });
  } catch (error) {
    console.error('Error toggling notification:', error);
    res.status(500).json({ success: false, error: 'Error toggling notification' });
  }
};

exports.toggleIntegration = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { name } = req.params;

    let settings = await Settings.findOne({ userId });

    if (!settings) {
      settings = new Settings({ userId });
    }

    // Handle new integration structure
    if (name === 'googleCalendar') {
      settings.integrations.googleCalendar.enabled = !settings.integrations.googleCalendar.enabled;
    } else if (name === 'whatsapp') {
      settings.integrations.whatsapp.enabled = !settings.integrations.whatsapp.enabled;
    } else if (name === 'sms') {
      settings.integrations.sms.enabled = !settings.integrations.sms.enabled;
    } else if (name in settings.integrations) {
      settings.integrations[name] = !settings.integrations[name];
    }

    await settings.save();

    res.json({ success: true, integrations: settings.integrations });
  } catch (error) {
    console.error('Error toggling integration:', error);
    res.status(500).json({ success: false, error: 'Error toggling integration' });
  }
};

exports.updateIntegrations = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { googleCalendar, whatsapp, sms } = req.body;

    let settings = await Settings.findOne({ userId });

    if (!settings) {
      settings = new Settings({ userId });
    }

    // Update Google Calendar settings
    if (googleCalendar) {
      settings.integrations.googleCalendar.enabled = googleCalendar.enabled === true || googleCalendar.enabled === 'true';
      if (googleCalendar.calendarId) {
        settings.integrations.googleCalendar.calendarId = googleCalendar.calendarId;
      }
    }

    // Update WhatsApp settings
    if (whatsapp) {
      settings.integrations.whatsapp.enabled = whatsapp.enabled === true || whatsapp.enabled === 'true';
      if (whatsapp.apiKey) {
        settings.integrations.whatsapp.apiKey = whatsapp.apiKey;
      }
      if (whatsapp.phoneNumberId) {
        settings.integrations.whatsapp.phoneNumberId = whatsapp.phoneNumberId;
      }
    }

    // Update SMS settings
    if (sms) {
      settings.integrations.sms.enabled = sms.enabled === true || sms.enabled === 'true';
      if (sms.accountSid) {
        settings.integrations.sms.accountSid = sms.accountSid;
      }
      if (sms.authToken) {
        settings.integrations.sms.authToken = sms.authToken;
      }
      if (sms.phoneNumber) {
        settings.integrations.sms.phoneNumber = sms.phoneNumber;
      }
    }

    await settings.save();

    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.json({ success: true, message: 'Integration settings updated successfully' });
    } else {
      return res.redirect('/settings?tab=integrations&success=integrations');
    }
  } catch (error) {
    console.error('Error updating integrations:', error);
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.json({ success: false, message: 'Error updating integration settings. Please try again.' });
    } else {
      return res.redirect('/settings?tab=integrations&error=integrations');
    }
  }
};

// User Management Actions
exports.inviteUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
        return res.status(400).json({ success: false, message: 'User with this email already exists.' });
      } else {
        return res.redirect('/settings?tab=user-management&error=exists');
      }
    }

    const newUser = new User({
      name,
      email,
      password, // Password pre-save hook will hash it automatically!
      role,
      phone: phone || '',
      status: 'Active'
    });

    await newUser.save();

    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.json({ success: true, message: 'User invited successfully.' });
    } else {
      return res.redirect('/settings?tab=user-management&success=invite');
    }
  } catch (error) {
    console.error('Error inviting user:', error);
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.status(500).json({ success: false, message: 'Error inviting user. Please try again.' });
    } else {
      return res.redirect('/settings?tab=user-management&error=invite');
    }
  }
};

exports.editUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.name = name;
    user.phone = phone || '';
    await user.save();

    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.json({ success: true, message: 'User updated successfully' });
    } else {
      return res.redirect('/settings?tab=user-management&success=edit-user');
    }
  } catch (error) {
    console.error('Error editing user:', error);
    return res.status(500).json({ success: false, message: 'Error editing user' });
  }
};

exports.changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['Admin', 'Manager', 'Sales Executive'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.role = role;
    await user.save();

    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.json({ success: true, message: 'Role changed successfully' });
    } else {
      return res.redirect('/settings?tab=user-management&success=role-changed');
    }
  } catch (error) {
    console.error('Error changing role:', error);
    return res.status(500).json({ success: false, message: 'Error changing role' });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.status = user.status === 'Active' ? 'Inactive' : 'Active';
    await user.save();

    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.json({ success: true, message: `User status changed to ${user.status}` });
    } else {
      return res.redirect('/settings?tab=user-management&success=status-toggled');
    }
  } catch (error) {
    console.error('Error toggling user status:', error);
    return res.status(500).json({ success: false, message: 'Error toggling user status' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await User.findByIdAndDelete(id);

    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.json({ success: true, message: 'User deleted successfully' });
    } else {
      return res.redirect('/settings?tab=user-management&success=user-deleted');
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ success: false, message: 'Error deleting user' });
  }
};

exports.bulkDeleteUsers = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No user IDs provided.' });
    }
    await User.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `${ids.length} user(s) deleted successfully.` });
  } catch (error) {
    console.error('Error bulk deleting users:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

exports.getNotificationList = async (req, res) => {
  try {
    const userId = req.session.userId;
    let settings = await Settings.findOne({ userId });
    
    // Default notifications preferences if no settings found
    const prefs = settings ? settings.notifications : {
      email: true,
      sms: false,
      pushNotifications: true,
      newLeads: true,
      followUpReminders: true,
      testRideAlerts: true,
      systemNotifications: true
    };

    const activities = await Activity.find().sort({ createdAt: -1 }).limit(20).lean();

    const filtered = activities.filter(act => {
      if (act.type === 'lead_added') return prefs.newLeads;
      if (act.type === 'test_ride') return prefs.testRideAlerts;
      if (act.type === 'system') {
        if (act.title.toLowerCase().includes('follow-up') || act.description.toLowerCase().includes('follow-up')) {
          return prefs.followUpReminders;
        }
        return prefs.systemNotifications;
      }
      if (act.type === 'bike_sold') return prefs.systemNotifications;
      return true;
    });

    res.json({ success: true, notifications: filtered });
  } catch (error) {
    console.error('Error fetching notification list:', error);
    res.status(500).json({ success: false, error: 'Error fetching notifications' });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { name, email, phone, avatar } = req.body;

    if (!name || name.trim().length < 2) {
      if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
        return res.status(400).json({ success: false, message: 'Name must be at least 2 characters.' });
      }
      return res.redirect('/settings?tab=my-profile&error=validation');
    }

    if (!email || !email.includes('@')) {
      if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
        return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
      }
      return res.redirect('/settings?tab=my-profile&error=validation');
    }

    // Check if email already taken by another user
    const existingUser = await User.findOne({ email: email.toLowerCase(), _id: { $ne: userId } });
    if (existingUser) {
      if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
        return res.status(400).json({ success: false, message: 'Email address is already in use by another account.' });
      }
      return res.redirect('/settings?tab=my-profile&error=exists');
    }

    const user = await User.findById(userId);
    if (!user) {
      if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
        return res.status(404).json({ success: false, message: 'User account not found.' });
      }
      return res.redirect('/settings?tab=my-profile&error=not_found');
    }

    if (avatar && avatar.trim().startsWith('data:')) {
      // Validate Base64 size and format
      const matches = avatar.trim().match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (!matches) {
        if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
          return res.status(400).json({ success: false, message: 'Invalid image format.' });
        }
        return res.redirect('/settings?tab=my-profile&error=validation');
      }
      const mimeType = matches[1];
      const base64Data = matches[2];
      
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!allowedMimeTypes.includes(mimeType)) {
        if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
          return res.status(400).json({ success: false, message: 'Only JPG, PNG and WEBP formats are allowed.' });
        }
        return res.redirect('/settings?tab=my-profile&error=validation');
      }

      // Calculate size in bytes
      const approxSizeBytes = (base64Data.length * 3) / 4;
      const maxSizeBytes = 2 * 1024 * 1024; // 2MB
      if (approxSizeBytes > maxSizeBytes) {
        if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
          return res.status(400).json({ success: false, message: 'Profile image size must be less than 2MB.' });
        }
        return res.redirect('/settings?tab=my-profile&error=validation');
      }
    }

    user.name = name.trim();
    user.email = email.toLowerCase().trim();
    user.phone = (phone || '').trim();
    user.avatar = (avatar || '').trim();

    await user.save();

    // Log profile update activity
    const activity = new Activity({
      title: `Profile Updated: ${user.name}`,
      description: `User ${user.name} updated their personal profile details.`,
      type: 'system'
    });
    await activity.save();

    // Sync session variables
    req.session.userName = user.name;
    req.session.userEmail = user.email;
    req.session.userPhone = user.phone || '';
    req.session.userAvatar = user.avatar || '';

    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.json({ success: true, message: 'Your profile has been updated successfully.' });
    } else {
      return res.redirect('/settings?tab=my-profile&success=profile_updated');
    }
  } catch (error) {
    console.error('Error updating personal profile:', error);
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.status(500).json({ success: false, message: 'Server error updating profile. Please try again.' });
    } else {
      return res.redirect('/settings?tab=my-profile&error=profile_failed');
    }
  }
};

