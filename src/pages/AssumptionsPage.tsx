import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  Flame,
  Zap,
  Info,
  Layers,
  Scale,
  Wind,
} from 'lucide-react';
import { SCORE_WEIGHTS, EPC_SCORES, HEATING_SCORES, CONTROLS_SCORES, GLAZING_U_VALUES, EMISSION_FACTORS, ENERGY_PRICES } from '../engine/scoring';

export const AssumptionsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'weights' | 'catalogue' | 'carbon' | 'physics' | 'limits'>('weights');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Assumptions, Factors & Methodology
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Complete transparency. No hidden variables or black-box magic. All formulas and factors documented.
        </p>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 text-xs font-bold overflow-x-auto">
        {[
          { id: 'weights', label: 'Score Weights & Mappings' },
          { id: 'catalogue', label: 'Retrofit Catalogue' },
          { id: 'carbon', label: 'Carbon Factors & Tariffs' },
          { id: 'physics', label: 'Physics Simulation' },
          { id: 'limits', label: 'Limitations & Integrity' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-2.5 px-4 rounded-t-xl transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-900 border-t-2 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Weights & Mappings */}
      {activeTab === 'weights' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Official Component Weights (Fixed by Brief)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-bold text-[11px]">
                    <th className="py-2.5">Component</th>
                    <th className="py-2.5">Weight</th>
                    <th className="py-2.5">Evaluation Rule</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  <tr>
                    <td className="py-2.5 font-bold font-sans text-slate-800 dark:text-slate-200">Energy Efficiency</td>
                    <td className="py-2.5 text-emerald-600 font-bold">25% (0.25)</td>
                    <td className="py-2.5 font-sans text-slate-600 dark:text-slate-400">EPC band midpoint of official SAP range (A:96 to G:11)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold font-sans text-slate-800 dark:text-slate-200">Consumption Intensity</td>
                    <td className="py-2.5 text-emerald-600 font-bold">20% (0.20)</td>
                    <td className="py-2.5 font-sans text-slate-600 dark:text-slate-400">Linear between anchors: 100 for EUI &le; 40 kWh/m²; 0 for EUI &ge; 300 kWh/m²</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold font-sans text-slate-800 dark:text-slate-200">Insulation & Fabric</td>
                    <td className="py-2.5 text-emerald-600 font-bold">15% (0.15)</td>
                    <td className="py-2.5 font-sans text-slate-600 dark:text-slate-400">55% wall U-value ratio (ref 0.28) + 45% roof U-value ratio (ref 0.16)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold font-sans text-slate-800 dark:text-slate-200">Heating System</td>
                    <td className="py-2.5 text-emerald-600 font-bold">15% (0.15)</td>
                    <td className="py-2.5 font-sans text-slate-600 dark:text-slate-400">Heat pump: 100, Condensing gas: 60, Non-condensing: 50, Electric: 35</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold font-sans text-slate-800 dark:text-slate-200">Windows & Glazing</td>
                    <td className="py-2.5 text-emerald-600 font-bold">10% (0.10)</td>
                    <td className="py-2.5 font-sans text-slate-600 dark:text-slate-400">Ratio to reference U-value 1.4: min(100, 100 * 1.4 / U_window)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold font-sans text-slate-800 dark:text-slate-200">Renewable Energy</td>
                    <td className="py-2.5 text-emerald-600 font-bold">10% (0.10)</td>
                    <td className="py-2.5 font-sans text-slate-600 dark:text-slate-400">min(100, 25 points per kWp of rooftop solar PV)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold font-sans text-slate-800 dark:text-slate-200">Smart Energy Management</td>
                    <td className="py-2.5 text-emerald-600 font-bold">5% (0.05)</td>
                    <td className="py-2.5 font-sans text-slate-600 dark:text-slate-400">Smart zoned: 100, Smart thermostat: 85, TRVs: 65, None: 0</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
                Classification Bands
              </h4>
              <div className="space-y-2 text-xs font-mono">
                {[
                  { band: 'Highly efficient', range: 'Score 80 – 100', color: 'bg-emerald-700' },
                  { band: 'Good', range: 'Score 65 – 79', color: 'bg-emerald-600' },
                  { band: 'Moderate', range: 'Score 50 – 64', color: 'bg-emerald-500' },
                  { band: 'Poor (Flagged)', range: 'Score 30 – 49', color: 'bg-amber-600' },
                  { band: 'Very poor (Flagged)', range: 'Score 0 – 29', color: 'bg-red-600' },
                ].map((b) => (
                  <div key={b.band} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                    <span className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${b.color}`} />
                      <span className="font-bold font-sans">{b.band}</span>
                    </span>
                    <span className="text-slate-500">{b.range}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
                Monotonicity Guarantee
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                All sub-score functions satisfy mathematical monotonicity: improving an attribute (e.g., adding loft depth, replacing single glazing with double glazing, or fitting TRVs) can never reduce any sub-score or the total Green Home Score.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Retrofit Catalogue */}
      {activeTab === 'catalogue' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Retrofit Measures Catalogue
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-bold text-[11px]">
                  <th className="py-2.5">Stage</th>
                  <th className="py-2.5">Measure Name</th>
                  <th className="py-2.5">Target Area</th>
                  <th className="py-2.5">Indicative Cost</th>
                  <th className="py-2.5">Key Interaction Rules</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {[
                  { stage: 1, name: 'Loft insulation (top-up to 270 mm)', target: 'Space heating', cost: '£400 – £1,000', rules: 'Requires pitched loft with <200 mm depth; applied before heating' },
                  { stage: 2, name: 'Cavity wall insulation', target: 'Space heating', cost: '£1,000 – £3,000', rules: 'Requires cavity wall; blocked if already insulated or no external works' },
                  { stage: 2, name: 'Solid wall insulation', target: 'Space heating', cost: '£8,000 – £20,000', rules: 'Internal/external solid wall; blocked if listed building' },
                  { stage: 3, name: 'Double glazing', target: 'Space heating', cost: '£5,000 – £12,000', rules: 'Replaces single or early double glazing; blocked if listed' },
                  { stage: 4, name: 'Smart thermostat', target: 'Space heating', cost: '£150 – £300', rules: 'Regulates wet heating; not applicable for electric direct heaters' },
                  { stage: 5, name: 'Air-source heat pump', target: 'Space + Hot water', cost: '£10,000 – £15,000', rules: 'Requires outdoor space; removes gas, adds electricity via SCOP ~2.8' },
                  { stage: 6, name: 'Solar PV array', target: 'Grid imports', cost: '£5,000 – £8,000', rules: 'Not suitable for flat roof / north facing; 45% self-consumption rate' },
                ].map((m) => (
                  <tr key={m.name}>
                    <td className="py-2.5 text-emerald-600 font-bold">Stage {m.stage}</td>
                    <td className="py-2.5 font-bold font-sans text-slate-800 dark:text-slate-200">{m.name}</td>
                    <td className="py-2.5 font-sans text-slate-600 dark:text-slate-400">{m.target}</td>
                    <td className="py-2.5 font-bold text-slate-900 dark:text-white">{m.cost}</td>
                    <td className="py-2.5 font-sans text-slate-500 text-[11px]">{m.rules}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Carbon & Tariffs */}
      {activeTab === 'carbon' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Wind className="w-4 h-4 text-emerald-600" />
              DESNZ 2026 Emission Factors
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Official UK Government GHG Conversion Factors for Company Reporting 2026:
            </p>
            <div className="space-y-2 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-800 dark:text-slate-200 font-sans block">Grid Electricity</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">0.14395 kg CO2e / kWh</span>
                <span className="text-[10px] text-slate-400 block mt-1">Generation (0.13096) + Transmission & Distribution (0.01299)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-800 dark:text-slate-200 font-sans block">Mains Gas</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold text-sm">0.18231 kg CO2e / kWh</span>
                <span className="text-[10px] text-slate-400 block mt-1">Direct combustion (gross CV, Scope 1)</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-600" />
              Ofgem 2026 Q4 Default Tariff Price Caps
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Used for indicative secondary bill savings and simple payback projections:
            </p>
            <div className="space-y-2 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-800 dark:text-slate-200 font-sans block">Electricity Unit Rate</span>
                <span className="text-slate-900 dark:text-white font-bold text-sm">£0.245 / kWh</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-800 dark:text-slate-200 font-sans block">Gas Unit Rate</span>
                <span className="text-slate-900 dark:text-white font-bold text-sm">£0.062 / kWh</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 leading-snug">
              Standing charges are excluded as they remain constant regardless of consumption changes.
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Physics Simulation */}
      {activeTab === 'physics' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Honest Physics Simulator & Independent Model
          </h3>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            The dataset generation uses a documented physics-based simulator with hidden variables (occupant behavioural factors, real heat pump seasonal degradation, installation flaws). Our retrofit engine runs independent deterministic calculation engines.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs">
              <div className="font-bold text-slate-800 dark:text-slate-200">Fabric Before Heating</div>
              <p className="text-slate-500 mt-1">
                Reducing space heating demand first allows smaller heat pump sizing and prevents over-expenditure.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs">
              <div className="font-bold text-slate-800 dark:text-slate-200">Heat Pump SCOP 2.8</div>
              <p className="text-slate-500 mt-1">
                Grounded in empirical Electrification of Heat trials (SPF H4 median 2.8; 2.5 for poor fabric).
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs">
              <div className="font-bold text-slate-800 dark:text-slate-200">45% Solar Self-Consumption</div>
              <p className="text-slate-500 mt-1">
                Derived from McKenna, Pless & Darby (2018) empirical solar export telemetry.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Limitations */}
      {activeTab === 'limits' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Integrity, Disclaimers & Limitations
          </h3>
          <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300">
              <strong className="block font-bold">Indicative Estimates, Not Guarantees:</strong>
              Savings numbers are modelled estimates based on archetype physics and typical usage profiles. Real savings depend on occupant comfort settings, weather, and installation quality.
            </div>
            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300">
              <strong className="block font-bold">Property Value Enhancement:</strong>
              Value impact is indicative based on hedonic statistical relationships between EPC bands and sale prices. It does not replace a physical RICS chartered surveyor valuation.
            </div>
            <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              <strong className="block font-bold">Synthetic World:</strong>
              All customer and property records are synthetic (generated with seed 42) to protect customer privacy in this hackathon prototype.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
