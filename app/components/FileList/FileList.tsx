// File: components/FileList/FileList.tsx

import React from 'react';
import FileItem from '../FileItem/FileItem';
import { FileData } from '../../types/FileData';

interface FileListProps {
  files: FileData[];
  loading: boolean;
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  sortOrder: string;
  onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleDelete: (fileId: string) => void;
  handleDownload: (fileId: string) => void;
  handleRename: (fileId: string, newName: string) => void;
  handleSharePublic: (fileId: string) => void;
  handleShareInternal: (fileId: string, selectedUsers: string[]) => void;
  handleToggleStar: (fileId: string) => void;
  handleTag: (fileId: string, newTag: string) => void;
}

const FileList: React.FC<FileListProps> = ({
  files,
  loading,
  searchTerm,
  onSearchChange,
  sortOrder,
  onSortChange,
  handleDelete,
  handleDownload,
  handleRename,
  handleSharePublic,
  handleShareInternal,
  handleToggleStar,
  handleTag,
}) => {
  // Filter files based on search term
  const filteredFiles = files.filter((file) =>
    file.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sorting logic can be handled here or in Home.tsx
  // For this example, assuming it's already sorted

  return (
    <section className="flex-grow bg-white p-4 rounded-lg shadow-lg overflow-y-auto">
      {/* Search and Sorting */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 space-y-4 md:space-y-0">
        <input
          type="text"
          placeholder="Type to search..."
          value={searchTerm}
          onChange={onSearchChange}
          className="w-full md:w-1/2 p-2 border border-gray-300 rounded-lg"
        />
        <select
          className="w-full md:w-1/4 p-2 border border-gray-300 rounded-lg"
          value={sortOrder}
          onChange={onSortChange}
        >
          <option value="recent">Recently Added</option>
          <option value="size">File Size</option>
          <option value="alphabetical">Alphabetical</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : (
        <div className="space-y-4">
          {/* File List */}
          {filteredFiles.length === 0 ? (
            <div className="text-center text-gray-500">No files found.</div>
          ) : (
            filteredFiles.map((file) => (
              <FileItem
                key={file.fileId}
                file={file}
                onDelete={() => handleDelete(file.fileId)}
                onDownload={() => handleDownload(file.fileId)}
                onRename={(newName) => handleRename(file.fileId, newName)}
                onSharePublic={() => handleSharePublic(file.fileId)}
                onShareInternal={(selectedUsers) =>
                  handleShareInternal(file.fileId, selectedUsers)
                }
                onToggleStar={() => handleToggleStar(file.fileId)}
                onTag={(newTag) => handleTag(file.fileId, newTag)}
              />
            ))
          )}
        </div>
      )}
    </section>
  );
};

export default FileList;
