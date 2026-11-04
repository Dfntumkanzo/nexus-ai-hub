export type AIProvider = 
  | 'openai' 
  | 'anthropic' 
  | 'gemini' 
  | 'grok' 
  | 'manus' 
  | 'suno' 
  | 'deepseek';

export interface ModelInfo {
  id: string;
  name: string;
  provider: AIProvider;
  badge: string;
  description: string;
  iconColor: string;
}

export interface GoogleAccountProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  isDefault: boolean;
  color: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  provider?: AIProvider;
  timestamp: string;
}

export interface Conversation {
  id: string;
  googleAccountId: string;
  title: string;
  provider: AIProvider;
  model: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isConnected: boolean;
}
