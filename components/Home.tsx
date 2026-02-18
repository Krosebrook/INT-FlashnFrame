/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { ViewMode } from '../types';
import { GitBranch, FileText, Link, BrainCircuit, Image, Sparkles, ArrowRight, Wand2, Code2 } from 'lucide-react';

interface HomeProps {
  onNavigate: (mode: ViewMode) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-20 mb-20">
      {/* Hero Section */}
      <div className="text-center space-y-6 pt-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-mono text-slate-300 mb-2">
            <Sparkles className="w-4 h-4 text-fuchsia-400" />
            <span>Flash-n-Frame</span>
        </div>
        
        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 font-sans leading-tight">
          Flash-n-Frame
        </h1>
        
        <p className="text-slate-400 text-xl font-light max-w-2xl mx-auto leading-relaxed">
          Turn links into clear, professional infographics instantly.
        </p>

        {/* Vertical Action Stack */}
        <div className="flex flex-col items-center gap-6 pt-8 w-full max-w-[480px] mx-auto">
            
            {/* GitHub Option */}
            <div className="w-full flex items-center gap-4 group relative">
                <div className="hidden md:flex flex-col items-end w-40 shrink-0 absolute -left-44 top-1/2 -translate-y-1/2">
                    <span className="text-xs font-mono text-violet-400 uppercase tracking-wider mb-1 text-right">GitHub Repo Here</span>
                    <ArrowRight className="w-5 h-5 text-violet-500" />
                </div>
                
                <button 
                    onClick={() => onNavigate(ViewMode.REPO_ANALYZER)}
                    className="w-full glass-panel p-5 rounded-2xl hover:bg-white/10 transition-all border border-white/5 hover:border-violet-500/50 text-left group-hover:translate-x-1 group-hover:shadow-neon-violet relative overflow-hidden"
                >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-24 h-24 opacity-20 group-hover:opacity-60 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                        <img src="/images/icon-cloud.png" alt="" className="w-full h-full object-contain drop-shadow-lg" />
                    </div>
                    <div className="flex items-center gap-5 relative z-10">
                        <div className="p-3.5 bg-violet-500/20 rounded-xl text-violet-300 border border-violet-500/20 group-hover:bg-violet-500 group-hover:text-white transition-colors">
                            <GitBranch className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white group-hover:text-violet-200 transition-colors">GitHub Repo</h3>
                            <p className="text-xs text-slate-400 font-mono mt-1 group-hover:text-slate-300">Data Flow Diagram</p>
                        </div>
                    </div>
                </button>
            </div>

            {/* Web Article Option */}
            <div className="w-full flex items-center gap-4 group relative">
                 <div className="hidden md:flex flex-col items-end w-40 shrink-0 absolute -left-44 top-1/2 -translate-y-1/2">
                    <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1 text-right">Any Other Link</span>
                    <ArrowRight className="w-5 h-5 text-emerald-500" />
                </div>

                <button 
                    onClick={() => onNavigate(ViewMode.ARTICLE_INFOGRAPHIC)}
                    className="w-full glass-panel p-5 rounded-2xl hover:bg-white/10 transition-all border border-white/5 hover:border-emerald-500/50 text-left group-hover:translate-x-1 group-hover:shadow-neon-emerald relative overflow-hidden"
                >
                     <div className="absolute right-0 top-1/2 -translate-y-1/2 w-24 h-24 opacity-20 group-hover:opacity-60 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6">
                        <img src="/images/icon-analytics.png" alt="" className="w-full h-full object-contain drop-shadow-lg" />
                    </div>
                    <div className="flex items-center gap-5 relative z-10">
                        <div className="p-3.5 bg-emerald-500/20 rounded-xl text-emerald-300 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white group-hover:text-emerald-200 transition-colors">Web Article</h3>
                            <p className="text-xs text-slate-400 font-mono mt-1 group-hover:text-slate-300">Summary Infographic</p>
                        </div>
                    </div>
                </button>
            </div>

            {/* Reality Engine Option */}
            <div className="w-full flex items-center gap-4 group relative">
                 <div className="hidden md:flex flex-col items-end w-40 shrink-0 absolute -left-44 top-1/2 -translate-y-1/2">
                    <span className="text-xs font-mono text-pink-400 uppercase tracking-wider mb-1 text-right">Style Transfer</span>
                    <ArrowRight className="w-5 h-5 text-pink-500" />
                </div>

                <button 
                    onClick={() => onNavigate(ViewMode.IMAGE_EDITOR)}
                    className="w-full glass-panel p-5 rounded-2xl hover:bg-white/10 transition-all border border-white/5 hover:border-pink-500/50 text-left group-hover:translate-x-1 group-hover:shadow-neon-violet relative overflow-hidden"
                >
                     <div className="absolute right-0 top-1/2 -translate-y-1/2 w-24 h-24 opacity-20 group-hover:opacity-60 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                        <img src="/images/icon-creative.png" alt="" className="w-full h-full object-contain drop-shadow-lg" />
                    </div>
                    <div className="flex items-center gap-5 relative z-10">
                        <div className="p-3.5 bg-pink-500/20 rounded-xl text-pink-300 border border-pink-500/20 group-hover:bg-pink-500 group-hover:text-white transition-colors">
                            <Wand2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white group-hover:text-pink-200 transition-colors">Reality Engine</h3>
                            <p className="text-xs text-slate-400 font-mono mt-1 group-hover:text-slate-300">Style Transfer & UI to Code</p>
                        </div>
                    </div>
                </button>
            </div>

            {/* DevStudio Option */}
            <div className="w-full flex items-center gap-4 group relative">
                 <div className="hidden md:flex flex-col items-end w-40 shrink-0 absolute -left-44 top-1/2 -translate-y-1/2">
                    <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1 text-right">Interactive</span>
                    <ArrowRight className="w-5 h-5 text-cyan-500" />
                </div>

                <button 
                    onClick={() => onNavigate(ViewMode.DEV_STUDIO)}
                    className="w-full glass-panel p-5 rounded-2xl hover:bg-white/10 transition-all border border-white/5 hover:border-cyan-500/50 text-left group-hover:translate-x-1 group-hover:shadow-neon-cyan relative overflow-hidden"
                >
                     <div className="absolute right-0 top-1/2 -translate-y-1/2 w-24 h-24 opacity-20 group-hover:opacity-60 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6">
                        <img src="/images/icon-projects.png" alt="" className="w-full h-full object-contain drop-shadow-lg" />
                    </div>
                    <div className="flex items-center gap-5 relative z-10">
                        <div className="p-3.5 bg-cyan-500/20 rounded-xl text-cyan-300 border border-cyan-500/20 group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                            <Code2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white group-hover:text-cyan-200 transition-colors">DevStudio</h3>
                            <p className="text-xs text-slate-400 font-mono mt-1 group-hover:text-slate-300">Interactive Code Explorer</p>
                        </div>
                    </div>
                </button>
            </div>
        </div>
      </div>

      {/* 3-Step Process Visualization (Simplified) */}
      <div className="relative pt-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 border-t border-white/5">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 relative pt-10">
             {/* Step 1 */}
             <div className="flex flex-col items-center text-center space-y-4 group">
                 <div className="w-12 h-12 rounded-xl bg-slate-900/50 border border-white/10 flex items-center justify-center shadow-glass-lg group-hover:border-violet-500/50 transition-colors">
                     <Link className="w-5 h-5 text-slate-300 group-hover:text-violet-300 transition-colors" />
                 </div>
                 <div>
                     <h3 className="text-white font-bold text-sm font-mono uppercase tracking-wider mb-1">
                        1. Paste Link
                     </h3>
                     <p className="text-slate-500 text-xs leading-relaxed max-w-[200px] mx-auto">
                        Use any public URL.
                     </p>
                 </div>
             </div>

             {/* Step 2 */}
             <div className="flex flex-col items-center text-center space-y-4 group">
                 <div className="w-12 h-12 rounded-xl bg-slate-900/50 border border-fuchsia-500/30 flex items-center justify-center shadow-neon-violet">
                     <BrainCircuit className="w-5 h-5 text-fuchsia-300" />
                 </div>
                 <div>
                     <h3 className="text-white font-bold text-sm font-mono uppercase tracking-wider mb-1">
                        2. Analyze
                     </h3>
                     <p className="text-slate-500 text-xs leading-relaxed max-w-[200px] mx-auto">
                        AI maps the structure.
                     </p>
                 </div>
             </div>

             {/* Step 3 */}
             <div className="flex flex-col items-center text-center space-y-4 group">
                 <div className="w-12 h-12 rounded-xl bg-slate-900/50 border border-white/10 flex items-center justify-center shadow-glass-lg group-hover:border-emerald-500/50 transition-colors">
                     <Image className="w-5 h-5 text-slate-300 group-hover:text-emerald-300 transition-colors" />
                 </div>
                 <div>
                     <h3 className="text-white font-bold text-sm font-mono uppercase tracking-wider mb-1">
                        3. Visualize
                     </h3>
                     <p className="text-slate-500 text-xs leading-relaxed max-w-[200px] mx-auto">
                        Download your blueprint.
                     </p>
                 </div>
             </div>
         </div>
      </div>
    </div>
  );
};

export default Home;
