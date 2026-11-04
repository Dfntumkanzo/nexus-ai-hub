import React, { useState, useEffect, useRef } from 'react';
import { 
  PanelLeftClose, 
  PanelLeft, 
  ChevronDown, 
  RotateCw, 
  ArrowLeft, 
  ArrowRight, 
  ExternalLink, 
  Plus, 
  Check, 
  Trash2, 
  Database, 
  ShieldCheck, 
  Layers, 
  Radio
} from 'lucide-react';
import { GoogleAccountProfile } from '../types';
import { AI_WEB_SERVICES } from '../lib/constants';

interface WorkstationProps {
  profiles: GoogleAccountProfile[];
  activeProfile: GoogleAccountProfile;
  onSelectProfile: (id: string) => void;
  onAddProfile: (name: string) => void;
  onDeleteProfile: (id: string) => void;
  onOpenSupabaseModal: () => void;
  isSupabaseConnected: boolean;
}

export const Workstation: React.FC<WorkstationProps> = ({
  profiles,
  activeProfile,
  onSelectProfile,
  onAddProfile,
  onDeleteProfile,
  onOpenSupabaseModal,
  isSupabaseConnected,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedServiceId, setSelectedServiceId] = useState('chatgpt');
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [isAddingProfile, setIsAddingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [isElectron, setIsElectron] = useState(false);

  const webviewRef = useRef<any>(null);

  const activeService = AI_WEB_SERVICES.find(s => s.id === selectedServiceId) || AI_WEB_SERVICES[0];

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isElectronEnv = userAgent.includes('electron') || Boolean((window as any).process?.versions?.electron);
    setIsElectron(isElectronEnv);
  }, []);

  const handleReload = () => {
    if (webviewRef.current?.reload) {
      webviewRef.current.reload();
    }
  };

  const handleGoBack = () => {
    if (webviewRef.current?.goBack && webviewRef.current.canGoBack()) {
      webviewRef.current.goBack();
    }
  };

  const handleGoForward = () => {
    if (webviewRef.current?.goForward && webviewRef.current.canGoForward()) {
      webviewRef.current.goForward();
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    onAddProfile(newProfileName.trim());
    setNewProfileName('');
    setIsAddingProfile(false);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#212121] text-[#ececec] font-sans antialiased">
      <aside 
        className={`${
          sidebarOpen ? 'w-[260px]' : 'w-0 -translate-x-full'
        } transition-all duration-200 ease-in-out bg-[#171717] border-r border-[#262626] flex flex-col shrink-0 h-full overflow-hidden select-none z-30`}
      >
        <div className="p-3 flex items-center justify-between border-b border-[#262626]/60">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-[#262626] flex items-center justify-center">
              <Layers className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="font-bold text-xs tracking-tight text-white">AI ALL-IN-ONE</span>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-[#8e8e8e] hover:text-white hover:bg-[#212121] transition-colors"
            title="Close sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 pt-2 pb-1 text-[11px] font-semibold text-[#8e8e8e] uppercase tracking-wider">
            AI Web Services
          </div>

          {AI_WEB_SERVICES.map(service => {
            const isSelected = service.id === selectedServiceId;
            return (
              <button
                key={service.id}
                onClick={() => setSelectedServiceId(service.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition-colors ${
                  isSelected 
                    ? 'bg-[#212121] text-white font-semibold shadow-sm' 
                    : 'text-[#b4b4b4] hover:text-white hover:bg-[#212121]/60'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span 
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: service.iconColor }}
                  />
                  <span>{service.name}</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-mono text-[#8e8e8e] bg-[#2a2a2a] border border-[#333]">
                  {service.badge}
                </span>
              </button>
            );
          })}
        </div>

        <div className="p-2 border-t border-[#262626] relative">
          <button
            onClick={() => setAccountMenuOpen(!accountMenuOpen)}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#212121] transition-colors text-left"
          >
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div 
                className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm"
                style={{ backgroundColor: activeProfile.color }}
              >
                {activeProfile.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-white truncate">{activeProfile.displayName}</div>
                <div className="text-[10px] text-[#8e8e8e] font-mono truncate">partition: {activeProfile.id}</div>
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-[#8e8e8e] transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {accountMenuOpen && (
            <div className="absolute bottom-16 left-2 right-2 bg-[#212121] border border-[#383838] rounded-2xl shadow-2xl p-2 z-50 space-y-1 animate-in fade-in duration-100">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-[#8e8e8e] uppercase tracking-wider">
                Switch Google Account Profile
              </div>

              <div className="max-h-52 overflow-y-auto space-y-0.5">
                {profiles.map(p => {
                  const isActive = p.id === activeProfile.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        onSelectProfile(p.id);
                        setAccountMenuOpen(false);
                      }}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-xs transition-colors ${
                        isActive ? 'bg-[#2f2f2f] text-white font-medium' : 'text-[#b4b4b4] hover:bg-[#2a2a2a]'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                        <span className="truncate">{p.displayName}</span>
                      </div>

                      <div className="flex items-center space-x-1">
                        {isActive && <Check className="w-3.5 h-3.5 text-emerald-400 mr-1" />}
                        {profiles.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteProfile(p.id);
                            }}
                            className="p-1 text-[#6e6e6e] hover:text-red-400"
                            title="Delete profile"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {isAddingProfile ? (
                <form onSubmit={handleAddSubmit} className="pt-2 border-t border-[#2f2f2f] space-y-2 p-1">
                  <input
                    type="text"
                    required
                    placeholder="Account Name (e.g. Google Work)"
                    value={newProfileName}
                    onChange={e => setNewProfileName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#171717] border border-[#3e3e3e] rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex items-center space-x-1">
                    <button
                      type="submit"
                      className="flex-1 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingProfile(false)}
                      className="px-2 py-1 text-xs text-[#8e8e8e] hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="pt-1 border-t border-[#2f2f2f]">
                  <button
                    onClick={() => setIsAddingProfile(true)}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-left text-xs text-[#ececec] hover:bg-[#2f2f2f] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-400" />
                    <span>Add Another Google Account</span>
                  </button>
                </div>
              )}

              <div className="pt-1 border-t border-[#2f2f2f]">
                <button
                  onClick={() => {
                    setAccountMenuOpen(false);
                    onOpenSupabaseModal();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs text-[#ececec] hover:bg-[#2f2f2f] transition-colors"
                >
                  <span className="flex items-center space-x-2">
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Supabase Cloud Backup</span>
                  </span>
                  <span className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#212121]">
        <header className="h-13 px-4 flex items-center justify-between border-b border-[#2e2e2e] bg-[#1a1a1a] z-20">
          <div className="flex items-center space-x-2">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-lg text-[#b4b4b4] hover:text-white hover:bg-[#2f2f2f] transition-colors mr-1"
                title="Open sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center space-x-1 text-[#b4b4b4]">
              <button 
                onClick={handleGoBack}
                className="p-1.5 rounded-lg hover:text-white hover:bg-[#2f2f2f] transition-colors" 
                title="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={handleGoForward}
                className="p-1.5 rounded-lg hover:text-white hover:bg-[#2f2f2f] transition-colors" 
                title="Forward"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={handleReload}
                className="p-1.5 rounded-lg hover:text-white hover:bg-[#2f2f2f] transition-colors" 
                title="Reload"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center space-x-2 px-3 py-1 rounded-xl bg-[#262626] border border-[#333]">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeService.iconColor }} />
              <span className="text-xs font-bold text-white">{activeService.name}</span>
              <span className="text-[10px] text-[#8e8e8e] font-mono">({activeService.url})</span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-[#262626] border border-[#333] text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[#8e8e8e]">Active Session:</span>
              <strong className="text-white">{activeProfile.displayName}</strong>
            </div>

            <a
              href={activeService.url}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg text-[#8e8e8e] hover:text-white hover:bg-[#2f2f2f] transition-colors"
              title="Open in external browser window"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </header>

        <div className="flex-1 w-full h-full relative overflow-hidden bg-[#121212]">
          {isElectron ? (
            <webview
              ref={webviewRef}
              key={`${activeProfile.id}-${activeService.id}`}
              src={activeService.url}
              partition={`persist:${activeProfile.id}`}
              allowpopups="true"
              webpreferences="contextIsolation=yes"
              className="w-full h-full border-none"
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          ) : (
            <div className="w-full h-full flex flex-col">
              <iframe
                key={`${activeProfile.id}-${activeService.id}`}
                src={activeService.url}
                className="w-full flex-1 border-none bg-white"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
              />

              <div className="p-3 bg-[#171717] border-t border-[#262626] flex items-center justify-between text-xs text-[#b4b4b4]">
                <div className="flex items-center space-x-2">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>
                    Currently in Web Mode. For 100% native Google multi-account login with zero browser CSP blocks, run:
                  </span>
                  <code className="px-2 py-0.5 rounded bg-[#262626] text-emerald-400 font-mono text-[11px]">
                    npm run app
                  </code>
                </div>

                <a
                  href={activeService.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors flex items-center space-x-1"
                >
                  <span>Open {activeService.name} directly</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
