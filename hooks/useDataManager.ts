import React, { useState, useEffect, useCallback } from 'react';
import { DEMO_DATA } from '../constants';

export const useDataManager = (currentTemplateName: string) => {
  const [data, setData] = useState<any[]>(DEMO_DATA);
  const [isStreaming, setIsStreaming] = useState(false);

  // Live Data Simulation
  useEffect(() => {
    let interval: any;
    if (isStreaming) {
      interval = setInterval(() => {
        setData(prev => prev.map(item => ({
          ...item,
          sales: Math.max(0, item.sales + (Math.random() - 0.5) * 500),
          users: Math.max(0, item.users + Math.floor((Math.random() - 0.5) * 10))
        })));
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isStreaming]);

  // File Upload Handler (CSV/JSON)
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (file.name.endsWith('.json')) {
        try {
          setData(JSON.parse(text));
        } catch (err) {
          console.error("Invalid JSON", err);
        }
      } else {
        // Simple CSV Parser
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) return;
        
        const headers = lines[0].split(',').map(h => h.trim());
        const parsed = lines.slice(1).map(line => {
          const values = line.split(',');
          return headers.reduce((obj: any, header, i) => {
            const val = values[i]?.trim();
            // Simple type inference
            obj[header] = isNaN(Number(val)) ? val : Number(val);
            return obj;
          }, {});
        });
        setData(parsed);
      }
    };
    reader.readAsText(file);
  }, []);

  // Export State as Standalone HTML
  const exportStandalone = useCallback(() => {
    const html = document.documentElement.outerHTML;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OmniGen_Dashboard_${currentTemplateName.replace(/\s+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentTemplateName]);

  return {
    data,
    isStreaming,
    setIsStreaming,
    handleFileUpload,
    exportStandalone
  };
};