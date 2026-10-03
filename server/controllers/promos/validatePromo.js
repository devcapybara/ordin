const { PromoError, resolvePromo } = require('../../services/orderTotals');

// Used by the POS to preview a discount before the order is saved.
// The order itself recalculates the discount on the server, so this response is informational only.
const validatePromo = async (req, res) => {
  try {
    const { code, orderAmount } = req.body; // orderAmount is the subtotal before discount

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ isValid: false, message: 'Code is required' });
    }

    const subtotal = Number(orderAmount);
    if (!Number.isFinite(subtotal) || subtotal < 0) {
      return res.status(400).json({ isValid: false, message: 'Order amount is required' });
    }

    const { promo, promoCode, discountAmount } = await resolvePromo(req.user.restaurantId, code, subtotal);

    res.json({
      isValid: true,
      discount: discountAmount,
      promoCode,
      type: promo.type,
      value: promo.value
    });
  } catch (error) {
    if (error instanceof PromoError) {
      return res.status(error.status).json({ isValid: false, message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = validatePromo;
