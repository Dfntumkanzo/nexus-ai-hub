import React, { useState } from 'react';
import { X, Key, ShieldCheck, Eye, EyeOff, Check, Cpu } from 'lucide-react';
import { ProviderAccount } from '../types';
import { PROVIDERS_LIST } from '../lib/constants';

interface ApiVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: ProviderAccount[];
  onSaveAccountApiKey: (accountId: string, apiKey: string) => void;
}

export const ApiVaultModal: React.FC<ApiVaultModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onSaveAccountApiKey,
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  React.useEffect(() => {
    if (!selectedAccountId && accounts.length > 0) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const activeAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0];
  const providerMeta = PROVIDERS_LIST.find(p => p.id === activeAccount?.provider) || PROVIDERS_LIST[0];

  React.useEffect(() => {
    if (activeAccount) {
      setKeyInput(activeAccount.apiKey || '');
      setShowKey(false);
      setSavedSuccess(false);
    }
  }, [activeAccount?.id]);

  if (!isOpen || !activeAccount) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveAccountApiKey(activeAccount.id, keyInput.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-[#171717] border border-[#2e2e2e] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[85vh]">
        {/* Account Selector Sidebar */}
        <div className="w-full md:w-64 bg-[#141414] border-r border-[#262626] p-4 flex flex-col shrink-0">
          <div className="flex items-center space-x-2.5 pb-4 border-b border-[#262626]">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Key className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">API Keys Vault</h2>
              <p className="text-[11px] text-[#8e8e8e]">Per-Account Credentials</p>
            </div>
          </div>

          <div className="mt-3 flex-1 overflow-y-auto space-y-1 pr-1">
            <span className="text-[10px] font-semibold tracking-wider text-[#666] uppercase px-2 mb-1 block">
              Your Accounts
            </span>
            {accounts.map(acc => {
              const p = PROVIDERS_LIST.find(pr => pr.id === acc.provider);
              const isSelected = selectedAccountId === acc.id;
              const hasKey = Boolean(acc.apiKey);

              return (
                <button
                  key={acc.id}
                  onClick={() => setSelectedAccountId(acc.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-all ${
                    isSelected
                      ? 'bg-[#262626] text-white font-medium border border-[#383838]'
                      : 'text-[#9ca3af] hover:bg-[#1f1f1f] hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: p?.brandColor || acc.avatarColor }}
                    />
                    <div className="truncate">
                      <p className="truncate font-medium">{acc.name}</p>
                      <p className="text-[10px] text-[#777] truncate">{p?.name}</p>
                    </div>
                  </div>
                  {hasKey ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono shrink-0">
                      Key
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#555] shrink-0">Smart</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#262626] text-[11px] text-[#777] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Encrypted per account</span>
          </div>
        </div>

        {/* Content Form Area */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#262626]">
              <div className="flex items-center space-x-3">
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0"
                  style={{ backgroundColor: providerMeta.brandColor }}
                />
                <div>
                  <h3 className="text-base font-semibold text-white">{activeAccount.name}</h3>
                  <p className="text-xs text-[#8e8e8e]">{providerMeta.name} • {providerMeta.description}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#8e8e8e] hover:text-white hover:bg-[#262626] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#ccc] mb-1.5 flex items-center justify-between">
                  <span>Custom API Key / Token</span>
                  <span className="text-[11px] text-[#777] font-mono">Optional</span>
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={keyInput}
                    onChange={e => setKeyInput(e.target.value)}
                    placeholder="Enter API key or leave empty for smart engine..."
                    className="w-full bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#555] focus:outline-none focus:border-blue-500 font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-2.5 text-[#666] hover:text-white"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-1.5 text-[11px] text-[#777]">
                  Leaving this empty lets the built-in AI engine run with universal shared memory.
                </p>
              </div>

              <div className="bg-[#212121] rounded-xl p-3.5 border border-[#2e2e2e] text-xs text-[#a0a0a0] space-y-1.5">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  Shared Memory Persistence
                </div>
                <p className="text-[11px] text-[#888]">
                  Even with custom API keys configured, all models across every account continuously read and update the same **Shared Memory Core** synced with Supabase.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between">
                {savedSuccess ? (
                  <span className="text-xs text-emerald-400 flex items-center gap-1 animate-fade-in font-medium">
                    <Check className="w-3.5 h-3.5" /> Key Saved
                  </span>
                ) : (
                  <span className="text-[11px] text-[#666]">
                    {activeAccount.apiKey ? 'Key currently active' : 'Using smart engine'}
                  </span>
                )}

                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium transition-all shadow-md active:scale-95"
                >
                  Save Account Key
                </button>
              </div>
            </form>
          </div>

          <div className="pt-4 border-t border-[#262626] flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#262626] hover:bg-[#333] text-[#ccc] hover:text-white rounded-xl text-xs transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
