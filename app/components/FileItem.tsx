// File: components/FileItem.tsx

import React, { ReactNode } from 'react';
import {
  Menu,
  Item,
  useContextMenu,
} from 'react-contexify';
import 'react-contexify/dist/ReactContexify.css';
import ReactTooltip, { Tooltip } from 'react-tooltip';
import {
  FaDownload,
  FaStar,
  FaEdit,
  FaShareAlt,
  FaTag,
  FaTrash,
  FaFileAlt,
  FaFilePdf,
  FaFileImage,
  FaFileWord,
  FaFileExcel,
  FaFileArchive,
  FaFileVideo,
  FaFileAudio,
  FaFileCode,
} from 'react-icons/fa';

// File Type Icons Mapping
const fileTypeIcons: { [key: string]: ReactNode } = {
  'application/pdf': <FaFilePdf className="text-red-500" />,
  'image/jpeg': <FaFileImage className="text-yellow-500" />,
  'image/png': <FaFileImage className="text-yellow-500" />,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': <FaFileWord className="text-blue-500" />,
  'application/msword': <FaFileWord className="text-blue-500" />,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': <FaFileExcel className="text-green-500" />,
  'application/vnd.ms-excel': <FaFileExcel className="text-green-500" />,
  'application/zip': <FaFileArchive className="text-gray-500" />,
  'application/x-rar-compressed': <FaFileArchive className="text-gray-500" />,
  'video/mp4': <FaFileVideo className="text-purple-500" />,
  'audio/mpeg': <FaFileAudio className="text-pink-500" />,
  'text/plain': <FaFileAlt className="text-gray-500" />,
  'application/javascript': <FaFileCode className="text-indigo-500" />,
  // Add more mappings as needed
};

interface FileItemProps {
  fileName: string;
  fileType: string;
  fileSize: string;
  onDelete: () => void;
  onDownload: () => void;
  onRename: () => void;
  onShare: () => void;
  onToggleStar: () => void;
  onTag: () => void;
  starred: boolean;
}

const FileItem: React.FC<FileItemProps> = ({
  fileName,
  fileType,
  fileSize,
  onDelete,
  onDownload,
  onRename,
  onShare,
  onToggleStar,
  onTag,
  starred,
}) => {
  const MENU_ID = `menu-${fileName}`;
  const { show } = useContextMenu({
    id: MENU_ID,
  });

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    show({ event }); // Correctly pass an object with the event property
  };

  // Select icon based on fileType, default to FaFileAlt if not found
  const FileIcon = fileTypeIcons[fileType] || <FaFileAlt className="text-gray-500" />;

  return (
    <div onContextMenu={handleContextMenu}>
      <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer">
        <div className="flex items-center space-x-4">
          {FileIcon}
          <div>
            <div className="font-semibold">{fileName}</div>
            <div className="text-sm text-gray-500">
              {fileType} - {fileSize}
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          {/* Action Icons with Spacing and Tooltips */}
          <FaDownload
            className="text-blue-500 hover:text-blue-700 cursor-pointer"
            data-tip="Download"
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
          />
          <FaStar
            className={`text-yellow-500 hover:text-yellow-700 cursor-pointer ${
              starred ? 'fill-current' : ''
            }`}
            data-tip={starred ? 'Unstar' : 'Star'}
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar();
            }}
          />
          <FaEdit
            className="text-green-500 hover:text-green-700 cursor-pointer"
            data-tip="Rename"
            onClick={(e) => {
              e.stopPropagation();
              onRename();
            }}
          />
          <FaShareAlt
            className="text-purple-500 hover:text-purple-700 cursor-pointer"
            data-tip="Share"
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
          />
          <FaTag
            className="text-indigo-500 hover:text-indigo-700 cursor-pointer"
            data-tip="Tag"
            onClick={(e) => {
              e.stopPropagation();
              onTag();
            }}
          />
          <FaTrash
            className="text-red-500 hover:text-red-700 cursor-pointer"
            data-tip="Delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          />
        </div>
      </div>

      {/* Context Menu */}
      <Menu id={MENU_ID}>
        <Item onClick={onDownload}>
          <FaDownload className="inline mr-2" /> Download
        </Item>
        <Item onClick={onShare}>
          <FaShareAlt className="inline mr-2" /> Share
        </Item>
        <Item onClick={onRename}>
          <FaEdit className="inline mr-2" /> Rename
        </Item>
        <Item onClick={onToggleStar}>
          <FaStar className="inline mr-2" /> {starred ? 'Unstar' : 'Star'}
        </Item>
        <Item onClick={onTag}>
          <FaTag className="inline mr-2" /> Tag
        </Item>
        <Item onClick={onDelete}>
          <FaTrash className="inline mr-2" /> Delete
        </Item>
      </Menu>

      {/* Initialize Tooltips */}
      <Tooltip place="top" variant="dark"  />
    </div>
  );
};

export default FileItem;
