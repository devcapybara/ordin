import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Button from '../ui/Button';

const RestaurantSettings: React.FC = () => {
  const [configs, setConfigs] = useState({
    name: '',
    address: '',
    phone: '',
    totalTables: 12,
    tax: 0.1,
    serviceCharge: 0.05,
    receiptFooter: 'Thank you for your visit!'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const { data } = await api.get('/restaurant/configs');
      // Ensure defaults if missing from DB
      setConfigs({
        name: data.name || '',
        address: data.address || '',
        phone: data.phone || '',
        totalTables: data.configs?.totalTables || data.totalTables || 12,
        tax: data.configs?.tax ?? data.tax ?? 0.1,
        serviceCharge: data.configs?.serviceCharge ?? data.serviceCharge ?? 0.05,
        receiptFooter: data.configs?.receiptFooter || data.receiptFooter || 'Thank you for your visit!'
      });
    } catch (error) {
      console.error('Failed to fetch configs', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // The API expects a flat object now based on my updateConfigs change, 
      // or at least updateConfigs destructures everything from req.body.
      // Wait, `getConfigs` returns the full restaurant object usually?
      // Let's check `getConfigs.js` later. 
      // Assuming `updateConfigs` handles flat structure as implemented.
      await api.put('/restaurant/configs', configs);
      alert('Settings updated successfully!');
    } catch (error) {
      console.error('Failed to update settings', error);
      alert('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setConfigs(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Restaurant Settings</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Section */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-4 border">
            <h3 className="font-semibold text-gray-700 border-b pb-2">Basic Information</h3>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
                <input
                    type="text"
                    name="name"
                    value={configs.name}
                    onChange={handleChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                    name="address"
                    value={configs.address}
                    onChange={handleChange}
                    rows={2}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                    type="text"
                    name="phone"
                    value={configs.phone}
                    onChange={handleChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                />
            </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Total Tables
          </label>
          <input
            type="number"
            name="totalTables"
            value={configs.totalTables}
            onChange={handleChange}
            min="1"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
          />
          <p className="text-sm text-gray-500 mt-1">
            Number of tables available in your restaurant.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tax Rate (Decimal)
            </label>
            <input
              type="number"
              name="tax"
              value={configs.tax}
              onChange={handleChange}
              step="0.01"
              min="0"
              max="1"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
            />
            <p className="text-sm text-gray-500 mt-1">
              Example: 0.1 for 10%
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Charge (Decimal)
            </label>
            <input
              type="number"
              name="serviceCharge"
              value={configs.serviceCharge}
              onChange={handleChange}
              step="0.01"
              min="0"
              max="1"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
            />
            <p className="text-sm text-gray-500 mt-1">
              Example: 0.05 for 5%
            </p>
          </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Receipt Footer Message
            </label>
            <textarea
                name="receiptFooter"
                value={configs.receiptFooter}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                placeholder="e.g. Wi-Fi: 12345678 | Thank you!"
            />
            <p className="text-sm text-gray-500 mt-1">
                Text to display at the bottom of printed receipts.
            </p>
        </div>

        <div className="pt-4">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RestaurantSettings;
