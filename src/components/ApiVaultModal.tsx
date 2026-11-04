import React, { useState } from 'react';
import { X, Key, ShieldCheck, ExternalLink, Eye, EyeOff, Check } from 'lucide-react';
import { AIAccount, AIProvider, AccountCredential } from '../types';

interface ApiVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeAccount: AIAccount;
  credentials: Record<AIProvider, AccountCredential | null>;
  onSaveCredential: (credential: AccountCredential) => void;
}

interface ProviderMeta {
  id: AIProvider;
  name: string;
  brandColor: string;
  keyPlaceholder: string;
  helpUrl: string;
  modelsDesc: string;
}

const PROVIDERS: ProviderMeta[] = [
  {
    id: 'openai',
    name: 'OpenAI (ChatGPT)',
    brandColor: '#10A37F',
    keyPlaceholder: 'sk-proj-...',
    helpUrl: 'https://platform.openai.com/api-keys',
    modelsDesc: 'Powers GPT-4o, o3-mini, and GPT-4o mini',
  },
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    brandColor: '#D97757',
    keyPlaceholder: 'sk-ant-api03-...',
    helpUrl: 'https://console.anthropic.com/settings/keys',
    modelsDesc: 'Powers Claude 3.7 Sonnet (Hybrid) & Claude 3.5 Sonnet',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    brandColor: '#4E88FF',
    keyPlaceholder: 'AIzaSy...',
    helpUrl: 'https://aistudio.google.com/app/apikey',
    modelsDesc: 'Powers Gemini 2.5 Flash (1M tokens) & Gemini 2.5 Pro',
  },
  {
    id: 'grok',
    name: 'xAI (Grok)',
    brandColor: '#E11D48',
    keyPlaceholder: 'xai-...',
    helpUrl: 'https://console.x.ai/',
    modelsDesc: 'Powers Grok 3 and Grok 2 Vision',
  },
  {
    id: 'suno',
    name: 'Suno AI Studio',
    brandColor: '#EC4899',
    keyPlaceholder: 'suno-key-or-token-...',
    helpUrl: 'https://suno.com',
    modelsDesc: 'Powers Suno v3.5 full song generation & audio stems',
  },
  {
    id: 'manus',
    name: 'Manus AI Agent',
    brandColor: '#06B6D4',
    keyPlaceholder: 'manus-agent-key-...',
    helpUrl: 'https://manus.im',
    modelsDesc: 'Powers autonomous browser execution & deep workflows',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    brandColor: '#3B82F6',
    keyPlaceholder: 'sk-...',
    helpUrl: 'https://platform.deepseek.com/api_keys',
    modelsDesc: 'Powers DeepSeek R1 open reasoning models',
  },
];

export const ApiVaultModal: React.FC<ApiVaultModalProps> = ({
  isOpen,
  onClose,
  activeAccount,
  credentials,
  onSaveCredential,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('openai');
  const [keyInput, setKeyInput] = useState('');
  const [endpointInput, setEndpointInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  React.useEffect(() => {
    const cred = credentials[selectedProvider];
    setKeyInput(cred?.apiKey || '');
    setEndpointInput(cred?.endpointUrl || '');
    setShowKey(false);
    setSavedSuccess(false);
  }, [selectedProvider, credentials, activeAccount.id]);

  if (!isOpen) return null;

  const currentProviderMeta = PROVIDERS.find(p => p.id === selectedProvider) || PROVIDERS[0];
  const existingCred = credentials[selectedProvider];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCredential({
      accountId: activeAccount.id,
      provider: selectedProvider,
      apiKey: keyInput.trim(),
      endpointUrl: endpointInput.trim() || undefined,
      updatedAt: new Date().toISOString(),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleClear = () => {
    setKeyInput('');
    setEndpointInput('');
    onSaveCredential({
      accountId: activeAccount.id,
      provider: selectedProvider,
      apiKey: '',
      endpointUrl: undefined,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#111827] border border-gray-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Key className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">API Credentials Vault</h3>
                <span 
                  className="text-[10px] px-2 py-0.5 rounded font-bold uppercase font-mono"
                  style={{ backgroundColor: `${activeAccount.avatarColor}25`, color: activeAccount.avatarColor }}
                >
                  {activeAccount.name}
                </span>
              </div>
              <p className="text-xs text-gray-400">Keys configured here apply exclusively to this account profile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          <div className="md:col-span-5 border-r border-gray-800 p-3 space-y-1 overflow-y-auto bg-[#0E131F]/50">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-2 py-1">AI Providers</p>
            {PROVIDERS.map(p => {
              const isSelected = p.id === selectedProvider;
              const hasKey = Boolean(credentials[p.id]?.apiKey);
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProvider(p.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                    isSelected 
                      ? 'bg-gray-800 text-white border border-gray-700 shadow-sm' 
                      : 'hover:bg-gray-800/50 text-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span 
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: p.brandColor }}
                    />
                    <span className="text-xs font-semibold">{p.name}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    {hasKey ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                        Active
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 font-mono">
                        Simulated
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="md:col-span-7 p-6 overflow-y-auto flex flex-col justify-between">
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: currentProviderMeta.brandColor }}
                    />
                    <h4 className="text-sm font-bold text-white">{currentProviderMeta.name}</h4>
                  </div>
                  <a
                    href={currentProviderMeta.helpUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                  >
                    <span>Get API Key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-gray-400">{currentProviderMeta.modelsDesc}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  API Key or Access Token
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    placeholder={currentProviderMeta.keyPlaceholder}
                    value={keyInput}
                    onChange={e => setKeyInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-200"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Custom Base URL / Proxy Endpoint (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Leave empty for official endpoint (e.g. https://api.openai.com/v1)"
                  value={endpointInput}
                  onChange={e => setEndpointInput(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-gray-950 border border-gray-800 text-xs text-gray-400 space-y-1">
                <div className="flex items-center space-x-1.5 text-indigo-400 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Isolated Client-Side & Supabase Storage</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Keys are stored exclusively under <strong className="text-white">{activeAccount.name}</strong>. Switching to another account will automatically swap your active API keys.
                </p>
              </div>

              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-1.5"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Saved Successfully!</span>
                    </>
                  ) : (
                    <span>Save {currentProviderMeta.name} Key</span>
                  )}
                </button>

                {existingCred?.apiKey && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-3 py-2.5 bg-gray-800 hover:bg-red-950/40 hover:text-red-400 hover:border-red-500/40 border border-gray-700 text-xs font-medium text-gray-300 rounded-xl transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </form>

            <div className="pt-4 border-t border-gray-800 mt-4 flex items-center justify-between text-[11px] text-gray-500">
              <span>Simulation mode runs automatically if key is empty.</span>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                Close Vault
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
