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
  url: string;
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

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isConnected: boolean;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        partition?: string;
        allowpopups?: string;
        webpreferences?: string;
        useragent?: string;
      };
    }
  }
}
