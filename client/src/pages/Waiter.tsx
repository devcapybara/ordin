import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import TableGrid from '../components/waiter/TableGrid';
import MobileMenu from '../components/waiter/MobileMenu';
import OrderHistory from '../components/waiter/OrderHistory';
import Button from '../components/ui/Button';
import api from '../services/api';
import { LayoutGrid, History, LogOut, ChevronLeft, CheckCircle } from 'lucide-react';

const Waiter: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'tables' | 'orders'>('tables');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedTableStatus, setSelectedTableStatus] = useState<string | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [existingOrder, setExistingOrder] = useState<any>(null);
  const [configs, setConfigs] = useState({ tax: 0.1, serviceCharge: 0.05 });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const { data } = await api.get('/restaurant/configs');
      setConfigs({
        tax: data.configs?.tax ?? 0.1,
        serviceCharge: data.configs?.serviceCharge ?? 0.05
      });
    } catch (error) {
      console.error('Failed to fetch configs');
    }
  };

  const handleSelectTable = async (table: string, status?: string) => {
    setSelectedTable(table);
    setSelectedTableStatus(status || null);
    
    // Check if there is an existing order for this table
    if (status === 'OCCUPIED' || status === 'SERVED' || status === 'PARTIAL_PAID') {
        try {
            const { data } = await api.get(`/orders/table/${table}`);
            setExistingOrder(data);
        } catch (error) {
            console.error('Failed to fetch existing order', error);
            setExistingOrder(null);
        }
    } else {
        setExistingOrder(null);
    }
  };

  const handleClearTable = async () => {
    if (!selectedTable) return;
    try {
      await api.post('/tables/clear', { tableNumber: selectedTable });
      setSelectedTable(null);
      setSelectedTableStatus(null);
      setExistingOrder(null);
    } catch (error: any) {
      console.error('Failed to clear table', error);
      alert(error.response?.data?.message || 'Failed to clear table');
    }
  };

  const handlePlaceOrder = async (items: any[]) => {
    if (!selectedTable) return;
    
    try {
      setPlacingOrder(true);
      
      // LOGIC TO MERGE HIDDEN PAID ITEMS
      let fullItems = [...items];
      if (existingOrder && existingOrder.items) {
           const hiddenItems = existingOrder.items.filter((item: any) => {
             const remaining = item.quantity - (item.paidQuantity || 0);
             return remaining <= 0;
           }).map((item: any) => ({
              _id: item.productId._id,
              name: item.productId.name,
              price: item.productId.price || item.unitPrice,
              quantity: item.quantity, // Keep full original quantity
              note: item.note,
              status: item.status
           }));
           
           // Also for items that are in the cart (visible), we must ensure their quantity 
           // reflects the TOTAL (Paid + New/Remaining), because we stripped paidQty for display.
           fullItems = fullItems.map(cartItem => {
               const original = existingOrder.items.find((i: any) => i.productId._id === cartItem._id);
               const originalPaid = original ? (original.paidQuantity || 0) : 0;
               return {
                   ...cartItem,
                   quantity: cartItem.quantity + originalPaid
               };
           });
           
           fullItems = [...fullItems, ...hiddenItems];
      }

      const subtotal = fullItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const discountAmount = existingOrder?.discountAmount || 0;
      const promoCode = existingOrder?.promoCode || '';
      
      const afterDiscount = Math.max(0, subtotal - discountAmount);
      const taxAmount = afterDiscount * configs.tax;
      const serviceChargeAmount = afterDiscount * configs.serviceCharge;
      const totalAmount = Math.round(afterDiscount + taxAmount + serviceChargeAmount);

      const orderPayload = {
        items: fullItems,
        tableNumber: selectedTable,
        subtotal,
        taxAmount,
        serviceChargeAmount,
        discountAmount,
        promoCode,
        totalAmount
      };

      if (existingOrder) {
          // Update existing order
          await api.put(`/orders/${existingOrder._id}`, orderPayload);
          alert('Order Updated!');
      } else {
          // Create new order
          await api.post('/orders', {
            ...orderPayload,
            paymentMethod: 'PAY_LATER',
            paymentStatus: 'PENDING'
          });
          alert('Order sent to kitchen!');
      }

      setSelectedTable(null); // Return to table grid
      setSelectedTableStatus(null);
      setExistingOrder(null);
      setActiveTab('orders'); // Switch to orders view to see status
    } catch (error) {
      console.error('Failed to place order', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  // Map existing order items to CartItems format, filtering out fully paid items
  const initialItems = existingOrder ? existingOrder.items.map((item: any) => {
      const remainingQty = item.quantity - (item.paidQuantity || 0);
      if (remainingQty <= 0) return null;

      return {
        _id: item.productId._id,
        name: item.productId.name,
        price: item.productId.price || item.unitPrice,
        category: item.productId.category || '',
        imageUrl: item.productId.imageUrl || '',
        isAvailable: true,
        quantity: remainingQty,
        note: item.note,
        status: item.status
      };
  }).filter(Boolean) : [];

  const renderContent = () => {
    if (activeTab === 'orders') {
      return (
        <div className="h-full overflow-y-auto">
            <OrderHistory />
        </div>
      );
    }

    if (selectedTable) {
      // If table is Dirty or Paid, show Clear Table option
      if (selectedTableStatus === 'DIRTY' || selectedTableStatus === 'PAID') {
        return (
          <div className="flex flex-col h-full bg-white">
            <div className="bg-white border-b p-3 flex items-center gap-2 sticky top-0 z-10">
              <button 
                onClick={() => setSelectedTable(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-lg font-bold">Table {selectedTable}</h2>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
              <div className={`p-6 rounded-full ${selectedTableStatus === 'DIRTY' ? 'bg-gray-100 text-gray-500' : 'bg-yellow-50 text-yellow-600'}`}>
                <CheckCircle size={64} />
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Table is {selectedTableStatus}
                </h3>
                <p className="text-gray-500">
                  {selectedTableStatus === 'DIRTY' 
                    ? 'This table needs cleaning before seating new customers.' 
                    : 'Payment has been completed. Is the table ready for the next customer?'}
                </p>
              </div>

              <div className="w-full space-y-3">
                <Button 
                  onClick={handleClearTable} 
                  className="w-full py-4 text-lg font-bold shadow-lg shadow-blue-200"
                >
                  Mark as Clean / Free
                </Button>
                
                <Button 
                  variant="secondary" 
                  onClick={() => setSelectedTable(null)} 
                  className="w-full py-3"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="flex flex-col h-full">
          <div className="bg-white border-b p-3 flex items-center gap-2 sticky top-0 z-10">
            <button 
              onClick={() => setSelectedTable(null)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-lg font-bold">
                Table {selectedTable} 
                {existingOrder && <span className="text-sm font-normal text-blue-600 ml-2">(Editing)</span>}
            </h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <MobileMenu 
              tableNumber={selectedTable}
              onPlaceOrder={handlePlaceOrder}
              onCancel={() => setSelectedTable(null)}
              initialItems={initialItems}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        <div className="p-4 bg-white border-b sticky top-0 z-10">
          <h1 className="text-xl font-bold text-gray-800">Select Table</h1>
          <p className="text-sm text-gray-500">Tap a table to take order</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <TableGrid 
            onSelectTable={handleSelectTable} 
            selectedTable={selectedTable}
            allowSelectionWhenOccupied={true} 
          />
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-hidden relative">
        {renderContent()}
      </div>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t flex justify-around items-center p-2 pb-safe shadow-[0_-1px_3px_rgba(0,0,0,0.1)] z-20">
        <button
          onClick={() => {
            setActiveTab('tables');
            setSelectedTable(null);
            setExistingOrder(null);
          }}
          className={`flex flex-col items-center p-2 rounded-lg min-w-[64px] transition-colors ${
            activeTab === 'tables' ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <LayoutGrid size={24} />
          <span className="text-xs font-medium mt-1">Tables</span>
        </button>
        
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col items-center p-2 rounded-lg min-w-[64px] transition-colors ${
            activeTab === 'orders' ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <History size={24} />
          <span className="text-xs font-medium mt-1">Orders</span>
        </button>

        <button
          onClick={logout}
          className="flex flex-col items-center p-2 rounded-lg min-w-[64px] text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={24} />
          <span className="text-xs font-medium mt-1">Logout</span>
        </button>
      </nav>
    </div>
  );
};

export default Waiter;
