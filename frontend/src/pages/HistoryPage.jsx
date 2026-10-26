import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  History, Search, Filter, Download, Trash2, ExternalLink, 
  AlertTriangle, Shield, CheckCircle, RefreshCw, ChevronLeft, ChevronRight 
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function HistoryPage() {
  const { user } = useAuth();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deletingId, setDeletingId] = useState(null);

  const fetchScans = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      if (searchTerm.trim()) params.append('domain', searchTerm.trim());
      if (selectedCategory) params.append('riskCategory', selectedCategory);

      const res = await api.get(`/scans?${params.toString()}`);
      if (res.data.success) {
        setScans(res.data.data);
        setTotalPages(res.data.totalPages);
        setTotal(res.data.total);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load scan history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, [page, selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchScans();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this scan record?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/scans/${id}`);
      setScans(scans.filter(s => s._id !== id));
      setTotal(prev => Math.max(0, prev - 1));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete scan record.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportCsv = () => {
    window.open('/api/scans/export/csv', '_blank');
  };

  const getRiskBadge = (category, score) => {
    switch (category) {
      case 'high':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 border border-red-500/30 text-red-400">
            High Risk ({score})
          </span>
        );
      case 'medium':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-400">
            Medium Risk ({score})
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            Low Risk ({score})
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center space-x-3">
            <History className="w-7 h-7 text-cyan-400" />
            <span>Inspection History</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {user ? 'Showing scans performed on your account.' : 'Showing recent publicly analyzed URLs.'} Total: {total} records.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-medium transition self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-cyan-400" />
          <span>Export History (CSV)</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute inset-y-0 left-3 my-auto" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by domain or hostname (e.g., paypal, wikipedia.org)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </form>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 w-full md:w-auto"
            >
              <option value="">All Risk Categories</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('');
              setPage(1);
              fetchScans();
            }}
            title="Reset Filters"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs">
          {error}
        </div>
      )}

      {/* Scans Table / List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3 text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
          <span className="text-sm">Loading scan records...</span>
        </div>
      ) : scans.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800 space-y-3">
          <Shield className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">No Scan Records Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No inspection records match the current filters. Analyze your first URL in the scanner.
          </p>
          <Link
            to="/scanner"
            className="inline-block mt-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition"
          >
            Analyze URL Now
          </Link>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs uppercase text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Target Host & URL</th>
                  <th className="px-6 py-4">Risk Rating</th>
                  <th className="px-6 py-4">Indicators</th>
                  <th className="px-6 py-4">Scan Timestamp</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {scans.map((scan) => (
                  <tr key={scan._id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <span className="font-mono text-sm font-semibold text-cyan-300 block">
                          {scan.hostname}
                        </span>
                        <span className="font-mono text-xs text-slate-400 truncate max-w-md block">
                          {scan.normalizedUrl}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRiskBadge(scan.riskCategory, scan.riskScore)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                        {scan.indicators?.length || 0} indicators
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-400 whitespace-nowrap">
                      {new Date(scan.scannedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap space-x-2">
                      <Link
                        to={`/scans/${scan._id}`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-medium border border-cyan-500/30 transition"
                      >
                        <span>Report</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>

                      {user && (
                        <button
                          onClick={() => handleDelete(scan._id)}
                          disabled={deletingId === scan._id}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                          title="Delete scan record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-slate-950/60 border-t border-slate-800 text-xs text-slate-400">
              <div>
                Page {page} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
