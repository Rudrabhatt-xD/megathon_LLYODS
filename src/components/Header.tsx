import React from 'react';
import { Sparkles, Building, ChevronRight, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  currentPage: string;
  propertyId: string;
  onSelectProperty: (id: string) => void;
  availableIds: string[];
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  propertyId,
  onSelectProperty,
  availableIds,
  isDark,
  onToggleTheme,
}) => {
  const pageTitles: Record<string, string> = {
    about: 'About & Overview',
    'my-home': 'My Home',
    plan: 'Retrofit Plan',
    whatif: 'What-If Scenarios',
    portfolio: 'Portfolio Analytics',
    memory: 'Customer Memory',
    assumptions: 'Assumptions & Methodology',
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shrink-0 transition-colors duration-200">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        <span>Workspace</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
        <span className="font-bold text-slate-900 dark:text-white capitalize">
          {pageTitles[currentPage] || currentPage}
        </span>
      </div>

      {/* Property Selector & Engine Status */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Active Property Dropdown */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-2.5 py-1 border border-slate-200 dark:border-slate-700">
          <Building className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 mr-2 shrink-0" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mr-1.5 hidden sm:inline">Property:</span>
          <select
            value={propertyId}
            onChange={(e) => onSelectProperty(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
          >
            {availableIds.map((id) => (
              <option key={id} value={id} className="dark:bg-slate-800">
                {id} {id === 'P10001' ? '(Demo: Semi, E)' : id === 'P10002' ? '(Demo: Detached, C)' : id === 'P10003' ? '(Demo: Flat, B)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Engine status pills */}
        <div className="hidden md:flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Sparkles className="w-3 h-3 text-emerald-500" />
            Gemini Grounded
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            DESNZ 2026
          </span>
        </div>

        {/* Quick Theme Toggle Button */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center justify-center shrink-0"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>
        )}
      </div>
    </header>
  );
};
