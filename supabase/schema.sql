-- ====================================================================
-- NEXUS AI HUB: SUPABASE DATABASE SCHEMA
-- Multi-Account All-In-One AI Workspace Architecture
-- Supports: ChatGPT, Claude, Gemini, Grok, Manus, Suno, and more
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT DEFAULT 'AI Operator',
    active_account_id UUID,
    settings JSONB DEFAULT '{"theme": "dark", "soundEnabled": true, "streamSpeed": "fast"}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
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
    custom_headers JSONB DEFAULT '{}'::jsonb,
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
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    model TEXT,
    tokens_used INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.suno_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES public.ai_accounts(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    prompt TEXT NOT NULL,
    lyrics TEXT,
    genre TEXT DEFAULT 'Synthwave / Cyberpunk',
    audio_url TEXT,
    duration_seconds INTEGER DEFAULT 180,
    status TEXT DEFAULT 'ready' CHECK (status IN ('generating', 'ready', 'failed')),
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.manus_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES public.ai_accounts(id) ON DELETE CASCADE NOT NULL,
    goal TEXT NOT NULL,
    status TEXT DEFAULT 'completed' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
    steps JSONB DEFAULT '[]'::jsonb,
    artifacts JSONB DEFAULT '[]'::jsonb,
    result_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.prompt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES public.ai_accounts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    prompt TEXT NOT NULL,
    category TEXT DEFAULT 'Coding',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suno_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manus_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public or Authenticated Read/Write Profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public or Authenticated Read/Write Accounts" ON public.ai_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public or Authenticated Read/Write Credentials" ON public.account_credentials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public or Authenticated Read/Write Conversations" ON public.conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public or Authenticated Read/Write Messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public or Authenticated Read/Write Suno" ON public.suno_tracks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public or Authenticated Read/Write Manus" ON public.manus_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public or Authenticated Read/Write Prompts" ON public.prompt_templates FOR ALL USING (true) WITH CHECK (true);
