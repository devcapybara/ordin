const Restaurant = require('../../models/Restaurant');
const { TOGGLEABLE_ROLES, getDisabledRoles } = require('../../services/roles');
const { getRedis } = require('../../config/redis');

const updateConfigs = async (req, res) => {
  try {
    const { name, address, phone, totalTables, tax, serviceCharge, receiptFooter, disabledRoles } = req.body;

    const restaurant = await Restaurant.findById(req.user.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Turning staff roles on or off is owner-only. Managers may still save other settings,
    // so a disabledRoles value identical to the current one is accepted from anyone.
    let nextDisabledRoles;
    if (disabledRoles !== undefined) {
      if (!Array.isArray(disabledRoles) || disabledRoles.some(role => !TOGGLEABLE_ROLES.includes(role))) {
        return res.status(400).json({ message: `disabledRoles must only contain: ${TOGGLEABLE_ROLES.join(', ')}` });
      }
      nextDisabledRoles = [...new Set(disabledRoles)].sort();
      const currentDisabledRoles = [...getDisabledRoles(restaurant)].sort();
      const changed = nextDisabledRoles.join(',') !== currentDisabledRoles.join(',');
      if (changed && req.user.role !== 'OWNER') {
        return res.status(403).json({ message: 'Only the owner can turn staff roles on or off' });
      }
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
    if (nextDisabledRoles !== undefined) restaurant.configs.disabledRoles = nextDisabledRoles;

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
