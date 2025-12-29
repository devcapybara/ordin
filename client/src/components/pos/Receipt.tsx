import React, { forwardRef } from 'react';

interface ReceiptProps {
  order: any;
  restaurantName?: string;
}

const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ order, restaurantName = "Ordin Restaurant" }, ref) => {
  if (!order) return null;

  const total = order.totalAmount || 0;
  const tax = total * 0.11 / 1.11; // Extract tax from inclusive total or calc logic
  const subtotal = total - tax;

  return (
    <div className="hidden print:block p-4 font-mono text-xs w-[80mm]" ref={ref}>
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold">{restaurantName}</h1>
        <p>Jalan Makanan Enak No. 123</p>
        <p>Telp: 0812-3456-7890</p>
      </div>

      <div className="border-b border-dashed border-black mb-2 pb-2">
        <div className="flex justify-between">
          <span>Date: {new Date().toLocaleDateString()}</span>
          <span>Time: {new Date().toLocaleTimeString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Order #: {order._id.slice(-6)}</span>
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
              <tr key={item._id}>
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
          <span>Tax (10%)</span>
          <span>{tax.toLocaleString('id-ID')}</span>
        </div>
        {/* Service charge if any */}
        <div className="flex justify-between font-bold text-sm mt-2 pt-2 border-t border-black">
          <span>TOTAL</span>
          <span>{total.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span>Payment</span>
          <span>{order.paymentMethod}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>Status</span>
          <span>{order.paymentStatus}</span>
        </div>
      </div>

      <div className="text-center mt-6">
        <p>Thank you for dining with us!</p>
        <p>Please come again.</p>
        <p className="text-[10px] mt-2 text-gray-500">Powered by Ordin POS</p>
      </div>
    </div>
  );
});

export default Receipt;
