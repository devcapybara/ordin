const Promo = require('../models/Promo');

// Thrown when a promo code cannot be applied. Callers decide whether that is an error or a silent drop.
class PromoError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'PromoError';
    this.status = status;
  }
}

const calculatePromoDiscount = (promo, subtotal) => {
  let discount = 0;
  if (promo.type === 'PERCENTAGE') {
    discount = (subtotal * promo.value) / 100;
    if (promo.maxDiscountAmount && discount > promo.maxDiscountAmount) {
      discount = promo.maxDiscountAmount;
    }
  } else {
    discount = promo.value;
  }
  // Discount can never exceed the order itself
  return Math.min(discount, subtotal);
};

// Looks up an active promo for this restaurant and checks it against the subtotal.
// Returns { promo, promoCode, discountAmount }, or throws PromoError.
const resolvePromo = async (restaurantId, code, subtotal) => {
  const promo = await Promo.findOne({
    restaurantId,
    code: String(code).toUpperCase(),
    isActive: true,
  });

  if (!promo) {
    throw new PromoError('Invalid promo code', 404);
  }

  if (subtotal < (promo.minOrderAmount || 0)) {
    throw new PromoError(`Minimum order amount is ${promo.minOrderAmount}`);
  }

  return {
    promo,
    promoCode: promo.code,
    discountAmount: calculatePromoDiscount(promo, subtotal),
  };
};

// Same formula the POS and Waiter screens display, so the staff sees the amount the server stores.
const calculateOrderTotals = ({ subtotal, discountAmount = 0, tax, serviceCharge }) => {
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = afterDiscount * tax;
  const serviceChargeAmount = afterDiscount * serviceCharge;
  const totalAmount = Math.round(afterDiscount + taxAmount + serviceChargeAmount);

  return { afterDiscount, taxAmount, serviceChargeAmount, totalAmount };
};

module.exports = { PromoError, calculatePromoDiscount, resolvePromo, calculateOrderTotals };
