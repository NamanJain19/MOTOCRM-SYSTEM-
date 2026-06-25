const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { isAuthenticated } = require('../middleware/auth');

router.get('/', isAuthenticated, dashboardController.getDashboard);
router.post('/activity/delete/:id', isAuthenticated, dashboardController.deleteActivity);
router.post('/activity/bulk-delete', isAuthenticated, dashboardController.bulkDeleteActivities);

module.exports = router;
