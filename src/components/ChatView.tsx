import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Send, 
  Plus, 
  Trash2, 
  Search, 
  Sparkles, 
  Bot, 
  Copy, 
  Check, 
  ChevronDown, 
  ArrowRight
} from 'lucide-react';
import { AIAccount, AIProvider, Conversation, Message, AccountCredential } from '../types';
import { SUPPORTED_MODELS } from '../lib/constants';
import { 
  getStoredConversations, 
  saveConversation, 
  deleteConversation, 
  getStoredMessages, 
  saveMessage 
} from '../lib/storage';
import { executeAICompletion } from '../lib/ai-service';

interface ChatViewProps {
  activeAccount: AIAccount;
  credentials: Record<AIProvider, AccountCredential | null>;
  onOpenVault: () => void;
  onOpenSplitArena: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  activeAccount,
  credentials,
  onOpenVault,
  onOpenSplitArena,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('gemini-2.5-flash');
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const list = getStoredConversations(activeAccount.id);
    setConversations(list);
    if (list.length > 0) {
      setActiveConvId(list[0].id);
    } else {
      handleNewConversation();
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

  const activeModel = SUPPORTED_MODELS.find(m => m.id === selectedModelId) || SUPPORTED_MODELS[0];

  const handleNewConversation = () => {
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      accountId: activeAccount.id,
      title: 'New Conversation',
      provider: activeModel.provider,
      model: activeModel.id,
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveConversation(newConv);
    setConversations(prev => [newConv, ...prev]);
    setActiveConvId(newConv.id);
    setMessages([]);
  };

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConversation(id, activeAccount.id);
    const updated = conversations.filter(c => c.id !== id);
    setConversations(updated);
    if (activeConvId === id && updated.length > 0) {
      setActiveConvId(updated[0].id);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt || isGenerating || !activeConvId) return;

    setInputPrompt('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      conversationId: activeConvId,
      role: 'user',
      content: prompt,
      timestamp: new Date().toISOString(),
    };

    if (messages.length === 0 || (conversations.find(c => c.id === activeConvId)?.title === 'New Conversation')) {
      const newTitle = prompt.slice(0, 32) + (prompt.length > 32 ? '...' : '');
      const conv = conversations.find(c => c.id === activeConvId);
      if (conv) {
        const updatedConv = { ...conv, title: newTitle, updatedAt: new Date().toISOString() };
        saveConversation(updatedConv);
        setConversations(prev => prev.map(c => c.id === activeConvId ? updatedConv : c));
      }
    }

    await saveMessage(userMsg);
    const currentListWithUser = [...messages, userMsg];
    setMessages(currentListWithUser);

    setIsGenerating(true);
    const assistantMsgId = `msg-reply-${Date.now()}`;
    const initialAssistantMsg: Message = {
      id: assistantMsgId,
      conversationId: activeConvId,
      role: 'assistant',
      content: '',
      model: activeModel.name,
      provider: activeModel.provider,
      timestamp: new Date().toISOString(),
    };

    setMessages([...currentListWithUser, initialAssistantMsg]);

    const activeCred = credentials[activeModel.provider];

    try {
      const finalContent = await executeAICompletion({
        messages: currentListWithUser,
        provider: activeModel.provider,
        model: activeModel.id,
        credential: activeCred,
        onChunk: (partialText) => {
          setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: partialText } : m));
        },
      });

      const finishedMsg: Message = {
        ...initialAssistantMsg,
        content: finalContent,
        timestamp: new Date().toISOString(),
      };
      await saveMessage(finishedMsg);
      setMessages(prev => prev.map(m => m.id === assistantMsgId ? finishedMsg : m));
    } catch (err: any) {
      const errorMsg: Message = {
        ...initialAssistantMsg,
        content: `Error: ${err?.message || 'Failed to generate response.'}`,
      };
      await saveMessage(errorMsg);
      setMessages(prev => prev.map(m => m.id === assistantMsgId ? errorMsg : m));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const filteredConversations = conversations.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex h-[calc(100vh-4rem)] overflow-hidden bg-[#0B0F17]">
      <aside className="w-64 sm:w-72 bg-[#0E131F] border-r border-gray-800 flex flex-col shrink-0">
        <div className="p-3 border-b border-gray-800 space-y-2">
          <button
            onClick={handleNewConversation}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search chat history..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-gray-900/80 border border-gray-800 rounded-lg text-xs text-gray-300 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-500">
              No conversations yet.
            </div>
          ) : (
            filteredConversations.map(conv => {
              const isActive = conv.id === activeConvId;
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs transition-all ${
                    isActive 
                      ? 'bg-indigo-600/20 text-white border border-indigo-500/40 font-medium' 
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate pr-2">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-indigo-400" />
                    <span className="truncate">{conv.title}</span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-opacity"
                    title="Delete Chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 border-t border-gray-800 bg-gray-950/40 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <div 
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: activeAccount.avatarColor }}
            />
            <span className="text-gray-300 font-semibold truncate max-w-[120px]">{activeAccount.name}</span>
          </div>
          <button
            onClick={onOpenSplitArena}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
          >
            <span>Split Arena</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="h-14 border-b border-gray-800/80 px-4 sm:px-6 flex items-center justify-between bg-[#0E131F]/50">
          <div className="relative">
            <button
              onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
              className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-700/80 hover:border-gray-600 transition-all text-left shadow-sm"
            >
              <span 
                className="w-2.5 h-2.5 rounded-full shadow-sm"
                style={{ backgroundColor: activeModel.iconColor }}
              />
              <span className="text-xs font-bold text-white">{activeModel.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-gray-800 text-indigo-400 border border-gray-700">
                {activeModel.badge}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {modelDropdownOpen && (
              <div className="absolute left-0 mt-2 w-80 bg-[#111827] border border-gray-700 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in duration-150">
                <div className="px-3 py-1.5 border-b border-gray-800 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Select AI Model (Unified Omnichannel)
                </div>
                <div className="max-h-72 overflow-y-auto py-1">
                  {SUPPORTED_MODELS.map(m => {
                    const isSelected = m.id === selectedModelId;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          setSelectedModelId(m.id);
                          setModelDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
                          isSelected ? 'bg-indigo-600/20 text-white' : 'hover:bg-gray-800/60 text-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <span 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: m.iconColor }}
                          />
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="text-xs font-semibold">{m.name}</span>
                              <span className="text-[9px] px-1 rounded font-mono bg-gray-800 text-gray-400">{m.badge}</span>
                            </div>
                            <p className="text-[10px] text-gray-500 line-clamp-1">{m.description}</p>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="text-gray-400 hidden sm:inline">
              Account: <strong className="text-gray-200">{activeAccount.name}</strong>
            </span>
            <button
              onClick={onOpenVault}
              className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20"
            >
              <span>API Vault</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center shadow-lg">
                <Sparkles className="w-7 h-7 text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">NexusAI Universal Hub</h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                Connect your ChatGPT, Claude, Gemini, Grok, Suno, and Manus accounts in one single place. Switch accounts anytime without repeatedly logging in and logging out.
              </p>
              <div className="grid grid-cols-2 gap-2 w-full pt-2">
                {[
                  'Explain quantum computing in simple terms',
                  'Compare Claude 3.7 Sonnet vs GPT-4o',
                  'Write a TypeScript Supabase authentication helper',
                  'Synthesize a Suno music prompt for Cyberpunk',
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(prompt)}
                    className="p-3 text-left text-xs bg-gray-900/60 hover:bg-gray-800 border border-gray-800 hover:border-indigo-500/40 rounded-xl text-gray-300 transition-all"
                  >
                    "{prompt}"
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
                  className={`flex space-x-3 max-w-4xl mx-auto ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <Bot className="w-4 h-4 text-indigo-400" />
                    </div>
                  )}

                  <div className={`space-y-1.5 max-w-[85%] sm:max-w-[75%]`}>
                    <div className={`flex items-center space-x-2 text-[11px] text-gray-400 ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <span className="font-semibold text-gray-300">{isUser ? 'You' : msg.model || 'AI Assistant'}</span>
                      <span>•</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`p-4 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/20'
                          : 'bg-[#121927] border border-gray-800 text-gray-200 rounded-tl-none shadow-md'
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="prose prose-invert prose-xs max-w-none space-y-2">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>

                    {!isUser && msg.content && (
                      <div className="flex items-center space-x-2 pt-0.5">
                        <button
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className="flex items-center space-x-1 text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
                        >
                          {copiedMsgId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy text</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs shadow-sm"
                      style={{ backgroundColor: `${activeAccount.avatarColor}25`, color: activeAccount.avatarColor, border: `1px solid ${activeAccount.avatarColor}60` }}
                    >
                      {activeAccount.name.charAt(0)}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isGenerating && (
            <div className="flex space-x-3 max-w-4xl mx-auto">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                <Bot className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="p-4 rounded-2xl bg-[#121927] border border-gray-800 text-xs text-gray-400 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                <span>{activeModel.name} is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 sm:p-5 border-t border-gray-800/80 bg-[#0E131F]/90">
          <div className="max-w-4xl mx-auto space-y-2">
            <div className="relative flex items-center bg-gray-950 border border-gray-700/80 rounded-2xl p-2 shadow-inner focus-within:border-indigo-500 transition-colors">
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder={`Ask ${activeModel.name} anything under ${activeAccount.name}...`}
                value={inputPrompt}
                onChange={e => setInputPrompt(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="w-full bg-transparent px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none resize-none max-h-32"
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={!inputPrompt.trim() || isGenerating}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition-all shadow-md shadow-indigo-600/20 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
              <span>Press <kbd className="px-1 py-0.5 rounded bg-gray-800 text-gray-400 font-mono text-[10px]">Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-gray-800 text-gray-400 font-mono text-[10px]">Shift+Enter</kbd> for newline</span>
              <span>Account: {activeAccount.badgeLabel}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
