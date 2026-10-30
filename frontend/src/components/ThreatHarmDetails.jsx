import React, { useState } from 'react';
import { 
  ShieldAlert, AlertTriangle, FileWarning, HardDrive, Terminal, 
  ExternalLink, Lock, CheckCircle2, Smartphone, Laptop, 
  Zap, Shield, Skull, Bug, Key, ChevronDown, ChevronUp, Check,
  ShieldCheck, AlertOctagon
} from 'lucide-react';

export default function ThreatHarmDetails({ threatProfile }) {
  const [expandedMitre, setExpandedMitre] = useState(true);
  const [expandedSteps, setExpandedSteps] = useState(true);
  const [checkedSteps, setCheckedSteps] = useState({});

  if (!threatProfile) return null;

  const {
    hasThreatProfile,
    threatCategory,
    severity,
    targetPlatform,
    detectedPayload,
    harmAssessment,
    mitreAttack = [],
    remediationSteps = []
  } = threatProfile;

  const toggleStep = (index) => {
    setCheckedSteps(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // Safe / Benign State
  if (severity === 'low' || !hasThreatProfile) {
    return (
      <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-slate-400 space-y-2">
        <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Payload & Threat Vector Forensics</span>
        </div>
        <p className="text-xs text-slate-300">
          No malicious executable, container, script, macro payload, or aggressive credential lure vectors were detected on this target URL.
        </p>
      </div>
    );
  }

  const isCritical = severity === 'critical';
  const isHigh = severity === 'high';

  return (
    <div className="rounded-2xl border border-red-900/40 bg-gradient-to-b from-slate-950 via-slate-900/90 to-slate-950 p-5 shadow-2xl space-y-6 text-slate-200">
      
      {/* 1. Threat Classification Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase ${
              isCritical ? 'bg-red-950/80 border border-red-600/70 text-red-400 animate-pulse' :
              isHigh ? 'bg-orange-950/80 border border-orange-600/70 text-orange-400' :
              'bg-amber-950/80 border border-amber-600/70 text-amber-400'
            }`}>
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>{severity.toUpperCase()} THREAT DETECTED</span>
            </span>

            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-slate-800/80 border border-slate-700 text-slate-300">
              {targetPlatform.includes('Android') ? <Smartphone className="w-3 h-3 text-emerald-400" /> : <Laptop className="w-3 h-3 text-cyan-400" />}
              <span>{targetPlatform}</span>
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
            <Skull className="w-5 h-5 text-red-400 shrink-0" />
            <span className="bg-gradient-to-r from-red-400 via-rose-300 to-amber-300 bg-clip-text text-transparent">
              {threatCategory}
            </span>
          </h3>
        </div>

        {harmAssessment?.consequenceLevel && (
          <div className="shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-red-950/60 border border-red-800/80 text-right">
              <span className="text-[10px] uppercase font-semibold text-red-400 block tracking-wider">
                Consequence Severity
              </span>
              <span className="text-xs font-bold text-red-200">
                {harmAssessment.consequenceLevel}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Dangerous Payload Forensics (When file payload detected) */}
      {detectedPayload && (
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center space-x-1.5">
              <FileWarning className="w-4 h-4 text-red-400" />
              <span>Detected Malicious File Payload</span>
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-900/50 border border-red-700 text-red-200">
              {detectedPayload.extension.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 font-medium block">Payload File Name:</span>
              <span className="font-mono text-white bg-slate-950/80 px-2.5 py-1 rounded border border-slate-800 block truncate">
                {detectedPayload.fileName}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-medium block">Artifact Classification:</span>
              <span className="font-mono text-cyan-300 bg-slate-950/80 px-2.5 py-1 rounded border border-slate-800 block truncate">
                {detectedPayload.type}
              </span>
            </div>
          </div>

          {detectedPayload.motwBypass && (
            <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/80 text-xs text-red-300 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>
                <strong>Mark-of-the-Web (MotW) Evasion:</strong> This disk container (.iso/.img) bypasses Windows SmartScreen zone identifiers, allowing contained executables or shortcuts to execute with zero warning prompts.
              </span>
            </div>
          )}

          <p className="text-xs text-slate-300 leading-relaxed pt-1">
            {detectedPayload.description}
          </p>
        </div>
      )}

      {/* 3. Potential Harm Breakdown: What Will Harm & Consequences */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Bug className="w-4 h-4 text-rose-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Potential System Harm & Threat Impact
          </h4>
        </div>

        {harmAssessment?.summary && (
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            {harmAssessment.summary}
          </p>
        )}

        {/* Direct Harm bullet points */}
        {harmAssessment?.directHarm && harmAssessment.directHarm.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-semibold text-rose-300">
              Specific Harm Inflicted on Victim System:
            </span>
            <ul className="space-y-1.5">
              {harmAssessment.directHarm.map((harm, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1.5" />
                  <span>{harm}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Victim Data at Risk Tag Cloud */}
        {harmAssessment?.dataAtRisk && harmAssessment.dataAtRisk.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-xs font-semibold text-amber-300 flex items-center space-x-1">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Victim Data & Assets at Risk:</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {harmAssessment.dataAtRisk.map((item, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-200 text-xs font-mono"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. MITRE ATT&CK Matrix Mapping */}
      {mitreAttack.length > 0 && (
        <div className="pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setExpandedMitre(!expandedMitre)}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-cyan-400 transition py-1"
          >
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-purple-400" />
              <span>MITRE ATT&CK® Enterprise Matrix Mapping ({mitreAttack.length} Techniques)</span>
            </div>
            {expandedMitre ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {expandedMitre && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
              {mitreAttack.map((tech, idx) => (
                <a
                  key={idx}
                  href={`https://attack.mitre.org/techniques/${tech.id.replace('.', '/')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-purple-600/60 transition group space-y-1 block"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                      {tech.tactic}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-slate-300 group-hover:text-purple-300 flex items-center space-x-1">
                      <span>{tech.id}</span>
                      <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                    </span>
                  </div>
                  <div className="text-xs font-medium text-slate-200 group-hover:text-white truncate">
                    {tech.name}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. SOC Incident Response & Containment Checklist */}
      {remediationSteps.length > 0 && (
        <div className="pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setExpandedSteps(!expandedSteps)}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-cyan-400 transition py-1"
          >
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Recommended Safety & Response Steps ({remediationSteps.length} Actions)</span>
            </div>
            {expandedSteps ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {expandedSteps && (
            <div className="space-y-2 mt-3">
              {remediationSteps.map((step, idx) => {
                const isDone = !!checkedSteps[idx];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleStep(idx)}
                    className={`flex items-start space-x-3 p-2.5 rounded-xl border cursor-pointer transition select-none ${
                      isDone
                        ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border transition ${
                      isDone ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-600 bg-slate-900'
                    }`}>
                      {isDone && <Check className="w-3 h-3" />}
                    </div>
                    <span className={`text-xs leading-relaxed ${isDone ? 'line-through text-slate-500' : ''}`}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
