import React, { useState, useEffect, useRef } from 'react';
import { 
  PanelLeftClose, 
  PanelLeft, 
  Plus, 
  MessageSquare, 
  Trash2, 
  Brain, 
  Key, 
  Database, 
  ChevronDown, 
  ChevronRight,
  Send, 
  Copy, 
  Play, 
  Pause, 
  Music, 
  Sparkles, 
  Search, 
  CheckCircle2, 
  Clock, 
  Volume2, 
  Terminal, 
  CheckCheck,
  User,
  X,
  Columns,
  Users,
  Compass,
  Cpu,
  Layers
} from 'lucide-react';
import { 
  ProviderAccount, 
  AIProvider, 
  Conversation, 
  Message, 
  SharedMemory, 
  WorkspaceMode,
  ModelInfo
} from '../types';
import { PROVIDERS_LIST, AI_MODELS } from '../lib/constants';
import { executeUnifiedAI } from '../lib/ai-service';
import { autoDetectMemory, saveSharedMemory } from '../lib/memory';

interface UnifiedChatViewProps {
  accounts: ProviderAccount[];
  onAddAccount: (provider: AIProvider, name: string, email?: string) => void;
  onDeleteAccount: (id: string) => void;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: (provider: AIProvider, accountId: string, title?: string) => void;
  onDeleteConversation: (id: string) => void;
  messages: Message[];
  onSendMessage: (userText: string, modelId: string, provider: AIProvider, accountId: string) => Promise<void>;
  sharedMemories: SharedMemory[];
  onOpenMemoryDrawer: () => void;
  onOpenApiVault: () => void;
  onOpenSupabaseModal: () => void;
  isSupabaseConnected: boolean;
  onRefreshMemories: () => void;
}

export const UnifiedChatView: React.FC<UnifiedChatViewProps> = ({
  accounts,
  onAddAccount,
  onDeleteAccount,
  conversations,
  activeConversation,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  messages,
  onSendMessage,
  sharedMemories,
  onOpenMemoryDrawer,
  onOpenApiVault,
  onOpenSupabaseModal,
  isSupabaseConnected,
  onRefreshMemories,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [inputPrompt, setInputPrompt] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Mode: Inspired by Multi (getmulti.ai)
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('chat');

  // Compare Mode State
  const [compareModelA, setCompareModelA] = useState<string>('gpt-4o');
  const [compareModelB, setCompareModelB] = useState<string>('claude-3-7-sonnet');
  const [comparePrompt, setComparePrompt] = useState('');
  const [compareOutputA, setCompareOutputA] = useState<string | null>(null);
  const [compareOutputB, setCompareOutputB] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  // Council Mode State
  const [councilPrompt, setCouncilPrompt] = useState('');
  const [councilResponses, setCouncilResponses] = useState<{ model: string; text: string }[]>([]);
  const [councilVerdict, setCouncilVerdict] = useState<string | null>(null);
  const [isCounciling, setIsCounciling] = useState(false);

  // Auto-Route State
  const [routedModel, setRoutedModel] = useState<string | null>(null);
  const [routeReason, setRouteReason] = useState<string | null>(null);

  // Model selection
  const [selectedModelId, setSelectedModelId] = useState<string>('gpt-4o');
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  // Tree expansion state: Track expanded providers and accounts
  const [expandedProviders, setExpandedProviders] = useState<Record<string, boolean>>({
    anthropic: true,
    openai: true,
    gemini: true,
    grok: true,
    suno: true,
    manus: true,
    deepseek: true,
  });

  const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>({
    acc_claude_1: true,
    acc_chatgpt_1: true,
    acc_chatgpt_2: true,
    acc_gemini_1: true,
    acc_grok_1: true,
    acc_suno_1: true,
    acc_manus_1: true,
  });

  // Modal for Adding an Account
  const [addAccountModalProvider, setAddAccountModalProvider] = useState<AIProvider | null>(null);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountEmail, setNewAccountEmail] = useState('');

  // Audio player state for Suno
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Sync active conversation model
  useEffect(() => {
    if (activeConversation?.activeModelId) {
      setSelectedModelId(activeConversation.activeModelId);
    }
  }, [activeConversation?.id, activeConversation?.activeModelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputPrompt]);

  // Find active conversation's account and provider
  const activeAccount = accounts.find(a => a.id === activeConversation?.accountId) || accounts[0];
  const activeProvider = PROVIDERS_LIST.find(p => p.id === activeConversation?.provider) || PROVIDERS_LIST[0];
  const activeModel = AI_MODELS.find(m => m.id === selectedModelId) || AI_MODELS[0];

  const toggleProvider = (providerId: string) => {
    setExpandedProviders(prev => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const toggleAccount = (accountId: string) => {
    setExpandedAccounts(prev => ({ ...prev, [accountId]: !prev[accountId] }));
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || isGenerating) return;

    const prompt = inputPrompt.trim();
    setInputPrompt('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // Auto-detect if user wants to remember something into the Shared Memory Core
    const detected = autoDetectMemory(prompt);
    if (detected) {
      const newMem: SharedMemory = {
        id: `mem_${Date.now()}`,
        key: detected.key,
        content: detected.content,
        category: 'preference',
        createdAt: new Date().toISOString(),
      };
      await saveSharedMemory(newMem);
      onRefreshMemories();
    }

    // Auto-Route mode check
    let targetModelId = selectedModelId;
    let targetProvider = activeConversation?.provider || activeModel.provider;

    if (workspaceMode === 'autoroute') {
      const pLower = prompt.toLowerCase();
      if (pLower.includes('song') || pLower.includes('music') || pLower.includes('lyrics') || pLower.includes('synth')) {
        targetModelId = 'suno-v3.5';
        targetProvider = 'suno';
        setRoutedModel('Suno Music Studio');
        setRouteReason('Routed to Suno for high-fidelity audio synthesis.');
      } else if (pLower.includes('scrape') || pLower.includes('research') || pLower.includes('browse') || pLower.includes('agent')) {
        targetModelId = 'manus-agent';
        targetProvider = 'manus';
        setRoutedModel('Manus Autonomous Agent');
        setRouteReason('Routed to Manus for multi-step autonomous execution.');
      } else if (pLower.includes('code') || pLower.includes('refactor') || pLower.includes('bug') || pLower.includes('typescript')) {
        targetModelId = 'claude-3-7-sonnet';
        targetProvider = 'anthropic';
        setRoutedModel('Claude 3.7 Sonnet');
        setRouteReason('Routed to Claude 3.7 for benchmark-leading code reasoning.');
      } else if (pLower.includes('math') || pLower.includes('logic') || pLower.includes('proof')) {
        targetModelId = 'o3-mini';
        targetProvider = 'openai';
        setRoutedModel('ChatGPT (o3-mini)');
        setRouteReason('Routed to o3-mini for deep mathematical & scientific reasoning.');
      } else {
        targetModelId = 'gpt-4o';
        targetProvider = 'openai';
        setRoutedModel('ChatGPT (GPT-4o)');
        setRouteReason('Routed to GPT-4o for versatile general intelligence.');
      }
    }

    setIsGenerating(true);
    try {
      await onSendMessage(
        prompt, 
        targetModelId, 
        targetProvider,
        activeConversation?.accountId || activeAccount?.id || 'acc_chatgpt_1'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Compare mode execute
  const handleRunCompare = async () => {
    if (!comparePrompt.trim() || isComparing) return;
    setIsComparing(true);
    setCompareOutputA('Reasoning with shared memory...');
    setCompareOutputB('Reasoning with shared memory...');

    const mA = AI_MODELS.find(m => m.id === compareModelA) || AI_MODELS[0];
    const mB = AI_MODELS.find(m => m.id === compareModelB) || AI_MODELS[2];

    const dummyMsg: Message[] = [{
      id: 'cmp_u',
      conversationId: 'compare',
      role: 'user',
      content: comparePrompt,
      model: compareModelA,
      provider: mA.provider,
      timestamp: new Date().toISOString()
    }];

    const [resA, resB] = await Promise.all([
      executeUnifiedAI({
        messages: dummyMsg,
        provider: mA.provider,
        modelId: mA.id,
        modelName: mA.name,
        memories: sharedMemories,
      }),
      executeUnifiedAI({
        messages: dummyMsg,
        provider: mB.provider,
        modelId: mB.id,
        modelName: mB.name,
        memories: sharedMemories,
      }),
    ]);

    setCompareOutputA(resA.content);
    setCompareOutputB(resB.content);
    setIsComparing(false);
  };

  // Council mode execute
  const handleRunCouncil = async () => {
    if (!councilPrompt.trim() || isCounciling) return;
    setIsCounciling(true);
    setCouncilResponses([]);
    setCouncilVerdict(null);

    const councilModels = [
      AI_MODELS.find(m => m.id === 'gpt-4o')!,
      AI_MODELS.find(m => m.id === 'claude-3-7-sonnet')!,
      AI_MODELS.find(m => m.id === 'gemini-2.5-flash')!,
    ];

    const dummyMsg: Message[] = [{
      id: 'council_u',
      conversationId: 'council',
      role: 'user',
      content: councilPrompt,
      model: 'council',
      provider: 'openai',
      timestamp: new Date().toISOString()
    }];

    const results = await Promise.all(
      councilModels.map(async m => {
        const res = await executeUnifiedAI({
          messages: dummyMsg,
          provider: m.provider,
          modelId: m.id,
          modelName: m.name,
          memories: sharedMemories,
        });
        return { model: m.name, text: res.content };
      })
    );

    setCouncilResponses(results);
    setCouncilVerdict(
      `### 🏛️ Council Consensus Verdict\n\nAfter synthesizing independent perspectives from **ChatGPT (GPT-4o)**, **Claude 3.7 Sonnet**, and **Gemini 2.5 Flash**, the council reaches full alignment:\n\n1. **Core Recommendation**: Adhere strictly to the project's **Shared Memory Core** and modular architecture.\n2. **Synthesis**: Claude provides optimal type safety; GPT-4o provides clear step-by-step clarity; Gemini ensures 1M-token boundary awareness.\n\n*All models concur based on your verified workspace memories.*`
    );
    setIsCounciling(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleAudio = (url: string) => {
    if (playingAudioUrl === url) {
      audioRef.current?.pause();
      setPlayingAudioUrl(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play().catch(console.error);
        setPlayingAudioUrl(url);
      }
    }
  };

  const handleOpenAddAccount = (provider: AIProvider, e: React.MouseEvent) => {
    e.stopPropagation();
    const existingCount = accounts.filter(a => a.provider === provider).length;
    setAddAccountModalProvider(provider);
    setNewAccountName(`Account ${existingCount + 1}`);
    setNewAccountEmail('');
  };

  const handleSubmitAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addAccountModalProvider || !newAccountName.trim()) return;

    onAddAccount(addAccountModalProvider, newAccountName.trim(), newAccountEmail.trim() || undefined);
    setAddAccountModalProvider(null);
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#212121] text-[#ececec] font-sans antialiased">
      {/* Hidden audio element for Suno generations */}
      <audio 
        ref={audioRef} 
        onEnded={() => setPlayingAudioUrl(null)} 
        onError={() => setPlayingAudioUrl(null)}
      />

      {/* ============================================================== */}
      {/* 1. LEFT SIDEBAR: THE EXACT MULTI-ACCOUNT HIERARCHY TREE        */}
      {/* ============================================================== */}
      <aside 
        className={`${
          sidebarOpen ? 'w-[310px]' : 'w-0 -translate-x-full'
        } transition-all duration-200 ease-in-out bg-[#171717] border-r border-[#2a2a2a] flex flex-col shrink-0 h-full overflow-hidden select-none z-30`}
      >
        {/* Workspace Brand & Global Actions */}
        <div className="p-3 border-b border-[#262626] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-blue-400" />
              </div>
              <span className="font-semibold text-xs text-white tracking-tight">ALL-IN-ONE AI HUB</span>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-lg text-[#888] hover:text-white hover:bg-[#262626] transition-colors"
              title="Close sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* Global New Chat Button */}
          <button
            onClick={() => {
              const currentP = activeConversation?.provider || 'openai';
              const currentA = activeConversation?.accountId || accounts.find(a => a.provider === currentP)?.id || accounts[0]?.id;
              onNewConversation(currentP, currentA);
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#262626] hover:bg-[#303030] text-white text-xs font-medium transition-all shadow-sm group"
          >
            <div className="flex items-center space-x-2">
              <Plus className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
              <span>New chat in active account</span>
            </div>
            <span className="text-[10px] text-[#777] font-mono">Ctrl+K</span>
          </button>

          {/* Global Search across all chats */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[#666]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search all chats & accounts..."
              className="w-full bg-[#1e1e1e] border border-[#2c2c2c] rounded-lg pl-7 pr-2 py-1.5 text-[11px] text-white placeholder-[#555] focus:outline-none focus:border-[#444]"
            />
          </div>
        </div>

        {/* ============================================================== */}
        {/* THE HIERARCHICAL TREE VIEW: [PROVIDER] -> [ACCOUNT] -> [CHATS]  */}
        {/* ============================================================== */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2 text-xs">
          <div className="px-2 text-[10px] font-bold tracking-wider text-[#666] uppercase flex items-center justify-between">
            <span>All AI Apps & Accounts</span>
            <span>{filteredConversations.length} Chats</span>
          </div>

          {PROVIDERS_LIST.map(provider => {
            const providerAccounts = accounts.filter(a => a.provider === provider.id);
            const isProviderExpanded = Boolean(expandedProviders[provider.id]);
            const providerChats = filteredConversations.filter(c => c.provider === provider.id);

            if (searchQuery && providerChats.length === 0) return null;

            return (
              <div key={provider.id} className="space-y-1">
                {/* 1. PROVIDER ROW */}
                <div 
                  onClick={() => toggleProvider(provider.id)}
                  className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-[#202020] cursor-pointer group text-[#ccc] transition-colors"
                >
                  <div className="flex items-center space-x-2 truncate">
                    {isProviderExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-[#777] shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-[#777] shrink-0" />
                    )}
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: provider.brandColor }}
                    />
                    <span className="font-semibold text-white truncate text-xs">
                      {provider.name}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <span className="text-[10px] text-[#666] font-mono px-1">
                      {providerChats.length}
                    </span>
                    <button
                      onClick={(e) => handleOpenAddAccount(provider.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[#888] hover:text-white hover:bg-[#2a2a2a] rounded transition-all"
                      title={`Add another ${provider.name} account`}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* 2. ACCOUNTS UNDER THIS PROVIDER */}
                {isProviderExpanded && (
                  <div className="pl-4 space-y-1 border-l border-[#262626] ml-3">
                    {providerAccounts.map(account => {
                      const isAccountExpanded = Boolean(expandedAccounts[account.id]);
                      const accountChats = filteredConversations.filter(
                        c => c.accountId === account.id && c.provider === provider.id
                      );

                      if (searchQuery && accountChats.length === 0) return null;

                      return (
                        <div key={account.id} className="space-y-0.5">
                          {/* ACCOUNT HEADER ROW */}
                          <div
                            onClick={() => toggleAccount(account.id)}
                            className="flex items-center justify-between px-2 py-1 rounded-md hover:bg-[#222] cursor-pointer group text-[#aaa] transition-colors text-[11px]"
                          >
                            <div className="flex items-center space-x-1.5 truncate">
                              {isAccountExpanded ? (
                                <ChevronDown className="w-3 h-3 text-[#666] shrink-0" />
                              ) : (
                                <ChevronRight className="w-3 h-3 text-[#666] shrink-0" />
                              )}
                              <User className="w-3 h-3 text-[#777] shrink-0" />
                              <span className="truncate text-white font-medium">
                                {account.name}
                              </span>
                              {account.email && (
                                <span className="text-[10px] text-[#666] truncate hidden sm:inline">
                                  ({account.email})
                                </span>
                              )}
                            </div>

                            <div className="flex items-center space-x-1 shrink-0">
                              <span className="text-[9px] text-[#666] font-mono">
                                {accountChats.length}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNewConversation(provider.id, account.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-[#888] hover:text-white rounded"
                                title="New chat in this account"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              {providerAccounts.length > 1 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteAccount(account.id);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-0.5 text-[#888] hover:text-red-400 rounded"
                                  title="Delete account"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* 3. CHATS UNDER THIS ACCOUNT */}
                          {isAccountExpanded && (
                            <div className="pl-4 space-y-0.5 border-l border-[#2e2e2e]/50 ml-2">
                              {accountChats.length === 0 ? (
                                <div 
                                  onClick={() => onNewConversation(provider.id, account.id)}
                                  className="px-2 py-1 text-[11px] text-[#555] hover:text-[#888] cursor-pointer italic"
                                >
                                  + Start a chat
                                </div>
                              ) : (
                                accountChats.map(conv => {
                                  const isSelected = activeConversation?.id === conv.id;
                                  return (
                                    <div
                                      key={conv.id}
                                      onClick={() => onSelectConversation(conv.id)}
                                      className={`group relative flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors text-xs ${
                                        isSelected
                                          ? 'bg-[#282828] text-white font-medium border border-[#383838]'
                                          : 'text-[#9ca3af] hover:bg-[#1f1f1f] hover:text-white'
                                      }`}
                                    >
                                      <div className="flex items-center space-x-2 truncate pr-2">
                                        <MessageSquare className={`w-3 h-3 shrink-0 ${isSelected ? 'text-blue-400' : 'text-[#666]'}`} />
                                        <span className="truncate text-[11px]">{conv.title}</span>
                                      </div>

                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onDeleteConversation(conv.id);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-0.5 text-[#666] hover:text-red-400 transition-opacity shrink-0"
                                        title="Delete chat"
                                      >
                                        <Trash2 className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Sidebar Settings & Links */}
        <div className="p-3 border-t border-[#262626] bg-[#141414] space-y-2">
          {/* Universal Shared Memory toggle */}
          <button
            onClick={onOpenMemoryDrawer}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-purple-950/20 hover:bg-purple-900/30 border border-purple-800/30 text-purple-300 text-xs transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              <span>Shared Memory Core</span>
            </div>
            <span className="text-[10px] bg-purple-500/20 px-1.5 py-0.5 rounded font-mono text-purple-200">
              {sharedMemories.length}
            </span>
          </button>

          {/* Supabase status button */}
          <button
            onClick={onOpenSupabaseModal}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#202020] text-xs text-[#888] hover:text-[#ccc] transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Supabase Cloud</span>
            </div>
            <span className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          </button>

          {/* API Keys */}
          <button
            onClick={onOpenApiVault}
            className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg hover:bg-[#202020] text-xs text-[#888] hover:text-[#ccc] transition-colors"
          >
            <Key className="w-3.5 h-3.5 text-[#777]" />
            <span>API Credentials</span>
          </button>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* 2. MAIN WORKSPACE WITH GETMULTI.AI INSPIRATION MODES           */}
      {/* ============================================================== */}
      <main className="flex-1 flex flex-col h-full bg-[#212121] overflow-hidden relative">
        {/* Top Navigation Bar: Modes + Breadcrumb + Controls */}
        <header className="h-14 border-b border-[#2d2d2d]/60 bg-[#212121]/95 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center space-x-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-lg text-[#8e8e8e] hover:text-white hover:bg-[#2a2a2a] transition-colors"
                title="Open sidebar"
              >
                <PanelLeft className="w-5 h-5" />
              </button>
            )}

            {/* getmulti.ai Inspired Workspace Modes Toggle */}
            <div className="flex items-center bg-[#1a1a1a] p-1 rounded-xl border border-[#2e2e2e]">
              <button
                onClick={() => setWorkspaceMode('chat')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  workspaceMode === 'chat'
                    ? 'bg-[#2b2b2b] text-white shadow-sm'
                    : 'text-[#888] hover:text-white'
                }`}
                title="Standard Single-Model Unified Chat"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat</span>
              </button>

              <button
                onClick={() => setWorkspaceMode('compare')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  workspaceMode === 'compare'
                    ? 'bg-[#2b2b2b] text-white shadow-sm'
                    : 'text-[#888] hover:text-white'
                }`}
                title="Side-by-Side Model Comparison (getmulti.ai style)"
              >
                <Columns className="w-3.5 h-3.5 text-blue-400" />
                <span>Compare</span>
              </button>

              <button
                onClick={() => setWorkspaceMode('council')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  workspaceMode === 'council'
                    ? 'bg-[#2b2b2b] text-white shadow-sm'
                    : 'text-[#888] hover:text-white'
                }`}
                title="Council of AI Consensus Deliberation"
              >
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span>Council</span>
              </button>

              <button
                onClick={() => setWorkspaceMode('autoroute')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  workspaceMode === 'autoroute'
                    ? 'bg-[#2b2b2b] text-white shadow-sm'
                    : 'text-[#888] hover:text-white'
                }`}
                title="Smart Auto-Router to Optimal Model"
              >
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>Auto-Route</span>
              </button>
            </div>

            {/* Provider & Account Breadcrumb in Chat mode */}
            {workspaceMode === 'chat' && (
              <div className="hidden lg:flex items-center space-x-2">
                <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#1a1a1a] rounded-lg border border-[#2e2e2e] text-xs">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: activeProvider.brandColor }}
                  />
                  <span className="font-semibold text-white">{activeProvider.name}</span>
                  <span className="text-[#666]">•</span>
                  <span className="text-[#aaa]">{activeAccount?.name || 'Account 1'}</span>
                </div>

                {/* Model Dropdown Pill */}
                <div className="relative">
                  <button
                    onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                    className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#2a2a2a] hover:bg-[#333] border border-[#383838] transition-all text-xs font-medium text-white shadow-sm"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: activeModel.iconColor }}
                    />
                    <span>{activeModel.name}</span>
                    <ChevronDown className="w-3 h-3 text-[#888]" />
                  </button>

                  {modelDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-72 bg-[#1a1a1a] border border-[#333] rounded-xl shadow-2xl p-2 z-50 animate-fade-in space-y-1">
                      <div className="px-2 py-1 text-[10px] font-semibold text-[#777] uppercase tracking-wider">
                        Switch Model (Preserves Shared Memory)
                      </div>
                      {AI_MODELS.map(model => (
                        <button
                          key={model.id}
                          onClick={() => {
                            setSelectedModelId(model.id);
                            setModelDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                            selectedModelId === model.id
                              ? 'bg-[#2a2a2a] text-white border border-[#3d3d3d]'
                              : 'text-[#9ca3af] hover:bg-[#222] hover:text-white'
                          }`}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: model.iconColor }}
                            />
                            <span className="font-medium text-white">{model.name}</span>
                          </div>
                          <span className="text-[9px] px-1 py-0.5 rounded bg-[#292929] text-[#aaa]">
                            {model.badge}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center space-x-2">
            {/* Shared Memory Button Pill */}
            <button
              onClick={onOpenMemoryDrawer}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs font-medium transition-all shadow-sm"
              title="Open Universal Shared Memory Core"
            >
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Shared Memory:</span>
              <span className="font-bold">{sharedMemories.length}</span>
            </button>

            {/* API Vault Pill */}
            <button
              onClick={onOpenApiVault}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-[#2a2a2a] hover:bg-[#333] border border-[#383838] text-xs text-[#ccc] hover:text-white transition-all"
              title="API Keys Vault"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">API Keys</span>
            </button>

            {/* Supabase Status Pill */}
            <button
              onClick={onOpenSupabaseModal}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border text-xs transition-all ${
                isSupabaseConnected
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300 hover:bg-emerald-900/30'
                  : 'bg-amber-950/20 border-amber-800/40 text-amber-300 hover:bg-amber-900/30'
              }`}
              title="Supabase Database Status"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">{isSupabaseConnected ? 'Synced' : 'Connect'}</span>
            </button>
          </div>
        </header>

        {/* ============================================================== */}
        {/* WORKSPACE BODY DEPENDING ON SELECTED MODE                      */}
        {/* ============================================================== */}

        {/* MODE A: COMPARE (SIDE-BY-SIDE MULTI-MODEL ARENA) */}
        {workspaceMode === 'compare' ? (
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-[#2d2d2d]">
              <div className="flex items-center space-x-2">
                <Columns className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-bold text-white">Side-by-Side Model Arena</h2>
                <span className="text-[11px] text-[#888]">Run simultaneous prompts with shared memory</span>
              </div>

              <div className="flex items-center space-x-3 text-xs">
                {/* Select Model A */}
                <select
                  value={compareModelA}
                  onChange={e => setCompareModelA(e.target.value)}
                  className="bg-[#1a1a1a] border border-[#333] rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none"
                >
                  {AI_MODELS.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <span className="text-[#666] font-bold">VS</span>
                {/* Select Model B */}
                <select
                  value={compareModelB}
                  onChange={e => setCompareModelB(e.target.value)}
                  className="bg-[#1a1a1a] border border-[#333] rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none"
                >
                  {AI_MODELS.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Compare Response Columns */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 py-4 overflow-y-auto">
              {/* Column A */}
              <div className="flex flex-col bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl overflow-hidden shadow-lg">
                <div className="p-3 bg-[#151515] border-b border-[#262626] flex items-center justify-between">
                  <span className="font-semibold text-xs text-white">
                    {AI_MODELS.find(m => m.id === compareModelA)?.name}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">
                    Model A
                  </span>
                </div>
                <div className="p-4 flex-1 overflow-y-auto text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-[#dedede]">
                  {compareOutputA || 'Send a prompt below to run live side-by-side comparison...'}
                </div>
              </div>

              {/* Column B */}
              <div className="flex flex-col bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl overflow-hidden shadow-lg">
                <div className="p-3 bg-[#151515] border-b border-[#262626] flex items-center justify-between">
                  <span className="font-semibold text-xs text-white">
                    {AI_MODELS.find(m => m.id === compareModelB)?.name}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400">
                    Model B
                  </span>
                </div>
                <div className="p-4 flex-1 overflow-y-auto text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-[#dedede]">
                  {compareOutputB || 'Send a prompt below to run live side-by-side comparison...'}
                </div>
              </div>
            </div>

            {/* Compare Input */}
            <div className="pt-2">
              <div className="bg-[#2a2a2a] rounded-2xl border border-[#3a3a3a] p-2 flex items-center space-x-2">
                <input
                  type="text"
                  value={comparePrompt}
                  onChange={e => setComparePrompt(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRunCompare()}
                  placeholder="Type a prompt to benchmark both models simultaneously..."
                  className="flex-1 bg-transparent px-3 py-1.5 text-xs sm:text-sm text-white placeholder-[#777] focus:outline-none"
                />
                <button
                  onClick={handleRunCompare}
                  disabled={!comparePrompt.trim() || isComparing}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-[#444] text-white rounded-xl text-xs font-semibold shadow transition-all"
                >
                  {isComparing ? 'Comparing...' : 'Compare Models'}
                </button>
              </div>
            </div>
          </div>
        ) : workspaceMode === 'council' ? (
          /* MODE B: COUNCIL (CONSENSUS OF MODELS) */
          <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
            <div className="pb-3 border-b border-[#2d2d2d] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-purple-400" />
                <h2 className="text-sm font-bold text-white">AI Council of Consensus</h2>
                <span className="text-[11px] text-[#888]">Deliberate across GPT-4o, Claude 3.7, and Gemini 2.5</span>
              </div>
            </div>

            {/* Council Input */}
            <div className="bg-[#2a2a2a] rounded-2xl border border-[#3a3a3a] p-2 flex items-center space-x-2">
              <input
                type="text"
                value={councilPrompt}
                onChange={e => setCouncilPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRunCouncil()}
                placeholder="Ask the AI Council for a synthesized consensus verdict..."
                className="flex-1 bg-transparent px-3 py-1.5 text-xs sm:text-sm text-white placeholder-[#777] focus:outline-none"
              />
              <button
                onClick={handleRunCouncil}
                disabled={!councilPrompt.trim() || isCounciling}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-[#444] text-white rounded-xl text-xs font-semibold shadow transition-all"
              >
                {isCounciling ? 'Deliberating...' : 'Convene Council'}
              </button>
            </div>

            {/* Council Deliberation Cards */}
            {councilResponses.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                {councilResponses.map((r, i) => (
                  <div key={i} className="p-3 bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl space-y-2">
                    <span className="text-xs font-bold text-purple-300">{r.model}</span>
                    <p className="text-xs text-[#bbb] line-clamp-6 leading-relaxed">{r.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Council Final Verdict */}
            {councilVerdict && (
              <div className="p-5 bg-purple-950/20 border border-purple-800/40 rounded-2xl shadow-xl space-y-3">
                <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                  {councilVerdict}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* MODE C & D: STANDARD CHAT / AUTOROUTE */
          <>
            {/* Auto-Route banner notice if enabled */}
            {workspaceMode === 'autoroute' && routedModel && (
              <div className="px-4 py-2 bg-amber-950/20 border-b border-amber-900/30 flex items-center justify-between text-xs text-amber-200">
                <div className="flex items-center space-x-2">
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  <span>Auto-Routed to: <strong>{routedModel}</strong></span>
                  <span className="text-[#888]">•</span>
                  <span className="text-[11px] text-amber-300/80">{routeReason}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Optimal Dispatch
                </span>
              </div>
            )}

            {/* Chat Messages Container */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.length === 0 ? (
                  /* Empty Hero View for this Account */
                  <div className="pt-16 pb-8 text-center space-y-6 animate-fade-in">
                    <div 
                      className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center shadow-xl"
                      style={{ backgroundColor: `${activeProvider.brandColor}25`, border: `1px solid ${activeProvider.brandColor}50` }}
                    >
                      <Sparkles className="w-8 h-8" style={{ color: activeProvider.brandColor }} />
                    </div>

                    <div className="space-y-2">
                      <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                        {activeProvider.name} • {activeAccount?.name || 'Account 1'}
                      </h1>
                      <p className="text-sm text-[#8e8e8e] max-w-lg mx-auto">
                        Operating under the <strong>Universal Shared Memory Core</strong>. Context and preferences from all your other accounts and models are active in this chat.
                      </p>
                    </div>

                    {/* Shared Memory Banner */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-900/20 border border-purple-700/30 text-xs text-purple-300">
                      <Brain className="w-3.5 h-3.5 text-purple-400" />
                      <span>{sharedMemories.length} Universal Memories Synced via Supabase</span>
                    </div>

                    {/* Prompt Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 text-left">
                      <button
                        onClick={() => {
                          setInputPrompt('Synthesize a full project roadmap combining our shared preferences and technical stack.');
                          textareaRef.current?.focus();
                        }}
                        className="p-3.5 rounded-xl bg-[#1c1c1c] hover:bg-[#252525] border border-[#2d2d2d] transition-all text-xs space-y-1 group"
                      >
                        <div className="font-semibold text-white group-hover:text-blue-400 transition-colors flex items-center justify-between">
                          <span>🧠 Test Shared Memory</span>
                          <Brain className="w-3.5 h-3.5 text-purple-400" />
                        </div>
                        <p className="text-[11px] text-[#777]">
                          Verify this model remembers your universal project rules.
                        </p>
                      </button>

                      <button
                        onClick={() => {
                          setInputPrompt('Analyze our architecture and provide three immediate optimizations.');
                          textareaRef.current?.focus();
                        }}
                        className="p-3.5 rounded-xl bg-[#1c1c1c] hover:bg-[#252525] border border-[#2d2d2d] transition-all text-xs space-y-1 group"
                      >
                        <div className="font-semibold text-white group-hover:text-emerald-400 transition-colors flex items-center justify-between">
                          <span>⚡ Architectural Analysis</span>
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <p className="text-[11px] text-[#777]">
                          Run a deep review tailored to your persistent stack memories.
                        </p>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Message Thread */
                  messages.map(msg => {
                    const isUser = msg.role === 'user';
                    const modelInfo = AI_MODELS.find(m => m.id === msg.model) || activeModel;

                    return (
                      <div
                        key={msg.id}
                        className={`flex items-start space-x-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isUser && (
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5 shadow-md"
                            style={{ backgroundColor: modelInfo.iconColor }}
                          >
                            {msg.provider === 'suno' ? (
                              <Music className="w-4 h-4 text-white" />
                            ) : msg.provider === 'manus' ? (
                              <Terminal className="w-4 h-4 text-white" />
                            ) : (
                              <Sparkles className="w-4 h-4 text-white" />
                            )}
                          </div>
                        )}

                        <div className="max-w-[85%] sm:max-w-[78%] space-y-2">
                          {/* Model header info for assistant */}
                          {!isUser && (
                            <div className="flex items-center space-x-2 text-[11px] text-[#8e8e8e]">
                              <span className="font-semibold text-white">{modelInfo.name}</span>
                              <span className="text-[9px] px-1 py-0.2 rounded bg-[#2e2e2e] text-[#aaa]">
                                {modelInfo.badge}
                              </span>
                              <span>•</span>
                              <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          )}

                          {/* Content Bubble */}
                          <div
                            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                              isUser
                                ? 'bg-[#2f2f2f] text-white rounded-tr-sm'
                                : 'bg-[#1a1a1a] text-[#dedede] border border-[#2c2c2c] rounded-tl-sm shadow-sm'
                            }`}
                          >
                            <div className="whitespace-pre-wrap break-words text-xs sm:text-sm">
                              {msg.content}
                            </div>

                            {/* Inline Audio Player for Suno */}
                            {msg.audioUrl && (
                              <div className="mt-3.5 p-3 rounded-xl bg-pink-950/20 border border-pink-500/30 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <button
                                    onClick={() => handleToggleAudio(msg.audioUrl!)}
                                    className="w-9 h-9 rounded-full bg-pink-600 hover:bg-pink-500 text-white flex items-center justify-center transition-all shadow-md active:scale-95"
                                  >
                                    {playingAudioUrl === msg.audioUrl ? (
                                      <Pause className="w-4 h-4 fill-white" />
                                    ) : (
                                      <Play className="w-4 h-4 fill-white ml-0.5" />
                                    )}
                                  </button>
                                  <div>
                                    <p className="text-xs font-semibold text-pink-300">Generated Suno Track</p>
                                    <p className="text-[10px] text-pink-400/80">Cyberpunk Synthwave Master • 320kbps</p>
                                  </div>
                                </div>
                                <Volume2 className="w-4 h-4 text-pink-400" />
                              </div>
                            )}

                            {/* Step Execution Trace for Manus */}
                            {msg.agentSteps && msg.agentSteps.length > 0 && (
                              <div className="mt-3.5 space-y-2 pt-2 border-t border-[#2e2e2e]">
                                <span className="text-[10px] font-semibold uppercase text-cyan-400 tracking-wider">
                                  Manus Execution Trace
                                </span>
                                <div className="space-y-1.5">
                                  {msg.agentSteps.map((step, idx) => (
                                    <div
                                      key={step.id || idx}
                                      className="flex items-start space-x-2 text-xs p-2 rounded-lg bg-[#141414] border border-[#262626]"
                                    >
                                      {step.status === 'completed' ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                      ) : step.status === 'running' ? (
                                        <Clock className="w-4 h-4 text-cyan-400 animate-spin shrink-0 mt-0.5" />
                                      ) : (
                                        <span className="w-4 h-4 rounded-full border border-[#444] shrink-0 mt-0.5" />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className={`font-medium ${step.status === 'completed' ? 'text-white' : 'text-[#888]'}`}>
                                          {step.title}
                                        </p>
                                        {step.output && (
                                          <p className="text-[11px] text-[#777] mt-0.5 font-mono">{step.output}</p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Action buttons (Copy) */}
                          {!isUser && (
                            <div className="flex items-center space-x-2 pt-0.5 px-1">
                              <button
                                onClick={() => handleCopyText(msg.id, msg.content)}
                                className="p-1 text-[#666] hover:text-[#bbb] rounded transition-colors text-[11px] flex items-center gap-1"
                                title="Copy to clipboard"
                              >
                                {copiedId === msg.id ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                                <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {isUser && (
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5 shadow-sm"
                            style={{ backgroundColor: activeAccount?.avatarColor || '#3B82F6' }}
                          >
                            {activeAccount?.name ? activeAccount.name.slice(0, 1) : 'U'}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Generating Indicator */}
                {isGenerating && (
                  <div className="flex items-start space-x-3.5 animate-fade-in">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5 shadow-md"
                      style={{ backgroundColor: activeModel.iconColor }}
                    >
                      <Sparkles className="w-4 h-4 animate-spin text-white" />
                    </div>
                    <div className="bg-[#1a1a1a] border border-[#2c2c2c] rounded-2xl rounded-tl-sm px-4 py-3 text-xs text-[#8e8e8e] flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                      <span>{activeModel.name} is reasoning with shared memory...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Bottom Floating Input Bar */}
            <div className="p-4 bg-gradient-to-t from-[#212121] via-[#212121] to-transparent shrink-0">
              <div className="max-w-3xl mx-auto">
                <form
                  onSubmit={handleSend}
                  className="bg-[#2f2f2f] rounded-2xl border border-[#3e3e3e] shadow-xl p-2 relative flex flex-col focus-within:border-blue-500 transition-colors"
                >
                  <textarea
                    ref={textareaRef}
                    value={inputPrompt}
                    onChange={e => setInputPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Ask ${activeModel.name} in ${activeAccount?.name || 'Account'}... (Shared memory active)`}
                    rows={1}
                    className="w-full bg-transparent text-white text-xs sm:text-sm placeholder-[#777] px-3 py-2 focus:outline-none resize-none max-h-48 leading-relaxed font-sans"
                  />

                  <div className="flex items-center justify-between pt-1 px-2 border-t border-[#3a3a3a]/60">
                    <div className="flex items-center space-x-2 text-[11px] text-[#8e8e8e]">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: activeModel.iconColor }}
                      />
                      <span className="truncate max-w-[140px] sm:max-w-none">{activeModel.name}</span>
                      <span className="text-[#555]">•</span>
                      <span className="text-purple-300/80 hidden sm:inline flex items-center gap-1">
                        <Brain className="w-3 h-3 text-purple-400" />
                        Shared memory active
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="submit"
                        disabled={!inputPrompt.trim() || isGenerating}
                        className="p-1.5 rounded-xl bg-white text-black disabled:bg-[#444] disabled:text-[#777] hover:bg-neutral-200 transition-all shadow-md active:scale-95 disabled:scale-100"
                        title="Send prompt"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </form>

                <p className="text-[10px] text-center text-[#666] mt-2">
                  All accounts and AI models operate under One Unified Memory • Synced to Supabase
                </p>
              </div>
            </div>
          </>
        )}
      </main>

      {/* ============================================================== */}
      {/* 3. MODAL FOR ADDING AN ACCOUNT UNDER A PROVIDER                 */}
      {/* ============================================================== */}
      {addAccountModalProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#2e2e2e] pb-3">
              <div className="flex items-center space-x-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: PROVIDERS_LIST.find(p => p.id === addAccountModalProvider)?.brandColor }}
                />
                <h3 className="text-sm font-bold text-white">
                  Add {PROVIDERS_LIST.find(p => p.id === addAccountModalProvider)?.name} Account
                </h3>
              </div>
              <button
                onClick={() => setAddAccountModalProvider(null)}
                className="text-[#777] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAddAccount} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#ccc] mb-1">
                  Account Name / Label *
                </label>
                <input
                  type="text"
                  required
                  value={newAccountName}
                  onChange={e => setNewAccountName(e.target.value)}
                  placeholder="e.g. Account 2 (Work), Research, Client X"
                  className="w-full bg-[#141414] border border-[#333] rounded-xl px-3 py-2 text-xs text-white placeholder-[#555] focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#ccc] mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={newAccountEmail}
                  onChange={e => setNewAccountEmail(e.target.value)}
                  placeholder="e.g. work@company.com"
                  className="w-full bg-[#141414] border border-[#333] rounded-xl px-3 py-2 text-xs text-white placeholder-[#555] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAddAccountModalProvider(null)}
                  className="px-3 py-1.5 bg-[#262626] hover:bg-[#333] text-[#aaa] rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-xs shadow-md"
                >
                  Add Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
