/**
 * Process Payment Logic
 * Designed to support multiple providers (MANUAL, XENDIT)
 */
exports.processPayment = async (orderData, paymentPayload) => {
    const { method, amountReceived } = paymentPayload;
  
    // Default to MANUAL for now
    const provider = paymentPayload.provider || 'MANUAL';
  
    if (provider === 'MANUAL') {
        // Validation for CASH
        if (method === 'CASH') {
            if (!amountReceived || amountReceived < orderData.totalAmount) {
                throw new Error('Amount received is less than total amount');
            }
        }
  
        // For Manual, we assume the cashier verified it
        return {
            payment: {
                method: method,
                provider: 'MANUAL',
                status: 'PAID',
                xenditDetails: {
                    paidAt: new Date()
                }
            },
            amountReceived: amountReceived || orderData.totalAmount,
            changeAmount: method === 'CASH' ? (amountReceived - orderData.totalAmount) : 0
        };
    }
  
    /* FUTURE: XENDIT INTEGRATION
    if (provider === 'XENDIT') {
        // Call Xendit API to create Invoice
        return {
            payment: {
                method: method,
                provider: 'XENDIT',
                status: 'PENDING',
                xenditDetails: {
                    invoiceId: '...',
                    paymentUrl: '...'
                }
            }
        };
    }
    */
  
    throw new Error('Invalid payment provider');
  };