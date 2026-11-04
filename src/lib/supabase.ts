import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../types';

const STORAGE_KEY = 'nexus_ai_supabase_config';

export const getSupabaseConfig = (): SupabaseConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading Supabase config from storage', e);
  }

  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  return {
    supabaseUrl: envUrl,
    supabaseAnonKey: envKey,
    isConnected: false,
  };
};

export const saveSupabaseConfig = (config: Partial<SupabaseConfig>): SupabaseConfig => {
  const current = getSupabaseConfig();
  const updated: SupabaseConfig = { ...current, ...config };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  
  initSupabaseClient(updated.supabaseUrl, updated.supabaseAnonKey);
  return updated;
};

let clientInstance: SupabaseClient | null = null;

export const initSupabaseClient = (url?: string, key?: string): SupabaseClient | null => {
  const config = getSupabaseConfig();
  const targetUrl = url || config.supabaseUrl;
  const targetKey = key || config.supabaseAnonKey;

  if (targetUrl && targetKey && targetUrl.startsWith('https://')) {
    try {
      clientInstance = createClient(targetUrl, targetKey);
      return clientInstance;
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      clientInstance = null;
      return null;
    }
  }

  clientInstance = null;
  return null;
};

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!clientInstance) {
    return initSupabaseClient();
  }
  return clientInstance;
};

export const testSupabaseConnection = async (url: string, key: string): Promise<{ success: boolean; message: string }> => {
  if (!url || !key) {
    return { success: false, message: 'Supabase URL and Anon Key are required.' };
  }

  if (!url.startsWith('https://')) {
    return { success: false, message: 'Supabase URL must start with https://' };
  }

  try {
    const tempClient = createClient(url, key);
    const { data, error } = await tempClient.from('ai_accounts').select('id').limit(1);

    if (error) {
      if (error.code === '42P01') {
        return { 
          success: true, 
          message: 'Connected to Supabase! (Note: Run schema.sql in your Supabase SQL editor to create the tables).' 
        };
      }
      return { success: false, message: `Supabase Error: ${error.message}` };
    }

    return { success: true, message: 'Successfully connected and verified with your Supabase database!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Network error connecting to Supabase.' };
  }
};
