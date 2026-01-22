
import React, { useState, useRef, useMemo } from 'react';
import { Icons } from '../constants';
import { parsePrompt } from '../services/aiService';
import { WidgetConfig, SemanticModel, VizType } from '../types';

interface MagicBarProps {
  onWidgetGenerated: (widget: WidgetConfig) => void;
  semanticModel?: SemanticModel;
  compact?: boolean;
}

export const MagicBar: React.FC<MagicBarProps> = ({ onWidgetGenerated, semanticModel, compact }) => {
  const [query, setQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsGenerating(true);
    setShowSuggestions(false);
    try {
      const widget = await parsePrompt(query, semanticModel);
      onWidgetGenerated(widget);
      setQuery('');
    } catch (error) {
      console.error("AI Generation failed", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const lower = query.toLowerCase();
    const list: { label: string; action: string; type: string }[] = [];

    if (semanticModel) {
      semanticModel.metrics.forEach(m => {
        if (m.name.toLowerCase().includes(lower)) {
          list.push({ label: `Trend of ${m.name}`, action: `Show trend of ${m.name} over time`, type: 'Metric' });
        }
      });
      semanticModel.dimensions.forEach(d => {
        if (d.name.toLowerCase().includes(lower)) {
          list.push({ label: `Group by ${d.name}`, action: `Show sales grouped by ${d.name}`, type: 'Dimension' });
        }
      });
    }
    return list.slice(0, 5);
  }, [query, semanticModel]);

  return (
    <div className={`transition-all duration-700 ${compact ? 'relative scale-95' : 'relative py-12'}`}>
      <form onSubmit={handleSubmit} className="relative group">
        <div className={`absolute -inset-1 bg-gradient-to-r from-fuchsia-600/30 to-purple-600/30 rounded-3xl opacity-75 blur-2xl transition duration-500 ${isGenerating ? 'animate-pulse' : 'group-hover:opacity-100'}`}></div>
        
        <div className={`relative flex items-center bg-slate-900/60 backdrop-blur-3xl rounded-[2rem] border transition-all duration-500 ${compact ? 'p-1 px-4' : 'p-4 px-8'} ${isGenerating ? 'border-fuchsia-500/50 shadow-fuchsia-500/10' : 'border-white/10 shadow-2xl group-hover:border-white/20'}`}>
          <div className={`text-fuchsia-400 mr-4 transition-transform ${isGenerating ? 'animate-spin' : 'group-hover:scale-110'}`}>
             <Icons.Sparkles />
          </div>
          
          <input 
            ref={inputRef}
            type="text" 
            value={query}
            onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={isGenerating ? "Thinking..." : "What would you like to see?"}
            className={`flex-1 bg-transparent border-none outline-none text-white placeholder-slate-600 font-bold transition-all ${compact ? 'text-sm py-2' : 'text-xl py-4'}`}
            disabled={isGenerating}
          />

          <button 
            type="submit"
            disabled={!query.trim() || isGenerating}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-300 ${query.trim() ? 'bg-fuchsia-600 text-white shadow-lg' : 'bg-white/5 text-slate-700'}`}
          >
            {isGenerating ? "Parsing..." : "Generate"}
          </button>
        </div>

        {showSuggestions && query.length > 0 && suggestions.length > 0 && (
           <div className="absolute top-full left-4 right-4 mt-2 bg-slate-900/95 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-[100] animate-in slide-in-from-top-4 duration-300">
              <div className="p-3">
                 {suggestions.map((s, idx) => (
                    <button
                       key={idx}
                       type="button"
                       onClick={() => {
                           setQuery(s.action);
                           inputRef.current?.focus();
                       }}
                       className="w-full text-left px-5 py-3.5 text-sm text-slate-300 hover:bg-fuchsia-500/10 hover:text-white rounded-2xl transition-all flex items-center justify-between group/item"
                    >
                       <span className="font-bold tracking-tight">{s.label}</span>
                       <span className="text-[9px] font-black uppercase tracking-widest opacity-30 group-hover/item:opacity-100 transition-opacity">Auto-suggest</span>
                    </button>
                 ))}
              </div>
           </div>
        )}
      </form>
    </div>
  );
};
