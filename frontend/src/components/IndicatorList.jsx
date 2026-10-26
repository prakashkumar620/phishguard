import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

export default function IndicatorList({ indicators = [] }) {
  if (!indicators || indicators.length === 0) {
    return (
      <div className="flex items-center space-x-3 p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-emerald-300">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        <div>
          <h4 className="text-sm font-semibold text-emerald-300">No Heuristic Anomalies Detected</h4>
          <p className="text-xs text-emerald-400/80">
            The URL conforms to standard lexical formatting and did not trigger known phishing indicator rules.
          </p>
        </div>
      </div>
    );
  }

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'critical':
        return {
          icon: <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />,
          badge: 'bg-red-500/15 text-red-400 border-red-500/30',
          border: 'border-red-900/40 bg-red-950/10'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
          badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          border: 'border-amber-900/40 bg-amber-950/10'
        };
      default:
        return {
          icon: <Info className="w-4 h-4 text-cyan-400 shrink-0" />,
          badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
          border: 'border-cyan-900/40 bg-cyan-950/10'
        };
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-400 pb-1 border-b border-slate-800">
        <span>Detected Indicators ({indicators.length})</span>
        <span>Severity & Impact</span>
      </div>

      <div className="space-y-2">
        {indicators.map((ind, idx) => {
          const config = getSeverityBadge(ind.severity);
          return (
            <div
              key={ind.id || idx}
              className={`p-3.5 rounded-xl border ${config.border} flex flex-col sm:flex-row sm:items-start justify-between gap-3 transition hover:border-slate-700`}
            >
              <div className="flex items-start space-x-3">
                <div className="mt-0.5">{config.icon}</div>
                <div>
                  <h5 className="text-sm font-medium text-slate-100 flex items-center space-x-2">
                    <span>{ind.name}</span>
                    <span className="font-mono text-[10px] text-slate-500 uppercase">
                      [{ind.id}]
                    </span>
                  </h5>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    {ind.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0 self-start sm:self-auto">
                <span className={`text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full border ${config.badge}`}>
                  {ind.severity}
                </span>
                <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  +{ind.weight} pts
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
