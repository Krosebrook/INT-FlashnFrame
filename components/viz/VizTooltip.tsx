
import React from 'react';
import { TooltipProps } from 'recharts';

interface CustomTooltipProps extends TooltipProps<number, string> {
  currentLevel: string;
  drillPath: string[];
  canDrill: boolean;
}

export const VizTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, currentLevel, drillPath, canDrill }) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((acc, entry) => acc + (typeof entry.value === 'number' ? entry.value : 0), 0);

    return (
      <div className="bg-slate-900/90 backdrop-blur-xl p-5 rounded-2xl shadow-2xl border border-white/20 min-w-[260px] animate-in fade-in zoom-in-95 duration-200 z-50">
        {/* Header */}
        <div className="flex flex-col gap-1.5 mb-4 pb-3 border-b border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {currentLevel}
            </span>
             {canDrill && (
                <span className="flex items-center gap-1 text-[9px] font-black text-fuchsia-400 uppercase tracking-wider bg-fuchsia-500/10 px-2 py-0.5 rounded-full border border-fuchsia-500/20">
                  Drill Down →
                </span>
             )}
          </div>
          <span className="text-xl font-black text-white tracking-tight leading-none">{label}</span>
        </div>
        
        {/* Metrics */}
        <div className="space-y-3">
          {payload.map((entry, index) => {
            const val = Number(entry.value);
            const percent = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
            const isSales = entry.name.toLowerCase().includes('sales') || entry.name.toLowerCase().includes('revenue');
            
            return (
              <div key={index} className="group/item">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full ring-2 ring-slate-900 shadow-sm transition-transform group-hover/item:scale-125" style={{ backgroundColor: entry.color }}></div>
                    <span className="text-xs font-bold text-slate-400 capitalize group-hover/item:text-white transition-colors">{entry.name}</span>
                  </div>
                  <span className="text-sm font-black text-white font-mono tracking-tight">
                    {isSales 
                      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
                      : new Intl.NumberFormat('en-US').format(val)
                    }
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="flex items-center gap-3">
                   <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                     <div 
                       className="h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_currentColor]" 
                       style={{ width: `${percent}%`, backgroundColor: entry.color, color: entry.color }} 
                     />
                   </div>
                   <span className="text-[10px] font-semibold text-slate-500 w-9 text-right">{percent}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Footer */}
        {payload.length > 1 && (
            <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Volume</span>
                <span className="text-base font-black text-white font-mono">
                  {new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(total)}
                </span>
            </div>
        )}

        {/* Filters Context */}
        {drillPath.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/10">
            <span className="text-[9px] font-bold text-fuchsia-400 uppercase tracking-widest mb-2 block">
              Applied Filters
            </span>
            <div className="flex flex-wrap gap-1.5">
              {drillPath.map((filter, i) => (
                <span key={i} className="px-2 py-1 bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20 rounded-lg text-[9px] font-bold shadow-sm">
                  {filter}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
};
