// File: components/Sidebar/FolderItem.tsx

import React, { ReactNode } from 'react';
import { Tooltip } from 'react-tooltip';

interface FolderItemProps {
  label: string;
  icon: ReactNode;
  isActive: boolean;
  isSidebarOpen: boolean;
  onClick: () => void;
}

const FolderItem: React.FC<FolderItemProps> = ({
  label,
  icon,
  isActive,
  isSidebarOpen,
  onClick,
}) => (
  <div
    className={`flex items-center justify-between text-gray-700 p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition mb-2 cursor-pointer relative ${
      isActive ? 'bg-gray-200 font-semibold' : ''
    }`}
    onClick={onClick}
    data-tip={!isSidebarOpen ? label : undefined} // Show tooltip only when collapsed and not active
  >
    <span>{label}</span>
    {icon && <span>{icon}</span>}
    <Tooltip place="right" variant="dark" />
  </div>
);

export default FolderItem;
