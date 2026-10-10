import React, { useState } from 'react';
import {
  Building,
  MapPin,
  TrendingUp,
  Wind,
  Zap,
  Edit3,
  RotateCcw,
  Download,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Layers,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { AssessmentResult, PropertyProfile } from '../types';
import { ScoreGauge } from '../components/ScoreGauge';
import { KpiCard } from '../components/KpiCard';

interface MyHomePageProps {
  assessment: AssessmentResult | null;
  onNavigate: (page: string) => void;
  onUpdateScenario: (measures: string[], editedProfile?: Partial<PropertyProfile>) => void;
  isLoading: boolean;
}

export const MyHomePage: React.FC<MyHomePageProps> = ({
  assessment,
  onNavigate,
  onUpdateScenario,
  isLoading,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMeasures, setSelectedMeasures] = useState<string[]>(
    assessment?.recommendations.map((m) => m.measure_id) || []
  );

  React.useEffect(() => {
    if (assessment?.recommendations) {
      setSelectedMeasures(assessment.recommendations.map((m) => m.measure_id));
    }
  }, [assessment?.property_id]);

  // Form states for property edit
  const [editForm, setEditForm] = useState<Partial<PropertyProfile>>({});

  if (isLoading || !assessment) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center">
        <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Evaluating property features & energy usage...
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Running physics-based fabric and heating loss models.
        </p>
      </div>
    );
  }

  const { profile, score, issues, recommendations, package: pkg } = assessment;

  const handleToggleMeasure = (measureId: string) => {
    const next = selectedMeasures.includes(measureId)
      ? selectedMeasures.filter((id) => id !== measureId)
      : [...selectedMeasures, measureId];
    setSelectedMeasures(next);
    onUpdateScenario(next, Object.keys(editForm).length > 0 ? editForm : undefined);
  };

  const handleApplyEdits = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateScenario(selectedMeasures, editForm);
    setIsEditing(false);
  };

  const handleResetEdits = () => {
    setEditForm({});
    onUpdateScenario(selectedMeasures, undefined);
    setIsEditing(false);
  };

  const downloadReport = () => {
    const blob = new Blob([JSON.stringify(assessment, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profile.property_id}_greenhome_assessment.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Property Hero Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
              <Building className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Home {profile.property_id}
                </h1>
                {profile.demo_seed ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    Seeded Demo Home
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Synthetic Portfolio Home
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <MapPin className="w-3.5 h-3.5" />
                <span className="capitalize">{profile.region.replace(/_/g, ' ')}, United Kingdom</span>
              </div>

              {/* Property Attributes Pills */}
              <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-300 capitalize">
                  {profile.property_type.replace(/_/g, ' ')}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-300 font-mono">
                  {profile.floor_area_m2} m²
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-300">
                  Built {profile.age_band.replace(/_/g, ' ')}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800/60">
                  EPC Band {profile.energy_rating || 'D'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Details'}</span>
            </button>
            <button
              onClick={downloadReport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Report</span>
            </button>
          </div>
        </div>

        {/* Edit Details Drawer Form */}
        {isEditing && (
          <form
            onSubmit={handleApplyEdits}
            className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-4"
          >
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Edit Property Characteristics (Meters stay as measured)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Glazing</label>
                <select
                  value={editForm.glazing ?? profile.glazing}
                  onChange={(e) => setEditForm({ ...editForm, glazing: e.target.value as any })}
                  className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="single">Single Glazing</option>
                  <option value="secondary">Secondary Glazing</option>
                  <option value="double_pre2002">Double (Pre-2002)</option>
                  <option value="double_post2002">Double (Post-2002)</option>
                  <option value="triple">Triple Glazing</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Wall Insulation</label>
                <select
                  value={editForm.wall_insulation ?? profile.wall_insulation}
                  onChange={(e) => setEditForm({ ...editForm, wall_insulation: e.target.value as any })}
                  className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="none">None (Uninsulated)</option>
                  <option value="partial">Partial</option>
                  <option value="insulated">Fully Insulated</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Heating Type</label>
                <select
                  value={editForm.heating_type ?? profile.heating_type}
                  onChange={(e) => setEditForm({ ...editForm, heating_type: e.target.value as any })}
                  className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="gas_noncondensing_boiler">Gas Non-condensing Boiler</option>
                  <option value="gas_condensing_boiler">Gas Condensing Boiler</option>
                  <option value="air_source_heat_pump">Air Source Heat Pump</option>
                  <option value="electric_storage">Electric Storage Heaters</option>
                  <option value="electric_direct">Electric Direct Heaters</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Smart Controls</label>
                <select
                  value={editForm.smart_controls ?? profile.smart_controls}
                  onChange={(e) => setEditForm({ ...editForm, smart_controls: e.target.value as any })}
                  className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="none">None</option>
                  <option value="programmer_only">Programmer Only</option>
                  <option value="programmer_thermostat">Programmer + Thermostat</option>
                  <option value="programmer_thermostat_trvs">Thermostat + TRVs</option>
                  <option value="smart_thermostat">Smart Thermostat</option>
                  <option value="smart_zoned">Smart Zoned</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Loft Insulation (mm)</label>
                <input
                  type="number"
                  min="0"
                  max="400"
                  step="10"
                  value={editForm.loft_insulation_mm ?? profile.loft_insulation_mm ?? 0}
                  onChange={(e) => setEditForm({ ...editForm, loft_insulation_mm: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Floor Area (m²)</label>
                <input
                  type="number"
                  min="30"
                  max="500"
                  value={editForm.floor_area_m2 ?? profile.floor_area_m2}
                  onChange={(e) => setEditForm({ ...editForm, floor_area_m2: parseFloat(e.target.value) || 90 })}
                  className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleResetEdits}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Reset to Original
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
              >
                Apply Changes
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 3 Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* KPI 1: Score Gauge */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Green Home Score
            </span>
            <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">
              0 - 100
            </span>
          </div>

          <div className="py-2">
            <ScoreGauge
              score={score.score}
              classification={score.classification}
              status={score.status}
            />
          </div>

          <div className="mt-2 pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-medium">
            <span>Range: {score.range_low} – {score.range_high}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">100% verified</span>
          </div>
        </div>

        {/* KPI 2: Potential Energy Savings */}
        <KpiCard
          title="Potential Energy Saving"
          icon={Zap}
          value={pkg.saving_pct}
          unit="%"
          subValue={`${pkg.saving_total_kwh.toLocaleString()} kWh/yr`}
          subText="net reduction"
          footer={`Gas: -${pkg.saving_gas_kwh.toLocaleString()} kWh · Elec: ${pkg.saving_elec_kwh >= 0 ? '-' : '+'}${Math.abs(pkg.saving_elec_kwh).toLocaleString()} kWh`}
          tone="good"
        />

        {/* KPI 3: Carbon Reduction */}
        <KpiCard
          title="Carbon Reduction Potential"
          icon={Wind}
          value={(pkg.carbon_reduction_kg / 1000).toFixed(2)}
          unit="t CO2e / yr"
          subValue={`${pkg.carbon_reduction_kg.toLocaleString()} kg`}
          subText="operational emissions"
          footer="Official UK DESNZ 2026 carbon factors"
          tone="good"
        />
      </div>

      {/* Two Column Layout: Path to Greener Home & Key Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column (3/5): Measure Path Checklist */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Your Path to a Greener Home
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Applied in optimal installation order. Tick/untick to model custom packages.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
                {selectedMeasures.length} / {recommendations.length} Selected
              </span>
            </div>

            {recommendations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                No further feasible retrofits recommended—this home already achieves best practices.
              </div>
            ) : (
              <div className="space-y-3">
                {recommendations.map((item) => {
                  const isChecked = selectedMeasures.includes(item.measure_id);
                  return (
                    <div
                      key={item.measure_id}
                      className={`flex items-start justify-between p-3.5 rounded-xl border transition-all ${
                        isChecked
                          ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleMeasure(item.measure_id)}
                          className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[11px] font-mono font-bold flex items-center justify-center">
                              {item.sequence_position}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {item.name}
                            </span>
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
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                            {item.reason}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                            <span>Cost: £{item.cost_low_gbp.toLocaleString()} – £{item.cost_high_gbp.toLocaleString()}</span>
                            <span>·</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              Save ~{item.net_saving_kwh.toLocaleString()} kWh/yr
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Fabric measures precede heating; heating precedes solar PV.
              </span>
              <button
                onClick={() => onNavigate('plan')}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors"
              >
                <span>Explain Retrofit Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Indicative Value Impact Card */}
          <div className="bg-gradient-to-br from-emerald-900/10 via-emerald-800/5 to-slate-900/5 dark:from-emerald-950/40 dark:to-slate-900/80 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Indicative Property Value Impact
                  </h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Based on empirical SAP rating improvements for {profile.property_type.replace(/_/g, ' ')} homes.
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                  +{pkg.value_impact_low_pct}% to +{pkg.value_impact_high_pct}%
                </div>
                <div className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300">
                  +£{pkg.value_impact_low_gbp.toLocaleString()} to +£{pkg.value_impact_high_gbp.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="mt-3 text-[11px] text-slate-400 dark:text-slate-500 leading-snug">
              * Indicative range calculated on estimated current value of £{profile.current_value_estimate?.toLocaleString()}.
              Not a guarantee or formal RICS valuation.
            </div>
          </div>
        </div>

        {/* Right Column (2/5): Key Issues & Component Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detected Key Issues */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Key Issues Detected ({issues.length})
              </h3>
            </div>

            <div className="space-y-3">
              {issues.length === 0 ? (
                <div className="p-4 text-center text-xs text-emerald-600 dark:text-emerald-400">
                  No critical efficiency issues detected!
                </div>
              ) : (
                issues.map((issue) => (
                  <div
                    key={issue.code}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {issue.text}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          issue.severity === 'high'
                            ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      {issue.evidence}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 7 Component Sub-scores */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Component Breakdown
              </h3>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                7 Official Categories
              </span>
            </div>

            <div className="space-y-3">
              {score.components.map((comp) => {
                const pct = Math.round(comp.weight * 100);
                return (
                  <div key={comp.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {comp.short_label}
                        <span className="text-slate-400 font-normal ml-1 font-mono">({pct}%)</span>
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {comp.score} / 100
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${comp.score}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
