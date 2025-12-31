import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';

interface TableGridProps {
  onSelectTable: (table: string, status?: string) => void;
  selectedTable: string | null;
  allowSelectionWhenOccupied?: boolean;
}

interface TableStatus {
  number: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'SERVED' | 'PAID' | 'DIRTY' | 'PARTIAL_PAID';
  orderId: string | null;
}

const TableGrid: React.FC<TableGridProps> = ({ onSelectTable, selectedTable, allowSelectionWhenOccupied = false }) => {
  const [tables, setTables] = useState<TableStatus[]>([]);
  const { socket } = useSocket();

  const fetchTableStatus = async () => {
    try {
      const { data } = await api.get('/tables/status');
      setTables(data);
    } catch (error) {
      console.error('Failed to fetch table status', error);
    }
  };

  useEffect(() => {
    fetchTableStatus();

    if (socket) {
      socket.on('new_order', fetchTableStatus);
      socket.on('order_status_updated', fetchTableStatus);
      socket.on('table_cleared', fetchTableStatus);
      socket.on('order_paid', fetchTableStatus); // Add listener for payment events
    }

    return () => {
      if (socket) {
        socket.off('new_order', fetchTableStatus);
        socket.off('order_status_updated', fetchTableStatus);
        socket.off('table_cleared', fetchTableStatus);
        socket.off('order_paid', fetchTableStatus);
      }
    };
  }, [socket]);

  const getTableColor = (status: string, isSelected: boolean) => {
    if (isSelected) return 'border-blue-500 bg-blue-50 text-blue-700';
    switch (status) {
      case 'OCCUPIED': 
      case 'PARTIAL_PAID':
        return 'border-red-500 bg-red-50 text-red-700';
      case 'SERVED': return 'border-orange-500 bg-orange-50 text-orange-700'; // Eating
      case 'PAID': return 'border-yellow-500 bg-yellow-50 text-yellow-700'; // Ready to leave
      case 'DIRTY': return 'border-gray-500 bg-gray-50 text-gray-700'; // Needs cleaning
      default: return 'border-green-500 bg-green-50 text-green-700'; // Available
    }
  };

  return (
    <div className="grid grid-cols-3 gap-4 p-4">
      {tables.map((table) => {
        // Waiter Logic:
        // - AVAILABLE: Can Click (To Order)
        // - OCCUPIED: Disabled (Can't double book) -> Unless allowSelectionWhenOccupied is true (POS mode)
        // - DIRTY/PAID: Can Click (To Clear) -> Waiter needs to select it to clear it
        
        const isOccupied = table.status === 'OCCUPIED' || table.status === 'SERVED' || table.status === 'PARTIAL_PAID';
        // Only disable if it's Occupied AND we are not in "Allow All" mode (POS) AND it's not Dirty/Paid (which needs clearing)
        const isDisabled = isOccupied && !allowSelectionWhenOccupied && table.status !== 'DIRTY' && table.status !== 'PAID';
        
        return (
          <button
            key={table.number}
            onClick={() => !isDisabled && onSelectTable(table.number, table.status)}
            disabled={isDisabled}
            className={`aspect-square rounded-xl shadow-sm flex flex-col items-center justify-center border-2 transition-all ${getTableColor(
              table.status,
              selectedTable === table.number
            )} ${isDisabled ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}`}
          >
            <span className="text-2xl font-bold">{table.number}</span>
            <span className="text-xs mt-1 font-semibold">{table.status}</span>
          </button>
        );
      })}
    </div>
  );
};

export default TableGrid;
