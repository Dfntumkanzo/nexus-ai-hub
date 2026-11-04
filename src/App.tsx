import React, { useState, useEffect, useCallback } from 'react';
import { 
  ProviderAccount, 
  Conversation, 
  Message, 
  SharedMemory, 
  AIProvider, 
  SupabaseConfig 
} from './types';
import { AI_MODELS } from './lib/constants';
import { 
  getStoredAccounts, 
  saveAccount, 
  deleteAccount,
  getStoredConversations, 
  saveConversation, 
  deleteConversation, 
  getStoredMessages, 
  saveMessage 
} from './lib/storage';
import { 
  getStoredMemories, 
  saveSharedMemory, 
  deleteSharedMemory 
} from './lib/memory';
import { 
  getSupabaseConfig, 
  initSupabaseClient 
} from './lib/supabase';
import { executeUnifiedAI } from './lib/ai-service';
import { UnifiedChatView } from './components/UnifiedChatView';
import { MemoryDrawer } from './components/MemoryDrawer';
import { ApiVaultModal } from './components/ApiVaultModal';
import { SupabaseSettingsModal } from './components/SupabaseSettingsModal';

export const App: React.FC = () => {
  // Accounts (hierarchical: provider -> accounts)
  const [accounts, setAccounts] = useState<ProviderAccount[]>(getStoredAccounts());

  // Conversations (hierarchical: provider -> account -> conversations)
  const [conversations, setConversations] = useState<Conversation[]>(getStoredConversations());
  const [activeConversationId, setActiveConversationId] = useState<string>(
    conversations[0]?.id || 'conv_claude_1_1'
  );

  // Messages of active conversation
  const [messages, setMessages] = useState<Message[]>([]);

  // Universal Shared Memory Core
  const [sharedMemories, setSharedMemories] = useState<SharedMemory[]>(getStoredMemories());

  // Supabase Configuration
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getSupabaseConfig());

  // Modals & Drawers
  const [isMemoryDrawerOpen, setIsMemoryDrawerOpen] = useState(false);
  const [isApiVaultOpen, setIsApiVaultOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Initialize Supabase on mount
  useEffect(() => {
    initSupabaseClient(supabaseConfig.supabaseUrl, supabaseConfig.supabaseAnonKey);
  }, [supabaseConfig]);

  // Load messages when activeConversationId changes
  useEffect(() => {
    if (activeConversationId) {
      const msgs = getStoredMessages(activeConversationId);
      setMessages(msgs);
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  // Refresh memories from storage
  const refreshMemories = useCallback(() => {
    const mems = getStoredMemories();
    setSharedMemories(mems);
  }, []);

  // Account operations
  const handleAddAccount = async (provider: AIProvider, name: string, email?: string) => {
    const colors = ['#10A37F', '#D97757', '#4E88FF', '#E11D48', '#EC4899', '#06B6D4', '#8B5CF6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newAccount: ProviderAccount = {
      id: `acc_${provider}_${Date.now()}`,
      provider,
      name,
      email,
      avatarColor: randomColor,
      createdAt: new Date().toISOString(),
    };

    await saveAccount(newAccount);
    const updatedAccounts = getStoredAccounts();
    setAccounts(updatedAccounts);

    // Create a first conversation under this newly added account
    const newConv: Conversation = {
      id: `conv_${provider}_${Date.now()}`,
      provider,
      accountId: newAccount.id,
      title: `Welcome to ${name}`,
      activeModelId: AI_MODELS.find(m => m.provider === provider)?.id || 'gpt-4o',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveConversation(newConv);
    const updatedConvs = getStoredConversations();
    setConversations(updatedConvs);
    setActiveConversationId(newConv.id);
  };

  const handleDeleteAccount = async (id: string) => {
    await deleteAccount(id);
    const updatedAccounts = getStoredAccounts();
    setAccounts(updatedAccounts);
    const updatedConvs = getStoredConversations();
    setConversations(updatedConvs);

    if (activeConversation && activeConversation.accountId === id) {
      if (updatedConvs.length > 0) {
        setActiveConversationId(updatedConvs[0].id);
      }
    }
  };

  const handleSaveAccountApiKey = async (accountId: string, apiKey: string) => {
    const acc = accounts.find(a => a.id === accountId);
    if (!acc) return;

    const updated: ProviderAccount = { ...acc, apiKey };
    await saveAccount(updated);
    setAccounts(getStoredAccounts());
  };

  // Conversation operations
  const handleNewConversation = async (provider: AIProvider, accountId: string, title?: string) => {
    const defaultModel = AI_MODELS.find(m => m.provider === provider)?.id || 'gpt-4o';
    const newConv: Conversation = {
      id: `conv_${Date.now()}`,
      provider,
      accountId,
      title: title || 'New Conversation',
      activeModelId: defaultModel,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveConversation(newConv);
    const updated = [newConv, ...conversations];
    setConversations(updated);
    setActiveConversationId(newConv.id);
  };

  const handleDeleteConv = async (id: string) => {
    await deleteConversation(id);
    const updated = conversations.filter(c => c.id !== id);
    setConversations(updated);
    if (activeConversationId === id) {
      if (updated.length > 0) {
        setActiveConversationId(updated[0].id);
      } else if (accounts.length > 0) {
        handleNewConversation(accounts[0].provider, accounts[0].id);
      }
    }
  };

  // Active conversation object
  const activeConversation = conversations.find(c => c.id === activeConversationId) || conversations[0] || null;

  // Send message
  const handleSendMessage = async (
    userText: string, 
    modelId: string, 
    provider: AIProvider, 
    accountId: string
  ) => {
    let currentConvId = activeConversationId;
    if (!currentConvId || !activeConversation) {
      const newConv: Conversation = {
        id: `conv_${Date.now()}`,
        provider,
        accountId,
        title: userText.slice(0, 32) + (userText.length > 32 ? '...' : ''),
        activeModelId: modelId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveConversation(newConv);
      setConversations(prev => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      currentConvId = newConv.id;
    }

    // 1. Create and save User Message
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      conversationId: currentConvId,
      role: 'user',
      content: userText,
      model: modelId,
      provider: provider,
      timestamp: new Date().toISOString(),
    };

    await saveMessage(userMessage);
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    // Update conversation title if default
    const conv = conversations.find(c => c.id === currentConvId);
    if (conv && (conv.title === 'New Conversation' || messages.length === 0)) {
      const updatedConv: Conversation = {
        ...conv,
        title: userText.slice(0, 32) + (userText.length > 32 ? '...' : ''),
        activeModelId: modelId,
        updatedAt: new Date().toISOString(),
      };
      await saveConversation(updatedConv);
      setConversations(prev => prev.map(c => c.id === updatedConv.id ? updatedConv : c));
    }

    // 2. Prepare assistant placeholder
    const assistantMessageId = `msg_${Date.now() + 1}`;
    const modelMeta = AI_MODELS.find(m => m.id === modelId);
    const targetAccount = accounts.find(a => a.id === accountId);

    // Execute with Universal Shared Memory Core
    const result = await executeUnifiedAI({
      messages: updatedMessages,
      provider,
      modelId,
      modelName: modelMeta?.name || modelId,
      apiKey: targetAccount?.apiKey,
      memories: sharedMemories,
    });

    // 3. Save Assistant Message
    const assistantMessage: Message = {
      id: assistantMessageId,
      conversationId: currentConvId,
      role: 'assistant',
      content: result.content,
      model: modelId,
      provider: provider,
      audioUrl: result.audioUrl,
      agentSteps: result.steps,
      timestamp: new Date().toISOString(),
    };

    await saveMessage(assistantMessage);
    setMessages(prev => [...prev, assistantMessage]);
  };

  // Shared Memory CRUD
  const handleAddMemory = async (memoryData: Omit<SharedMemory, 'id' | 'createdAt'>) => {
    const newMemory: SharedMemory = {
      ...memoryData,
      id: `mem_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    await saveSharedMemory(newMemory);
    refreshMemories();
  };

  const handleDeleteMemory = async (id: string) => {
    await deleteSharedMemory(id);
    refreshMemories();
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#212121]">
      <UnifiedChatView
        accounts={accounts}
        onAddAccount={handleAddAccount}
        onDeleteAccount={handleDeleteAccount}
        conversations={conversations}
        activeConversation={activeConversation}
        onSelectConversation={setActiveConversationId}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConv}
        messages={messages}
        onSendMessage={handleSendMessage}
        sharedMemories={sharedMemories}
        onOpenMemoryDrawer={() => setIsMemoryDrawerOpen(true)}
        onOpenApiVault={() => setIsApiVaultOpen(true)}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        isSupabaseConnected={supabaseConfig.isConnected}
        onRefreshMemories={refreshMemories}
      />

      <MemoryDrawer
        isOpen={isMemoryDrawerOpen}
        onClose={() => setIsMemoryDrawerOpen(false)}
        memories={sharedMemories}
        onAddMemory={handleAddMemory}
        onDeleteMemory={handleDeleteMemory}
        isSupabaseConnected={supabaseConfig.isConnected}
      />

      <ApiVaultModal
        isOpen={isApiVaultOpen}
        onClose={() => setIsApiVaultOpen(false)}
        accounts={accounts}
        onSaveAccountApiKey={handleSaveAccountApiKey}
      />

      <SupabaseSettingsModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        config={supabaseConfig}
        onUpdateConfig={setSupabaseConfig}
      />
    </div>
  );
};

export default App;
