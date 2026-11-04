import React, { useState } from 'react';
import { 
  Sparkles, 
  Briefcase, 
  Terminal, 
  Cpu, 
  Shield, 
  Flame, 
  ChevronDown, 
  Key, 
  Database, 
  MessageSquare, 
  Columns, 
  Grid, 
  Music, 
  Bot, 
  Plus, 
  Check, 
  ExternalLink,
  Layers
} from 'lucide-react';
import { AIAccount, ViewMode, SupabaseConfig } from '../types';

interface NavbarProps {
  accounts: AIAccount[];
  activeAccount: AIAccount;
  onSelectAccount: (accountId: string) => void;
  onOpenAccountModal: () => void;
  onOpenVaultModal: () => void;
  onOpenSupabaseModal: () => void;
  activeView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  supabaseConfig: SupabaseConfig;
  credentialCounts: Record<string, number>;
}

export const Navbar: React.FC<NavbarProps> = ({
  accounts,
  activeAccount,
  onSelectAccount,
  onOpenAccountModal,
  onOpenVaultModal,
  onOpenSupabaseModal,
  activeView,
  onSelectView,
  supabaseConfig,
  credentialCounts,
}) => {
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);

  const getAccountIcon = (iconName: string, color: string) => {
    const props = { className: "w-4 h-4", style: { color } };
    switch (iconName) {
      case 'Briefcase': return <Briefcase {...props} />;
      case 'Terminal': return <Terminal {...props} />;
      case 'Cpu': return <Cpu {...props} />;
      case 'Shield': return <Shield {...props} />;
      case 'Flame': return <Flame {...props} />;
      default: return <Sparkles {...props} />;
    }
  };

  const currentCredCount = credentialCounts[activeAccount.id] || 0;

  return (
    <header className="h-16 border-b border-gray-800 bg-[#0E131F]/90 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-[#0B0F17] rounded-[10px] flex items-center justify-center">
              <Layers className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">NEXUS</span>
              <span className="text-xs px-1.5 py-0.5 rounded font-mono font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">AI HUB</span>
            </div>
            <p className="text-[10px] text-gray-400 tracking-wider">UNIFIED MULTI-ACCOUNT</p>
          </div>
        </div>

        <div className="h-6 w-px bg-gray-800 hidden sm:block" />

        <div className="relative">
          <button
            onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gray-900/80 hover:bg-gray-800 border border-gray-700/80 transition-all text-left shadow-sm group"
          >
            <div 
              className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs"
              style={{ backgroundColor: `${activeAccount.avatarColor}25`, color: activeAccount.avatarColor, border: `1px solid ${activeAccount.avatarColor}60` }}
            >
              {activeAccount.name.charAt(0)}
            </div>
            <div className="hidden md:block">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-semibold text-gray-200 group-hover:text-white max-w-[130px] truncate">
                  {activeAccount.name}
                </span>
                <span className="text-[9px] px-1 py-0.2 rounded font-mono font-bold uppercase bg-gray-800 text-gray-300 border border-gray-700">
                  {activeAccount.badgeLabel}
                </span>
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${accountDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {accountDropdownOpen && (
            <div className="absolute left-0 mt-2 w-72 bg-[#111827] border border-gray-700/90 rounded-xl shadow-2xl shadow-black/80 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-1.5 border-b border-gray-800">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Switch Account Profile</p>
                <p className="text-[10px] text-gray-500">Each account keeps its own keys, history & sessions</p>
              </div>

              <div className="max-h-60 overflow-y-auto py-1 space-y-0.5 px-1.5">
                {accounts.map(acc => {
                  const isSelected = acc.id === activeAccount.id;
                  const creds = credentialCounts[acc.id] || 0;
                  return (
                    <button
                      key={acc.id}
                      onClick={() => {
                        onSelectAccount(acc.id);
                        setAccountDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors ${
                        isSelected ? 'bg-indigo-600/20 border border-indigo-500/40 text-white' : 'hover:bg-gray-800/70 text-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div 
                          className="w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs"
                          style={{ backgroundColor: `${acc.avatarColor}20`, color: acc.avatarColor, border: `1px solid ${acc.avatarColor}50` }}
                        >
                          {acc.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-medium text-gray-200">{acc.name}</span>
                            <span className="text-[9px] px-1 py-0.2 rounded font-mono font-bold bg-gray-800 text-gray-400">
                              {acc.badgeLabel}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-500 flex items-center space-x-1">
                            <span>{creds} API keys configured</span>
                          </span>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-1.5 mt-1 border-t border-gray-800 px-2 space-y-1">
                <button
                  onClick={() => {
                    setAccountDropdownOpen(false);
                    onOpenAccountModal();
                  }}
                  className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-xs font-medium text-gray-300 hover:text-white transition-colors border border-gray-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Manage / Add Accounts</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <nav className="hidden lg:flex items-center bg-[#0B0F17] p-1 rounded-xl border border-gray-800 space-x-1">
        <button
          onClick={() => onSelectView('chat')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeView === 'chat' 
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Omni-Chat</span>
        </button>

        <button
          onClick={() => onSelectView('split')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeView === 'split' 
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' 
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
          }`}
        >
          <Columns className="w-3.5 h-3.5" />
          <span>Split Arena</span>
        </button>

        <button
          onClick={() => onSelectView('launchpad')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeView === 'launchpad' 
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' 
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>AI Apps Portal</span>
        </button>

        <button
          onClick={() => onSelectView('suno')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeView === 'suno' 
              ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30' 
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span>Suno Studio</span>
        </button>

        <button
          onClick={() => onSelectView('manus')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeView === 'manus' 
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30' 
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Manus Agent</span>
        </button>
      </nav>

      <div className="flex items-center space-x-2 sm:space-x-3">
        <button
          onClick={onOpenVaultModal}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-gray-900/90 hover:bg-gray-800 border border-gray-700 text-xs font-medium text-gray-300 hover:text-white transition-colors"
          title="Account API Credentials Vault"
        >
          <Key className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">API Vault</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">
            {currentCredCount}
          </span>
        </button>

        <button
          onClick={onOpenSupabaseModal}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            supabaseConfig.isConnected
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/50'
              : 'bg-gray-900/90 border-gray-700 text-gray-400 hover:text-gray-200 hover:bg-gray-800'
          }`}
          title="Supabase Cloud Synchronization"
        >
          <Database className={`w-3.5 h-3.5 ${supabaseConfig.isConnected ? 'text-emerald-400' : 'text-gray-400'}`} />
          <span className="hidden md:inline">
            {supabaseConfig.isConnected ? 'Supabase Synced' : 'Connect Supabase'}
          </span>
          <span className={`w-2 h-2 rounded-full ${supabaseConfig.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
        </button>
      </div>
    </header>
  );
};
