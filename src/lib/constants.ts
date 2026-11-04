import { ModelInfo, GoogleAccountProfile } from '../types';

export const CHATGPT_MODELS: ModelInfo[] = [
  {
    id: 'gpt-4o',
    name: 'ChatGPT-4o',
    provider: 'openai',
    badge: 'Flagship',
    description: 'OpenAI flagship multimodal intelligence for text, reasoning and code',
    iconColor: '#10A37F',
  },
  {
    id: 'claude-3-7-sonnet',
    name: 'Claude 3.7 Sonnet',
    provider: 'anthropic',
    badge: 'Extended Thinking',
    description: 'Anthropic state-of-the-art hybrid reasoning and deep prose',
    iconColor: '#D97757',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'gemini',
    badge: '1M Context',
    description: 'Google ultra-fast multimodal model with 1-million token memory',
    iconColor: '#4E88FF',
  },
  {
    id: 'grok-3',
    name: 'Grok 3',
    provider: 'grok',
    badge: 'Unfiltered',
    description: 'xAI high-velocity truthful reasoning engine',
    iconColor: '#E11D48',
  },
  {
    id: 'suno-v3.5',
    name: 'Suno Music Creator',
    provider: 'suno',
    badge: 'Audio Gen',
    description: 'Suno full song synthesizer with lyrics and instruments',
    iconColor: '#EC4899',
  },
  {
    id: 'manus-agent',
    name: 'Manus Autonomous Agent',
    provider: 'manus',
    badge: 'Agentic',
    description: 'General task agent with autonomous reasoning & browser workflows',
    iconColor: '#06B6D4',
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'deepseek',
    badge: 'Open Reasoning',
    description: 'Pure reinforcement-learning open reasoning model',
    iconColor: '#3B82F6',
  }
];

export const DEFAULT_GOOGLE_ACCOUNTS: GoogleAccountProfile[] = [
  {
    id: 'google-acc-personal',
    email: 'personal.user@gmail.com',
    displayName: 'Personal (Primary)',
    isDefault: true,
    color: '#4285F4',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'google-acc-work',
    email: 'work.account@gmail.com',
    displayName: 'Work & Professional',
    isDefault: false,
    color: '#0F9D58',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'google-acc-lab',
    email: 'research.ai@gmail.com',
    displayName: 'Research / Dev Account',
    isDefault: false,
    color: '#EA4335',
    createdAt: new Date().toISOString(),
  }
];

export interface WebAiApp {
  id: string;
  name: string;
  url: string;
  loginUrl: string;
  color: string;
}

export const WEB_AI_APPS: WebAiApp[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT Web',
    url: 'https://chatgpt.com',
    loginUrl: 'https://chatgpt.com/auth/login',
    color: '#10A37F',
  },
  {
    id: 'claude',
    name: 'Claude AI Web',
    url: 'https://claude.ai',
    loginUrl: 'https://claude.ai/login',
    color: '#D97757',
  },
  {
    id: 'gemini',
    name: 'Google Gemini Web',
    url: 'https://gemini.google.com',
    loginUrl: 'https://gemini.google.com',
    color: '#4E88FF',
  },
  {
    id: 'grok',
    name: 'Grok (xAI) Web',
    url: 'https://x.ai',
    loginUrl: 'https://x.ai',
    color: '#E11D48',
  },
  {
    id: 'suno',
    name: 'Suno Music Web',
    url: 'https://suno.com',
    loginUrl: 'https://suno.com/login',
    color: '#EC4899',
  },
  {
    id: 'manus',
    name: 'Manus AI Web',
    url: 'https://manus.im',
    loginUrl: 'https://manus.im/login',
    color: '#06B6D4',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek Web',
    url: 'https://chat.deepseek.com',
    loginUrl: 'https://chat.deepseek.com/sign_in',
    color: '#3B82F6',
  }
];
