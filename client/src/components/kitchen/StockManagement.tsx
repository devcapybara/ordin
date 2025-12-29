import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Search, ToggleLeft, ToggleRight, Package } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  category: string;
  stock: number;
  isAvailable: boolean;
  imageUrl: string;
}

const StockManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

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

  const toggleAvailability = async (product: Product) => {
    try {
      // Optimistic update
      const updatedProducts = products.map(p => 
        p._id === product._id ? { ...p, isAvailable: !p.isAvailable } : p
      );
      setProducts(updatedProducts);

      await api.put(`/products/${product._id}`, {
        isAvailable: !product.isAvailable
      });
    } catch (error) {
      console.error('Failed to update availability', error);
      // Revert on error
      fetchProducts();
      alert('Failed to update status');
    }
  };

  const categories = ['All', ...new Set(products.map(p => p.category))];
  
  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-white rounded-lg shadow h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Kitchen Stock Control</h2>
        
        <div className="flex flex-col md:flex-row gap-4 justify-between">
            {/* Search */}
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Search menu items..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            
            {/* Categories */}
            <select 
                className="p-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
            >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
            <div className="text-center py-10 text-gray-500">Loading menu...</div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map(product => (
                    <div 
                        key={product._id} 
                        className={`border rounded-lg p-3 flex items-center gap-4 transition-all ${
                            !product.isAvailable ? 'bg-red-50 border-red-200' : 'bg-white hover:border-blue-300'
                        }`}
                    >
                        <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                            {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <Package size={20} />
                                </div>
                            )}
                        </div>
                        
                        <div className="flex-1">
                            <h3 className={`font-semibold ${!product.isAvailable ? 'text-gray-500' : 'text-gray-800'}`}>
                                {product.name}
                            </h3>
                            <p className="text-xs text-gray-500 mb-1">{product.category}</p>
                            
                            <div className="flex items-center justify-between">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                    product.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    {product.isAvailable ? 'Available' : 'Sold Out'}
                                </span>
                                
                                <button 
                                    onClick={() => toggleAvailability(product)}
                                    className={`text-2xl transition-colors ${
                                        product.isAvailable ? 'text-green-500 hover:text-green-600' : 'text-gray-400 hover:text-gray-500'
                                    }`}
                                    title="Toggle Availability"
                                >
                                    {product.isAvailable ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default StockManagement;