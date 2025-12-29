const User = require('../../models/User');
const Restaurant = require('../../models/Restaurant');
const ActiveSession = require('../../models/ActiveSession');
const { generateToken } = require('../../services/auth/tokenService');
const logActivity = require('../../utils/logger/logActivity');

const login = async (req, res) => {
  try {
    const { email, password, pin } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      
      // Device Limiting Logic
      if (user.role !== 'SUPER_ADMIN' && user.restaurantId) {
        const restaurant = await Restaurant.findById(user.restaurantId);
        
        if (restaurant) {
          const plan = restaurant.subscription?.plan || 'BASIC';
          
          // Check active sessions count
          const activeSessionsCount = await ActiveSession.countDocuments({ 
            restaurantId: user.restaurantId 
          });

          let maxDevices = 5; // Updated BASIC limit
          if (plan === 'PRO') maxDevices = 15; // Updated PRO limit
          if (plan === 'ENTERPRISE') maxDevices = 9999;

          if (activeSessionsCount >= maxDevices) {
            // Priority Eviction Logic
            if (user.role === 'OWNER' || user.role === 'MANAGER') {
                // Find a victim session (WAITER)
                // We need to populate userId to check the role
                const sessions = await ActiveSession.find({ restaurantId: user.restaurantId }).populate('userId');
                
                const victimSession = sessions.find(session => session.userId && session.userId.role === 'WAITER');
                
                if (victimSession) {
                    await ActiveSession.findByIdAndDelete(victimSession._id);
                    // Proceed to login
                } else {
                    return res.status(403).json({ 
                        message: `Device limit reached (${maxDevices}). No low-priority sessions (Waiters) available to evict. Cashiers and Kitchen cannot be forced out.` 
                    });
                }
            } else {
                return res.status(403).json({ 
                    message: `Device limit reached for ${plan} plan. Max ${maxDevices} active sessions allowed.` 
                });
            }
          }

          // Create Active Session
          await ActiveSession.create({
            userId: user._id,
            restaurantId: user.restaurantId,
            deviceInfo: req.headers['user-agent'] || 'Unknown',
            ipAddress: req.ip
          });
          
          // Log Activity
          logActivity(
            user.restaurantId,
            user._id,
            'LOGIN',
            `${user.username} (${user.role}) logged in from ${req.ip || 'unknown IP'}`
          );
        }
      }

      // Fetch plan again or use variable from above scope if optimized
      let subscriptionPlan = 'BASIC';
      if (user.role !== 'SUPER_ADMIN' && user.restaurantId) {
        const restaurant = await Restaurant.findById(user.restaurantId);
        if (restaurant) {
            subscriptionPlan = restaurant.subscription?.plan || 'BASIC';
        }
      }

      res.json({
        success: true,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          restaurantId: user.restaurantId,
          subscriptionPlan
        },
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = login;
