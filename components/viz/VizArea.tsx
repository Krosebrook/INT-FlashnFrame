
import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { VizTooltip } from './VizTooltip';

interface VizAreaProps {
  data: any[];
  onDrill: (value: string) => void;
  currentLevel: string;
  drillPath: string[];
  canDrill: boolean;
  metric?: string;
}

export const VizArea: React.FC<VizAreaProps> = ({ data, onDrill, currentLevel, drillPath, canDrill, metric = 'sales' }) => {
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());

  const handleLegendClick = (o: any) => {
    const { dataKey } = o;
    setHiddenSeries(prev => {
      const next = new Set(prev);
      if (next.has(dataKey)) next.delete(dataKey);
      else next.add(dataKey);
      return next;
    });
  };

  const handleClick = (state: any) => {
    if (state && state.activeLabel) {
      onDrill(String(state.activeLabel));
    } else if (state && state.activePayload && state.activePayload[0]) {
      const val = state.activePayload[0].payload[currentLevel];
      if (val) onDrill(String(val));
    }
  };

  const commonAxisProps = {
    axisLine: false,
    tickLine: false,
    tick: { fontSize: 10, fill: '#94a3b8', fontWeight: 600 }
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} onClick={handleClick} cursor="pointer">
        <defs>
          <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
        <XAxis dataKey={currentLevel} {...commonAxisProps} />
        <YAxis {...commonAxisProps} />
        <Tooltip 
          content={<VizTooltip currentLevel={currentLevel} drillPath={drillPath} canDrill={canDrill} />}
          cursor={{ fill: '#a855f7', opacity: 0.1 }}
          allowEscapeViewBox={{ x: true, y: true }}
          wrapperStyle={{ zIndex: 50, outline: 'none' }}
        />
        <Legend 
          onClick={handleLegendClick}
          wrapperStyle={{ paddingTop: '10px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', cursor: 'pointer', color: '#cbd5e1' }}
        />
        {!hiddenSeries.has(metric) && (
          <Area type="monotone" name={metric} dataKey={metric} stroke="#a855f7" fillOpacity={1} fill="url(#colorMetric)" strokeWidth={3} className="filter drop-shadow-[0_0_6px_rgba(168,85,247,0.5)]" />
        )}
        {/* Support legacy 'users' series if default sales is used */}
        {metric === 'sales' && !hiddenSeries.has('users') && (
          <Area type="monotone" name="users" dataKey="users" stroke="#ec4899" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={3} className="filter drop-shadow-[0_0_6px_rgba(236,72,153,0.5)]" />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
};
