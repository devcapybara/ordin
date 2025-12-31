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
    const updatedItems = items.map(item => {
        const prodId = item.productId || item._id;
        const existing = existingItemsMap.get(prodId.toString());
        const preservedStatus = existing ? existing.status : (item.status || 'PENDING');
        const preservedPaidQty = existing ? existing.paidQuantity : 0;
        const prevQty = existing ? existing.quantity : 0;
        const increase = (item.quantity || 0) - prevQty;
        if (increase > 0) {
          addedItems.push({
            productId: prodId,
            quantity: increase,
            note: item.note || ''
          });
        }
        return {
            productId: prodId,
            quantity: item.quantity,
            unitPrice: item.unitPrice || item.price,
            note: item.note || '',
            status: preservedStatus,
            paidQuantity: preservedPaidQty
        };
    });

    order.items = updatedItems;
    order.subtotal = subtotal;
    order.taxAmount = taxAmount;
    order.serviceChargeAmount = serviceChargeAmount;
    order.discountAmount = discountAmount;
    order.promoCode = promoCode;
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
