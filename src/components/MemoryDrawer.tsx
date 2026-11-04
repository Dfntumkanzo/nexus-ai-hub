import React, { useState } from 'react';
import { 
  X, 
  Brain, 
  Plus, 
  Trash2, 
  Database, 
  Search, 
  Sparkles, 
  Check, 
  Cpu 
} from 'lucide-react';
import { SharedMemory } from '../types';

interface MemoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  memories: SharedMemory[];
  onAddMemory: (memory: Omit<SharedMemory, 'id' | 'createdAt'>) => Promise<void>;
  onDeleteMemory: (id: string) => Promise<void>;
  isSupabaseConnected: boolean;
}

export const MemoryDrawer: React.FC<MemoryDrawerProps> = ({
  isOpen,
  onClose,
  memories,
  onAddMemory,
  onDeleteMemory,
  isSupabaseConnected,
}) => {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [categoryInput, setCategoryInput] = useState<'preference' | 'fact' | 'project' | 'context'>('preference');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const filteredMemories = memories.filter(m => {
    const matchesSearch = 
      m.key.toLowerCase().includes(search.toLowerCase()) || 
      m.content.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'all' || m.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim() || !contentInput.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddMemory({
        key: keyInput.trim(),
        content: contentInput.trim(),
        category: categoryInput,
      });
      setKeyInput('');
      setContentInput('');
      setIsAdding(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'project':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">Project</span>;
      case 'preference':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">Preference</span>;
      case 'fact':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">Fact</span>;
      default:
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">Context</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-fade-in font-sans">
      <div 
        className="w-full max-w-md bg-[#171717] border-l border-[#2e2e2e] h-full shadow-2xl flex flex-col justify-between"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#262626] bg-[#141414] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Brain className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-semibold text-white">Universal Shared Memory</h2>
                {isSupabaseConnected ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    <Database className="w-2.5 h-2.5" /> Supabase
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                    Local Cache
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#8e8e8e]">Shared across ALL providers & ALL accounts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8e8e8e] hover:text-white hover:bg-[#262626] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-4 py-2.5 bg-purple-950/20 border-b border-purple-900/30 flex items-start gap-2 text-xs text-purple-200/90 shrink-0">
          <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Every memory here is universally shared across <strong>ChatGPT, Claude, Gemini, Grok, Manus, and Suno</strong>. Context learned in one chat is automatically retained by all other chats!
          </p>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-4 pb-2 space-y-3 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#666]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search shared memories..."
                className="w-full bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#555] focus:outline-none focus:border-purple-500"
              />
            </div>
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-medium transition-all shadow-sm shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAdding ? 'Cancel' : 'New'}</span>
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[11px]">
            {['all', 'preference', 'project', 'fact', 'context'].map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2.5 py-1 rounded-lg capitalize transition-colors shrink-0 ${
                  filterCategory === cat
                    ? 'bg-[#2e2e2e] text-white font-medium border border-[#3e3e3e]'
                    : 'text-[#888] hover:text-[#ccc] hover:bg-[#202020]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Add Memory Form */}
        {isAdding && (
          <div className="px-4 py-3 bg-[#1c1c1c] border-y border-[#2a2a2a] shrink-0 animate-fade-in">
            <form onSubmit={handleAddSubmit} className="space-y-2.5">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={keyInput}
                  onChange={e => setKeyInput(e.target.value)}
                  placeholder="Key (e.g. Architecture, Tech Stack, User Tone)"
                  className="flex-1 bg-[#141414] border border-[#333] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-[#555] focus:outline-none focus:border-purple-500"
                  required
                />
                <select
                  value={categoryInput}
                  onChange={e => setCategoryInput(e.target.value as any)}
                  className="bg-[#141414] border border-[#333] rounded-lg px-2 py-1.5 text-xs text-[#ccc] focus:outline-none focus:border-purple-500"
                >
                  <option value="preference">Preference</option>
                  <option value="project">Project</option>
                  <option value="fact">Fact</option>
                  <option value="context">Context</option>
                </select>
              </div>

              <textarea
                value={contentInput}
                onChange={e => setContentInput(e.target.value)}
                placeholder="What should all AI models remember? (e.g. Always write clean TypeScript code with Tailwind CSS)"
                rows={3}
                className="w-full bg-[#141414] border border-[#333] rounded-lg p-2.5 text-xs text-white placeholder-[#555] focus:outline-none focus:border-purple-500 resize-none"
                required
              />

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1 bg-[#262626] hover:bg-[#303030] text-[#aaa] rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium transition-all shadow"
                >
                  {isSubmitting ? 'Saving...' : 'Save to Supabase'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Memories List */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2.5">
          {filteredMemories.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center text-[#666] space-y-2">
              <Brain className="w-8 h-8 opacity-40 text-purple-400" />
              <p className="text-xs">No memories found</p>
              <p className="text-[11px] text-[#555] max-w-xs">
                Add one above or tell any AI in chat: "Remember that..."
              </p>
            </div>
          ) : (
            filteredMemories.map(memory => (
              <div
                key={memory.id}
                className="group p-3 bg-[#1e1e1e] hover:bg-[#232323] border border-[#2b2b2b] rounded-xl transition-all relative space-y-1.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getCategoryBadge(memory.category)}
                    <span className="text-xs font-semibold text-white tracking-tight">{memory.key}</span>
                  </div>
                  <button
                    onClick={() => onDeleteMemory(memory.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#666] hover:text-red-400 transition-opacity"
                    title="Delete Memory"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-[#bbb] leading-relaxed break-words">{memory.content}</p>
                <div className="text-[10px] text-[#666] pt-1 flex items-center justify-between">
                  <span>ID: {memory.id.slice(0, 8)}</span>
                  <span>{new Date(memory.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#262626] bg-[#141414] text-[11px] text-[#777] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-1.5">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>{memories.length} Universal Memories Active</span>
          </div>
          <span className="text-[#555]">Auto-Injected</span>
        </div>
      </div>
    </div>
  );
};
