import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Activity, ShieldAlert, ShieldCheck, TrendingUp, 
  Globe, AlertTriangle, RefreshCw 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, BarChart, Bar 
} from 'recharts';
import api from '../api/client';

export default function AnalyticsPage() {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const [sumRes, trendRes] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/analytics/trends')
      ]);

      if (sumRes.data.success) setSummary(sumRes.data.data);
      if (trendRes.data.success) setTrends(trendRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load threat intelligence analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const pieData = summary ? [
    { name: 'Low Risk', value: summary.riskDistribution.low.count, color: '#10b981' },
    { name: 'Medium Risk', value: summary.riskDistribution.medium.count, color: '#f59e0b' },
    { name: 'High Risk', value: summary.riskDistribution.high.count, color: '#ef4444' }
  ].filter(d => d.value > 0) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center space-x-3">
            <BarChart3 className="w-7 h-7 text-cyan-400" />
            <span>Threat Intelligence & Analytics</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time aggregate telemetry of scanned URLs, heuristic indicator triggers, and risk profiles.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3 text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
          <span className="text-sm">Calculating security metrics...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs">
          {error}
        </div>
      ) : (
        <>
          {/* Key Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
                <span>Total Inspected URLs</span>
                <Globe className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-3xl font-extrabold text-white font-mono">
                {summary?.totalScans || 0}
              </div>
              <p className="text-[11px] text-slate-500">Across all heuristic & ML scans</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
                <span>Average Risk Score</span>
                <Activity className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-3xl font-extrabold text-white font-mono">
                {summary?.averageRiskScore || 0}<span className="text-sm font-normal text-slate-500">/100</span>
              </div>
              <p className="text-[11px] text-slate-500">Calculated composite severity</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
                <span>High-Risk Phishing Lures</span>
                <ShieldAlert className="w-4 h-4 text-red-400" />
              </div>
              <div className="text-3xl font-extrabold text-red-400 font-mono">
                {summary?.riskDistribution.high.count || 0}
                <span className="text-sm font-normal text-slate-500 ml-2">
                  ({summary?.riskDistribution.high.percentage || 0}%)
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Critical threats identified</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
                <span>Low-Risk Assessments</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-extrabold text-emerald-400 font-mono">
                {summary?.riskDistribution.low.count || 0}
                <span className="text-sm font-normal text-slate-500 ml-2">
                  ({summary?.riskDistribution.low.percentage || 0}%)
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Standard conformant URLs</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Temporal Scan Volume (Area Chart) */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    <span>Scan Activity (Last 7 Days)</span>
                  </h3>
                  <p className="text-xs text-slate-400">Total scans vs high-risk detections</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends?.dailyTrends || []}>
                    <defs>
                      <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#64748b" textAnchor="end" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="scans" name="Total Scans" stroke="#06b6d4" fillOpacity={1} fill="url(#colorScans)" />
                    <Area type="monotone" dataKey="highRisk" name="High Risk" stroke="#ef4444" fillOpacity={1} fill="url(#colorHigh)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Risk Distribution (Pie Chart) */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Risk Distribution</h3>
                <p className="text-xs text-slate-400">Proportional classification breakdown</p>
              </div>

              <div className="h-56 w-full flex items-center justify-center">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={5}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <span className="text-xs text-slate-500">No scan data to chart</span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-slate-800">
                <div>
                  <span className="block text-emerald-400 font-bold">{summary?.riskDistribution.low.count || 0}</span>
                  <span className="text-[10px] text-slate-400">Low</span>
                </div>
                <div>
                  <span className="block text-amber-400 font-bold">{summary?.riskDistribution.medium.count || 0}</span>
                  <span className="text-[10px] text-slate-400">Medium</span>
                </div>
                <div>
                  <span className="block text-red-400 font-bold">{summary?.riskDistribution.high.count || 0}</span>
                  <span className="text-[10px] text-slate-400">High</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tables Row: Flagged Domains & Top Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Flagged Domains */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Globe className="w-4 h-4 text-amber-400" />
                <span>Frequently Flagged Hostnames</span>
              </h3>

              {trends?.topFlaggedDomains?.length > 0 ? (
                <div className="space-y-2">
                  {trends.topFlaggedDomains.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs font-mono"
                    >
                      <span className="text-cyan-300 font-medium truncate max-w-xs">{item.domain}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {item.count} scans
                        </span>
                        <span className="text-red-400 font-bold">
                          Score {item.maxScore}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-4">No suspicious hostnames flagged yet.</p>
              )}
            </div>

            {/* Top Indicators */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-cyan-400" />
                <span>Most Prevalent Heuristic Signals</span>
              </h3>

              {trends?.topIndicators?.length > 0 ? (
                <div className="space-y-2">
                  {trends.topIndicators.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
                    >
                      <span className="text-slate-200 font-medium">{item.name}</span>
                      <span className="text-cyan-400 font-mono font-semibold bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
                        {item.count} detections
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-4">No indicators triggered yet.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
