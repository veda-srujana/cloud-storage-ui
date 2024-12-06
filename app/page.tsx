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
import { FileData } from './types/FileData';

const userPoolData = {
  UserPoolId: awsmobile.aws_user_pools_id,
  ClientId: awsmobile.aws_user_pools_web_client_id,
};

const userPool = new CognitoUserPool(userPoolData);


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
      let query:{search? :string,tag?:string,isDeleted?:boolean,isPublic?:boolean}={search:''}
      switch (currentFolder) {
        case 'All Files':
          query;
          break;

          case 'Recent':
            query={ tag: 'Recent'};
            break;

            case 'Starred':
              query={ tag: 'Star'};;
              break;
            case 'Deleted':
              query={ isDeleted: true};;
              break;
            case 'Public Shared':
              query={ isPublic: true};;
              break;
      
        default:
          break;
      }
      const response = await axios.get<{ body: FileData[] }>(
        'https://0d2uv8jpwh.execute-api.us-east-1.amazonaws.com/dev/files',
        {
          headers: {
            Authorization: token,
          },
          params: query,
        }
      );
      const fetchedFiles: FileData[] = response.data.body.map((file: FileData) => ({
        ...file,
        tag: file.tag,
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
  const handleDownload = async (fileId: string) => {
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
          const file = files.find((f) => f.fileId === fileId);
          if (!file) throw new Error('File not found');

          const response = await axios.get(
            `https://your-api-endpoint/dev/download/${file.fileName}`,
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
          link.setAttribute('download', file.fileName);
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
  const handleDelete = async (fileId: string) => {
    const file = files.find((f) => f.fileId === fileId);
    if (!file) {
      toast.error('File not found.');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${file.fileName}"?`)) {
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
            `https://0d2uv8jpwh.execute-api.us-east-1.amazonaws.com/dev/files/delete/${file.fileId}`,
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
  const handleRename = async (fileId: string, newName: string) => {
    const file = files.find((f) => f.fileId === fileId);
    if (!file) {
      toast.error('File not found.');
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
          console.error('Error getting session during rename:', err);
          toast.error('Session error, please log in again.');
          router.push('/login');
          setLoading(false);
          return;
        }

        const token = session.getIdToken().getJwtToken();
        try {
          await axios.patch(
            `https://0d2uv8jpwh.execute-api.us-east-1.amazonaws.com/dev/files/rename/${file.fileId}?newFileName=${newName}`,
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
 const handleSharePublic = async (fileId: string) => {
  const file = files.find((f) => f.fileId === fileId);
  if (!file) {
    toast.error('File not found.');
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
        console.error('Error getting session during share:', err);
        toast.error('Session error, please log in again.');
        router.push('/login');
        setLoading(false);
        return;
      }

      const token = session.getIdToken().getJwtToken();
      try {
        const response = await axios.post(
          `https://your-api-endpoint/dev/share/public`,
          { fileId: file.fileId },
          {
            headers: {
              Authorization: token,
            },
          }
        );
        // Assuming the API returns a shareable URL in response.data.shareUrl
        if (response.data && response.data.shareUrl) {
          navigator.clipboard.writeText(response.data.shareUrl);
          toast.success('Public shareable URL copied to clipboard!');
        } else {
          toast.info('Public shareable URL not available');
        }
      } catch (shareError: any) {
        console.error('Error sharing file publicly:', shareError);
        toast.error('Error sharing file publicly');
      } finally {
        setLoading(false);
      }
    });
  } catch (error: any) {
    console.error('Error during public share:', error);
    toast.error('Error sharing file publicly');
    setLoading(false);
  }
};

const handleShareInternal = async (fileId: string, selectedUsers: string[]) => {
  const file = files.find((f) => f.fileId === fileId);
  if (!file) {
    toast.error('File not found.');
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
        console.error('Error getting session during internal share:', err);
        toast.error('Session error, please log in again.');
        router.push('/login');
        setLoading(false);
        return;
      }

      const token = session.getIdToken().getJwtToken();
      try {
        await axios.post(
          `https://your-api-endpoint/dev/share/internal`,
          { fileId: file.fileId, sharedWith: selectedUsers },
          {
            headers: {
              Authorization: token,
            },
          }
        );
        toast.success('File shared with selected users successfully');
        fetchFiles(token); // Refresh file list
      } catch (shareError: any) {
        console.error('Error sharing file internally:', shareError);
        toast.error('Error sharing file with selected users');
      } finally {
        setLoading(false);
      }
    });
  } catch (error: any) {
    console.error('Error during internal share:', error);
    toast.error('Error sharing file with selected users');
    setLoading(false);
  }
};

// Handle toggling star status (treated as a tag)
const handleToggleStar = async (fileId: string) => {
  const file = files.find((f) => f.fileId === fileId);
  if (!file) {
    toast.error('File not found.');
    return;
  }

  const newTag = file.tag === 'Star' ? null : 'Star';
  handleTagAction(fileId, newTag || 'UnStar');
};

// Handle tagging a file
const handleTagAction = async (fileId: string, newTag: string) => {
  const file = files.find((f) => f.fileId === fileId);
  if (!file) {
    toast.error('File not found.');
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
        console.error('Error getting session during tagging:', err);
        toast.error('Session error, please log in again.');
        router.push('/login');
        setLoading(false);
        return;
      }

      const token = session.getIdToken().getJwtToken();
      try {
        await axios.patch(
          `https://0d2uv8jpwh.execute-api.us-east-1.amazonaws.com/dev/files/rename/${file.fileId}?newTag=${newTag}`,
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
            handleDelete={handleDelete}
            handleDownload={handleDownload}
            handleRename={handleRename}
            handleSharePublic={handleSharePublic}
            handleShareInternal={handleShareInternal}
            handleToggleStar={handleToggleStar}
            handleTag={handleTagAction}
          />
        </main>
      </div>

      {/* Initialize Tooltips */}
      {/* ReactTooltip is already initialized in individual components */}
    </div>
  );
};

export default Home;
