import React, { useState, useCallback, useRef } from 'react';

interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UseFileUploadOptions {
  maxSize?: number;
  acceptedTypes?: string[];
  onProgress?: (progress: FileUploadProgress) => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const { maxSize = 10 * 1024 * 1024, acceptedTypes = [], onProgress } = options;
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<FileUploadProgress>({ loaded: 0, total: 0, percentage: 0 });
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxSize) {
      return `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`;
    }
    if (acceptedTypes.length > 0 && !acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.replace('/*', '/'));
      }
      return file.type === type || file.name.endsWith(type);
    })) {
      return 'File type not accepted';
    }
    return null;
  }, [maxSize, acceptedTypes]);

  const readFileAsDataURL = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const prog = { loaded: e.loaded, total: e.total, percentage: Math.round((e.loaded / e.total) * 100) };
          setProgress(prog);
          onProgress?.(prog);
        }
      };
      reader.readAsDataURL(file);
    });
  }, [onProgress]);

  const readFileAsText = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, []);

  const readFileAsArrayBuffer = useCallback((file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }, []);

  const selectFile = useCallback((accept?: string): Promise<File | null> => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept || acceptedTypes.join(',');
      input.onchange = () => {
        const file = input.files?.[0] || null;
        resolve(file);
      };
      input.click();
    });
  }, [acceptedTypes]);

  const selectMultipleFiles = useCallback((accept?: string): Promise<File[]> => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = accept || acceptedTypes.join(',');
      input.onchange = () => {
        const files = Array.from(input.files || []);
        resolve(files);
      };
      input.click();
    });
  }, [acceptedTypes]);

  const uploadFile = useCallback(async (file: File, url: string): Promise<Response> => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      throw new Error(validationError);
    }

    setIsUploading(true);
    setError(null);
    setProgress({ loaded: 0, total: file.size, percentage: 0 });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      setProgress({ loaded: file.size, total: file.size, percentage: 100 });
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, [validateFile]);

  return {
    isUploading,
    progress,
    error,
    inputRef,
    selectFile,
    selectMultipleFiles,
    uploadFile,
    readFileAsDataURL,
    readFileAsText,
    readFileAsArrayBuffer,
    validateFile,
  };
}

export function useFileDownload() {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const downloadDataURL = useCallback((dataURL: string, filename: string) => {
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  const downloadText = useCallback((text: string, filename: string, mimeType = 'text/plain') => {
    const blob = new Blob([text], { type: mimeType });
    downloadBlob(blob, filename);
  }, [downloadBlob]);

  const downloadJSON = useCallback((data: object, filename: string) => {
    const json = JSON.stringify(data, null, 2);
    downloadText(json, filename, 'application/json');
  }, [downloadText]);

  const downloadFromURL = useCallback(async (url: string, filename: string) => {
    setIsDownloading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      downloadBlob(blob, filename);
    } finally {
      setIsDownloading(false);
    }
  }, [downloadBlob]);

  const downloadCanvas = useCallback((canvas: HTMLCanvasElement, filename: string, type = 'image/png') => {
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, filename);
    }, type);
  }, [downloadBlob]);

  return {
    isDownloading,
    downloadBlob,
    downloadDataURL,
    downloadText,
    downloadJSON,
    downloadFromURL,
    downloadCanvas,
  };
}

export function useDragAndDrop(onFilesDropped: (files: File[]) => void) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files) as File[];
    if (files.length > 0) {
      onFilesDropped(files);
    }
  }, [onFilesDropped]);

  return {
    isDragging,
    dragProps: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
  };
}
