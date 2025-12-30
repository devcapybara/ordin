import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Button from '../ui/Button';
import { Upload, Plus, Trash2 } from 'lucide-react';

interface ProductFormProps {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

interface Ingredient {
    _id: string;
    name: string;
    unit: string;
}

interface RecipeItem {
    ingredientId: string;
    quantity: number;
}

const ProductForm: React.FC<ProductFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    price: initialData?.price || 0,
    category: initialData?.category || '',
    stock: initialData?.stock || 0,
    description: initialData?.description || '',
    imageUrl: initialData?.imageUrl || '',
  });
  
  // Recipe State
  const [recipe, setRecipe] = useState<RecipeItem[]>(
      initialData?.recipe?.map((r: any) => ({
          ingredientId: r.ingredientId?._id || r.ingredientId, // Handle populated vs unpopulated
          quantity: r.quantity
      })) || []
  );
  
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
      fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
      try {
          const { data } = await api.get('/ingredients');
          setIngredients(data);
      } catch (error) {
          console.error('Failed to fetch ingredients');
      }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddIngredient = () => {
      setRecipe([...recipe, { ingredientId: '', quantity: 0 }]);
  };

  const handleRecipeChange = (index: number, field: keyof RecipeItem, value: any) => {
      const newRecipe = [...recipe];
      newRecipe[index] = { ...newRecipe[index], [field]: value };
      setRecipe(newRecipe);
  };

  const handleRemoveIngredient = (index: number) => {
      setRecipe(recipe.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('image', file);

    setUploading(true);
    try {
      const { data } = await api.post('/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData(prev => ({ ...prev, imageUrl: data.imageUrl }));
    } catch (error) {
      console.error('Upload failed', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Filter out invalid recipe items
      const validRecipe = recipe.filter(r => r.ingredientId && r.quantity > 0);
      
      const payload = { ...formData, recipe: validRecipe };

      if (initialData?._id) {
        await api.put(`/products/${initialData._id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save product', error);
      alert('Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
            />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
            >
                <option value="">Select Category</option>
                <option value="Food">Food</option>
                <option value="Beverage">Beverage</option>
                <option value="Snack">Snack</option>
                <option value="Dessert">Dessert</option>
            </select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Price</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
            min="0"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Daily Stock (Availability)</label>
          <input
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            required
            min="0"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={2}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
        />
      </div>

      {/* Recipe Section */}
      <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold text-gray-700">Recipe / Ingredients</label>
              <Button type="button" size="sm" variant="secondary" onClick={handleAddIngredient} className="text-xs">
                  <Plus size={14} className="mr-1" /> Add Ingredient
              </Button>
          </div>
          <div className="space-y-2 bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">
              {recipe.length === 0 && (
                  <p className="text-sm text-gray-400 text-center italic">No ingredients linked. Stock won't be deducted automatically.</p>
              )}
              {recipe.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center">
                      <select
                          value={item.ingredientId}
                          onChange={(e) => handleRecipeChange(index, 'ingredientId', e.target.value)}
                          className="flex-1 text-sm p-1 border rounded"
                          required
                      >
                          <option value="">Select Ingredient</option>
                          {ingredients.map(ing => (
                              <option key={ing._id} value={ing._id}>{ing.name} ({ing.unit})</option>
                          ))}
                      </select>
                      <input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleRecipeChange(index, 'quantity', Number(e.target.value))}
                          className="w-20 text-sm p-1 border rounded"
                          min="0"
                          step="any"
                          required
                      />
                      <button type="button" onClick={() => handleRemoveIngredient(index)} className="text-red-500 hover:text-red-700">
                          <Trash2 size={16} />
                      </button>
                  </div>
              ))}
          </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image</label>
        <div className="mt-1 flex items-center gap-4">
            {formData.imageUrl && (
                <img src={formData.imageUrl} alt="Preview" className="h-16 w-16 object-cover rounded" />
            )}
            <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2">
                <Upload size={16} />
                {uploading ? 'Uploading...' : 'Upload Image'}
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
            </label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || uploading}>
          {loading ? 'Saving...' : 'Save Product'}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
