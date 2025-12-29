import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';
import { History, User, CreditCard, ShoppingCart, CheckCircle, LogIn, Filter } from 'lucide-react';

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
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [selectedUser, selectedAction, selectedDate]);

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
      let query = '?';
      if (selectedUser) query += `userId=${selectedUser}&`;
      if (selectedAction) query += `action=${selectedAction}&`;
      if (selectedDate) query += `date=${selectedDate}&`;

      const { data } = await api.get(`/logs${query}`);
      setLogs(data);
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Activity Logs</h2>
            <p className="text-gray-500">Track staff actions and system events</p>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center bg-white p-2 rounded-lg shadow-sm border">
            <div className="flex items-center gap-1 text-gray-500 px-2">
                <Filter size={16} />
                <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <select 
                className="bg-gray-50 border rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                value={selectedUser}
                onChange={e => setSelectedUser(e.target.value)}
            >
                <option value="">All Users</option>
                {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.username}</option>
                ))}
            </select>

            <select 
                className="bg-gray-50 border rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-blue-500"
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
                className="bg-gray-50 border rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
            />
            
            {(selectedUser || selectedAction || selectedDate) && (
                <button 
                    onClick={() => {
                        setSelectedUser('');
                        setSelectedAction('');
                        setSelectedDate('');
                    }}
                    className="text-xs text-red-500 hover:text-red-700 font-medium px-2"
                >
                    Clear
                </button>
            )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
            <div className="p-8 text-center text-gray-500">Loading logs...</div>
        ) : (
            <div className="divide-y">
                {logs.map(log => (
                    <div key={log._id} className="p-4 hover:bg-gray-50 transition-colors flex gap-4">
                        <div className="mt-1">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                {getIcon(log.action)}
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <p className="font-medium text-gray-800">{log.description}</p>
                                <span className="text-xs text-gray-400 whitespace-nowrap">
                                    {format(new Date(log.createdAt), 'MMM dd, HH:mm')}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <User size={10} /> {log.user?.username || 'Unknown'}
                                </span>
                                <span className="text-xs text-gray-400 font-mono">
                                    {log.action}
                                </span>
                            </div>
                            {/* Metadata visualization if needed */}
                            {log.metadata && log.metadata.amount && (
                                <p className="text-xs text-green-600 mt-1 font-medium">
                                    Amount: Rp {log.metadata.amount.toLocaleString()}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
                {logs.length === 0 && (
                    <div className="p-8 text-center text-gray-500">No activity logs found matching your filters.</div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogViewer;