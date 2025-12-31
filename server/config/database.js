const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ordin', {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    // Don't exit process in dev mode to allow nodemon to restart cleanly
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
  }
};

module.exports = connectDB;
