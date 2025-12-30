import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { Plus, Trash2, Tag } from 'lucide-react';

interface Promo {
  _id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  isActive: boolean;
}

const PromoList: React.FC = () => {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    type: 'PERCENTAGE',
    value: 0,
    minOrderAmount: 0,
    maxDiscountAmount: 0
  });

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    try {
      const { data } = await api.get('/promos');
      setPromos(data);
    } catch (error) {
      console.error('Failed to fetch promos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this promo?')) return;
    try {
      await api.delete(`/promos/${id}`);
      fetchPromos();
    } catch (error) {
      console.error('Failed to delete promo');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/promos', formData);
      setIsModalOpen(false);
      fetchPromos();
      setFormData({
        code: '',
        type: 'PERCENTAGE',
        value: 0,
        minOrderAmount: 0,
        maxDiscountAmount: 0
      });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create promo');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
            <Tag className="text-blue-600" />
            Promo Management
        </h2>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus size={16} /> Add Promo
        </Button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-3">Code</th>
                <th className="p-3">Type</th>
                <th className="p-3">Value</th>
                <th className="p-3">Min Order</th>
                <th className="p-3">Max Discount</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {promos.length === 0 ? (
                  <tr>
                      <td colSpan={6} className="p-4 text-center text-gray-500">No active promos</td>
                  </tr>
              ) : (
                  promos.map((promo) => (
                    <tr key={promo._id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-bold text-blue-600">{promo.code}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${promo.type === 'PERCENTAGE' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                            {promo.type}
                        </span>
                      </td>
                      <td className="p-3">
                        {promo.type === 'PERCENTAGE' ? `${promo.value}%` : `Rp ${promo.value.toLocaleString('id-ID')}`}
                      </td>
                      <td className="p-3">Rp {promo.minOrderAmount.toLocaleString('id-ID')}</td>
                      <td className="p-3">
                        {promo.maxDiscountAmount ? `Rp ${promo.maxDiscountAmount.toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td className="p-3">
                        <button onClick={() => handleDelete(promo._id)} className="text-red-500 hover:text-red-700">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Promo">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Promo Code</label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full p-2 border rounded uppercase"
              placeholder="e.g. SUMMER50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full p-2 border rounded"
            >
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed Amount (Rp)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Value</label>
            <input
              type="number"
              required
              min="0"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
              className="w-full p-2 border rounded"
              placeholder={formData.type === 'PERCENTAGE' ? 'e.g. 10 for 10%' : 'e.g. 10000'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Min Order Amount (Rp)</label>
            <input
              type="number"
              min="0"
              value={formData.minOrderAmount}
              onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
              className="w-full p-2 border rounded"
            />
          </div>
          {formData.type === 'PERCENTAGE' && (
            <div>
                <label className="block text-sm font-medium mb-1">Max Discount Amount (Rp)</label>
                <input
                type="number"
                min="0"
                value={formData.maxDiscountAmount}
                onChange={(e) => setFormData({ ...formData, maxDiscountAmount: Number(e.target.value) })}
                className="w-full p-2 border rounded"
                placeholder="Optional cap for % discount"
                />
            </div>
          )}
          <div className="pt-4">
            <Button type="submit" className="w-full">Create Promo</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PromoList;
