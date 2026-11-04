# ⚡ NexusAI Hub - All-In-One Multi-Account AI Workspace

> **One platform to rule all your AI accounts and apps without repeated logins or logouts.**  
> Seamlessly connect and switch between multiple accounts for **ChatGPT (OpenAI), Claude (Anthropic), Gemini (Google), Grok (xAI), Manus AI Agent, Suno AI Music, DeepSeek**, and more, with instant cloud persistence powered by **Supabase**.

---

## 🌟 Why NexusAI Hub?

If you use multiple AI services and have separate accounts (e.g. personal subscriptions, work credentials, student accounts, experimental API tiers), you know the daily pain of:
- Constant **logout and login loops** in your web browser.
- Lost session context, scattered conversation histories, and tab overload.
- Needing incognito windows just to prompt Claude or ChatGPT with a secondary account.

**NexusAI Hub completely eliminates this.**  
It unites all your AI tools, account identities, conversation records, and media generation studios into a single, high-performance web application.

---

## 🚀 Key Features

### 1. 🔄 1-Click Multi-Account Profile Switching
- Switch between **Personal Pro, Work/Team Enterprise, Research Lab**, or custom accounts in one click from the top bar.
- **Zero Logout Required**: Each profile maintains its own isolated API credentials, memory, conversations, and custom parameters.
- Add unlimited account profiles with custom avatar colors and role tags (`PRO`, `WORK`, `DEV`, `VIP`).

### 2. 💬 Omni-Chat Interface
- Unified chat hub supporting:
  - **OpenAI**: GPT-4o, o3-mini (Reasoning High), GPT-4o-mini
  - **Anthropic**: Claude 3.7 Sonnet (Hybrid extended thinking), Claude 3.5 Sonnet
  - **Google**: Gemini 2.5 Flash (1M tokens context), Gemini 2.5 Pro
  - **xAI**: Grok 3 (Real-time truth), Grok 2 Vision
  - **DeepSeek**: DeepSeek R1 open-reasoning
- Real-time streaming responses, markdown formatting, syntax highlighted code blocks, copy utilities, and conversation persistence.

### 3. ⚔️ Split Arena (Multi-Model Battle Mode)
- Send **one prompt** and watch 2 or 3 models generate answers side-by-side in real-time.
- Benchmark reasoning depth, latency, and response style across providers.

### 4. 🎵 Suno AI Music Studio
- Synthesize full-length audio tracks, cybernetic melodies, and lyrics.
- Genre selector: *Cyberpunk Synthwave, Lo-Fi Chillhop, Future Bass, Metal, Indie Pop, Orchestral*.
- Interactive audio player with live soundwave animation, progress scrubbing, and track download.

### 5. 🤖 Manus Autonomous Agent
- Autonomous agent workspace with execution graph.
- Executes multi-step digital workflows: decomposes tasks, launches headless browser sandboxes, executes code, and compiles structured deliverables.

### 6. 🌐 AI Web Apps Portal
- Directory and launchpad for the full AI ecosystem (ChatGPT, Claude, Gemini, Grok, Manus, Suno, Midjourney, Perplexity, DeepSeek).
- Guidelines and tools for running isolated browser session containers.

### 7. ☁️ Supabase Cloud Synchronization
- Ready-to-use Supabase backend integration (`supabase/schema.sql`).
- Stores accounts, API credentials, chat histories, Suno music tracks, and Manus task logs.
- Automatic local mirror ensures instant zero-latency usage even before configuring cloud sync.

---

## 🛠️ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production
```bash
npm run build
```

---

## 🗄️ Supabase Database Setup (2 Minutes)

1. Create a free project on [Supabase](https://supabase.com).
2. Go to the **SQL Editor** tab in your Supabase dashboard.
3. Open `supabase/schema.sql` from this repository, copy its contents, paste them into the SQL Editor, and click **Run**.
4. In Supabase, navigate to **Project Settings → API** and copy:
   - **Project URL**
   - **anon / public key**
5. In NexusAI Hub, click the **Connect Supabase** button in the top navigation bar, paste your credentials, and click **Connect**.
6. All your chats, music tracks, agent tasks, and accounts are now perpetually backed up to your Supabase cloud database!

---

## 🔒 Security & Privacy

- All API keys entered in the **API Vault** are isolated per account profile.
- Credentials can be saved locally in your browser storage or synced to your private Supabase instance protected with **Row Level Security (RLS)**.
- Official API endpoints are called directly from your client without any third-party intermediary servers tracking your data.

---

## 📦 Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Lucide Icons
- **Database / Cloud Sync**: Supabase (`@supabase/supabase-js`)
- **Audio & Animations**: Canvas Confetti, HTML5 Web Audio API
- **Formatting**: React Markdown, Remark GFM

---

## 📄 License

MIT License. Crafted for high-velocity AI builders.
