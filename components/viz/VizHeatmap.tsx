
import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ZAxis } from 'recharts';

interface VizHeatmapProps {
  data: any[];
  xKey: string;
  yKey: string;
  valKey: string;
}

export const VizHeatmap: React.FC<VizHeatmapProps> = ({ data, xKey, yKey, valKey }) => {
  const maxVal = Math.max(...data.map(d => d[valKey] || 0), 1);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 20, right: 10, bottom: 20, left: 10 }}>
        <XAxis 
            dataKey={xKey} 
            type="category" 
            name={xKey} 
            tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} 
            tickLine={false}
            axisLine={false}
            interval={0}
        />
        <YAxis 
            dataKey={yKey} 
            type="category" 
            name={yKey} 
            tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} 
            tickLine={false}
            axisLine={false}
        />
        <ZAxis type="number" dataKey={valKey} range={[400, 400]} />
        <Tooltip 
            cursor={{ strokeDasharray: '3 3', stroke: '#334155' }} 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
            itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
        />
        <Scatter data={data} shape="square">
          {data.map((entry, index) => {
            const ratio = entry[valKey] / maxVal;
            const opacity = 0.2 + (0.8 * ratio);
            // Dynamic color based on value intensity
            return (
              <Cell 
                key={`cell-${index}`} 
                fill={`rgba(168, 85, 247, ${opacity})`} 
                stroke="#a855f7" 
                strokeWidth={1} 
                strokeOpacity={0.4}
              />
            );
          })}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
};
