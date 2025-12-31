import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Plus, Search, Building2, User, Calendar, CheckCircle, XCircle } from 'lucide-react';

interface Restaurant {
  _id: string;
  name: string;
  ownerEmail: string;
  phone: string;
  subscriptionStatus: 'active' | 'inactive' | 'grace_period';
  subscriptionExpiry: string;
  subscription?: {
      plan: 'BASIC' | 'PRO' | 'ENTERPRISE';
      status: string;
      validUntil: string;
  };
  configs: {
    totalTables: number;
  };
  createdAt: string;
}

const TenantList: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    ownerEmail: '',
    phone: '',
    ownerUsername: '',
    ownerPassword: '',
    subscriptionExpiry: '',
    plan: 'BASIC'
  });

  const [editFormData, setEditFormData] = useState({
      plan: 'BASIC',
      status: 'active'
  });

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const { data } = await api.get('/admin/restaurants');
      setRestaurants(data);
    } catch (error) {
      console.error('Failed to fetch restaurants', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/restaurants', formData);
      alert('Restaurant created successfully!');
      setIsModalOpen(false);
      setFormData({
        name: '',
        ownerEmail: '',
        phone: '',
        ownerUsername: '',
        ownerPassword: '',
        subscriptionExpiry: '',
        plan: 'BASIC'
      });
      fetchRestaurants();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to create restaurant');
    }
  };

  const openEditModal = (restaurant: Restaurant) => {
      setEditingRestaurant(restaurant);
      setEditFormData({
          plan: restaurant.subscription?.plan || 'BASIC',
          status: restaurant.subscription?.status || restaurant.subscriptionStatus || 'active'
      });
      setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingRestaurant) return;
      
      try {
          await api.put(`/admin/restaurants/${editingRestaurant._id}`, {
              plan: editFormData.plan,
              subscriptionStatus: editFormData.status
          });
          alert('Restaurant updated successfully');
          setIsEditModalOpen(false);
          setEditingRestaurant(null);
          fetchRestaurants();
      } catch (error) {
          console.error(error);
          alert('Failed to update restaurant');
      }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await api.put(`/admin/restaurants/${id}`, { subscriptionStatus: status });
      fetchRestaurants();
    } catch (error) {
      console.error(error);
      alert('Failed to update status');
    }
  };

  const handleApprove = async (id: string) => {
      if (!window.confirm('Are you sure you want to approve this tenant? This will activate their subscription.')) return;
      try {
          await api.put(`/admin/restaurants/${id}/approve`);
          alert('Tenant approved successfully');
          fetchRestaurants();
      } catch (error) {
          console.error(error);
          alert('Failed to approve tenant');
      }
  };

  const filteredRestaurants = restaurants.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Tenant Management</h2>
            <p className="text-gray-500">Manage registered restaurants and subscriptions</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus size={20} /> Add New Tenant
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
                type="text" 
                placeholder="Search by restaurant name or owner email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
            <div className="p-8 text-center text-gray-500">Loading tenants...</div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">Restaurant</th>
                            <th className="p-4 font-semibold text-gray-600">Owner Contact</th>
                            <th className="p-4 font-semibold text-gray-600">Plan</th>
                            <th className="p-4 font-semibold text-gray-600">Status</th>
                            <th className="p-4 font-semibold text-gray-600">Tables</th>
                            <th className="p-4 font-semibold text-gray-600">Joined</th>
                            <th className="p-4 font-semibold text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filteredRestaurants.map(restaurant => {
                            const status = restaurant.subscription?.status || restaurant.subscriptionStatus;
                            const plan = restaurant.subscription?.plan || 'BASIC';
                            const expiry = restaurant.subscription?.validUntil || restaurant.subscriptionExpiry;
                            
                            return (
                            <tr key={restaurant._id} className="hover:bg-gray-50">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                            <Building2 size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800">{restaurant.name}</p>
                                            <p className="text-xs text-gray-500">ID: {restaurant._id.slice(-6)}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="text-sm">
                                        <p className="font-medium">{restaurant.ownerEmail}</p>
                                        <p className="text-gray-500">{restaurant.phone}</p>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                        plan === 'ENTERPRISE' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                                        plan === 'PRO' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                        'bg-gray-100 text-gray-800 border-gray-200'
                                    }`}>
                                        {plan}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="space-y-1">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            status === 'active' 
                                            ? 'bg-green-100 text-green-800' 
                                            : status === 'pending_payment'
                                            ? 'bg-orange-100 text-orange-800'
                                            : 'bg-red-100 text-red-800'
                                        }`}>
                                            {status?.toUpperCase().replace('_', ' ')}
                                        </span>
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <Calendar size={12} />
                                            Exp: {new Date(expiry).toLocaleDateString()}
                                        </p>
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-gray-600">
                                    {restaurant.configs.totalTables} Tables
                                </td>
                                <td className="p-4 text-sm text-gray-500">
                                    {new Date(restaurant.createdAt).toLocaleDateString()}
                                </td>
                                <td className="p-4">
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => openEditModal(restaurant)}
                                            className="text-blue-500 hover:bg-blue-50 p-1 rounded"
                                            title="Edit Plan"
                                        >
                                            Edit
                                        </button>
                                        
                                        {status === 'pending_payment' && (
                                            <button 
                                                onClick={() => handleApprove(restaurant._id)}
                                                className="text-orange-500 hover:bg-orange-50 p-1 rounded"
                                                title="Approve Payment & Activate"
                                            >
                                                <CheckCircle size={20} />
                                            </button>
                                        )}

                                        {status === 'active' ? (
                                            <button 
                                                onClick={() => handleStatusUpdate(restaurant._id, 'inactive')}
                                                className="text-red-500 hover:bg-red-50 p-1 rounded"
                                                title="Deactivate"
                                            >
                                                <XCircle size={20} />
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => handleStatusUpdate(restaurant._id, 'active')}
                                                className="text-green-500 hover:bg-green-50 p-1 rounded"
                                                title="Activate"
                                            >
                                                <CheckCircle size={20} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filteredRestaurants.length === 0 && (
                    <div className="p-8 text-center text-gray-500">No restaurants found.</div>
                )}
            </div>
        )}
      </div>

      {/* Add Tenant Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New Tenant">
        <form onSubmit={handleCreate} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
                <input 
                    type="text" 
                    required
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Owner Email</label>
                    <input 
                        type="email" 
                        required
                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.ownerEmail}
                        onChange={e => setFormData({...formData, ownerEmail: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input 
                        type="tel" 
                        required
                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                </div>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Plan</label>
                <select
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={formData.plan}
                    onChange={e => setFormData({...formData, plan: e.target.value})}
                >
                    <option value="BASIC">BASIC (Starter)</option>
                    <option value="PRO">PRO (Growing)</option>
                    <option value="ENTERPRISE">ENTERPRISE (Business)</option>
                </select>
            </div>

            <div className="border-t pt-4 mt-4">
                <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                    <User size={16} /> Owner Account
                </h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <input 
                            type="text" 
                            required
                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.ownerUsername}
                            onChange={e => setFormData({...formData, ownerUsername: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input 
                            type="password" 
                            required
                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.ownerPassword}
                            onChange={e => setFormData({...formData, ownerPassword: e.target.value})}
                        />
                    </div>
                </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit">Create Tenant</Button>
            </div>
        </form>
      </Modal>

      {/* Edit Tenant Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Update Subscription">
        <form onSubmit={handleUpdate} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Plan</label>
                <select
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={editFormData.plan}
                    onChange={e => setEditFormData({...editFormData, plan: e.target.value})}
                >
                    <option value="BASIC">BASIC</option>
                    <option value="PRO">PRO</option>
                    <option value="ENTERPRISE">ENTERPRISE</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={editFormData.status}
                    onChange={e => setEditFormData({...editFormData, status: e.target.value})}
                >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="grace_period">Grace Period</option>
                </select>
            </div>
            <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                <Button type="submit">Update Tenant</Button>
            </div>
        </form>
      </Modal>
    </div>
  );
};

export default TenantList;