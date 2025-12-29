const ActiveSession = require('../../models/ActiveSession');

const logout = async (req, res) => {
  try {
    // If we have the user from middleware
    if (req.user) {
      // Remove all sessions for this user (or just the current one if we tracked token)
      // For simplicity in this iteration, we remove sessions for this User ID.
      // Ideally, we should match the specific session/token. 
      // But since we don't store token in ActiveSession (yet), let's clear user sessions.
      await ActiveSession.deleteMany({ userId: req.user._id });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during logout' });
  }
};

module.exports = logout;