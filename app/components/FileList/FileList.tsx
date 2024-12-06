// File: components/FileList/FileList.tsx

import React from 'react';
import FileItem from '../FileItem/FileItem';
import { formatBytes } from '../../utils/formatBytes';

interface FileListProps {
  files: any[];
  loading: boolean;
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  sortOrder: string;
  onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleDelete: (fileName: string) => void;
  handleDownload: (fileName: string) => void;
  handleRename: (fileName: string, newName:string) => void;
  handleShare: (fileName: string) => void;
  handleToggleStar: (fileName: string) => void;
  handleTag: (fileName: string, newtag:string) => void;
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
  handleShare,
  handleToggleStar,
  handleTag,
}) => {
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
          {files.length === 0 ? (
            <div className="text-center text-gray-500">No files found.</div>
          ) : (
            files.map((file: any, index: number) => (
              <FileItem
                    key={index}
                    fileName={file.fileName}
                    fileType={file.fileType}
                    fileSize={formatBytes(file.size)}
                    onDelete={() => handleDelete(file.fileName)}
                    onDownload={() => handleDownload(file.fileName)}
                    onRename={(newName) => handleRename(file.fileName,newName)}
                    onShare={() => handleShare(file.fileName)}
                    onToggleStar={() => handleToggleStar(file.fileName)}
                    onTag={(newtag) => handleTag(file.fileName,newtag)}
                    starred={file.tag ==="star"} tag={file.tag}              />
            ))
          )}
        </div>
      )}
    </section>
  );
};

export default FileList;
