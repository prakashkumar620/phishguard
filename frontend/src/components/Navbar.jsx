import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, History, BarChart3, Lock, User, LogOut, Terminal, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import MongoDetailsModal from './MongoDetailsModal';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [showMongoModal, setShowMongoModal] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-[#080d1a]/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition">
              <div className="w-full h-full bg-[#080d1a] rounded-[10px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
                PhishGuard
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
                AI + Heuristic
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center space-x-1 sm:space-x-3">
            <Link
              to="/scanner"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive('/scanner')
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Scanner</span>
            </Link>

            <Link
              to="/history"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive('/history')
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <History className="w-4 h-4" />
              <span>History</span>
            </Link>

            <Link
              to="/analytics"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive('/analytics')
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </Link>

            <button
              type="button"
              onClick={() => setShowMongoModal(true)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 border border-emerald-800/40 transition"
              title="View MongoDB Database Schema & Architecture"
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <span>MongoDB</span>
            </button>

            {isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive('/admin')
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                    : 'text-purple-300 hover:text-white hover:bg-purple-950/40'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            )}

            {/* User session controls */}
            <div className="pl-2 border-l border-slate-800 flex items-center space-x-2">
              {user ? (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/profile"
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-200 text-sm border border-slate-700/60 transition"
                  >
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                  </Link>
                  <button
                    onClick={logout}
                    title="Log out"
                    className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white transition"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-3.5 py-1.5 text-sm font-medium rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium shadow-sm transition"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <MongoDetailsModal 
        isOpen={showMongoModal} 
        onClose={() => setShowMongoModal(false)} 
      />
    </nav>
  );
}
