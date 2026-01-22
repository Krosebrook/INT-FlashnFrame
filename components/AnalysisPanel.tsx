
import React from 'react';
import { AnalysisResult, WidgetConfig } from '../types';
import { Icons } from '../constants';

interface AnalysisPanelProps {
  isOpen: boolean;
  onClose: () => void;
  widget: WidgetConfig | null;
  analysis: AnalysisResult | null;
  isLoading: boolean;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ isOpen, onClose, widget, analysis, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 glass-panel border-l border-white/10 shadow-2xl z-[60] transform transition-transform duration-300 ease-in-out flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2">
          <div className="text-fuchsia-400"><Icons.Sparkles /></div>
          <h3 className="font-black text-white uppercase tracking-tight">Omni-Analyst</h3>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-3/4"></div>
            <div className="h-20 bg-white/10 rounded"></div>
            <div className="h-4 bg-white/10 rounded w-1/2"></div>
            <div className="h-32 bg-white/10 rounded"></div>
          </div>
        ) : analysis ? (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            
            <div className="bg-fuchsia-500/10 p-4 rounded-2xl border border-fuchsia-500/30">
              <span className="text-[10px] font-black text-fuchsia-400 uppercase tracking-widest block mb-2">Context</span>
              <h4 className="font-bold text-white text-lg leading-tight">{widget?.title}</h4>
            </div>

            <section>
              <h5 className="flex items-center gap-2 font-black text-slate-300 uppercase tracking-widest text-xs mb-3">
                <span className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${analysis.sentiment === 'positive' ? 'bg-emerald-500 text-emerald-500' : analysis.sentiment === 'negative' ? 'bg-rose-500 text-rose-500' : 'bg-amber-500 text-amber-500'}`}></span>
                Executive Summary
              </h5>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                {analysis.summary}
              </p>
            </section>

            {analysis.marketContext && (
              <section className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 p-4 rounded-2xl border border-indigo-500/20">
                <div className="flex items-center gap-2 mb-2">
                   <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                   </svg>
                   <h5 className="font-black text-indigo-300 uppercase tracking-widest text-[10px]">Live Market Pulse</h5>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed italic">
                  "{analysis.marketContext}"
                </p>
              </section>
            )}

            <section>
              <h5 className="font-black text-slate-500 uppercase tracking-widest text-[10px] mb-3">Key Drivers</h5>
              <ul className="space-y-3">
                {analysis.drivers.map((driver, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-300">
                    <span className="text-fuchsia-500 font-bold">•</span>
                    {driver}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h5 className="font-black text-slate-500 uppercase tracking-widest text-[10px] mb-3">Strategic Actions</h5>
              <div className="space-y-3">
                {analysis.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/10 hover:border-white/20 transition-colors">
                    <div className="mt-0.5 text-emerald-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-sm text-slate-300 font-medium">{rec}</span>
                  </div>
                ))}
              </div>
            </section>

            {analysis.sources && analysis.sources.length > 0 && (
              <section className="pt-4 border-t border-white/10">
                <h5 className="font-black text-slate-600 uppercase tracking-widest text-[9px] mb-3">Verified Sources</h5>
                <div className="flex flex-wrap gap-2">
                  {analysis.sources.map((source, i) => (
                    <a 
                      key={i} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors group"
                    >
                      <svg className="w-3 h-3 text-slate-500 group-hover:text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-white truncate max-w-[150px]">{source.title}</span>
                    </a>
                  ))}
                </div>
              </section>
            )}

          </div>
        ) : (
          <div className="text-center text-slate-500 py-10">
            <p>Select a chart to generate insights.</p>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-white/10 bg-white/5 text-[10px] text-slate-500 text-center">
        Powered by Google Gemini 3 Flash
      </div>
    </div>
  );
};
