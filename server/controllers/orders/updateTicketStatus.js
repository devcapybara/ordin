const Order = require('../../models/Order');
const { getIO } = require('../../config/socket');
const logActivity = require('../../utils/logger/logActivity');

const updateTicketStatus = async (req, res) => {
  try {
    const { orderId, ticketId } = req.params;
    const { status } = req.body;

    const order = await Order.findOne({ 
      _id: orderId, 
      restaurantId: req.user.restaurantId 
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const ticket = order.tickets.id(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.status = status;
    
    // Check if all tickets are READY/SERVED to update main order status
    const allDone = order.tickets.every(t => ['READY', 'SERVED', 'COMPLETED'].includes(t.status));
    if (allDone && order.status !== 'PAID' && order.status !== 'COMPLETED') {
        // If all tickets are done, maybe set order to SERVED/READY?
        // But let's stick to ticket-level control for Kitchen.
        // We can sync order.status to the "lowest" ticket status if needed, or just leave it.
        // Let's set order.status to 'READY' if all are READY/SERVED.
        order.status = 'READY'; 
    }

    await order.save();

    const populatedOrder = await Order.findById(orderId)
      .populate('items.productId', 'name imageUrl')
      .populate('waiterId', 'username');

    // Emit update
    const io = getIO();
    io.to(`restaurant_${req.user.restaurantId}`).emit('order_status_updated', populatedOrder);
    
    // Also emit specific ticket update if needed, but order_status_updated carries the whole order with tickets
    
    logActivity(
        req.user.restaurantId,
        req.user._id,
        'TICKET_STATUS_UPDATE',
        `Ticket status updated to ${status} for Order #${order.orderNumber || order._id}`,
        { orderId: order._id, ticketId, status }
    );

    res.json(populatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating ticket status' });
  }
};

module.exports = updateTicketStatus;
