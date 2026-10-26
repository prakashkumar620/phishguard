import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-red-950/60 border border-red-800/80 flex items-center justify-center text-red-400">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-white">404 - Page Not Found</h1>
      <p className="text-sm text-slate-400 max-w-sm">
        The requested security resource or URL scan audit does not exist or has been relocated.
      </p>
      <Link
        to="/"
        className="mt-4 inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Security Center</span>
      </Link>
    </div>
  );
}
