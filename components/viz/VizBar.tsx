
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { VizTooltip } from './VizTooltip';

interface VizBarProps {
  data: any[];
  onDrill: (value: string) => void;
  currentLevel: string;
  drillPath: string[];
  canDrill: boolean;
  metric?: string;
}

export const VizBar: React.FC<VizBarProps> = ({ data, onDrill, currentLevel, drillPath, canDrill, metric = 'sales' }) => {
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
      <BarChart data={data} onClick={handleClick} style={{ cursor: "pointer" }}>
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
          <Bar name={metric} dataKey={metric} radius={[6, 6, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={`cell-${metric}-${index}`} fill={index % 2 === 0 ? '#a855f7' : '#8b5cf6'} className="hover:opacity-80 transition-opacity filter drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
            ))}
          </Bar>
        )}
        {/* Fallback/Secondary bar if metrics are strictly sales/users and not dynamic - optional, but good for templates */}
        {metric === 'sales' && !hiddenSeries.has('users') && (
           <Bar name="users" dataKey="users" radius={[6, 6, 0, 0]}>
             {data.map((_, index) => (
               <Cell key={`cell-users-${index}`} fill={index % 2 === 0 ? '#ec4899' : '#db2777'} className="hover:opacity-80 transition-opacity filter drop-shadow-[0_0_8px_rgba(236,72,153,0.4)]" />
             ))}
           </Bar>
        )}
      </BarChart>
    </ResponsiveContainer>
  );
};
