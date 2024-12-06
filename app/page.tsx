// File: pages/Home.tsx

"use client";

import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios, { AxiosProgressEvent } from 'axios';
import {
  AiOutlineMenu,
  AiOutlineUpload,
  AiOutlineSetting,
  AiOutlineUser,
} from 'react-icons/ai';
import {
  BiCloudLightning,
  BiFileBlank,
  BiLogOut,
} from 'react-icons/bi';
import {
  FaFileAlt,
  FaStar,
  FaTrash,
  FaDownload,
  FaShareAlt,
  FaEdit,
  FaTag,
} from 'react-icons/fa';
import {
  MdFolderShared,
  MdOutlineHelp,
  MdPublic,
} from 'react-icons/md';
import { CognitoUserPool, CognitoUserSession } from 'amazon-cognito-identity-js';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ReactTooltip, { Tooltip } from 'react-tooltip';
import awsmobile from '../src/aws-exports';
import FileItem from './components/FileItem'; // Adjust the path as necessary

// AWS Cognito User Pool Configuration
const userPoolData = {
  UserPoolId: awsmobile.aws_user_pools_id,
  ClientId: awsmobile.aws_user_pools_web_client_id,
};

const userPool = new CognitoUserPool(userPoolData);

// NavItem Component with Tooltip
const NavItem = ({
  isOpen,
  icon,
  label,
  onClick,
}: {
  isOpen: boolean;
  icon: ReactNode;
  label: string;
  onClick?: () => void;
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
  </div>
);

// FolderItem Component with Tooltip
const FolderItem = ({
  label,
  icon,
  isActive,
  isSidebarOpen,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  isActive: boolean;
  isSidebarOpen: boolean;
  onClick: () => void;
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
  </div>
);

// Utility function to format bytes
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = [
    'Bytes',
    'KiB',
    'MiB',
    'GiB',
    'TiB',
    'PiB',
    'EiB',
    'ZiB',
    'YiB',
  ];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const Home = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFolder, setCurrentFolder] = useState('All Files');
  const [sortOrder, setSortOrder] = useState<string>('recent');
  const router = useRouter();

  useEffect(() => {
    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolder]);

  const checkUser = async () => {
    const currentUser = userPool.getCurrentUser();
    if (currentUser) {
      currentUser.getSession((err: any, session: CognitoUserSession) => {
        if (err) {
          console.error('Error getting session:', err);
          toast.error('Session error, please log in again.');
          router.push('/login');
        } else {
          console.log('Session valid, fetching files...');
          fetchFiles(session.getIdToken().getJwtToken());
        }
      });
    } else {
      router.push('/login');
    }
  };

  // Fetch user's files via API Gateway with filter
  const fetchFiles = async (token: string) => {
    setLoading(true);
    try {
      const response = await axios.get(
        'https://0d2uv8jpwh.execute-api.us-east-1.amazonaws.com/dev/files',
        {
          headers: {
            Authorization: token,
          },
          params: {
            filter: currentFolder,
          },
        }
      );
      setFiles(response.data.body as any[]);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Error fetching files');
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.[0]) {
      toast.error('No file selected.');
      return;
    }
    let file: File = event.target.files?.[0];
    if (!file) return; // No file selected, nothing to upload

    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      toast.error('File size exceeds 10 MB, please choose a smaller file.');
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      const currentUser = userPool.getCurrentUser();
      if (!currentUser) {
        throw new Error('No current user');
      }
      currentUser.getSession(async (err: any, session: CognitoUserSession) => {
        if (err) {
          console.error('Error getting session during upload:', err);
          toast.error('Session error, please log in again.');
          router.push('/login');
          setLoading(false);
          return;
        }

        const token = session.getIdToken().getJwtToken();
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', file.name);
        formData.append('fileType', file.type);
        formData.append('size', file.size.toString());

        try {
          const response = await axios.post(
            'https://emklzv4cya.execute-api.us-east-1.amazonaws.com/dev/upload',
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: token,
              },
              onUploadProgress: (progressEvent: AxiosProgressEvent) => {
                if (progressEvent.total) {
                  const progress = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total
                  );
                  setUploadProgress(progress);
                }
              },
            }
          );

          if (response.status === 200) {
            toast.success('File uploaded successfully');
            fetchFiles(token); // Refresh file list
          }
        } catch (uploadError: any) {
          console.error('Error uploading file:', uploadError);
          toast.error('Error uploading file');
        } finally {
          setLoading(false);
          setUploadProgress(0);
          // Reset the file input
          if (event.target) {
            event.target.value = '';
          }
        }
      });
    } catch (error: any) {
      console.error('Error during upload:', error);
      toast.error('Error uploading file');
      setLoading(false);
    }
  };

  // Handle file download
  const handleDownload = async (fileName: string) => {
    setLoading(true);
    try {
      const currentUser = userPool.getCurrentUser();
      if (!currentUser) {
        throw new Error('No current user');
      }
      currentUser.getSession(async (err: any, session: CognitoUserSession) => {
        if (err) {
          console.error('Error getting session during download:', err);
          toast.error('Session error, please log in again.');
          router.push('/login');
          setLoading(false);
          return;
        }

        const token = session.getIdToken().getJwtToken();
        try {
          const response = await axios.get(
            `https://emklzv4cya.execute-api.us-east-1.amazonaws.com/dev/download/${fileName}`,
            {
              headers: {
                Authorization: token,
              },
              responseType: 'blob',
            }
          );

          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', fileName);
          document.body.appendChild(link);
          link.click();
          link.parentNode?.removeChild(link);
          toast.success('File downloaded successfully');
        } catch (downloadError: any) {
          console.error('Error downloading file:', downloadError);
          toast.error('Error downloading file');
        } finally {
          setLoading(false);
        }
      });
    } catch (error: any) {
      console.error('Error during download:', error);
      toast.error('Error downloading file');
      setLoading(false);
    }
  };

  // Handle file deletion
  const handleDelete = async (fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    setLoading(true);
    try {
      const currentUser = userPool.getCurrentUser();
      if (!currentUser) {
        throw new Error('No current user');
      }
      currentUser.getSession(async (err: any, session: CognitoUserSession) => {
        if (err) {
          console.error('Error getting session during delete:', err);
          toast.error('Session error, please log in again.');
          router.push('/login');
          setLoading(false);
          return;
        }

        const token = session.getIdToken().getJwtToken();
        try {
          await axios.delete(
            `https://emklzv4cya.execute-api.us-east-1.amazonaws.com/dev/delete/${fileName}`,
            {
              headers: {
                Authorization: token,
              },
            }
          );
          toast.success('File deleted successfully');
          fetchFiles(token); // Refresh file list
        } catch (deleteError: any) {
          console.error('Error deleting file:', deleteError);
          toast.error('Error deleting file');
        } finally {
          setLoading(false);
        }
      });
    } catch (error: any) {
      console.error('Error during delete:', error);
      toast.error('Error deleting file');
      setLoading(false);
    }
  };

  // Handle file renaming
  const handleRename = async (fileName: string) => {
    const newFileName = prompt('Enter new file name:', fileName);
    if (newFileName && newFileName !== fileName) {
      setLoading(true);
      try {
        const currentUser = userPool.getCurrentUser();
        if (!currentUser) {
          throw new Error('No current user');
        }
        currentUser.getSession(async (err: any, session: CognitoUserSession) => {
          if (err) {
            console.error('Error getting session during rename:', err);
            toast.error('Session error, please log in again.');
            router.push('/login');
            setLoading(false);
            return;
          }

          const token = session.getIdToken().getJwtToken();
          try {
            await axios.post(
              `https://emklzv4cya.execute-api.us-east-1.amazonaws.com/dev/rename`,
              { oldFileName: fileName, newFileName },
              {
                headers: {
                  Authorization: token,
                },
              }
            );
            toast.success('File renamed successfully');
            fetchFiles(token); // Refresh file list
          } catch (renameError: any) {
            console.error('Error renaming file:', renameError);
            toast.error('Error renaming file');
          } finally {
            setLoading(false);
          }
        });
      } catch (error: any) {
        console.error('Error during rename:', error);
        toast.error('Error renaming file');
        setLoading(false);
      }
    }
  };

  // Handle file sharing
  const handleShare = async (fileName: string) => {
    setLoading(true);
    try {
      const currentUser = userPool.getCurrentUser();
      if (!currentUser) {
        throw new Error('No current user');
      }
      currentUser.getSession(async (err: any, session: CognitoUserSession) => {
        if (err) {
          console.error('Error getting session during share:', err);
          toast.error('Session error, please log in again.');
          router.push('/login');
          setLoading(false);
          return;
        }

        const token = session.getIdToken().getJwtToken();
        try {
          const response = await axios.post(
            `https://emklzv4cya.execute-api.us-east-1.amazonaws.com/dev/share`,
            { fileName },
            {
              headers: {
                Authorization: token,
              },
            }
          );
          // Assuming the API returns a shareable URL in response.data.fileUrl
          if (response.data && response.data.fileUrl) {
            navigator.clipboard.writeText(response.data.fileUrl);
            toast.success('Shareable URL copied to clipboard!');
          } else {
            toast.info('Shareable URL not available');
          }
        } catch (shareError: any) {
          console.error('Error sharing file:', shareError);
          toast.error('Error sharing file');
        } finally {
          setLoading(false);
        }
      });
    } catch (error: any) {
      console.error('Error during share:', error);
      toast.error('Error sharing file');
      setLoading(false);
    }
  };

  // Handle toggling star status
  const handleToggleStar = async (fileName: string) => {
    setLoading(true);
    try {
      const currentUser = userPool.getCurrentUser();
      if (!currentUser) {
        throw new Error('No current user');
      }
      currentUser.getSession(async (err: any, session: CognitoUserSession) => {
        if (err) {
          console.error('Error getting session during toggle star:', err);
          toast.error('Session error, please log in again.');
          router.push('/login');
          setLoading(false);
          return;
        }

        const token = session.getIdToken().getJwtToken();
        try {
          await axios.post(
            `https://emklzv4cya.execute-api.us-east-1.amazonaws.com/dev/toggle-star`,
            { fileName },
            {
              headers: {
                Authorization: token,
              },
            }
          );
          toast.success('Star status updated');
          fetchFiles(token); // Refresh file list
        } catch (starError: any) {
          console.error('Error toggling star:', starError);
          toast.error('Error updating star status');
        } finally {
          setLoading(false);
        }
      });
    } catch (error: any) {
      console.error('Error during toggle star:', error);
      toast.error('Error updating star status');
      setLoading(false);
    }
  };

  // Handle tagging a file
  const handleTag = async (fileName: string) => {
    const tag = prompt('Enter tag for the file:', '');
    if (tag) {
      setLoading(true);
      try {
        const currentUser = userPool.getCurrentUser();
        if (!currentUser) {
          throw new Error('No current user');
        }
        currentUser.getSession(async (err: any, session: CognitoUserSession) => {
          if (err) {
            console.error('Error getting session during tagging:', err);
            toast.error('Session error, please log in again.');
            router.push('/login');
            setLoading(false);
            return;
          }

          const token = session.getIdToken().getJwtToken();
          try {
            await axios.post(
              `https://emklzv4cya.execute-api.us-east-1.amazonaws.com/dev/tag`,
              { fileName, tag },
              {
                headers: {
                  Authorization: token,
                },
              }
            );
            toast.success('File tagged successfully');
            fetchFiles(token); // Refresh file list
          } catch (tagError: any) {
            console.error('Error tagging file:', tagError);
            toast.error('Error tagging file');
          } finally {
            setLoading(false);
          }
        });
      } catch (error: any) {
        console.error('Error during tagging:', error);
        toast.error('Error tagging file');
        setLoading(false);
      }
    }
  };

  // Handle folder selection
  const handleFolderClick = (folderName: string) => {
    setCurrentFolder(folderName);
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      const currentUser = userPool.getCurrentUser();
      if (!currentUser) {
        throw new Error('No current user');
      }
      currentUser.signOut();
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error: any) {
      console.error('Error during logout:', error);
      toast.error('Error logging out');
    }
  };

  // Calculate storage usage
  const STORAGE_QUOTA = 5 * 1024 * 1024 * 1024; // 5 GB in bytes
  const usedStorage = files.reduce((total, file) => total + file.size, 0);
  const usedStorageGB = (usedStorage / (1024 ** 3)).toFixed(2);
  const quotaGB = (STORAGE_QUOTA / (1024 ** 3)).toFixed(2);
  const storagePercentage = Math.min((usedStorage / STORAGE_QUOTA) * 100, 100).toFixed(2);

  // Sorting logic
  const sortedFiles = [...files].sort((a, b) => {
    if (sortOrder === 'recent') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortOrder === 'size') {
      return b.size - a.size;
    } else if (sortOrder === 'alphabetical') {
      return a.fileName.localeCompare(b.fileName);
    }
    return 0;
  });

  return (
    <div className="flex h-screen bg-gray-100">
      <ToastContainer />
      {/* Sidebar */}
      <div
        className={`flex flex-col bg-white shadow-lg ${
          isSidebarOpen ? 'w-64' : 'w-20'
        } transition-width duration-300`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div
            className={`font-bold text-xl text-teal-600 ${
              !isSidebarOpen && 'hidden'
            }`}
          >
            UCMDRIVE
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <AiOutlineMenu size={24} className="text-gray-600" />
          </button>
        </div>
        {/* Sidebar Content */}
        <div className="flex-grow p-4 space-y-6">
          {/* Navigation Items */}
          <div className="border-t border-gray-200 pt-4 space-y-4">
            <NavItem
              isOpen={isSidebarOpen}
              icon={<AiOutlineUser />}
              label="Account"
              onClick={() => {
                // Handle Account Click
                // e.g., navigate to account page
              }}
            />
            <NavItem
              isOpen={isSidebarOpen}
              icon={<AiOutlineSetting />}
              label="Settings"
              onClick={() => {
                // Handle Settings Click
                // e.g., navigate to settings page
              }}
            />
            <NavItem
              isOpen={isSidebarOpen}
              icon={<MdOutlineHelp />}
              label="Help & Support"
              onClick={() => {
                // Handle Help Click
                // e.g., open help modal or navigate to help page
              }}
            />
            <NavItem
              isOpen={isSidebarOpen}
              icon={<BiLogOut />}
              label="Log Out"
              onClick={handleLogout}
            />
          </div>

          {/* My Files Section */}
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <h3
              className={`text-gray-700 font-semibold ${
                !isSidebarOpen && 'hidden'
              }`}
            >
              My Files
            </h3>
            <FolderItem
              label="All Files"
              icon={<FaFileAlt />}
              isActive={currentFolder === 'All Files'}
              isSidebarOpen={isSidebarOpen}
              onClick={() => handleFolderClick('All Files')}
            />
            <FolderItem
              label="Recent"
              icon={<BiCloudLightning />}
              isActive={currentFolder === 'Recent'}
              isSidebarOpen={isSidebarOpen}
              onClick={() => handleFolderClick('Recent')}
            />
            <FolderItem
              label="Other"
              icon={<BiFileBlank />}
              isActive={currentFolder === 'Other'}
              isSidebarOpen={isSidebarOpen}
              onClick={() => handleFolderClick('Other')}
            />
            <FolderItem
              label="Starred"
              icon={<FaStar />}
              isActive={currentFolder === 'Starred'}
              isSidebarOpen={isSidebarOpen}
              onClick={() => handleFolderClick('Starred')}
            />
            <FolderItem
              label="Deleted"
              icon={<FaTrash />}
              isActive={currentFolder === 'Deleted'}
              isSidebarOpen={isSidebarOpen}
              onClick={() => handleFolderClick('Deleted')}
            />
          </div>

          {/* Shared Files Section */}
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <h3
              className={`text-gray-700 font-semibold ${
                !isSidebarOpen && 'hidden'
              }`}
            >
              Shared Files
            </h3>
            <FolderItem
              label="Public Shared"
              icon={<MdPublic />}
              isActive={currentFolder === 'Public Shared'}
              isSidebarOpen={isSidebarOpen}
              onClick={() => handleFolderClick('Public Shared')}
            />
            <FolderItem
              label="Shared with People"
              icon={<MdFolderShared />}
              isActive={currentFolder === 'Shared with People'}
              isSidebarOpen={isSidebarOpen}
              onClick={() => handleFolderClick('Shared with People')}
            />
          </div>
        </div>
        {/* Sidebar Footer */}
        <div className="p-4">
          <select className="w-full p-2 border border-gray-300 rounded-lg">
            <option>English (US)</option>
            {/* Add more language options if needed */}
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-grow">
        {/* Header */}
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
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <label className="py-2 px-4 text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition cursor-pointer flex items-center">
              <AiOutlineUpload size={20} className="inline mr-2" />
              Upload Files
              <input type="file" onChange={handleUpload} className="hidden" />
            </label>
          </div>
        </header>

        {/* Progress Bar for Upload */}
        {uploadProgress > 0 && (
          <div className="w-full h-2 bg-gray-200 mt-2">
            <div
              className="h-2 bg-teal-600 transition-width duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}

        {/* Main Content */}
        <main className="p-6 flex flex-grow space-x-6 overflow-hidden">
          {/* Files Section */}
          <section className="flex-grow bg-white p-4 rounded-lg shadow-lg overflow-y-auto">
            {/* Search and Sorting */}
            <div className="flex justify-between items-center mb-4">
              <input
                type="text"
                placeholder="Type to search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
              <select
                className="ml-4 p-2 border border-gray-300 rounded-lg"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
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
                {sortedFiles
                  .filter((file: any) => {
                    // Implement filtering based on currentFolder
                    if (currentFolder === 'All Files') return true;
                    if (currentFolder === 'Starred') return file.starred;
                    if (currentFolder === 'Deleted') return file.isDeleted;
                    if (currentFolder === 'Public Shared') return file.isPublic;
                    if (currentFolder === 'Recent') {
                      // Implement logic to determine if the file is recent
                      const oneWeekAgo = new Date();
                      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                      const fileDate = new Date(file.createdAt);
                      return fileDate >= oneWeekAgo;
                    }
                    if (currentFolder === 'Shared with People')
                      return file.sharedWith && file.sharedWith.length > 0;
                    if (currentFolder === 'Other')
                      return !file.isPublic && (!file.sharedWith || file.sharedWith.length === 0);
                    return true;
                  })
                  .filter((file: any) =>
                    file.fileName.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((file: any, index: number) => (
                    <FileItem
                      key={index}
                      fileName={file.fileName}
                      fileType={file.fileType}
                      fileSize={formatBytes(file.size)}
                      onDelete={() => handleDelete(file.fileName)}
                      onDownload={() => handleDownload(file.fileName)}
                      onRename={() => handleRename(file.fileName)}
                      onShare={() => handleShare(file.fileName)}
                      onToggleStar={() => handleToggleStar(file.fileName)}
                      onTag={() => handleTag(file.fileName)}
                      starred={file.starred}
                    />
                  ))}
              </div>
            )}
          </section>
        </main>
      </div>
      {/* Initialize Tooltips */}
      <Tooltip place="right" variant="dark" />
    </div>
  );
};

export default Home;
