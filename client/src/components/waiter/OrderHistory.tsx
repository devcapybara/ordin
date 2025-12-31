import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { RefreshCw, Clock, CheckCircle, ChefHat, User, Check, Trash2 } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import Button from '../ui/Button';

interface OrderItem {
  _id: string;
  productId: { name: string };
  quantity: number;
  status: string;
  note?: string;
}

interface Order {
  _id: string;
  tableNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
}

const OrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders');
      setOrders(data.sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    if (socket) {
        socket.on('order_status_updated', (updatedOrder: Order) => {
            // If order is completed (cleared), remove from list or update
            if (updatedOrder.status === 'COMPLETED') {
                setOrders(prev => prev.filter(o => o._id !== updatedOrder._id));
            } else {
                setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
            }
        });
        socket.on('new_order', (newOrder: Order) => {
            setOrders(prev => [newOrder, ...prev]);
        });
        socket.on('table_cleared', () => {
             // Maybe refresh to be safe
             fetchOrders();
        });
    }

    return () => {
        if (socket) {
            socket.off('order_status_updated');
            socket.off('new_order');
            socket.off('table_cleared');
        }
    }
  }, [socket]);

  const handleServeOrder = async (orderId: string) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: 'SERVED' });
    } catch (error) {
      console.error('Failed to serve order', error);
      alert('Failed to update status');
    }
  };

  const handleClearTable = async (tableNumber: string) => {
    if (!window.confirm(`Clear table ${tableNumber}? This will free up the table.`)) return;
    try {
      await api.post('/tables/clear', { tableNumber });
    } catch (error) {
      console.error('Failed to clear table', error);
      alert('Failed to clear table');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'COOKING': return 'bg-orange-100 text-orange-800';
      case 'READY': return 'bg-green-100 text-green-800';
      case 'SERVED': return 'bg-blue-100 text-blue-800';
      case 'PAID': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="p-4 text-center">Loading orders...</div>;

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold">Active Orders</h2>
        <button onClick={fetchOrders} className="p-2 text-blue-600">
          <RefreshCw size={20} />
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center text-gray-500 py-10">No active orders</div>
      ) : (
        orders.map(order => (
          <div key={order._id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex justify-between items-start mb-3 border-b pb-2">
              <div>
                <span className="text-xs text-gray-500">Order #{order._id.slice(-4)}</span>
                <h3 className="text-lg font-bold">Table {order.tableNumber}</h3>
              </div>
              <div className="flex flex-col items-end gap-1">
                 <div className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getStatusColor(order.status)}`}>
                    {order.status}
                 </div>
                 {order.paymentStatus === 'PAID' && (
                     <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                         PAID
                     </span>
                 )}
              </div>
            </div>
            
            <div className="space-y-2 mb-3">
              {order.items.map(item => (
                <div key={item._id} className="text-sm">
                  <div className="flex justify-between">
                    <span>{item.quantity}x {item.productId?.name || 'Unknown'}</span>
                  </div>
                  {item.note && (
                    <p className="text-xs text-gray-500 italic ml-4 mt-1">"{item.note}"</p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-sm font-medium pt-2 border-t mt-2">
              <span className="text-gray-500">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="text-lg font-bold">Rp {order.totalAmount.toLocaleString('id-ID')}</span>
            </div>

            {/* Actions */}
            <div className="mt-3 flex gap-2">
                {order.status === 'READY' && (
                    <Button 
                        size="sm" 
                        onClick={() => handleServeOrder(order._id)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white flex justify-center items-center gap-2"
                    >
                        <Check size={16} /> Mark Served
                    </Button>
                )}
                
                {/* Allow clearing table if PAID or if needed (waiter confirmation) */}
                {(order.paymentStatus === 'PAID' || order.status === 'SERVED') && (
                    <Button 
                        size="sm"
                        variant="secondary"
                        onClick={() => handleClearTable(order.tableNumber)}
                        className="w-full border-red-200 text-red-600 hover:bg-red-50 flex justify-center items-center gap-2"
                    >
                        <Trash2 size={16} /> Clear Table
                    </Button>
                )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default OrderHistory;
