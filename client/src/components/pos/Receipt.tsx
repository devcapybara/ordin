import React, { forwardRef } from 'react';

interface ReceiptProps {
  order: any;
  restaurantName?: string;
  configs?: {
      tax: number;
      serviceCharge: number;
      receiptFooter: string;
      restaurantName?: string;
      address?: string;
      phone?: string;
  };
}

const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ order, restaurantName = "Ordin Restaurant", configs }, ref) => {
  if (!order) return null;

  // Use configs name if available, otherwise prop, otherwise default
  const finalName = configs?.restaurantName || restaurantName;
  const address = configs?.address || 'Jalan Makanan Enak No. 123';
  const phone = configs?.phone || '0812-3456-7890';

  // Calculate based on items to show breakdown
  const subtotal = order.items.reduce((acc: number, item: any) => {
      const price = item.unitPrice || item.price || 0;
      return acc + (price * item.quantity);
  }, 0);

  const taxRate = configs?.tax || 0.1;
  const serviceRate = configs?.serviceCharge || 0;
  
  const tax = Math.round(subtotal * taxRate);
  const service = Math.round(subtotal * serviceRate);
  const total = subtotal + tax + service;

  // Use the stored totalAmount if available to match DB, otherwise calculated
  const displayTotal = order.totalAmount || total;

  return (
    <div className="hidden print:block p-4 font-mono text-xs w-[80mm]" ref={ref}>
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold">{finalName}</h1>
        <p>{address}</p>
        <p>Telp: {phone}</p>
      </div>

      <div className="border-b border-dashed border-black mb-2 pb-2">
        <div className="flex justify-between">
          <span>Date: {new Date(order.createdAt || Date.now()).toLocaleDateString()}</span>
          <span>Time: {new Date(order.createdAt || Date.now()).toLocaleTimeString()}</span>
        </div>
        <div className="flex justify-between">
            <span>Order #: {order.orderNumber || order._id.slice(-6)}</span>
            <span>Table: {order.tableNumber}</span>
        </div>
        <div>Cashier: {order.waiterId?.username || 'Staff'}</div>
      </div>

      <div className="mb-4">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="pb-1">Item</th>
              <th className="text-right pb-1">Qty</th>
              <th className="text-right pb-1">Price</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item: any) => (
              <tr key={item._id || Math.random()}>
                <td className="py-1">{item.productId?.name || item.name}</td>
                <td className="text-right py-1">{item.quantity}</td>
                <td className="text-right py-1">
                  {(item.unitPrice || item.price || 0).toLocaleString('id-ID')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-dashed border-black pt-2 space-y-1">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{subtotal.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax ({(taxRate * 100).toFixed(0)}%)</span>
          <span>{tax.toLocaleString('id-ID')}</span>
        </div>
        {service > 0 && (
            <div className="flex justify-between">
                <span>Service ({(serviceRate * 100).toFixed(0)}%)</span>
                <span>{service.toLocaleString('id-ID')}</span>
            </div>
        )}
        <div className="flex justify-between font-bold text-sm mt-2 pt-2 border-t border-black">
          <span>TOTAL</span>
          <span>{displayTotal.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span>Payment</span>
          <span>{order.payment?.method || order.paymentMethod || '-'}</span>
        </div>
        <div className="flex justify-between text-xs">
            <span>Change</span>
            <span>Rp {(order.changeAmount || 0).toLocaleString('id-ID')}</span>
        </div>
      </div>

      <div className="text-center mt-6 whitespace-pre-wrap">
        <p>{configs?.receiptFooter || 'Thank you for dining with us!'}</p>
        <p className="text-[10px] mt-2 text-gray-500">Powered by Ordin POS</p>
      </div>
    </div>
  );
});

export default Receipt;
