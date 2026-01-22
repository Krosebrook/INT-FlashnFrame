
import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface VizScatterProps {
  data: any[];
  xKey?: string;
  yKey?: string;
  zKey?: string; // Optional size/color
}

export const VizScatter: React.FC<VizScatterProps> = ({ data, xKey = 'sales', yKey = 'users', zKey = 'conversion' }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
        <XAxis 
          type="number" 
          dataKey={xKey} 
          name={xKey} 
          unit="" 
          stroke="#94a3b8" 
          tick={{ fontSize: 10 }} 
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          type="number" 
          dataKey={yKey} 
          name={yKey} 
          unit="" 
          stroke="#94a3b8" 
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip 
          cursor={{ strokeDasharray: '3 3' }} 
          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '12px' }}
        />
        <Scatter name="Correlation" data={data} fill="#8884d8">
          {data.map((entry, index) => (
             <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#a855f7' : '#ec4899'} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
};
