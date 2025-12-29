import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { ShoppingCart, Plus, Minus, X } from 'lucide-react';
import Button from '../ui/Button';

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
  note?: string;
}

interface MobileMenuProps {
  tableNumber: string;
  onPlaceOrder: (items: CartItem[]) => Promise<void>;
  onCancel: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ tableNumber, onPlaceOrder, onCancel }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

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

  const categories = ['All', ...new Set(products.map(p => p.category))];
  const filteredProducts = activeCategory === 'All' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const addToCart = (product: Product) => {
    if (!product.isAvailable) return;
    setCart(prev => {
      const existing = prev.find(item => item._id === product._id);
      if (existing) {
        return prev.map(item => 
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item._id === productId) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const handlePlaceOrder = async () => {
    setSubmitting(true);
    try {
      await onPlaceOrder(cart);
      setCart([]);
      setShowCart(false);
    } catch (error) {
      // Error handled by parent
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (loading) return <div className="p-4 text-center">Loading menu...</div>;

  if (showCart) {
    return (
      <div className="flex flex-col h-full bg-white animate-in slide-in-from-bottom duration-300">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold">Order for Table {tableNumber}</h2>
          <button onClick={() => setShowCart(false)} className="p-2 text-gray-500">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">Cart is empty</div>
          ) : (
            cart.map(item => (
              <div key={item._id} className="flex justify-between items-center border-b pb-4">
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-blue-600">Rp {item.price.toLocaleString('id-ID')}</p>
                </div>
                <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
                  <button onClick={() => updateQuantity(item._id, -1)} className="p-1 hover:bg-white rounded"><Minus size={16} /></button>
                  <span className="font-medium w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item._id, 1)} className="p-1 hover:bg-white rounded"><Plus size={16} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-between mb-4 text-lg font-bold">
            <span>Total</span>
            <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
          </div>
          <Button 
            className="w-full py-3 text-lg" 
            disabled={cart.length === 0 || submitting}
            onClick={handlePlaceOrder}
          >
            {submitting ? 'Sending...' : 'Send to Kitchen'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Categories */}
      <div className="p-4 overflow-x-auto whitespace-nowrap bg-white border-b no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`inline-block px-4 py-2 rounded-full text-sm font-medium mr-2 transition-colors ${
              activeCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="space-y-4">
          {filteredProducts.map(product => (
            <div key={product._id} className="flex gap-4 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
              <div className="w-20 h-20 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                {product.imageUrl && (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">{product.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{product.description || 'No description'}</p>
                </div>
                <div className="flex justify-between items-end mt-2">
                  <span className="font-bold text-blue-600">Rp {product.price.toLocaleString('id-ID')}</span>
                  <button 
                    onClick={() => addToCart(product)}
                    disabled={!product.isAvailable}
                    className={`p-2 rounded-full ${
                      product.isAvailable ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 animate-in slide-in-from-bottom duration-300">
          <button 
            onClick={() => setShowCart(true)}
            className="w-full bg-blue-600 text-white p-4 rounded-xl shadow-lg flex justify-between items-center"
          >
            <div className="flex items-center gap-2">
              <div className="bg-blue-500 p-1 px-2 rounded text-sm font-bold">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </div>
              <span className="font-medium">View Cart</span>
            </div>
            <span className="font-bold">Rp {totalAmount.toLocaleString('id-ID')}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MobileMenu;
