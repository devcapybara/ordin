const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const seedSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ordin_saas');
    console.log('MongoDB Connected');

    const adminEmail = 'admin@ordin.com';
    const adminUser = await User.findOne({ email: adminEmail });

    if (adminUser) {
      console.log('Super Admin already exists. Resetting password...');
      adminUser.password = 'adminpassword';
      await adminUser.save();
      console.log('Super Admin password reset to: adminpassword');
    } else {
      await User.create({
        username: 'SuperAdmin',
        email: adminEmail,
        password: 'adminpassword', // Will be hashed by pre-save hook
        role: 'SUPER_ADMIN',
        restaurantId: null
      });
      console.log('Super Admin created successfully');
    }

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedSuperAdmin();