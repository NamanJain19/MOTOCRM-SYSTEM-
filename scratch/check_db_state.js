const mongoose = require('mongoose');
require('dotenv').config();

const Inventory = require('../models/Inventory');
const Lead = require('../models/Lead');
const Delivery = require('../models/Delivery');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/motocrm');
    console.log("Connected to database successfully!");

    const inventory = await Inventory.find().lean();
    console.log("\n--- Inventory Models ---");
    inventory.forEach(i => console.log(`- ${i.bikeModel} (Stock: ${i.stock})`));

    const leads = await Lead.find().lean();
    console.log(`\nTotal Leads in DB: ${leads.length}`);
    if (leads.length > 0) {
      console.log("Sample Lead:", leads[0].name, "-", leads[0].bikeModel);
    }

    const deliveries = await Delivery.find().lean();
    console.log(`\nTotal Deliveries in DB: ${deliveries.length}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error("Verification failed:", error);
  }
}

run();
