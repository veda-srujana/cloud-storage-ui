// File: components/FileItem/FileItem.tsx

import React, { ReactNode, useState } from 'react';
import { Menu, Item, useContextMenu } from 'react-contexify';
import 'react-contexify/dist/ReactContexify.css';
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
import ReactTooltip, { Tooltip } from 'react-tooltip';
import ShareModal from './ShareModal';
import RenameModal from './RenameModal';
import TagModal from './TagModal';

const fileTypeIcons: { [key: string]: ReactNode } = {
  'application/pdf': <FaFilePdf className="text-red-500" />,
  'image/jpeg': <FaFileImage className="text-yellow-500" />,
  'image/png': <FaFileImage className="text-yellow-500" />,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': (
    <FaFileWord className="text-blue-500" />
  ),
  'application/msword': <FaFileWord className="text-blue-500" />,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': (
    <FaFileExcel className="text-green-500" />
  ),
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
  onRename: (newName: string) => void;
  onShare: () => void;
  onToggleStar: () => void;
  onTag: (tag: string) => void;
  starred: boolean;
  tag: string | null;
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
  tag,
}) => {
  const MENU_ID = `menu-${fileName}`;
  const { show } = useContextMenu({
    id: MENU_ID,
  });

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    show({ event });
  };

  const FileIcon = fileTypeIcons[fileType] || <FaFileAlt className="text-gray-500" />;

  // State for Modals
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);

  // State for Internal Users (could be fetched from an API)
  const [internalUsers, setInternalUsers] = useState<string[]>([
    'Alice',
    'Bob',
    'Charlie',
    'David',
    'Eve',
    // Add more users or fetch from API
  ]);

  const handleSharePublic = () => {
    // Implement API call to share publicly
    onShare(); // Modify as needed
  };

  const handleShareInternal = (selectedUsers: string[]) => {
    // Implement API call to share with selected internal users
    console.log('Sharing with internal users:', selectedUsers);
    onShare(); // Modify as needed
  };

  const handleRename = (newName: string) => {
    onRename(newName);
  };

  const handleTag = (newTag: string) => {
    onTag(newTag);
  };

  return (
    <div onContextMenu={handleContextMenu}>
      <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer relative">
        <div className="flex items-center space-x-4">
          {FileIcon}
          <div>
            <div className="font-semibold">{fileName}</div>
            <div className="text-sm text-gray-500">
              {fileType} - {fileSize}
            </div>
            {tag && (
              <div className="mt-1">
                <span className="inline-block bg-teal-200 text-teal-800 text-xs px-2 py-1 rounded-full">
                  {tag}
                </span>
              </div>
            )}
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
            aria-label="Download File"
          />
          <FaStar
            className={`text-yellow-500 hover:text-yellow-700 cursor-pointer ${
              starred ? 'fill-current' : ''
            }`}
            data-tip={starred ? 'Unstar' : 'Star'}
            onClick={(e) => {
              e.stopPropagation();
              // Toggle star as a tag
              if (tag === 'Star') {
                onTag(''); // Remove tag
              } else {
                onTag('Star'); // Set tag to 'Star'
              }
            }}
            aria-label="Star File"
          />
          <FaEdit
            className="text-green-500 hover:text-green-700 cursor-pointer"
            data-tip="Rename"
            onClick={(e) => {
              e.stopPropagation();
              setIsRenameModalOpen(true);
            }}
            aria-label="Rename File"
          />
          <FaShareAlt
            className="text-purple-500 hover:text-purple-700 cursor-pointer"
            data-tip="Share"
            onClick={(e) => {
              e.stopPropagation();
              setIsShareModalOpen(true);
            }}
            aria-label="Share File"
          />
          <FaTag
            className="text-indigo-500 hover:text-indigo-700 cursor-pointer"
            data-tip="Tag"
            onClick={(e) => {
              e.stopPropagation();
              setIsTagModalOpen(true);
            }}
            aria-label="Tag File"
          />
          <FaTrash
            className="text-red-500 hover:text-red-700 cursor-pointer"
            data-tip="Delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Delete File"
          />
        </div>
      </div>

      {/* Context Menu */}
      <Menu id={MENU_ID}>
        <Item onClick={onDownload}>
          <FaDownload className="inline mr-2" /> Download
        </Item>
        <Item onClick={() => setIsShareModalOpen(true)}>
          <FaShareAlt className="inline mr-2" /> Share
        </Item>
        <Item onClick={() => setIsRenameModalOpen(true)}>
          <FaEdit className="inline mr-2" /> Rename
        </Item>
        <Item
          onClick={() => {
            if (tag === 'Star') {
              onTag(''); // Remove tag
            } else {
              onTag('Star'); // Set tag to 'Star'
            }
          }}
        >
          <FaStar className="inline mr-2" /> {tag === 'Star' ? 'Unstar' : 'Star'}
        </Item>
        <Item onClick={() => setIsTagModalOpen(true)}>
          <FaTag className="inline mr-2" /> Tag
        </Item>
        <Item onClick={onDelete}>
          <FaTrash className="inline mr-2" /> Delete
        </Item>
      </Menu>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onSharePublic={handleSharePublic}
        onShareInternal={handleShareInternal}
        internalUsers={internalUsers}
      />

      {/* Rename Modal */}
      <RenameModal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        onRename={handleRename}
        currentName={fileName}
      />

      {/* Tag Modal */}
      <TagModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        onTag={handleTag}
        currentTag={tag}
      />

      {/* Initialize Tooltips */}
      <Tooltip place="top" variant="dark" />
    </div>
  );
};

export default FileItem;
