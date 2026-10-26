import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, Terminal, Cpu, Database, ArrowRight, CheckCircle, 
  AlertTriangle, Lock, ShieldCheck, Zap, Activity, ExternalLink 
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="space-y-24 py-12">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-800 text-cyan-300 text-xs font-semibold">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>Next-Generation Phishing Defense Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Detect Malicious URLs with <br />
          <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent">
            Multi-Tier Intelligence
          </span>
        </h1>

        <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          PhishGuard combines RFC 3986 safe URL parsing, 15+ heuristic detection indicators, trained Scikit-Learn machine learning, and Google Safe Browsing reputation feeds.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            to="/scanner"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-base shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition flex items-center justify-center space-x-2 group"
          >
            <span>Launch Live URL Scanner</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            to="/analytics"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-base transition flex items-center justify-center space-x-2"
          >
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Threat Analytics</span>
          </Link>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Terminal className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Rule-Based Feature Extraction</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Analyzes Shannon entropy, subdomain tunneling, numeric IP hostnames, high-risk TLDs, and sensitive credential lures.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-2xl bg-purple-950/80 border border-purple-800 flex items-center justify-center text-purple-400">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Machine Learning Classification</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Trained supervised models (Random Forest & Logistic Regression) providing calibrated probabilistic risk predictions.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-2xl bg-blue-950/80 border border-blue-800 flex items-center justify-center text-blue-400">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Threat Intelligence Integration</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Optional Google Safe Browsing API v4 connector with SHA-256 caching and MongoDB TTL auto-purging.
            </p>
          </div>
        </div>
      </section>

      {/* Security Principles Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/30 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Transparent, Auditable Explanations
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Unlike black-box detectors that give opaque binary labels, PhishGuard outlines every detected indicator, severity weight, and detection source for complete forensic auditability.
            </p>
          </div>
          <Link
            to="/scanner"
            className="px-6 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition shrink-0"
          >
            Start Analyzing Now
          </Link>
        </div>
      </section>
    </div>
  );
}
