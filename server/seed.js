const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load env vars
dotenv.config();

// This script wipes the database. Never run it against production, and never with a hardcoded password.
if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to seed: this script deletes all data and must not run in production.');
  process.exit(1);
}
const SEED_PASSWORD = process.env.SEED_PASSWORD;
if (!SEED_PASSWORD) {
  console.error('Set SEED_PASSWORD in the environment to choose the password for seeded accounts.');
  process.exit(1);
}

// Import Models
const User = require('./models/User');
const Restaurant = require('./models/Restaurant');
const Product = require('./models/Product');
const Order = require('./models/Order');

// Connect to DB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected for Seeding...'))
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

const seedData = async () => {
  try {
    // 1. Clear existing data
    console.log('🗑️  Clearing database...');
    await User.deleteMany({});
    await Restaurant.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});

    // 2. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(SEED_PASSWORD, salt);

    // 3. Create Super Admin
    console.log('👤 Creating Super Admin...');
    await User.create({
      username: 'superadmin',
      email: 'admin@ordin.com',
      password: SEED_PASSWORD, // Will be hashed by pre-save hook if using create, but let's rely on model hook
      role: 'SUPER_ADMIN',
      restaurantId: null
    });

    // 4. Create Restaurant
    console.log('🏢 Creating Restaurant...');
    const restaurant = await Restaurant.create({
      name: 'Ordin Coffee & Eatery',
      ownerEmail: 'owner@ordin.com',
      phone: '081234567890',
      subscriptionStatus: 'active',
      subscriptionExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year from now
      branding: {
        appDisplayName: 'Ordin Coffee',
        primaryColor: '#8B4513', // SaddleBrown
        secondaryColor: '#D2691E' // Chocolate
      },
      configs: {
        tax: 0.11,
        serviceCharge: 0.05
      }
    });

    // 5. Create Restaurant Users
    console.log('👥 Creating Staff...');
    const users = [
      {
        username: 'owner',
        email: 'owner@ordin.com',
        role: 'OWNER',
        password: SEED_PASSWORD,
        pin: '1234',
        restaurantId: restaurant._id
      },
      {
        username: 'manager',
        email: 'manager@ordin.com',
        role: 'MANAGER',
        password: SEED_PASSWORD,
        pin: '1234',
        restaurantId: restaurant._id
      },
      {
        username: 'cashier',
        email: 'cashier@ordin.com',
        role: 'CASHIER',
        password: SEED_PASSWORD,
        pin: '1234',
        restaurantId: restaurant._id
      },
      {
        username: 'waiter',
        email: 'waiter@ordin.com',
        role: 'WAITER',
        password: SEED_PASSWORD,
        pin: '1234',
        restaurantId: restaurant._id
      },
      {
        username: 'kitchen',
        email: 'kitchen@ordin.com',
        role: 'KITCHEN',
        password: SEED_PASSWORD,
        restaurantId: restaurant._id
      }
    ];

    // Use create instead of insertMany to trigger pre-save hook for password hashing
    for (const user of users) {
      await User.create(user);
    }

    // 6. Create Products
    console.log('🍔 Creating Menu Items...');
    const products = [
      {
        restaurantId: restaurant._id,
        name: 'Kopi Susu Gula Aren',
        price: 25000,
        category: 'Beverage',
        isAvailable: true,
        stock: 100,
        description: 'Espresso with fresh milk and palm sugar',
        imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=300&auto=format&fit=crop'
      },
      {
        restaurantId: restaurant._id,
        name: 'Americano',
        price: 20000,
        category: 'Beverage',
        isAvailable: true,
        stock: 100,
        description: 'Double shot espresso with hot water',
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=300&auto=format&fit=crop'
      },
      {
        restaurantId: restaurant._id,
        name: 'Nasi Goreng Spesial',
        price: 35000,
        category: 'Food',
        isAvailable: true,
        stock: 50,
        description: 'Indonesian fried rice with egg and chicken',
        imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?q=80&w=300&auto=format&fit=crop'
      },
      {
        restaurantId: restaurant._id,
        name: 'French Fries',
        price: 18000,
        category: 'Snack',
        isAvailable: true,
        stock: 80,
        description: 'Crispy shoestring fries',
        imageUrl: 'https://images.unsplash.com/photo-1573080496987-a199f8cd75ec?q=80&w=300&auto=format&fit=crop'
      }
    ];

    await Product.insertMany(products);

    console.log('✅ Seeding Completed Successfully!');
    console.log('-----------------------------------');
    console.log('🔑 Credentials (password from SEED_PASSWORD):');
    console.log('   - Super Admin: admin@ordin.com');
    console.log('   - Owner: owner@ordin.com');
    console.log('   - Cashier: cashier@ordin.com (PIN: 1234)');
    console.log('   - Waiter: waiter@ordin.com (PIN: 1234)');
    console.log('-----------------------------------');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Failed:', error);
    process.exit(1);
  }
};

seedData();
