const GlobalConfig = require('../../models/GlobalConfig');

const updateConfig = async (req, res) => {
  try {
    const { key, value, description } = req.body;
    
    const config = await GlobalConfig.findOneAndUpdate(
      { key },
      { key, value, description, updatedBy: req.user._id },
      { new: true, upsert: true }
    );

    res.json(config);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getConfig = async (req, res) => {
    try {
        const config = await GlobalConfig.findOne({ key: req.params.key });
        res.json(config || { key: req.params.key, value: '' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
}

module.exports = { updateConfig, getConfig };