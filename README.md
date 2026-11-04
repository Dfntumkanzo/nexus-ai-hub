# ⚡ NexusAI Hub - All-In-One Multi-Account AI Workspace with Shared Memory

> **One platform to unite all your AI accounts and apps (ChatGPT, Claude, Gemini, Grok, Manus, Suno) under ONE Universal Shared Memory — without repeated logins or logouts.**
> Connected directly to **Supabase** for perpetual cloud storage and synchronized across models in real time.
> Features multi-mode intelligence inspired by **Multi (`getmulti.ai`)**: **Chat**, **Side-by-Side Compare Arena**, **Council of Consensus**, and **Autonomous Auto-Route**.

---

## 🌟 The Problem Solved

Every day, developers and power users suffer from:
1. **Repeated Logins & Logouts**: Switching between personal, work, and client accounts across 5+ different websites (ChatGPT, Claude, Gemini, Grok, Suno, Manus).
2. **Siloed Memory & Zero Context Sharing**: ChatGPT doesn't know what you discussed with Claude 3.7 Sonnet; Gemini doesn't know the project specifications you gave to Manus; Suno has no idea what theme you just designed.
3. **Scattered Chat History**: Inability to see all chats from all accounts in one organized hierarchy.

**NexusAI Hub completely eliminates this.**

---

## 🚀 Key Features

### 1. 📁 Unified Sidebar Tree Hierarchy
All your accounts and chats organized in one place:
```text
▼ Claude (Anthropic)
  ▼ Account 1 (Personal • personal.user@gmail.com)
    - React Architecture Refactor
    - Hybrid Thinking Algorithms
▼ ChatGPT (OpenAI)
  ▼ Account 1 (Personal • personal.user@gmail.com)
    - Tokyo Travel & Itinerary Plan
    - Python API Server Optimization
  ▼ Account 2 (Work • work.corp@company.com)
    - Q3 Enterprise Strategy Document
    - Security Compliance Checklist
▼ Google Gemini
  ▼ Account 1 (Google Workspace)
    - 1M Token Codebase Document Analysis
▼ Grok (xAI)
  ▼ Account 1 (X Premium)
    - Real-Time Tech & Market Insights
▼ Suno AI Studio
  ▼ Account 1 (Creator Studio)
    - Cyberpunk Synthwave Anthem (Inline audio player)
▼ Manus Autonomous Agent
  ▼ Account 1 (Autonomous Agent)
    - Autonomous Competitor Research Pipeline (Execution trace)
```
- **1-Click Switching**: Click any chat to immediately view and continue it.
- **Add Accounts Per Provider**: Add `Account 2`, `Account 3`, or custom enterprise accounts under any AI provider at any time.

---

### 2. 🧠 Universal Shared Memory Core (`shared_memories`)
- **One Shared Brain for All Models**: Any memory saved (preferences, project architecture, facts, coding conventions) is **automatically injected into every model prompt**.
- **Mid-Thread Model Switching**: Start a chat with **ChatGPT (GPT-4o)**, switch mid-thread to **Claude 3.7 Sonnet** for coding, switch to **Suno** to generate a theme track, and command **Manus** to execute the plan — all in the same thread with 100% continuous context!
- **Auto-Memory Detection**: Tell any model *"Remember that..."* and the engine automatically extracts and writes the memory to Supabase.

---

### 3. 🎯 Multi-Mode Workspace (Inspired by `getmulti.ai`)
Toggle between 4 operational modes at the top bar:
* **💬 Chat Mode**: Clean ChatGPT-style interface for the active conversation.
* **⚔️ Compare Mode**: Side-by-side model arena (e.g. GPT-4o vs Claude 3.7 Sonnet) benchmarking responses simultaneously with shared memory.
* **🏛️ Council Mode**: Deliberate across GPT-4o, Claude 3.7 Sonnet, and Gemini 2.5 Flash to synthesize a unified consensus verdict.
* **⚡ Auto-Route Mode**: Autonomous orchestrator that inspects your prompt and routes to the best model (Claude for code, o3-mini for math, Suno for audio, Manus for research, Gemini for large documents).

---

### 4. 🎵 Suno & 🤖 Manus Native Integrations
- **Suno**: Generates radio-ready songs with lyrics and inline HTML5 audio playback.
- **Manus**: Step-by-step visual execution trace (sandbox creation, web scraping, computation, Supabase sync).

---

### 5. ☁️ Live Supabase Cloud Database Integration
- Full PostgreSQL database schema in `supabase/schema.sql`.
- Direct live synchronization for:
  - `shared_memories`
  - `conversations`
  - `messages`
  - `ai_accounts`
  - `account_credentials`
  - `suno_tracks`
  - `manus_tasks`

---

## 🛠️ Quick Start

```bash
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production
```bash
npm run build
```

---

## 📄 License
MIT © Dfntumkanzo
