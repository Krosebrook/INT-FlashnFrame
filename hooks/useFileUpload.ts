import { useState, useCallback, useRef } from 'react';

interface FileUploadOptions {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  onUpload?: (files: File[]) => void;
  onError?: (error: string) => void;
}

interface FileUploadState {
  files: File[];
  isUploading: boolean;
  error: string | null;
  progress: number;
}

export function useFileUpload(options: FileUploadOptions = {}) {
  const { accept, multiple = false, maxSize = 10 * 1024 * 1024, onUpload, onError } = options;
  
  const [state, setState] = useState<FileUploadState>({
    files: [],
    isUploading: false,
    error: null,
    progress: 0
  });
  
  const inputRef = useRef<HTMLInputElement | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `File "${file.name}" exceeds maximum size of ${Math.round(maxSize / 1024 / 1024)}MB`;
    }
    
    if (accept) {
      const acceptedTypes = accept.split(',').map(t => t.trim());
      const fileType = file.type;
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      
      const isValid = acceptedTypes.some(type => {
        if (type.startsWith('.')) return fileExt === type.toLowerCase();
        if (type.endsWith('/*')) return fileType.startsWith(type.replace('/*', '/'));
        return fileType === type;
      });
      
      if (!isValid) {
        return `File type "${fileType}" is not accepted`;
      }
    }
    
    return null;
  }, [accept, maxSize]);

  const handleFiles = useCallback((fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const validFiles: File[] = [];
    const errors: string[] = [];
    
    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    }
    
    if (errors.length > 0) {
      const errorMsg = errors.join('; ');
      setState(prev => ({ ...prev, error: errorMsg }));
      onError?.(errorMsg);
    }
    
    if (validFiles.length > 0) {
      setState(prev => ({
        ...prev,
        files: multiple ? [...prev.files, ...validFiles] : validFiles,
        error: errors.length > 0 ? errors.join('; ') : null
      }));
      onUpload?.(validFiles);
    }
  }, [multiple, validateFile, onUpload, onError]);

  const openFilePicker = useCallback(() => {
    if (!inputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept || '*/*';
      input.multiple = multiple;
      input.style.display = 'none';
      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        if (target.files) handleFiles(target.files);
      };
      inputRef.current = input;
      document.body.appendChild(input);
    }
    inputRef.current.click();
  }, [accept, multiple, handleFiles]);

  const clearFiles = useCallback(() => {
    setState({ files: [], isUploading: false, error: null, progress: 0 });
  }, []);

  const removeFile = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  }, []);

  return {
    ...state,
    openFilePicker,
    handleFiles,
    clearFiles,
    removeFile
  };
}

export default useFileUpload;
