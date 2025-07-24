export interface TaskAttachment {
  id: string;
  taskId: number;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  firebaseUrl: string;
  thumbnailUrl?: string;
  uploadedBy: string;
  description?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  
  // User information for display
  uploader?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface UploadAttachmentRequest {
  taskId: number;
  file: File;
  description?: string;
}

export interface AttachmentUploadResponse {
  success: boolean;
  attachment: {
    id: string;
    fileName: string;
    originalName: string;
    firebaseUrl: string;
    thumbnailUrl?: string;
    fileSize: number;
    mimeType: string;
  };
}

export interface AttachmentPreview {
  id: string;
  type: 'image' | 'document' | 'video' | 'audio' | 'archive' | 'other';
  previewUrl?: string;
  canPreview: boolean;
}

// File type helpers
export const FILE_TYPES = {
  IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'],
  DOCUMENT: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf'],
  VIDEO: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'],
  AUDIO: ['mp3', 'wav', 'ogg', 'aac', 'flac'],
  ARCHIVE: ['zip', 'rar', '7z', 'tar', 'gz'],
  CODE: ['js', 'ts', 'html', 'css', 'json', 'xml', 'py', 'java', 'cpp', 'c']
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  ...FILE_TYPES.IMAGE,
  ...FILE_TYPES.DOCUMENT,
  ...FILE_TYPES.VIDEO,
  ...FILE_TYPES.AUDIO,
  ...FILE_TYPES.ARCHIVE,
  ...FILE_TYPES.CODE
];

export function getFileType(fileName: string): 'image' | 'document' | 'video' | 'audio' | 'archive' | 'code' | 'other' {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  if (FILE_TYPES.IMAGE.includes(extension)) return 'image';
  if (FILE_TYPES.DOCUMENT.includes(extension)) return 'document';
  if (FILE_TYPES.VIDEO.includes(extension)) return 'video';
  if (FILE_TYPES.AUDIO.includes(extension)) return 'audio';
  if (FILE_TYPES.ARCHIVE.includes(extension)) return 'archive';
  if (FILE_TYPES.CODE.includes(extension)) return 'code';
  
  return 'other';
}

export function getFileIcon(fileName: string): string {
  const type = getFileType(fileName);
  
  switch (type) {
    case 'image': return 'fas fa-image';
    case 'document': return 'fas fa-file-alt';
    case 'video': return 'fas fa-film';
    case 'audio': return 'fas fa-music';
    case 'archive': return 'fas fa-file-archive';
    case 'code': return 'fas fa-code';
    default: return 'fas fa-file';
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}