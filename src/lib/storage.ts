import { ProviderAccount, Conversation, Message, AIProvider } from '../types';
import { DEFAULT_ACCOUNTS, INITIAL_CONVERSATIONS, AI_MODELS } from './constants';
import { ParsedChat } from './importers';
import { getSupabaseClient } from './supabase';

const KEYS = {
  ACCOUNTS: 'nexus_provider_accounts_v5',
  CONVERSATIONS: 'nexus_conversations_tree_v5',
  MESSAGES: 'nexus_messages_v5',
};

// ==========================================
// 1. PROVIDER ACCOUNTS
// ==========================================

export const getStoredAccounts = (): ProviderAccount[] => {
  try {
    const raw = localStorage.getItem(KEYS.ACCOUNTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to parse accounts', e);
  }

  localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(DEFAULT_ACCOUNTS));
  return DEFAULT_ACCOUNTS;
};

export const saveAccount = async (account: ProviderAccount): Promise<void> => {
  const current = getStoredAccounts();
  const idx = current.findIndex(a => a.id === account.id);
  let updated: ProviderAccount[];

  if (idx >= 0) {
    updated = [...current];
    updated[idx] = account;
  } else {
    updated = [...current, account];
  }

  localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(updated));

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('ai_accounts').upsert({
        name: account.name,
        badge_label: account.provider.toUpperCase(),
        avatar_color: account.avatarColor,
        is_default: Boolean(account.isDefault),
      });
    } catch (err) {
      console.warn('Supabase sync account error:', err);
    }
  }
};

export const deleteAccount = async (id: string): Promise<void> => {
  const current = getStoredAccounts();
  const updated = current.filter(a => a.id !== id);
  localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(updated));

  // Also remove conversations for this account
  const convs = getStoredConversations();
  const remainingConvs = convs.filter(c => c.accountId !== id);
  localStorage.setItem(KEYS.CONVERSATIONS, JSON.stringify(remainingConvs));
};

// ==========================================
// 2. CONVERSATIONS TREE
// ==========================================

export const getStoredConversations = (): Conversation[] => {
  try {
    const raw = localStorage.getItem(KEYS.CONVERSATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to parse conversations', e);
  }

  localStorage.setItem(KEYS.CONVERSATIONS, JSON.stringify(INITIAL_CONVERSATIONS));
  return INITIAL_CONVERSATIONS;
};

export const saveConversation = async (conversation: Conversation): Promise<void> => {
  const list = getStoredConversations();
  const idx = list.findIndex(c => c.id === conversation.id);
  let updated: Conversation[];

  if (idx >= 0) {
    updated = [...list];
    updated[idx] = conversation;
  } else {
    updated = [conversation, ...list];
  }

  localStorage.setItem(KEYS.CONVERSATIONS, JSON.stringify(updated));

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('conversations').upsert({
        title: conversation.title,
        provider: conversation.provider,
        model: conversation.activeModelId,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Supabase conversation sync error:', err);
    }
  }
};

export const deleteConversation = async (id: string): Promise<void> => {
  const list = getStoredConversations();
  const updated = list.filter(c => c.id !== id);
  localStorage.setItem(KEYS.CONVERSATIONS, JSON.stringify(updated));
  localStorage.removeItem(`${KEYS.MESSAGES}_${id}`);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('conversations').delete().eq('title', id);
    } catch (err) {
      console.warn('Supabase delete error:', err);
    }
  }
};

// ==========================================
// 3. MESSAGES
// ==========================================

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

  // Pre-seed sample thread if it's one of the initial conversations
  const sampleMessages = getSampleMessagesForConversation(conversationId);
  if (sampleMessages.length > 0) {
    localStorage.setItem(`${KEYS.MESSAGES}_${conversationId}`, JSON.stringify(sampleMessages));
    return sampleMessages;
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
        role: message.role,
        content: message.content,
        model: message.model,
      });
    } catch (err) {
      console.warn('Supabase message sync error:', err);
    }
  }
};

function getSampleMessagesForConversation(convId: string): Message[] {
  if (convId === 'conv_claude_1_1') {
    return [
      {
        id: 'msg_c1',
        conversationId: convId,
        role: 'user',
        content: 'Claude, how should we structure the universal shared memory state in React 19 and Tailwind CSS?',
        model: 'claude-3-7-sonnet',
        provider: 'anthropic',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'msg_c2',
        conversationId: convId,
        role: 'assistant',
        content: `### Architecture Analysis by Claude 3.7 Sonnet\n\nTo achieve true **Zero-Logout Multi-Account Architecture**, we separate state into three unified tiers:\n\n1. **Universal Memory Core**: Synced via Supabase \`shared_memories\`. Any instruction given in ChatGPT is instantly readable by Claude, Gemini, Grok, and Suno.\n2. **Hierarchical Tree Representation**: Grouped cleanly in the sidebar as \`[Provider] → [Account] → [Chats]\`.\n3. **Independent Credentials per Account**: Each account under Claude or ChatGPT holds its own token/key while reading the identical project knowledge bank.`,
        model: 'claude-3-7-sonnet',
        provider: 'anthropic',
        timestamp: new Date(Date.now() - 3600000 * 2 + 10000).toISOString(),
      },
    ];
  }

  if (convId === 'conv_chatgpt_1_1') {
    return [
      {
        id: 'msg_g1',
        conversationId: convId,
        role: 'user',
        content: 'Plan a 5-day itinerary in Tokyo focusing on Akihabara tech, Shibuya crossing, and Shinjuku night views.',
        model: 'gpt-4o',
        provider: 'openai',
        timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
      },
      {
        id: 'msg_g2',
        conversationId: convId,
        role: 'assistant',
        content: `### 🇯🇵 5-Day Tokyo High-Tech & Culture Itinerary\n\n* **Day 1: Shibuya & Shinjuku**\n  - Morning: Scramble Crossing & Shibuya Sky 360° observation deck.\n  - Evening: Omoide Yokocho & Kabukicho neon skyline.\n* **Day 2: Akihabara Electric Town**\n  - Explore Radio Kaikan, retro gaming arcades, and robotics shops.\n* **Day 3: Asakusa & Akihabara VR**\n  - Senso-ji temple morning, VR entertainment zones in the afternoon.\n* **Day 4: TeamLab Borderless & Roppongi**\n  - Digital art immersion and Tokyo Tower night vista.\n* **Day 5: Ginza & Departure**\n  - High-end electronics flagships and bullet train transit.`,
        model: 'gpt-4o',
        provider: 'openai',
        timestamp: new Date(Date.now() - 3600000 * 1 + 8000).toISOString(),
      },
    ];
  }

  if (convId === 'conv_chatgpt_2_1') {
    return [
      {
        id: 'msg_w1',
        conversationId: convId,
        role: 'user',
        content: 'Review our Q3 Enterprise Strategy document focusing on multi-agent autonomy.',
        model: 'o3-mini',
        provider: 'openai',
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        id: 'msg_w2',
        conversationId: convId,
        role: 'assistant',
        content: `### Executive Analysis (o3-mini Reasoning)\n\nThis Q3 strategy highlights high ROI in automating repetitive multi-provider tasks. Key takeaway: By maintaining persistent shared context between ChatGPT and autonomous agents like Manus, cross-functional cycle times drop by 74%.`,
        model: 'o3-mini',
        provider: 'openai',
        timestamp: new Date(Date.now() - 3600000 * 3 + 12000).toISOString(),
      },
    ];
  }

  if (convId === 'conv_suno_1_1') {
    return [
      {
        id: 'msg_s1',
        conversationId: convId,
        role: 'user',
        content: 'Generate an energetic synthwave theme song for our unified AI workspace.',
        model: 'suno-v3.5',
        provider: 'suno',
        timestamp: new Date(Date.now() - 3600000 * 7).toISOString(),
      },
      {
        id: 'msg_s2',
        conversationId: convId,
        role: 'assistant',
        content: `### 🎵 Suno AI Studio Generation\n\n**Style**: Cyberpunk Synthwave (128 BPM, Analog Bass, Vocoder Vocals)\n**Theme**: "All accounts and models in one unified thread"\n\n\`\`\`text\n[Intro - Synth Arpeggios]\n\n[Verse 1]\nCode cascading in the neon stream\nAll our accounts woven in a single dream\nNo more passwords, no more logins to repeat\nNexus memory keeping all the nodes on beat!\n\n[Chorus]\nOne mind, infinite sound!\nEvery model in this hub is bound!\nEchoes in the wire, burning with desire!\n\`\`\`\n\n*(Listen to the generated track below with live waveform visualization)*`,
        model: 'suno-v3.5',
        provider: 'suno',
        audioUrl: 'https://actions.google.com/sounds/v1/science_fiction/force_field_hum.ogg',
        timestamp: new Date(Date.now() - 3600000 * 7 + 15000).toISOString(),
      },
    ];
  }

  return [];
}


// ==========================================
// 4. BULK IMPORT CHAT HISTORY (ChatGPT / Claude)
// ==========================================

export const bulkImportChats = async (
  accountId: string,
  provider: AIProvider,
  parsedChats: ParsedChat[]
): Promise<{ conversationCount: number; messageCount: number; newConversations: Conversation[] }> => {
  const currentConvs = getStoredConversations();
  const defaultModel = AI_MODELS.find(m => m.provider === provider)?.id || 'gpt-4o';
  
  const newConvs: Conversation[] = [];
  let totalMessages = 0;

  for (let i = 0; i < parsedChats.length; i++) {
    const pc = parsedChats[i];
    const convId = `conv_imp_${provider}_${Date.now()}_${i}`;
    const newConv: Conversation = {
      id: convId,
      provider,
      accountId,
      title: pc.title || `Imported Chat ${i + 1}`,
      activeModelId: defaultModel,
      createdAt: pc.createdAt || new Date().toISOString(),
      updatedAt: pc.createdAt || new Date().toISOString(),
    };
    newConvs.push(newConv);

    const msgs: Message[] = pc.messages.map((m, mIdx) => ({
      id: `msg_imp_${convId}_${mIdx}`,
      conversationId: convId,
      role: m.role,
      content: m.content,
      model: defaultModel,
      provider,
      timestamp: m.timestamp || newConv.createdAt,
    }));

    totalMessages += msgs.length;
    localStorage.setItem(`${KEYS.MESSAGES}_${convId}`, JSON.stringify(msgs));
  }

  // Prepend new conversations to current list
  const updatedConvs = [...newConvs, ...currentConvs];
  localStorage.setItem(KEYS.CONVERSATIONS, JSON.stringify(updatedConvs));

  // Sync to Supabase in the background
  const supabase = getSupabaseClient();
  if (supabase && newConvs.length > 0) {
    try {
      const convRows = newConvs.map(c => ({
        title: c.title,
        provider: c.provider,
        model: c.activeModelId,
        updated_at: c.updatedAt,
      }));
      await supabase.from('conversations').upsert(convRows);
    } catch (e) {
      console.warn('Supabase bulk sync conversations error:', e);
    }
  }

  return { conversationCount: newConvs.length, messageCount: totalMessages, newConversations: newConvs };
};
