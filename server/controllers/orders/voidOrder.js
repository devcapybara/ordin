const Order = require('../../models/Order');
const ActivityLog = require('../../models/ActivityLog');

// @desc    Void a transaction
// @route   POST /api/orders/:id/void
// @access  Private (Manager/Owner)
const voidOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ 
        _id: req.params.id,
        restaurantId: req.user.restaurantId 
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status === 'VOID') {
        return res.status(400).json({ message: 'Order is already voided' });
    }

    // Update status to VOID
    order.status = 'VOID';
    order.voidReason = req.body.reason || 'No reason provided';
    order.voidBy = req.user._id;
    order.voidAt = new Date();

    await order.save();

    // Log Activity
    await ActivityLog.create({
        restaurantId: req.user.restaurantId,
        user: req.user._id,
        action: 'VOID_TRANSACTION',
        description: `Voided Order #${order.orderNumber} - Reason: ${order.voidReason}`,
        metadata: {
            orderId: order._id,
            reason: order.voidReason,
            amount: order.totalAmount
        }
    });

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = voidOrder;
