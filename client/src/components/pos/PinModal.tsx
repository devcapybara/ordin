import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import api from '../../services/api';
import { Delete } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  message?: string;
}

const PinModal: React.FC<PinModalProps> = ({ isOpen, onClose, onSuccess, title = 'Manager Authorization', message = 'Enter Manager PIN to continue' }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNumberClick = (num: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + num);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleSubmit = async () => {
    if (pin.length === 0) return;
    
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/auth/verify-pin', { pin });
      if (data.valid) {
        setPin('');
        onSuccess();
        onClose();
      } else {
        setError('Invalid PIN');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPin('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <div className="flex flex-col items-center">
        <p className="mb-4 text-gray-600 text-center">{message}</p>
        
        {/* PIN Display */}
        <div className="w-full max-w-[200px] h-12 mb-6 border-b-2 border-gray-300 flex items-center justify-center text-3xl tracking-widest font-mono">
          {'•'.repeat(pin.length)}
        </div>

        {error && <p className="text-red-500 mb-4 font-medium">{error}</p>}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[260px] mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num.toString())}
              className="h-14 bg-gray-100 hover:bg-gray-200 rounded-lg text-xl font-semibold active:bg-gray-300 transition-colors"
              disabled={loading}
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClose}
            className="h-14 text-gray-500 hover:bg-gray-100 rounded-lg font-medium"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={() => handleNumberClick('0')}
            className="h-14 bg-gray-100 hover:bg-gray-200 rounded-lg text-xl font-semibold active:bg-gray-300 transition-colors"
            disabled={loading}
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="h-14 bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 rounded-lg flex items-center justify-center active:bg-gray-300 transition-colors"
            disabled={loading}
          >
            <Delete size={20} />
          </button>
        </div>

        <Button
            onClick={handleSubmit}
            className="w-full max-w-[260px] py-3 text-lg"
            disabled={pin.length === 0 || loading}
        >
            {loading ? 'Verifying...' : 'Authorize'}
        </Button>
      </div>
    </Modal>
  );
};

export default PinModal;
