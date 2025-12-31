import React, { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import api from '../../services/api';
import { format } from 'date-fns';
import { Printer, Search, RefreshCw } from 'lucide-react';

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReprint: (order: any) => void;
}

const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({ isOpen, onClose, onReprint }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
        fetchHistory();
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    try {
        setLoading(true);
        // Assuming we have an endpoint or using the general orders endpoint
        // Ideally: GET /orders?status=PAID&limit=50&sort=-createdAt
        const { data } = await api.get('/orders?status=PAID');
        
        // Client-side sort if API doesn't support it yet (assuming API returns array)
        const sorted = data.sort((a: any, b: any) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setOrders(sorted);
    } catch (error) {
        console.error('Failed to fetch history', error);
    } finally {
        setLoading(false);
    }
  };

  const filteredOrders = orders.filter(o => 
    (o.orderNumber || o._id).toLowerCase().includes(search.toLowerCase()) ||
    o.tableNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transaction History">
        <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search Order # or Table..." 
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
            <button 
                onClick={fetchHistory}
                className="p-2 border rounded-lg hover:bg-gray-50 text-gray-600"
                title="Refresh"
            >
                <RefreshCw size={20} />
            </button>
        </div>

        <div className="overflow-y-auto max-h-[60vh] space-y-2">
            {loading ? (
                <div className="text-center py-8 text-gray-500">Loading history...</div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No transactions found.</div>
            ) : (
                filteredOrders.map(order => (
                    <div key={order._id} className="border rounded-lg p-3 flex justify-between items-center hover:bg-gray-50 transition-colors">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-800">
                                    #{order.orderNumber || order._id.slice(-6)}
                                </span>
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                    {order.status}
                                </span>
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                                <span>{format(new Date(order.createdAt), 'dd MMM HH:mm')}</span>
                                <span className="mx-2">•</span>
                                <span>Table {order.tableNumber}</span>
                            </div>
                            <div className="text-sm font-medium mt-1">
                                Rp {order.totalAmount.toLocaleString('id-ID')}
                            </div>
                        </div>
                        <button 
                            onClick={() => onReprint(order)}
                            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            <Printer size={16} /> Reprint
                        </button>
                    </div>
                ))
            )}
        </div>
    </Modal>
  );
};

export default TransactionHistoryModal;