import React, { useRef, useState } from 'react';
import { Upload, X, FileText, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FileUploadProps {
  onFileSelect: (file: File | File[]) => void;
  accept?: string;
  label?: string;
  description?: string;
  maxSizeMB?: number;
  multiple?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileSelect, 
  accept = "*/*", 
  label = "Upload File", 
  description = "Drag and drop your file here, or click to browse",
  maxSizeMB = 10,
  multiple = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const filesArray = Array.from(newFiles);
    const validFiles = filesArray.filter(f => f.size <= maxSizeMB * 1024 * 1024);
    
    if (validFiles.length < filesArray.length) {
      alert(`Some files were too large. Max size is ${maxSizeMB}MB.`);
    }

    if (validFiles.length > 0) {
      setIsUploading(true);
      setUploadProgress(0);
      
      let p = 0;
      const interval = setInterval(() => {
        p += Math.random() * 30;
        if (p >= 100) {
          p = 100;
          clearInterval(interval);
          setUploadProgress(100);
          
          setTimeout(() => {
            setIsUploading(false);
            if (multiple) {
              const updated = [...selectedFiles, ...validFiles];
              setSelectedFiles(updated);
              onFileSelect(updated);
            } else if (validFiles[0]) {
              setSelectedFiles([validFiles[0]]);
              onFileSelect(validFiles[0]);
            }
          }, 300);
        } else {
          setUploadProgress(p);
        }
      }, 150);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const clearFiles = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFiles([]);
    onFileSelect(multiple ? [] : (null as any));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {isUploading ? (
          <motion.div
            key="uploading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="border-2 border-accent2/30 bg-accent2/5 rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-6"
          >
            <div className="relative w-20 h-20">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-border"
                />
                <motion.circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeDasharray="226.19"
                  animate={{ strokeDashoffset: 226.19 * (1 - uploadProgress / 100) }}
                  className="text-accent2"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-syne font-800 text-lg">
                {Math.round(uploadProgress)}%
              </div>
            </div>
            <div>
              <div className="font-syne font-800 text-sm uppercase tracking-widest text-accent2 animate-pulse mb-1">
                Injecting_Data_Stream
              </div>
              <div className="text-[9px] font-mono text-muted uppercase tracking-tighter">
                / BUFFER_CACHE_INITIALIZING...
              </div>
            </div>
          </motion.div>
        ) : selectedFiles.length === 0 ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative group cursor-pointer
              border-2 border-dashed rounded-3xl p-12
              flex flex-col items-center justify-center transition-all duration-500
              ${isDragging 
                ? 'border-accent2 bg-accent2/5 scale-[1.01]' 
                : 'border-border bg-surface/50 hover:border-accent2 hover:bg-surface/80'}
            `}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              accept={accept} 
              multiple={multiple}
              className="hidden" 
              onChange={(e) => handleFiles(e.target.files)}
            />
            
            <div className={`
              w-16 h-16 rounded-xl mb-6 flex items-center justify-center text-4xl
              transition-all duration-500 relative
              ${isDragging ? 'bg-accent2 text-white rotate-12 scale-110' : 'bg-bg text-muted group-hover:text-accent2'}
            `}>
              <Upload className="w-8 h-8" />
              {isDragging && (
                <div className="absolute inset-0 rounded-xl border-2 border-accent2 animate-ping" />
              )}
            </div>

            <div className="space-y-1 text-center">
              <h3 className="font-syne text-xl font-800 uppercase tracking-tight text-text">{label}</h3>
              <p className="text-muted text-[11px] font-medium max-w-[200px] mx-auto leading-relaxed opacity-60">/ {description}</p>
            </div>

            <div className="mt-8 flex gap-2">
               <div className="px-3 py-1 rounded bg-bg text-[10px] font-mono uppercase tracking-widest text-muted border border-border">
                 MAX_PLOAD: {maxSizeMB}MB
               </div>
               <div className="px-3 py-1 rounded bg-bg text-[10px] font-mono uppercase tracking-widest text-muted border border-border">
                 MODE: {multiple ? 'SYSTEM_MULTI' : 'SINGLE_INSTANCE'}
               </div>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {selectedFiles.map((file, idx) => (
              <motion.div
                key={file.name + idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative bg-surface text-text p-6 rounded-2xl border border-border shadow-sm flex items-center gap-5 overflow-hidden group hover:border-accent2 transition-colors"
              >
                <div className="relative z-10 w-12 h-12 bg-bg border border-border rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-muted group-hover:text-accent2 transition-colors" />
                </div>

                <div className="relative z-10 flex-1 min-w-0">
                   <h3 className="font-syne text-sm font-800 tracking-tight truncate uppercase">{file.name}</h3>
                   <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-muted uppercase">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      <div className="w-1 h-1 rounded-full bg-border" />
                      <span className="text-[10px] font-mono text-green uppercase">READY_FOR_PROCESSING</span>
                   </div>
                </div>

                <div className="relative z-10 flex gap-2">
                   <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const updated = selectedFiles.filter((_, i) => i !== idx);
                      setSelectedFiles(updated);
                      onFileSelect(multiple ? updated : (null as any));
                    }}
                    className="w-8 h-8 rounded-lg bg-bg text-muted hover:text-red-400 hover:bg-red-400/10 transition-all flex items-center justify-center border border-border"
                   >
                     <X className="w-4 h-4" />
                   </button>
                </div>
              </motion.div>
            ))}
            
            {multiple && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 border-2 border-dashed border-border rounded-2xl text-[10px] font-mono font-bold uppercase tracking-widest text-muted hover:border-accent2 hover:text-accent2 transition-all"
              >
                + ADD_MORE_DATA_NODES
              </button>
            )}

            {!multiple && (
              <button 
                onClick={clearFiles}
                className="w-full py-3 bg-muted/5 border border-border rounded-xl text-center text-[10px] font-mono font-bold uppercase tracking-widest text-muted hover:bg-muted/10 transition-colors"
              >
                RESET_SYSTEM_BUFFER
              </button>
            )}
            
            <input 
              type="file" 
              ref={fileInputRef} 
              accept={accept} 
              multiple={multiple}
              className="hidden" 
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
