import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import api from '../../services/api';

interface ShiftModalsProps {
  isOpenShiftModalOpen: boolean;
  isCloseShiftModalOpen: boolean;
  onShiftStarted: () => void;
  onShiftClosed: () => void;
  onCancelClose: () => void;
  currentShift: any;
}

const ShiftModals: React.FC<ShiftModalsProps> = ({
  isOpenShiftModalOpen,
  isCloseShiftModalOpen,
  onShiftStarted,
  onShiftClosed,
  onCancelClose,
  currentShift
}) => {
  const [startCash, setStartCash] = useState(0);
  const [actualCash, setActualCash] = useState(0);
  const [note, setNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleStartShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await api.post('/shifts/start', { startCash });
      onShiftStarted();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to start shift');
    } finally {
      setProcessing(false);
    }
  };

  const handleEndShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await api.post('/shifts/end', { actualCash, note });
      onShiftClosed();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to end shift');
    } finally {
      setProcessing(false);
    }
  };

  // Expected Cash Calculation
  const expectedCash = currentShift ? (currentShift.startCash + (currentShift.currentCashSales || 0)) : 0;
  const difference = actualCash - expectedCash;

  return (
    <>
      {/* Open Shift Modal - Non-closable (forced) if isOpenShiftModalOpen is true */}
      <Modal isOpen={isOpenShiftModalOpen} onClose={() => {}} title="Open Register Shift">
        <form onSubmit={handleStartShift} className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg text-blue-800 text-sm mb-4">
            Please enter the starting cash amount in the drawer to begin your shift.
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Starting Cash (Modal Awal)</label>
            <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">Rp</span>
                <input
                type="number"
                required
                min="0"
                value={startCash}
                onChange={(e) => setStartCash(Number(e.target.value))}
                className="w-full pl-10 p-2 border rounded font-mono text-lg"
                autoFocus
                />
            </div>
          </div>
          <Button type="submit" className="w-full mt-4" disabled={processing}>
            {processing ? 'Opening Shift...' : 'Open Shift'}
          </Button>
        </form>
      </Modal>

      {/* Close Shift Modal */}
      <Modal isOpen={isCloseShiftModalOpen} onClose={onCancelClose} title="Close Shift & Settlement">
        <form onSubmit={handleEndShift} className="space-y-4">
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg mb-4 text-sm">
            <div>
                <p className="text-gray-500">Start Cash</p>
                <p className="font-bold">Rp {currentShift?.startCash.toLocaleString('id-ID')}</p>
            </div>
            <div>
                <p className="text-gray-500">Cash Sales</p>
                <p className="font-bold text-green-600">+ Rp {currentShift?.currentCashSales?.toLocaleString('id-ID')}</p>
            </div>
            <div className="col-span-2 border-t pt-2 mt-2">
                <p className="text-gray-500">Expected Cash in Drawer</p>
                <p className="font-bold text-xl">Rp {expectedCash.toLocaleString('id-ID')}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Actual Cash Amount (Hitung Uang Fisik)</label>
            <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">Rp</span>
                <input
                type="number"
                required
                min="0"
                value={actualCash}
                onChange={(e) => setActualCash(Number(e.target.value))}
                className="w-full pl-10 p-2 border rounded font-mono text-lg"
                autoFocus
                />
            </div>
          </div>

          {actualCash > 0 && (
              <div className={`p-3 rounded text-sm font-bold ${difference === 0 ? 'bg-green-100 text-green-700' : (difference < 0 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700')}`}>
                  Difference: {difference > 0 ? '+' : ''} Rp {difference.toLocaleString('id-ID')}
                  {difference === 0 ? ' (Perfect Match)' : (difference < 0 ? ' (Shortage/Kurang)' : ' (Overage/Lebih)')}
              </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Note (Optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Explain any discrepancy..."
            />
          </div>

          <div className="flex gap-3 mt-4">
            <Button type="button" variant="secondary" onClick={onCancelClose} className="flex-1">
                Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={processing}>
                {processing ? 'Closing...' : 'Close Shift'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default ShiftModals;
