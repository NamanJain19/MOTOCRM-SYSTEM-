const mongoose = require('mongoose');
require('dotenv').config();

const Inventory = require('../models/Inventory');
const Lead = require('../models/Lead');
const Delivery = require('../models/Delivery');

const leadController = require('../controllers/leadController');
const deliveryController = require('../controllers/deliveryController');

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/motocrm');
    console.log("Connected successfully!");

    // 1. Delete any existing "Royal Enfield Classic 350" model
    console.log("\nCleaning up any existing test bike model...");
    await Inventory.deleteOne({ bikeModel: "Royal Enfield Classic 350" });

    // 2. Add "Royal Enfield Classic 350"
    console.log("Adding new test model 'Royal Enfield Classic 350' with colors and active status...");
    const testItem = new Inventory({
      bikeModel: "Royal Enfield Classic 350",
      stockQuantity: 25,
      reservedBikes: 0,
      soldBikes: 0,
      lowStockThreshold: 2,
      colors: ["Black", "Red", "Blue", "Grey", "Silver"],
      status: "Active"
    });
    await testItem.save();
    console.log("Inserted test bike model successfully!");

    // 3. Verify in database
    const fetched = await Inventory.findOne({ bikeModel: "Royal Enfield Classic 350" }).lean();
    console.log("\n--- Verification: Database Document ---");
    console.log("Model Name:", fetched.bikeModel);
    console.log("Colors:", fetched.colors);
    console.log("Status:", fetched.status);
    console.log("Stock:", fetched.stockQuantity);

    // 4. Mock controller verification for Leads module
    console.log("\n--- Verification: Lead Controller (Add Lead) ---");
    const mockResLead = {
      render: (view, data) => {
        console.log(`Rendered view: ${view}`);
        const found = (data.inventory || []).find(i => i.bikeModel === "Royal Enfield Classic 350");
        if (found) {
          console.log(`✔ Found 'Royal Enfield Classic 350' in Lead inventory payload!`);
          console.log(`  Colors passed to view:`, found.colors);
        } else {
          console.log(`✖ Test model NOT found in Lead inventory payload.`);
        }
      },
      status: (code) => ({ send: (msg) => console.log(`Status ${code}: ${msg}`) })
    };
    await leadController.getAddLead({}, mockResLead);

    // 5. Mock controller verification for Deliveries module
    console.log("\n--- Verification: Delivery Controller (Add Delivery) ---");
    const mockResDelivery = {
      render: (view, data) => {
        console.log(`Rendered view: ${view}`);
        const found = (data.inventory || []).find(i => i.bikeModel === "Royal Enfield Classic 350");
        if (found) {
          console.log(`✔ Found 'Royal Enfield Classic 350' in Delivery inventory payload!`);
          console.log(`  Colors passed to view:`, found.colors);
        } else {
          console.log(`✖ Test model NOT found in Delivery inventory payload.`);
        }
      },
      status: (code) => ({ send: (msg) => console.log(`Status ${code}: ${msg}`) })
    };
    await deliveryController.getAddDelivery({}, mockResDelivery);

    await mongoose.disconnect();
    console.log("\nTests complete. Disconnected successfully!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

run();
