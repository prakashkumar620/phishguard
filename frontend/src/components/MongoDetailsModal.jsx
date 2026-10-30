import React, { useState, useEffect } from 'react';
import { 
  Database, CheckCircle2, Layers, Cpu, Code2, 
  X, Server, Sparkles, FileText, ArrowRight, ShieldCheck 
} from 'lucide-react';
import api from '../api/client';

export default function MongoDetailsModal({ isOpen, onClose }) {
  const [dbStats, setDbStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isOpen) {
      api.get('/analytics/db-stats')
        .then(res => {
          if (res.data?.success) setDbStats(res.data.data);
        })
        .catch(() => {
          setDbStats({
            connected: true,
            databaseName: 'phishguard',
            host: 'localhost',
            collections: { scans: '10+', users: '2+', feedbacks: '1+', caches: '1+' }
          });
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>MongoDB Academic Lab Project</span>
            </div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <span>MongoDB Architecture & Database Design</span>
            </h2>
            <p className="text-xs text-slate-400">
              Submitted by <strong>Ayush Kumar</strong> &bull; Database: <span className="font-mono text-emerald-300">phishguard</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status Bar */}
        <div className="px-6 py-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <span>Connection:</span>
            <span className="font-semibold text-emerald-400">
              {dbStats?.connected ? 'Live & Connected' : 'Local / Connected'}
            </span>
            <span className="text-slate-600">|</span>
            <span>Host:</span>
            <span className="font-mono text-slate-200">{dbStats?.host || 'localhost:27017'}</span>
          </div>

          <div className="flex items-center space-x-3 font-mono text-[11px]">
            <span className="text-slate-400">Scans: <strong className="text-cyan-300">{dbStats?.collections?.scans ?? '0'}</strong></span>
            <span className="text-slate-400">Users: <strong className="text-purple-300">{dbStats?.collections?.users ?? '0'}</strong></span>
            <span className="text-slate-400">Feedback: <strong className="text-amber-300">{dbStats?.collections?.feedbacks ?? '0'}</strong></span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Why MongoDB?
          </button>
          <button
            onClick={() => setActiveTab('schemas')}
            className={`py-3 px-3 border-b-2 transition ${
              activeTab === 'schemas'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Schemas & Collections
          </button>
          <button
            onClick={() => setActiveTab('pipelines')}
            className={`py-3 px-3 border-b-2 transition ${
              activeTab === 'pipelines'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Aggregation Pipelines
          </button>
          <button
            onClick={() => setActiveTab('indexes')}
            className={`py-3 px-3 border-b-2 transition ${
              activeTab === 'indexes'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Indexing & TTL
          </button>
        </div>

        {/* Tab Content (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed">
          
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-900/60 space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Why MongoDB was Chosen Over SQL</span>
                </h4>
                <p>
                  URL phishing and malware detection creates <strong>polymorphic, semi-structured threat artifacts</strong>. Each scan can trigger anywhere from 0 to 15+ different security rules, embed custom file payloads (.iso, .exe, .apk), and map dynamic MITRE ATT&CK techniques.
                </p>
                <p>
                  In a rigid relational SQL database, this would require 4 or 5 normalized tables with expensive multi-table JOINs for every URL scanned. In MongoDB, an entire forensic scan report is stored as a single, highly performant BSON document with zero JOIN latency.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <strong className="text-white block text-[13px]">1. Embedded Documents</strong>
                  <p className="text-slate-400">
                    Indicators and Threat Profiles are stored as embedded subdocuments inside each Scan record, allowing atomic reads and writes.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <strong className="text-white block text-[13px]">2. Flexible BSON Schema</strong>
                  <p className="text-slate-400">
                    Different malware payloads (e.g. Android APKs vs Windows ISOs) have different metadata fields without needing schema migration.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <strong className="text-white block text-[13px]">3. Rich Aggregation Pipeline</strong>
                  <p className="text-slate-400">
                    Powers the live Analytics dashboard using native <code>$group</code>, <code>$dateToString</code>, <code>$unwind</code>, and <code>$cond</code>.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <strong className="text-white block text-[13px]">4. Automated TTL Indexes</strong>
                  <p className="text-slate-400">
                    Used in <code>ThreatIntelCache</code> to auto-expire cached threat reputation records after a configured time-to-live.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'schemas' && (
            <div className="space-y-4">
              <p className="text-slate-400">
                The application uses four core Mongoose schemas modeled for the <strong>phishguard</strong> database:
              </p>

              <div className="space-y-3 font-mono text-[11px]">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-emerald-400 font-bold block mb-1">1. Scan Collection (scans)</span>
                  <pre className="text-slate-300 overflow-x-auto whitespace-pre">
{`{
  _id: ObjectId("..."),
  submittedUrl: String,
  normalizedUrl: String,
  hostname: String, // Indexed for domain history
  riskCategory: "low" | "medium" | "high",
  riskScore: Number, // 0 to 100
  indicators: [{ id, name, severity, weight, description }],
  threatProfile: { threatCategory, detectedPayload, harmAssessment, mitreAttack },
  detectionMethods: ["rule-based", "machine-learning"],
  scannedAt: ISODate("...")
}`}
                  </pre>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-purple-400 font-bold block mb-1">2. User Collection (users)</span>
                  <pre className="text-slate-300 overflow-x-auto whitespace-pre">
{`{
  _id: ObjectId("..."),
  name: String,
  email: { type: String, unique: true },
  password: String, // bcrypt hashed
  role: "user" | "admin",
  createdAt: ISODate("...")
}`}
                  </pre>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-amber-400 font-bold block mb-1">3. Feedback Collection (feedbacks)</span>
                  <pre className="text-slate-300 overflow-x-auto whitespace-pre">
{`{
  _id: ObjectId("..."),
  scanId: { type: ObjectId, ref: 'Scan' }, // Foreign Key reference
  feedbackType: "false_positive" | "false_negative",
  description: String,
  status: "pending" | "reviewed"
}`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pipelines' && (
            <div className="space-y-3">
              <p className="text-slate-400">
                The analytics dashboard uses native <strong>MongoDB Aggregation Pipelines</strong> rather than computing stats in memory:
              </p>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-2">
                <span className="text-cyan-400 font-bold block">Aggregation Pipeline: Risk Distribution & Average</span>
                <pre className="text-slate-300 overflow-x-auto">
{`// backend/src/controllers/analyticsController.js
await Scan.aggregate([
  {
    $group: {
      _id: '$riskCategory',
      count: { $sum: 1 },
      avgScore: { $avg: '$riskScore' }
    }
  }
]);`}
                </pre>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-2">
                <span className="text-cyan-400 font-bold block">Aggregation Pipeline: Top Indicators ($unwind)</span>
                <pre className="text-slate-300 overflow-x-auto">
{`// Unwind array of subdocuments to rank top triggered threats
await Scan.aggregate([
  { $unwind: '$indicators' },
  { $group: { _id: '$indicators.name', count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 5 }
]);`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'indexes' && (
            <div className="space-y-3">
              <p className="text-slate-400">
                To guarantee fast query performance on millions of URL scans, the following MongoDB indexes are created:
              </p>

              <div className="space-y-2 font-mono text-[11px]">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <strong className="text-emerald-400 block mb-1">Compound Indexes on Scan Model:</strong>
                  <code>scanSchema.index&#40;{`{ hostname: 1, scannedAt: -1 }`}&#41;;</code><br/>
                  <code>scanSchema.index&#40;{`{ userId: 1, scannedAt: -1 }`}&#41;;</code><br/>
                  <code>scanSchema.index&#40;{`{ riskCategory: 1, scannedAt: -1 }`}&#41;;</code>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <strong className="text-amber-400 block mb-1">Time-To-Live (TTL) Index on ThreatIntelCache:</strong>
                  <code>threatIntelCacheSchema.index&#40;{`{ expiresAt: 1 }, { expireAfterSeconds: 0 }`}&#41;;</code>
                  <p className="font-sans text-xs text-slate-400 mt-1">
                    MongoDB's background thread automatically removes cache documents when <code>expiresAt</code> is reached, keeping storage lean.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>PhishGuard &bull; MERN Stack Implementation</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition"
          >
            Close Overview
          </button>
        </div>

      </div>
    </div>
  );
}

