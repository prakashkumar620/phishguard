import React from 'react';

export default function RiskGauge({ score, category }) {
  // Determine color palette based on risk category
  let strokeColor = '#10b981'; // safe
  let bgColor = 'rgba(16, 185, 129, 0.1)';
  let textColor = 'text-emerald-400';
  let label = 'Low Risk';

  if (category === 'high' || score >= 70) {
    strokeColor = '#ef4444';
    bgColor = 'rgba(239, 68, 68, 0.1)';
    textColor = 'text-red-400';
    label = 'High Risk';
  } else if (category === 'medium' || score >= 40) {
    strokeColor = '#f59e0b';
    bgColor = 'rgba(245, 158, 11, 0.1)';
    textColor = 'text-amber-400';
    label = 'Medium Risk';
  }

  // SVG Circular Gauge calculations
  const radius = 64;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative flex items-center justify-center w-40 h-40">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
          />
          {/* Animated progress circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center content */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className={`text-4xl font-extrabold font-mono tracking-tight ${textColor}`}>
            {score}
          </span>
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
            out of 100
          </span>
        </div>
      </div>

      <div className={`mt-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border ${
        category === 'high'
          ? 'bg-red-500/10 border-red-500/30 text-red-400'
          : category === 'medium'
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
      }`}>
        {label}
      </div>
    </div>
  );
}
