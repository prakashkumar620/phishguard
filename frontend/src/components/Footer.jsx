import React from 'react';
import { Shield, AlertTriangle, Github, Award } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800/80 bg-[#060a14] text-slate-400 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Brand info */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              <span className="text-lg font-bold text-white tracking-tight">PhishGuard</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Advanced Phishing URL Detection & Threat Intelligence Platform combining structural feature extraction, trained machine learning classification, and reputation feeds.
            </p>
            <div className="flex items-center space-x-2 text-xs text-cyan-400">
              <Award className="w-4 h-4" />
              <span>B.Tech Cyber Security Capstone Project</span>
            </div>
          </div>

          {/* Ethics & Legal Notice */}
          <div className="space-y-2 p-3 rounded-xl bg-slate-900/40 border border-slate-800">
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              <span>Cybersecurity Safety Notice</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              No URL analysis engine can guarantee 100% safety. Zero-day threats and newly registered phishing campaigns can initially bypass heuristics. Never disclose credentials or sensitive data on unverified websites.
            </p>
          </div>

          {/* Engine specifications */}
          <div className="space-y-2 md:text-right text-xs">
            <span className="text-slate-300 font-semibold block">Detection Architecture</span>
            <ul className="space-y-1 text-slate-400">
              <li>RFC 3986 Lexical & Heuristic Engine</li>
              <li>Scikit-Learn Random Forest Classifier</li>
              <li>Google Safe Browsing v4 Verification</li>
              <li>MongoDB Atlas Threat Caching & Auditing</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} PhishGuard Security. Built for Cyber Security Defense.
          </div>
          <div className="mt-2 sm:mt-0 font-mono text-[11px] text-cyan-500/80">
            Node.js • React • MongoDB Atlas • Python ML
          </div>
        </div>
      </div>
    </footer>
  );
}
