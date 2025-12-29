import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import TableGrid from '../components/waiter/TableGrid';
import MobileMenu from '../components/waiter/MobileMenu';
import OrderHistory from '../components/waiter/OrderHistory';
import api from '../services/api';
import { LayoutGrid, History, LogOut, ChevronLeft } from 'lucide-react';

const Waiter: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'tables' | 'orders'>('tables');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);

  const handleSelectTable = (table: string) => {
    setSelectedTable(table);
  };

  const handlePlaceOrder = async (items: any[]) => {
    if (!selectedTable) return;
    
    try {
      setPlacingOrder(true);
      await api.post('/orders', {
        items,
        tableNumber: selectedTable,
        totalAmount: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        paymentMethod: 'PAY_LATER',
        paymentStatus: 'PENDING'
      });
      // Don't clear table immediately, let user decide when to leave
      alert('Order sent to kitchen!');
      setSelectedTable(null); // Return to table grid
      setActiveTab('orders'); // Switch to orders view to see status
    } catch (error) {
      console.error('Failed to place order', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  const renderContent = () => {
    if (activeTab === 'orders') {
      return <OrderHistory />;
    }

    if (selectedTable) {
      return (
        <div className="flex flex-col h-full">
          <div className="bg-white border-b p-3 flex items-center gap-2 sticky top-0 z-10">
            <button 
              onClick={() => setSelectedTable(null)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-lg font-bold">Table {selectedTable}</h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <MobileMenu 
              tableNumber={selectedTable}
              onPlaceOrder={handlePlaceOrder}
              onCancel={() => setSelectedTable(null)}
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
