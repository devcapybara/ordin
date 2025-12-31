import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { PAYMENT_METHODS, PAYMENT_PROVIDERS } from '../../constants/payment';
import { CreditCard, Banknote, QrCode } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onConfirm: (payload: any) => Promise<void>;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, totalAmount, onConfirm }) => {
  const [method, setMethod] = useState<string>(PAYMENT_METHODS.CASH);
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const ROUND_STEP = 100;
  const roundedTotal = method === PAYMENT_METHODS.CASH
    ? Math.round(totalAmount / ROUND_STEP) * ROUND_STEP
    : totalAmount;
  const roundingAdjustment = method === PAYMENT_METHODS.CASH
    ? (roundedTotal - totalAmount)
    : 0;

  const handleConfirm = async () => {
    setLoading(true);
    try {
        const payload = {
            method,
            provider: PAYMENT_PROVIDERS.MANUAL,
            amountReceived: method === PAYMENT_METHODS.CASH ? Number(amountReceived) : totalAmount
        };
        await onConfirm(payload);
        onClose();
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  const change = method === PAYMENT_METHODS.CASH ? (Number(amountReceived) - roundedTotal) : 0;
  const isCashValid = method === PAYMENT_METHODS.CASH && Number(amountReceived) >= roundedTotal;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Payment">
        <div className="space-y-6">
            <div className="text-center">
                <p className="text-gray-500">Total Amount</p>
                {method === PAYMENT_METHODS.CASH ? (
                  <div className="space-y-1">
                    <p className="text-3xl font-bold text-gray-800">Rp {roundedTotal.toLocaleString('id-ID')}</p>
                    {roundingAdjustment !== 0 && (
                      <div className="text-xs text-gray-600">
                        Termasuk pembulatan: <span className="font-semibold">{roundingAdjustment > 0 ? '+' : ''}Rp {Math.abs(roundingAdjustment).toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    <div className="text-xs text-gray-500">Total asli: Rp {totalAmount.toLocaleString('id-ID')}</div>
                  </div>
                ) : (
                  <p className="text-3xl font-bold text-gray-800">Rp {totalAmount.toLocaleString('id-ID')}</p>
                )}
            </div>

            <div className="grid grid-cols-3 gap-3">
                <button
                    className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-colors ${
                        method === PAYMENT_METHODS.CASH ? 'border-blue-500 bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setMethod(PAYMENT_METHODS.CASH)}
                >
                    <Banknote size={24} />
                    <span className="text-sm font-medium">Cash</span>
                </button>
                <button
                    className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-colors ${
                        method === PAYMENT_METHODS.BANK_TRANSFER ? 'border-blue-500 bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setMethod(PAYMENT_METHODS.BANK_TRANSFER)}
                >
                    <CreditCard size={24} />
                    <span className="text-sm font-medium">Transfer</span>
                </button>
                <button
                    className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-colors ${
                        method === PAYMENT_METHODS.QRIS ? 'border-blue-500 bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setMethod(PAYMENT_METHODS.QRIS)}
                >
                    <QrCode size={24} />
                    <span className="text-sm font-medium">QRIS</span>
                </button>
            </div>

            {method === PAYMENT_METHODS.CASH && (
                <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount Received</label>
                        <input 
                            type="number" 
                            className="w-full border rounded-lg p-3 text-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Enter amount..."
                            value={amountReceived}
                            onChange={e => setAmountReceived(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                        <span className="font-medium text-gray-600">Change</span>
                        <span className={`font-bold text-xl ${change < 0 ? 'text-red-500' : 'text-green-600'}`}>
                            Rp {change > 0 ? change.toLocaleString() : '0'}
                        </span>
                    </div>
                </div>
            )}

            {(method === PAYMENT_METHODS.BANK_TRANSFER || method === PAYMENT_METHODS.QRIS) && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-yellow-800 text-sm">
                    <p className="font-medium mb-1">Manual Verification Required</p>
                    <p>Please ensure the customer has successfully transferred/scanned the QR code before confirming.</p>
                </div>
            )}

            <div className="pt-2">
                <Button 
                    className="w-full py-3 text-lg" 
                    onClick={handleConfirm}
                    disabled={method === PAYMENT_METHODS.CASH && !isCashValid}
                >
                    {loading ? 'Processing...' : 'Confirm Payment'}
                </Button>
            </div>
        </div>
    </Modal>
  );
};

export default PaymentModal;
