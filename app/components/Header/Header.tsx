// File: components/Header/Header.tsx

import React from 'react';
import { AiOutlineUpload } from 'react-icons/ai';

interface HeaderProps {
  usedStorageGB: string;
  quotaGB: string;
  storagePercentage: string;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Header: React.FC<HeaderProps> = ({
  usedStorageGB,
  quotaGB,
  storagePercentage,
  onUpload,
}) => {
  return (
    <header className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-white border-b border-gray-200 shadow">
      <div className="flex flex-col w-full md:w-auto">
        <span className="text-lg font-semibold text-gray-700">
          Storage {usedStorageGB} GB of {quotaGB} GB used
        </span>
        <div className="w-full bg-gray-200 rounded-full h-4 mt-1">
          <div
            className="bg-teal-500 h-4 rounded-full transition-width duration-300"
            style={{ width: `${storagePercentage}%` }}
          ></div>
        </div>
      </div>
      <div className="flex items-center space-x-4 mt-4 mr-10 md:mt-0">
        <label className="py-2 px-4 text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition cursor-pointer flex items-center">
          <AiOutlineUpload size={20} className="inline mr-5" />
          Upload Files
          <input type="file" onChange={onUpload} className="hidden" />
        </label>
      </div>
    </header>
  );
};

export default Header;
