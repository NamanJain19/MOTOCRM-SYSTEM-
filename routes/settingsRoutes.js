const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { isAuthenticated } = require('../middleware/auth');
const { validateSettings } = require('../middleware/validation');

router.get('/', isAuthenticated, settingsController.getSettings);
router.post('/profile', isAuthenticated, validateSettings, settingsController.updateProfile);
router.post('/my-profile', isAuthenticated, settingsController.updateMyProfile);
router.post('/crm-config', isAuthenticated, settingsController.updateCRMConfig);
router.post('/security', isAuthenticated, settingsController.updateSecurity);
router.post('/theme', isAuthenticated, settingsController.updateTheme);
router.get('/notifications/list', isAuthenticated, settingsController.getNotificationList);
router.post('/notifications', isAuthenticated, settingsController.updateNotifications);
router.post('/notifications/:type', isAuthenticated, settingsController.toggleNotification);

router.post('/integrations/:name', isAuthenticated, settingsController.toggleIntegration);
router.post('/integrations', isAuthenticated, settingsController.updateIntegrations);

// User Management Routes
router.post('/users/invite', isAuthenticated, settingsController.inviteUser);
router.post('/users/edit/:id', isAuthenticated, settingsController.editUser);
router.post('/users/change-role/:id', isAuthenticated, settingsController.changeUserRole);
router.post('/users/toggle-status/:id', isAuthenticated, settingsController.toggleUserStatus);
router.post('/users/delete/:id', isAuthenticated, settingsController.deleteUser);
router.post('/users/bulk-delete', isAuthenticated, settingsController.bulkDeleteUsers);


module.exports = router;
