import { useState, useCallback, useRef, DragEvent } from 'react';

interface DragAndDropOptions {
  accept?: string[];
  multiple?: boolean;
  onDrop?: (files: File[]) => void;
  onDragEnter?: () => void;
  onDragLeave?: () => void;
}

export function useDragAndDrop(options: DragAndDropOptions = {}) {
  const { accept, multiple = true, onDrop, onDragEnter, onDragLeave } = options;
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const dropRef = useRef<HTMLDivElement | null>(null);

  const filterFiles = useCallback((files: File[]): File[] => {
    if (!accept || accept.length === 0) return files;
    
    return files.filter(file => {
      return accept.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.replace('/*', '/'));
        }
        return file.type === type;
      });
    });
  }, [accept]);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragCounter(prev => {
      const newCount = prev + 1;
      if (newCount === 1) {
        setIsDragging(true);
        onDragEnter?.();
      }
      return newCount;
    });
  }, [onDragEnter]);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragCounter(prev => {
      const newCount = prev - 1;
      if (newCount === 0) {
        setIsDragging(false);
        onDragLeave?.();
      }
      return newCount;
    });
  }, [onDragLeave]);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(false);
    setDragCounter(0);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const filteredFiles = filterFiles(droppedFiles);
    const filesToUse = multiple ? filteredFiles : filteredFiles.slice(0, 1);
    
    if (filesToUse.length > 0) {
      onDrop?.(filesToUse);
    }
  }, [filterFiles, multiple, onDrop]);

  const getRootProps = useCallback(() => ({
    ref: dropRef,
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver,
    onDrop: handleDrop
  }), [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  return {
    isDragging,
    getRootProps,
    dropRef
  };
}

export default useDragAndDrop;
