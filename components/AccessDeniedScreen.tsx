import React from 'react';
import { ShieldAlert, LogOut, RefreshCw, Mail, Lock } from 'lucide-react';
import { PRIMARY_ADMIN_EMAIL, User as AppUser } from '../types';

interface AccessDeniedScreenProps {
  currentUser: AppUser;
  onLogout: () => void;
  onRefreshAccess: () => void;
  isRefreshing?: boolean;
}

export const AccessDeniedScreen: React.FC<AccessDeniedScreenProps> = ({
  currentUser,
  onLogout,
  onRefreshAccess,
  isRefreshing = false
}) => {
  return (
    <div className="min-h-screen bg-[#FDFDFF] dark:bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background ambient gradient */}
      <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-rose-500/10 dark:bg-rose-500/20 blur-[140px] pointer-events-none" />

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl p-8 md:p-10 text-center space-y-6">
        {/* Lock Icon Badge */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-lg shadow-rose-500/10">
          <Lock className="w-8 h-8" />
        </div>

        {/* Text Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-[10px] font-black uppercase tracking-widest">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Private Family Workspace</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Access Pending Approval
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
            This workspace is currently restricted to approved family members to ensure fair AI quota usage.
          </p>
        </div>

        {/* Current User Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4 text-left">
          <div className="flex items-center gap-3 min-w-0">
            {currentUser.photoURL ? (
              <img 
                src={currentUser.photoURL} 
                alt="" 
                className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-black text-sm">
                {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : (currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'U')}
              </div>
            )}
            <div className="min-w-0">
              <span className="block text-xs font-black text-slate-900 dark:text-white truncate">
                {currentUser.displayName || 'Signed In Account'}
              </span>
              <span className="block text-[11px] text-slate-400 truncate">
                {currentUser.email}
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 shrink-0">
            Not Whitelisted
          </span>
        </div>

        {/* Contact Owner Info */}
        <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-left space-y-1.5">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wider">
            <Mail className="w-3.5 h-3.5" />
            <span>How to get access</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Please ask the workspace owner to add your email ({currentUser.email}) to the approved family whitelist:
          </p>
          <div className="pt-1 text-xs font-bold text-slate-900 dark:text-white">
            Primary Owner: <span className="text-indigo-600 dark:text-indigo-400">{PRIMARY_ADMIN_EMAIL}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={onRefreshAccess}
            disabled={isRefreshing}
            className="flex-1 px-5 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Checking...' : 'Check Access Again'}</span>
          </button>

          <button
            onClick={onLogout}
            className="px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-black uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Switch Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
