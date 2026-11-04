import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  SquarePen, 
  PanelLeftClose, 
  PanelLeft, 
  ChevronDown, 
  ArrowUp, 
  Paperclip, 
  Check, 
  Copy, 
  Trash2, 
  ExternalLink, 
  Search, 
  User, 
  Database,
  Globe,
  MoreHorizontal
} from 'lucide-react';
import { GoogleAccountProfile, Conversation, Message } from '../types';
import { CHATGPT_MODELS, WEB_AI_APPS } from '../lib/constants';
import { 
  getStoredConversations, 
  saveConversation, 
  deleteConversation, 
  getStoredMessages, 
  saveMessage 
} from '../lib/storage';
import { generateAIResponse } from '../lib/ai-service';

interface ChatGPTLayoutProps {
  accounts: GoogleAccountProfile[];
  activeAccount: GoogleAccountProfile;
  onSelectAccount: (id: string) => void;
  onOpenAccountsModal: () => void;
  onOpenSupabaseModal: () => void;
  isSupabaseConnected: boolean;
}

export const ChatGPTLayout: React.FC<ChatGPTLayoutProps> = ({
  accounts,
  activeAccount,
  onSelectAccount,
  onOpenAccountsModal,
  onOpenSupabaseModal,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('gpt-4o');
  const [isGenerating, setIsGenerating] = useState(false);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [webAppsMenuOpen, setWebAppsMenuOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeModel = CHATGPT_MODELS.find(m => m.id === selectedModelId) || CHATGPT_MODELS[0];

  useEffect(() => {
    const list = getStoredConversations(activeAccount.id);
    setConversations(list);
    if (list.length > 0) {
      setActiveConvId(list[0].id);
    } else {
      handleNewChat();
    }
  }, [activeAccount.id]);

  useEffect(() => {
    if (activeConvId) {
      const msgs = getStoredMessages(activeConvId);
      setMessages(msgs);
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleNewChat = () => {
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      googleAccountId: activeAccount.id,
      title: 'New chat',
      provider: activeModel.provider,
      model: activeModel.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveConversation(newConv);
    setConversations(prev => [newConv, ...prev]);
    setActiveConvId(newConv.id);
    setMessages([]);
  };

  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConversation(id, activeAccount.id);
    const updated = conversations.filter(c => c.id !== id);
    setConversations(updated);
    if (activeConvId === id) {
      if (updated.length > 0) setActiveConvId(updated[0].id);
      else handleNewChat();
    }
  };

  const handleSend = async (customPrompt?: string) => {
    const text = (customPrompt || inputText).trim();
    if (!text || isGenerating || !activeConvId) return;

    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId: activeConvId,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const activeConv = conversations.find(c => c.id === activeConvId);
    if (activeConv && (activeConv.title === 'New chat' || messages.length === 0)) {
      const title = text.slice(0, 30) + (text.length > 30 ? '...' : '');
      const updated = { ...activeConv, title, updatedAt: new Date().toISOString() };
      saveConversation(updated);
      setConversations(prev => prev.map(c => c.id === activeConvId ? updated : c));
    }

    await saveMessage(userMessage);
    const currentList = [...messages, userMessage];
    setMessages(currentList);

    setIsGenerating(true);
    const assistantId = `msg-assistant-${Date.now()}`;
    const initialAssistantMsg: Message = {
      id: assistantId,
      conversationId: activeConvId,
      role: 'assistant',
      content: '',
      model: activeModel.name,
      provider: activeModel.provider,
      timestamp: new Date().toISOString(),
    };
    setMessages([...currentList, initialAssistantMsg]);

    try {
      const finalResponse = await generateAIResponse({
        messages: currentList,
        provider: activeModel.provider,
        model: activeModel.name,
        onChunk: (chunk) => {
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: chunk } : m));
        },
      });

      const finished = { ...initialAssistantMsg, content: finalResponse };
      await saveMessage(finished);
      setMessages(prev => prev.map(m => m.id === assistantId ? finished : m));
    } catch (err: any) {
      const errorMsg = { ...initialAssistantMsg, content: `Error: ${err?.message || 'Failed to generate response'}` };
      await saveMessage(errorMsg);
      setMessages(prev => prev.map(m => m.id === assistantId ? errorMsg : m));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredConversations = conversations.filter(c => 
    c.title.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#212121] text-[#ececec] font-sans antialiased">
      <aside 
        className={`${
          sidebarOpen ? 'w-[260px]' : 'w-0 -translate-x-full'
        } transition-all duration-200 ease-in-out bg-[#171717] border-r border-[#262626] flex flex-col shrink-0 h-full overflow-hidden select-none z-20`}
      >
        <div className="p-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg text-[#b4b4b4] hover:text-white hover:bg-[#212121] transition-colors"
            title="Close sidebar"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>

          <button
            onClick={handleNewChat}
            className="p-2 rounded-lg text-[#b4b4b4] hover:text-white hover:bg-[#212121] transition-colors"
            title="New chat"
          >
            <SquarePen className="w-5 h-5" />
          </button>
        </div>

        <div className="px-3 pb-2">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-[#676767] absolute left-2.5" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#212121] border border-[#2e2e2e] rounded-lg text-xs text-[#ececec] placeholder-[#676767] focus:outline-none focus:border-[#424242]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1 py-1">
          <div className="px-2 pt-2 pb-1 text-[11px] font-semibold text-[#8e8e8e]">Chats ({activeAccount.displayName})</div>
          {filteredConversations.map(conv => {
            const isActive = conv.id === activeConvId;
            return (
              <div
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                  isActive 
                    ? 'bg-[#212121] text-white font-medium' 
                    : 'text-[#b4b4b4] hover:text-white hover:bg-[#212121]/60'
                }`}
              >
                <span className="truncate pr-4">{conv.title}</span>

                <button
                  onClick={(e) => handleDeleteChat(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-[#8e8e8e] hover:text-red-400 transition-opacity"
                  title="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="p-2 border-t border-[#262626] relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#212121] transition-colors text-left"
          >
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm"
                style={{ backgroundColor: activeAccount.color }}
              >
                {activeAccount.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-white truncate">{activeAccount.displayName}</div>
                <div className="text-[11px] text-[#8e8e8e] truncate">{activeAccount.email}</div>
              </div>
            </div>
            <MoreHorizontal className="w-4 h-4 text-[#8e8e8e] shrink-0" />
          </button>

          {userMenuOpen && (
            <div className="absolute bottom-16 left-2 right-2 bg-[#212121] border border-[#383838] rounded-2xl shadow-2xl p-2 z-50 space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-[#8e8e8e] uppercase tracking-wider">
                Google Accounts
              </div>

              {accounts.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => {
                    onSelectAccount(acc.id);
                    setUserMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-[#2f2f2f] text-xs transition-colors"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: acc.color }} />
                    <span className="truncate">{acc.displayName}</span>
                  </div>
                  {acc.id === activeAccount.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              ))}

              <div className="pt-1 border-t border-[#2f2f2f] space-y-0.5">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    onOpenAccountsModal();
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-left hover:bg-[#2f2f2f] text-xs text-[#ececec] transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-[#4285F4]" />
                  <span>Manage Google Accounts</span>
                </button>

                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    onOpenSupabaseModal();
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-left hover:bg-[#2f2f2f] text-xs text-[#ececec] transition-colors"
                >
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Supabase Cloud Backup</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#212121]">
        <header className="h-14 px-4 flex items-center justify-between border-b border-[#2e2e2e]/50 z-10">
          <div className="flex items-center space-x-2">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg text-[#b4b4b4] hover:text-white hover:bg-[#2f2f2f] transition-colors mr-1"
                title="Open sidebar"
              >
                <PanelLeft className="w-5 h-5" />
              </button>
            )}

            <div className="relative">
              <button
                onClick={() => setModelMenuOpen(!modelMenuOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl hover:bg-[#2f2f2f] transition-colors text-left"
              >
                <span className="text-base font-semibold text-white tracking-tight">{activeModel.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-[#2f2f2f] text-[#8e8e8e] border border-[#3e3e3e]">
                  {activeModel.badge}
                </span>
                <ChevronDown className="w-4 h-4 text-[#8e8e8e]" />
              </button>

              {modelMenuOpen && (
                <div className="absolute top-12 left-0 w-72 bg-[#212121] border border-[#383838] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in duration-100">
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-[#8e8e8e] uppercase tracking-wider">
                    Model Switcher
                  </div>
                  {CHATGPT_MODELS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelectedModelId(m.id);
                        setModelMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors ${
                        m.id === selectedModelId ? 'bg-[#2f2f2f] text-white' : 'hover:bg-[#282828] text-[#b4b4b4]'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-semibold text-white">{m.name}</div>
                        <div className="text-[11px] text-[#8e8e8e] line-clamp-1">{m.description}</div>
                      </div>
                      {m.id === selectedModelId && <Check className="w-4 h-4 text-white shrink-0 ml-2" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <button
                onClick={() => setWebAppsMenuOpen(!webAppsMenuOpen)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#2f2f2f] hover:bg-[#383838] border border-[#3e3e3e] text-xs font-medium text-[#ececec] transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-[#4285F4]" />
                <span className="hidden sm:inline">Launch Web AI</span>
                <ChevronDown className="w-3 h-3 text-[#8e8e8e]" />
              </button>

              {webAppsMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#212121] border border-[#383838] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in duration-100">
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-[#8e8e8e] uppercase tracking-wider">
                    Open with {activeAccount.displayName}
                  </div>
                  {WEB_AI_APPS.map(app => (
                    <a
                      key={app.id}
                      href={app.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setWebAppsMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[#ececec] hover:bg-[#2f2f2f] transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: app.color }} />
                        <span>{app.name}</span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-[#6e6e6e]" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={onOpenAccountsModal}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-[#2f2f2f] hover:bg-[#383838] border border-[#3e3e3e] transition-colors"
              title="Switch or add Google accounts"
            >
              <div 
                className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] text-white"
                style={{ backgroundColor: activeAccount.color }}
              >
                {activeAccount.displayName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-[#ececec] hidden md:inline max-w-[120px] truncate">
                {activeAccount.displayName}
              </span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center space-y-6">
              <h1 className="text-3xl font-semibold text-white tracking-tight">
                What can I help with?
              </h1>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                {[
                  { title: 'Compare AI models', desc: 'Break down GPT-4o vs Claude 3.7 vs Gemini 2.5' },
                  { title: 'Code a React component', desc: 'Clean TypeScript multi-session account switcher' },
                  { title: 'Synthesize a Suno music prompt', desc: 'Cyberpunk Synthwave retro 80s track' },
                  { title: 'Explain quantum computing', desc: 'Simple analogy for qubits & entanglement' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(item.title + ' - ' + item.desc)}
                    className="p-3.5 rounded-2xl bg-[#2f2f2f]/60 hover:bg-[#2f2f2f] border border-[#383838] hover:border-[#4f4f4f] text-left transition-all group"
                  >
                    <div className="text-xs font-semibold text-[#ececec] group-hover:text-white">{item.title}</div>
                    <div className="text-[11px] text-[#8e8e8e] mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map(msg => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`max-w-3xl mx-auto flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  {isUser ? (
                    <div className="bg-[#2f2f2f] text-white px-5 py-3 rounded-3xl max-w-[80%] text-sm leading-relaxed whitespace-pre-wrap shadow-sm">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="w-full text-sm leading-relaxed text-[#ececec] space-y-3">
                      <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>

                      {msg.content && (
                        <div className="flex items-center space-x-2 pt-1">
                          <button
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="p-1.5 rounded-lg text-[#8e8e8e] hover:text-white hover:bg-[#2f2f2f] transition-colors"
                            title="Copy response"
                          >
                            {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isGenerating && (
            <div className="max-w-3xl mx-auto flex items-center space-x-2 text-xs text-[#8e8e8e]">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span>{activeModel.name} is thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 sm:pb-6 bg-gradient-to-t from-[#212121] via-[#212121] to-transparent">
          <div className="max-w-3xl mx-auto space-y-2">
            <div className="relative flex items-center bg-[#2f2f2f] border border-[#383838] focus-within:border-[#525252] rounded-3xl px-3 py-2 shadow-lg transition-colors">
              <button
                type="button"
                className="p-2 text-[#b4b4b4] hover:text-white rounded-full hover:bg-[#3d3d3d] transition-colors"
                title="Attach files"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <textarea
                ref={textareaRef}
                rows={1}
                placeholder={`Message ${activeModel.name} under ${activeAccount.displayName}...`}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="flex-1 bg-transparent px-3 py-1.5 text-sm text-white placeholder-[#8e8e8e] focus:outline-none resize-none max-h-36"
              />

              <button
                onClick={() => handleSend()}
                disabled={!inputText.trim() || isGenerating}
                className={`p-2 rounded-full transition-all shrink-0 ${
                  inputText.trim() && !isGenerating
                    ? 'bg-white text-black hover:bg-neutral-200'
                    : 'bg-[#404040] text-[#717171] cursor-not-allowed'
                }`}
                title="Send message"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center text-[11px] text-[#8e8e8e]">
              NexusAI Engine with {activeAccount.email} • Synced to Supabase
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
