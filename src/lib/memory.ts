import { SharedMemory } from '../types';
import { INITIAL_SHARED_MEMORIES } from './constants';
import { getSupabaseClient } from './supabase';

const MEMORY_STORAGE_KEY = 'nexus_universal_shared_memories_v5';

export const getStoredMemories = (): SharedMemory[] => {
  try {
    const raw = localStorage.getItem(MEMORY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to parse memories from storage', e);
  }

  localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(INITIAL_SHARED_MEMORIES));
  return INITIAL_SHARED_MEMORIES;
};

export const saveSharedMemory = async (memory: SharedMemory): Promise<void> => {
  const current = getStoredMemories();
  const existingIdx = current.findIndex(m => m.id === memory.id || (m.key.toLowerCase() === memory.key.toLowerCase()));
  let updated: SharedMemory[];

  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = memory;
  } else {
    updated = [memory, ...current];
  }

  localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(updated));

  // Sync to Supabase table
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('shared_memories').upsert({
        key: memory.key,
        content: memory.content,
        category: memory.category,
      });
    } catch (err) {
      console.warn('Supabase memory sync error:', err);
    }
  }
};

export const deleteSharedMemory = async (id: string): Promise<void> => {
  const current = getStoredMemories();
  const updated = current.filter(m => m.id !== id);
  localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(updated));

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('shared_memories').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase memory delete error:', err);
    }
  }
};

export const formatMemoriesForPrompt = (memories: SharedMemory[]): string => {
  if (!memories || memories.length === 0) return '';

  const memoryLines = memories
    .map(m => `- [${m.category.toUpperCase()}] ${m.key}: ${m.content}`)
    .join('\n');

  return `\n\n=== UNIFIED SHARED MEMORY CORE ===\nThe following verified context, project specs, and user preferences are universally shared across all AI models (ChatGPT, Claude, Gemini, Grok, Manus, Suno). Always adhere to these memories seamlessly:\n${memoryLines}\n==================================\n`;
};

// Auto memory extraction helper
export const autoDetectMemory = (userPrompt: string): { key: string; content: string } | null => {
  const lower = userPrompt.toLowerCase().trim();
  
  if (lower.startsWith('remember that ') || lower.startsWith('remember: ')) {
    const raw = userPrompt.replace(/^remember\s+(that|:)?\s*/i, '').trim();
    const parts = raw.split(/[:=]/);
    if (parts.length > 1) {
      return { key: parts[0].trim(), content: parts.slice(1).join(':').trim() };
    }
    return { key: 'User Note', content: raw };
  }

  if (lower.includes('my name is ')) {
    const match = userPrompt.match(/my name is ([a-zA-Z0-9\s]+)/i);
    if (match) return { key: 'User Name', content: match[1].trim() };
  }

  if (lower.includes('my favorite ') || lower.includes('i prefer ')) {
    return { key: 'User Preference', content: userPrompt };
  }

  return null;
};
