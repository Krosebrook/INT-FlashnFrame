
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { editImageWithGemini, generateCodeFromImage, scanComponentLibrary, generateResponsiveVariants, generateDashboard } from '../services/geminiService';
import { ViewMode } from '../types';
import { Upload, Wand2, Loader2, Download, ImageIcon, Palette, Terminal, Sparkles, Code, Copy, Undo, Redo, LayoutGrid, Smartphone, LayoutDashboard, FileCode, FileText } from 'lucide-react';
import { useRateLimitContext } from '../contexts/RateLimitContext';

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

type RealityMode = 'style' | 'code' | 'components' | 'responsive' | 'dashboard';

const STYLE_PRESETS = [
  { name: "Neon Cyberpunk", prompt: "Redraw this in a Neon Cyberpunk style with glowing pink and cyan accents on a dark slate background." },
  { name: "Minimalist Blueprint", prompt: "Convert this into a clean minimalist technical blueprint with thin lines and white background." },
  { name: "Hand-drawn Sketch", prompt: "Make this look like a professional architect's hand-drawn pencil sketch on rough paper." },
  { name: "Glassmorphism", prompt: "Apply a modern glassmorphism aesthetic with frosted glass layers, soft shadows, and vibrant background blurs." },
  { name: "Isometric 3D", prompt: "Transform this diagram into a 3D isometric perspective view with volumetric lighting and depth." },
  { name: "8-Bit Retro", prompt: "Redraw this using pixel art / 8-bit video game style with a limited vibrant color palette." },
  { name: "Vintage Sci-Fi", prompt: "Style this like a 1970s science fiction book cover with grainy textures and retro-futuristic typography." },
  { name: "Futuristic HUD", prompt: "Convert this into a high-tech glowing tactical HUD interface with banklines and digital artifacts." },
  { name: "Synthwave Sunset", prompt: "Redraw this in a Synthwave style with a retro sun background, neon grid ground, and purple/orange gradient aesthetics." },
  { name: "Watercolor Impression", prompt: "Convert this into a soft watercolor painting with bleeding edges, pastel colors, and an impressionistic artistic style." },
  { name: "Technical Line Art", prompt: "Render this as precise black and white technical line art illustration with clean strokes and hatching details." }
];

interface ImageEditorProps {
  initialState?: { data: string; mimeType: string } | null;
  onNavigate?: (mode: ViewMode) => void;
}

interface HistoryState {
  imageData: string | null;
  code: string | null;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ initialState, onNavigate }) => {
  const { handleApiError: handleGlobalRateLimit } = useRateLimitContext();
  const [mimeType, setMimeType] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [processing, setProcessing] = useState(false);
  const [mode, setMode] = useState<RealityMode>('style');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Results for new modes
  const [componentLibrary, setComponentLibrary] = useState<Awaited<ReturnType<typeof scanComponentLibrary>> | null>(null);
  const [responsiveVariants, setResponsiveVariants] = useState<Awaited<ReturnType<typeof generateResponsiveVariants>> | null>(null);
  const [dashboardResult, setDashboardResult] = useState<Awaited<ReturnType<typeof generateDashboard>> | null>(null);

  // History State
  const [history, setHistory] = useState<HistoryState[]>([{ imageData: null, code: null }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const currentState = history[historyIndex];

  useEffect(() => {
    if (initialState) {
      setHistory([{ imageData: initialState.data, code: null }]);
      setHistoryIndex(0);
      setMimeType(initialState.mimeType);
    }
  }, [initialState]);

  const addToHistory = (newState: HistoryState) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError(null);

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setFileError(`Unsupported file type "${file.type}". Please use JPEG, PNG, WebP, or GIF.`);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64 = base64String.split(',')[1];
      setHistory([{ imageData: base64, code: null }]);
      setHistoryIndex(0);
      setMimeType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleEdit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentState.imageData) return;
    
    // Some modes don't require prompt
    if ((mode === 'style' || mode === 'code') && !prompt) return;

    setProcessing(true);
    
    // Clear previous results for the respective modes
    if (mode === 'components') setComponentLibrary(null);
    if (mode === 'responsive') setResponsiveVariants(null);
    if (mode === 'dashboard') setDashboardResult(null);

    try {
      if (mode === 'style') {
          const resultBase64 = await editImageWithGemini(currentState.imageData, mimeType, prompt);
          if (resultBase64) {
            addToHistory({ imageData: resultBase64, code: null });
          } else {
            alert('Could not generate edited image.');
          }
      } else if (mode === 'code') {
          const code = await generateCodeFromImage(currentState.imageData, prompt);
          if (code) {
              addToHistory({ imageData: currentState.imageData, code: code });
          } else {
              alert('Could not generate code.');
          }
      } else if (mode === 'components') {
          const result = await scanComponentLibrary(currentState.imageData);
          setComponentLibrary(result);
      } else if (mode === 'responsive') {
          const result = await generateResponsiveVariants(currentState.imageData, prompt || undefined);
          setResponsiveVariants(result);
      } else if (mode === 'dashboard') {
          const result = await generateDashboard(currentState.imageData, prompt || undefined);
          setDashboardResult(result);
      }
    } catch (error: any) {
      if (handleGlobalRateLimit(error)) {
        alert('Rate limit reached. Please wait for the cooldown timer to finish.');
      } else if (error.message && error.message.includes("Requested entity was not found")) {
        alert('API configuration error. Please contact your system administrator.');
      } else {
        alert(error.message || 'An error occurred while processing.');
      }
    } finally {
      setProcessing(false);
    }
  }, [currentState.imageData, mimeType, prompt, mode, history, historyIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleEdit();
    }
  };

  const applyStylePreset = (preset: { name: string, prompt: string }) => {
    setPrompt(preset.prompt);
  };

  const triggerUpload = () => inputRef.current?.click();

  return (
    <div className="max-w-6xl mx-auto space-y-10 mb-20">
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <h2 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-fuchsia-300 via-pink-300 to-slate-500 font-sans">
          Reality <span className="text-pink-500">Engine</span>.
        </h2>
        <p className="text-slate-400 text-lg font-light tracking-wide">
          Transform generated infographics with style transfer or reverse-engineer wireframes into React code.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Input Column */}
        <div className="space-y-6">
          {/* Upload Area */}
          <div 
            onClick={triggerUpload}
            className={`group glass-panel rounded-3xl aspect-[4/3] flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden ${
              currentState.imageData 
                ? 'border-pink-500/30 shadow-neon-violet/20' 
                : 'hover:border-pink-400/30 hover:bg-white/5 border-dashed border-white/10'
            }`}
          >
            {currentState.imageData ? (
              <>
                <img src={`data:${mimeType};base64,${currentState.imageData}`} alt="Source" className="h-full w-full object-contain p-4 relative z-10" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 backdrop-blur-md">
                  <p className="text-white font-bold flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
                    <Upload className="w-4 h-4" /> Change_Source
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center p-6 space-y-6 flex flex-col items-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-900/50 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-all shadow-lg group-hover:shadow-pink-500/20">
                   <Upload className="w-6 h-6 text-slate-400 group-hover:text-pink-400 transition-colors" />
                </div>
                <div>
                  <p className="text-slate-300 font-bold text-lg font-sans">Drop Blueprint Here</p>
                  <p className="text-slate-500 text-xs mt-2 font-mono uppercase tracking-wider mb-4">JPEG, PNG, WebP, or GIF (max {MAX_FILE_SIZE_MB}MB)</p>
                </div>
              </div>
            )}
             <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileChange} className="hidden" />
             {fileError && (
               <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-mono flex items-center gap-2">
                 <span className="shrink-0">⚠</span>
                 <span>{fileError}</span>
               </div>
             )}
          </div>

          {/* Mode Switcher */}
          <div className="space-y-2">
            <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setMode('style')}
                className={`flex-1 py-2 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${mode === 'style' ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' : 'text-slate-500 hover:text-slate-300'}`}
              >
                  <Palette className="w-3 h-3" /> Style
              </button>
              <button
                onClick={() => setMode('code')}
                className={`flex-1 py-2 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${mode === 'code' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300'}`}
              >
                  <Code className="w-3 h-3" /> Code
              </button>
              <button
                onClick={() => setMode('components')}
                className={`flex-1 py-2 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${mode === 'components' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-500 hover:text-slate-300'}`}
              >
                  <LayoutGrid className="w-3 h-3" /> Library
              </button>
            </div>
            <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setMode('responsive')}
                className={`flex-1 py-2 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${mode === 'responsive' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'}`}
              >
                  <Smartphone className="w-3 h-3" /> Responsive
              </button>
              <button
                onClick={() => setMode('dashboard')}
                className={`flex-1 py-2 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${mode === 'dashboard' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-500 hover:text-slate-300'}`}
              >
                  <LayoutDashboard className="w-3 h-3" /> Dashboard
              </button>
            </div>
          </div>

          {/* Control Panel */}
          <div className={`glass-panel p-1.5 rounded-3xl transition-all duration-500 ${currentState.imageData ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4 pointer-events-none filter blur-sm'}`}>
             <div className="bg-slate-900/50 rounded-2xl p-6 space-y-6">
               
               {/* Style Presets Grid (Only in Style Mode) */}
               {mode === 'style' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-pink-400 font-mono text-xs font-bold uppercase tracking-widest">
                            <Palette className="w-4 h-4" />
                            <span>Style_Presets</span>
                        </div>
                        <span className="text-[10px] text-slate-600 font-mono uppercase">Select one to apply</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {STYLE_PRESETS.map((preset) => (
                        <button
                            key={preset.name}
                            type="button"
                            onClick={() => applyStylePreset(preset)}
                            className={`text-[11px] px-3 py-2.5 rounded-xl transition-all border font-mono text-left truncate group/btn ${
                                prompt === preset.prompt 
                                ? 'bg-pink-500/20 text-pink-200 border-pink-500/50 shadow-neon-violet' 
                                : 'bg-slate-950/50 text-slate-500 border-white/5 hover:border-pink-500/30 hover:text-pink-300'
                            }`}
                        >
                            <span className="flex items-center justify-between">
                                {preset.name}
                                <Sparkles className={`w-3 h-3 transition-opacity ${prompt === preset.prompt ? 'opacity-100' : 'opacity-0 group-hover/btn:opacity-50'}`} />
                            </span>
                        </button>
                        ))}
                    </div>
                </div>
               )}

               {/* Mode-specific instructions */}
               {mode === 'components' && (
                 <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                   <p className="text-sm text-emerald-300 mb-2 font-semibold">Component Library Scanner</p>
                   <p className="text-xs text-slate-400">Analyzes UI screenshot to extract reusable components, design tokens (colors, typography, spacing), and generates React code for each pattern detected.</p>
                 </div>
               )}
               {mode === 'responsive' && (
                 <div className="p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                   <p className="text-sm text-cyan-300 mb-2 font-semibold">Responsive Variant Generator</p>
                   <p className="text-xs text-slate-400">Generates mobile, tablet, and desktop variants of your UI with Tailwind responsive classes and layout recommendations.</p>
                 </div>
               )}
               {mode === 'dashboard' && (
                 <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                   <p className="text-sm text-amber-300 mb-2 font-semibold">Dashboard Generator</p>
                   <p className="text-xs text-slate-400">Generates a complete multi-file dashboard project with components, hooks, utilities, and documentation.</p>
                 </div>
               )}

               {/* Manual Prompt Area (conditional) */}
               <form onSubmit={handleEdit} className={`space-y-4 ${mode === 'style' ? 'border-t border-white/5 pt-6' : ''}`}>
                  {(mode === 'style' || mode === 'code' || mode === 'responsive' || mode === 'dashboard') && (
                    <>
                      <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest" style={{color: mode === 'style' ? '#f472b6' : mode === 'code' ? '#818cf8' : mode === 'responsive' ? '#22d3ee' : '#fbbf24'}}>
                          <Terminal className="w-4 h-4" />
                          <span>
                            {mode === 'style' ? 'Transformation_Script' : 
                             mode === 'code' ? 'Component_Requirements' : 
                             mode === 'responsive' ? 'Component_Name (Optional)' : 
                             'Dashboard_Requirements (Optional)'}
                          </span>
                      </div>
                      <textarea
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder={
                            mode === 'style' ? "Describe how to transform the image..." : 
                            mode === 'code' ? "Describe the functionality (e.g., 'A responsive dashboard with sidebar')..." :
                            mode === 'responsive' ? "Optional: Component name or specific requirements..." :
                            "Optional: Additional requirements for the dashboard..."
                          }
                          className={`w-full h-28 bg-slate-950/50 rounded-xl border border-white/10 p-4 text-slate-200 placeholder:text-slate-700 focus:ring-1 resize-none font-mono text-sm leading-relaxed ${
                            mode === 'style' ? 'focus:ring-pink-500/50 focus:border-pink-500/50' :
                            mode === 'code' ? 'focus:ring-indigo-500/50 focus:border-indigo-500/50' :
                            mode === 'responsive' ? 'focus:ring-cyan-500/50 focus:border-cyan-500/50' :
                            'focus:ring-amber-500/50 focus:border-amber-500/50'
                          }`}
                        />
                    </>
                  )}
                  
                  <button
                    type="submit"
                    disabled={processing || !currentState.imageData || ((mode === 'style' || mode === 'code') && !prompt.trim())}
                    className={`w-full py-4 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-3 font-mono text-base tracking-widest shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                      mode === 'style' ? 'bg-gradient-to-r from-pink-600/20 to-violet-600/20 hover:from-pink-500/30 hover:to-violet-500/30 border border-pink-500/30 hover:shadow-neon-violet' :
                      mode === 'code' ? 'bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30' :
                      mode === 'components' ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30' :
                      mode === 'responsive' ? 'bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30' :
                      'bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30'
                    }`}
                  >
                    {processing ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" /> 
                            PROCESSING...
                        </>
                    ) : (
                        <>
                            {mode === 'style' && <><Wand2 className="w-5 h-5 text-pink-400" /> EXECUTE_RENDER</>}
                            {mode === 'code' && <><Code className="w-5 h-5 text-indigo-400" /> GENERATE_CODE</>}
                            {mode === 'components' && <><LayoutGrid className="w-5 h-5 text-emerald-400" /> SCAN_COMPONENTS</>}
                            {mode === 'responsive' && <><Smartphone className="w-5 h-5 text-cyan-400" /> GENERATE_VARIANTS</>}
                            {mode === 'dashboard' && <><LayoutDashboard className="w-5 h-5 text-amber-400" /> GENERATE_DASHBOARD</>}
                        </>
                    )}
                  </button>
                  <p className="text-[10px] text-slate-600 font-mono text-center uppercase tracking-wider">Press Ctrl + Enter to execute</p>
               </form>
            </div>
          </div>
        </div>

        {/* Output Column */}
        <div className="space-y-6 lg:sticky lg:top-24">
          
          {/* History Controls */}
          {history.length > 1 && (mode === 'style' || mode === 'code') && (
              <div className="flex items-center justify-between bg-slate-900/50 p-2 rounded-xl border border-white/5">
                  <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 text-slate-400 hover:text-white disabled:opacity-30 transition-colors" title="Undo">
                      <Undo className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">History {historyIndex + 1}/{history.length}</span>
                  <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-2 text-slate-400 hover:text-white disabled:opacity-30 transition-colors" title="Redo">
                      <Redo className="w-4 h-4" />
                  </button>
              </div>
          )}

          {/* Standard Output (Style/Code modes) */}
          {(mode === 'style' || mode === 'code') && (
            <>
              <div className={`glass-panel rounded-3xl aspect-[4/3] flex items-center justify-center overflow-hidden relative p-1.5 shadow-2xl ${currentState.code ? 'bg-[#0d1117]' : ''}`}>
                <div className="w-full h-full bg-slate-950/80 rounded-2xl flex items-center justify-center overflow-hidden relative border border-white/5">
                    {processing ? (
                    <div className="text-center space-y-6 relative z-10 px-8">
                        <div className="relative mx-auto w-16 h-16">
                            <div className="absolute inset-0 rounded-full border-2 border-pink-500/20 animate-ping"></div>
                            <Loader2 className="w-16 h-16 animate-spin text-pink-500 relative" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-pink-300 font-mono text-xs animate-pulse tracking-[0.3em] font-bold uppercase">{mode === 'style' ? 'Synthesizing Pixels' : 'Writing Component'}</p>
                            <p className="text-slate-600 font-mono text-[10px] uppercase">{mode === 'style' ? 'Applying style transfer architecture...' : 'Generating React/Tailwind code...'}</p>
                        </div>
                    </div>
                    ) : currentState.code ? (
                        <div className="w-full h-full overflow-auto p-4 bg-[#0d1117] text-left relative">
                             <div className="absolute top-2 right-2 z-20 flex gap-2">
                                 <button
                                   onClick={() => navigator.clipboard.writeText(currentState.code!)}
                                   className="bg-white/10 hover:bg-white/20 p-2 rounded-lg text-slate-300 transition-colors"
                                   title="Copy Code"
                                 >
                                     <Copy className="w-4 h-4" />
                                 </button>
                             </div>
                             <pre className="font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                                 {currentState.code}
                             </pre>
                        </div>
                    ) : currentState.imageData && historyIndex > 0 ? ( 
                    <div className="w-full h-full relative group">
                        <img src={`data:image/png;base64,${currentState.imageData}`} alt="Edited Output" className="h-full w-full object-contain animate-in fade-in zoom-in-95 duration-700" />
                        <div className="absolute top-4 right-4 z-20">
                             <div className="bg-pink-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg font-mono tracking-widest animate-in slide-in-from-right-2">RENDERED</div>
                        </div>
                    </div>
                    ) : (
                    <div className="text-center text-slate-700 flex flex-col items-center gap-4 opacity-40">
                        <div className="p-6 bg-white/5 rounded-full border border-white/5">
                            <ImageIcon className="w-12 h-12" />
                        </div>
                        <p className="font-mono text-xs uppercase tracking-[0.2em] font-medium">Awaiting Output Data</p>
                    </div>
                    )}
                </div>
              </div>

              {currentState.imageData && !processing && historyIndex > 0 && !currentState.code && (
                <div className="flex gap-4 animate-in slide-in-from-bottom-4">
                    <a 
                        href={`data:image/png;base64,${currentState.imageData}`}
                        download="flash-n-frame-style-transfer.png"
                        className="flex-1 glass-panel py-4 text-white hover:bg-white/10 rounded-2xl font-bold text-center transition-all flex items-center justify-center gap-2 font-mono text-sm border border-white/10"
                    >
                        <Download className="w-4 h-4" /> DOWNLOAD_PNG
                    </a>
                    <button 
                        onClick={() => { 
                            setHistory([{ imageData: currentState.imageData, code: null }]);
                            setHistoryIndex(0);
                        }}
                        className="px-6 glass-panel py-4 text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl font-bold transition-all font-mono text-sm border border-white/10"
                        title="Use as source for next edit"
                    >
                        REFINE
                    </button>
                </div>
              )}
            </>
          )}

          {/* Component Library Output */}
          {mode === 'components' && (
            <div className="glass-panel rounded-3xl overflow-hidden">
              {processing ? (
                <div className="aspect-[4/3] flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto" />
                    <p className="text-emerald-300 font-mono text-xs animate-pulse">Scanning UI Components...</p>
                  </div>
                </div>
              ) : componentLibrary ? (
                <div className="max-h-[600px] overflow-y-auto">
                  <div className="p-4 bg-emerald-500/10 border-b border-emerald-500/20">
                    <h3 className="text-emerald-300 font-bold flex items-center gap-2">
                      <LayoutGrid className="w-4 h-4" /> Component Library
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{componentLibrary.summary}</p>
                  </div>
                  
                  {/* Design Tokens */}
                  <div className="p-4 border-b border-white/5">
                    <h4 className="text-xs text-slate-400 font-mono uppercase mb-3">Design Tokens</h4>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {componentLibrary.designTokens.colors.map((c, i) => (
                          <span key={i} className="px-2 py-1 text-[10px] bg-slate-800 rounded text-slate-300 font-mono">{c}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Components */}
                  <div className="divide-y divide-white/5">
                    {componentLibrary.components.map((comp, idx) => (
                      <div key={idx} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-emerald-300 font-bold">{comp.name}</span>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono">{comp.category}</span>
                        </div>
                        <p className="text-xs text-slate-400 mb-2">{comp.description}</p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {comp.props.map((p, i) => (
                            <span key={i} className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">{p}</span>
                          ))}
                        </div>
                        <div className="relative">
                          <pre className="text-[10px] bg-slate-950 p-3 rounded-lg overflow-x-auto text-slate-300 font-mono max-h-32 overflow-y-auto">{comp.code}</pre>
                          <button onClick={() => navigator.clipboard.writeText(comp.code)} className="absolute top-2 right-2 p-1 bg-white/10 rounded hover:bg-white/20">
                            <Copy className="w-3 h-3 text-slate-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="aspect-[4/3] flex items-center justify-center text-slate-600">
                  <div className="text-center">
                    <LayoutGrid className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-mono text-xs">Upload image & click SCAN</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Responsive Variants Output */}
          {mode === 'responsive' && (
            <div className="glass-panel rounded-3xl overflow-hidden">
              {processing ? (
                <div className="aspect-[4/3] flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-cyan-500 mx-auto" />
                    <p className="text-cyan-300 font-mono text-xs animate-pulse">Generating Responsive Variants...</p>
                  </div>
                </div>
              ) : responsiveVariants ? (
                <div className="max-h-[600px] overflow-y-auto">
                  <div className="p-4 bg-cyan-500/10 border-b border-cyan-500/20">
                    <h3 className="text-cyan-300 font-bold flex items-center gap-2">
                      <Smartphone className="w-4 h-4" /> Responsive Variants
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{responsiveVariants.responsiveNotes}</p>
                  </div>
                  
                  <div className="p-4 border-b border-white/5">
                    <h4 className="text-xs text-slate-400 font-mono uppercase mb-2">Shared Styles</h4>
                    <code className="text-[10px] text-cyan-300 bg-slate-800 px-2 py-1 rounded">{responsiveVariants.sharedStyles}</code>
                  </div>

                  <div className="divide-y divide-white/5">
                    {responsiveVariants.variants.map((variant, idx) => (
                      <div key={idx} className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-bold uppercase ${
                            variant.breakpoint === 'mobile' ? 'text-green-400' : 
                            variant.breakpoint === 'tablet' ? 'text-yellow-400' : 'text-blue-400'
                          }`}>
                            {variant.breakpoint === 'mobile' ? '📱' : variant.breakpoint === 'tablet' ? '📱' : '🖥️'} {variant.breakpoint}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mb-2">{variant.description}</p>
                        <p className="text-[10px] text-cyan-400 mb-2">{variant.notes}</p>
                        <div className="relative">
                          <pre className="text-[10px] bg-slate-950 p-3 rounded-lg overflow-x-auto text-slate-300 font-mono max-h-40 overflow-y-auto">{variant.code}</pre>
                          <button onClick={() => navigator.clipboard.writeText(variant.code)} className="absolute top-2 right-2 p-1 bg-white/10 rounded hover:bg-white/20">
                            <Copy className="w-3 h-3 text-slate-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="aspect-[4/3] flex items-center justify-center text-slate-600">
                  <div className="text-center">
                    <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-mono text-xs">Upload image & click GENERATE</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dashboard Generator Output */}
          {mode === 'dashboard' && (
            <div className="glass-panel rounded-3xl overflow-hidden">
              {processing ? (
                <div className="aspect-[4/3] flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-amber-500 mx-auto" />
                    <p className="text-amber-300 font-mono text-xs animate-pulse">Generating Dashboard Project...</p>
                  </div>
                </div>
              ) : dashboardResult ? (
                <div className="max-h-[600px] overflow-y-auto">
                  <div className="p-4 bg-amber-500/10 border-b border-amber-500/20">
                    <h3 className="text-amber-300 font-bold flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" /> {dashboardResult.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{dashboardResult.description}</p>
                  </div>
                  
                  <div className="p-4 border-b border-white/5">
                    <h4 className="text-xs text-slate-400 font-mono uppercase mb-2">Features</h4>
                    <div className="flex flex-wrap gap-2">
                      {dashboardResult.features.map((f, i) => (
                        <span key={i} className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">{f}</span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 border-b border-white/5">
                    <h4 className="text-xs text-slate-400 font-mono uppercase mb-2">Dependencies</h4>
                    <code className="text-[10px] text-slate-300">{dashboardResult.dependencies.join(', ')}</code>
                  </div>

                  <div className="divide-y divide-white/5">
                    {dashboardResult.files.map((file, idx) => (
                      <div key={idx} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-amber-300 font-mono text-sm flex items-center gap-2">
                            {file.type === 'component' ? <FileCode className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                            {file.filename}
                          </span>
                          <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded">{file.type}</span>
                        </div>
                        <p className="text-xs text-slate-400 mb-2">{file.description}</p>
                        <div className="relative">
                          <pre className="text-[10px] bg-slate-950 p-3 rounded-lg overflow-x-auto text-slate-300 font-mono max-h-40 overflow-y-auto">{file.content}</pre>
                          <button onClick={() => navigator.clipboard.writeText(file.content)} className="absolute top-2 right-2 p-1 bg-white/10 rounded hover:bg-white/20">
                            <Copy className="w-3 h-3 text-slate-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 border-t border-white/5">
                    <h4 className="text-xs text-slate-400 font-mono uppercase mb-2">Documentation</h4>
                    <pre className="text-[10px] bg-slate-950 p-3 rounded-lg text-slate-300 font-mono whitespace-pre-wrap">{dashboardResult.documentation}</pre>
                  </div>
                </div>
              ) : (
                <div className="aspect-[4/3] flex items-center justify-center text-slate-600">
                  <div className="text-center">
                    <LayoutDashboard className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-mono text-xs">Upload image & click GENERATE</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
