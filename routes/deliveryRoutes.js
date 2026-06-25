const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const { isAuthenticated } = require('../middleware/auth');

router.get('/', isAuthenticated, deliveryController.getDeliveries);
router.get('/add', isAuthenticated, deliveryController.getAddDelivery);
router.post('/add', isAuthenticated, deliveryController.createDelivery);
router.get('/edit/:id', isAuthenticated, deliveryController.getEditDelivery);
router.post('/edit/:id', isAuthenticated, deliveryController.updateDelivery);
router.post('/delete/:id', isAuthenticated, deliveryController.deleteDelivery);

module.exports = router;
