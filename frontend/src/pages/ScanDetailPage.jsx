import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, ArrowLeft, RefreshCw, AlertCircle, FileText } from 'lucide-react';
import api from '../api/client';
import ScanResultCard from '../components/ScanResultCard';

export default function ScanDetailPage() {
  const { id } = useParams();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchScan = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/scans/${id}`);
        if (res.data.success) {
          setScan(res.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to retrieve scan report.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchScan();
  }, [id]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/history"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Scan History</span>
        </Link>

        <span className="text-xs font-mono text-slate-500">
          Scan ID: {id}
        </span>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3 text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
          <span className="text-sm">Loading security analysis report...</span>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-red-950/40 border border-red-800 text-red-300 text-sm flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-white">Unable to Load Scan</h4>
            <p className="mt-1 text-xs text-red-300/90">{error}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-white">Forensic Scan Report</h1>
          </div>
          <ScanResultCard scan={scan} />
        </div>
      )}
    </div>
  );
}
