import { ModelInfo, GoogleAccountProfile } from '../types';

export const AI_WEB_SERVICES: ModelInfo[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    provider: 'openai',
    badge: 'GPT-4o / o3',
    description: 'Official ChatGPT Web Application',
    iconColor: '#10A37F',
    url: 'https://chatgpt.com',
  },
  {
    id: 'claude',
    name: 'Claude',
    provider: 'anthropic',
    badge: 'Claude 3.7',
    description: 'Official Claude AI Web Application',
    iconColor: '#D97757',
    url: 'https://claude.ai',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    provider: 'gemini',
    badge: 'Gemini 2.5',
    description: 'Official Google Gemini Web Application',
    iconColor: '#4E88FF',
    url: 'https://gemini.google.com',
  },
  {
    id: 'grok',
    name: 'Grok',
    provider: 'grok',
    badge: 'xAI Grok',
    description: 'Official Grok Web Application',
    iconColor: '#E11D48',
    url: 'https://x.ai',
  },
  {
    id: 'suno',
    name: 'Suno AI',
    provider: 'suno',
    badge: 'Music Studio',
    description: 'Official Suno Music Web Application',
    iconColor: '#EC4899',
    url: 'https://suno.com',
  },
  {
    id: 'manus',
    name: 'Manus AI',
    provider: 'manus',
    badge: 'General Agent',
    description: 'Official Manus Autonomous Agent Web',
    iconColor: '#06B6D4',
    url: 'https://manus.im',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    provider: 'deepseek',
    badge: 'DeepSeek R1',
    description: 'Official DeepSeek Web Application',
    iconColor: '#3B82F6',
    url: 'https://chat.deepseek.com',
  }
];

export const DEFAULT_GOOGLE_PROFILES: GoogleAccountProfile[] = [
  {
    id: 'account_1',
    email: 'Google Account 1',
    displayName: 'Google Account 1 (Personal)',
    isDefault: true,
    color: '#4285F4',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'account_2',
    email: 'Google Account 2',
    displayName: 'Google Account 2 (Work)',
    isDefault: false,
    color: '#0F9D58',
    createdAt: new Date().toISOString(),
  }
];
