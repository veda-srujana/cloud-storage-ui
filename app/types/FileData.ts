// File: types/FileData.ts

export interface FileData {
    userId: string;
    fileId: string;
    fileName: string;
    fileUrl: string;
    version: number;
    createdAt: string; // ISO string
    updatedAt: string; // ISO string
    sharedWith: string[]; // Array of user IDs or emails
    isPublic: boolean;
    fileType: string;
    size: number; // in bytes
    tag: string; // "Recent", "Star", etc., or null
    isDeleted: boolean;
  }
  