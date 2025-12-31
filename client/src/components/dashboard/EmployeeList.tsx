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
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
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
      if (isEditMode && editId) {
          // Update
          const payload: any = { ...formData };
          if (!payload.password) delete payload.password; // Don't send empty password
          
          await api.put(`/users/${editId}`, payload);
          alert('Employee updated successfully!');
      } else {
          // Create
          await api.post('/users', formData);
          alert('Employee created successfully!');
      }
      
      closeModal();
      fetchEmployees();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Operation failed');
    }
  };

  const openEditModal = (employee: Employee) => {
      setFormData({
          username: employee.username,
          email: employee.email,
          password: '', // Keep blank for edit unless changing
          role: employee.role,
          pin: '' // PIN is usually hidden, but allow setting new one
      });
      setEditId(employee._id);
      setIsEditMode(true);
      setIsModalOpen(true);
  };

  const closeModal = () => {
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditId(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'WAITER',
        pin: ''
      });
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
        <Button onClick={() => { closeModal(); setIsModalOpen(true); }} className="flex items-center gap-2">
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
                                        emp.role === 'ACCOUNTANT' ? 'bg-green-100 text-green-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {emp.role}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-gray-600">{emp.email}</td>
                                <td className="p-4">
                                    <div className="flex gap-2">
                                    {/* Edit Button */}
                                    {(user?.role === 'OWNER' || (user?.role === 'MANAGER' && emp.role !== 'OWNER' && emp.role !== 'MANAGER') || user?._id === emp._id) && (
                                        <button 
                                            onClick={() => openEditModal(emp)}
                                            className="text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors"
                                            title="Edit Employee / Change PIN"
                                        >
                                            Edit / Set PIN
                                        </button>
                                    )}
                                    
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
                                    </div>
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

      <Modal isOpen={isModalOpen} onClose={closeModal} title={isEditMode ? "Edit Employee / Set PIN" : "Add New Employee"}>
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
                        disabled={isEditMode && formData.role === 'OWNER'} // Prevent downgrading owner easily
                    >
                        <option value="WAITER">Waiter</option>
                        <option value="CASHIER">Cashier</option>
                        <option value="KITCHEN">Kitchen</option>
                        {(canCreateManager || formData.role === 'MANAGER') && <option value="MANAGER">Manager</option>}
                        {(canCreateManager || formData.role === 'ACCOUNTANT') && <option value="ACCOUNTANT">Accountant (Finance)</option>}
                    </select>
                </div>
                <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                        {isEditMode ? "New PIN (Leave blank to keep)" : "PIN (Optional)"}
                     </label>
                    <input 
                        type="text" 
                        maxLength={6}
                        placeholder="For mobile login / Void Auth"
                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.pin}
                        onChange={e => setFormData({...formData, pin: e.target.value})}
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isEditMode ? "New Password (Leave blank to keep)" : "Password"}
                </label>
                <input 
                    type="password" 
                    required={!isEditMode}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                />
            </div>
            <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                <Button type="submit">{isEditMode ? 'Update Employee' : 'Create Employee'}</Button>
            </div>
        </form>
      </Modal>
    </div>
  );
};

export default EmployeeList;
