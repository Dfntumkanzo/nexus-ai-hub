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
  saveMessage,
  bulkImportChats
} from './lib/storage';
import { 
  getStoredMemories, 
  saveSharedMemory, 
  deleteSharedMemory,
  autoDetectMemory 
} from './lib/memory';
import { 
  getSupabaseConfig, 
  initSupabaseClient,
  signInWithGoogleOAuth
} from './lib/supabase';
import { executeUnifiedAI } from './lib/ai-service';
import { ParsedChat } from './lib/importers';
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

  // Google User Linking Handler
  const handleGoogleUserLinked = useCallback(async (user: any) => {
    if (!user || !user.email) return;
    const currentAccs = getStoredAccounts();
    const existing = currentAccs.find(a => a.email?.toLowerCase() === user.email.toLowerCase());
    
    if (!existing) {
      const googleAccount: ProviderAccount = {
        id: `acc_google_${Date.now()}`,
        provider: 'openai',
        name: user.user_metadata?.full_name || user.email.split('@')[0] || 'Google Account',
        email: user.email,
        avatarUrl: user.user_metadata?.avatar_url,
        avatarColor: '#4285F4',
        isGoogleAccount: true,
        createdAt: new Date().toISOString(),
      };
      await saveAccount(googleAccount);
      const updatedAccounts = getStoredAccounts();
      setAccounts(updatedAccounts);

      const newConv: Conversation = {
        id: `conv_google_${Date.now()}`,
        provider: 'openai',
        accountId: googleAccount.id,
        title: `Google Account Chats (${user.email})`,
        activeModelId: 'gpt-4o',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveConversation(newConv);
      const updatedConvs = getStoredConversations();
      setConversations(updatedConvs);
      setActiveConversationId(newConv.id);
    }
  }, []);

  // Initialize Supabase & listen for Google Auth
  useEffect(() => {
    const supabase = initSupabaseClient(supabaseConfig.supabaseUrl, supabaseConfig.supabaseAnonKey);
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleGoogleUserLinked(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        handleGoogleUserLinked(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabaseConfig, handleGoogleUserLinked]);

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
  const handleAddAccount = async (provider: AIProvider, name: string, email?: string, apiKey?: string) => {
    const colors = ['#10A37F', '#D97757', '#4E88FF', '#E11D48', '#EC4899', '#06B6D4', '#8B5CF6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const isGoogle = email?.toLowerCase().includes('@gmail.com');
    const newAccount: ProviderAccount = {
      id: `acc_${provider}_${Date.now()}`,
      provider,
      name,
      email,
      apiKey: apiKey?.trim() || undefined,
      avatarColor: isGoogle ? '#4285F4' : randomColor,
      isGoogleAccount: isGoogle,
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
      } else {
        setActiveConversationId('');
      }
    }
  };

  // Send message with automatic shared memory context injection
  const handleSendMessage = async (
    userText: string,
    modelId: string,
    provider: AIProvider,
    accountId: string
  ) => {
    let convId = activeConversationId;

    if (!convId) {
      const defaultModel = AI_MODELS.find(m => m.provider === provider)?.id || modelId;
      const newConv: Conversation = {
        id: `conv_${Date.now()}`,
        provider,
        accountId,
        title: userText.slice(0, 36) + (userText.length > 36 ? '...' : ''),
        activeModelId: defaultModel,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveConversation(newConv);
      convId = newConv.id;
      setConversations([newConv, ...conversations]);
      setActiveConversationId(convId);
    }

    const currentModel = AI_MODELS.find(m => m.id === modelId) || AI_MODELS[0];
    const userMessage: Message = {
      id: `msg_u_${Date.now()}`,
      conversationId: convId,
      role: 'user',
      content: userText,
      model: currentModel.id,
      provider,
      timestamp: new Date().toISOString(),
    };

    await saveMessage(userMessage);
    const currentMsgs = getStoredMessages(convId);
    setMessages(currentMsgs);

    // Auto-detect and store shared memory in the background
    const detectedMem = autoDetectMemory(userText);
    if (detectedMem) {
      saveSharedMemory({
        id: `mem_${Date.now()}`,
        key: detectedMem.key,
        content: detectedMem.content,
        category: 'preference',
        createdAt: new Date().toISOString(),
      }).then(refreshMemories);
    }

    const activeAcc = accounts.find(a => a.id === accountId);

    try {
      const aiResponse = await executeUnifiedAI({
        messages: currentMsgs,
        provider,
        modelId: currentModel.id,
        modelName: currentModel.name,
        memories: sharedMemories,
        apiKey: activeAcc?.apiKey,
      });

      const assistantMessage: Message = {
        id: `msg_a_${Date.now()}`,
        conversationId: convId,
        role: 'assistant',
        content: aiResponse.content,
        model: currentModel.id,
        provider,
        audioUrl: aiResponse.audioUrl,
        agentSteps: aiResponse.steps,
        timestamp: new Date().toISOString(),
      };

      await saveMessage(assistantMessage);
      setMessages(getStoredMessages(convId));

      const existingConv = conversations.find(c => c.id === convId);
      if (existingConv && (existingConv.title.startsWith('Welcome') || existingConv.title === 'New Conversation')) {
        const updatedConv: Conversation = {
          ...existingConv,
          title: userText.slice(0, 32) + (userText.length > 32 ? '...' : ''),
          updatedAt: new Date().toISOString(),
        };
        await saveConversation(updatedConv);
        setConversations(getStoredConversations());
      }
    } catch (err: any) {
      const errorMessage: Message = {
        id: `msg_err_${Date.now()}`,
        conversationId: convId,
        role: 'assistant',
        content: `Error generating response: ${err.message || 'Execution failed.'}`,
        model: currentModel.id,
        provider,
        timestamp: new Date().toISOString(),
      };
      await saveMessage(errorMessage);
      setMessages(getStoredMessages(convId));
    }
  };

  // Bulk Import Chats handler
  const handleBulkImportChats = async (
    accountId: string,
    provider: AIProvider,
    chats: ParsedChat[]
  ): Promise<{ conversationCount: number; messageCount: number }> => {
    const result = await bulkImportChats(accountId, provider, chats);
    const updatedConvs = getStoredConversations();
    setConversations(updatedConvs);
    if (result.newConversations && result.newConversations.length > 0) {
      setActiveConversationId(result.newConversations[0].id);
    }
    return { conversationCount: result.conversationCount, messageCount: result.messageCount };
  };

  // Google OAuth sign-in trigger
  const handleGoogleSignIn = async () => {
    const res = await signInWithGoogleOAuth();
    if (res.error) {
      throw new Error(res.error.message || 'Failed to initialize Google Sign-In.');
    }
  };

  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;

  // Shared Memory operations
  const handleAddMemory = async (mem: Omit<SharedMemory, 'id' | 'createdAt'>) => {
    const newMem: SharedMemory = {
      id: `mem_${Date.now()}`,
      key: mem.key,
      content: mem.content,
      category: mem.category,
      createdAt: new Date().toISOString(),
    };
    await saveSharedMemory(newMem);
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
        onImportChats={handleBulkImportChats}
        onGoogleSignIn={handleGoogleSignIn}
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
