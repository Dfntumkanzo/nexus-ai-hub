import { ModelInfo, ProviderMeta, ProviderAccount, Conversation, SharedMemory } from '../types';

export const PROVIDERS_LIST: ProviderMeta[] = [
  {
    id: 'openai',
    name: 'ChatGPT',
    badge: 'OpenAI',
    brandColor: '#10A37F',
    defaultModelId: 'gpt-4o',
    description: 'GPT-4o multimodal reasoning & o3-mini deep logic',
  },
  {
    id: 'anthropic',
    name: 'Claude',
    badge: 'Anthropic',
    brandColor: '#D97757',
    defaultModelId: 'claude-3-7-sonnet',
    description: 'Claude 3.7 Sonnet hybrid reasoning & 3.5 Sonnet coding',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    badge: 'Google',
    brandColor: '#4E88FF',
    defaultModelId: 'gemini-2.5-flash',
    description: 'Gemini 2.5 Flash 1M token context & Gemini 2.5 Pro',
  },
  {
    id: 'grok',
    name: 'Grok',
    badge: 'xAI',
    brandColor: '#E11D48',
    defaultModelId: 'grok-3',
    description: 'Grok 3 real-time knowledge and unfiltered logic',
  },
  {
    id: 'suno',
    name: 'Suno',
    badge: 'Music Studio',
    brandColor: '#EC4899',
    defaultModelId: 'suno-v3.5',
    description: 'Suno v3.5 song generation with inline audio playback',
  },
  {
    id: 'manus',
    name: 'Manus',
    badge: 'Agent',
    brandColor: '#06B6D4',
    defaultModelId: 'manus-agent',
    description: 'Autonomous multi-step browser tasks & execution graph',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    badge: 'Reasoning',
    brandColor: '#3B82F6',
    defaultModelId: 'deepseek-r1',
    description: 'DeepSeek R1 reinforcement-learning open reasoning',
  },
];

export const AI_MODELS: ModelInfo[] = [
  {
    id: 'gpt-4o',
    name: 'ChatGPT (GPT-4o)',
    provider: 'openai',
    badge: 'Flagship Omni',
    description: 'OpenAI premier multimodal model for text, logic, and deep analysis',
    iconColor: '#10A37F',
  },
  {
    id: 'o3-mini',
    name: 'ChatGPT (o3-mini)',
    provider: 'openai',
    badge: 'Deep Reasoning',
    description: 'High-speed reasoning model specialized for science, math & code',
    iconColor: '#10A37F',
  },
  {
    id: 'claude-3-7-sonnet',
    name: 'Claude 3.7 Sonnet',
    provider: 'anthropic',
    badge: 'Hybrid Thought',
    description: 'Anthropic state-of-the-art hybrid standard and extended thinking model',
    iconColor: '#D97757',
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    badge: 'Coding Specialist',
    description: 'Anthropic industry-standard code architecture and prose benchmark',
    iconColor: '#D97757',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'gemini',
    badge: '1M Context',
    description: 'Google ultra-fast multimodal model with 1-million token working memory',
    iconColor: '#4E88FF',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'gemini',
    badge: 'Deep Analytics',
    description: 'Google flagship model for large-scale multimodal reasoning & documents',
    iconColor: '#4E88FF',
  },
  {
    id: 'grok-3',
    name: 'Grok 3',
    provider: 'grok',
    badge: 'xAI Flagship',
    description: 'xAI unfiltered truth-seeking intelligence with real-time knowledge',
    iconColor: '#E11D48',
  },
  {
    id: 'suno-v3.5',
    name: 'Suno Music Studio',
    provider: 'suno',
    badge: 'Audio Gen',
    description: 'Generates full radio-ready songs, vocals, and instruments from prompts',
    iconColor: '#EC4899',
  },
  {
    id: 'manus-agent',
    name: 'Manus Autonomous Agent',
    provider: 'manus',
    badge: 'Autonomous Task',
    description: 'Decomposes complex digital goals, executes browser tasks, and compiles artifacts',
    iconColor: '#06B6D4',
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'deepseek',
    badge: 'Open Reasoning',
    description: 'Reinforcement-learning driven open reasoning model',
    iconColor: '#3B82F6',
  }
];

export const DEFAULT_ACCOUNTS: ProviderAccount[] = [
  // ChatGPT Accounts
  {
    id: 'acc_chatgpt_1',
    provider: 'openai',
    name: 'Account 1 (Personal)',
    email: 'personal.user@gmail.com',
    avatarColor: '#10A37F',
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'acc_chatgpt_2',
    provider: 'openai',
    name: 'Account 2 (Work)',
    email: 'work.corp@company.com',
    avatarColor: '#059669',
    isDefault: false,
    createdAt: new Date().toISOString(),
  },

  // Claude Accounts
  {
    id: 'acc_claude_1',
    provider: 'anthropic',
    name: 'Account 1 (Personal)',
    email: 'personal.user@gmail.com',
    avatarColor: '#D97757',
    isDefault: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'acc_claude_2',
    provider: 'anthropic',
    name: 'Account 2 (Pro)',
    email: 'claude.pro@domain.org',
    avatarColor: '#B45309',
    isDefault: false,
    createdAt: new Date().toISOString(),
  },

  // Gemini Accounts
  {
    id: 'acc_gemini_1',
    provider: 'gemini',
    name: 'Account 1 (Google Workspace)',
    email: 'personal.user@gmail.com',
    avatarColor: '#4E88FF',
    isDefault: false,
    createdAt: new Date().toISOString(),
  },

  // Grok Accounts
  {
    id: 'acc_grok_1',
    provider: 'grok',
    name: 'Account 1 (X Premium)',
    email: 'x.user@x.com',
    avatarColor: '#E11D48',
    isDefault: false,
    createdAt: new Date().toISOString(),
  },

  // Suno Accounts
  {
    id: 'acc_suno_1',
    provider: 'suno',
    name: 'Account 1 (Creator Studio)',
    email: 'suno.music@studio.ai',
    avatarColor: '#EC4899',
    isDefault: false,
    createdAt: new Date().toISOString(),
  },

  // Manus Accounts
  {
    id: 'acc_manus_1',
    provider: 'manus',
    name: 'Account 1 (Autonomous Agent)',
    email: 'manus.agent@task.ai',
    avatarColor: '#06B6D4',
    isDefault: false,
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_CONVERSATIONS: Conversation[] = [
  // Claude - Account 1
  {
    id: 'conv_claude_1_1',
    provider: 'anthropic',
    accountId: 'acc_claude_1',
    title: 'React Architecture Refactor',
    activeModelId: 'claude-3-7-sonnet',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'conv_claude_1_2',
    provider: 'anthropic',
    accountId: 'acc_claude_1',
    title: 'Hybrid Thinking Algorithms',
    activeModelId: 'claude-3-7-sonnet',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },

  // ChatGPT - Account 1
  {
    id: 'conv_chatgpt_1_1',
    provider: 'openai',
    accountId: 'acc_chatgpt_1',
    title: 'Tokyo Travel & Itinerary Plan',
    activeModelId: 'gpt-4o',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'conv_chatgpt_1_2',
    provider: 'openai',
    accountId: 'acc_chatgpt_1',
    title: 'Python API Server Optimization',
    activeModelId: 'gpt-4o',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },

  // ChatGPT - Account 2
  {
    id: 'conv_chatgpt_2_1',
    provider: 'openai',
    accountId: 'acc_chatgpt_2',
    title: 'Q3 Enterprise Strategy Document',
    activeModelId: 'o3-mini',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'conv_chatgpt_2_2',
    provider: 'openai',
    accountId: 'acc_chatgpt_2',
    title: 'Security Compliance Checklist',
    activeModelId: 'gpt-4o',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },

  // Gemini - Account 1
  {
    id: 'conv_gemini_1_1',
    provider: 'gemini',
    accountId: 'acc_gemini_1',
    title: '1M Token Codebase Document Analysis',
    activeModelId: 'gemini-2.5-flash',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },

  // Grok - Account 1
  {
    id: 'conv_grok_1_1',
    provider: 'grok',
    accountId: 'acc_grok_1',
    title: 'Real-Time Tech & Market Insights',
    activeModelId: 'grok-3',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },

  // Suno - Account 1
  {
    id: 'conv_suno_1_1',
    provider: 'suno',
    accountId: 'acc_suno_1',
    title: 'Cyberpunk Synthwave Anthem',
    activeModelId: 'suno-v3.5',
    createdAt: new Date(Date.now() - 3600000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 7).toISOString(),
  },

  // Manus - Account 1
  {
    id: 'conv_manus_1_1',
    provider: 'manus',
    accountId: 'acc_manus_1',
    title: 'Autonomous Competitor Research Pipeline',
    activeModelId: 'manus-agent',
    createdAt: new Date(Date.now() - 3600000 * 9).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 9).toISOString(),
  },
];

export const INITIAL_SHARED_MEMORIES: SharedMemory[] = [
  {
    id: 'mem_1',
    key: 'Core Workspace Goal',
    content: 'User maintains an all-in-one AI ecosystem where ChatGPT, Claude, Gemini, Grok, Manus, and Suno operate under a single unified memory.',
    category: 'project',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mem_2',
    key: 'Preferred Architecture',
    content: 'React 19, TypeScript, Tailwind CSS, Supabase PostgreSQL, and direct multi-provider API gateways.',
    category: 'preference',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mem_3',
    key: 'Unified Multi-Account Hierarchy',
    content: 'All chats from all AI models and all accounts are organized in one unified tree: [Provider] -> [Account] -> [Chats]. All models share the same memory core.',
    category: 'fact',
    createdAt: new Date().toISOString(),
  }
];
