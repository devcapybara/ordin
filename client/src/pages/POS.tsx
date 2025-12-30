import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import TableGrid from '../components/waiter/TableGrid';
import Receipt from '../components/pos/Receipt';
import PaymentModal from '../components/pos/PaymentModal';
import PinModal from '../components/pos/PinModal';
import TransactionHistoryModal from '../components/pos/TransactionHistoryModal';
import ShiftModals from '../components/pos/ShiftModals';
import SplitBillModal from '../components/pos/SplitBillModal';
import { useReactToPrint } from 'react-to-print';

import { Plus, Minus, Trash2, LogOut, CheckCircle, LayoutGrid, Printer, RefreshCw, Search, History, Tag, Lock, Split } from 'lucide-react';
interface Product {
  _id: string;
  name: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
}

interface CartItem extends Product {
  quantity: number;
  note?: string;
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
  
  // Shift State
  const [currentShift, setCurrentShift] = useState<any>(null);
  const [isShiftLoading, setIsShiftLoading] = useState(true);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);

  // Table & Billing State
  const [viewMode, setViewMode] = useState<'MENU' | 'TABLES'>('MENU');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [activeBill, setActiveBill] = useState<any>(null); // Keeps track of the ORDER OBJECT if editing
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [splitItems, setSplitItems] = useState<any[]>([]);
  const [splitAmount, setSplitAmount] = useState(0);

  // Promo State
  const [promoCode, setPromoCode] = useState('');
  const [inputPromo, setInputPromo] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

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
    checkActiveShift();
  }, []);

  const checkActiveShift = async () => {
    try {
      const { data } = await api.get('/shifts/current');
      setCurrentShift(data);
    } catch (error: any) {
      // If 404 or other error, assume no active shift
      setCurrentShift(null);
    } finally {
      setIsShiftLoading(false);
    }
  };

  const fetchConfigs = async () => {
    try {
      const { data } = await api.get('/restaurant/configs');
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
    if (isTableModalOpen) {
        setSelectedTable(tableNumber);
        setIsTableModalOpen(false);
        // After selecting table, try to load its order
        loadTableOrder(tableNumber);
        return;
    }

    loadTableOrder(tableNumber);
  };

  const loadTableOrder = async (tableNumber: string) => {
    try {
        const { data } = await api.get(`/orders/table/${tableNumber}`);
        // Populate Cart with existing order items
        setActiveBill(data);
        
        const mappedCart: CartItem[] = data.items.map((item: any) => ({
            _id: item.productId._id,
            name: item.productId.name,
            price: item.productId.price || item.unitPrice,
            category: item.productId.category || '',
            imageUrl: item.productId.imageUrl || '',
            isAvailable: true,
            quantity: item.quantity,
            note: item.note
        }));

        setCart(mappedCart);
        setPromoCode(data.promoCode || '');
        setInputPromo(data.promoCode || '');
        setDiscountAmount(data.discountAmount || 0);

        setSelectedTable(tableNumber);
        setViewMode('MENU');
    } catch (error: any) {
        if (error.response?.status === 404) {
            // No active order, clear everything for new order
            setActiveBill(null);
            setCart([]);
            setPromoCode('');
            setInputPromo('');
            setDiscountAmount(0);
            setSelectedTable(tableNumber);
            setViewMode('MENU');
        } else {
            console.error(error);
            alert('Error checking table status');
        }
    }
  };

  const addToCart = (product: Product) => {
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

  const handleProtectedAction = (action: () => void) => {
    // If activeBill exists (order already sent), require PIN for sensitive actions
    if (activeBill) {
        setPendingAction(() => action);
        setIsPinModalOpen(true);
    } else {
        // If just building cart, allow freely
        action();
    }
  };

  const removeFromCart = (productId: string) => {
    handleProtectedAction(() => {
        setCart((prevCart) => prevCart.filter((item) => item._id !== productId));
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    if (delta < 0) {
        // Decreasing quantity
        handleProtectedAction(() => {
            setCart((prevCart) =>
                prevCart.map((item) => {
                  if (item._id === productId) {
                    const newQuantity = Math.max(0, item.quantity + delta);
                    return { ...item, quantity: newQuantity };
                  }
                  return item;
                }).filter((item) => item.quantity > 0)
              );
        });
    } else {
        // Increasing quantity - Safe
        setCart((prevCart) =>
            prevCart.map((item) => {
              if (item._id === productId) {
                const newQuantity = Math.max(0, item.quantity + delta);
                return { ...item, quantity: newQuantity };
              }
              return item;
            }).filter((item) => item.quantity > 0)
          );
    }
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const afterDiscount = Math.max(0, subtotal - discountAmount);
    const tax = afterDiscount * configs.tax;
    const service = afterDiscount * configs.serviceCharge;
    return Math.round(afterDiscount + tax + service);
  };

  const handleApplyPromo = async () => {
    if (!inputPromo) return;
    try {
        const subtotal = calculateSubtotal();
        const { data } = await api.post('/promos/validate', {
            code: inputPromo,
            orderAmount: subtotal
        });

        if (data.isValid) {
            setDiscountAmount(data.discount);
            setPromoCode(data.promoCode);
            alert(`Promo applied! Discount: Rp ${data.discount.toLocaleString('id-ID')}`);
        }
    } catch (error: any) {
        alert(error.response?.data?.message || 'Invalid Promo Code');
        setDiscountAmount(0);
        setPromoCode('');
    }
  };

  const handleCheckout = async (action: 'SAVE' | 'PAY' = 'PAY') => {
    if (cart.length === 0) return;
    if (!selectedTable) {
        setIsTableModalOpen(true);
        return;
    }
    
    if (action === 'PAY') {
        // Reset split state for full payment
        setSplitItems([]);
        setSplitAmount(0);
        setIsPaymentModalOpen(true);
    } else {
        await handleSaveOrder();
    }
  };

  const handleOpenSplitBill = () => {
      setSplitItems([]);
      setSplitAmount(0);
      setIsSplitModalOpen(true);
  };

  const handleProceedToSplit = (itemsToPay: any[], amount: number) => {
      setSplitItems(itemsToPay);
      setSplitAmount(amount);
      setIsSplitModalOpen(false);
      setIsPaymentModalOpen(true);
  };

  const getFullOrderPayload = () => {
      // We need to merge the current visible cart with the hidden fully paid items
      // to ensure we don't accidentally delete paid items from the backend.
      let fullItems = [...cart];
      
      if (activeBill && activeBill.items) {
          const hiddenPaidItems = activeBill.items.filter((item: any) => {
             const remaining = item.quantity - (item.paidQuantity || 0);
             return remaining <= 0;
          }).map((item: any) => ({
              _id: item.productId._id,
              name: item.productId.name,
              price: item.productId.price || item.unitPrice,
              quantity: item.quantity, // Restore full quantity for DB
              note: item.note,
              // We don't need other fields for payload construction usually, 
              // but we need to ensure the backend recognizes this as the same item.
              // Backend maps by productId usually.
          }));
          
          // However, the backend expects a flat list of items to replace the current list.
          // We need to be careful. The `cart` items might have updated quantities.
          // `cart` items represent the *unpaid* portion + *paid* portion?
          // No, `cart` currently represents ONLY the unpaid portion (because of loadTableOrder change).
          // But `item.quantity` in `cart` is what the user SEES (remaining).
          // If we send this to backend, backend will set `quantity` to this remaining value.
          // BUT `paidQuantity` in DB will stay as is.
          // IF `paidQuantity` > `quantity` (new quantity), that's invalid.
          // We need to ADD the `paidQuantity` back to the `cart` quantity before sending to backend?
          
          // Let's re-read loadTableOrder logic:
          // We set cart quantity = item.quantity - item.paidQuantity.
          
          // So if User had 2, paid 1. Cart has 1.
          // If we send 1 to backend. Backend sets quantity = 1.
          // But paidQuantity is still 1. 
          // So effectively total is 1, paid 1. Remaining 0.
          // This seems "okay" for the *remaining* logic, BUT we lost the history that there were 2 originally.
          
          // User wants "hilangkan menu yang sudah dibayar dari orderan lama" (Remove paid menu from old order).
          // This implies they might actually WANT to reduce the order quantity?
          // "Menu di pesanan lama tidak berkurang" -> "Menu in old order doesn't decrease".
          // This strongly suggests they want the *displayed* quantity to match the *unpaid* quantity.
          
          // If I change the DB quantity to match the remaining quantity, then we lose the record of the sale?
          // No, the Sale is recorded in `payments` array and `ActivityLog`.
          // But the `Order` object usually represents the "Table State".
          
          // If I reduce the Order quantity to 1 (from 2), and paidQuantity is 1.
          // Then paidQuantity becomes >= quantity. Order is fully paid.
          
          // WAIT. If I reduce quantity to 1. And paidQuantity is 1.
          // Then the system thinks "You ordered 1, and you paid for 1".
          // It forgets you ordered 2.
          
          // BUT, `payOrder.js` checks `order.totalPaid` vs `order.totalAmount`.
          // `totalAmount` is calculated from `items`.
          // If we reduce items, `totalAmount` decreases.
          // `totalPaid` remains high.
          // `totalPaid` > `totalAmount`. That's weird but implies "Overpaid" or "Fully Paid".
          
          // Let's look at the requirement again: "menu di pesanan lama tidak berkurang... hilangkan menu yang sudah dibayar"
          // This implies a VISUAL reduction in the active list.
          // I think my `loadTableOrder` change achieves the VISUAL reduction.
          
          // The Problem: If I save the "Reduced" list to the backend...
          // I need to decide: Do I restore the full quantity (to keep history) or do I actually reduce the order size?
          
          // If I restore full quantity:
          // Cart has 1. I add 1 (paid). Total sent 2.
          // Backend saves 2.
          // Next load: 2 - 1 = 1. Cart shows 1.
          // THIS IS CORRECT behavior for a persistent order.
          
          // So, I MUST restore the `paidQuantity` to the `cart` items before sending.
          // AND I must include the fully hidden items.
      }
      
      // Reconstruct full items
      const payloadItems = cart.map(cartItem => {
          let originalPaidQty = 0;
          if (activeBill && activeBill.items) {
              const original = activeBill.items.find((i: any) => i.productId._id === cartItem._id);
              if (original) originalPaidQty = original.paidQuantity || 0;
          }
          return {
              ...cartItem,
              quantity: cartItem.quantity + originalPaidQty
          };
      });
      
      // Add back fully hidden items
      if (activeBill && activeBill.items) {
          const hiddenItems = activeBill.items.filter((item: any) => {
             const remaining = item.quantity - (item.paidQuantity || 0);
             return remaining <= 0; // These are not in cart
          }).map((item: any) => ({
             ...item,
             _id: item.productId._id, // Ensure ID format matches
             quantity: item.quantity // Keep original total quantity
          }));
          
          // We need to format hiddenItems correctly to match cart structure for the payload
          // The payload expects: { _id (product), quantity, note, ... }
          const formattedHidden = hiddenItems.map((item: any) => ({
              _id: item.productId._id,
              name: item.productId.name,
              price: item.productId.price || item.unitPrice,
              quantity: item.quantity,
              note: item.note
          }));
          
          return [...payloadItems, ...formattedHidden];
      }
      
      return payloadItems;
  };

  const handleSaveOrder = async () => {
      setProcessing(true);
      try {
          const subtotal = calculateSubtotal(); 
          // Note: subtotal here is based on CART (Remaining). 
          // But we need to send the TOTAL (Historic) values to backend?
          // Backend recalculates `totalAmount` based on `items` sent.
          // So if we send "Restored" items, backend calculates "Full Total".
          // This is correct for keeping the Order record intact.
          
          // However, we need to be careful about the `subtotal` etc we send in the body.
          // The backend `updateOrder` takes `items` and `subtotal` etc from body.
          // It trusts the frontend values.
          
          // We should calculate the FULL subtotal.
          const fullItems = getFullOrderPayload();
          const fullSubtotal = fullItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
          
          // Recalculate totals based on full subtotal
          const fullDiscount = discountAmount; // Assuming discount applies to whole?
          const fullTax = (fullSubtotal - fullDiscount) * configs.tax;
          const fullService = (fullSubtotal - fullDiscount) * configs.serviceCharge;
          const fullTotal = Math.round((fullSubtotal - fullDiscount) + fullTax + fullService);

          const orderPayload = {
            items: fullItems,
            tableNumber: selectedTable,
            subtotal: fullSubtotal,
            taxAmount: fullTax,
            serviceChargeAmount: fullService,
            discountAmount: fullDiscount,
            promoCode,
            totalAmount: fullTotal
          };

          if (activeBill) {
              // Update existing order
              const { data } = await api.put(`/orders/${activeBill._id}`, orderPayload);
              setLastOrder(data);
              alert('Order Updated for Table ' + selectedTable);
              
              // Refresh the view (reload to filter paid items again)
              loadTableOrder(selectedTable!);
          } else {
              // Create new order (No hidden items usually)
              const { data } = await api.post('/orders', {
                  ...orderPayload,
                  paymentMethod: 'PAY_LATER',
                  paymentStatus: 'PENDING'
              });
              setLastOrder(data);
              alert('Order Saved to Table ' + selectedTable);
              loadTableOrder(selectedTable!); // Load to set state correctly
          }
          // clearCurrent(); // Don't clear, we reloaded
      } catch (error: any) {
          console.error('Save failed', error);
          alert(error.response?.data?.message || 'Failed to save order');
          setProcessing(false); // Only stop processing on error, success reloads
      } finally {
          // setProcessing(false); // Done in success/error blocks to handle reload flow
      }
  };

  const handlePaymentConfirm = async (paymentPayload: any) => {
    setProcessing(true);
    try {
      const subtotal = calculateSubtotal();
      const totalAmount = calculateTotal();
      const orderPayload = {
        items: cart,
        tableNumber: selectedTable,
        subtotal,
        taxAmount: (subtotal - discountAmount) * configs.tax,
        serviceChargeAmount: (subtotal - discountAmount) * configs.serviceCharge,
        discountAmount,
        promoCode,
        totalAmount
      };

      let orderData;
      if (activeBill) {
        // Update first then pay
        const { data: updatedOrder } = await api.put(`/orders/${activeBill._id}`, orderPayload);
        // Pay existing bill (Full or Split)
        const payPayload = {
            ...paymentPayload,
            itemsToPay: splitItems.length > 0 ? splitItems : undefined
        };
        const { data: paidResponse } = await api.put(`/orders/${updatedOrder._id}/pay`, payPayload);
        orderData = paidResponse.receipt || paidResponse;
      } else {
        // Create new order and pay (Always Full)
        // 1. Create Order First
        const { data: createdOrder } = await api.post('/orders', {
            ...orderPayload,
            status: 'PENDING'
        });

        // 2. Process Payment immediately
        const { data: paidResponse } = await api.put(`/orders/${createdOrder._id}/pay`, paymentPayload);
        orderData = paidResponse.receipt || paidResponse;
      }

      setLastOrder(orderData);
      setOrderSuccess(true);
      
      clearCurrent();
      setIsPaymentModalOpen(false);
      
      // Update shift cash data quietly
      checkActiveShift();
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
      setPromoCode('');
      setInputPromo('');
      setDiscountAmount(0);
  };

  const categories = ['All', ...new Set(products.map((p) => p.category))];
  
  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const isOrderPaid = activeBill && activeBill.status === 'PAID';
  const subtotal = calculateSubtotal();

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
            <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setShowCloseShiftModal(true)} 
                className="flex items-center gap-2 border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                disabled={!currentShift}
            >
                <Lock size={16} /> Close Shift
            </Button>
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
                    <h2 className="text-xl font-bold mb-4">Select Table</h2>
                    <TableGrid 
                        selectedTable={selectedTable}
                        onSelectTable={handleTableSelect}
                        allowSelectionWhenOccupied={true}
                    />
                    <div className="mt-6 grid grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-50 border border-green-500 rounded"></div> Available</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-50 border border-red-500 rounded"></div> Occupied / Partial</div>
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
                            className={`cursor-pointer hover:shadow-lg transition-shadow border border-transparent hover:border-blue-500 group ${isOrderPaid ? 'opacity-50 pointer-events-none' : ''}`}
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
              {activeBill ? `Editing: Table ${selectedTable}` : 'New Order'}
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
            {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <div className="mb-2">🛒</div>
                <p>No items selected</p>
                <p className="text-xs text-gray-400">Select table to start ordering</p>
            </div>
            ) : (
            cart.map((item) => {
                // Determine if this is a new item or added quantity
                let isNew = false;
                let addedQty = 0;
                
                if (activeBill) {
                    const originalItem = activeBill.items.find((i: any) => i.productId._id === item._id);
                    if (!originalItem) {
                        isNew = true;
                    } else {
                        // Original quantity is stored in activeBill.items.quantity
                        // But wait, when we loaded the cart, we subtracted paidQuantity?
                        // No, loadTableOrder sets cart.quantity = item.quantity - paidQuantity.
                        // Actually, activeBill.items has the TOTAL quantity ever ordered.
                        // The cart in POS tracks the CURRENT DESIRED total quantity (unpaid part).
                        
                        // Let's simplify: 
                        // If activeBill exists, we check if this item was present in the *loaded* state.
                        // We need to compare with `activeBill` data.
                        
                        // However, `cart` state is mutable. 
                        // A better way is to compare with `activeBill.items`.
                        
                        const originalQty = originalItem.quantity - (originalItem.paidQuantity || 0);
                        if (item.quantity > originalQty) {
                             addedQty = item.quantity - originalQty;
                        }
                    }
                }

                return (
                <div key={item._id} className={`flex gap-3 bg-white p-2 rounded border hover:border-blue-300 transition-colors ${isNew || addedQty > 0 ? 'border-l-4 border-l-yellow-400' : ''}`}>
                <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                        <h4 className="font-medium text-gray-800 line-clamp-1">
                            {item.name} 
                            {isNew && <span className="ml-2 text-[10px] font-bold bg-yellow-100 text-yellow-700 px-1 rounded">NEW</span>}
                            {addedQty > 0 && <span className="ml-2 text-[10px] font-bold bg-green-100 text-green-700 px-1 rounded">+{addedQty}</span>}
                        </h4>
                        {(isNew || addedQty > 0) && <span className="text-xs text-yellow-600 italic">Confirm addition</span>}
                    </div>
                    <p className="font-semibold text-gray-900">
                        Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                    </p>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center bg-gray-100 rounded-lg">
                        <button 
                        onClick={(e) => { e.stopPropagation(); updateQuantity(item._id, -1); }}
                        className="p-1 hover:bg-gray-200 rounded-l-lg text-gray-600"
                        disabled={isOrderPaid}
                        >
                        <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button 
                        onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                        className="p-1 hover:bg-gray-200 rounded-r-lg text-gray-600"
                        disabled={isOrderPaid}
                        >
                        <Plus size={14} />
                        </button>
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); removeFromCart(item._id); }}
                        className="text-red-500 hover:text-red-700 ml-auto"
                        disabled={isOrderPaid}
                    >
                        <Trash2 size={16} />
                    </button>
                    </div>
                </div>
                </div>
            );
            })
            )}
          </div>

          <div className="p-4 border-t bg-gray-50 space-y-4">
            {/* Promo Code Input */}
            {!isOrderPaid && (
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Promo Code"
                            value={inputPromo}
                            onChange={(e) => setInputPromo(e.target.value.toUpperCase())}
                            className="w-full pl-9 pr-3 py-2 border rounded text-sm uppercase"
                            disabled={!!promoCode} 
                        />
                    </div>
                    {promoCode ? (
                         <Button onClick={() => { setPromoCode(''); setDiscountAmount(0); setInputPromo(''); }} size="sm" variant="danger">
                             Remove
                         </Button>
                    ) : (
                        <Button onClick={handleApplyPromo} size="sm" disabled={!inputPromo || cart.length === 0}>
                            Apply
                        </Button>
                    )}
                </div>
            )}

            <div className="space-y-2">
                <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                
                {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600 font-medium">
                        <span>Discount ({promoCode})</span>
                        <span>-Rp {discountAmount.toLocaleString('id-ID')}</span>
                    </div>
                )}

                <div className="flex justify-between text-gray-600">
                    <span>Tax ({(configs.tax * 100).toFixed(0)}%)</span>
                    <span>Rp {(Math.max(0, subtotal - discountAmount) * configs.tax).toLocaleString('id-ID')}</span>
                </div>
                {configs.serviceCharge > 0 && (
                    <div className="flex justify-between text-gray-600">
                        <span>Service ({(configs.serviceCharge * 100).toFixed(0)}%)</span>
                        <span>Rp {(Math.max(0, subtotal - discountAmount) * configs.serviceCharge).toLocaleString('id-ID')}</span>
                    </div>
                )}
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
                    <span>Total</span>
                    <span>Rp {calculateTotal().toLocaleString('id-ID')}</span>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                {activeBill && !isOrderPaid && (
                    <Button 
                        className="col-span-2 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 flex items-center justify-center gap-2"
                        onClick={handleOpenSplitBill}
                    >
                        <Split size={18} /> Split Bill
                    </Button>
                )}
                <Button 
                  className="w-full py-3 text-lg bg-white text-blue-600 border border-blue-200 hover:bg-blue-50"
                  disabled={(cart.length === 0) || processing || isOrderPaid}
                  onClick={() => handleCheckout('SAVE')}
                >
                  {processing ? '...' : (activeBill ? 'Update Order' : 'Save Order')}
                </Button>
                <Button 
                  className="w-full py-3 text-lg shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={(cart.length === 0) || processing || isOrderPaid}
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
        totalAmount={splitAmount > 0 ? splitAmount : calculateTotal()}
        onConfirm={handlePaymentConfirm}
      />

      <SplitBillModal
        isOpen={isSplitModalOpen}
        onClose={() => setIsSplitModalOpen(false)}
        order={activeBill}
        onProceedToPay={handleProceedToSplit}
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

      <ShiftModals
        isOpenShiftModalOpen={!isShiftLoading && !currentShift}
        isCloseShiftModalOpen={showCloseShiftModal}
        onShiftStarted={checkActiveShift}
        onShiftClosed={() => {
            setShowCloseShiftModal(false);
            checkActiveShift();
        }}
        onCancelClose={() => setShowCloseShiftModal(false)}
        currentShift={currentShift}
      />

      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => {
            setIsPinModalOpen(false);
            setPendingAction(null);
        }}
        onSuccess={() => {
            if (pendingAction) pendingAction();
            setPendingAction(null);
        }}
        title="Manager Authorization"
        message="Voiding items requires Manager PIN"
      />
    </div>
  );
};

export default POS;
