const Order = require('../../models/Order');
const { getIO } = require('../../config/socket');
const logActivity = require('../../utils/logger/logActivity');

const updateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { items, subtotal, taxAmount, serviceChargeAmount, discountAmount, promoCode, totalAmount } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status === 'PAID' || order.status === 'COMPLETED' || order.status === 'CANCELLED') {
      return res.status(400).json({ message: 'Cannot edit paid or completed orders' });
    }

    // Update items
    // We assume the frontend sends the COMPLETE list of items.
    // We need to preserve 'paidQuantity' from existing items if present.
    const existingItemsMap = new Map();
    if (order.items) {
        order.items.forEach(i => {
            if (i.productId) existingItemsMap.set(i.productId.toString(), i.paidQuantity || 0);
        });
    }

    const updatedItems = items.map(item => {
        const prodId = item.productId || item._id;
        const existingPaidQty = existingItemsMap.get(prodId.toString()) || 0;
        
        return {
            productId: prodId,
            quantity: item.quantity,
            unitPrice: item.unitPrice || item.price,
            note: item.note || '',
            status: item.status || 'PENDING',
            paidQuantity: existingPaidQty // Preserve paid quantity
        };
    });

    order.items = updatedItems;
    order.subtotal = subtotal;
    order.taxAmount = taxAmount;
    order.serviceChargeAmount = serviceChargeAmount;
    order.discountAmount = discountAmount;
    order.promoCode = promoCode;
    order.totalAmount = totalAmount;

    // Reset status to PENDING so Kitchen sees it as a "New Task" (or Partial New)
    // regardless of whether it was COOKING or READY before.
    order.status = 'PENDING';

    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('items.productId', 'name imageUrl')
      .populate('waiterId', 'username');

    // Emit socket event for Kitchen (Use 'order_status_updated' to match Kitchen listener)
    const io = getIO();
    io.to(`restaurant_${req.user.restaurantId}`).emit('order_status_updated', populatedOrder);

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
