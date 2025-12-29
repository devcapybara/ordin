const Restaurant = require('../../models/Restaurant');

const updateConfigs = async (req, res) => {
  try {
    const { totalTables, tax, serviceCharge } = req.body;

    const restaurant = await Restaurant.findById(req.user.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    if (totalTables !== undefined) restaurant.configs.totalTables = totalTables;
    if (tax !== undefined) restaurant.configs.tax = tax;
    if (serviceCharge !== undefined) restaurant.configs.serviceCharge = serviceCharge;

    await restaurant.save();

    res.json(restaurant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating configs' });
  }
};

module.exports = updateConfigs;
