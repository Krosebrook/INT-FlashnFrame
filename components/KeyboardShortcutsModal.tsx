
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  onClose: () => void;
}

const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ onClose }) => {
  const shortcuts = [
    { keys: ['Alt', '1'], desc: 'Go to Home' },
    { keys: ['Alt', '2'], desc: 'Open GitFlow (Repo Analyzer)' },
    { keys: ['Alt', '3'], desc: 'Open SiteSketch (Article Infographic)' },
    { keys: ['Alt', '4'], desc: 'Open Reality Engine (Style Transfer)' },
    { keys: ['Alt', '5'], desc: 'Open DevStudio (Code Explorer)' },
    { keys: ['Enter'], desc: 'Trigger analysis/generation in forms' },
    { keys: ['Ctrl', 'Enter'], desc: 'Execute render in Reality Engine' },
    { keys: ['Esc'], desc: 'Close modals and image viewer' },
    { keys: ['Shift', '?'], desc: 'Show this help menu' },
  ];

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg glass-panel rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 bg-slate-900/50 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Keyboard className="w-5 h-5 text-violet-400" />
                <h2 className="text-white font-bold font-mono text-sm uppercase tracking-widest">Keyboard_Shortcuts</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
            </button>
        </div>
        <div className="p-6 space-y-4">
            {shortcuts.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between group">
                    <span className="text-slate-400 text-sm font-sans">{s.desc}</span>
                    <div className="flex gap-1.5">
                        {s.keys.map((key, kIdx) => (
                            <kbd key={kIdx} className="px-2 py-1 bg-slate-900 border border-white/10 rounded-lg text-xs font-mono text-violet-300 shadow-lg min-w-[32px] text-center">
                                {key}
                            </kbd>
                        ))}
                    </div>
                </div>
            ))}
        </div>
        <div className="px-6 py-4 bg-white/5 border-t border-white/5">
            <p className="text-[10px] text-slate-500 font-mono text-center uppercase tracking-[0.2em]">Efficiency is the soul of performance.</p>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;
