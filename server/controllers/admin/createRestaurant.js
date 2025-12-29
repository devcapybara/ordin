const Restaurant = require('../../models/Restaurant');
const User = require('../../models/User');

const createRestaurant = async (req, res) => {
  try {
    const { 
      name, 
      ownerEmail, 
      phone, 
      ownerUsername, 
      ownerPassword,
      subscriptionExpiry,
      plan 
    } = req.body;

    // 1. Check if owner email already exists
    const existingUser = await User.findOne({ email: ownerEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // 2. Create Restaurant
    // Default 1 year subscription if not provided
    const expiry = subscriptionExpiry || new Date(new Date().setFullYear(new Date().getFullYear() + 1));

    const restaurant = await Restaurant.create({
      name,
      ownerEmail,
      phone,
      subscription: {
        plan: plan || 'BASIC',
        status: 'active',
        validUntil: expiry
      },
      configs: {
        totalTables: 12 // Default
      }
    });

    // 3. Create Owner User
    const owner = await User.create({
      restaurantId: restaurant._id,
      username: ownerUsername,
      email: ownerEmail,
      password: ownerPassword,
      role: 'OWNER'
    });

    res.status(201).json({ 
      message: 'Restaurant and Owner created successfully',
      restaurant,
      owner: { username: owner.username, email: owner.email }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating restaurant' });
  }
};

module.exports = createRestaurant;