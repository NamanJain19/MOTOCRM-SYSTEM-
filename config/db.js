const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/motocrm';
    console.log(`Connecting to MongoDB at: ${uri}`);
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Warning: ${error.message}`);
    console.log('App will continue running, but database operations may fail if local MongoDB is not started.');
  }
};

module.exports = connectDB;
