const mongoose = require('mongoose');

const connectDB = async () => {
  // Skip connecting during tests to avoid open handles
  if (process.env.NODE_ENV === 'test') return;
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
