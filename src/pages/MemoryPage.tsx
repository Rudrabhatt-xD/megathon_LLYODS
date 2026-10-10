import React, { useState, useEffect } from 'react';
import {
  History,
  CheckCircle2,
  Ban,
  Shield,
  Trash2,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { AssessmentResult, CustomerMemoryEvent } from '../types';

interface MemoryPageProps {
  assessment: AssessmentResult | null;
  onRefreshAssessment: () => void;
}

const MEASURES_LIST = [
  { id: 'loft_insulation', name: 'Loft insulation (top-up to 270 mm)' },
  { id: 'cavity_wall_insulation', name: 'Cavity wall insulation' },
  { id: 'solid_wall_insulation', name: 'Solid wall insulation' },
  { id: 'double_glazing', name: 'Double glazing' },
  { id: 'smart_thermostat', name: 'Smart thermostat' },
  { id: 'air_source_heat_pump', name: 'Air-source heat pump' },
  { id: 'solar_pv', name: 'Solar PV' },
];

export const MemoryPage: React.FC<MemoryPageProps> = ({
  assessment,
  onRefreshAssessment,
}) => {
  const [events, setEvents] = useState<CustomerMemoryEvent[]>([]);
  const [completedMeasure, setCompletedMeasure] = useState('loft_insulation');
  const [declinedMeasure, setDeclinedMeasure] = useState('air_source_heat_pump');
  const [noExternalWorks, setNoExternalWorks] = useState(false);
  const [maxBudget, setMaxBudget] = useState(0);

  const customerId = assessment?.profile.customer_id || assessment?.profile.property_id || 'C99999';

  const fetchEvents = () => {
    fetch(`/api/memory/${customerId}`)
      .then((r) => r.json())
      .then((data) => setEvents(data || []))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchEvents();
  }, [customerId]);

  const addEvent = async (type: string, payload: any) => {
    try {
      await fetch(`/api/memory/${customerId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: assessment?.profile.property_id,
          type,
          payload,
        }),
      });
      fetchEvents();
      onRefreshAssessment();
    } catch (err) {
      console.error(err);
    }
  };

  const clearMemory = async () => {
    try {
      await fetch(`/api/memory/${customerId}/clear`, { method: 'DELETE' });
      fetchEvents();
      onRefreshAssessment();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Customer Memory: {customerId}
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Memory records completed retrofits, customer constraints, and declined measures.
            Calculations are always recomputed deterministically.
          </p>
        </div>

        {events.length > 0 && (
          <button
            onClick={clearMemory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 hover:bg-red-100 transition-all self-start"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Memory</span>
          </button>
        )}
      </div>

      {/* 3 Event Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Completed Retrofit */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Completed Retrofit
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Mark a measure that has already been installed by the homeowner.
            </p>
            <select
              value={completedMeasure}
              onChange={(e) => setCompletedMeasure(e.target.value)}
              className="w-full p-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              {MEASURES_LIST.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => addEvent('completed_retrofit', { measure_id: completedMeasure })}
            className="mt-4 w-full py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record as Completed</span>
          </button>
        </div>

        {/* Card 2: Customer Constraint */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <Shield className="w-4 h-4" />
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Preferences & Limits
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Specify building limitations or financial constraints.
            </p>
            <div className="space-y-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noExternalWorks}
                  onChange={(e) => setNoExternalWorks(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span className="text-slate-700 dark:text-slate-300 font-medium">No external building works</span>
              </label>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Max Budget per Measure (£)</label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(parseFloat(e.target.value) || 0)}
                  placeholder="0 = no limit"
                  className="w-full p-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>
          <button
            onClick={() =>
              addEvent('constraint', {
                no_external_works: noExternalWorks,
                budget_max_gbp: maxBudget > 0 ? maxBudget : undefined,
              })
            }
            className="mt-4 w-full py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Save Constraint</span>
          </button>
        </div>

        {/* Card 3: Declined Measure */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                <Ban className="w-4 h-4" />
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Declined Measure
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Record measures explicitly rejected by the homeowner.
            </p>
            <select
              value={declinedMeasure}
              onChange={(e) => setDeclinedMeasure(e.target.value)}
              className="w-full p-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              {MEASURES_LIST.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => addEvent('declined', { measure_id: declinedMeasure })}
            className="mt-4 w-full py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record as Declined</span>
          </button>
        </div>
      </div>

      {/* Events Timeline */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
          Customer Memory Timeline ({events.length} Events)
        </h3>

        {events.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500">
            No memory events logged for customer {customerId} yet. Add an event above to see recommendations adapt.
          </div>
        ) : (
          <div className="space-y-2.5 font-mono text-xs">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] uppercase">
                    {evt.type.replace(/_/g, ' ')}
                  </span>
                  <span className="font-sans text-slate-800 dark:text-slate-200">
                    {JSON.stringify(evt.payload)}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {new Date(evt.created_utc).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current Active Plan Adapted by Memory */}
      {assessment && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Adapted Plan for this Home
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
              Score: {assessment.score.score} / 100
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {assessment.recommendations.map((m) => (
              <div
                key={m.measure_id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700"
              >
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {m.sequence_position}. {m.name}
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  Save {m.net_saving_kwh.toLocaleString()} kWh/yr
                </span>
              </div>
            ))}

            {assessment.previously_declined.map((m) => (
              <div
                key={m.measure_id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-amber-800 dark:text-amber-300"
              >
                <span>Previously declined: {m.name}</span>
                <span className="font-semibold text-[11px]">Filtered out</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
