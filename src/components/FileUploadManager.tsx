import React, { useState, useRef } from 'react';
import { 
  Upload, 
  File, 
  Download, 
  Trash2, 
  Image, 
  FileText, 
  Video,
  Music,
  Archive,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { supabaseService } from '../services/supabaseClient';
import Tooltip from './Tooltip';

interface UploadedFile {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  uploadedAt: Date;
  publicUrl?: string;
}

interface FileUploadManagerProps {
  bucketName?: string;
  allowedTypes?: string[];
  maxFileSize?: number; // in MB
  onFileUploaded?: (file: UploadedFile) => void;
  onFileDeleted?: (fileId: string) => void;
  customerId?: string;
  className?: string;
}

const FileUploadManager: React.FC<FileUploadManagerProps> = ({
  bucketName = 'app-content',
  allowedTypes = ['image/*', 'application/pdf', 'text/*', '.docx', '.xlsx'],
  maxFileSize = 10, // 10MB default
  onFileUploaded,
  onFileDeleted,
  customerId = 'default',
  className = ''
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing files on mount
  React.useEffect(() => {
    loadExistingFiles();
  }, []);

  const loadExistingFiles = async () => {
    try {
      if (!supabaseService.isAvailable()) return;
      
      const files = await supabaseService.listFiles(bucketName, `${customerId}/`);
      
      const uploadedFilesList: UploadedFile[] = await Promise.all(
        files.map(async (file) => {
          const publicUrl = await supabaseService.getPublicUrl(bucketName, file.name);
          return {
            id: file.id || file.name,
            name: file.name.split('/').pop() || file.name,
            path: file.name,
            size: file.metadata?.size || 0,
            type: file.metadata?.mimetype || 'application/octet-stream',
            uploadedAt: new Date(file.created_at || Date.now()),
            publicUrl
          };
        })
      );
      
      setUploadedFiles(uploadedFilesList);
    } catch (error) {
      console.error('Failed to load existing files:', error);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file size
    if (file.size > maxFileSize * 1024 * 1024) {
      setError(`File size must be less than ${maxFileSize}MB`);
      return;
    }

    // Validate file type
    const isAllowedType = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      return file.type === type;
    });

    if (!isAllowedType) {
      setError(`File type not allowed. Accepted types: ${allowedTypes.join(', ')}`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      if (!supabaseService.isAvailable()) {
        throw new Error('Supabase not configured');
      }

      // Create file path with customer organization
      const fileExtension = file.name.split('.').pop();
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `${customerId}/${fileName}`;

      // Simulate upload progress (real progress tracking would require streaming)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      // Upload file
      const uploadResult = await supabaseService.uploadFile(bucketName, filePath, file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Get public URL
      const publicUrl = await supabaseService.getPublicUrl(bucketName, filePath);

      const uploadedFile: UploadedFile = {
        id: uploadResult.id || filePath,
        name: file.name,
        path: filePath,
        size: file.size,
        type: file.type,
        uploadedAt: new Date(),
        publicUrl
      };

      setUploadedFiles(prev => [uploadedFile, ...prev]);
      onFileUploaded?.(uploadedFile);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('File upload failed:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileDelete = async (file: UploadedFile) => {
    try {
      if (!supabaseService.isAvailable()) {
        throw new Error('Supabase not configured');
      }

      await supabaseService.deleteFile(bucketName, file.path);
      setUploadedFiles(prev => prev.filter(f => f.id !== file.id));
      onFileDeleted?.(file.id);

    } catch (error) {
      console.error('File deletion failed:', error);
      setError(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return Image;
    if (fileType.startsWith('video/')) return Video;
    if (fileType.startsWith('audio/')) return Music;
    if (fileType.includes('pdf') || fileType.includes('document')) return FileText;
    if (fileType.includes('zip') || fileType.includes('archive')) return Archive;
    return File;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Area */}
      <div className="bg-slate-700/30 dark:bg-white/5 border-2 border-dashed border-slate-600/50 dark:border-white/20 rounded-xl p-8 text-center hover:border-blue-500/50 dark:hover:border-blue-400/50 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept={allowedTypes.join(',')}
          onChange={handleFileUpload}
          className="hidden"
        />
        
        <Upload className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
        
        <h3 className="text-lg font-semibold text-white dark:text-gray-200 mb-2">
          Upload Files
        </h3>
        <p className="text-gray-400 dark:text-gray-500 mb-4">
          Drag and drop files here or click to browse
        </p>
        
        <button
          onClick={handleFileSelect}
          disabled={isUploading}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
        >
          {isUploading ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              Uploading... {uploadProgress}%
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" />
              Choose Files
            </>
          )}
        </button>
        
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Max size: {maxFileSize}MB • Allowed: {allowedTypes.join(', ')}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <span className="text-red-300 font-medium">Upload Error</span>
          </div>
          <p className="text-red-200 text-sm mt-1">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="bg-slate-700/30 dark:bg-white/5 rounded-xl p-6 border border-slate-600/30 dark:border-white/10">
          <h4 className="text-lg font-semibold text-white dark:text-gray-200 mb-4 flex items-center gap-2">
            <File className="h-5 w-5 text-blue-400" />
            Uploaded Files ({uploadedFiles.length})
          </h4>
          
          <div className="space-y-3">
            {uploadedFiles.map((file) => {
              const FileIcon = getFileIcon(file.type);
              
              return (
                <div key={file.id} className="flex items-center gap-4 p-4 bg-slate-600/30 dark:bg-white/5 rounded-lg border border-slate-500/30 dark:border-white/10">
                  <div className="p-2 rounded-lg bg-blue-500/20 dark:bg-blue-400/20">
                    <FileIcon className="h-6 w-6 text-blue-400 dark:text-blue-300" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white dark:text-gray-200 truncate">
                      {file.name}
                    </div>
                    <div className="text-sm text-gray-400 dark:text-gray-500">
                      {formatFileSize(file.size)} • {file.uploadedAt.toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {file.publicUrl && (
                      <Tooltip content="Open file in new tab" position="top">
                        <a
                          href={file.publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Tooltip>
                    )}
                    
                    <Tooltip content="Download file" position="top">
                      <button
                        onClick={async () => {
                          try {
                            const blob = await supabaseService.downloadFile(bucketName, file.path);
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = file.name;
                            a.click();
                            URL.revokeObjectURL(url);
                          } catch (error) {
                            console.error('Download failed:', error);
                          }
                        }}
                        className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </Tooltip>
                    
                    <Tooltip content="Delete file" position="top">
                      <button
                        onClick={() => handleFileDelete(file)}
                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Usage Stats */}
      {supabaseService.isAvailable() && (
        <div className="bg-slate-700/30 dark:bg-white/5 rounded-lg p-4 border border-slate-600/30 dark:border-white/10">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400 dark:text-gray-500">Storage Usage</span>
            <span className="text-white dark:text-gray-200">
              {uploadedFiles.reduce((total, file) => total + file.size, 0) > 0 
                ? formatFileSize(uploadedFiles.reduce((total, file) => total + file.size, 0))
                : '0 Bytes'
              } used
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadManager;