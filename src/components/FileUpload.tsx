import { useState, useCallback, ChangeEvent, DragEvent } from 'react';
import { Upload, X, FileText, Image, Music, Video, FileSpreadsheet, Presentation } from 'lucide-react';

interface FileUploadProps {
  onFilesSelect: (files: File[]) => void;
  maxFiles?: number;
}

export default function FileUpload({ onFilesSelect, maxFiles = 5 }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // Increased size limits
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const MAX_IMAGE_SIZE = 25 * 1024 * 1024; // 25MB for images (OpenAI limit)
  const MAX_AUDIO_VIDEO_SIZE = 25 * 1024 * 1024; // 25MB for audio/video (Whisper limit)

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }, []);

  const processFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      const fileType = file.type.toLowerCase();
      const fileName = file.name.toLowerCase();
      
      // Different size limits for different file types
      let maxSize = MAX_FILE_SIZE;
      
      if (fileType.startsWith('image/')) {
        maxSize = MAX_IMAGE_SIZE;
      } else if (fileType.startsWith('audio/') || fileType.startsWith('video/')) {
        maxSize = MAX_AUDIO_VIDEO_SIZE;
      }
      
      if (file.size > maxSize) {
        const maxSizeMB = (maxSize / 1024 / 1024).toFixed(0);
        alert(`File ${file.name} is too large. Max size for this file type: ${maxSizeMB}MB`);
        return false;
      }
      
      return true;
    });

    const updatedFiles = [...files, ...validFiles].slice(0, maxFiles);
    setFiles(updatedFiles);
    onFilesSelect(updatedFiles);
  };

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesSelect(updatedFiles);
  };

  const getFileIcon = (type: string, name: string) => {
    const fileName = name.toLowerCase();
    
    if (type.startsWith('image/')) return <Image size={16} className="text-blue-500" />;
    if (type.startsWith('audio/')) return <Music size={16} className="text-purple-500" />;
    if (type.startsWith('video/')) return <Video size={16} className="text-red-500" />;
    if (type === 'application/pdf') return <FileText size={16} className="text-red-600" />;
    if (fileName.endsWith('.pptx') || fileName.endsWith('.ppt')) return <Presentation size={16} className="text-orange-500" />;
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) return <FileSpreadsheet size={16} className="text-green-500" />;
    return <FileText size={16} className="text-gray-500" />;
  };

  const getFileSizeDisplay = (size: number) => {
    if (size > 1024 * 1024) {
      return `${(size / 1024 / 1024).toFixed(1)} MB`;
    } else {
      return `${(size / 1024).toFixed(0)} KB`;
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto mb-2 text-gray-400" size={32} />
        <p className="text-gray-600 mb-2">
          Drop files here or{' '}
          <label className="text-blue-500 cursor-pointer hover:underline font-medium">
            browse
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.txt,.csv,.xlsx,.xls"
            />
          </label>
        </p>
        <div className="text-sm text-gray-500 space-y-1">
          <p>Max {maxFiles} files</p>
          <p>Documents: 50MB • Images: 25MB • Audio/Video: 25MB</p>
          <p>Supported: PDF, Word, PowerPoint, Excel, CSV, Images, Audio, Video</p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          <h4 className="text-sm font-medium text-gray-700">Selected Files:</h4>
          {files.map((file, index) => (
            <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
              {getFileIcon(file.type, file.name)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {getFileSizeDisplay(file.size)} • {file.type || 'Unknown type'}
                </p>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="p-1 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                title="Remove file"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}