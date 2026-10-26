import React from 'react';
import { User, Mail, Shield, Key, Calendar, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center space-x-3">
          <User className="w-7 h-7 text-cyan-400" />
          <span>Analyst Profile</span>
        </h1>

        <button
          onClick={logout}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium border border-red-500/30 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-xl space-y-6">
        <div className="flex items-center space-x-4 pb-6 border-b border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 p-0.5">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-xl font-bold text-cyan-400 font-mono">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user.name}</h2>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full border ${
                user.role === 'admin'
                  ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                  : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
              }`}>
                {user.role}
              </span>
              <span className="text-xs text-slate-400">Verified Security Analyst</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 flex items-center space-x-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span>Email Address</span>
            </span>
            <p className="text-sm font-mono text-slate-200">{user.email}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 flex items-center space-x-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-500" />
              <span>Access Level</span>
            </span>
            <p className="text-sm text-slate-200 capitalize">{user.role} privileges</p>
          </div>
        </div>
      </div>
    </div>
  );
}
