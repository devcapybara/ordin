import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';
import { History, User, CreditCard, ShoppingCart, CheckCircle, LogIn, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

interface ActivityLog {
  _id: string;
  user: {
    username: string;
    role: string;
  };
  action: string;
  description: string;
  createdAt: string;
  metadata: any;
}

interface Employee {
    _id: string;
    username: string;
}

const ActivityLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Default Today
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    setPage(1); // Reset to page 1 when filters change
  }, [selectedUser, selectedAction, selectedDate]);

  useEffect(() => {
    fetchLogs();
  }, [selectedUser, selectedAction, selectedDate, page]);

  const fetchEmployees = async () => {
      try {
          const { data } = await api.get('/users');
          setEmployees(data);
      } catch (error) {
          console.error('Failed to fetch employees');
      }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let query = `?page=${page}&limit=30&`;
      if (selectedUser) query += `userId=${selectedUser}&`;
      if (selectedAction) query += `action=${selectedAction}&`;
      if (selectedDate) query += `date=${selectedDate}&`;

      const { data } = await api.get(`/logs${query}`);
      // Handle both old array format (fallback) and new paginated format
      if (Array.isArray(data)) {
          setLogs(data);
          setTotalPages(1);
      } else {
          setLogs(data.logs);
          setTotalPages(data.pages);
      }
    } catch (error) {
      console.error('Failed to fetch logs', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (action: string) => {
      switch (action) {
          case 'LOGIN': return <LogIn size={18} className="text-blue-500" />;
          case 'ORDER_CREATED': return <ShoppingCart size={18} className="text-orange-500" />;
          case 'ORDER_PAID': return <CreditCard size={18} className="text-green-500" />;
          case 'ORDER_STATUS_UPDATE': return <CheckCircle size={18} className="text-purple-500" />;
          default: return <History size={18} className="text-gray-500" />;
      }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mt-8">
      <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <History size={20} className="text-gray-500" />
            Activity Log
        </h3>
        
        <div className="flex flex-wrap gap-2 items-center">
            <select 
                className="bg-white border rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                value={selectedUser}
                onChange={e => setSelectedUser(e.target.value)}
            >
                <option value="">All Users</option>
                {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.username}</option>
                ))}
            </select>

            <select 
                className="bg-white border rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                value={selectedAction}
                onChange={e => setSelectedAction(e.target.value)}
            >
                <option value="">All Actions</option>
                <option value="LOGIN">Login</option>
                <option value="ORDER_CREATED">Order Created</option>
                <option value="ORDER_STATUS_UPDATE">Kitchen Update</option>
                <option value="ORDER_PAID">Payment</option>
            </select>

            <input 
                type="date" 
                className="bg-white border rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
            />
            
            {(selectedUser || selectedAction || selectedDate !== new Date().toISOString().split('T')[0]) && (
                <button 
                    onClick={() => {
                        setSelectedUser('');
                        setSelectedAction('');
                        setSelectedDate(new Date().toISOString().split('T')[0]);
                    }}
                    className="text-xs text-red-500 hover:text-red-700 font-medium px-2"
                >
                    Reset
                </button>
            )}
        </div>
      </div>

      <div>
        {loading ? (
            <div className="p-8 text-center text-gray-500">Loading logs...</div>
        ) : (
            <div className="divide-y">
                {logs.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No activity logs found for this date.</div>
                ) : (
                    logs.map(log => (
                        <div key={log._id} className="p-4 hover:bg-gray-50 transition-colors flex gap-4 items-center">
                            <div className="shrink-0">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                    {getIcon(log.action)}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <p className="font-medium text-gray-800 text-sm truncate pr-2">{log.description}</p>
                                    <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                                        {format(new Date(log.createdAt), 'HH:mm')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <User size={10} /> {log.user?.username || 'Unknown'}
                                    </span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono border border-gray-200">
                                        {log.action}
                                    </span>
                                    {log.metadata && log.metadata.amount && (
                                        <span className="text-xs text-green-600 font-medium">
                                            Rp {log.metadata.amount.toLocaleString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
          <div className="p-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
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
  );
};

export default ActivityLogViewer;