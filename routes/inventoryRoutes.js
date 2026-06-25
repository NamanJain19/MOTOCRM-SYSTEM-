const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { isAuthenticated } = require('../middleware/auth');

router.get('/', isAuthenticated, inventoryController.getInventory);
router.post('/add', isAuthenticated, inventoryController.createInventory);
router.get('/edit/:id', isAuthenticated, inventoryController.getEditInventory);
router.post('/edit/:id', isAuthenticated, inventoryController.updateInventory);
router.post('/delete/:id', isAuthenticated, inventoryController.deleteInventory);

module.exports = router;
