const GlobalConfig = require('../../models/GlobalConfig');

const getMainContact = async (req, res) => {
  try {
    const config = await GlobalConfig.findOne({ key: 'MAIN_ADMIN_CONTACT' });
    res.json({ contact: config ? config.value : '' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = getMainContact;