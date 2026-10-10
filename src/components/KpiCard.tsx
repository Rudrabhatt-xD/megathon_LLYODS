import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  icon: LucideIcon;
  value: string | number;
  unit?: string;
  subValue?: string;
  subText?: string;
  footer?: string;
  tone?: 'default' | 'good' | 'warn' | 'neutral';
  children?: ReactNode;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  icon: Icon,
  value,
  unit,
  subValue,
  subText,
  footer,
  tone = 'default',
  children,
}) => {
  const toneClasses = {
    default: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/50 dark:border-emerald-800/40',
    good: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/50 dark:border-emerald-800/40',
    warn: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200/50 dark:border-amber-800/40',
    neutral: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </span>
          <div className={`p-2 rounded-xl border ${toneClasses[tone]}`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>

        {children ? (
          children
        ) : (
          <div className="flex items-baseline space-x-1.5 font-mono">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {value}
            </span>
            {unit && (
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 font-sans">
                {unit}
              </span>
            )}
          </div>
        )}

        {(subValue || subText) && (
          <div className="mt-2 text-xs font-medium flex items-center gap-1.5">
            {subValue && (
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                {subValue}
              </span>
            )}
            {subText && (
              <span className="text-slate-500 dark:text-slate-400">{subText}</span>
            )}
          </div>
        )}
      </div>

      {footer && (
        <div className="mt-4 pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          {footer}
        </div>
      )}
    </div>
  );
};
