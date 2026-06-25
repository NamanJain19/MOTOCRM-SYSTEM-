const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { isAuthenticated } = require('../middleware/auth');

router.get('/', isAuthenticated, reportController.getReports);
router.get('/data', isAuthenticated, reportController.getReportsData);

module.exports = router;
