const Restaurant = require('../../models/Restaurant');
const { getRedis } = require('../../config/redis');

const updateConfigs = async (req, res) => {
  try {
    const { name, address, phone, totalTables, tax, serviceCharge, receiptFooter } = req.body;

    const restaurant = await Restaurant.findById(req.user.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Basic Info
    if (name !== undefined) restaurant.name = name;
    if (address !== undefined) restaurant.address = address;
    if (phone !== undefined) restaurant.phone = phone;

    // Configs
    if (totalTables !== undefined) restaurant.configs.totalTables = totalTables;
    if (tax !== undefined) restaurant.configs.tax = tax;
    if (serviceCharge !== undefined) restaurant.configs.serviceCharge = serviceCharge;
    if (receiptFooter !== undefined) restaurant.configs.receiptFooter = receiptFooter;

    await restaurant.save();

    // Invalidate Cache
    const redis = getRedis();
    if (redis) {
        await redis.del(`restaurant_config:${req.user.restaurantId}`);
    }

    res.json(restaurant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating configs' });
  }
};

module.exports = updateConfigs;
