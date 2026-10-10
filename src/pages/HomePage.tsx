import React from 'react';
import {
  HelpCircle,
  Home,
  CheckSquare,
  Sliders,
  Building2,
  FileText,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const QUESTIONS = [
    {
      q: 'How green is my home today?',
      a: 'A transparent Green Home Score from 0 to 100, broken down across seven documented components from EPC rating to smart controls.',
      step: 1,
    },
    {
      q: 'What should I improve?',
      a: 'A prioritised list of feasible retrofits in physical installation order (fabric before heating, heating before solar), each with plain reasons.',
      step: 2,
    },
    {
      q: 'How much energy and carbon could I save?',
      a: 'Rigorous per-fuel estimates for electricity and gas separately, accounting for heat pump electricity additions and whole-package interactions.',
      step: 3,
    },
    {
      q: "Could this increase my property's value?",
      a: 'An indicative valuation range based on empirical SAP/EPC price models, presented transparently as a range—never a misleading single number.',
      step: 4,
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 text-white p-8 md:p-10 shadow-lg">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            Lloyds Problem Statement 2 · Megathon X: Singularity
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
            Green Home Score and Retrofit Engine
          </h1>
          <p className="text-emerald-100/90 text-sm md:text-base leading-relaxed">
            Many people want a more energy-efficient home but do not know where to start.
            This platform provides explainable, interaction-aware analytics for individual homeowners
            and helps lenders identify where a portfolio is least efficient.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('my-home')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-white text-emerald-950 hover:bg-emerald-50 transition-all shadow-md shadow-black/10"
            >
              <Home className="w-4 h-4 text-emerald-700" />
              Assess My Home
            </button>
            <button
              onClick={() => onNavigate('portfolio')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-700/60 hover:bg-emerald-700 text-white border border-emerald-500/40 transition-all"
            >
              <Building2 className="w-4 h-4" />
              View Portfolio (5,000 Homes)
            </button>
          </div>
        </div>

        {/* Decorative blur */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* The 4 Core Customer Questions */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Answering the Four Core Questions
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUESTIONS.map((item) => (
            <div
              key={item.step}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-emerald-500/50 transition-all"
            >
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                    {item.q}
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout: Navigation & Core Rule */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Navigation Map */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Platform Workspaces
          </h3>

          <div className="space-y-2.5">
            {[
              {
                id: 'my-home',
                title: 'My Home Overview',
                desc: 'Green Home Score (0-100), 7 components, potential savings, and measure path checklist.',
                icon: Home,
              },
              {
                id: 'plan',
                title: 'Retrofit Plan',
                desc: 'Prioritised feasible retrofits in sequence, per-fuel savings, carbon reduction, and Gemini grounding.',
                icon: CheckSquare,
              },
              {
                id: 'whatif',
                title: 'What-If Scenarios',
                desc: 'Customise measure packages or ask natural language queries with real-time recalculation.',
                icon: Sliders,
              },
              {
                id: 'portfolio',
                title: 'Portfolio Intelligence',
                desc: 'Business dashboard ranking 5,000 synthetic homes by improvement potential and carbon reduction.',
                icon: Building2,
              },
              {
                id: 'assumptions',
                title: 'Assumptions & Methodology',
                desc: 'Transparent weights, sub-score tables, retrofit catalogue, and DESNZ 2026 carbon factors.',
                icon: FileText,
              },
            ].map((workspace) => {
              const Icon = workspace.icon;
              return (
                <button
                  key={workspace.id}
                  onClick={() => onNavigate(workspace.id)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-slate-800 text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {workspace.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {workspace.desc}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Core Rule & Integrity Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
                <Zap className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                The Core Rule
              </h3>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              <strong className="text-slate-900 dark:text-white font-bold">
                Models calculate, the LLM explains.
              </strong>{' '}
              Every numerical calculation—from heat-loss reduction and per-fuel kilowatt-hours to
              operational carbon emissions and value bounds—is computed by verified TypeScript code.
            </p>

            <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
              The language model receives a structured fact sheet of pre-computed numbers and is
              required to cite fact IDs. No hallucinated metrics are tolerated.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Savings are estimates
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Value impact indicative
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                Synthetic dataset (5,000)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
