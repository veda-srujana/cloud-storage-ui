// File: components/FileItem/ShareModal.tsx

import React, { useState } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSharePublic: () => void;
  onShareInternal: (selectedUsers: string[]) => void;
  internalUsers: string[]; // List of internal users
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  onSharePublic,
  onShareInternal,
  internalUsers,
}) => {
  const [shareType, setShareType] = useState<'public' | 'internal' | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const handleUserSelection = (user: string) => {
    setSelectedUsers((prev) =>
      prev.includes(user) ? prev.filter((u) => u !== user) : [...prev, user]
    );
  };

  const handleShare = () => {
    if (shareType === 'public') {
      onSharePublic();
    } else if (shareType === 'internal') {
      onShareInternal(selectedUsers);
    }
    onClose();
    // Reset state
    setShareType(null);
    setSelectedUsers([]);
  };

  const handleCancel = () => {
    onClose();
    // Reset state
    setShareType(null);
    setSelectedUsers([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-md p-6">
        <h2 className="text-xl font-semibold mb-4">Share File</h2>
        <div className="mb-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="shareType"
              value="public"
              className="form-radio h-5 w-5 text-teal-600"
              onChange={() => setShareType('public')}
              checked={shareType === 'public'}
            />
            <span className="ml-2">Share Publicly</span>
          </label>
          <label className="inline-flex items-center ml-6">
            <input
              type="radio"
              name="shareType"
              value="internal"
              className="form-radio h-5 w-5 text-teal-600"
              onChange={() => setShareType('internal')}
              checked={shareType === 'internal'}
            />
            <span className="ml-2">Share with Internal Users</span>
          </label>
        </div>

        {shareType === 'internal' && (
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Select Users:</label>
            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2">
              {internalUsers.map((user) => (
                <label key={user} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-teal-600"
                    checked={selectedUsers.includes(user)}
                    onChange={() => handleUserSelection(user)}
                  />
                  <span className="ml-2">{user}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            onClick={handleCancel}
            className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            <FaTimes className="mr-2" /> Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={!shareType || (shareType === 'internal' && selectedUsers.length === 0)}
            className={`flex items-center px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 ${
              (!shareType || (shareType === 'internal' && selectedUsers.length === 0)) &&
              'opacity-50 cursor-not-allowed'
            }`}
          >
            <FaCheck className="mr-2" /> Share
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
