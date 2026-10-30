import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Globe, Clock, ShieldAlert, ShieldCheck, Shield, ExternalLink, 
  Copy, Check, BrainCircuit, Database, Flag 
} from 'lucide-react';
import RiskGauge from './RiskGauge';
import IndicatorList from './IndicatorList';
import ThreatHarmDetails from './ThreatHarmDetails';
import api from '../api/client';

export default function ScanResultCard({ scan, onFeedbackSubmitted }) {
  const [copied, setCopied] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState('false_positive');
  const [feedbackDescription, setFeedbackDescription] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');

  if (!scan) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(scan.normalizedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackDescription.trim()) return;

    setSubmittingFeedback(true);
    setFeedbackError('');
    try {
      await api.post('/feedback', {
        scanId: scan._id,
        feedbackType,
        description: feedbackDescription.trim()
      });
      setFeedbackSuccess(true);
      setTimeout(() => {
        setShowFeedbackModal(false);
        setFeedbackSuccess(false);
        setFeedbackDescription('');
        if (onFeedbackSubmitted) onFeedbackSubmitted();
      }, 1800);
    } catch (err) {
      setFeedbackError(err.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const isHigh = scan.riskCategory === 'high';
  const isMedium = scan.riskCategory === 'medium';

  return (
    <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden transition">
      {/* Top ambient highlight gradient */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${
        isHigh ? 'bg-gradient-to-r from-red-600 via-rose-500 to-red-600' :
        isMedium ? 'bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500' :
        'bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500'
      }`} />

      {/* Header with URL & Category */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span className="font-mono text-sm font-semibold text-cyan-300">
              {scan.hostname}
            </span>
          </div>

          <div className="flex items-center space-x-2 group">
            <span className="font-mono text-xs text-slate-300 break-all bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 max-w-xl">
              {scan.normalizedUrl}
            </span>
            <button
              onClick={handleCopy}
              title="Copy normalized URL"
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Timestamp & Action Badges */}
        <div className="flex flex-wrap items-center gap-3">
          {scan.threatProfile?.threatCategory && scan.threatProfile?.hasThreatProfile && (
            <div className="flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-800/80 text-red-300">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>{scan.threatProfile.threatCategory.split('/')[0]}</span>
            </div>
          )}

          <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-mono bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{new Date(scan.scannedAt).toLocaleString()}</span>
          </div>

          <button
            onClick={() => setShowFeedbackModal(true)}
            className="flex items-center space-x-1.5 text-xs font-medium text-slate-300 hover:text-cyan-400 bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Report False Assessment</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Gauge + Summary + Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
        {/* Left Column: Risk Gauge & Detection Methods */}
        <div className="flex flex-col items-center justify-center bg-slate-950/60 rounded-xl p-5 border border-slate-800/80">
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-400 mb-1">
            Aggregated Risk Score
          </span>

          <RiskGauge score={scan.riskScore} category={scan.riskCategory} />

          {/* Engines Used */}
          <div className="w-full mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-xs">
            <span className="text-slate-400 font-medium block">Detection Engines Applied:</span>
            <div className="flex flex-wrap gap-1.5">
              {(scan.detectionMethods || ['rule-based']).map(method => (
                <span
                  key={method}
                  className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50 text-cyan-300 font-mono text-[11px]"
                >
                  {method}
                </span>
              ))}
            </div>

            {/* Model & Threat Intel Status Pills */}
            <div className="pt-2 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center space-x-1">
                  <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
                  <span>ML Classifier:</span>
                </span>
                <span className="font-mono text-purple-300">
                  {scan.modelPrediction ? `${scan.modelPrediction} (${Math.round((scan.modelConfidence || 0) * 100)}%)` : 'Standby / Evaluated'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center space-x-1">
                  <Database className="w-3.5 h-3.5 text-blue-400" />
                  <span>Threat Intel:</span>
                </span>
                <span className="font-mono text-blue-300">
                  {scan.threatIntelStatus || 'Unmatched'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Explanation & Detailed Indicator List */}
        <div className="lg:col-span-2 space-y-5">
          {/* Plain language explanation */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Assessment Analysis
            </span>
            <p className="text-sm text-slate-300 leading-relaxed">
              {scan.explanation}
            </p>
          </div>

          {/* Indicators list */}
          <IndicatorList indicators={scan.indicators} />
        </div>
      </div>

      {/* Deep Threat Vector Forensics & Harm Assessment */}
      {scan.threatProfile && (
        <div className="mt-6 pt-6 border-t border-slate-800">
          <ThreatHarmDetails threatProfile={scan.threatProfile} />
        </div>
      )}

      {/* Footer link to scan detail page */}
      {scan._id && (
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <Link
            to={`/scans/${scan._id}`}
            className="flex items-center space-x-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition"
          >
            <span>View Permanent Audit Report</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* False Positive / Negative Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Flag className="w-5 h-5 text-cyan-400" />
              <span>Report Assessment Inaccuracy</span>
            </h3>

            <p className="text-xs text-slate-400">
              User reports help our machine learning and heuristics team audit false positives or false negatives. Reports are reviewed by administrators before retraining models.
            </p>

            {feedbackSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-sm flex items-center space-x-2">
                <Check className="w-5 h-5 text-emerald-400" />
                <span>Thank you! Your report has been logged for security review.</span>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                {feedbackError && (
                  <div className="p-3 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-xs">
                    {feedbackError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Feedback Classification
                  </label>
                  <select
                    value={feedbackType}
                    onChange={(e) => setFeedbackType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="false_positive">False Positive (Legitimate site flagged as suspicious)</option>
                    <option value="false_negative">False Negative (Malicious site scored as low risk)</option>
                    <option value="incorrect_indicator">Incorrect Indicator Triggered</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Explanation / Evidence
                  </label>
                  <textarea
                    rows={4}
                    value={feedbackDescription}
                    onChange={(e) => setFeedbackDescription(e.target.value)}
                    placeholder="Describe why this URL assessment is inaccurate (e.g., official domain belonging to organization, verified benign test link, etc.)..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowFeedbackModal(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingFeedback}
                    className="px-5 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white transition disabled:opacity-50"
                  >
                    {submittingFeedback ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
