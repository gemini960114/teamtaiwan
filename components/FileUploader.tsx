
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef } from 'react';
import { UploadCloud, FileAudio, X, Loader2 } from 'lucide-react';
import { AudioData } from '../types';

interface FileUploaderProps {
  onFileSelected: (audioData: AudioData) => void;
  disabled?: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelected, disabled }) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
      alert("Please upload a valid audio file.");
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64 = base64String.split(',')[1];
      
      onFileSelected({
        blob: file,
        base64,
        mimeType: file.type
      });
    };
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  // Keyboard support for activating the file input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="audio/*,video/*"
        onChange={handleChange}
        disabled={disabled}
      />
      
      {!fileName ? (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label="Upload audio file"
          className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-3xl transition-all outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:focus:ring-offset-slate-900 ${
            dragActive 
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" 
              : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800/80"
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={handleKeyDown}
        >
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 dark:text-emerald-400 rounded-full mb-4">
            <UploadCloud size={32} />
          </div>
          <p className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-1">
            Click to upload or drag & drop
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            MP3, WAV, M4A, WEBM (Max 20MB)
          </p>
        </div>
      ) : (
        <div className={`bg-white dark:bg-slate-800 border rounded-2xl p-6 flex items-center justify-between shadow-sm transition-colors duration-300 ${disabled ? 'border-emerald-500 ring-1 ring-emerald-500 dark:border-emerald-500' : 'border-slate-200 dark:border-slate-700'}`}>
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-lg ${disabled ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'}`}>
               {disabled ? <Loader2 size={24} className="animate-spin" /> : <FileAudio size={24} />}
            </div>
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px] sm:max-w-md">{fileName}</p>
              <p className={`text-xs ${disabled ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                {disabled ? 'Processing transcription...' : 'Ready to transcribe'}
              </p>
            </div>
          </div>
          
          {!disabled && (
            <button 
                onClick={handleClear}
                className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label="Remove file"
            >
                <X size={20} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
