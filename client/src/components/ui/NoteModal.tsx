import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: string) => void;
  initialNote?: string;
  itemName?: string;
}

const NoteModal: React.FC<NoteModalProps> = ({ isOpen, onClose, onSave, initialNote = '', itemName }) => {
  const [note, setNote] = useState(initialNote);

  useEffect(() => {
    setNote(initialNote);
  }, [initialNote, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(note);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Note for ${itemName || 'Item'}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Note / Special Request
          </label>
          <textarea
            className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
            placeholder="e.g. Less spicy, No ice, Extra sauce..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            autoFocus
          />
        </div>
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            Save Note
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default NoteModal;
