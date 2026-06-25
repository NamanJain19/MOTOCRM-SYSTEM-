const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const Lead = require('./models/Lead');
const Activity = require('./models/Activity');
const Task = require('./models/Task');
const User = require('./models/User');
const Settings = require('./models/Settings');
const TestRide = require('./models/TestRide');
const Inventory = require('./models/Inventory');

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/motocrm';

const seedData = async () => {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB for seeding.');

    // Clear existing collections
    await User.deleteMany({});
    await Settings.deleteMany({});
    await Lead.deleteMany({});
    await Activity.deleteMany({});
    await Task.deleteMany({});
    await TestRide.deleteMany({});
    await Inventory.deleteMany({});
    console.log('Cleared existing data.');

    // 1. Create initial users with hashed passwords
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const users = [
      {
        name: 'James Decker',
        email: 'admin@motocrm.pro',
        password: hashedPassword,
        role: 'Admin',
        phone: '+1 (555) 999-0000',
        status: 'Active'
      },
      {
        name: 'Sarah Rossi',
        email: 'sales@motocrm.pro',
        password: hashedPassword,
        role: 'Manager',
        phone: '+1 (555) 888-1111',
        status: 'Active'
      },
      {
        name: 'Mike Thompson',
        email: 'mike@motocrm.pro',
        password: hashedPassword,
        role: 'Sales Executive',
        phone: '+1 (555) 777-2222',
        status: 'Active'
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log('Seeded users.');

    // 2. Create default settings for each user (simplified)
    try {
      const settingsArray = createdUsers.map(user => ({
        userId: user._id,
        dealershipName: 'Harley-Davidson NYC',
        dealershipLocation: '370 10th Ave, New York',
        dealershipPhone: '+1 (212) 555-0100',
        dealershipEmail: 'info@hd-nyc.com',
        theme: 'light'
      }));

      await Settings.insertMany(settingsArray);
      console.log('Seeded settings.');
    } catch (settingsErr) {
      console.warn('Warning: Settings seeding skipped:', settingsErr.message);
    }

    // Define dates relative to now
    const now = new Date();
    const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);

    // 1. Seed Leads
    const leads = [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1 (555) 123-4567',
        alternativeContact: '+1 (555) 111-2222',
        homeAddress: '123 Chrome Street, Liberty City, NY',
        bikeModel: 'Pan America™ 1250 Special',
        preferredColor: 'Baja Orange',
        conditionPreference: 'New',
        city: 'New York',
        leadSource: 'Website',
        status: 'New',
        targetBudget: 22000,
        financingInterest: 'No',
        preferredContactMethod: 'Email',
        followUpDate: tomorrow,
        notes: 'Interested in 2024 Road Glide. Budget: $25k.'
      },
      {
        name: 'James Rodriguez',
        email: 'james.r@gmail.com',
        phone: '+1 (555) 345-6789',
        bikeModel: 'Street Glide® ST',
        preferredColor: 'Gunship Gray',
        city: 'Brooklyn',
        leadSource: 'Walk-in',
        status: 'Test Ride Booked',
        targetBudget: 29900,
        financingInterest: 'Yes',
        preferredContactMethod: 'Phone',
        followUpDate: today,
        notes: 'Urgent follow up for Street Glide test ride at 2:30 PM today.'
      },
      {
        name: 'Sarah Rodriguez',
        email: 's.rod@gmail.com',
        phone: '+1 (555) 456-7890',
        bikeModel: 'Nightster™ Special',
        preferredColor: 'Redline Red',
        city: 'Queens',
        leadSource: 'Referral',
        status: 'Negotiation',
        targetBudget: 14500,
        financingInterest: 'Yes',
        preferredContactMethod: 'SMS',
        followUpDate: yesterday,
        notes: 'Negotiating trade-in and final purchase terms.'
      },
      {
        name: 'Liam Brown',
        email: 'liam.b@service.com',
        phone: '+1 (555) 789-0123',
        bikeModel: 'Road Glide® Special',
        preferredColor: 'Vivid Black',
        city: 'Staten Island',
        leadSource: 'Website',
        status: 'Sold',
        targetBudget: 31000,
        financingInterest: 'No',
        preferredContactMethod: 'Email',
        followUpDate: twoDaysAgo,
        notes: 'Closed sale. Bike delivered, customer highly satisfied.'
      },
      {
        name: 'Sarah Jenkins',
        email: 'sjenkins@gmail.com',
        phone: '+1 (555) 901-2345',
        bikeModel: 'Pan America™ 1250',
        city: 'Bronx',
        leadSource: 'Facebook',
        status: 'Contacted',
        followUpDate: today,
        notes: 'Sent brochure. Set up initial call.'
      },
      {
        name: 'Mike Thompson',
        email: 'mike.t@yahoo.com',
        phone: '+1 (555) 234-5678',
        bikeModel: 'Fat Boy® 114',
        city: 'Manhattan',
        leadSource: 'Instagram',
        status: 'Interested',
        followUpDate: today,
        notes: 'Needs financing documentation pickup.'
      },
      {
        name: 'Marcus F.',
        email: 'marcus.f@gmail.com',
        phone: '+1 (555) 876-5432',
        bikeModel: 'Low Rider™ ST',
        city: 'Long Island',
        leadSource: 'Walk-in',
        status: 'Interested',
        followUpDate: twoDaysAgo,
        notes: 'Will check with wife about colors'
      },
      {
        name: 'Leon S.',
        email: 'leon.s@raccoon.org',
        phone: '+1 (555) 765-4321',
        bikeModel: 'Street Bob™ 114',
        city: 'Brooklyn',
        leadSource: 'Website',
        status: 'Contacted',
        followUpDate: yesterday,
        notes: 'Waiting on trade-in value from appraiser'
      },
      {
        name: 'Amy Zhang',
        email: 'amy.z@mail.com',
        phone: '+1 (555) 654-3210',
        bikeModel: 'Low Rider™ S',
        city: 'Flushing',
        leadSource: 'Instagram',
        status: 'Negotiation',
        followUpDate: yesterday,
        notes: 'Finalize credit app for Low Rider S'
      },
      {
        name: 'David Miller',
        email: 'david.miller@gmail.com',
        phone: '+1 (555) 321-0987',
        bikeModel: 'Sportster™ S',
        city: 'Manhattan',
        leadSource: 'Walk-in',
        status: 'Interested',
        followUpDate: today,
        notes: 'Trade-in appraisal completed.'
      }
    ];

    const seededLeads = await Lead.insertMany(leads);
    console.log(`Seeded ${seededLeads.length} leads.`);

    // Map names to IDs for reference
    const leadMap = {};
    seededLeads.forEach(l => {
      leadMap[l.name] = l._id;
    });

    // 2. Seed Activities
    const activities = [
      {
        title: 'New lead added: John Doe',
        description: 'Interested in 2024 Road Glide. Budget: $25k.',
        type: 'lead_added',
        createdAt: tenMinsAgo
      },
      {
        title: 'Test ride scheduled: Ducati Panigale V4',
        description: 'Client: Sarah Williams. Scheduled for Saturday at 10 AM.',
        type: 'test_ride',
        createdAt: twoHoursAgo
      },
      {
        title: 'Bike sold: Harley-Davidson Iron 883',
        description: 'Sale closed by Mike Thompson. Final price: $11,200.',
        type: 'bike_sold',
        createdAt: fourHoursAgo
      },
      {
        title: 'System Maintenance Completed',
        description: 'Lead database synced with national HQ servers.',
        type: 'system',
        createdAt: sixHoursAgo
      }
    ];

    await Activity.insertMany(activities);
    console.log('Seeded activities.');

    // 3. Seed Tasks
    const tasks = [
      {
        lead: leadMap['James Rodriguez'],
        title: 'Test Ride: Street Glide ST',
        description: 'Customer: James Rodriguez • 2:30 PM',
        dueDate: today,
        priority: 'URGENT',
        status: 'Pending'
      },
      {
        lead: leadMap['Sarah Jenkins'],
        title: 'Initial Lead Follow-up',
        description: 'Customer: Sarah Jenkins • Inquiry on Pan America 1250',
        dueDate: today,
        priority: 'HIGH',
        status: 'Pending'
      },
      {
        lead: leadMap['Mike Thompson'],
        title: 'Finance Documentation Pickup',
        description: 'Customer: Mike Thompson • Fat Boy 114 Finance Pack',
        dueDate: today,
        priority: 'NORMAL',
        status: 'Pending'
      },
      {
        lead: leadMap['David Miller'],
        title: 'Outbound Call: David Miller regarding Trade-In Appraisal',
        description: 'Completed trade-in value estimate review.',
        dueDate: today,
        priority: 'NORMAL',
        status: 'Completed',
        completedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000)
      },
      {
        lead: leadMap['Marcus F.'],
        title: 'Marcus F. - Call Back',
        description: 'Will check with wife about colors',
        dueDate: twoDaysAgo,
        priority: 'HIGH',
        status: 'Pending'
      },
      {
        lead: leadMap['Leon S.'],
        title: 'Leon S. - Price Quote',
        description: 'Waiting on trade-in value from...',
        dueDate: yesterday,
        priority: 'HIGH',
        status: 'Pending'
      },
      {
        lead: leadMap['Amy Zhang'],
        title: 'Amy Zhang - Finance',
        description: 'Finalize credit app for Low Rider S',
        dueDate: yesterday,
        priority: 'HIGH',
        status: 'Pending'
      }
    ];

    await Task.insertMany(tasks);
    console.log('Seeded tasks.');

    // 4. Seed Inventory
    const inventoryData = [
      {
        bikeModel: 'Pan America™ 1250 Special',
        stockQuantity: 5,
        reservedBikes: 2,
        soldBikes: 3,
        lowStockThreshold: 2
      },
      {
        bikeModel: 'Street Glide® ST',
        stockQuantity: 8,
        reservedBikes: 1,
        soldBikes: 4,
        lowStockThreshold: 3
      },
      {
        bikeModel: 'Low Rider™ S',
        stockQuantity: 1,
        reservedBikes: 0,
        soldBikes: 2,
        lowStockThreshold: 2
      }
    ];
    await Inventory.insertMany(inventoryData);
    console.log('Seeded inventory.');

    // 5. Seed Test Rides
    const testRidesData = [
      {
        lead: leadMap['James Rodriguez'],
        date: today,
        salesperson: 'Mike Thompson',
        status: 'Scheduled'
      },
      {
        lead: leadMap['Liam Brown'],
        date: yesterday,
        salesperson: 'Sarah Rossi',
        status: 'Completed'
      }
    ];
    await TestRide.insertMany(testRidesData);
    console.log('Seeded test rides.');

    console.log('Database seeding successfully finished.');
    process.exit(0);
  } catch (error) {
    console.error(`Error during seeding: ${error.message}`);
    process.exit(1);
  }
};

seedData();
