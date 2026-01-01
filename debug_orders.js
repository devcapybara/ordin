const mongoose = require('mongoose');
const Order = require('./server/models/Order');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

const checkOrders = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const count = await Order.countDocuments();
    console.log(`Total Orders in DB: ${count}`);

    const lastOrders = await Order.find().sort({ createdAt: -1 }).limit(5);
    console.log('Last 5 Orders:');
    lastOrders.forEach(o => {
      console.log(`ID: ${o._id}, Status: ${o.status}, Date: ${o.createdAt}, Restaurant: ${o.restaurantId}`);
    });

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

checkOrders();
