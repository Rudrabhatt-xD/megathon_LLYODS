import React from 'react';
import { ScoreClassification } from '../types';

interface ScoreGaugeProps {
  score: number;
  classification: ScoreClassification;
  status?: string;
  size?: number;
}

const CLASS_COLORS: Record<string, string> = {
  'Highly efficient': '#047857', // emerald-700
  Good: '#059669', // emerald-600
  Moderate: '#10b981', // emerald-500
  Poor: '#d97706', // amber-600
  'Very poor': '#dc2626', // red-600
  'Insufficient data': '#94a3b8',
};

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  classification,
  status = 'confirmed',
  size = 140,
}) => {
  const color = CLASS_COLORS[classification] || '#10b981';
  const radius = 52;
  const stroke = 8;
  const normalizedScore = Math.max(0, Math.min(100, score));

  // 180 degree semi-circle: circumference of semi-circle is PI * radius
  const arcLength = Math.PI * radius;
  const strokeDashoffset = arcLength - (normalizedScore / 100) * arcLength;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size * 0.65 }}>
        <svg
          viewBox="0 0 130 80"
          className="w-full h-full overflow-visible"
        >
          {/* Background Track */}
          <path
            d="M 15 70 A 50 50 0 0 1 115 70"
            fill="none"
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-700"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          {/* Active Colored Arc */}
          <path
            d="M 15 70 A 50 50 0 0 1 115 70"
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${(normalizedScore / 100) * 157} 200`}
            style={{
              transition: 'stroke-dasharray 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </svg>

        {/* Center Score Display */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center text-center">
          <div className="flex items-baseline justify-center font-mono">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {score}
            </span>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 ml-0.5">
              /100
            </span>
          </div>
        </div>
      </div>

      <div className="mt-2 text-center">
        <span
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: `${color}18`,
            color: color,
            border: `1px solid ${color}35`,
          }}
        >
          {classification}
        </span>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 capitalize font-medium">
          {status} assessment
        </div>
      </div>
    </div>
  );
};
