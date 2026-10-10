import React from 'react';
import {
  Home,
  CheckSquare,
  Sliders,
  Building2,
  FileText,
  History,
  Info,
  Leaf,
  Moon,
  Sun,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isDark,
  onToggleTheme,
}) => {
  const navItems = [
    { id: 'about', label: 'About & Overview', icon: Info, group: 'Workspace' },
    { id: 'my-home', label: 'My Home', icon: Home, group: 'Workspace' },
    { id: 'plan', label: 'Retrofit Plan', icon: CheckSquare, group: 'Workspace' },
    { id: 'whatif', label: 'What-If Scenarios', icon: Sliders, group: 'Workspace' },
    { id: 'portfolio', label: 'Portfolio Analytics', icon: Building2, group: 'Workspace' },
    { id: 'memory', label: 'Customer Memory', icon: History, group: 'Reference' },
    { id: 'assumptions', label: 'Assumptions & Data', icon: FileText, group: 'Reference' },
  ];

  return (
    <aside className="w-64 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 overflow-y-auto select-none transition-colors duration-200 z-20">
      <div className="p-4">
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white shadow-xs shadow-emerald-500/20">
              <Leaf className="w-5 h-5 fill-white/20" />
            </div>
            <div>
              <div className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
                greenhome<span className="text-emerald-500">.</span>
              </div>
              <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                Retrofit Engine
              </div>
            </div>
          </div>
        </div>

        {/* Theme Toggle Pill */}
        <div className="mt-3.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl flex items-center justify-between">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 pl-2 flex items-center gap-1.5">
            {isDark ? <Moon className="w-3.5 h-3.5 text-emerald-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
            {isDark ? 'Dark Theme' : 'Light Theme'}
          </span>
          <button
            onClick={onToggleTheme}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all cursor-pointer"
          >
            Switch
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="mt-6 space-y-6">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2">
              Workspace
            </div>
            <nav className="space-y-1">
              {navItems
                .filter((item) => item.group === 'Workspace')
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-l-4 border-emerald-500 font-bold shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
            </nav>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2">
              Reference & Audit
            </div>
            <nav className="space-y-1">
              {navItems
                .filter((item) => item.group === 'Reference')
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-l-4 border-emerald-500 font-bold shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
            </nav>
          </div>
        </div>
      </div>

      {/* Footer Branding Badge */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Lloyds Hackathon PS2</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
            Enterprise Green Home Score & Retrofit Decision Engine.
          </div>
        </div>
      </div>
    </aside>
  );
};
