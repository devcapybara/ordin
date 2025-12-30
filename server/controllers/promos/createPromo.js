const Promo = require('../../models/Promo');

const createPromo = async (req, res) => {
  try {
    const { code, type, value, minOrderAmount, maxDiscountAmount } = req.body;
    
    // Check if code exists
    const existingPromo = await Promo.findOne({ 
      restaurantId: req.user.restaurantId, 
      code: code.toUpperCase() 
    });

    if (existingPromo) {
      return res.status(400).json({ message: 'Promo code already exists' });
    }

    const promo = await Promo.create({
      restaurantId: req.user.restaurantId,
      code: code.toUpperCase(),
      type,
      value,
      minOrderAmount,
      maxDiscountAmount
    });

    res.status(201).json(promo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = createPromo;
