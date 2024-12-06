// File: pages/Home.tsx

"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios, { AxiosProgressEvent } from 'axios';
import { CognitoUserPool, CognitoUserSession } from 'amazon-cognito-identity-js';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from './components/Sidebar/Sidebar';
import Header from './components/Header/Header';
import FileList from './components/FileList/FileList';
import awsmobile from '../src/aws-exports';
import { formatBytes } from './utils/formatBytes';

const userPoolData = {
  UserPoolId: awsmobile.aws_user_pools_id,
  ClientId: awsmobile.aws_user_pools_web_client_id,
};

const userPool = new CognitoUserPool(userPoolData);

interface FileData {
  fileName: string;
  fileType: string;
  size: number;
  createdAt: string;
  starred: boolean;
  isDeleted: boolean;
  isPublic: boolean;
  sharedWith?: string[];
  tag?: string | null;
}

const Home = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFolder, setCurrentFolder] = useState('All Files');
  const [sortOrder, setSortOrder] = useState<string>('recent');
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }, [isDarkMode]);
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
      const fetchedFiles: FileData[] = response.data.body.map((file: any) => ({
        ...file,
        tag: file.tag || null,
      }));
      setFiles(fetchedFiles);
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
  const handleRename = async (fileName: string, newName: string) => {
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
            { oldFileName: fileName, newFileName: newName },
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
  };

  // Handle file sharing
  const handleShare = async (fileName: string) => {
    // The actual sharing is handled within FileItem via ShareModal
    // You can implement additional logic here if needed
    console.log(`Sharing file: ${fileName}`);
    toast.info('Sharing functionality handled within the Share Modal.');
  };

  // Handle toggling star status (now handled as a tag)
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
          // Assuming the backend toggles the 'Star' tag
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
  const handleTag = async (fileName: string, newTag: string) => {
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
            { fileName, tag: newTag },
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
  const usedStorageGB = (usedStorage / 1024 ** 3).toFixed(2);
  const quotaGB = (STORAGE_QUOTA / 1024 ** 3).toFixed(2);
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
    <div className={`flex h-screen bg-gray-100 ${isDarkMode ? 'dark-mode' : ''}`}>
      <ToastContainer />
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onLogout={handleLogout}
        currentFolder={currentFolder}
        onFolderClick={handleFolderClick}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-grow">
        {/* Header */}
        <Header
          usedStorageGB={usedStorageGB}
          quotaGB={quotaGB}
          storagePercentage={storagePercentage}
          onUpload={handleUpload}
        />

        {/* Theme Toggle Button */}
        <div className="absolute top-6 right-4">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 bg-gray-200 rounded-full hover:bg-gray-300"
            aria-label="Toggle Dark Mode"
          >
            {isDarkMode ? '🌞' : '🌙'}
          </button>
        </div>

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
          <FileList
            files={sortedFiles}
            loading={loading}
            searchTerm={searchTerm}
            onSearchChange={(e) => setSearchTerm(e.target.value)}
            sortOrder={sortOrder}
            onSortChange={(e) => setSortOrder(e.target.value)}
            handleDelete={(fileName) => handleDelete(fileName)}
            handleDownload={(fileName) => handleDownload(fileName)}
            handleRename={(fileName: string, newName: string) => handleRename(fileName, newName)}
            handleShare={(fileName) => handleShare(fileName)}
            handleToggleStar={(fileName) => handleToggleStar(fileName)}
            handleTag={(fileName: string, newTag: string) => handleTag(fileName, newTag)}
          />
        </main>
      </div>

      {/* Initialize Tooltips */}
      {/* ReactTooltip is already initialized in individual components */}
    </div>
  );
};

export default Home;
