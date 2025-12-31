import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { Plus, Edit2, Trash2, AlertCircle, RefreshCw, Package } from 'lucide-react';

interface Ingredient {
  _id: string;
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
  costPerUnit: number;
}

const InventoryList: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [currentIngredient, setCurrentIngredient] = useState<Partial<Ingredient>>({});
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0);
  const [selectedIngredientId, setSelectedIngredientId] = useState<string | null>(null);

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      const { data } = await api.get('/ingredients');
      setIngredients(data);
    } catch (error) {
      console.error('Failed to fetch ingredients', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Ensure default values to prevent validation errors
      const payload = {
          ...currentIngredient,
          unit: currentIngredient.unit || 'kg',
          currentStock: Number(currentIngredient.currentStock) || 0,
          minStock: Number(currentIngredient.minStock) || 0,
          costPerUnit: Number(currentIngredient.costPerUnit) || 0
      };

      if (currentIngredient._id) {
        await api.put(`/ingredients/${currentIngredient._id}`, payload);
      } else {
        await api.post('/ingredients', payload);
      }
      setIsModalOpen(false);
      fetchIngredients();
      setCurrentIngredient({});
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save ingredient');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await api.delete(`/ingredients/${id}`);
      fetchIngredients();
    } catch (error) {
      console.error('Failed to delete', error);
    }
  };

  const openAdjustmentModal = (ingredient: Ingredient) => {
      setSelectedIngredientId(ingredient._id);
      setAdjustmentAmount(0);
      setIsAdjustmentModalOpen(true);
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedIngredientId || adjustmentAmount === 0) return;

      try {
          await api.put(`/ingredients/${selectedIngredientId}/stock`, { adjustment: adjustmentAmount });
          setIsAdjustmentModalOpen(false);
          fetchIngredients();
      } catch (error: any) {
          alert(error.response?.data?.message || 'Failed to adjust stock');
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
            <p className="text-gray-500">Track your raw materials and stock levels</p>
        </div>
        <Button onClick={() => { 
            setCurrentIngredient({ 
                name: '', 
                unit: 'kg', 
                currentStock: 0, 
                minStock: 0, 
                costPerUnit: 0 
            }); 
            setIsModalOpen(true); 
        }} className="flex items-center gap-2">
          <Plus size={20} /> Add Ingredient
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading inventory...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ingredients.map((ing) => (
            <Card key={ing._id} className="relative overflow-hidden group hover:shadow-lg transition-shadow">
               {/* Low Stock Warning */}
               {ing.currentStock <= ing.minStock && (
                   <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded-bl font-bold flex items-center gap-1">
                       <AlertCircle size={12} /> LOW STOCK
                   </div>
               )}

              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-800">{ing.name}</h3>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => { setCurrentIngredient(ing); setIsModalOpen(true); }}
                            className="text-blue-500 hover:text-blue-700 p-1 bg-blue-50 rounded"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button 
                            onClick={() => handleDelete(ing._id)}
                            className="text-red-500 hover:text-red-700 p-1 bg-red-50 rounded"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                    <div className="bg-gray-50 p-2 rounded">
                        <p className="text-gray-500 text-xs">Current Stock</p>
                        <p className={`text-xl font-mono font-bold ${ing.currentStock <= ing.minStock ? 'text-red-600' : 'text-gray-800'}`}>
                            {ing.currentStock} <span className="text-sm font-normal text-gray-500">{ing.unit}</span>
                        </p>
                    </div>
                     <div className="bg-gray-50 p-2 rounded">
                        <p className="text-gray-500 text-xs">Cost / Unit</p>
                        <p className="text-lg font-mono font-medium text-gray-800">
                            Rp {ing.costPerUnit.toLocaleString('id-ID')}
                        </p>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                        Min. Stock: <strong>{ing.minStock} {ing.unit}</strong>
                    </div>
                    <Button 
                        size="sm" 
                        variant="secondary" 
                        onClick={() => openAdjustmentModal(ing)}
                        className="flex items-center gap-1 text-xs"
                    >
                        <RefreshCw size={14} /> Adjust Stock
                    </Button>
                </div>
              </div>
            </Card>
          ))}
          
          {ingredients.length === 0 && (
              <div className="col-span-full text-center py-12 bg-white rounded-lg border border-dashed border-gray-300 text-gray-500">
                  <Package size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No ingredients found. Start by adding your raw materials.</p>
              </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentIngredient._id ? 'Edit Ingredient' : 'Add New Ingredient'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              required
              value={currentIngredient.name || ''}
              onChange={(e) => setCurrentIngredient({ ...currentIngredient, name: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="e.g., Flour, Sugar, Chicken Breast"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Unit</label>
                <select
                  required
                  value={currentIngredient.unit || 'kg'}
                  onChange={(e) => setCurrentIngredient({ ...currentIngredient, unit: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="l">Liter (l)</option>
                    <option value="ml">Milliliter (ml)</option>
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="porsi">Porsi</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cost per Unit</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={currentIngredient.costPerUnit || ''}
                  onChange={(e) => setCurrentIngredient({ ...currentIngredient, costPerUnit: Number(e.target.value) })}
                  className="w-full p-2 border rounded"
                  placeholder="Rp"
                />
              </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-sm font-medium mb-1">Current Stock</label>
                <input
                  type="number"
                  required
                  value={currentIngredient.currentStock || 0}
                  onChange={(e) => setCurrentIngredient({ ...currentIngredient, currentStock: Number(e.target.value) })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Min. Stock Alert</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={currentIngredient.minStock || 0}
                  onChange={(e) => setCurrentIngredient({ ...currentIngredient, minStock: Number(e.target.value) })}
                  className="w-full p-2 border rounded"
                />
              </div>
          </div>
          
          <Button type="submit" className="w-full mt-4">
            Save Ingredient
          </Button>
        </form>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        title="Adjust Stock Level"
      >
        <form onSubmit={handleStockAdjustment} className="space-y-4">
            <div className="bg-blue-50 p-4 rounded text-sm text-blue-800 mb-4">
                Enter the amount to add (positive) or remove (negative).
                <br />
                Example: <strong>5</strong> to add stock, <strong>-2</strong> to remove stock.
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Adjustment Amount</label>
                <input
                    type="number"
                    step="any"
                    required
                    autoFocus
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(Number(e.target.value))}
                    className="w-full p-2 border rounded text-lg font-mono"
                />
            </div>
             <Button type="submit" className="w-full mt-4">
                Confirm Adjustment
            </Button>
        </form>
      </Modal>
    </div>
  );
};

export default InventoryList;
