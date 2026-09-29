import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  UserPlus, 
  Trash2, 
  Check, 
  X, 
  Users, 
  Lock, 
  Unlock, 
  RefreshCw,
  Crown,
  Search,
  ExternalLink
} from 'lucide-react';
import { collection, doc, getDocs, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { PRIMARY_ADMIN_EMAIL, AccessControlConfig, User as AppUser } from '../types';

interface AccessControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AccessControlConfig;
  onUpdateConfig: (newConfig: AccessControlConfig) => Promise<void>;
  currentUserEmail: string | null;
}

export const AccessControlModal: React.FC<AccessControlModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  currentUserEmail
}) => {
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState<AppUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Fetch registered users from Firestore
  useEffect(() => {
    if (!isOpen) return;

    const fetchRegisteredUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const usersList: AppUser[] = [];
        usersSnap.forEach((docSnap) => {
          const data = docSnap.data();
          usersList.push({
            uid: docSnap.id,
            email: data.email || null,
            displayName: data.displayName || null,
            photoURL: data.photoURL || null,
            createdAt: data.createdAt?.seconds ? data.createdAt.seconds * 1000 : (data.createdAt || Date.now())
          });
        });
        setRegisteredUsers(usersList);
      } catch (err) {
        console.warn('Could not list registered users collection:', err);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchRegisteredUsers();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleEnforce = async () => {
    setIsSaving(true);
    try {
      const updated: AccessControlConfig = {
        ...config,
        enforceWhitelist: !config.enforceWhitelist,
        updatedAt: Date.now(),
        updatedBy: currentUserEmail || PRIMARY_ADMIN_EMAIL
      };
      await onUpdateConfig(updated);
      setFeedback(updated.enforceWhitelist ? 'Whitelist mode enabled: Only allowed emails can access.' : 'Whitelist mode disabled: Open access.');
      setTimeout(() => setFeedback(null), 3000);
    } catch (e: any) {
      setEmailError(e?.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddEmail = async (emailToAdd?: string) => {
    const rawEmail = (emailToAdd || newEmail).trim().toLowerCase();
    setEmailError(null);

    if (!rawEmail) {
      setEmailError('Please enter a valid email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(rawEmail)) {
      setEmailError('Invalid email address format');
      return;
    }

    if (config.allowedEmails.some(e => e.toLowerCase() === rawEmail)) {
      setEmailError('This email is already on the approved list');
      return;
    }

    setIsSaving(true);
    try {
      const updated: AccessControlConfig = {
        ...config,
        allowedEmails: [...config.allowedEmails, rawEmail],
        updatedAt: Date.now(),
        updatedBy: currentUserEmail || PRIMARY_ADMIN_EMAIL
      };
      await onUpdateConfig(updated);
      setNewEmail('');
      setFeedback(`Added ${rawEmail} to approved family list`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (e: any) {
      setEmailError(e?.message || 'Failed to add email');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveEmail = async (emailToRemove: string) => {
    if (emailToRemove.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
      setEmailError('Cannot remove primary workspace admin');
      return;
    }

    setIsSaving(true);
    try {
      const updated: AccessControlConfig = {
        ...config,
        allowedEmails: config.allowedEmails.filter(e => e.toLowerCase() !== emailToRemove.toLowerCase()),
        updatedAt: Date.now(),
        updatedBy: currentUserEmail || PRIMARY_ADMIN_EMAIL
      };
      await onUpdateConfig(updated);
      setFeedback(`Revoked access for ${emailToRemove}`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (e: any) {
      setEmailError(e?.message || 'Failed to remove email');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredAllowed = config.allowedEmails.filter(email => 
    email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-600/20 shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  Family & User Access
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage who can access your shared AI workspace and protect your quotas.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback / Alert */}
        {feedback && (
          <div className="px-6 py-2.5 bg-emerald-50 dark:bg-emerald-950/50 border-b border-emerald-100 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{feedback}</span>
          </div>
        )}

        {emailError && (
          <div className="px-6 py-2.5 bg-rose-50 dark:bg-rose-950/50 border-b border-rose-100 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              <span>{emailError}</span>
            </div>
            <button onClick={() => setEmailError(null)} className="text-rose-400 hover:text-rose-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
          {/* Whitelist Mode Toggle Card */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {config.enforceWhitelist ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                )}
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  Whitelist Protection Mode
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                  config.enforceWhitelist 
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                }`}>
                  {config.enforceWhitelist ? 'Restricted' : 'Open'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {config.enforceWhitelist 
                  ? 'Active: Only approved family email addresses below can access Rightshore AI.'
                  : 'Inactive: Anyone with a Google account who opens your shared link can sign in.'}
              </p>
            </div>

            <button
              onClick={handleToggleEnforce}
              disabled={isSaving}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shrink-0 ${
                config.enforceWhitelist
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:scale-[1.02] shadow-md'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20'
              }`}
            >
              {config.enforceWhitelist ? (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Disable Lock</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Enforce Whitelist</span>
                </>
              )}
            </button>
          </div>

          {/* Add New Family Member Form */}
          <div className="space-y-3">
            <label className="block text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
              Add Approved Family Member
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => { setNewEmail(e.target.value); setEmailError(null); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddEmail(); }}
                  placeholder="e.g. family.member@gmail.com"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
              <button
                onClick={() => handleAddEmail()}
                disabled={isSaving || !newEmail.trim()}
                className="px-5 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                <UserPlus className="w-4 h-4" />
                <span>Grant Access</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Tip: Enter the exact Google email address your family member uses to log in.
            </p>
          </div>

          {/* Approved Members List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                  Approved Family Members ({config.allowedEmails.length})
                </h3>
              </div>
              {config.allowedEmails.length > 5 && (
                <div className="relative w-48">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search emails..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200"
                  />
                </div>
              )}
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
              {filteredAllowed.map((email) => {
                const isAdmin = email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
                return (
                  <div 
                    key={email}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        isAdmin 
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800' 
                          : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                      }`}>
                        {isAdmin ? <Crown className="w-4 h-4" /> : email.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                            {email}
                          </span>
                          {isAdmin && (
                            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
                              Primary Owner
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          {isAdmin ? 'Full administrative rights' : 'Full access to all AI tools & workspace'}
                        </span>
                      </div>
                    </div>

                    {!isAdmin && (
                      <button
                        onClick={() => handleRemoveEmail(email)}
                        disabled={isSaving}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all ml-3 shrink-0"
                        title="Revoke access"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}

              {filteredAllowed.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400">
                  No matching emails found.
                </div>
              )}
            </div>
          </div>

          {/* Registered Users from Firestore (Live Directory) */}
          {registeredUsers.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                  Recent Users in Database ({registeredUsers.length})
                </h3>
                <span className="text-[10px] text-slate-400">
                  Users who have signed in at least once
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-900/50">
                {registeredUsers.map((user) => {
                  const isWhitelisted = user.email && config.allowedEmails.some(e => e.toLowerCase() === user.email?.toLowerCase());
                  const isAdmin = user.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();

                  return (
                    <div key={user.uid} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        {user.photoURL ? (
                          <img 
                            src={user.photoURL} 
                            alt="" 
                            className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-600 dark:text-slate-400">
                            {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {user.displayName || 'Unnamed User'}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {user.email || 'No email on record'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isWhitelisted ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Allowed</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => user.email && handleAddEmail(user.email)}
                            disabled={isSaving || !user.email}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 transition-all flex items-center gap-1"
                          >
                            <UserPlus className="w-3 h-3" />
                            <span>Allow Access</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 md:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            Current Admin: <strong className="text-slate-700 dark:text-slate-300">{PRIMARY_ADMIN_EMAIL}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
