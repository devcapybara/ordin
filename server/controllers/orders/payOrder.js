const Order = require('../../models/Order');
const { getIO } = require('../../config/socket');
const logActivity = require('../../utils/logger/logActivity');
const paymentService = require('../../services/payment.service');

const payOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemsToPay, method, amountReceived, provider } = req.body; // itemsToPay: [{ productId, quantity }]
    
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.restaurantId.toString() !== req.user.restaurantId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Determine Payment Amount
    let paymentAmount = 0;
    let itemsCovered = [];
    let roundingAdjustment = 0;

    if (itemsToPay && itemsToPay.length > 0) {
        // SPLIT PAYMENT (By Items)
        itemsToPay.forEach(payItem => {
            const orderItem = order.items.find(i => i.productId.toString() === payItem.productId);
            if (orderItem) {
                // Calculate proportional price (including tax/service if needed? For now, raw unit price)
                // Ideally, we should include tax/service in the split amount.
                // Simplified: (UnitPrice * Qty) + Proportional Tax/Service
                
                const itemTotal = orderItem.unitPrice * payItem.quantity;
                
                // Add proportional tax/service logic here if needed, 
                // but for now let's assume `totalAmount` in order includes everything distributed?
                // Actually, order.totalAmount is the grand total.
                // We need to re-calculate "Price to Pay" for these items including tax/service.
                // Let's rely on frontend sending the "amountToPay" or calculate it here.
                // Safer to calculate here based on configs? 
                // Let's assume the frontend sends the calculated "amount" for this split or we sum unit prices.
                
                // Let's stick to: Payment Amount = Sum of (Item Price * Qty) + Tax + Service
                // We can't easily get Tax Rate here without configs.
                // Let's assume the simple logic: (TotalOrderAmount / TotalItemsPrice) * ItemPrice? No.
                
                // BETTER APPROACH:
                // Use the ratio of (ItemPrice * Qty) / Subtotal to find the portion of TotalAmount
                // portion = (ItemPrice * Qty / OrderSubtotal) * OrderTotalAmount
                
                if (order.subtotal > 0) {
                     const itemShare = (orderItem.unitPrice * payItem.quantity) / order.subtotal;
                     const itemPayAmount = Math.round(itemShare * order.totalAmount);
                     paymentAmount += itemPayAmount;
                     
                     itemsCovered.push({
                         productId: payItem.productId,
                         quantity: payItem.quantity,
                         amount: itemPayAmount
                     });

                     // Update Paid Quantity
                     orderItem.paidQuantity = (orderItem.paidQuantity || 0) + payItem.quantity;
                }
            }
        });
    } else {
        // FULL PAYMENT (Remaining Balance)
        paymentAmount = order.totalAmount - (order.totalPaid || 0);
        itemsCovered = order.items.map(i => ({
            productId: i.productId,
            quantity: i.quantity - (i.paidQuantity || 0),
            amount: 0 // Not calculated per item for full pay
        }));
        
        // Mark all as fully paid
        order.items.forEach(i => i.paidQuantity = i.quantity);
    }

    // Apply cash rounding to nearest 100
    if (method === 'CASH') {
        const STEP = 100;
        const rounded = Math.round(paymentAmount / STEP) * STEP;
        roundingAdjustment = rounded - paymentAmount;
        paymentAmount = rounded;
    }

    // Process Payment via Service (Validate Amount)
    // Create a dummy order object with the specific payment amount needed
    const paymentContext = { totalAmount: paymentAmount };
    const paymentResult = await paymentService.processPayment(paymentContext, { method, amountReceived, provider });

    // Create Payment Record
    const newPayment = {
        amount: paymentAmount,
        method: paymentResult.payment.method,
        provider: paymentResult.payment.provider,
        status: paymentResult.payment.status,
        cashierId: req.user._id,
        items: itemsCovered,
        note: req.body.note
    };

    order.payments.push(newPayment);
    order.totalPaid = (order.totalPaid || 0) + paymentAmount;
    
    // Update Order Status
    if (order.totalPaid >= order.totalAmount - 100) { // Tolerance for rounding
        order.status = 'PAID';
        order.payment.status = 'PAID'; // Legacy sync
    } else {
        order.status = 'PARTIAL_PAID';
    }

    // Update Legacy Fields (Last Payment info)
    order.payment = paymentResult.payment;
    order.amountReceived = paymentResult.amountReceived;
    order.changeAmount = paymentResult.changeAmount;
    order.cashierId = req.user._id;

    await order.save();

    // Populate for response (Receipt needs product names)
    const populatedOrder = await Order.findById(order._id).populate('items.productId');

    // Emit event
    const io = getIO();
    io.to(`restaurant_${req.user.restaurantId}`).emit('order_paid', populatedOrder);

    // Prepare response with specific receipt data
    const responseData = {
        order: populatedOrder,
        receipt: {
            ...populatedOrder.toObject(),
            // If split payment, overwrite items and totals with current payment info
            items: itemsToPay ? itemsCovered.map(ic => {
                const originalItem = populatedOrder.items.find(i => i.productId._id.toString() === ic.productId.toString());
                return {
                    ...originalItem.toObject(),
                    quantity: ic.quantity,
                    // Use the calculated split amount for display if needed, or unit price
                    // For receipt, we usually show Unit Price and Qty. 
                    // The total at bottom will be the Payment Amount.
                };
            }) : populatedOrder.items,
            totalAmount: paymentAmount,
            subtotal: itemsToPay ? (paymentAmount / (1 + (req.body.tax || 0.1))) : populatedOrder.subtotal, // Approximate/Simple or rely on frontend
            // Actually, best to just send the paymentAmount as the Total for the receipt
            // and let Receipt component handle it.
            isSplitReceipt: !!itemsToPay,
            roundingAdjustment: roundingAdjustment,
            payment: {
                method: newPayment.method,
                amount: newPayment.amount,
                change: order.changeAmount
            }
        }
    };

    // Log Activity
    logActivity(
        req.user.restaurantId,
        req.user._id,
        'ORDER_PAYMENT',
        `Payment of ${paymentAmount} for Order #${order.orderNumber || order._id.toString().slice(-4)}`,
        { 
            orderId: order._id, 
            amount: paymentAmount, 
            method: method,
            type: itemsToPay ? 'SPLIT' : 'FULL'
        }
    );

    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error processing payment', error: error.message });
  }
};

module.exports = payOrder;
