import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import TableGrid from '../components/waiter/TableGrid';
import Receipt from '../components/pos/Receipt';
import PaymentModal from '../components/pos/PaymentModal';
import TransactionHistoryModal from '../components/pos/TransactionHistoryModal';
import { useReactToPrint } from 'react-to-print';
import { Plus, Minus, Trash2, LogOut, CheckCircle, LayoutGrid, Printer, RefreshCw, Search, History } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  price: number;
  category: string;
  imageUrl: string;
  isAvailable: boolean;
}

interface CartItem extends Product {
  quantity: number;
}

const POS: React.FC = () => {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [processing, setProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);
  
  // Table & Billing State
  const [viewMode, setViewMode] = useState<'MENU' | 'TABLES'>('MENU');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [activeBill, setActiveBill] = useState<any>(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [configs, setConfigs] = useState({ 
    tax: 0.1, 
    serviceCharge: 0.05,
    restaurantName: '',
    address: '',
    phone: '',
    receiptFooter: ''
  });

  const receiptRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
  });

  useEffect(() => {
    fetchProducts();
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const { data } = await api.get('/restaurant/configs');
      // API returns Restaurant object: { name, address, phone, configs: { tax, serviceCharge, ... } }
      setConfigs({
        tax: data.configs?.tax ?? 0.1,
        serviceCharge: data.configs?.serviceCharge ?? 0.05,
        restaurantName: data.name || 'Ordin Restaurant',
        address: data.address || '',
        phone: data.phone || '',
        receiptFooter: data.configs?.receiptFooter || ''
      });
    } catch (error) {
      console.error('Failed to fetch configs');
    }
  };

  const handleReprint = (order: any) => {
    setLastOrder(order);
    // Wait for state update then print
    setTimeout(() => {
      handlePrint && handlePrint();
    }, 100);
  };

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTableSelect = async (tableNumber: string) => {
    // If selecting from Modal (enforce flow), set table and close modal
    if (isTableModalOpen) {
        setSelectedTable(tableNumber);
        setIsTableModalOpen(false);
        // Also check if there's an active bill for this table to warn or switch mode?
        // For simple flow: Just select table. If it has active bill, user will see it when trying to add items?
        // Actually, if table is occupied, we should probably load the bill?
        // But for "Add to Order" scenario, we might want to just set table.
        // Let's keep it simple: Select Table -> If occupied, maybe load bill or warn.
        // For now, just select.
        return;
    }

    // Main Table View Logic
    try {
        const { data } = await api.get(`/orders/table/${tableNumber}`);
        setActiveBill(data);
        setSelectedTable(tableNumber);
        setViewMode('MENU');
    } catch (error: any) {
        if (error.response?.status === 404) {
            setActiveBill(null);
            setSelectedTable(tableNumber);
            setCart([]);
            setViewMode('MENU');
        } else {
            console.error(error);
            alert('Error checking table status');
        }
    }
  };

  const addToCart = (product: Product) => {
    if (activeBill) return; 
    
    // Enforce Table Selection
    if (!selectedTable) {
        setIsTableModalOpen(true);
        return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item._id === product._id);
      if (existingItem) {
        return prevCart.map((item) =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    if (activeBill) return;
    setCart((prevCart) => prevCart.filter((item) => item._id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    if (activeBill) return;
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item._id === productId) {
          const newQuantity = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter((item) => item.quantity > 0)
    );
  };

  const calculateTotal = () => {
    if (activeBill) return activeBill.totalAmount;
    const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    const tax = subtotal * configs.tax;
    const service = subtotal * configs.serviceCharge;
    return Math.round(subtotal + tax + service);
  };

  const handleCheckout = async (action: 'SAVE' | 'PAY' = 'PAY') => {
    if (!activeBill && cart.length === 0) return;
    if (!selectedTable && !activeBill) {
        setIsTableModalOpen(true);
        return;
    }
    
    if (action === 'PAY') {
        setIsPaymentModalOpen(true);
    } else {
        await handleSaveOrder();
    }
  };

  const handleSaveOrder = async () => {
      setProcessing(true);
      try {
          const totalAmount = calculateTotal();
          
          if (activeBill) {
              // If active bill exists, maybe update it? (Not implemented yet, just alert)
              alert('Order is already saved/active. Use Pay Bill to finish.');
          } else {
              // Create new order
              const { data } = await api.post('/orders', {
                  items: cart,
                  tableNumber: selectedTable,
                  totalAmount,
                  paymentMethod: 'PAY_LATER',
                  paymentStatus: 'PENDING'
              });
              setLastOrder(data);
              alert('Order Saved to Table ' + selectedTable);
              clearCurrent();
          }
      } catch (error: any) {
          console.error('Save failed', error);
          alert('Failed to save order');
      } finally {
          setProcessing(false);
      }
  };

  const handlePaymentConfirm = async (paymentPayload: any) => {
    setProcessing(true);
    try {
      let orderData;
      if (activeBill) {
        // Pay existing bill
        const { data } = await api.put(`/orders/${activeBill._id}/pay`, paymentPayload);
        orderData = data;
      } else {
        // Create new order and pay
        const totalAmount = calculateTotal();
        
        // 1. Create Order First
        const { data: createdOrder } = await api.post('/orders', {
            items: cart,
            tableNumber: selectedTable,
            totalAmount,
            status: 'PENDING' // Initially Pending
        });

        // 2. Process Payment immediately
        const { data: paidOrder } = await api.put(`/orders/${createdOrder._id}/pay`, paymentPayload);
        orderData = paidOrder;
      }

      setLastOrder(orderData);
      setOrderSuccess(true);
      
      setCart([]);
      setActiveBill(null);
      setSelectedTable(null);
      setIsPaymentModalOpen(false);
    } catch (error: any) {
      console.error('Checkout failed', error);
      alert(error.response?.data?.message || 'Checkout failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const clearCurrent = () => {
      setCart([]);
      setActiveBill(null);
      setSelectedTable(null);
  };

  const categories = ['All', ...new Set(products.map((p) => p.category))];
  
  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const isOrderPaid = activeBill && (activeBill.status === 'PAID' || activeBill.payment?.status === 'PAID');

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Header */}
      <header className="flex justify-between items-center mb-4 bg-white p-3 rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-800">Ordin POS</h1>
          <div className="flex gap-2">
            <button 
                onClick={() => setViewMode('MENU')}
                className={`px-4 py-2 rounded font-medium ${viewMode === 'MENU' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
                Menu
            </button>
            <button 
                onClick={() => setViewMode('TABLES')}
                className={`px-4 py-2 rounded font-medium ${viewMode === 'TABLES' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
                Tables (Bill)
            </button>
            <button 
                onClick={() => setIsHistoryOpen(true)}
                className="px-4 py-2 rounded font-medium bg-gray-100 hover:bg-gray-200 flex items-center gap-2 text-gray-700"
            >
                <History size={18} /> History
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
                Cashier: <span className="font-semibold text-gray-700">{user?.username}</span>
            </span>
            <Button variant="danger" size="sm" onClick={logout} className="flex items-center gap-2">
            <LogOut size={16} /> Logout
            </Button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-100px)]">
        {/* Left Side: Menu or Tables */}
        <div className="col-span-8 flex flex-col gap-4">
            {viewMode === 'TABLES' ? (
                <div className="bg-white p-6 rounded-lg shadow h-full overflow-y-auto">
                    <h2 className="text-xl font-bold mb-4">Select Table to Pay Bill</h2>
                    <TableGrid 
                        selectedTable={selectedTable}
                        onSelectTable={handleTableSelect}
                        allowSelectionWhenOccupied={true}
                    />
                    <div className="mt-6 grid grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-50 border border-green-500 rounded"></div> Available</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-50 border border-red-500 rounded"></div> Occupied (Unpaid)</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-orange-50 border border-orange-500 rounded"></div> Served (Eating)</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-yellow-50 border border-yellow-500 rounded"></div> Paid</div>
                    </div>
                </div>
            ) : (
                <>
                {/* Search & Categories */}
                <div className="bg-white p-3 rounded-lg shadow-sm flex flex-col gap-3">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    
                    {/* Categories */}
                    <div className="flex gap-2 overflow-x-auto">
                        {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                            activeCategory === category
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {category}
                        </button>
                        ))}
                    </div>
                </div>

                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto pr-2">
                    {loading ? (
                    <div className="flex justify-center items-center h-64">Loading products...</div>
                    ) : (
                    <div className="grid grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProducts.map((product) => (
                        <Card 
                            key={product._id} 
                            className={`cursor-pointer hover:shadow-lg transition-shadow border border-transparent hover:border-blue-500 group ${activeBill ? 'opacity-50 pointer-events-none' : ''}`}
                            onClick={() => addToCart(product)}
                        >
                            <div className="h-32 bg-gray-200 overflow-hidden relative">
                            {product.imageUrl ? (
                                <img 
                                src={product.imageUrl} 
                                alt={product.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                No Image
                                </div>
                            )}
                            {!product.isAvailable && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold">
                                Sold Out
                                </div>
                            )}
                            </div>
                            <div className="p-3">
                            <h3 className="font-semibold text-gray-800 truncate">{product.name}</h3>
                            <p className="text-blue-600 font-bold mt-1">
                                Rp {product.price.toLocaleString('id-ID')}
                            </p>
                            </div>
                        </Card>
                        ))}
                    </div>
                    )}
                </div>
                </>
            )}
        </div>

        {/* Right Side: Cart / Bill */}
        <Card className="col-span-4 flex flex-col h-full relative overflow-hidden">
          {orderSuccess && (
            <div className="absolute inset-0 bg-green-500/95 z-50 flex flex-col items-center justify-center text-white animate-in fade-in duration-300 p-8 text-center">
              <CheckCircle size={64} className="mb-4" />
              <h2 className="text-3xl font-bold">Payment Success!</h2>
              <div className="flex gap-4 mt-6">
                <Button onClick={() => handlePrint && handlePrint()} className="bg-white text-green-600 hover:bg-gray-100 flex gap-2">
                    <Printer size={20} /> Print Receipt
                </Button>
                <Button onClick={() => setOrderSuccess(false)} variant="secondary" className="border-white text-white hover:bg-green-600">
                    Close
                </Button>
              </div>
            </div>
          )}

          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800">
              {activeBill ? `Bill: Table ${selectedTable}` : 'Current Order'}
            </h2>
            <button 
                onClick={() => setIsTableModalOpen(true)}
                className={`text-sm font-normal px-3 py-1 rounded border flex items-center gap-2 ${selectedTable ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}
            >
                <LayoutGrid size={16} />
                {selectedTable ? `Table ${selectedTable}` : 'Select Table'}
            </button>
            {(cart.length > 0 || activeBill) && (
                <button onClick={clearCurrent} className="text-red-500 text-sm hover:underline ml-2">Clear</button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Show Active Bill Items if in Bill Mode */}
            {activeBill ? (
                activeBill.items.map((item: any) => (
                    <div key={item._id} className="flex justify-between items-center border-b pb-2">
                        <div>
                            <h4 className="font-medium">{item.productId?.name || 'Unknown'}</h4>
                            <div className="text-sm text-gray-500">{item.quantity} x Rp {item.unitPrice?.toLocaleString('id-ID')}</div>
                        </div>
                        <div className="font-bold">
                            Rp {(item.quantity * item.unitPrice).toLocaleString('id-ID')}
                        </div>
                    </div>
                ))
            ) : (
                /* Show Cart Items if in New Order Mode */
                cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <div className="mb-2">🛒</div>
                    <p>No items selected</p>
                    <p className="text-xs text-gray-400">Select table to start ordering</p>
                </div>
                ) : (
                cart.map((item) => (
                    <div key={item._id} className="flex gap-3 bg-white p-2 rounded border hover:border-blue-300 transition-colors">
                    <div className="flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                        <h4 className="font-medium text-gray-800 line-clamp-1">{item.name}</h4>
                        <p className="font-semibold text-gray-900">
                            Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                        </p>
                        </div>
                        
                        <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center bg-gray-100 rounded-lg">
                            <button 
                            onClick={(e) => { e.stopPropagation(); updateQuantity(item._id, -1); }}
                            className="p-1 hover:bg-gray-200 rounded-l-lg text-gray-600"
                            >
                            <Minus size={14} />
                            </button>
                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                            <button 
                            onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                            className="p-1 hover:bg-gray-200 rounded-r-lg text-gray-600"
                            >
                            <Plus size={14} />
                            </button>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); removeFromCart(item._id); }}
                            className="text-red-500 hover:text-red-700 ml-auto"
                        >
                            <Trash2 size={16} />
                        </button>
                        </div>
                    </div>
                    </div>
                ))
                )
            )}
          </div>

          <div className="p-4 border-t bg-gray-50 space-y-4">
            <div className="space-y-2">
                {/* Simplified Total Calculation */}
                {activeBill ? (
                     <div className="space-y-2">
                         <div className="flex justify-between text-gray-600">
                             <span>Subtotal</span>
                             <span>Rp {activeBill.items.reduce((t: number, i: any) => t + (i.unitPrice * i.quantity), 0).toLocaleString('id-ID')}</span>
                         </div>
                         <div className="flex justify-between text-gray-600">
                             <span>Tax ({(configs.tax * 100).toFixed(0)}%)</span>
                             <span>Rp {(activeBill.items.reduce((t: number, i: any) => t + (i.unitPrice * i.quantity), 0) * configs.tax).toLocaleString('id-ID')}</span>
                         </div>
                         {configs.serviceCharge > 0 && (
                             <div className="flex justify-between text-gray-600">
                                 <span>Service ({(configs.serviceCharge * 100).toFixed(0)}%)</span>
                                 <span>Rp {(activeBill.items.reduce((t: number, i: any) => t + (i.unitPrice * i.quantity), 0) * configs.serviceCharge).toLocaleString('id-ID')}</span>
                             </div>
                         )}
                         <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
                            <span>Total Bill</span>
                            <span>Rp {activeBill.totalAmount.toLocaleString('id-ID')}</span>
                         </div>
                     </div>
                ) : (
                    <>
                    <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span>Rp {cart.reduce((t, i) => t + i.price * i.quantity, 0).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                        <span>Tax ({(configs.tax * 100).toFixed(0)}%)</span>
                        <span>Rp {(cart.reduce((t, i) => t + i.price * i.quantity, 0) * configs.tax).toLocaleString('id-ID')}</span>
                    </div>
                    {configs.serviceCharge > 0 ? (
                        <div className="flex justify-between text-gray-600">
                            <span>Service ({(configs.serviceCharge * 100).toFixed(0)}%)</span>
                            <span>Rp {(cart.reduce((t, i) => t + i.price * i.quantity, 0) * configs.serviceCharge).toLocaleString('id-ID')}</span>
                        </div>
                    ) : null}
                    <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
                        <span>Total</span>
                        <span>Rp {calculateTotal().toLocaleString('id-ID')}</span>
                    </div>
                    </>
                )}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <Button 
                  className="w-full py-3 text-lg bg-white text-blue-600 border border-blue-200 hover:bg-blue-50"
                  disabled={(cart.length === 0 && !activeBill) || processing || isOrderPaid}
                  onClick={() => handleCheckout('SAVE')}
                >
                  {processing ? '...' : 'Save Order'}
                </Button>
                <Button 
                  className="w-full py-3 text-lg shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={(cart.length === 0 && !activeBill) || processing || isOrderPaid}
                  onClick={() => handleCheckout('PAY')}
                >
                  {processing ? 'Processing...' : (activeBill ? (isOrderPaid ? 'Paid' : 'Pay Bill') : 'Pay Now')}
                </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Hidden Receipt for Printing */}
      <div className="hidden">
        <Receipt ref={receiptRef} order={lastOrder} configs={configs} />
      </div>

      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        totalAmount={calculateTotal()}
        onConfirm={handlePaymentConfirm}
      />

      <TransactionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onReprint={handleReprint}
      />

      <Modal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        title="Select Table"
      >
        <TableGrid
          selectedTable={selectedTable}
          onSelectTable={handleTableSelect}
        />
      </Modal>
    </div>
  );
};

export default POS;
