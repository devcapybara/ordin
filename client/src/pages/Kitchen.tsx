import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { format } from 'date-fns';
import { Clock, CheckCircle, ChefHat, LayoutList, Package, History } from 'lucide-react';
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
  tickets?: {
    _id: string;
    items: { productId: string; quantity: number; note?: string }[];
    createdAt: string;
    status?: string;
  }[];
}

const Kitchen: React.FC = () => {
  const { logout } = useAuth();
  const { socket } = useSocket();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'ORDERS' | 'STOCK'>('ORDERS');
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketView, setTicketView] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');

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
        if (newOrder.tickets && newOrder.tickets.length > 0) {
          const lastTicket = newOrder.tickets[newOrder.tickets.length - 1];
          const nameMap = new Map(newOrder.items.map(i => [i.productId._id, i.productId.name]));
          setTickets(prev => [...prev, {
            ticketId: lastTicket._id,
            orderId: newOrder._id,
            tableNumber: newOrder.tableNumber,
            createdAt: lastTicket.createdAt,
            status: lastTicket.status || 'PENDING',
            items: lastTicket.items.map(it => ({
              name: nameMap.get(it.productId) || '',
              quantity: it.quantity,
              note: it.note || ''
            }))
          }]);
        }
      });

      socket.on('order_status_updated', (updatedOrder: Order) => {
        setOrders((prev) => 
          prev.map((order) => order._id === updatedOrder._id ? updatedOrder : order)
        );
        
        // Re-build tickets for this order to ensure sync
        // This handles status updates, added items (if any missed), etc.
        // But wait, if we rebuild, we might duplicate? 
        // No, we should replace tickets belonging to this order.
        
        // However, `tickets` state is a flat list of all tickets from all orders.
        // We need to update existing tickets of this order, or add new ones?
        // Simpler: Remove old tickets of this order and add new ones from updatedOrder.
        
        setTickets(prev => {
            const otherTickets = prev.filter(t => t.orderId !== updatedOrder._id);
            const newTickets: any[] = [];
            
            if (updatedOrder.tickets && updatedOrder.tickets.length > 0) {
                const nameMap = new Map(updatedOrder.items.map(i => [i.productId._id, i.productId.name]));
                updatedOrder.tickets.forEach(tk => {
                    newTickets.push({
                        ticketId: tk._id,
                        orderId: updatedOrder._id,
                        tableNumber: updatedOrder.tableNumber,
                        createdAt: tk.createdAt,
                        status: tk.status || updatedOrder.status, // Fallback to order status if ticket status missing (legacy)
                        items: tk.items.map(it => ({
                            name: nameMap.get(it.productId) || '',
                            quantity: it.quantity,
                            note: it.note || ''
                        }))
                    });
                });
            } else {
                 // Handle legacy orders without tickets array (if any)
                 const pendingItems = updatedOrder.items.filter(i => i.status === 'PENDING');
                 if (pendingItems.length > 0) {
                     newTickets.push({
                         ticketId: undefined, // Legacy
                         orderId: updatedOrder._id,
                         tableNumber: updatedOrder.tableNumber,
                         createdAt: updatedOrder.createdAt,
                         status: 'PENDING',
                         items: pendingItems.map(i => ({
                             name: i.productId.name,
                             quantity: i.quantity,
                             note: i.note || ''
                         }))
                     });
                 }
            }
            
            // We need to sort merged tickets? Or just append?
            // Usually we want them sorted by time.
            const merged = [...otherTickets, ...newTickets];
            return merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        });
      });

      socket.on('order_items_added', (ticket: any) => {
        // This event sends a single new ticket.
        // But `order_status_updated` might also fire?
        // If `order_status_updated` fires, it handles everything.
        // If we duplicate handling, we might get duplicates.
        // Let's assume `order_status_updated` is the source of truth for updates.
        // But `order_items_added` is specific.
        // Let's check backend: `updateOrder` emits BOTH.
        // So we should ignore `order_items_added` if `order_status_updated` covers it.
        // OR, `order_status_updated` is heavy (rebuilds everything).
        // `order_items_added` is light.
        // But `order_status_updated` is safer for consistency.
        // Let's stick to `order_status_updated` logic above which replaces tickets for the order.
        // So we can ignore `order_items_added` OR use it to append if we optimize.
        // Since we implemented full rebuild in `order_status_updated`, we can technically ignore this one to avoid race conditions/duplicates,
        // UNLESS `order_status_updated` arrives BEFORE this one and we miss something?
        // Actually, `order_status_updated` carries the full `populatedOrder` with ALL tickets.
        // So it is superior.
        // I will comment out `order_items_added` handling or keep it minimal/idempotent.
        
        // Actually, let's keep it simple: `order_status_updated` handles everything.
        // console.log('Items added', ticket);
      });

      return () => {
        socket.off('new_order');
        socket.off('order_status_updated');
        socket.off('order_items_added');
      };
    }
  }, [socket]);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders?status=PENDING,COOKING,READY,SERVED');
      const allOrders = data.sort((a: Order, b: Order) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      // Build tickets from orders
      const builtTickets: any[] = [];
      allOrders.forEach(order => {
        if (order.tickets && order.tickets.length > 0) {
          const nameMap = new Map(order.items.map(i => [i.productId._id, i.productId.name]));
          order.tickets.forEach(tk => {
            builtTickets.push({
              ticketId: tk._id,
              orderId: order._id,
              tableNumber: order.tableNumber,
              createdAt: tk.createdAt,
              status: tk.status || order.status, // Use ticket status, fallback to order status
              items: tk.items.map(it => ({
                name: nameMap.get(it.productId) || '',
                quantity: it.quantity,
                note: it.note || ''
              }))
            });
          });
        } else {
          const pendingItems = order.items.filter(i => i.status === 'PENDING');
          if (pendingItems.length > 0) {
            builtTickets.push({
              ticketId: undefined,
              orderId: order._id,
              tableNumber: order.tableNumber,
              createdAt: order.createdAt,
              status: 'PENDING',
              items: pendingItems.map(i => ({
                name: i.productId.name,
                quantity: i.quantity,
                note: i.note || ''
              }))
            });
          }
        }
      });
      setOrders(allOrders);
      setTickets(builtTickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, status: string, ticketId?: string) => {
    try {
      if (ticketId) {
          await api.put(`/orders/${orderId}/tickets/${ticketId}/status`, { status });
          // Optimistic update
          setTickets(prev => prev.map(t => t.ticketId === ticketId ? { ...t, status } : t));
      } else {
          // Legacy support
          await api.put(`/orders/${orderId}/status`, { status });
          setTickets(prev => prev.map(t => t.orderId === orderId ? { ...t, status } : t));
      }
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'border-yellow-500 bg-gray-800';
      case 'COOKING': return 'border-blue-500 bg-blue-900/20';
      case 'READY': return 'border-green-500 bg-green-900/20';
      case 'SERVED': return 'border-gray-500 bg-gray-800 opacity-50';
      default: return 'border-gray-500 bg-gray-800';
    }
  };

  const activeTickets = tickets.filter(t => {
      // Filter out completed/served tickets in ACTIVE view
      return t.status !== 'SERVED' && t.status !== 'COMPLETED';
  });

  const historyTickets = tickets.filter(t => {
    const today = new Date();
    const d = new Date(t.createdAt);
    return d.getFullYear() === today.getFullYear() &&
           d.getMonth() === today.getMonth() &&
           d.getDate() === today.getDate();
  });

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
              {viewMode === 'ORDERS' && (
                <div className="flex ml-4 bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setTicketView('ACTIVE')}
                    className={`px-3 py-2 rounded-md text-xs font-medium ${ticketView === 'ACTIVE' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:text-white'}`}
                  >
                    Active Tickets
                  </button>
                  <button
                    onClick={() => setTicketView('HISTORY')}
                    className={`px-3 py-2 rounded-md text-xs font-medium flex items-center gap-1 ${ticketView === 'HISTORY' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:text-white'}`}
                  >
                    <History size={12} /> Today
                  </button>
                </div>
              )}
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
              {(ticketView === 'ACTIVE' ? activeTickets : historyTickets).map((ticket, idx) => (
                <div 
                  key={`${ticket.orderId}-${idx}`} 
                  className={`p-4 rounded-lg border-l-4 shadow-md transition-all ${getStatusColor(ticket.status)}`}
                >
                  <div className="flex justify-between items-start mb-3 border-b border-gray-700 pb-2">
                    <div>
                      <span className="font-bold text-xl block">Table {ticket.tableNumber}</span>
                      <span className="text-gray-400 text-sm">#{ticket.orderId.slice(-4)}</span>
                    </div>
                    <div className="text-right">
                      <span className="flex items-center gap-1 text-sm font-mono text-gray-300">
                        <Clock size={14} />
                        {format(new Date(ticket.createdAt), 'HH:mm')}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded mt-1 inline-block
                        ${ticket.status === 'PENDING' ? 'bg-yellow-500 text-black' : 
                          ticket.status === 'COOKING' ? 'bg-blue-500 text-white' : 
                          ticket.status === 'READY' ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-200'}`}>
                        {ticket.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
                    <div className="mb-2">
                      <div className="text-xs font-bold text-yellow-500 uppercase tracking-wider mb-1">Items</div>
                      {ticket.items.map((item: any, i: number) => (
                        <div key={`t-${idx}-i-${i}`} className="flex justify-between items-start bg-yellow-900/20 p-2 rounded mb-1">
                          <div className="flex gap-2">
                            <span className="font-bold text-lg min-w-[24px] text-yellow-400">{item.quantity}x</span>
                            <div>
                              <span className="block font-medium text-white">{item.name}</span>
                              {item.note && (
                                <span className="text-yellow-400 text-sm italic">Note: {item.note}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto pt-2 border-t border-gray-700">
                    {ticket.status === 'PENDING' && (
                      <button 
                        onClick={() => updateStatus(ticket.orderId, 'COOKING', ticket.ticketId)}
                        className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded font-bold transition-colors flex items-center justify-center gap-2"
                      >
                        <ChefHat size={20} /> Start Cooking
                      </button>
                    )}
                    {ticket.status === 'COOKING' && (
                      <button 
                        onClick={() => updateStatus(ticket.orderId, 'READY', ticket.ticketId)}
                        className="w-full bg-green-600 hover:bg-green-700 py-3 rounded font-bold transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={20} /> Mark Ready
                      </button>
                    )}
                    {ticket.status === 'READY' && (
                      <div className="w-full bg-green-900/50 py-3 rounded font-bold text-center text-green-200 border border-green-700 flex items-center justify-center gap-2">
                        <CheckCircle size={20} /> Ready to Serve
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {(ticketView === 'ACTIVE' ? activeTickets : historyTickets).length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center text-gray-500 py-20">
                  <ChefHat size={64} className="mb-4 opacity-50" />
                  <p className="text-xl">No {ticketView === 'ACTIVE' ? 'active' : ''} orders</p>
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