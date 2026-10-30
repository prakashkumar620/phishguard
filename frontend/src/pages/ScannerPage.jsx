import React, { useState } from 'react';
import { 
  Shield, Search, AlertCircle, Sparkles, Terminal, CheckCircle2, 
  ArrowRight, RefreshCw, Zap, ShieldAlert, Cpu, Lock, Skull 
} from 'lucide-react';
import api from '../api/client';
import ScanResultCard from '../components/ScanResultCard';

export default function ScannerPage() {
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanStep, setScanStep] = useState('');
  const [error, setError] = useState('');
  const [currentResult, setCurrentResult] = useState(null);

  const sampleUrls = [
    { label: 'Legitimate Site', url: 'https://www.wikipedia.org/wiki/Computer_security', type: 'safe' },
    { label: 'Ransomware (.iso)', url: 'http://secure-invoice-download.xyz/invoice_2026_payment.iso', type: 'danger' },
    { label: 'InfoStealer (.exe)', url: 'http://chrome-update-service.top/browser_installer.exe', type: 'danger' },
    { label: 'Weaponized Doc (.docm)', url: 'http://corporate-bonus-payroll.click/employee_bonus.docm', type: 'danger' },
    { label: 'Mobile Trojan (.apk)', url: 'http://bank-security-mfa-authenticator.click/banking_update.apk', type: 'danger' },
    { label: 'Shell Stager (.ps1)', url: 'http://windows-hotfix-deploy.work/security_patch.ps1', type: 'danger' },
    { label: 'Brand Spoofing', url: 'http://paypal.verify-account-security.xyz/login.php', type: 'warning' },
    { label: 'URL Shortener', url: 'https://bit.ly/3x8AbC', type: 'warning' }
  ];

  const handleScan = async (e) => {
    if (e) e.preventDefault();
    if (!urlInput.trim()) return;

    setError('');
    setCurrentResult(null);
    setLoading(true);

    try {
      setScanStep('Validating RFC 3986 format & decoding Punycode IDN...');
      await new Promise(r => setTimeout(r, 200));

      setScanStep('Extracting lexical & structural security features...');
      await new Promise(r => setTimeout(r, 180));

      setScanStep('Profiling payload file forensics & victim harm assessment...');
      await new Promise(r => setTimeout(r, 180));

      setScanStep('Evaluating heuristic rules & machine learning inference...');
      const response = await api.post('/scans', { url: urlInput.trim() });

      if (response.data.success) {
        setCurrentResult(response.data.data);
      } else {
        setError(response.data.message || 'Scan could not be completed.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Analysis failed: Please ensure the URL is formatted correctly and the server is running.'
      );
    } finally {
      setLoading(false);
      setScanStep('');
    }
  };

  const handleSampleClick = (sampleUrl) => {
    setUrlInput(sampleUrl);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Multi-Engine Phishing URL Scanner</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Analyze Any URL for <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent">
            Phishing & Deceptive Indicators
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          Deep lexical inspection, machine learning feature extraction, and threat intelligence checks to classify suspicious links before user compromise.
        </p>
      </div>

      {/* URL Submission Form */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <form onSubmit={handleScan} className="space-y-4">
          <div className="relative flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                <Search className="w-5 h-5 text-cyan-400" />
              </div>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Enter URL to inspect (e.g., https://example.com/login or paste a suspicious link)"
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-950/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm sm:text-base focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition font-mono"
                disabled={loading}
                required
              />
              {urlInput && (
                <button
                  type="button"
                  onClick={() => setUrlInput('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs text-slate-500 hover:text-slate-300"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !urlInput.trim()}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm sm:text-base shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition flex items-center justify-center space-x-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Scan URL</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Demo Samples */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs text-slate-400 font-medium">Test Samples:</span>
            {sampleUrls.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSampleClick(sample.url)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                  sample.type === 'danger'
                    ? 'bg-red-950/30 border-red-800/50 text-red-300 hover:bg-red-900/40'
                    : sample.type === 'warning'
                    ? 'bg-amber-950/30 border-amber-800/50 text-amber-300 hover:bg-amber-900/40'
                    : 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300 hover:bg-emerald-900/40'
                }`}
              >
                {sample.label}
              </button>
            ))}
          </div>
        </form>

        {/* Scanning step animated feedback */}
        {loading && (
          <div className="mt-6 pt-6 border-t border-slate-800 flex items-center space-x-3 text-cyan-400 text-xs font-mono animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
            <span>{scanStep || 'Executing security inspection...'}</span>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-start space-x-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Scan Error</span>
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Scan Results Display */}
      {currentResult && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-cyan-400" />
              <span>Inspection Report</span>
            </h2>
          </div>

          <ScanResultCard scan={currentResult} />
        </div>
      )}

      {/* Architecture Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 pt-6">
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400 mb-2">
            <Terminal className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">Rule Heuristics</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Extracts Shannon entropy, URL/host lengths, subdomains, brand patterns, and credential lures.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-purple-950 border border-purple-800/60 flex items-center justify-center text-purple-400 mb-2">
            <Cpu className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">Machine Learning</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Random Forest ensemble classifies non-linear lexical feature distributions to estimate phishing probability.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-950 border border-blue-800/60 flex items-center justify-center text-blue-400 mb-2">
            <Lock className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">Threat Intel</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Correlates target hashes against Safe Browsing reputation feeds with SHA-256 caching and TTL expiration.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-red-950 border border-red-800/60 flex items-center justify-center text-red-400 mb-2">
            <Skull className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">Threat Harm & MITRE</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Detects payload file extensions (.iso, .exe, .docm, .apk), details victim harm, and maps MITRE ATT&CK techniques.
          </p>
        </div>
      </div>
    </div>
  );
}
