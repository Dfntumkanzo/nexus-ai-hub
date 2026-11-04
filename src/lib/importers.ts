import { Conversation, Message, AIProvider } from '../types';

export interface ParsedChat {
  title: string;
  createdAt: string;
  messages: {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
  }[];
}

/**
 * Robust parser for ChatGPT conversations.json export, Claude export, and generic formats.
 */
export function parseChatExport(jsonContent: string, provider: AIProvider = 'openai'): ParsedChat[] {
  let data: any;
  try {
    data = JSON.parse(jsonContent);
  } catch (err: any) {
    throw new Error('Invalid JSON file. Please ensure you upload a valid conversations.json file.');
  }

  const results: ParsedChat[] = [];

  // Case 1: Array of conversations (Standard ChatGPT or Claude export)
  if (Array.isArray(data)) {
    for (const item of data) {
      // 1.1 OpenAI ChatGPT Format (has 'mapping')
      if (item && typeof item === 'object' && item.mapping) {
        const title = item.title || 'Untitled Conversation';
        const rawTime = item.create_time ? item.create_time * 1000 : Date.now();
        const createdAt = new Date(rawTime).toISOString();

        const messages: { role: 'user' | 'assistant' | 'system'; content: string; timestamp: string }[] = [];
        const mapping = item.mapping;

        // Traverse mapping nodes
        const nodes = Object.values(mapping) as any[];
        
        // Filter nodes with real messages
        const validNodes = nodes
          .filter(n => n && n.message && n.message.content)
          .sort((a, b) => {
            const timeA = a.message.create_time || 0;
            const timeB = b.message.create_time || 0;
            return timeA - timeB;
          });

        for (const n of validNodes) {
          const msg = n.message;
          const authorRole = msg.author?.role;
          if (authorRole !== 'user' && authorRole !== 'assistant') continue;

          let text = '';
          if (Array.isArray(msg.content?.parts)) {
            text = msg.content.parts
              .filter((p: any) => typeof p === 'string')
              .join('\n');
          } else if (typeof msg.content?.text === 'string') {
            text = msg.content.text;
          }

          if (text.trim()) {
            const msgTime = msg.create_time ? new Date(msg.create_time * 1000).toISOString() : createdAt;
            messages.push({
              role: authorRole,
              content: text,
              timestamp: msgTime,
            });
          }
        }

        if (messages.length > 0) {
          results.push({
            title,
            createdAt,
            messages,
          });
        }
      } 
      // 1.2 Claude Export Format (has 'chat_messages')
      else if (item && typeof item === 'object' && Array.isArray(item.chat_messages)) {
        const title = item.name || item.title || 'Claude Conversation';
        const createdAt = item.created_at ? new Date(item.created_at).toISOString() : new Date().toISOString();
        const messages: { role: 'user' | 'assistant' | 'system'; content: string; timestamp: string }[] = [];

        for (const cm of item.chat_messages) {
          const role = cm.sender === 'human' ? 'user' : 'assistant';
          const text = cm.text || '';
          if (text.trim()) {
            messages.push({
              role,
              content: text,
              timestamp: cm.created_at ? new Date(cm.created_at).toISOString() : createdAt,
            });
          }
        }

        if (messages.length > 0) {
          results.push({
            title,
            createdAt,
            messages,
          });
        }
      }
      // 1.3 Generic format: { title, messages: [{ role, content }] }
      else if (item && typeof item === 'object' && Array.isArray(item.messages)) {
        const title = item.title || 'Imported Conversation';
        const createdAt = item.createdAt || new Date().toISOString();
        const messages: { role: 'user' | 'assistant' | 'system'; content: string; timestamp: string }[] = [];

        for (const m of item.messages) {
          if (m && m.content) {
            messages.push({
              role: m.role === 'assistant' ? 'assistant' : 'user',
              content: String(m.content),
              timestamp: m.timestamp || createdAt,
            });
          }
        }

        if (messages.length > 0) {
          results.push({
            title,
            createdAt,
            messages,
          });
        }
      }
    }
  }

  return results;
}
