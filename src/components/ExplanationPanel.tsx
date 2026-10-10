import React, { useState } from 'react';
import { Sparkles, MessageSquare, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { FactSheetViewer } from './FactSheetViewer';

interface ExplanationPanelProps {
  factSheet: Record<string, string>;
  propertyId: string;
}

export const ExplanationPanel: React.FC<ExplanationPanelProps> = ({ factSheet, propertyId }) => {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>('gemini-3.8-flash');
  const [isLoading, setIsLoading] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchExplanation = async (question?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fact_sheet: factSheet,
          question: question || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to generate explanation');
      const data = await res.json();
      setExplanation(data.explanation);
      setProvider(data.provider);
    } catch (err: any) {
      console.error(err);
      setError('Unable to load explanation. Using verified template mode.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to render markdown-like text and highlight citations like [F01]
  const renderFormattedText = (text: string) => {
    // Split lines and format paragraphs/headers
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-sm font-bold text-slate-900 dark:text-white mt-4 mb-2">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('- ')) {
        return (
          <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 ml-4 list-disc leading-relaxed my-1">
            {highlightCitations(line.replace('- ', ''))}
          </li>
        );
      }
      if (line.trim().length === 0) {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed my-1.5">
          {highlightCitations(line)}
        </p>
      );
    });
  };

  const highlightCitations = (lineText: string) => {
    // Replace [F01], [F02], etc. with styled badge
    const parts = lineText.split(/(\[F\d{2}(?:,\s*F\d{2})*\])/g);
    return parts.map((part, i) => {
      if (/^\[F\d{2}(?:,\s*F\d{2})*\]$/.test(part)) {
        return (
          <span
            key={i}
            className="inline-flex items-center px-1.5 py-0.5 mx-1 rounded-md text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Grounded AI Explanation
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Core rule: <span className="font-semibold text-slate-700 dark:text-slate-300">Models calculate, the LLM explains.</span> All numbers are cited strictly from the fact sheet.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!explanation && (
            <button
              onClick={() => fetchExplanation()}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isLoading ? 'Generating Explanation...' : 'Explain Plan with Gemini'}
            </button>
          )}
        </div>
      </div>

      {/* Fact sheet viewer collapsible */}
      <FactSheetViewer factSheet={factSheet} />

      {/* Question Form */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && customQuestion && fetchExplanation(customQuestion)}
            placeholder="Ask a question about this plan (e.g. 'Why does electricity increase with a heat pump?')"
            className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>
        <button
          onClick={() => customQuestion && fetchExplanation(customQuestion)}
          disabled={isLoading || !customQuestion.trim()}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white transition-all disabled:opacity-40 flex items-center gap-1.5 shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Ask</span>
        </button>
      </div>

      {/* Explanation Result Body */}
      {isLoading && (
        <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Synthesising grounded explanation...
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Verifying fact citations and calculating boundary checks.
          </div>
        </div>
      )}

      {explanation && !isLoading && (
        <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-emerald-200/60 dark:border-emerald-800/40">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Grounded Explanation ({provider})</span>
            </div>
            <button
              onClick={() => fetchExplanation()}
              className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              Regenerate
            </button>
          </div>

          <div className="prose prose-xs max-w-none text-slate-800 dark:text-slate-200">
            {renderFormattedText(explanation)}
          </div>
        </div>
      )}
    </div>
  );
};
