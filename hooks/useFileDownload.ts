import { useState, useCallback } from 'react';

interface DownloadOptions {
  filename?: string;
  mimeType?: string;
}

export function useFileDownload() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const downloadUrl = useCallback(async (url: string, options: DownloadOptions = {}) => {
    setIsDownloading(true);
    setError(null);
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const filename = options.filename || url.split('/').pop() || 'download';
      downloadBlob(blob, filename);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Download failed';
      setError(message);
    } finally {
      setIsDownloading(false);
    }
  }, [downloadBlob]);

  const downloadText = useCallback((text: string, filename: string, mimeType = 'text/plain') => {
    const blob = new Blob([text], { type: mimeType });
    downloadBlob(blob, filename);
  }, [downloadBlob]);

  const downloadJson = useCallback((data: unknown, filename: string) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    downloadBlob(blob, filename.endsWith('.json') ? filename : `${filename}.json`);
  }, [downloadBlob]);

  const downloadBase64 = useCallback((base64: string, filename: string, mimeType = 'application/octet-stream') => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });
    downloadBlob(blob, filename);
  }, [downloadBlob]);

  const downloadCanvas = useCallback((canvas: HTMLCanvasElement, filename: string, format: 'png' | 'jpeg' | 'webp' = 'png') => {
    const mimeType = `image/${format}`;
    canvas.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, filename.endsWith(`.${format}`) ? filename : `${filename}.${format}`);
      }
    }, mimeType);
  }, [downloadBlob]);

  return {
    isDownloading,
    error,
    downloadUrl,
    downloadBlob,
    downloadText,
    downloadJson,
    downloadBase64,
    downloadCanvas
  };
}

export default useFileDownload;
