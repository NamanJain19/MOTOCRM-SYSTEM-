const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load env
dotenv.config();

const User = require('./models/User');
const Settings = require('./models/Settings');

async function debug() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/motocrm';
  console.log(`Connecting to: ${uri}`);
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB.');

    // Attempt to register a user
    const testEmail = 'debuguser_' + Math.random().toString(36).substring(2, 8) + '@example.com';
    console.log(`Trying to register: ${testEmail}`);

    const newUser = new User({
      name: 'Debug User',
      email: testEmail,
      password: 'debugpassword',
      role: 'Sales Executive'
    });

    console.log('Saving User...');
    await newUser.save();
    console.log('User saved successfully. ID:', newUser._id);

    console.log('Saving Settings...');
    const settings = new Settings({
      userId: newUser._id,
      dealershipName: 'MotoCRM Pro',
      dealershipLocation: 'New York',
      theme: 'light'
    });

    await settings.save();
    console.log('Settings saved successfully.');

    // Cleanup
    await User.findByIdAndDelete(newUser._id);
    await Settings.findOneAndDelete({ userId: newUser._id });
    console.log('Cleaned up debug documents.');

  } catch (error) {
    console.error('DEBUG ERROR:', error);
  } finally {
    await mongoose.connection.close();
    console.log('DB connection closed.');
  }
}

debug();
