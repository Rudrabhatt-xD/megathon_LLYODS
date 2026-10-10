import React, { useEffect, useState } from 'react';
import {
  Building2,
  AlertTriangle,
  Leaf,
  Wind,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { KpiCard } from '../components/KpiCard';
import { PortfolioSummaryStats } from '../types';
import { DEMO_PROPERTIES } from '../engine/demoProperties';
import { runFullAssessment } from '../engine/scoring';

interface PortfolioPageProps {
  onSelectProperty: (id: string) => void;
}

const FALLBACK_ITEMS = DEMO_PROPERTIES.map((p) => {
  const assessment = runFullAssessment(p);
  return {
    property_id: p.property_id,
    property_type: p.property_type,
    region: p.region,
    score: assessment.score.score,
    classification: assessment.score.classification,
    improvement_potential_pct: assessment.package.saving_pct,
    carbon_reduction_kg: assessment.package.carbon_reduction_kg,
    top_issue: assessment.issues[0]?.text || 'Fabric heat loss',
  };
});

export const PortfolioPage: React.FC<PortfolioPageProps> = ({ onSelectProperty }) => {
  const [summary, setSummary] = useState<PortfolioSummaryStats | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [onlyAttention, setOnlyAttention] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 50;

  useEffect(() => {
    // Fetch summary once
    fetch('/api/portfolio/summary')
      .then((r) => r.json())
      .then((data) => setSummary(data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (onlyAttention && !selectedClass) {
      params.append('classification', 'Poor');
      params.append('classification', 'Very poor');
    } else if (selectedClass) {
      params.append('classification', selectedClass);
    }
    if (selectedRegion) params.append('region', selectedRegion);
    if (selectedType) params.append('property_type', selectedType);
    if (searchQuery) params.append('search', searchQuery);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    fetch(`/api/portfolio?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items && data.items.length > 0 ? data.items : FALLBACK_ITEMS);
        setTotalCount(data.total || FALLBACK_ITEMS.length);
      })
      .catch((err) => {
        console.warn('Portfolio fetch failed:', err);
        setItems(FALLBACK_ITEMS);
        setTotalCount(FALLBACK_ITEMS.length);
      })
      .finally(() => setIsLoading(false));
  }, [onlyAttention, selectedClass, selectedRegion, selectedType, searchQuery, offset]);

  const CLASS_COLORS: Record<string, string> = {
    'Highly efficient': 'bg-emerald-700 text-white',
    Good: 'bg-emerald-600 text-white',
    Moderate: 'bg-emerald-500 text-white',
    Poor: 'bg-amber-600 text-white',
    'Very poor': 'bg-red-600 text-white',
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Property Portfolio Intelligence
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enterprise analytics identifying properties with the greatest retrofit potential across 5,000 homes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            Synthetic Portfolio Active
          </span>
        </div>
      </div>

      {/* 4 Portfolio KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Portfolio Properties"
          icon={Building2}
          value={summary?.n_properties.toLocaleString() || '5,000'}
          subText="Synthetic properties in book"
          footer="Synthetic world seed 42"
          tone="neutral"
        />

        <KpiCard
          title="Homes Needing Attention"
          icon={AlertTriangle}
          value={summary?.flagged_count.toLocaleString() || '1,420'}
          unit={summary ? `(${Math.round(summary.flagged_share * 100)}%)` : ''}
          subText="Poor and Very Poor bands"
          footer="Target group for green lending support"
          tone="warn"
        />

        <KpiCard
          title="Portfolio Median Score"
          icon={Leaf}
          value={summary?.median_score || 56}
          unit="/ 100"
          subText="Green Home Score median"
          footer="Weighted across 7 components"
          tone="good"
        />

        <KpiCard
          title="Carbon Abatement Potential"
          icon={Wind}
          value={summary?.total_carbon_reduction_t.toLocaleString() || '4,850'}
          unit="t CO2e / yr"
          subText="Feasible package sum"
          footer="Operational Scope 1 & 2 emissions"
          tone="good"
        />
      </div>

      {/* Score Distribution Bars */}
      {summary?.class_counts && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Score Distribution by Classification Band
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Total {summary.n_properties.toLocaleString()} homes
            </span>
          </div>

          <div className="grid grid-cols-5 gap-3">
            {Object.entries(summary.class_counts).map(([cls, count]) => {
              const pct = Math.round((count / Math.max(1, summary.n_properties)) * 100);
              return (
                <div key={cls} className="space-y-1.5 text-center">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                    {cls}
                  </div>
                  <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex flex-col justify-end p-1">
                    <div
                      className={`w-full rounded-lg ${CLASS_COLORS[cls] || 'bg-slate-500'} transition-all duration-500`}
                      style={{ height: `${Math.max(15, pct * 1.8)}%` }}
                    />
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                    {count.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {pct}% of book
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Attention toggle */}
          <button
            onClick={() => {
              setOnlyAttention(!onlyAttention);
              setSelectedClass('');
              setOffset(0);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              onlyAttention && !selectedClass
                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            {onlyAttention && !selectedClass ? 'Showing Homes Needing Attention' : 'Show All Homes'}
          </button>

          {/* Classification Dropdown */}
          <select
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setOffset(0);
            }}
            className="px-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium"
          >
            <option value="">All Classifications</option>
            <option value="Poor">Poor</option>
            <option value="Very poor">Very poor</option>
            <option value="Moderate">Moderate</option>
            <option value="Good">Good</option>
            <option value="Highly efficient">Highly efficient</option>
          </select>

          {/* Region Dropdown */}
          <select
            value={selectedRegion}
            onChange={(e) => {
              setSelectedRegion(e.target.value);
              setOffset(0);
            }}
            className="px-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium"
          >
            <option value="">All Regions</option>
            <option value="east_of_england">East of England</option>
            <option value="south_east">South East</option>
            <option value="london">London</option>
            <option value="south_west">South West</option>
            <option value="west_midlands">West Midlands</option>
            <option value="east_midlands">East Midlands</option>
            <option value="yorkshire_humber">Yorkshire & Humber</option>
            <option value="north_west">North West</option>
            <option value="north_east">North East</option>
            <option value="wales">Wales</option>
            <option value="scotland">Scotland</option>
          </select>

          {/* Type Dropdown */}
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setOffset(0);
            }}
            className="px-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium"
          >
            <option value="">All Types</option>
            <option value="semi_detached">Semi-Detached</option>
            <option value="detached">Detached</option>
            <option value="mid_terrace">Mid-Terrace</option>
            <option value="end_terrace">End-Terrace</option>
            <option value="bungalow">Bungalow</option>
            <option value="flat">Flat</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setOffset(0);
            }}
            placeholder="Search property ID..."
            className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Interactive Ranked Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-900 dark:text-white">{items.length}</strong> of{' '}
            <strong className="text-slate-900 dark:text-white">{totalCount.toLocaleString()}</strong> matching homes
            (ranked by improvement potential)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-[11px]">
              Page {Math.floor(offset / limit) + 1}
            </span>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= totalCount}
              className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase text-slate-500">
                <th className="py-3 px-4">Property</th>
                <th className="py-3 px-3">Archetype</th>
                <th className="py-3 px-3">Region</th>
                <th className="py-3 px-3">Green Score</th>
                <th className="py-3 px-3">Class</th>
                <th className="py-3 px-3">Improvement Potential</th>
                <th className="py-3 px-3">Carbon Abatement</th>
                <th className="py-3 px-3">Top Issue</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {items.map((row) => (
                <tr
                  key={row.property_id}
                  onClick={() => onSelectProperty(row.property_id)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group"
                >
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white font-mono">
                    {row.property_id}
                  </td>
                  <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-sans capitalize">
                    {row.property_type?.replace(/_/g, ' ')}
                  </td>
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-sans capitalize">
                    {row.region?.replace(/_/g, ' ')}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                    {row.score} / 100
                  </td>
                  <td className="py-3 px-3 font-sans">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        row.classification === 'Poor' || row.classification === 'Very poor'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                      }`}
                    >
                      {row.classification}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                    +{row.improvement_potential_pct}%
                  </td>
                  <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                    -{Math.round(row.carbon_reduction_kg || 0).toLocaleString()} kg
                  </td>
                  <td className="py-3 px-3 font-sans text-slate-600 dark:text-slate-400 text-[11px] truncate max-w-[150px]">
                    {row.top_issue}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-emerald-600 dark:text-emerald-400 font-sans font-bold text-xs group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      <span>Assess</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
