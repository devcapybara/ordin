import React, { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import api from '../../services/api';
import { format } from 'date-fns';
import { Printer, Search, RefreshCw, XCircle, CalendarDays } from 'lucide-react';
import PinModal from '../pos/PinModal';

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReprint: (order: any) => void;
}

const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({ isOpen, onClose, onReprint }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Date Filter State
  const [dateFilter, setDateFilter] = useState(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localDate = new Date(now.getTime() - offset);
    return localDate.toISOString().split('T')[0];
  });

  // Void State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [orderToVoid, setOrderToVoid] = useState<any>(null);
  const [voidReason, setVoidReason] = useState('');
  const [isVoidConfirmOpen, setIsVoidConfirmOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
        fetchHistory();
    }
  }, [isOpen, dateFilter]);

  const fetchHistory = async () => {
    try {
        setLoading(true);
        const { data } = await api.get(`/orders?status=PAID,COMPLETED,VOID&startDate=${dateFilter}`);
        
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

  const handleVoidClick = (order: any) => {
      setOrderToVoid(order);
      setVoidReason('');
      setIsVoidConfirmOpen(true);
  };

  const handleProceedToPin = () => {
      if (!voidReason.trim()) {
          alert('Please enter a reason for voiding this transaction.');
          return;
      }
      setIsVoidConfirmOpen(false);
      setIsPinModalOpen(true);
  };

  const handleVoidSuccess = async () => {
      try {
          if (!orderToVoid) return;
          
          await api.post(`/orders/${orderToVoid._id}/void`, { reason: voidReason });
          
          alert('Transaction Voided Successfully');
          setIsPinModalOpen(false);
          setOrderToVoid(null);
          fetchHistory(); // Refresh list
      } catch (error: any) {
          console.error('Void failed', error);
          alert(error.response?.data?.message || 'Failed to void transaction');
      }
  };

  const filteredOrders = orders.filter(o => 
    (o.orderNumber || o._id).toLowerCase().includes(search.toLowerCase()) ||
    o.tableNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} title="Transaction History">
        <div className="flex flex-col gap-3 mb-4">
            <div className="flex gap-2">
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
                <div className="relative">
                     <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                     <input 
                        type="date"
                        className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
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
        </div>

        <div className="overflow-y-auto max-h-[60vh] space-y-2">
            {loading ? (
                <div className="text-center py-8 text-gray-500">Loading history...</div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No transactions found.</div>
            ) : (
                filteredOrders.map(order => (
                    <div key={order._id} className={`border rounded-lg p-3 flex justify-between items-center transition-colors ${order.status === 'VOID' ? 'bg-red-50 border-red-200' : 'hover:bg-gray-50'}`}>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-800">
                                    #{order.orderNumber || order._id.slice(-6)}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${order.status === 'VOID' ? 'bg-red-200 text-red-800' : 'bg-green-100 text-green-700'}`}>
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
                        <div className="flex gap-2">
                            <button 
                                onClick={() => onReprint(order)}
                                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                <Printer size={16} /> Reprint
                            </button>
                            {order.status !== 'VOID' && (
                                <button 
                                    onClick={() => handleVoidClick(order)}
                                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <XCircle size={16} /> Void
                                </button>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    </Modal>

    {/* Void Reason Modal */}
    <Modal isOpen={isVoidConfirmOpen} onClose={() => setIsVoidConfirmOpen(false)} title="Void Transaction">
        <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded text-red-800 text-sm">
                <p className="font-bold">Warning: This action cannot be undone.</p>
                <p>The transaction will be marked as VOID and sales data will be reversed.</p>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Void</label>
                <textarea 
                    className="w-full border rounded p-2 focus:ring-2 focus:ring-red-500 outline-none"
                    rows={3}
                    placeholder="e.g. Wrong order, Customer changed mind..."
                    value={voidReason}
                    onChange={e => setVoidReason(e.target.value)}
                />
            </div>
            <div className="flex justify-end gap-3 pt-2">
                <button 
                    onClick={() => setIsVoidConfirmOpen(false)}
                    className="px-4 py-2 rounded text-gray-600 hover:bg-gray-100 font-medium"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleProceedToPin}
                    className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 font-medium"
                >
                    Proceed to Authorize
                </button>
            </div>
        </div>
    </Modal>

    <PinModal 
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handleVoidSuccess}
        title="Manager Authorization"
        message="Enter Manager PIN to Void Transaction"
    />
    </>
  );
};

export default TransactionHistoryModal;