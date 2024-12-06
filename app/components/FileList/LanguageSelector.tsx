// File: components/FileList/LanguageSelector.tsx

import React from 'react';

interface LanguageSelectorProps {
  isOpen: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ isOpen }) => (
  <div className="w-full">
    {isOpen ? (
      <select className="w-full p-2 border border-gray-300 rounded-lg">
        <option>English (US)</option>
        <option>Spanish</option>
        <option>French</option>
        {/* Add more language options as needed */}
      </select>
    ) : (
      <select className="w-full p-2 border border-gray-300 rounded-lg">
        <option>EN</option>
        <option>ES</option>
        <option>FR</option>
        {/* Add more language options as needed */}
      </select>
    )}
  </div>
);

export default LanguageSelector;
