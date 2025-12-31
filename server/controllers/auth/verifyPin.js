const User = require('../../models/User');

const verifyPin = async (req, res) => {
  try {
    const { pin } = req.body;
    const { restaurantId } = req.user;

    if (!pin) {
      return res.status(400).json({ message: 'PIN is required' });
    }

    // Find a user with this PIN in the same restaurant who is a MANAGER or OWNER
    // Or SUPER_ADMIN (who has no restaurantId)
    const manager = await User.findOne({
      $or: [
        { restaurantId: restaurantId, role: { $in: ['MANAGER', 'OWNER'] }, pin: pin },
        { role: 'SUPER_ADMIN', pin: pin } // Optional: allow super admin pin
      ]
    });

    if (manager) {
      return res.status(200).json({ valid: true, verifiedBy: manager.username });
    } else {
      return res.status(401).json({ valid: false, message: 'Invalid Manager PIN' });
    }

  } catch (error) {
    console.error('PIN verification error:', error);
    res.status(500).json({ message: 'Server error verifying PIN' });
  }
};

module.exports = verifyPin;
