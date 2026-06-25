const express = require('express');
const router = express.Router();
const followUpController = require('../controllers/followUpController');
const { isAuthenticated } = require('../middleware/auth');

router.get('/', isAuthenticated, followUpController.getFollowUps);
router.get('/events', isAuthenticated, followUpController.getEvents);
router.post('/done/:id', isAuthenticated, followUpController.markTaskDone);
router.post('/reschedule/:id', isAuthenticated, followUpController.rescheduleTask);
router.post('/missed/:id', isAuthenticated, followUpController.markTaskMissed);
router.post('/call', isAuthenticated, followUpController.logCallActivity);
router.post('/reassign/:id', isAuthenticated, followUpController.reassignTask);
router.post('/reassign-all', isAuthenticated, followUpController.reassignAllOverdueTasks);

module.exports = router;
