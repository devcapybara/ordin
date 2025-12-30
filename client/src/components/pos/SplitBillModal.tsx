import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Check, CheckCircle } from 'lucide-react';

interface SplitBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onProceedToPay: (itemsToPay: any[], amount: number) => void;
}

const SplitBillModal: React.FC<SplitBillModalProps> = ({ isOpen, onClose, order, onProceedToPay }) => {
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: number }>({}); // { itemId: quantityToPay }
  
  // Reset selection when order changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedItems({});
    }
  }, [isOpen, order]);

  if (!order) return null;

  // Calculate available quantities (Total - Paid)
  const items = order.items.map((item: any) => ({
    ...item,
    availableQty: item.quantity - (item.paidQuantity || 0)
  })).filter((item: any) => item.availableQty > 0);

  const toggleItem = (itemId: string, maxQty: number) => {
      setSelectedItems(prev => {
          const current = prev[itemId] || 0;
          if (current > 0) {
              // Deselect
              const copy = { ...prev };
              delete copy[itemId];
              return copy;
          } else {
              // Select Max
              return { ...prev, [itemId]: maxQty };
          }
      });
  };

  const updateQty = (itemId: string, qty: number, maxQty: number) => {
      if (qty < 0) return;
      if (qty > maxQty) qty = maxQty;
      
      setSelectedItems(prev => {
          if (qty === 0) {
              const copy = { ...prev };
              delete copy[itemId];
              return copy;
          }
          return { ...prev, [itemId]: qty };
      });
  };

  // Calculate Total for Selected Items
  // Formula: (ItemPrice * SelectedQty / Subtotal) * TotalAmount
  // This ensures tax/service is distributed proportionally.
  let selectedSubtotal = 0;
  let selectedTotal = 0;

  Object.entries(selectedItems).forEach(([itemId, qty]) => {
      const item = items.find((i: any) => i._id === itemId || i.productId._id === itemId); // Handle populated vs unpopulated
      // Note: order.items usually has _id as the item subdocument ID, and productId as the ref.
      // Let's assume itemId matches item._id or item.productId._id
      
      // Let's match by comparing ID string to item.productId._id
      const matchedItem = items.find((i: any) => i.productId._id === itemId);

      if (matchedItem) {
          selectedSubtotal += (matchedItem.unitPrice * qty);
      }
  });

  if (order.subtotal > 0) {
      const ratio = selectedSubtotal / order.subtotal;
      selectedTotal = Math.round(ratio * order.totalAmount);
  }

  const handleProceed = () => {
      const itemsToPay = Object.entries(selectedItems).map(([itemId, qty]) => ({
          productId: itemId,
          quantity: qty
      }));
      onProceedToPay(itemsToPay, selectedTotal);
  };

  const remainingTotal = order.totalAmount - (order.totalPaid || 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Split Bill (Select Items)">
      <div className="space-y-4">
        <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
            Select the items you want to pay for now.
            <div className="font-bold mt-1">
                Remaining Bill: Rp {remainingTotal.toLocaleString('id-ID')}
            </div>
        </div>

        <div className="max-h-96 overflow-y-auto border rounded divide-y">
            {items.length === 0 ? (
                <div className="p-4 text-center text-gray-500">All items have been paid!</div>
            ) : (
                items.map((item: any) => {
                    const isSelected = !!selectedItems[item.productId._id];
                    const selectedQty = selectedItems[item.productId._id] || 0;

                    return (
                        <div key={item._id} className={`p-3 flex items-center justify-between ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                            <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleItem(item.productId._id, item.availableQty)}>
                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'}`}>
                                    {isSelected && <Check size={14} />}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-800">{item.productId.name}</p>
                                    <p className="text-sm text-gray-500">
                                        Rp {item.unitPrice.toLocaleString('id-ID')} x {item.availableQty} left
                                    </p>
                                </div>
                            </div>
                            
                            {isSelected && (
                                <div className="flex items-center gap-2">
                                    <button 
                                        className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300"
                                        onClick={() => updateQty(item.productId._id, selectedQty - 1, item.availableQty)}
                                    >
                                        -
                                    </button>
                                    <span className="w-8 text-center font-bold">{selectedQty}</span>
                                    <button 
                                        className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300"
                                        onClick={() => updateQty(item.productId._id, selectedQty + 1, item.availableQty)}
                                    >
                                        +
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>

        <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">Selected Amount to Pay</span>
                <span className="text-xl font-bold text-blue-600">Rp {selectedTotal.toLocaleString('id-ID')}</span>
            </div>
            
            <div className="flex gap-3">
                <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
                <Button onClick={handleProceed} disabled={selectedTotal === 0} className="flex-1">
                    Pay Selected (Rp {selectedTotal.toLocaleString('id-ID')})
                </Button>
            </div>
        </div>
      </div>
    </Modal>
  );
};

export default SplitBillModal;
