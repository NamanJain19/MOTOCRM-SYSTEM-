const express = require('express');
const router = express.Router();
const testRideController = require('../controllers/testRideController');
const { isAuthenticated } = require('../middleware/auth');

router.get('/', isAuthenticated, testRideController.getTestRides);
router.post('/schedule', isAuthenticated, testRideController.createTestRide);
router.post('/update-status/:id', isAuthenticated, testRideController.updateTestRideStatus);
router.post('/delete/:id', isAuthenticated, testRideController.deleteTestRide);

module.exports = router;
