"use client";

import { MouseEventHandler, ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios, { AxiosProgressEvent } from 'axios';
import { AiOutlineMenu, AiOutlineUpload, AiOutlineSetting, AiOutlineUser } from 'react-icons/ai';
import { BiFolderMinus, BiLogOut, BiNews } from 'react-icons/bi';
import { FaFolder, FaFileAlt, FaStar, FaTrash } from 'react-icons/fa';
import { MdMiscellaneousServices, MdOutlineHelp, MdSdStorage, MdStorage } from 'react-icons/md';
import { Amplify } from 'aws-amplify';
import { CognitoUserPool } from 'amazon-cognito-identity-js';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import awsmobile from '../src/aws-exports';

const userPoolData = {
  UserPoolId: awsmobile.aws_user_pools_id,
  ClientId: awsmobile.aws_user_pools_web_client_id,
};
const userPool = new CognitoUserPool(userPoolData);

const Home = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const router = useRouter();

  useEffect(() => {
    try {
      Amplify.configure(awsmobile);
      console.log("AWS Amplify initialized:", awsmobile);
    } catch (error) {
      console.error("Error initializing Amplify:", error);
    }
    checkUser();
  }, []);

  const checkUser = async () => {
    const currentUser = userPool.getCurrentUser();
    if (currentUser) {
      currentUser.getSession((err: any, session: any) => {
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

  // Fetch user's files via API Gateway
  const fetchFiles = async (token: string) => {
    setLoading(true);
    try {
      const response = await axios.get('https://0d2uv8jpwh.execute-api.us-east-1.amazonaws.com/dev/files', {
        headers: {
          Authorization: token,
        },
      });
      setFiles(response.data.body as any);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Error fetching files');
    } finally {
      setLoading(false);
    }
  };
// Handle file upload
const handleUpload = async (event: any) => {
  const file: File = event.target.files[0];
  if (!file) return; // No file selected, nothing to upload
  const maxSize = 10 * 1024 * 1024; // 10 MB
  if (file.size > maxSize) {
    toast.error('File size exceeds 10 MB, please choose a smaller file.');
    return;
  }
  setSelectedFile(file);

  setLoading(true);
  const currentUser = userPool.getCurrentUser();
  if (!currentUser) {
    toast.error('No current user, please log in.');
    router.push('/login');
    // Early return to avoid continuing after redirect
    setLoading(false);
    setUploadProgress(0);
    setSelectedFile(null);
    return;
  }

  try {
    // currentUser.getSession is callback-based, so we continue within that callback
    currentUser.getSession(async (err: any, session: any) => {
      if (err) {
        console.error('Error getting session:', err);
        toast.error('Session error, please log in again.');
        router.push('/login');
        // Reset states after navigation
        setLoading(false);
        setUploadProgress(0);
        setSelectedFile(null);
        return;
      }

      try {
        // Use the 'file' variable directly, since we know it's set
        const formData = new FormData();
        formData.append('file', file);
        // formData.append('fileName', file.name);
        // formData.append('fileType', file.type);
        // formData.append('size', file.size.toString());
        const reader = new FileReader();
        reader.readAsDataURL(file);

        const response = await axios.post(
          'https://emklzv4cya.execute-api.us-east-1.amazonaws.com/dev/upload',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: session.getIdToken().getJwtToken(),
            },
            onUploadProgress: (progressEvent: AxiosProgressEvent) => {
              if (progressEvent.total) {
                const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                setUploadProgress(progress);
              }
            },
          }
        );

        if (response.status === 200) {
          toast.success('File uploaded successfully');
          await fetchFiles(session.getIdToken().getJwtToken()); // Refresh file list
          // Reset states after a successful upload
          setSelectedFile(null);
          setUploadProgress(0);
        }
      } catch (uploadError) {
        console.error('Error uploading file:', uploadError);
        toast.error('Error uploading file');
        // Reset states after upload error
        setUploadProgress(0);
        setSelectedFile(null);
      } finally {
        setLoading(false);
      }
    });
  } catch (generalError) {
    console.error('General upload error:', generalError);
    toast.error('Error uploading file');
    // Reset states after a general error
    setUploadProgress(0);
    setSelectedFile(null);
    setLoading(false);
  }
};

  // Handle file download
  const handleDownload = async (fileName: string) => {
    setLoading(true);
    try {
      const currentUser = userPool.getCurrentUser();
      if (currentUser) {
        currentUser.getSession(async (err: any, session: any) => {
          if (err) {
            console.error('Error getting session:', err);
            toast.error('Session error, please log in again.');
            router.push('/login');
            setLoading(false);
            return;
          }

          try {
            const response = await axios.get(`https://<api-endpoint>/download/${fileName}`, {
              headers: {
                Authorization: session.getIdToken().getJwtToken(),
              },
              responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            toast.success('File downloaded successfully');
          } catch (downloadError) {
            console.error('Error downloading file:', downloadError);
            toast.error('Error downloading file');
          } finally {
            setLoading(false);
          }
        });
      } else {
        toast.error('No current user, please log in.');
        router.push('/login');
        setLoading(false);
      }
    } catch (generalError) {
      console.error('General download error:', generalError);
      toast.error('Error downloading file');
      setLoading(false);
    }
  };

  // Handle file deletion
  const handleDelete = async (fileName: string) => {
    setLoading(true);
    try {
      const currentUser = userPool.getCurrentUser();
      if (currentUser) {
        currentUser.getSession(async (err: any, session: any) => {
          if (err) {
            console.error('Error getting session:', err);
            toast.error('Session error, please log in again.');
            router.push('/login');
            setLoading(false);
            return;
          }

          try {
            await axios.delete(`https://<api-endpoint>/delete/${fileName}`, {
              headers: {
                Authorization: session.getIdToken().getJwtToken(),
              },
            });
            toast.success('File deleted successfully');
            await fetchFiles(session.getIdToken().getJwtToken()); // Refresh file list
          } catch (deleteError) {
            console.error('Error deleting file:', deleteError);
            toast.error('Error deleting file');
          } finally {
            setLoading(false);
          }
        });
      } else {
        toast.error('No current user, please log in.');
        router.push('/login');
        setLoading(false);
      }
    } catch (generalError) {
      console.error('General delete error:', generalError);
      toast.error('Error deleting file');
      setLoading(false);
    }
  };

  // Handle file renaming
  const handleRename = async (oldFileName: string, newFileName: string) => {
    if (!newFileName) return;
    setLoading(true);
    try {
      const currentUser = userPool.getCurrentUser();
      if (currentUser) {
        currentUser.getSession(async (err: any, session: any) => {
          if (err) {
            console.error('Error getting session:', err);
            toast.error('Session error, please log in again.');
            router.push('/login');
            setLoading(false);
            return;
          }

          try {
            await axios.post(
              `https://<api-endpoint>/rename`,
              { oldFileName, newFileName },
              {
                headers: {
                  Authorization: session.getIdToken().getJwtToken(),
                },
              }
            );
            toast.success('File renamed successfully');
            await fetchFiles(session.getIdToken().getJwtToken()); // Refresh file list
          } catch (renameError) {
            console.error('Error renaming file:', renameError);
            toast.error('Error renaming file');
          } finally {
            setLoading(false);
          }
        });
      } else {
        toast.error('No current user, please log in.');
        router.push('/login');
        setLoading(false);
      }
    } catch (generalError) {
      console.error('General rename error:', generalError);
      toast.error('Error renaming file');
      setLoading(false);
    }
  };

  // Handle file sharing
  const handleShare = async (fileName: string) => {
    setLoading(true);
    try {
      const currentUser = userPool.getCurrentUser();
      if (currentUser) {
        currentUser.getSession(async (err: any, session: any) => {
          if (err) {
            console.error('Error getting session:', err);
            toast.error('Session error, please log in again.');
            router.push('/login');
            setLoading(false);
            return;
          }

          try {
            const response = await axios.post(
              `https://<api-endpoint>/share`,
              { fileName },
              {
                headers: {
                  Authorization: session.getIdToken().getJwtToken(),
                },
              }
            );
            toast.success(`Shareable URL: ${response.data.fileUrl}`);
          } catch (shareError) {
            console.error('Error sharing file:', shareError);
            toast.error('Error sharing file');
          } finally {
            setLoading(false);
          }
        });
      } else {
        toast.error('No current user, please log in.');
        router.push('/login');
        setLoading(false);
      }
    } catch (generalError) {
      console.error('General share error:', generalError);
      toast.error('Error sharing file');
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <ToastContainer />
      {/* Sidebar */}
      <div className={`flex flex-col bg-white shadow-lg ${isSidebarOpen ? 'w-64' : 'w-20'} transition-width duration-300`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className={`font-bold text-xl text-teal-600 ${!isSidebarOpen && 'hidden'}`}>UCMDRIVE</div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <AiOutlineMenu size={24} className="text-gray-600" />
          </button>
        </div>
        <div className="flex-grow p-4 space-y-6">
          {/* Sidebar Navigation */}
          <div className="space-y-4">
            <NavItem isOpen={isSidebarOpen} icon={<FaFolder />} label="Storage" />
            <NavItem isOpen={isSidebarOpen} icon={<FaFolder />} label="News" />
            <NavItem isOpen={isSidebarOpen} icon={<FaFolder />} label="Movies" />
            <NavItem isOpen={isSidebarOpen} icon={<FaFolder />} label="Music" />
            <NavItem isOpen={isSidebarOpen} icon={<FaFolder />} label="Travel" />
          </div>
          <div className="border-t border-gray-200 pt-4 space-y-4">
            <NavItem isOpen={isSidebarOpen} icon={<AiOutlineUser />} label="Account" />
            <NavItem isOpen={isSidebarOpen} icon={<AiOutlineSetting />} label="Settings" />
            <NavItem isOpen={isSidebarOpen} icon={<MdOutlineHelp />} label="Help & Support" />
            <NavItem isOpen={isSidebarOpen} icon={<BiLogOut />} label="Log Out" />
          </div>
        </div>
        <div className="p-4">
          <select className="w-full p-2 border border-gray-300 rounded-lg">
            <option>English (US)</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-grow">
        {/* Header */}
        <header className="flex items-center justify-between p-6 bg-white border-b border-gray-200 shadow">
          <div className="text-lg font-semibold text-gray-700">Storage 2.6 GB of 5 GB used</div>
          <div className="flex items-center space-x-4">
            <label className="py-2 px-4 text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition cursor-pointer">
              <AiOutlineUpload size={20} className="inline mr-2" />
              Upload Files
              <input type="file" onChange={handleUpload} className="hidden" />
            </label>
          </div>
        </header>

        {/* Progress Bar */}
        {loading && (
          <div className="w-full h-2 bg-gray-200 mt-2">
            <div
              className="h-2 bg-teal-600 transition-width duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}

        {/* Main Content */}
        <main className="p-6 flex flex-grow space-x-6">
          {/* Left Section - My Folders */}
          <section className="w-1/3 space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <h2 className="font-bold text-lg text-gray-700 mb-4">My Folder</h2>
              <FolderItem label="All Files" icon={<FaFileAlt />} />
              <FolderItem label="Daily Digests" icon={<BiNews />} />
              <FolderItem label="Other" icon={<MdMiscellaneousServices />} />
              <FolderItem label="Starred" icon={<FaStar />} />
              <FolderItem label="Deleted" icon={<FaTrash />} />
            </div>
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <h2 className="font-bold text-lg text-gray-700 mb-4">Shared Folders</h2>
              <FolderItem label="Eve's Folder" icon={<BiFolderMinus />} />
              <FolderItem label="Adam's Drive" icon={<MdStorage />} />
              <FolderItem label="Sam's Storage" icon={<MdSdStorage />} />
            </div>
          </section>

          {/* Right Section - All Files */}
          <section className="flex-grow bg-white p-4 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <input
                type="text"
                placeholder="Type to search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
              <select className="ml-4 p-2 border border-gray-300 rounded-lg">
                <option>Recently Added</option>
                <option>File Size</option>
                <option>Alphabetical</option>
              </select>
            </div>
            {loading ? (
              <div className="text-center text-gray-500">Loading...</div>
            ) : (
              <div className="space-y-4">
                {/* File List */}
                {files
                  .filter((file: any) => file.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((file: any, index: number) => (
                    <FileItem
                      key={index}
                      fileName={file.name}
                      fileType={file.type}
                      fileSize={file.size}
                      onDelete={() => handleDelete(file.name)}
                    />
                  ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

const NavItem = ({ isOpen, icon, label }: { isOpen: boolean; icon: ReactNode; label: string }) => (
  <div className="flex items-center space-x-4 cursor-pointer hover:bg-gray-200 p-2 rounded-lg">
    {icon}
    {isOpen && <span className="text-gray-700 dark:text-white font-semibold">{label}</span>}
  </div>
);

const FolderItem = ({ label, icon }: { icon: ReactNode; label: string }) => (
  <div className="flex items-center justify-between text-gray-700 p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
    <span>{label}</span>
    {icon && <span>{icon}</span>}
  </div>
);

const FileItem = ({
  fileName,
  fileType,
  fileSize,
  onDelete,
}: {
  fileName: string;
  fileType: string;
  fileSize: string;
  onDelete: MouseEventHandler<HTMLButtonElement>;
}) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg">
    <div className="flex items-center space-x-4">
      <FaFileAlt className="text-teal-500" />
      <div>
        <div className="font-semibold">{fileName}</div>
        <div className="text-sm text-gray-500">
          {fileType} - {fileSize}
        </div>
      </div>
    </div>
    <button onClick={onDelete} className="text-red-600 hover:text-teal-500 focus:outline-none">
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
);

export default Home;
