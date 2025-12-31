const Promo = require('../../models/Promo');

const getPromos = async (req, res) => {
  try {
    const promos = await Promo.find({ restaurantId: req.user.restaurantId }).sort({ createdAt: -1 });
    res.json(promos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = getPromos;
