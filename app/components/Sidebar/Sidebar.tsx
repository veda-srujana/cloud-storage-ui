// File: components/Sidebar/Sidebar.tsx

import React, { ReactNode } from 'react';
import NavItem from './NavItem';
import FolderItem from './FolderItem';
import { AiOutlineUser, AiOutlineSetting } from 'react-icons/ai';
import { MdOutlineHelp, MdPublic, MdFolderShared } from 'react-icons/md';
import { BiLogOut, BiCloudLightning, BiFileBlank } from 'react-icons/bi';
import { FaFileAlt, FaStar, FaTrash } from 'react-icons/fa';
import LanguageSelector from '../FileList/LanguageSelector';

interface SidebarProps {
  isOpen: boolean;
  onLogout: () => void;
  currentFolder: string;
  onFolderClick: (folderName: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onLogout,
  currentFolder,
  onFolderClick,
}) => {
  return (
    <div
      className={`flex flex-col bg-white shadow-lg ${
        isOpen ? 'w-64' : 'w-20'
      } transition-width duration-300 h-full`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div
          className={`font-bold text-xl text-teal-600 ${
            !isOpen && 'hidden'
          }`}
        >
          UCMDRIVE
        </div>
        <button className="focus:outline-none">
          {/* The toggle is handled in Home.tsx */}
        </button>
      </div>

      {/* Sidebar Content */}
      <div className="flex-grow p-4 space-y-6 overflow-y-auto">
        {/* Navigation Items */}
        <div className="border-t border-gray-200 pt-4 space-y-4">
          <NavItem
            isOpen={isOpen}
            icon={<AiOutlineUser />}
            label="Account"
            onClick={() => {
              // Handle Account Click
              // e.g., navigate to account page
            }}
          />
          <NavItem
            isOpen={isOpen}
            icon={<AiOutlineSetting />}
            label="Settings"
            onClick={() => {
              // Handle Settings Click
              // e.g., navigate to settings page
            }}
          />
          <NavItem
            isOpen={isOpen}
            icon={<MdOutlineHelp />}
            label="Help & Support"
            onClick={() => {
              // Handle Help Click
              // e.g., open help modal or navigate to help page
            }}
          />
          <NavItem
            isOpen={isOpen}
            icon={<BiLogOut />}
            label="Log Out"
            onClick={onLogout}
          />
        </div>

        {/* My Files Section */}
        <div className="border-t border-gray-200 pt-4 space-y-2">
          <h3
            className={`text-gray-700 font-semibold ${
              !isOpen && 'hidden'
            }`}
          >
            My Files
          </h3>
          <FolderItem
            label="All Files"
            icon={<FaFileAlt />}
            isActive={currentFolder === 'All Files'}
            isSidebarOpen={isOpen}
            onClick={() => onFolderClick('All Files')}
          />
          <FolderItem
            label="Recent"
            icon={<BiCloudLightning />}
            isActive={currentFolder === 'Recent'}
            isSidebarOpen={isOpen}
            onClick={() => onFolderClick('Recent')}
          />
          <FolderItem
            label="Other"
            icon={<BiFileBlank />}
            isActive={currentFolder === 'Other'}
            isSidebarOpen={isOpen}
            onClick={() => onFolderClick('Other')}
          />
          <FolderItem
            label="Starred"
            icon={<FaStar />}
            isActive={currentFolder === 'Starred'}
            isSidebarOpen={isOpen}
            onClick={() => onFolderClick('Starred')}
          />
          <FolderItem
            label="Deleted"
            icon={<FaTrash />}
            isActive={currentFolder === 'Deleted'}
            isSidebarOpen={isOpen}
            onClick={() => onFolderClick('Deleted')}
          />
        </div>

        {/* Shared Files Section */}
        <div className="border-t border-gray-200 pt-4 space-y-2">
          <h3
            className={`text-gray-700 font-semibold ${
              !isOpen && 'hidden'
            }`}
          >
            Shared Files
          </h3>
          <FolderItem
            label="Public Shared"
            icon={<MdPublic />}
            isActive={currentFolder === 'Public Shared'}
            isSidebarOpen={isOpen}
            onClick={() => onFolderClick('Public Shared')}
          />
          <FolderItem
            label="Shared with People"
            icon={<MdFolderShared />}
            isActive={currentFolder === 'Shared with People'}
            isSidebarOpen={isOpen}
            onClick={() => onFolderClick('Shared with People')}
          />
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4">
        <LanguageSelector isOpen={isOpen} />
      </div>
    </div>
  );
};

export default Sidebar;
