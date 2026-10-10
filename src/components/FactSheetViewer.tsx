import React, { useState } from 'react';
import { FileCheck, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

interface FactSheetViewerProps {
  factSheet: Record<string, string>;
}

export const FactSheetViewer: React.FC<FactSheetViewerProps> = ({ factSheet }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    const text = Object.entries(factSheet)
      .map(([id, val]) => `[${id}]: ${val}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
            <FileCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Verified Model Fact Sheet
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {Object.keys(factSheet).length} verified calculation facts cited by the LLM
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            {copied ? 'Copied' : 'Copy Facts'}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2 font-mono text-xs">
          {Object.entries(factSheet).map(([id, text]) => (
            <div
              key={id}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-start gap-3"
            >
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] shrink-0">
                {id}
              </span>
              <span className="text-slate-700 dark:text-slate-300 font-sans leading-relaxed text-xs">
                {text}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
