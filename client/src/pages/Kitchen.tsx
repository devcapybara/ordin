import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { format } from 'date-fns';
import { Clock, CheckCircle, ChefHat, LayoutList, Package } from 'lucide-react';
import StockManagement from '../components/kitchen/StockManagement';

interface OrderItem {
  _id: string;
  productId: {
    _id: string;
    name: string;
  };
  quantity: number;
  note?: string;
  status: string;
}

interface Order {
  _id: string;
  tableNumber: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
  waiterId?: {
    username: string;
  };
}

const Kitchen: React.FC = () => {
  const { logout } = useAuth();
  const { socket } = useSocket();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'ORDERS' | 'STOCK'>('ORDERS');

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('new_order', (newOrder: Order) => {
        // Add new order to the list
        setOrders((prev) => [...prev, newOrder]);
        // Optional: Play sound or notification
        const audio = new Audio('/notification.mp3'); // Ensure this file exists or remove
        audio.play().catch(e => console.log('Audio play failed', e));
      });

      socket.on('order_status_updated', (updatedOrder: Order) => {
        setOrders((prev) => 
          prev.map((order) => order._id === updatedOrder._id ? updatedOrder : order)
        );
      });

      return () => {
        socket.off('new_order');
        socket.off('order_status_updated');
      };
    }
  }, [socket]);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders?status=PENDING'); // Or fetch active orders
      // Also maybe fetch COOKING
      const cookingRes = await api.get('/orders?status=COOKING');
      
      // Combine and sort by time
      const allOrders = [...data, ...cookingRes.data].sort((a: Order, b: Order) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      setOrders(allOrders);
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      // Optimistic update handled by socket event listener
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'border-yellow-500 bg-gray-800';
      case 'COOKING': return 'border-blue-500 bg-blue-900/20';
      case 'READY': return 'border-green-500 bg-green-900/20';
      default: return 'border-gray-500 bg-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <header className="flex justify-between items-center mb-6 bg-gray-800 p-4 rounded-lg shadow-lg">
        <div className="flex items-center gap-3">
          <ChefHat className="text-white" size={32} />
          <div>
              <h1 className="text-2xl font-bold">Kitchen Display</h1>
              <p className="text-xs text-gray-400">Manage orders and stock</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-700 rounded-lg p-1">
              <button 
                onClick={() => setViewMode('ORDERS')}
                className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                    viewMode === 'ORDERS' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
                }`}
              >
                  <LayoutList size={16} /> Orders
              </button>
              <button 
                onClick={() => setViewMode('STOCK')}
                className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                    viewMode === 'STOCK' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
                }`}
              >
                  <Package size={16} /> Stock / Menu
              </button>
          </div>
          <button onClick={logout} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors text-sm">
            Logout
          </button>
        </div>
      </header>

      {viewMode === 'STOCK' ? (
          <div className="h-[calc(100vh-140px)] text-gray-900">
              <StockManagement />
          </div>
      ) : (
          loading ? (
            <div className="flex justify-center items-center h-64">Loading orders...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {orders.filter(o => o.status !== 'READY').map((order) => (
                <div 
                  key={order._id} 
                  className={`p-4 rounded-lg border-l-4 shadow-md transition-all ${getStatusColor(order.status)}`}
                >
                  <div className="flex justify-between items-start mb-3 border-b border-gray-700 pb-2">
                    <div>
                      <span className="font-bold text-xl block">Table {order.tableNumber}</span>
                      <span className="text-gray-400 text-sm">#{order._id.slice(-4)}</span>
                    </div>
                    <div className="text-right">
                      <span className="flex items-center gap-1 text-sm font-mono text-gray-300">
                        <Clock size={14} />
                        {format(new Date(order.createdAt), 'HH:mm')}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded mt-1 inline-block
                        ${order.status === 'PENDING' ? 'bg-yellow-500 text-black' : 'bg-blue-500 text-white'}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
                    {/* Pending Items (New) */}
                    {order.items.some(i => i.status === 'PENDING') && (
                      <div className="mb-2">
                         <div className="text-xs font-bold text-yellow-500 uppercase tracking-wider mb-1">New Items</div>
                         {order.items.filter(i => i.status === 'PENDING').map((item, idx) => (
                            <div key={`pending-${idx}`} className="flex justify-between items-start bg-yellow-900/20 p-2 rounded mb-1">
                              <div className="flex gap-2">
                                <span className="font-bold text-lg min-w-[24px] text-yellow-400">{item.quantity}x</span>
                                <div>
                                  <span className="block font-medium text-white">{item.productId.name}</span>
                                  {item.note && (
                                    <span className="text-yellow-400 text-sm italic">Note: {item.note}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                         ))}
                      </div>
                    )}

                    {/* In Progress / Done Items */}
                    {order.items.some(i => i.status !== 'PENDING') && (
                       <div>
                          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">In Progress / Ready</div>
                          {order.items.filter(i => i.status !== 'PENDING').map((item, idx) => (
                            <div key={`other-${idx}`} className="flex justify-between items-start opacity-60">
                              <div className="flex gap-2">
                                <span className="font-bold text-lg min-w-[24px]">{item.quantity}x</span>
                                <div>
                                  <span className="block font-medium">{item.productId.name}</span>
                                  {item.note && (
                                    <span className="text-gray-400 text-sm italic">Note: {item.note}</span>
                                  )}
                                  <span className="text-xs border border-gray-600 px-1 rounded ml-2">{item.status}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                       </div>
                    )}
                  </div>

                  <div className="mt-auto pt-2 border-t border-gray-700">
                    {order.status === 'PENDING' && (
                      <button 
                        onClick={() => updateStatus(order._id, 'COOKING')}
                        className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded font-bold transition-colors flex items-center justify-center gap-2"
                      >
                        <ChefHat size={20} /> Start Cooking
                      </button>
                    )}
                    {order.status === 'COOKING' && (
                      <button 
                        onClick={() => updateStatus(order._id, 'READY')}
                        className="w-full bg-green-600 hover:bg-green-700 py-3 rounded font-bold transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={20} /> Mark Ready
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {orders.filter(o => o.status !== 'READY').length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center text-gray-500 py-20">
                  <ChefHat size={64} className="mb-4 opacity-50" />
                  <p className="text-xl">No active orders</p>
                  <p>Waiting for new orders...</p>
                </div>
              )}
            </div>
          )
      )}
    </div>
  );
};

export default Kitchen;
