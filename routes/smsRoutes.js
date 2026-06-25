const express = require('express');
const router = express.Router();
const smsController = require('../controllers/smsController');
const { isAuthenticated } = require('../middleware/auth');

router.post('/send', isAuthenticated, smsController.sendSMS);
router.get('/history', isAuthenticated, smsController.getSMSHistory);

module.exports = router;
