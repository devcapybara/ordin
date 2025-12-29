import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Plus, Trash2, User, Shield } from 'lucide-react';

interface Employee {
  _id: string;
  username: string;
  email: string;
  role: string;
}

const EmployeeList: React.FC = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'WAITER',
    pin: ''
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data } = await api.get('/users');
      setEmployees(data);
    } catch (error) {
      console.error('Failed to fetch employees', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users', formData);
      alert('Employee created successfully!');
      setIsModalOpen(false);
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'WAITER',
        pin: ''
      });
      fetchEmployees();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to create employee');
    }
  };

  const handleDelete = async (id: string) => {
      if (!window.confirm('Are you sure you want to delete this employee?')) return;
      try {
          await api.delete(`/users/${id}`);
          fetchEmployees();
      } catch (error: any) {
          console.error(error);
          alert(error.response?.data?.message || 'Failed to delete employee');
      }
  };

  const canCreateManager = user?.role === 'OWNER';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Employee Management</h2>
            <p className="text-gray-500">Manage your staff accounts and roles</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus size={20} /> Add Employee
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
            <div className="p-8 text-center text-gray-500">Loading employees...</div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">Employee</th>
                            <th className="p-4 font-semibold text-gray-600">Role</th>
                            <th className="p-4 font-semibold text-gray-600">Email</th>
                            <th className="p-4 font-semibold text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {employees.map(emp => (
                            <tr key={emp._id} className="hover:bg-gray-50">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                                            <User size={20} />
                                        </div>
                                        <p className="font-bold text-gray-800">{emp.username}</p>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        emp.role === 'MANAGER' ? 'bg-purple-100 text-purple-800' :
                                        emp.role === 'OWNER' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {emp.role}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-gray-600">{emp.email}</td>
                                <td className="p-4">
                                    {/* Prevent deleting self or higher roles (handled by backend too) */}
                                    {emp._id !== user?._id && (
                                        <button 
                                            onClick={() => handleDelete(emp._id)}
                                            className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors"
                                            title="Delete Employee"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {employees.length === 0 && (
                    <div className="p-8 text-center text-gray-500">No employees found.</div>
                )}
            </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Employee">
        <form onSubmit={handleCreate} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input 
                    type="text" 
                    required
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                    type="email" 
                    required
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        value={formData.role}
                        onChange={e => setFormData({...formData, role: e.target.value})}
                    >
                        <option value="WAITER">Waiter</option>
                        <option value="CASHIER">Cashier</option>
                        <option value="KITCHEN">Kitchen</option>
                        {canCreateManager && <option value="MANAGER">Manager</option>}
                    </select>
                </div>
                <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">PIN (Optional)</label>
                    <input 
                        type="text" 
                        maxLength={6}
                        placeholder="For mobile login"
                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.pin}
                        onChange={e => setFormData({...formData, pin: e.target.value})}
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input 
                    type="password" 
                    required
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                />
            </div>
            <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit">Create Employee</Button>
            </div>
        </form>
      </Modal>
    </div>
  );
};

export default EmployeeList;