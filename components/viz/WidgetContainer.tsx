
import React, { useState, useMemo, useRef } from 'react';
import { WidgetConfig, EditMode, VizType, GRID_SYSTEM } from '../types';
import { ChartRenderer } from './ChartRenderer';
import { Icons } from '../constants';

const DRILL_HIERARCHY = ['region', 'category', 'date'];

interface WidgetContainerProps {
  widget: WidgetConfig;
  mode: EditMode;
  data: any[];
  onAnalyze: (widget: WidgetConfig, currentData: any[]) => void;
  onResize: (id: string, w: number, h: number) => void;
  onMove: (id: string, x: number, y: number) => void;
  onUpdate: (id: string, updates: Partial<WidgetConfig>) => void;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({ widget, mode, data, onAnalyze, onResize, onMove, onUpdate }) => {
  const [drillPath, setDrillPath] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const currentLevelIndex = Math.min(drillPath.length, DRILL_HIERARCHY.length - 1);
  const currentLevel = DRILL_HIERARCHY[currentLevelIndex];
  const canDrill = drillPath.length < DRILL_HIERARCHY.length;

  const dataKeys = useMemo(() => data.length > 0 ? Object.keys(data[0]) : [], [data]);

  const filteredData = useMemo(() => {
    let result = data;
    drillPath.forEach((val, idx) => {
      const dim = DRILL_HIERARCHY[idx];
      result = result.filter(item => String(item[dim]) === val);
    });
    return result;
  }, [data, drillPath]);

  const handleDrill = (val: string) => {
    if (drillPath.length < DRILL_HIERARCHY.length) {
      setDrillPath([...drillPath, val]);
    }
  };

  const calculateGridCoords = (clientX: number, clientY: number, parent: HTMLElement) => {
    const rect = parent.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;

    const colWidth = (rect.width - (GRID_SYSTEM.COLS - 1) * GRID_SYSTEM.GAP_PX) / GRID_SYSTEM.COLS;
    const cellWidth = colWidth + GRID_SYSTEM.GAP_PX;
    const cellHeight = GRID_SYSTEM.ROW_HEIGHT_PX + GRID_SYSTEM.GAP_PX;

    return {
      x: Math.round(relativeX / cellWidth),
      y: Math.round(relativeY / cellHeight)
    };
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    if (mode !== EditMode.PRO) return;
    e.preventDefault(); e.stopPropagation();
    setIsResizing(true);
    
    const parent = containerRef.current?.offsetParent as HTMLElement;
    if (!parent) return;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const coords = calculateGridCoords(moveEvent.clientX, moveEvent.clientY, parent);
      const newW = Math.max(2, coords.x - widget.x);
      const newH = Math.max(1, coords.y - widget.y);
      if (newW !== widget.w || newH !== widget.h) {
        onResize(widget.id, newW, newH);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleDragStart = (e: React.MouseEvent) => {
    if (mode !== EditMode.PRO) return;
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('select')) return;
    
    e.preventDefault();
    setIsDragging(true);

    const parent = containerRef.current?.offsetParent as HTMLElement;
    if (!parent) return;

    // Capture offset so drag doesn't jump to top-left
    const rect = containerRef.current!.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const coords = calculateGridCoords(moveEvent.clientX - offsetX, moveEvent.clientY - offsetY, parent);
      if (coords.x !== widget.x || coords.y !== widget.y) {
        onMove(widget.id, coords.x, coords.y);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div 
      ref={containerRef}
      className={`glass-panel rounded-[2rem] flex flex-col transition-all duration-75 relative group/widget backdrop-blur-md border border-white/5 
        ${isResizing || isDragging ? 'z-50 border-fuchsia-500 shadow-2xl scale-[1.01]' : 'hover:border-white/20 shadow-lg'}
        ${mode === EditMode.PRO ? 'cursor-grab active:cursor-grabbing border-white/10 ring-1 ring-white/5' : ''}
      `}
      style={{ 
        gridColumn: `span ${widget.w}`, 
        gridRow: `span ${widget.h}`,
        gridColumnStart: widget.x + 1,
        gridRowStart: widget.y + 1,
        userSelect: isResizing || isDragging ? 'none' : 'auto'
      }}
      onMouseDown={handleDragStart}
    >
      <div className="px-6 py-4 flex items-center justify-between pointer-events-none">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{widget.type}</span>
          <span className="text-sm font-black text-white tracking-tight uppercase">{widget.title}</span>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover/widget:opacity-100 transition-all duration-300 transform translate-y-1 group-hover/widget:translate-y-0 pointer-events-auto">
          <button
             onClick={(e) => { e.stopPropagation(); onAnalyze(widget, filteredData); }}
             className="p-2 hover:bg-fuchsia-500/10 rounded-xl text-fuchsia-400 transition-colors"
          >
            <Icons.Sparkles />
          </button>
          {mode === EditMode.PRO && (
             <button 
                onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
                className="p-2 hover:bg-white/10 rounded-xl text-slate-500 transition-colors"
             >
                <Icons.Settings />
             </button>
          )}
        </div>
      </div>

      <div className="flex-1 p-6 relative overflow-hidden" onMouseDown={(e) => e.stopPropagation()}>
        <ChartRenderer 
          config={widget} 
          data={filteredData} 
          onDrill={handleDrill} 
          currentLevel={currentLevel} 
          drillPath={drillPath} 
          canDrill={canDrill}
        />
      </div>

      {showSettings && (
        <div className="absolute inset-0 bg-slate-900/98 z-50 p-8 rounded-[2rem] animate-in fade-in zoom-in-95 duration-200" onMouseDown={e => e.stopPropagation()}>
           <div className="flex justify-between items-center mb-6">
              <h4 className="font-black text-white uppercase tracking-tighter">Widget Settings</h4>
              <button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-white"><Icons.Settings /></button>
           </div>
           <div className="space-y-4">
              <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-600 uppercase">Focus Dimension</label>
                 <select 
                    value={widget.dimension || ''}
                    onChange={(e) => onUpdate(widget.id, { dimension: e.target.value })}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-fuchsia-500 outline-none"
                 >
                    <option value="">Default</option>
                    {dataKeys.map(k => <option key={k} value={k}>{k}</option>)}
                 </select>
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-600 uppercase">Focus Metric</label>
                 <select 
                    value={widget.metric || ''}
                    onChange={(e) => onUpdate(widget.id, { metric: e.target.value })}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-fuchsia-500 outline-none"
                 >
                    <option value="">Default</option>
                    {dataKeys.map(k => <option key={k} value={k}>{k}</option>)}
                 </select>
              </div>
           </div>
        </div>
      )}

      {mode === EditMode.PRO && (
        <div 
          onMouseDown={handleResizeStart}
          className="absolute bottom-2 right-2 w-8 h-8 cursor-se-resize z-20 flex items-center justify-center text-fuchsia-500 opacity-20 hover:opacity-100 transition-opacity"
        >
          <svg className="w-5 h-5 transform rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 5v14m7-14v14" /></svg>
        </div>
      )}
    </div>
  );
};
