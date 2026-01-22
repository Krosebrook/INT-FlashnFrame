
import React from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';

interface VizTreemapProps {
  data: any[];
}

const CustomizedContent = (props: any) => {
  const { x, y, width, height, index, colors, name, size } = props;

  // Don't render tiny rectangles' text to keep it clean
  const showText = width > 50 && height > 30;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: colors[index % colors.length],
          stroke: '#1e293b',
          strokeWidth: 2,
          transition: 'all 0.3s ease'
        }}
        className="hover:brightness-110 cursor-default"
      />
      {showText && (
        <>
          <text
            x={x + 8}
            y={y + 18}
            fill="#fff"
            fontSize={11}
            fontWeight="900"
            className="uppercase tracking-tighter pointer-events-none opacity-80"
          >
            {name}
          </text>
          <text
            x={x + 8}
            y={y + 32}
            fill="#fff"
            fontSize={10}
            fontWeight="bold"
            className="pointer-events-none opacity-60"
          >
             {new Intl.NumberFormat('en-US', { notation: 'compact' }).format(size)}
          </text>
        </>
      )}
    </g>
  );
};

export const VizTreemap: React.FC<VizTreemapProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <Treemap
        data={data}
        dataKey="size"
        aspectRatio={4 / 3}
        stroke="#fff"
        fill="#8884d8"
        content={<CustomizedContent colors={['#8b5cf6', '#ec4899', '#a855f7', '#d946ef', '#6366f1', '#06b6d4']} />}
      >
        <Tooltip 
          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
          itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
        />
      </Treemap>
    </ResponsiveContainer>
  );
};
