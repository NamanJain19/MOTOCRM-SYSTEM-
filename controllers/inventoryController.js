const Inventory = require('../models/Inventory');
const Activity = require('../models/Activity');

// List inventory and show stock summaries
exports.getInventory = async (req, res) => {
  try {
    const inventoryItems = await Inventory.find().sort({ bikeModel: 1 });

    // Calculate quick stats
    let totalModels = inventoryItems.length;
    let totalStock = 0;
    let totalReserved = 0;
    let totalSold = 0;
    let lowStockCount = 0;

    inventoryItems.forEach(item => {
      totalStock += item.stockQuantity;
      totalReserved += item.reservedBikes;
      totalSold += item.soldBikes;
      if (item.stockQuantity <= item.lowStockThreshold) {
        lowStockCount++;
      }
    });

    res.render('inventory/index', {
      title: 'Inventory Management',
      inventoryItems,
      stats: {
        totalModels,
        totalStock,
        totalReserved,
        totalSold,
        lowStockCount
      },
      error: null
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).send('Internal Server Error');
  }
};

// Create a new inventory item
exports.createInventory = async (req, res) => {
  try {
    const { bikeModel, stockQuantity, reservedBikes, soldBikes, lowStockThreshold } = req.body;

    // Check if model already exists
    const existing = await Inventory.findOne({ bikeModel: bikeModel.trim() });
    if (existing) {
      const inventoryItems = await Inventory.find().sort({ bikeModel: 1 });
      let totalModels = inventoryItems.length;
      let totalStock = 0;
      let totalReserved = 0;
      let totalSold = 0;
      let lowStockCount = 0;

      inventoryItems.forEach(item => {
        totalStock += item.stockQuantity;
        totalReserved += item.reservedBikes;
        totalSold += item.soldBikes;
        if (item.stockQuantity <= item.lowStockThreshold) {
          lowStockCount++;
        }
      });

      return res.render('inventory/index', {
        title: 'Inventory Management',
        inventoryItems,
        stats: {
          totalModels,
          totalStock,
          totalReserved,
          totalSold,
          lowStockCount
        },
        error: `Bike model "${bikeModel}" already exists in inventory.`
      });
    }

    const newItem = new Inventory({
      bikeModel: bikeModel.trim(),
      stockQuantity: Number(stockQuantity) || 0,
      reservedBikes: Number(reservedBikes) || 0,
      soldBikes: Number(soldBikes) || 0,
      lowStockThreshold: Number(lowStockThreshold) || 2
    });

    await newItem.save();

    // Log Activity
    const activity = new Activity({
      title: `Inventory item added: ${bikeModel}`,
      description: `Added "${bikeModel}" with ${stockQuantity} units to the catalog.`,
      type: 'system'
    });
    await activity.save();

    res.redirect('/inventory');
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).send('Internal Server Error');
  }
};

// Render edit form
exports.getEditInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Inventory.findById(id);
    if (!item) {
      return res.status(404).send('Inventory item not found');
    }

    res.render('inventory/edit', {
      title: 'Edit Inventory Item',
      item,
      error: null
    });
  } catch (error) {
    console.error('Error getting edit inventory:', error);
    res.status(500).send('Internal Server Error');
  }
};

// Update an inventory item
exports.updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { bikeModel, stockQuantity, reservedBikes, soldBikes, lowStockThreshold } = req.body;

    // Check if model name already exists on another item
    const existing = await Inventory.findOne({ bikeModel: bikeModel.trim(), _id: { $ne: id } });
    if (existing) {
      const item = await Inventory.findById(id);
      return res.render('inventory/edit', {
        title: 'Edit Inventory Item',
        item,
        error: `Bike model "${bikeModel}" is already in use by another item.`
      });
    }

    const item = await Inventory.findById(id);
    if (!item) {
      return res.status(404).send('Inventory item not found');
    }

    // Determine if sold quantity increased
    const soldDiff = (Number(soldBikes) || 0) - item.soldBikes;

    item.bikeModel = bikeModel.trim();
    item.stockQuantity = Number(stockQuantity) || 0;
    item.reservedBikes = Number(reservedBikes) || 0;
    item.soldBikes = Number(soldBikes) || 0;
    item.lowStockThreshold = Number(lowStockThreshold) || 2;

    await item.save();

    // Log Activity
    if (soldDiff > 0) {
      const activity = new Activity({
        title: `${soldDiff} bike(s) sold: ${bikeModel}`,
        description: `Updated stock records: sold count increased by ${soldDiff} for "${bikeModel}".`,
        type: 'bike_sold'
      });
      await activity.save();
    } else {
      const activity = new Activity({
        title: `Inventory updated: ${bikeModel}`,
        description: `Modified stock configuration for "${bikeModel}".`,
        type: 'system'
      });
      await activity.save();
    }

    res.redirect('/inventory');
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).send('Internal Server Error');
  }
};

// Delete inventory item
exports.deleteInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Inventory.findByIdAndDelete(id);

    if (item) {
      const activity = new Activity({
        title: `Inventory deleted: ${item.bikeModel}`,
        description: `Removed "${item.bikeModel}" from catalog databases.`,
        type: 'system'
      });
      await activity.save();
    }

    res.redirect('/inventory');
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).send('Internal Server Error');
  }
};
