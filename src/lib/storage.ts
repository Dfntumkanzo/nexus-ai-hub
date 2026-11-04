import { AIAccount, AccountCredential, Conversation, Message, SunoTrack, ManusTask, AIProvider } from '../types';
import { DEFAULT_ACCOUNTS } from './constants';
import { getSupabaseClient } from './supabase';

const KEYS = {
  ACCOUNTS: 'nexus_accounts_v1',
  ACTIVE_ACCOUNT: 'nexus_active_account_id',
  CREDENTIALS: 'nexus_account_credentials_v1',
  CONVERSATIONS: 'nexus_conversations_v1',
  MESSAGES: 'nexus_messages_v1',
  SUNO_TRACKS: 'nexus_suno_tracks_v1',
  MANUS_TASKS: 'nexus_manus_tasks_v1',
};

export const getStoredAccounts = (): AIAccount[] => {
  try {
    const raw = localStorage.getItem(KEYS.ACCOUNTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to parse accounts from storage', e);
  }
  localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(DEFAULT_ACCOUNTS));
  return DEFAULT_ACCOUNTS;
};

export const saveAccount = async (account: AIAccount): Promise<void> => {
  const current = getStoredAccounts();
  const existingIdx = current.findIndex(a => a.id === account.id);
  let updated: AIAccount[];

  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = account;
  } else {
    updated = [...current, account];
  }

  localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(updated));

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('ai_accounts').upsert({
        id: account.id,
        name: account.name,
        description: account.description,
        badge_label: account.badgeLabel,
        avatar_color: account.avatarColor,
        icon: account.iconName,
        is_default: account.isDefault,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Supabase sync error (account):', err);
    }
  }
};

export const deleteAccount = async (accountId: string): Promise<void> => {
  const current = getStoredAccounts();
  const updated = current.filter(a => a.id !== accountId);
  localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(updated));

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('ai_accounts').delete().eq('id', accountId);
    } catch (err) {
      console.warn('Supabase delete error (account):', err);
    }
  }
};

export const getActiveAccountId = (): string => {
  const saved = localStorage.getItem(KEYS.ACTIVE_ACCOUNT);
  if (saved) return saved;
  const accounts = getStoredAccounts();
  const def = accounts.find(a => a.isDefault) || accounts[0];
  const defId = def ? def.id : 'acc-personal';
  localStorage.setItem(KEYS.ACTIVE_ACCOUNT, defId);
  return defId;
};

export const setActiveAccountId = (accountId: string): void => {
  localStorage.setItem(KEYS.ACTIVE_ACCOUNT, accountId);
  window.dispatchEvent(new CustomEvent('nexus:account-changed', { detail: { accountId } }));
};

export const getStoredCredentials = (accountId: string): Record<AIProvider, AccountCredential | null> => {
  const result: Record<AIProvider, AccountCredential | null> = {
    openai: null,
    anthropic: null,
    gemini: null,
    grok: null,
    manus: null,
    suno: null,
    deepseek: null,
    custom: null,
  };

  try {
    const raw = localStorage.getItem(`${KEYS.CREDENTIALS}_${accountId}`);
    if (raw) {
      const parsed: AccountCredential[] = JSON.parse(raw);
      parsed.forEach(cred => {
        result[cred.provider] = cred;
      });
    }
  } catch (e) {
    console.error('Failed to read credentials', e);
  }

  return result;
};

export const saveCredential = async (credential: AccountCredential): Promise<void> => {
  const { accountId, provider } = credential;
  const currentCreds = getStoredCredentials(accountId);
  currentCreds[provider] = credential;

  const arrayToStore = Object.values(currentCreds).filter(Boolean);
  localStorage.setItem(`${KEYS.CREDENTIALS}_${accountId}`, JSON.stringify(arrayToStore));

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('account_credentials').upsert({
        account_id: accountId,
        provider: credential.provider,
        api_key_encrypted: credential.apiKey,
        endpoint_url: credential.endpointUrl || null,
        organization_id: credential.organizationId || null,
        model_override: credential.modelOverride || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'account_id,provider' });
    } catch (err) {
      console.warn('Supabase credential sync error:', err);
    }
  }
};

export const getStoredConversations = (accountId: string): Conversation[] => {
  try {
    const raw = localStorage.getItem(`${KEYS.CONVERSATIONS}_${accountId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to parse conversations', e);
  }

  const starter: Conversation = {
    id: `conv-starter-${accountId}`,
    accountId,
    title: 'NexusAI Universal Assistant',
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    isPinned: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const initialList = [starter];
  localStorage.setItem(`${KEYS.CONVERSATIONS}_${accountId}`, JSON.stringify(initialList));
  return initialList;
};

export const saveConversation = async (conversation: Conversation): Promise<void> => {
  const { accountId } = conversation;
  const list = getStoredConversations(accountId);
  const idx = list.findIndex(c => c.id === conversation.id);
  let updated: Conversation[];

  if (idx >= 0) {
    updated = [...list];
    updated[idx] = conversation;
  } else {
    updated = [conversation, ...list];
  }

  localStorage.setItem(`${KEYS.CONVERSATIONS}_${accountId}`, JSON.stringify(updated));

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('conversations').upsert({
        id: conversation.id,
        account_id: conversation.accountId,
        title: conversation.title,
        provider: conversation.provider,
        model: conversation.model,
        is_pinned: conversation.isPinned,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Supabase conversation sync error:', err);
    }
  }
};

export const deleteConversation = async (conversationId: string, accountId: string): Promise<void> => {
  const list = getStoredConversations(accountId);
  const updated = list.filter(c => c.id !== conversationId);
  localStorage.setItem(`${KEYS.CONVERSATIONS}_${accountId}`, JSON.stringify(updated));
  localStorage.removeItem(`${KEYS.MESSAGES}_${conversationId}`);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('conversations').delete().eq('id', conversationId);
    } catch (err) {
      console.warn('Supabase conversation delete error:', err);
    }
  }
};

export const getStoredMessages = (conversationId: string): Message[] => {
  try {
    const raw = localStorage.getItem(`${KEYS.MESSAGES}_${conversationId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to parse messages', e);
  }

  if (conversationId.startsWith('conv-starter-')) {
    const defaultMsg: Message = {
      id: 'msg-welcome-001',
      conversationId,
      role: 'assistant',
      content: `### ⚡ Welcome to NexusAI Hub\n\nAll your AI accounts and apps are unified in this single workspace!\n\n- **No repeated logins/logouts**: You can set up distinct accounts (Personal, Work, Lab) with their respective keys and sessions.\n- **Integrated Models**: OpenAI (ChatGPT), Anthropic (Claude), Google (Gemini), xAI (Grok), Suno (Music generation), and Manus (Agent).\n- **Split View Comparison**: Test multiple models side-by-side using the top bar.\n- **Cloud Sync**: Open Supabase settings to link your live database for instant permanent cloud persistence across any browser!`,
      model: 'gemini-2.5-flash',
      provider: 'gemini',
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(`${KEYS.MESSAGES}_${conversationId}`, JSON.stringify([defaultMsg]));
    return [defaultMsg];
  }

  return [];
};

export const saveMessage = async (message: Message): Promise<void> => {
  const list = getStoredMessages(message.conversationId);
  const updated = [...list, message];
  localStorage.setItem(`${KEYS.MESSAGES}_${message.conversationId}`, JSON.stringify(updated));

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('messages').insert({
        id: message.id,
        conversation_id: message.conversationId,
        role: message.role,
        content: message.content,
        model: message.model || null,
        metadata: message.metadata || {},
      });
    } catch (err) {
      console.warn('Supabase message sync error:', err);
    }
  }
};

export const getStoredSunoTracks = (accountId: string): SunoTrack[] => {
  try {
    const raw = localStorage.getItem(`${KEYS.SUNO_TRACKS}_${accountId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to get suno tracks', e);
  }

  const sampleTracks: SunoTrack[] = [
    {
      id: 'track-cyberpunk-01',
      accountId,
      title: 'Neon Odyssey (Neural Horizons)',
      prompt: 'Cyberpunk Synthwave with distorted analog basslines, vocoder male vocals and driving arpeggiators',
      genre: 'Cyberpunk Synthwave',
      lyrics: '[Verse 1]\nCode cascading through the neon rain\nSilicon echoes silencing the pain\nDigital pulses in the city veins\n\n[Chorus]\nWe are the signals breaking through the dark\nA billion nodes ignited by a spark\nNexus rising, burning in the wire!',
      audioUrl: 'https://actions.google.com/sounds/v1/science_fiction/force_field_hum.ogg',
      durationSeconds: 194,
      status: 'ready',
      createdAt: new Date().toISOString(),
      coverGradient: 'from-pink-500 via-purple-600 to-indigo-700',
    },
    {
      id: 'track-lofi-02',
      accountId,
      title: 'Midnight Coding Session',
      prompt: 'Lo-Fi Chillhop with vinyl crackle, warm Rhodes piano, mellow bass and ambient rain sounds',
      genre: 'Lo-Fi Chillhop',
      lyrics: '[Instrumental beat with smooth chill vibes and mellow vinyl texture]',
      audioUrl: 'https://actions.google.com/sounds/v1/weather/light_rain_on_leaves.ogg',
      durationSeconds: 160,
      status: 'ready',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      coverGradient: 'from-cyan-500 via-blue-600 to-violet-800',
    }
  ];

  localStorage.setItem(`${KEYS.SUNO_TRACKS}_${accountId}`, JSON.stringify(sampleTracks));
  return sampleTracks;
};

export const saveSunoTrack = async (track: SunoTrack): Promise<void> => {
  const current = getStoredSunoTracks(track.accountId);
  const updated = [track, ...current.filter(t => t.id !== track.id)];
  localStorage.setItem(`${KEYS.SUNO_TRACKS}_${track.accountId}`, JSON.stringify(updated));

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('suno_tracks').upsert({
        id: track.id,
        account_id: track.accountId,
        title: track.title,
        prompt: track.prompt,
        lyrics: track.lyrics,
        genre: track.genre,
        audio_url: track.audioUrl || null,
        duration_seconds: track.durationSeconds,
        status: track.status,
      });
    } catch (err) {
      console.warn('Supabase suno sync error:', err);
    }
  }
};

export const getStoredManusTasks = (accountId: string): ManusTask[] => {
  try {
    const raw = localStorage.getItem(`${KEYS.MANUS_TASKS}_${accountId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to get manus tasks', e);
  }

  const sampleTasks: ManusTask[] = [
    {
      id: 'task-market-001',
      accountId,
      goal: 'Benchmark pricing and token latency between OpenAI o3-mini, Claude 3.7 Sonnet, and Gemini 2.5 Flash',
      status: 'completed',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      steps: [
        { id: '1', title: 'Initialize autonomous browser session', type: 'browser', status: 'completed', output: 'Headless Chromium sandbox launched with isolated cookies.' },
        { id: '2', title: 'Scrape pricing tiers & docs for OpenAI, Anthropic, Google', type: 'code', status: 'completed', output: 'Retrieved input/output token pricing matrices for Q1 2026.' },
        { id: '3', title: 'Synthesize comparative analysis and token benchmarks', type: 'think', status: 'completed', output: 'Calculated 1M token throughput costs across models.' },
        { id: '4', title: 'Generate executive summary markdown artifact', type: 'export', status: 'completed', output: 'Report generated: Gemini 2.5 Flash is 4x cheaper; Claude 3.7 Sonnet leads in reasoning accuracy.' },
      ],
      resultSummary: 'Complete benchmark report compiled. Gemini 2.5 Flash provides optimal cost-to-speed ratio, while Claude 3.7 Sonnet hybrid reasoning dominates coding benchmarks.',
    }
  ];

  localStorage.setItem(`${KEYS.MANUS_TASKS}_${accountId}`, JSON.stringify(sampleTasks));
  return sampleTasks;
};

export const saveManusTask = async (task: ManusTask): Promise<void> => {
  const current = getStoredManusTasks(task.accountId);
  const updated = [task, ...current.filter(t => t.id !== task.id)];
  localStorage.setItem(`${KEYS.MANUS_TASKS}_${task.accountId}`, JSON.stringify(updated));

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('manus_tasks').upsert({
        id: task.id,
        account_id: task.accountId,
        goal: task.goal,
        status: task.status,
        steps: task.steps,
        result_summary: task.resultSummary || null,
      });
    } catch (err) {
      console.warn('Supabase manus sync error:', err);
    }
  }
};
