const express = require('express');
const router = express.Router();
const pipelineController = require('../controllers/pipelineController');
const { isAuthenticated } = require('../middleware/auth');

router.get('/', isAuthenticated, pipelineController.getPipeline);
router.post('/update-status', isAuthenticated, pipelineController.updateLeadStatus);

module.exports = router;
