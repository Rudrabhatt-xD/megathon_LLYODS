import React, { useState } from 'react';
import {
  CheckSquare,
  Zap,
  Flame,
  Wind,
  PoundSterling,
  ArrowUpDown,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AssessmentResult } from '../types';
import { ExplanationPanel } from '../components/ExplanationPanel';

interface RetrofitPlanPageProps {
  assessment: AssessmentResult | null;
  isLoading: boolean;
}

export const RetrofitPlanPage: React.FC<RetrofitPlanPageProps> = ({
  assessment,
  isLoading,
}) => {
  const [sortBySavings, setSortBySavings] = useState(false);
  const [showIneligible, setShowIneligible] = useState(false);

  if (isLoading || !assessment) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center">
        <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Synthesising retrofit recommendations...
        </h3>
      </div>
    );
  }

  const { profile, score, recommendations, not_suitable, previously_declined, package: pkg, fact_sheet } = assessment;

  const sortedMeasures = sortBySavings
    ? [...recommendations].sort((a, b) => b.net_saving_kwh - a.net_saving_kwh)
    : recommendations;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Feasible Retrofit Plan
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ordered strictly in physical installation sequence to maximise cumulative efficiency.
          </p>
        </div>

        <button
          onClick={() => setSortBySavings(!sortBySavings)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 self-start transition-all"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>{sortBySavings ? 'Sorted by Savings' : 'Sort by Sequence'}</span>
        </button>
      </div>

      {/* List of Recommended Measures */}
      <div className="space-y-4">
        {sortedMeasures.map((item) => (
          <div
            key={item.measure_id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700"
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <span className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-mono text-sm font-bold flex items-center justify-center shrink-0">
                  {item.sequence_position}
                </span>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {item.name}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.suitability === 'High'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : item.suitability === 'Medium'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {item.suitability} Suitability
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 font-mono">
                      Stage {item.stage} · {item.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                    {item.reason}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                  £{item.cost_low_gbp.toLocaleString()} – £{item.cost_high_gbp.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500">
                  indicative capital cost
                </div>
              </div>
            </div>

            {/* Per-Fuel Impact Metrics Row */}
            <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 font-sans">
                  <Flame className="w-3 h-3" /> Gas Reduction
                </div>
                <div className="text-slate-900 dark:text-white font-bold mt-0.5">
                  -{item.gas_saving_kwh.toLocaleString()} kWh/yr
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 font-sans">
                  <Zap className="w-3 h-3" /> Electricity Change
                </div>
                <div className={`font-bold mt-0.5 ${item.elec_saving_kwh < 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                  {item.elec_saving_kwh >= 0 ? '-' : '+'}{Math.abs(item.elec_saving_kwh).toLocaleString()} kWh/yr
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 font-sans">
                  <Wind className="w-3 h-3" /> Carbon Reduction
                </div>
                <div className="text-slate-900 dark:text-white font-bold mt-0.5">
                  -{item.carbon_reduction_kg.toLocaleString()} kg/yr
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 font-sans">
                  <PoundSterling className="w-3 h-3" /> Est. Bill Saving
                </div>
                <div className="text-slate-900 dark:text-white font-bold mt-0.5">
                  ~£{item.bill_saving_gbp.toLocaleString()} / yr
                </div>
              </div>
            </div>

            {item.measure_id === 'air_source_heat_pump' && (
              <div className="mt-3 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Notice: Electricity usage increases because the heat pump runs thermodynamically on electricity;
                  gas demand is eliminated, resulting in net carbon and energy reduction.
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Ineligible / Not Suitable Measures Drawer */}
      <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
        <button
          onClick={() => setShowIneligible(!showIneligible)}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300"
        >
          <span>Other Measures Evaluated ({not_suitable.length + previously_declined.length})</span>
          {showIneligible ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showIneligible && (
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
            {not_suitable.map((item) => (
              <div
                key={item.measure_id}
                className="flex items-start justify-between text-xs p-2.5 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700"
              >
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.reason}</p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase shrink-0">
                  {item.status.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
            {previously_declined.map((item) => (
              <div
                key={item.measure_id}
                className="flex items-start justify-between text-xs p-2.5 rounded-xl bg-white dark:bg-slate-800/60 border border-amber-200 dark:border-amber-900/40"
              >
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.reason}</p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 uppercase shrink-0">
                  Customer Declined
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Whole Package Summary Card with Visual Fuel Comparison */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Whole Package Dynamics
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Reflects cascading interactions across the complete retrofit package.
            </p>
          </div>
          <div className="text-right font-mono">
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              Projected Score: {pkg.projected_score} / 100
            </span>
            <span className="text-xs text-slate-500 block">
              ({pkg.projected_classification} · Band {pkg.projected_rating})
            </span>
          </div>
        </div>

        {/* Visual Comparison: Current vs Post-Retrofit Energy Use */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Annual Purchased Energy Comparison
            </div>

            {/* Current Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono font-semibold">
                <span className="text-slate-700 dark:text-slate-300">Baseline Purchased Energy</span>
                <span className="text-slate-900 dark:text-white">{pkg.current_total_kwh.toLocaleString()} kWh/yr</span>
              </div>
              <div className="w-full h-7 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex">
                <div
                  className="bg-amber-500 flex items-center justify-center text-[10px] text-white font-mono font-bold"
                  style={{ width: `${(pkg.current_gas_kwh / Math.max(1, pkg.current_total_kwh)) * 100}%` }}
                >
                  Gas {Math.round((pkg.current_gas_kwh / Math.max(1, pkg.current_total_kwh)) * 100)}%
                </div>
                <div
                  className="bg-emerald-600 flex items-center justify-center text-[10px] text-white font-mono font-bold"
                  style={{ width: `${(pkg.current_elec_kwh / Math.max(1, pkg.current_total_kwh)) * 100}%` }}
                >
                  Elec {Math.round((pkg.current_elec_kwh / Math.max(1, pkg.current_total_kwh)) * 100)}%
                </div>
              </div>
            </div>

            {/* Post-Package Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono font-semibold">
                <span className="text-emerald-700 dark:text-emerald-400">With Recommended Package</span>
                <span className="text-emerald-700 dark:text-emerald-400">
                  {pkg.post_total_kwh.toLocaleString()} kWh/yr (-{pkg.saving_pct}%)
                </span>
              </div>
              <div className="w-full h-7 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex">
                <div
                  className="bg-amber-500 flex items-center justify-center text-[10px] text-white font-mono font-bold"
                  style={{ width: `${(pkg.post_gas_kwh / Math.max(1, pkg.current_total_kwh)) * 100}%` }}
                >
                  {pkg.post_gas_kwh > 0 ? `Gas ${pkg.post_gas_kwh.toLocaleString()}` : ''}
                </div>
                <div
                  className="bg-emerald-600 flex items-center justify-center text-[10px] text-white font-mono font-bold"
                  style={{ width: `${(pkg.post_elec_kwh / Math.max(1, pkg.current_total_kwh)) * 100}%` }}
                >
                  Elec {pkg.post_elec_kwh.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Package Financial & Payback metrics */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between">
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 font-sans">Total Indicative Capital Cost</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  £{pkg.cost_low_gbp.toLocaleString()} – £{pkg.cost_high_gbp.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 font-sans">Estimated Annual Bill Saving</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  ~£{pkg.bill_saving_gbp.toLocaleString()} / year
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 font-sans">Estimated Simple Payback</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {pkg.simple_payback_years ? `~${pkg.simple_payback_years} years` : 'n/a'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Annual Carbon Elimination</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {(pkg.carbon_reduction_kg / 1000).toFixed(2)} tonnes CO2e
                </span>
              </div>
            </div>

            <div className="mt-3 text-[10px] text-slate-400 dark:text-slate-500 leading-snug">
              Calculated using Ofgem 2026Q4 default tariff caps (£0.245/kWh electricity, £0.062/kWh gas).
              Excludes standing charges.
            </div>
          </div>
        </div>
      </div>

      {/* Grounded LLM Explanation Panel */}
      <ExplanationPanel factSheet={fact_sheet} propertyId={profile.property_id} />
    </div>
  );
};
