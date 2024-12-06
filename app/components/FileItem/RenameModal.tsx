// File: components/FileItem/RenameModal.tsx

import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRename: (newName: string) => void;
  currentName: string;
}

const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  onClose,
  onRename,
  currentName,
}) => {
  const [newName, setNewName] = useState(currentName);

  useEffect(() => {
    setNewName(currentName);
  }, [currentName, isOpen]);

  const handleRename = () => {
    if (newName.trim() === '') {
      alert('File name cannot be empty.');
      return;
    }
    onRename(newName.trim());
    onClose();
  };

  const handleCancel = () => {
    onClose();
    setNewName(currentName);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-11/12 max-w-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
          Rename File
        </h2>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 dark:bg-gray-700 dark:text-gray-200"
          placeholder="Enter new file name"
        />
        <div className="flex justify-end space-x-4">
          <button
            onClick={handleCancel}
            className="flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
          >
            <FaTimes className="mr-2" /> Cancel
          </button>
          <button
            onClick={handleRename}
            className="flex items-center px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
          >
            <FaCheck className="mr-2" /> Rename
          </button>
        </div>
      </div>
    </div>
  );
};

export default RenameModal;
