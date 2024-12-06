// File: components/FileItem/TagModal.tsx

import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';

interface TagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTag: (tag: string) => void;
  currentTag: string | null;
}

const TagModal: React.FC<TagModalProps> = ({
  isOpen,
  onClose,
  onTag,
  currentTag,
}) => {
  const [selectedTag, setSelectedTag] = useState<string>(currentTag || '');

  useEffect(() => {
    setSelectedTag(currentTag || '');
  }, [currentTag, isOpen]);

  const predefinedTags = ['Star', 'Important', 'Personal', 'Work'];

  const handleTag = () => {
    if (selectedTag.trim() === '') {
      alert('Tag cannot be empty.');
      return;
    }
    onTag(selectedTag.trim());
    onClose();
    setSelectedTag(currentTag || '');
  };

  const handleCancel = () => {
    onClose();
    setSelectedTag(currentTag || '');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-11/12 max-w-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
          Tag File
        </h2>
        <label className="block text-gray-700 dark:text-gray-200 mb-2">Select a Tag:</label>
        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 dark:bg-gray-700 dark:text-gray-200"
        >
          <option value="">-- Select a Tag --</option>
          {predefinedTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
        <label className="block text-gray-700 dark:text-gray-200 mb-2">Or Enter a Custom Tag:</label>
        <input
          type="text"
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 dark:bg-gray-700 dark:text-gray-200"
          placeholder="Enter custom tag"
        />
        <div className="flex justify-end space-x-4">
          <button
            onClick={handleCancel}
            className="flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
          >
            <FaTimes className="mr-2" /> Cancel
          </button>
          <button
            onClick={handleTag}
            disabled={selectedTag.trim() === ''}
            className={`flex items-center px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 ${
              selectedTag.trim() === '' && 'opacity-50 cursor-not-allowed'
            }`}
          >
            <FaCheck className="mr-2" /> Tag
          </button>
        </div>
      </div>
    </div>
  );
};

export default TagModal;
