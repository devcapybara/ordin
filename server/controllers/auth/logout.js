const ActiveSession = require('../../models/ActiveSession');
const User = require('../../models/User');

const logout = async (req, res) => {
  try {
    // If we have the user from middleware
    if (req.user) {
      // Remove all sessions for this user (or just the current one if we tracked token)
      // For simplicity in this iteration, we remove sessions for this User ID.
      // Ideally, we should match the specific session/token.
      // But since we don't store token in ActiveSession (yet), let's clear user sessions.
      await ActiveSession.deleteMany({ userId: req.user._id });

      // Revoke every JWT issued so far. +1s so a re-login in the same second is not rejected
      // (JWT iat has second precision).
      await User.updateOne(
        { _id: req.user._id },
        { tokensValidAfter: Math.floor(Date.now() / 1000) + 1 }
      );
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during logout' });
  }
};

module.exports = logout;