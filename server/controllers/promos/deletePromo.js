const Promo = require('../../models/Promo');

const deletePromo = async (req, res) => {
  try {
    const promo = await Promo.findOneAndDelete({ _id: req.params.id, restaurantId: req.user.restaurantId });
    if (!promo) {
      return res.status(404).json({ message: 'Promo not found' });
    }
    res.json({ message: 'Promo deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = deletePromo;
