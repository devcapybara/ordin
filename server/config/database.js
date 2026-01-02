const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const dbURI = process.env.MONGODB_URI;

    if (!dbURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(dbURI, {
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
