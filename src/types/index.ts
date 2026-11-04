export type AIProvider = 
  | 'openai' 
  | 'anthropic' 
  | 'gemini' 
  | 'grok' 
  | 'manus' 
  | 'suno' 
  | 'deepseek'
  | 'custom';

export interface ModelInfo {
  id: string;
  name: string;
  provider: AIProvider;
  contextWindow: string;
  badge: string;
  description: string;
  iconColor: string;
  supportsVision?: boolean;
  supportsReasoning?: boolean;
}

export interface AIAccount {
  id: string;
  name: string;
  description: string;
  badgeLabel: string;
  avatarColor: string;
  iconName: 'Sparkles' | 'Briefcase' | 'Terminal' | 'Cpu' | 'Shield' | 'Flame';
  isDefault: boolean;
  createdAt: string;
}

export interface AccountCredential {
  accountId: string;
  provider: AIProvider;
  apiKey: string;
  endpointUrl?: string;
  organizationId?: string;
  modelOverride?: string;
  customHeaders?: Record<string, string>;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  provider?: AIProvider;
  timestamp: string;
  tokensUsed?: number;
  metadata?: Record<string, any>;
}

export interface Conversation {
  id: string;
  accountId: string;
  title: string;
  provider: AIProvider;
  model: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SunoTrack {
  id: string;
  accountId: string;
  title: string;
  prompt: string;
  genre: string;
  lyrics: string;
  audioUrl?: string;
  durationSeconds: number;
  status: 'generating' | 'ready' | 'failed';
  createdAt: string;
  coverGradient: string;
}

export interface ManusStep {
  id: string;
  title: string;
  type: 'think' | 'browser' | 'code' | 'command' | 'export';
  status: 'pending' | 'active' | 'completed' | 'failed';
  details?: string;
  output?: string;
}

export interface ManusTask {
  id: string;
  accountId: string;
  goal: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  steps: ManusStep[];
  resultSummary?: string;
  createdAt: string;
}

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isConnected: boolean;
  lastSyncedAt?: string;
}

export type ViewMode = 
  | 'chat' 
  | 'split' 
  | 'launchpad' 
  | 'suno' 
  | 'manus' 
  | 'database';
