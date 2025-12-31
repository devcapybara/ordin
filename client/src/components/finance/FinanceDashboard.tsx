import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { DollarSign, TrendingUp, TrendingDown, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

interface Expense {
  _id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  recordedBy: { username: string };
}

const FinanceDashboard: React.FC = () => {
  const [report, setReport] = useState({ totalRevenue: 0, totalExpenses: 0, netProfit: 0 });
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Filters & Pagination
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]; // End of month

  const [dateFilter, setDateFilter] = useState({
      startDate: firstDay,
      endDate: lastDay
  });
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form
  const [formData, setFormData] = useState({
      description: '',
      amount: '',
      category: 'OTHER',
      date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    setPage(1); // Reset page when filters change
  }, [dateFilter, categoryFilter]);

  useEffect(() => {
    fetchData();
  }, [dateFilter, categoryFilter, page]);

  const fetchData = async () => {
    try {
        setLoading(true);
        const query = `?startDate=${dateFilter.startDate}&endDate=${dateFilter.endDate}&category=${categoryFilter}&page=${page}&limit=20`;
        
        const reportRes = await api.get(`/finance/report${query}`);
        setReport(reportRes.data);

        const expensesRes = await api.get(`/finance/expenses${query}`);
        if (expensesRes.data.expenses) {
            setExpenses(expensesRes.data.expenses);
            setTotalPages(expensesRes.data.pages);
        } else {
            setExpenses(expensesRes.data); // Fallback for old API format
            setTotalPages(1);
        }
    } catch (error) {
        console.error('Failed to fetch finance data', error);
    } finally {
        setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          await api.post('/finance/expenses', {
              ...formData,
              amount: Number(formData.amount)
          });
          alert('Expense recorded!');
          setIsModalOpen(false);
          setFormData({
            description: '',
            amount: '',
            category: 'OTHER',
            date: new Date().toISOString().split('T')[0]
          });
          fetchData();
      } catch (error) {
          console.error(error);
          alert('Failed to record expense');
      }
  };

  const handleDelete = async (id: string) => {
      if(!window.confirm('Delete this expense?')) return;
      try {
          await api.delete(`/finance/expenses/${id}`);
          fetchData();
      } catch (error) {
          console.error(error);
          alert('Failed to delete expense');
      }
  };

  return (
    <div className="space-y-6">
       {/* Date Filter */}
       <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
           <div>
               <h2 className="text-xl font-bold text-gray-800">Financial Overview</h2>
               <p className="text-sm text-gray-500">Track your revenue, expenses, and profit</p>
           </div>
           <div className="flex flex-wrap gap-4 items-center">
                <div className="flex gap-4 items-center bg-gray-50 p-2 rounded-lg border">
                        <div className="flex flex-col">
                            <label className="text-xs text-gray-500 font-medium ml-1">Start Date</label>
                            <input 
                                type="date" 
                                className="bg-transparent border-none outline-none text-sm font-medium text-gray-700 focus:ring-0"
                                value={dateFilter.startDate}
                                onChange={e => setDateFilter({...dateFilter, startDate: e.target.value})}
                            />
                        </div>
                        <div className="w-px h-8 bg-gray-300"></div>
                        <div className="flex flex-col">
                            <label className="text-xs text-gray-500 font-medium ml-1">End Date</label>
                            <input 
                                type="date" 
                                className="bg-transparent border-none outline-none text-sm font-medium text-gray-700 focus:ring-0"
                                value={dateFilter.endDate}
                                onChange={e => setDateFilter({...dateFilter, endDate: e.target.value})}
                            />
                        </div>
                </div>
                
                <div className="bg-gray-50 p-2 rounded-lg border min-w-[150px]">
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-500 font-medium ml-1">Category</label>
                        <select 
                            className="bg-transparent border-none outline-none text-sm font-medium text-gray-700 focus:ring-0 w-full"
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            <option value="INGREDIENTS">Ingredients</option>
                            <option value="UTILITIES">Utilities</option>
                            <option value="SALARIES">Salaries</option>
                            <option value="RENT">Rent</option>
                            <option value="MAINTENANCE">Maintenance</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>
                </div>
           </div>
       </div>

       {/* Summary Cards */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-100 rounded-full text-green-600">
                        <TrendingUp size={24} />
                    </div>
                    <h3 className="text-gray-500 font-medium">Total Revenue</h3>
                </div>
                <p className="text-2xl font-bold text-gray-800">Rp {report.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">Current Month</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-red-100 rounded-full text-red-600">
                        <TrendingDown size={24} />
                    </div>
                    <h3 className="text-gray-500 font-medium">Total Expenses</h3>
                </div>
                <p className="text-2xl font-bold text-gray-800">Rp {report.totalExpenses.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">Current Month</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                        <DollarSign size={24} />
                    </div>
                    <h3 className="text-gray-500 font-medium">Net Profit</h3>
                </div>
                <p className={`text-2xl font-bold ${report.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Rp {report.netProfit.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400 mt-1">Revenue - Expenses</p>
            </div>
       </div>

       {/* Expense List */}
       <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">Operational Expenses</h2>
                <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
                    <Plus size={18} /> Record Expense
                </Button>
            </div>
            
            {loading ? (
                <div className="p-8 text-center text-gray-500">Loading data...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600">Date</th>
                                <th className="p-4 font-semibold text-gray-600">Description</th>
                                <th className="p-4 font-semibold text-gray-600">Category</th>
                                <th className="p-4 font-semibold text-gray-600">Amount</th>
                                <th className="p-4 font-semibold text-gray-600">Recorded By</th>
                                <th className="p-4 font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {expenses.map(expense => (
                                <tr key={expense._id} className="hover:bg-gray-50">
                                    <td className="p-4 text-sm text-gray-600">
                                        {new Date(expense.date).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 font-medium text-gray-800">{expense.description}</td>
                                    <td className="p-4">
                                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                                            {expense.category}
                                        </span>
                                    </td>
                                    <td className="p-4 text-red-600 font-medium">
                                        - Rp {expense.amount.toLocaleString()}
                                    </td>
                                    <td className="p-4 text-sm text-gray-500">
                                        {expense.recordedBy?.username || 'Unknown'}
                                    </td>
                                    <td className="p-4">
                                        <button 
                                            onClick={() => handleDelete(expense._id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {expenses.length === 0 && (
                        <div className="p-8 text-center text-gray-500">No expenses recorded this month.</div>
                    )}
                </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
                <div className="p-4 border-t flex justify-between items-center bg-gray-50">
                    <button 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={20} className="text-gray-600" />
                    </button>
                    <span className="text-xs font-medium text-gray-600">
                        Page {page} of {totalPages}
                    </span>
                    <button 
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronRight size={20} className="text-gray-600" />
                    </button>
                </div>
            )}
       </div>

       {/* Add Expense Modal */}
       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Operational Expense">
            <form onSubmit={handleCreate} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input 
                        type="text" 
                        required
                        placeholder="e.g. Weekly Vegetable Supply"
                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Rp)</label>
                        <input 
                            type="number" 
                            required
                            min="0"
                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.amount}
                            onChange={e => setFormData({...formData, amount: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input 
                            type="date" 
                            required
                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.date}
                            onChange={e => setFormData({...formData, date: e.target.value})}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                        <option value="INGREDIENTS">Ingredients / Raw Materials</option>
                        <option value="UTILITIES">Utilities (Electricity, Water, Internet)</option>
                        <option value="SALARIES">Staff Salaries</option>
                        <option value="RENT">Rent / Place</option>
                        <option value="MAINTENANCE">Maintenance & Repairs</option>
                        <option value="OTHER">Other</option>
                    </select>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                    <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button type="submit">Record Expense</Button>
                </div>
            </form>
       </Modal>
    </div>
  );
};

export default FinanceDashboard;