import { GoogleAccountProfile, Conversation, Message } from '../types';
import { DEFAULT_GOOGLE_ACCOUNTS } from './constants';
import { getSupabaseClient } from './supabase';

const KEYS = {
  GOOGLE_ACCOUNTS: 'nexus_google_accounts_v2',
  ACTIVE_GOOGLE_ID: 'nexus_active_google_id_v2',
  CONVERSATIONS: 'nexus_conversations_v2',
  MESSAGES: 'nexus_messages_v2',
};

export const getStoredGoogleAccounts = (): GoogleAccountProfile[] => {
  try {
    const raw = localStorage.getItem(KEYS.GOOGLE_ACCOUNTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to parse Google accounts from storage', e);
  }

  localStorage.setItem(KEYS.GOOGLE_ACCOUNTS, JSON.stringify(DEFAULT_GOOGLE_ACCOUNTS));
  return DEFAULT_GOOGLE_ACCOUNTS;
};

export const saveGoogleAccount = async (account: GoogleAccountProfile): Promise<void> => {
  const current = getStoredGoogleAccounts();
  const existingIdx = current.findIndex(a => a.id === account.id || a.email === account.email);
  let updated: GoogleAccountProfile[];

  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = account;
  } else {
    updated = [...current, account];
  }

  localStorage.setItem(KEYS.GOOGLE_ACCOUNTS, JSON.stringify(updated));

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('ai_accounts').upsert({
        id: account.id.startsWith('google-') ? undefined : account.id,
        name: account.displayName,
        description: account.email,
        badge_label: 'GOOGLE',
        avatar_color: account.color,
        is_default: account.isDefault,
      });
    } catch (err) {
      console.warn('Supabase sync error (account):', err);
    }
  }
};

export const deleteGoogleAccount = async (id: string): Promise<void> => {
  const current = getStoredGoogleAccounts();
  const updated = current.filter(a => a.id !== id);
  localStorage.setItem(KEYS.GOOGLE_ACCOUNTS, JSON.stringify(updated));
};

export const getActiveGoogleAccountId = (): string => {
  const saved = localStorage.getItem(KEYS.ACTIVE_GOOGLE_ID);
  if (saved) return saved;
  const accounts = getStoredGoogleAccounts();
  const def = accounts.find(a => a.isDefault) || accounts[0];
  const defId = def ? def.id : 'google-acc-personal';
  localStorage.setItem(KEYS.ACTIVE_GOOGLE_ID, defId);
  return defId;
};

export const setActiveGoogleAccountId = (id: string): void => {
  localStorage.setItem(KEYS.ACTIVE_GOOGLE_ID, id);
  window.dispatchEvent(new CustomEvent('nexus:google-account-changed', { detail: { accountId: id } }));
};

export const getStoredConversations = (googleAccountId: string): Conversation[] => {
  try {
    const raw = localStorage.getItem(`${KEYS.CONVERSATIONS}_${googleAccountId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to parse conversations', e);
  }

  const starter: Conversation = {
    id: `conv-starter-${googleAccountId}`,
    googleAccountId,
    title: 'New chat',
    provider: 'openai',
    model: 'gpt-4o',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const initialList = [starter];
  localStorage.setItem(`${KEYS.CONVERSATIONS}_${googleAccountId}`, JSON.stringify(initialList));
  return initialList;
};

export const saveConversation = async (conversation: Conversation): Promise<void> => {
  const { googleAccountId } = conversation;
  const list = getStoredConversations(googleAccountId);
  const idx = list.findIndex(c => c.id === conversation.id);
  let updated: Conversation[];

  if (idx >= 0) {
    updated = [...list];
    updated[idx] = conversation;
  } else {
    updated = [conversation, ...list];
  }

  localStorage.setItem(`${KEYS.CONVERSATIONS}_${googleAccountId}`, JSON.stringify(updated));

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('conversations').upsert({
        id: conversation.id.startsWith('conv-') ? undefined : conversation.id,
        title: conversation.title,
        provider: conversation.provider,
        model: conversation.model,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Supabase conversation sync error:', err);
    }
  }
};

export const deleteConversation = async (conversationId: string, googleAccountId: string): Promise<void> => {
  const list = getStoredConversations(googleAccountId);
  const updated = list.filter(c => c.id !== conversationId);
  localStorage.setItem(`${KEYS.CONVERSATIONS}_${googleAccountId}`, JSON.stringify(updated));
  localStorage.removeItem(`${KEYS.MESSAGES}_${conversationId}`);
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
        model: message.model || null,
      });
    } catch (err) {
      console.warn('Supabase message sync error:', err);
    }
  }
};
