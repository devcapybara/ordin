const User = require('../../models/User');
const Restaurant = require('../../models/Restaurant');

const registerTenant = async (req, res) => {
  try {
    const { username, email, password, restaurantName, phone, subscriptionPlan, billingCycle } = req.body;
    const creatorId = req.user._id;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Set expiry based on plan
    const today = new Date();
    let expiry = new Date(today);
    
    if (billingCycle === 'YEARLY') {
        expiry.setFullYear(expiry.getFullYear() + 1);
    } else {
        expiry.setMonth(expiry.getMonth() + 1);
    }

    // Create Restaurant
    const restaurant = await Restaurant.create({
      name: restaurantName,
      ownerEmail: email,
      phone: phone || '',
      subscription: {
        plan: subscriptionPlan || 'BASIC',
        billingCycle: billingCycle || 'MONTHLY',
        validUntil: expiry,
        status: 'pending_payment'
      },
      createdBy: creatorId
    });

    // Create Owner User
    const user = await User.create({
      username,
      email,
      password, // Mongoose pre-save hook will hash this
      role: 'OWNER',
      restaurantId: restaurant._id,
    });

    if (user) {
      res.status(201).json({
        success: true,
        message: 'Tenant registered successfully',
        data: {
            restaurant,
            user: { 
                _id: user._id, 
                username: user.username,
                email: user.email 
            }
        }
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }

  } catch (error) {
    console.error('Register Tenant Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = registerTenant;