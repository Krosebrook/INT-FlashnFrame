
import React from 'react';

interface VizKPIProps {
  title: string;
  value: string;
  trend: string;
  isPositive: boolean;
}

export const VizKPI: React.FC<VizKPIProps> = ({ title, value, trend, isPositive }) => (
  <div className="h-full flex flex-col justify-center">
    <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">{title}</div>
    <div className="mt-2 flex items-baseline gap-2">
      <span className="text-3xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{value}</span>
      <span className={`text-sm font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
        {trend}
      </span>
    </div>
    <div className="mt-4 h-1 w-full bg-white/10 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_currentColor] ${isPositive ? 'bg-emerald-400 text-emerald-400' : 'bg-rose-400 text-rose-400'}`} style={{ width: '70%' }}></div>
    </div>
  </div>
);
