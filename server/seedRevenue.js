const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Restaurant = require('./models/Restaurant');
const Product = require('./models/Product');
const Order = require('./models/Order');

const seedRevenue = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // 1. Find Restaurant
    const restaurant = await Restaurant.findOne({ ownerEmail: 'owner@ordin.com' });
    if (!restaurant) {
        console.log('Restaurant not found. Please run main seed first.');
        process.exit(1);
    }
    console.log(`Seeding revenue for: ${restaurant.name}`);

    // 2. Find Products
    const products = await Product.find({ restaurantId: restaurant._id });
    if (products.length === 0) {
        console.log('No products found.');
        process.exit(1);
    }

    // 3. Create Dummy Orders
    // We'll create orders for:
    // - Today
    // - Yesterday
    // - 5 days ago
    // - Last Month (to test date filtering)

    const ordersToCreate = [];
    let expectedRevenueThisMonth = 0;

    // Helper to create order object
    const createOrder = (dateOffsetDays, itemCount = 2) => {
        const date = new Date();
        date.setDate(date.getDate() - dateOffsetDays);
        
        const items = [];
        let totalAmount = 0;

        for (let i = 0; i < itemCount; i++) {
            const product = products[Math.floor(Math.random() * products.length)];
            const qty = Math.floor(Math.random() * 3) + 1;
            items.push({
                productId: product._id,
                quantity: qty,
                unitPrice: product.price, // Added unitPrice
                status: 'SERVED'
            });
            totalAmount += product.price * qty;
        }

        // Add Tax & Service Charge (Approx)
        totalAmount = Math.floor(totalAmount * 1.16); 

        // Track expected revenue for current month (assuming dateOffset < 30)
        if (dateOffsetDays < 30) {
            expectedRevenueThisMonth += totalAmount;
        }

        return {
            restaurantId: restaurant._id,
            tableNumber: `T-${Math.floor(Math.random() * 10) + 1}`,
            items,
            status: 'PAID',
            totalAmount,
            paymentMethod: 'CASH',
            createdAt: date,
            updatedAt: date
        };
    };

    // Generate 10 orders for this month
    for (let i = 0; i < 10; i++) {
        ordersToCreate.push(createOrder(i)); // 0 to 9 days ago
    }

    // Generate 5 orders for last month (should not show in default view)
    for (let i = 0; i < 5; i++) {
        ordersToCreate.push(createOrder(40 + i)); // 40 to 45 days ago
    }

    await Order.insertMany(ordersToCreate);

    console.log(`✅ Created ${ordersToCreate.length} dummy paid orders.`);
    console.log(`💰 Expected Revenue (Current Month): Rp ${expectedRevenueThisMonth.toLocaleString()}`);

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedRevenue();