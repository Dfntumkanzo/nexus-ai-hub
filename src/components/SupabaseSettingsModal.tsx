import React, { useState } from 'react';
import { X, Database, Check, Copy, ExternalLink, RefreshCw, ShieldCheck, AlertCircle } from 'lucide-react';
import { SupabaseConfig } from '../types';
import { saveSupabaseConfig, testSupabaseConnection } from '../lib/supabase';

interface SupabaseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SupabaseConfig;
  onUpdateConfig: (config: SupabaseConfig) => void;
}

export const SupabaseSettingsModal: React.FC<SupabaseSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
}) => {
  const [url, setUrl] = useState(config.supabaseUrl || '');
  const [anonKey, setAnonKey] = useState(config.supabaseAnonKey || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);

    const result = await testSupabaseConnection(url.trim(), anonKey.trim());
    setTestResult(result);
    setTesting(false);

    if (result.success) {
      const updated = saveSupabaseConfig({
        supabaseUrl: url.trim(),
        supabaseAnonKey: anonKey.trim(),
        isConnected: true,
        lastSyncedAt: new Date().toISOString(),
      });
      onUpdateConfig(updated);
    }
  };

  const handleCopySchema = async () => {
    try {
      const schemaSql = `-- ====================================================================
-- NEXUS AI HUB: SUPABASE DATABASE SCHEMA
-- ====================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT DEFAULT 'AI Operator',
    active_account_id UUID,
    settings JSONB DEFAULT '{"theme": "dark"}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ai_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    badge_label TEXT DEFAULT 'PRO',
    avatar_color TEXT DEFAULT '#3B82F6',
    icon TEXT DEFAULT 'Sparkles',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.account_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES public.ai_accounts(id) ON DELETE CASCADE NOT NULL,
    provider TEXT NOT NULL,
    api_key_encrypted TEXT NOT NULL,
    endpoint_url TEXT,
    organization_id TEXT,
    model_override TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_account_provider UNIQUE (account_id, provider)
);

CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES public.ai_accounts(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL DEFAULT 'New Conversation',
    provider TEXT NOT NULL DEFAULT 'gemini',
    model TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    model TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.suno_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES public.ai_accounts(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    prompt TEXT NOT NULL,
    lyrics TEXT,
    genre TEXT DEFAULT 'Synthwave',
    audio_url TEXT,
    duration_seconds INTEGER DEFAULT 180,
    status TEXT DEFAULT 'ready',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.manus_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES public.ai_accounts(id) ON DELETE CASCADE NOT NULL,
    goal TEXT NOT NULL,
    status TEXT DEFAULT 'completed',
    steps JSONB DEFAULT '[]'::jsonb,
    result_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suno_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manus_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow All" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON public.ai_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON public.account_credentials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON public.conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON public.messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON public.suno_tracks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON public.manus_tasks FOR ALL USING (true) WITH CHECK (true);
`;
      await navigator.clipboard.writeText(schemaSql);
      setCopiedSchema(true);
      setTimeout(() => setCopiedSchema(false), 3000);
    } catch (e) {
      console.error('Clipboard error', e);
    }
  };

  const handleDisconnect = () => {
    const updated = saveSupabaseConfig({
      supabaseUrl: '',
      supabaseAnonKey: '',
      isConnected: false,
    });
    setUrl('');
    setAnonKey('');
    setTestResult(null);
    onUpdateConfig(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#111827] border border-gray-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <Database className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">Supabase Cloud Sync</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${config.isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {config.isConnected ? 'CONNECTED' : 'LOCAL FALLBACK'}
                </span>
              </div>
              <p className="text-xs text-gray-400">Sync all your AI accounts, chats, Suno songs & Manus tasks across any device</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          <div className="p-4 rounded-xl bg-gray-950/80 border border-gray-800 text-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-200 uppercase tracking-wider text-[11px]">2-Minute Supabase Setup Guide</span>
              <a 
                href="https://supabase.com/dashboard" 
                target="_blank" 
                rel="noreferrer" 
                className="text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 font-medium"
              >
                <span>Open Supabase</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-gray-400 leading-relaxed text-[11px]">
              <li>Create a free database on <strong className="text-gray-200">Supabase</strong>.</li>
              <li>Go to <strong className="text-gray-200">SQL Editor</strong>, click <strong className="text-gray-200">New Query</strong>, paste the schema, and click <strong className="text-gray-200">Run</strong>.</li>
              <li>Go to <strong className="text-gray-200">Project Settings → API</strong>, copy your <strong className="text-gray-200">Project URL</strong> and <strong className="text-gray-200">anon public key</strong>.</li>
              <li>Paste below and click <strong className="text-emerald-400">Connect to Supabase</strong>.</li>
            </ol>
            <div className="pt-1">
              <button
                type="button"
                onClick={handleCopySchema}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold transition-colors border border-gray-700"
              >
                {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSchema ? 'SQL Schema Copied to Clipboard!' : 'Copy Supabase SQL Schema'}</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleTestAndSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Supabase Project URL *
              </label>
              <input
                type="url"
                required
                placeholder="https://xyzcompany.supabase.co"
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Supabase anon public Key *
              </label>
              <input
                type="password"
                required
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={e => setAnonKey(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {testResult && (
              <div className={`p-3 rounded-xl border text-xs flex items-start space-x-2 ${
                testResult.success 
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' 
                  : 'bg-red-950/40 border-red-500/50 text-red-300'
              }`}>
                {testResult.success ? <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="submit"
                disabled={testing}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2"
              >
                {testing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{testing ? 'Testing Connection...' : 'Connect to Supabase'}</span>
              </button>

              {config.isConnected && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-4 py-2.5 bg-gray-800 hover:bg-red-950/40 hover:text-red-400 border border-gray-700 text-xs font-medium text-gray-300 rounded-xl transition-colors"
                >
                  Disconnect
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="p-4 bg-gray-950/60 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
          <span>Local storage acts as an automatic zero-latency mirror.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
