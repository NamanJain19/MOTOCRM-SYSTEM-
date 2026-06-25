const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { isAuthenticated } = require('../middleware/auth');
const { validateLead } = require('../middleware/validation');

router.get('/', isAuthenticated, leadController.getLeads);
router.get('/add', isAuthenticated, leadController.getAddLead);
router.post('/add', isAuthenticated, validateLead, leadController.createLead);
router.get('/edit/:id', isAuthenticated, leadController.getEditLead);
router.post('/edit/:id', isAuthenticated, validateLead, leadController.updateLead);
router.post('/delete/:id', isAuthenticated, leadController.deleteLead);
router.post('/bulk-delete', isAuthenticated, leadController.bulkDeleteLeads);

module.exports = router;
