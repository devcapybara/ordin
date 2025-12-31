const User = require('../../models/User');

const getAgents = async (req, res) => {
  try {
    const agents = await User.find({ role: 'SALES', isActive: true })
      .select('username region whatsappNumber email');
    
    res.status(200).json(agents);
  } catch (error) {
    console.error('Get Agents Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = getAgents;