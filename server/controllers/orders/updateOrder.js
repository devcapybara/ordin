const Order = require('../../models/Order');
const Product = require('../../models/Product');
const Restaurant = require('../../models/Restaurant');
const Ingredient = require('../../models/Ingredient');
const { getIO } = require('../../config/socket');
const logActivity = require('../../utils/logger/logActivity');
const { PromoError, resolvePromo, calculateOrderTotals } = require('../../services/orderTotals');

const updateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    // Only items and the promo code come from the client. Prices and totals are always calculated here.
    const { items, promoCode } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.restaurantId.toString() !== req.user.restaurantId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (order.status === 'PAID' || order.status === 'COMPLETED' || order.status === 'CANCELLED') {
      return res.status(400).json({ message: 'Cannot edit paid or completed orders' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    // Price every line from the database, scoped to this restaurant
    const productIds = items.map(item => String(item.productId || item._id));
    const products = await Product.find({
      _id: { $in: productIds },
      restaurantId: req.user.restaurantId,
    }).populate('recipe.ingredientId');

    const restaurant = await Restaurant.findById(req.user.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    const { tax = 0.1, serviceCharge = 0.05 } = restaurant.configs || {};

    let subtotal = 0;
    const lines = [];
    for (const item of items) {
      const prodId = String(item.productId || item._id);
      const product = products.find(p => p._id.toString() === prodId);
      if (!product) {
        return res.status(400).json({ message: `Product not found or invalid: ${prodId}` });
      }

      const quantity = parseInt(item.quantity, 10);
      if (isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({ message: `Invalid quantity for product ${product.name}` });
      }

      subtotal += product.price * quantity;
      lines.push({ prodId, quantity, price: product.price, note: item.note, product });
    }

    // Promo: a code the client just entered must be valid. A code that was already on the order and
    // no longer applies (for example, subtotal dropped below the minimum) is removed quietly.
    const requestedPromo = promoCode === undefined ? order.promoCode : promoCode;
    if (requestedPromo && typeof requestedPromo !== 'string') {
      return res.status(400).json({ message: 'Invalid promo code' });
    }

    let promo = { promoCode: undefined, discountAmount: 0 };
    if (requestedPromo) {
      try {
        promo = await resolvePromo(req.user.restaurantId, requestedPromo, subtotal);
      } catch (promoError) {
        if (!(promoError instanceof PromoError)) throw promoError;
        const isNewCode = requestedPromo.toUpperCase() !== (order.promoCode || '').toUpperCase();
        if (isNewCode) {
          return res.status(400).json({ message: promoError.message });
        }
      }
    }

    const { taxAmount, serviceChargeAmount, totalAmount } = calculateOrderTotals({
      subtotal,
      discountAmount: promo.discountAmount,
      tax,
      serviceCharge,
    });

    // Update items
    // We assume the frontend sends the COMPLETE list of items.
    // Preserve 'paidQuantity' and 'status' from existing items when still present.
    const existingItemsMap = new Map();
    if (order.items) {
        order.items.forEach(i => {
            if (i.productId) {
              existingItemsMap.set(i.productId.toString(), {
                paidQuantity: i.paidQuantity || 0,
                status: i.status,
                quantity: i.quantity
              });
            }
        });
    }

    const addedItems = [];
    const updatedItems = lines.map(line => {
        const existing = existingItemsMap.get(line.prodId);
        const preservedStatus = existing ? existing.status : 'PENDING';
        const preservedPaidQty = existing ? existing.paidQuantity : 0;
        const prevQty = existing ? existing.quantity : 0;
        const increase = line.quantity - prevQty;
        if (increase > 0) {
          addedItems.push({
            productId: line.prodId,
            quantity: increase,
            note: line.note || ''
          });
        }
        return {
            productId: line.prodId,
            quantity: line.quantity,
            unitPrice: line.price,
            note: line.note || '',
            status: preservedStatus,
            paidQuantity: preservedPaidQty
        };
    });

    order.items = updatedItems;
    order.subtotal = subtotal;
    order.taxAmount = taxAmount;
    order.serviceChargeAmount = serviceChargeAmount;
    order.discountAmount = promo.discountAmount;
    order.promoCode = promo.promoCode;
    order.totalAmount = totalAmount;

    // Append kitchen ticket for added items
    if (addedItems.length > 0) {
      order.tickets = order.tickets || [];
      order.tickets.push({
        items: addedItems,
        createdAt: new Date()
      });
    }

    // Determine order status:
    // If there are newly added products or increased quantity compared to previous, mark order PENDING.
    // Otherwise keep previous status.
    let hasNewOrIncreased = false;
    updatedItems.forEach(ui => {
      const prev = existingItemsMap.get(ui.productId.toString());
      if (!prev) hasNewOrIncreased = true;
      else if (ui.quantity > prev.quantity) hasNewOrIncreased = true;
    });
    if (hasNewOrIncreased || addedItems.length > 0) {
      order.status = 'PENDING';
    }

    await order.save();

    // Deduct ingredients for quantities added in this update, same as createOrder does for new orders.
    // Runs after save so a failed save never touches stock.
    const ingredientUpdates = {};
    lines.forEach(line => {
      const prev = existingItemsMap.get(line.prodId);
      const increase = line.quantity - (prev ? prev.quantity : 0);
      if (increase <= 0 || !line.product.recipe) return;
      line.product.recipe.forEach(ing => {
        if (!ing.ingredientId) return; // ingredient was deleted
        const ingId = ing.ingredientId._id.toString();
        ingredientUpdates[ingId] = (ingredientUpdates[ingId] || 0) + ing.quantity * increase;
      });
    });
    await Promise.all(
      Object.entries(ingredientUpdates).map(([ingId, amount]) =>
        Ingredient.findByIdAndUpdate(ingId, { $inc: { currentStock: -amount } })
      )
    );

    const populatedOrder = await Order.findById(order._id)
      .populate('items.productId', 'name imageUrl')
      .populate('waiterId', 'username');

    // Emit socket event for Kitchen (Use 'order_status_updated' to match Kitchen listener)
    const io = getIO();
    io.to(`restaurant_${req.user.restaurantId}`).emit('order_status_updated', populatedOrder);
    if (addedItems.length > 0) {
      // Build ticket payload with product names for convenience
      const nameMap = new Map();
      populatedOrder.items.forEach(i => {
        nameMap.set(i.productId._id.toString(), i.productId.name);
      });

      const lastTicket = populatedOrder.tickets[populatedOrder.tickets.length - 1];

      const ticketPayload = {
        _id: lastTicket._id,
        orderId: populatedOrder._id,
        tableNumber: populatedOrder.tableNumber,
        createdAt: lastTicket.createdAt,
        items: addedItems.map(ai => ({
          productId: ai.productId,
          name: nameMap.get(ai.productId.toString()) || '',
          quantity: ai.quantity,
          note: ai.note || ''
        })),
        status: lastTicket.status || 'PENDING'
      };
      io.to(`restaurant_${req.user.restaurantId}`).emit('order_items_added', ticketPayload);
    }

    logActivity(
        req.user.restaurantId,
        req.user._id,
        'ORDER_UPDATED',
        `Order ${order.orderNumber} updated`,
        { orderId: order._id, totalAmount }
    );

    res.json(populatedOrder);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating order', error: error.message });
  }
};

module.exports = updateOrder;
