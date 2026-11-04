import React, { useState } from 'react';
import { X, Plus, Sparkles, Trash2, CheckCircle2 } from 'lucide-react';
import { AIAccount } from '../types';

interface AccountSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: AIAccount[];
  activeAccountId: string;
  onSelectAccount: (id: string) => void;
  onSaveAccount: (account: AIAccount) => void;
  onDeleteAccount: (id: string) => void;
  credentialCounts: Record<string, number>;
}

const COLOR_OPTIONS = [
  '#3B82F6',
  '#10B981',
  '#8B5CF6',
  '#EC4899',
  '#F59E0B',
  '#06B6D4',
  '#E11D48',
];

export const AccountSwitcherModal: React.FC<AccountSwitcherModalProps> = ({
  isOpen,
  onClose,
  accounts,
  activeAccountId,
  onSelectAccount,
  onSaveAccount,
  onDeleteAccount,
  credentialCounts,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newBadge, setNewBadge] = useState('WORK');
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[0]);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newAccount: AIAccount = {
      id: `acc-${Date.now()}`,
      name: newName.trim(),
      description: newDesc.trim() || 'Custom AI workspace account',
      badgeLabel: newBadge.toUpperCase().slice(0, 8),
      avatarColor: newColor,
      iconName: 'Sparkles',
      isDefault: false,
      createdAt: new Date().toISOString(),
    };

    onSaveAccount(newAccount);
    setIsCreating(false);
    setNewName('');
    setNewDesc('');
    onSelectAccount(newAccount.id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#111827] border border-gray-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Multi-Account Profile Manager</h3>
              <p className="text-xs text-gray-400">Zero logouts: Switch between your AI identities instantly</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <div className="space-y-2.5">
            {accounts.map(acc => {
              const isActive = acc.id === activeAccountId;
              const creds = credentialCounts[acc.id] || 0;
              return (
                <div
                  key={acc.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                    isActive 
                      ? 'bg-indigo-950/30 border-indigo-500/60 ring-1 ring-indigo-500/30' 
                      : 'bg-gray-900/60 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3.5">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-md"
                      style={{ backgroundColor: `${acc.avatarColor}25`, color: acc.avatarColor, border: `1.5px solid ${acc.avatarColor}60` }}
                    >
                      {acc.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-white">{acc.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-gray-800 text-gray-300 border border-gray-700">
                          {acc.badgeLabel}
                        </span>
                        {acc.isDefault && (
                          <span className="text-[10px] text-gray-500 font-mono">DEFAULT</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{acc.description}</p>
                      <div className="flex items-center space-x-3 mt-1 text-[11px] text-gray-400">
                        <span className="flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>{creds} Active Provider Keys</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isActive ? (
                      <span className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          onSelectAccount(acc.id);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs font-medium text-gray-200 hover:text-white transition-colors"
                      >
                        Switch To
                      </button>
                    )}

                    {accounts.length > 1 && (
                      <button
                        onClick={() => onDeleteAccount(acc.id)}
                        className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete account profile"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {isCreating ? (
            <form onSubmit={handleCreate} className="p-4 rounded-xl bg-gray-900/90 border border-indigo-500/40 space-y-3.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Create New AI Account</span>
                <button 
                  type="button" 
                  onClick={() => setIsCreating(false)} 
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Account Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Work Team Pro, Secondary Claude, Lab Research"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Badge Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. WORK, TEAM, DEV, PRO"
                    value={newBadge}
                    onChange={e => setNewBadge(e.target.value)}
                    maxLength={8}
                    className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Theme Accent Color</label>
                  <div className="flex items-center space-x-1.5 mt-1">
                    {COLOR_OPTIONS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewColor(c)}
                        className={`w-6 h-6 rounded-full transition-transform ${newColor === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-gray-900' : 'hover:scale-110'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Description / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Holds enterprise API keys for Manus and Claude 3.7 Sonnet"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
              >
                Save & Switch to Account
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-2.5 rounded-xl border border-dashed border-gray-700 hover:border-indigo-500 text-xs font-medium text-gray-400 hover:text-indigo-400 flex items-center justify-center space-x-2 transition-colors bg-gray-900/30 hover:bg-gray-900/60"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Account Profile</span>
            </button>
          )}
        </div>

        <div className="p-4 bg-gray-950/60 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
          <span>Tip: Each account maintains its own isolated API keys and chat histories.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
