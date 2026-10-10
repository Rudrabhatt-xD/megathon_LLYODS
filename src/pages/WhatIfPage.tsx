import React, { useState } from 'react';
import {
  Sliders,
  Sparkles,
  Zap,
  Flame,
  Wind,
  PoundSterling,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { AssessmentResult } from '../types';
import { ExplanationPanel } from '../components/ExplanationPanel';

interface WhatIfPageProps {
  assessment: AssessmentResult | null;
  onUpdateScenario: (measures: string[]) => void;
  isLoading: boolean;
}

const ALL_MEASURES = [
  { id: 'loft_insulation', name: 'Loft insulation (top-up to 270 mm)', stage: 1, cost: '£400 - £1,000' },
  { id: 'cavity_wall_insulation', name: 'Cavity wall insulation', stage: 2, cost: '£1,000 - £3,000' },
  { id: 'solid_wall_insulation', name: 'Solid wall insulation', stage: 2, cost: '£8,000 - £20,000' },
  { id: 'double_glazing', name: 'Double glazing', stage: 3, cost: '£5,000 - £12,000' },
  { id: 'smart_thermostat', name: 'Smart thermostat', stage: 4, cost: '£150 - £300' },
  { id: 'air_source_heat_pump', name: 'Air-source heat pump', stage: 5, cost: '£10,000 - £15,000' },
  { id: 'solar_pv', name: 'Solar PV', stage: 6, cost: '£5,000 - £8,000' },
];

export const WhatIfPage: React.FC<WhatIfPageProps> = ({
  assessment,
  onUpdateScenario,
  isLoading,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    assessment?.package.measures || []
  );
  const [nlQuery, setNlQuery] = useState('');

  if (isLoading || !assessment) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center">
        <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Calculating what-if scenario dynamics...
        </h3>
      </div>
    );
  }

  const { profile, package: pkg, fact_sheet } = assessment;

  const handleToggle = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((m) => m !== id)
      : [...selectedIds, id];
    setSelectedIds(next);
    onUpdateScenario(next);
  };

  const handleApplyPreset = (ids: string[]) => {
    setSelectedIds(ids);
    onUpdateScenario(ids);
  };

  const handleNaturalLanguage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlQuery.trim()) return;
    const lower = nlQuery.toLowerCase();
    const next: string[] = [];

    if (lower.includes('loft') || lower.includes('roof')) next.push('loft_insulation');
    if (lower.includes('cavity')) next.push('cavity_wall_insulation');
    if (lower.includes('solid wall')) next.push('solid_wall_insulation');
    if (lower.includes('glaz') || lower.includes('window')) next.push('double_glazing');
    if (lower.includes('thermostat') || lower.includes('smart')) next.push('smart_thermostat');
    if (lower.includes('heat pump') || lower.includes('pump') || lower.includes('ashp')) next.push('air_source_heat_pump');
    if (lower.includes('solar') || lower.includes('pv')) next.push('solar_pv');

    if (next.length > 0) {
      setSelectedIds(next);
      onUpdateScenario(next);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
            What-If Scenario Engine
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Every what-if reruns the full feasibility, per-fuel savings, carbon, rating, and indicative value calculations instantly.
        </p>
      </div>

      {/* Natural Language Prompt & Quick Presets */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <form onSubmit={handleNaturalLanguage} className="flex gap-2">
          <input
            type="text"
            value={nlQuery}
            onChange={(e) => setNlQuery(e.target.value)}
            placeholder="Try asking: 'What if I only install solar PV and loft insulation?' or 'Fabric only without heat pump'"
            className="flex-1 px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all shrink-0"
          >
            Apply Query
          </button>
        </form>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 dark:text-slate-500 font-semibold text-[11px]">
            Quick Presets:
          </span>
          <button
            onClick={() => handleApplyPreset(['loft_insulation', 'cavity_wall_insulation', 'double_glazing'])}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
          >
            Fabric Only (Loft + Wall + Windows)
          </button>
          <button
            onClick={() => handleApplyPreset(['air_source_heat_pump', 'solar_pv'])}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
          >
            Clean Tech (Heat Pump + Solar)
          </button>
          <button
            onClick={() => handleApplyPreset(['loft_insulation', 'smart_thermostat'])}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
          >
            Low Cost / Quick Wins (&lt;£1.5k)
          </button>
          <button
            onClick={() => handleApplyPreset(ALL_MEASURES.map((m) => m.id))}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
          >
            All Feasible Measures
          </button>
        </div>
      </div>

      {/* Measure Toggle Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Select Measures for this Scenario
          </h3>
          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {selectedIds.length} measures active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {ALL_MEASURES.map((measure) => {
            const isSelected = selectedIds.includes(measure.id);
            return (
              <div
                key={measure.id}
                onClick={() => handleToggle(measure.id)}
                className={`p-3.5 rounded-xl border cursor-pointer select-none transition-all ${
                  isSelected
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700/80 shadow-2xs'
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-500">
                    Stage {measure.stage}
                  </span>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer pointer-events-none"
                  />
                </div>
                <div className="font-bold text-xs text-slate-900 dark:text-white mt-2">
                  {measure.name}
                </div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                  Est. cost: {measure.cost}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recalculated Scenario Results */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Scenario Outcomes
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Instant recalculated impact across all 4 key customer questions.
            </p>
          </div>
          <div className="flex items-center gap-3 font-mono">
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              Projected Score: {pkg.projected_score} / 100
            </span>
          </div>
        </div>

        {/* 4 Metric Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80">
            <div className="text-[10px] uppercase font-bold text-slate-400">Net Energy Saved</div>
            <div className="text-lg font-mono font-extrabold text-slate-900 dark:text-white mt-1">
              {pkg.saving_total_kwh.toLocaleString()} kWh
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
              -{pkg.saving_pct}% reduction
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80">
            <div className="text-[10px] uppercase font-bold text-slate-400">Carbon Abatement</div>
            <div className="text-lg font-mono font-extrabold text-slate-900 dark:text-white mt-1">
              {(pkg.carbon_reduction_kg / 1000).toFixed(2)} t
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
              {pkg.carbon_reduction_kg.toLocaleString()} kg CO2e / yr
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80">
            <div className="text-[10px] uppercase font-bold text-slate-400">Indicative Cost</div>
            <div className="text-lg font-mono font-extrabold text-slate-900 dark:text-white mt-1">
              £{pkg.cost_low_gbp.toLocaleString()} – £{pkg.cost_high_gbp.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Bill save ~£{pkg.bill_saving_gbp}/yr
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80">
            <div className="text-[10px] uppercase font-bold text-slate-400">Value Enhancement</div>
            <div className="text-lg font-mono font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              +{pkg.value_impact_low_pct}% – +{pkg.value_impact_high_pct}%
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
              +£{pkg.value_impact_low_gbp.toLocaleString()} to +£{pkg.value_impact_high_gbp.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Grounded Explanation for Scenario */}
      <ExplanationPanel factSheet={fact_sheet} propertyId={profile.property_id} />
    </div>
  );
};
