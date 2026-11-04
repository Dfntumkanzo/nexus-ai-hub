export type AIProvider = 
  | 'openai' 
  | 'anthropic' 
  | 'gemini' 
  | 'grok' 
  | 'suno' 
  | 'manus' 
  | 'deepseek';

export interface ModelInfo {
  id: string;
  name: string;
  provider: AIProvider;
  badge: string;
  description: string;
  iconColor: string;
}

export interface ProviderMeta {
  id: AIProvider;
  name: string;
  badge: string;
  brandColor: string;
  defaultModelId: string;
  description: string;
}

export interface SharedMemory {
  id: string;
  key: string;
  content: string;
  category: 'preference' | 'fact' | 'project' | 'context';
  createdAt: string;
}

export interface ProviderAccount {
  id: string;
  provider: AIProvider;
  name: string;
  email?: string;
  avatarColor: string;
  apiKey?: string;
  isDefault?: boolean;
  createdAt: string;
}

export interface AgentStep {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'completed';
  output?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model: string;
  provider: AIProvider;
  audioUrl?: string;
  agentSteps?: AgentStep[];
  timestamp: string;
}

export interface Conversation {
  id: string;
  provider: AIProvider;
  accountId: string;
  title: string;
  activeModelId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isConnected: boolean;
  lastSyncedAt?: string;
}
