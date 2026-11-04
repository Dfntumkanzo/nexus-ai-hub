import { Message, AIProvider } from '../types';

export interface GenerateOptions {
  messages: Message[];
  provider: AIProvider;
  model: string;
  onChunk?: (text: string) => void;
}

export const generateAIResponse = async ({
  messages,
  provider,
  model,
  onChunk,
}: GenerateOptions): Promise<string> => {
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || 'Hello';
  const queryLower = lastUserMsg.toLowerCase();

  let response = '';

  if (queryLower.includes('code') || queryLower.includes('react') || queryLower.includes('python') || queryLower.includes('func') || queryLower.includes('component')) {
    response = `Here is a clean implementation for your request:

\`\`\`typescript
import React, { useState, useEffect } from 'react';

export function SessionEngine({ accountEmail }: { accountEmail: string }) {
  const [activeSession, setActiveSession] = useState<string | null>(null);

  useEffect(() => {
    console.log('[NexusAI] Swapped to account session:', accountEmail);
    setActiveSession(accountEmail);
  }, [accountEmail]);

  return (
    <div className="flex items-center space-x-2 text-sm text-neutral-300">
      <span className="w-2 h-2 rounded-full bg-emerald-400" />
      <span>Active Profile: {activeSession}</span>
    </div>
  );
}
\`\`\`

### Notes:
- **Zero-Logout Persistence**: Sessions remain active in local storage and sync to your live Supabase database.
- **Model Selected**: Running through **${model}**.`;
  } else if (queryLower.includes('suno') || queryLower.includes('song') || queryLower.includes('music')) {
    response = `### 🎵 Suno AI Generated Track Concept

**Title**: *Midnight Silicon Skyline*\n**Genre**: *Synthwave / Cyberpunk (120 BPM, Warm Analog Moog Bass)*\n\n\`\`\`text
[Intro - Soft Arpeggio Fade-In]

[Verse 1]
Lines of neon flickering in the rain
Every account united in the chain
No more logins, no more logging out
We found the rhythm we were dreaming about

[Chorus]
All the models singing in the wire!
ChatGPT, Claude and Gemini inspire!
Burning brighter than the midnight sun,
Everything together, all in one!
\`\`\``;
  } else if (queryLower.includes('manus') || queryLower.includes('agent') || queryLower.includes('research')) {
    response = `### 🤖 Manus Autonomous Agent Workflow Plan

1. **Goal Ingestion**: Parsing target objectives and subtasks.
2. **Browser Execution**: Launching isolated Chromium session with active Google credentials.
3. **Data Synthesis**: Extracting relevant metrics and auditing outputs.
4. **Artifact Compilation**: Deliverable saved directly to your Supabase conversation table.

*Task complete. What would you like me to execute next?*`;
  } else {
    response = `Hello! I am active as **${model}**.\n\nAll your Google accounts are connected to this workspace. You can switch between accounts in the bottom-left menu or top bar at any time to open different chat threads and sessions without logging out.\n\nHow can I help you today?`;
  }

  const words = response.split(' ');
  let current = '';
  for (let i = 0; i < words.length; i++) {
    current += (i === 0 ? '' : ' ') + words[i];
    if (onChunk && i % 2 === 0) {
      onChunk(current);
      await new Promise(r => setTimeout(r, 12));
    }
  }

  if (onChunk) onChunk(response);
  return response;
};
