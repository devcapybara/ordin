const Promo = require('../../models/Promo');

const validatePromo = async (req, res) => {
  try {
    const { code, orderAmount } = req.body; // orderAmount should be subtotal
    
    if (!code) {
        return res.status(400).json({ isValid: false, message: 'Code is required' });
    }

    const promo = await Promo.findOne({ 
      restaurantId: req.user.restaurantId, 
      code: code.toUpperCase(),
      isActive: true
    });

    if (!promo) {
      return res.status(404).json({ isValid: false, message: 'Invalid promo code' });
    }

    if (orderAmount < promo.minOrderAmount) {
        return res.status(400).json({ 
            isValid: false, 
            message: `Minimum order amount is ${promo.minOrderAmount}` 
        });
    }

    let discount = 0;
    if (promo.type === 'PERCENTAGE') {
        discount = (orderAmount * promo.value) / 100;
        if (promo.maxDiscountAmount && discount > promo.maxDiscountAmount) {
            discount = promo.maxDiscountAmount;
        }
    } else {
        discount = promo.value;
    }
    
    // Ensure discount doesn't exceed order amount
    if (discount > orderAmount) {
        discount = orderAmount;
    }

    res.json({ 
        isValid: true, 
        discount,
        promoCode: promo.code,
        type: promo.type,
        value: promo.value
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = validatePromo;
