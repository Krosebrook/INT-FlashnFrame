
import React, { useRef } from 'react';
import { Icons } from '../constants';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: 'dashboard' | 'catalog' | 'model' | 'trust') => void;
  isSidebarOpen: boolean;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  toggleSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  isSidebarOpen, 
  onImport, 
  onExport,
  toggleSidebar
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const NavItem = ({ id, icon: Icon, label }: { id: any, icon: any, label: string }) => (
    <button 
      onClick={() => setActiveTab(id)} 
      className={`w-full flex items-center justify-center lg:justify-start gap-4 p-3 rounded-2xl text-sm font-bold transition-all border ${activeTab === id ? 'bg-fuchsia-600 text-white border-fuchsia-500 shadow-lg shadow-fuchsia-500/20' : 'border-transparent text-slate-600 hover:bg-white/5 hover:text-slate-300'}`}
      title={label}
    >
      <Icon /> 
      {isSidebarOpen && <span className="hidden lg:block uppercase tracking-widest text-[10px] font-black">{label}</span>}
    </button>
  );

  return (
    <aside className={`glass-panel border-r border-white/5 flex flex-col transition-all duration-500 z-50 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
      <div className="h-16 flex items-center justify-center lg:px-6 mb-8 border-b border-white/5">
        <button onClick={toggleSidebar} className="p-2 hover:bg-white/10 rounded-xl text-fuchsia-500 transition-all">
            <svg className="w-6 h-6" viewBox="0 0 100 100" fill="none">
                <path d="M20 80C20 80 35 70 35 50C35 30 60 10 85 10" stroke="currentColor" strokeWidth="12" strokeLinecap="round"/>
                <path d="M35 50H70" stroke="currentColor" strokeWidth="12" strokeLinecap="round"/>
            </svg>
        </button>
      </div>
      
      <nav className="flex-1 px-3 space-y-3">
        <NavItem id="dashboard" icon={Icons.Dashboard} label="Home" />
        <NavItem id="catalog" icon={Icons.Templates} label="Blueprints" />
        <NavItem id="model" icon={Icons.Model} label="Logic" />
        <NavItem id="trust" icon={Icons.Shield} label="Security" />
      </nav>

      <div className="p-3 border-t border-white/5 space-y-3 mb-4">
        <input type="file" ref={fileInputRef} onChange={onImport} className="hidden" accept=".csv,.json" />
        
        <button 
          onClick={() => fileInputRef.current?.click()} 
          className="w-full flex items-center justify-center p-3 rounded-2xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          title="Import Data"
        >
          <Icons.Upload />
        </button>
        
        <button 
          onClick={onExport} 
          className="w-full flex items-center justify-center p-3 rounded-2xl border border-white/5 text-slate-600 hover:text-white transition-all"
          title="Export HTML"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
        </button>
      </div>
    </aside>
  );
};
