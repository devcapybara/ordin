const User = require('../../models/User');

// @desc    Get all sales agents
// @route   GET /api/admin/sales
// @access  Private/Admin
const getSalesAgents = async (req, res) => {
  try {
    const agents = await User.find({ role: 'SALES' }).select('-password');
    res.json(agents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create sales agent
// @route   POST /api/admin/sales
// @access  Private/Admin
const createSalesAgent = async (req, res) => {
  try {
    const { username, email, password, region, whatsappNumber } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      username,
      email,
      password,
      role: 'SALES',
      region,
      whatsappNumber
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      region: user.region,
      whatsappNumber: user.whatsappNumber
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update sales agent
// @route   PUT /api/admin/sales/:id
// @access  Private/Admin
const updateSalesAgent = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Sales agent not found' });
    }

    if (user.role !== 'SALES') {
        return res.status(400).json({ message: 'User is not a sales agent' });
    }

    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.region = req.body.region || user.region;
    user.whatsappNumber = req.body.whatsappNumber || user.whatsappNumber;
    
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      region: updatedUser.region,
      whatsappNumber: updatedUser.whatsappNumber
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete sales agent
// @route   DELETE /api/admin/sales/:id
// @access  Private/Admin
const deleteSalesAgent = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Sales agent not found' });
    }

    if (user.role !== 'SALES') {
        return res.status(400).json({ message: 'User is not a sales agent' });
    }

    await User.deleteOne({ _id: user._id });

    res.json({ message: 'Sales agent removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getSalesAgents,
  createSalesAgent,
  updateSalesAgent,
  deleteSalesAgent
};