const mongoose = require('mongoose');
require('dotenv').config();

const deliveryController = require('../controllers/deliveryController');
const leadController = require('../controllers/leadController');

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/motocrm');
    console.log("Connected successfully!");

    // Mock response
    const mockRes = {
      render: (view, data) => {
        console.log(`\nRendered view: ${view}`);
        console.log("Render data keys:", Object.keys(data));
        if (data.inventory) {
          console.log("Inventory items count passed to template:", data.inventory.length);
          console.log("Inventory items:", data.inventory.map(i => i.bikeModel));
        }
      },
      status: (code) => ({
        send: (msg) => console.log(`Status ${code}: ${msg}`)
      })
    };

    const mockReq = {};

    console.log("\n--- Testing Delivery Module Add Delivery ---");
    await deliveryController.getAddDelivery(mockReq, mockRes);

    console.log("\n--- Testing Lead Module Add Lead ---");
    await leadController.getAddLead(mockReq, mockRes);
    
    await mongoose.disconnect();
    console.log("\nDisconnected successfully!");
  } catch (error) {
    console.error("Verification failed:", error);
  }
}

run();
