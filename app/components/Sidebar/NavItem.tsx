// File: components/Sidebar/NavItem.tsx

import React, { ReactNode } from 'react';
import ReactTooltip, { Tooltip } from 'react-tooltip';

interface NavItemProps {
  isOpen: boolean;
  icon: ReactNode;
  label: string;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({
  isOpen,
  icon,
  label,
  onClick,
}) => (
  <div
    className="flex items-center space-x-4 cursor-pointer hover:bg-gray-200 p-2 rounded-lg relative"
    onClick={onClick}
    data-tip={!isOpen ? label : undefined} // Show tooltip only when collapsed
  >
    {icon}
    {isOpen && (
      <span className="text-gray-700 dark:text-white font-semibold">
        {label}
      </span>
    )}
    <Tooltip place="right" variant="dark" />
  </div>
);

export default NavItem;
