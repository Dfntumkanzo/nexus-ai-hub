import React, { useState } from 'react';
import { X, Plus, Check, ExternalLink, Trash2, ShieldCheck } from 'lucide-react';
import { GoogleAccountProfile } from '../types';
import { WEB_AI_APPS } from '../lib/constants';

interface GoogleAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: GoogleAccountProfile[];
  activeAccountId: string;
  onSelectAccount: (id: string) => void;
  onAddAccount: (account: GoogleAccountProfile) => void;
  onDeleteAccount: (id: string) => void;
}

export const GoogleAccountsModal: React.FC<GoogleAccountsModalProps> = ({
  isOpen,
  onClose,
  accounts,
  activeAccountId,
  onSelectAccount,
  onAddAccount,
  onDeleteAccount,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');

  if (!isOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    const colors = ['#4285F4', '#0F9D58', '#EA4335', '#FBBC05', '#8B5CF6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newAcc: GoogleAccountProfile = {
      id: `google-${Date.now()}`,
      email: email.trim(),
      displayName: displayName.trim() || email.split('@')[0],
      isDefault: false,
      color: randomColor,
      createdAt: new Date().toISOString(),
    };

    onAddAccount(newAcc);
    setIsAdding(false);
    setEmail('');
    setDisplayName('');
    onSelectAccount(newAcc.id);
  };

  const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#212121] border border-[#383838] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-[#ececec]">
        <div className="p-4 border-b border-[#2f2f2f] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-[#2f2f2f] border border-[#424242] flex items-center justify-center">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Google Accounts & AI Web Access</h3>
              <p className="text-xs text-[#b4b4b4]">Manage connected accounts without repeatedly signing in/out</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#b4b4b4] hover:text-white hover:bg-[#2f2f2f] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-[#8e8e8e] uppercase tracking-wider">Your Google Accounts</span>
            {accounts.map(acc => {
              const isActive = acc.id === activeAccountId;
              return (
                <div
                  key={acc.id}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                    isActive 
                      ? 'bg-[#2a2a2a] border-[#555555]' 
                      : 'bg-[#181818] border-[#2e2e2e] hover:border-[#3e3e3e]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm"
                      style={{ backgroundColor: acc.color }}
                    >
                      {acc.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-white">{acc.displayName}</span>
                        {isActive && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#8e8e8e]">{acc.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {!isActive ? (
                      <button
                        onClick={() => onSelectAccount(acc.id)}
                        className="px-3 py-1 bg-[#2f2f2f] hover:bg-[#3d3d3d] text-xs text-white rounded-lg transition-colors border border-[#404040]"
                      >
                        Switch
                      </button>
                    ) : (
                      <Check className="w-4 h-4 text-emerald-400 mr-2" />
                    )}

                    {accounts.length > 1 && (
                      <button
                        onClick={() => onDeleteAccount(acc.id)}
                        className="p-1.5 text-[#6e6e6e] hover:text-red-400 transition-colors"
                        title="Remove Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {isAdding ? (
            <form onSubmit={handleAddSubmit} className="p-4 rounded-xl bg-[#181818] border border-[#3e3e3e] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Add Another Google Account</span>
                <button type="button" onClick={() => setIsAdding(false)} className="text-xs text-[#8e8e8e] hover:text-white">Cancel</button>
              </div>

              <div>
                <label className="block text-[11px] text-[#b4b4b4] mb-1">Google Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. yourname@gmail.com or company@work.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#212121] border border-[#3e3e3e] rounded-lg text-xs text-white placeholder-[#6e6e6e] focus:outline-none focus:border-[#4285F4]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#b4b4b4] mb-1">Account Label / Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Work, Personal, School, Creative"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#212121] border border-[#3e3e3e] rounded-lg text-xs text-white placeholder-[#6e6e6e] focus:outline-none focus:border-[#4285F4]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-[#4285F4] hover:bg-[#3367D6] text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
              >
                Save & Switch to this Account
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full py-2.5 rounded-xl border border-dashed border-[#3e3e3e] hover:border-[#555] text-xs font-medium text-[#b4b4b4] hover:text-white flex items-center justify-center space-x-2 transition-colors bg-[#181818]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Google Account</span>
            </button>
          )}

          <div className="pt-2 border-t border-[#2e2e2e]">
            <span className="text-[11px] font-semibold text-[#8e8e8e] uppercase tracking-wider block mb-2">
              Launch Official Web AI with Active Google Account ({activeAccount.displayName})
            </span>
            <div className="grid grid-cols-2 gap-2">
              {WEB_AI_APPS.map(app => (
                <a
                  key={app.id}
                  href={app.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl bg-[#181818] hover:bg-[#282828] border border-[#2e2e2e] hover:border-[#404040] flex items-center justify-between text-xs transition-colors group"
                >
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: app.color }} />
                    <span className="font-medium text-[#ececec] group-hover:text-white">{app.name}</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-[#6e6e6e] group-hover:text-[#ececec]" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="p-3 bg-[#181818] border-t border-[#2f2f2f] flex items-center justify-between text-xs text-[#8e8e8e]">
          <span className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Multi-Account isolated storage active</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#2f2f2f] hover:bg-[#383838] text-white rounded-lg text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
