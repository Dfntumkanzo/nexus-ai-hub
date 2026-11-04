import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Columns, 
  RefreshCw, 
  Sparkles, 
  Copy, 
  Check, 
  Flame 
} from 'lucide-react';
import { AIAccount, AIProvider, AccountCredential } from '../types';
import { SUPPORTED_MODELS } from '../lib/constants';
import { executeAICompletion } from '../lib/ai-service';

interface SplitComparisonViewProps {
  activeAccount: AIAccount;
  credentials: Record<AIProvider, AccountCredential | null>;
}

interface ColumnState {
  id: string;
  modelId: string;
  content: string;
  isGenerating: boolean;
  responseTimeMs?: number;
}

export const SplitComparisonView: React.FC<SplitComparisonViewProps> = ({
  activeAccount,
  credentials,
}) => {
  const [prompt, setPrompt] = useState('');
  const [columnsCount, setColumnsCount] = useState<2 | 3>(2);
  const [columns, setColumns] = useState<ColumnState[]>([
    { id: 'col-1', modelId: 'gpt-4o', content: '', isGenerating: false },
    { id: 'col-2', modelId: 'claude-3-7-sonnet', content: '', isGenerating: false },
    { id: 'col-3', modelId: 'gemini-2.5-flash', content: '', isGenerating: false },
  ]);
  const [copiedColId, setCopiedColId] = useState<string | null>(null);

  const activeColumns = columns.slice(0, columnsCount);

  const handleUpdateModel = (colId: string, newModelId: string) => {
    setColumns(prev => prev.map(c => c.id === colId ? { ...c, modelId: newModelId } : c));
  };

  const handleRunBattle = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    setColumns(prev => prev.map(c => ({
      ...c,
      content: '',
      isGenerating: true,
      responseTimeMs: undefined,
    })));

    const promises = activeColumns.map(async (col) => {
      const modelMeta = SUPPORTED_MODELS.find(m => m.id === col.modelId) || SUPPORTED_MODELS[0];
      const cred = credentials[modelMeta.provider];
      const startTime = performance.now();

      try {
        const text = await executeAICompletion({
          messages: [{ id: '1', conversationId: 'battle', role: 'user', content: trimmed, timestamp: new Date().toISOString() }],
          provider: modelMeta.provider,
          model: modelMeta.id,
          credential: cred,
          onChunk: (chunk) => {
            setColumns(prev => prev.map(c => c.id === col.id ? { ...c, content: chunk } : c));
          },
        });

        const duration = Math.round(performance.now() - startTime);
        setColumns(prev => prev.map(c => c.id === col.id ? { ...c, content: text, isGenerating: false, responseTimeMs: duration } : c));
      } catch (err: any) {
        setColumns(prev => prev.map(c => c.id === col.id ? { ...c, content: `Error: ${err.message}`, isGenerating: false } : c));
      }
    });

    await Promise.all(promises);
  };

  const handleCopy = (colId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedColId(colId);
    setTimeout(() => setCopiedColId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-[#0B0F17]">
      <div className="p-4 border-b border-gray-800 bg-[#0E131F]/80 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
            <Columns className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>Split Arena (Multi-Model Battle)</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                SIDE-BY-SIDE
              </span>
            </h2>
            <p className="text-xs text-gray-400">Send 1 unified prompt and watch top AI models compete in real time</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">Layout:</span>
          <div className="flex items-center bg-gray-900 border border-gray-700 rounded-lg p-0.5">
            <button
              onClick={() => setColumnsCount(2)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                columnsCount === 2 ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              2 Models
            </button>
            <button
              onClick={() => setColumnsCount(3)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                columnsCount === 3 ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              3 Models
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-800 overflow-y-auto">
        {activeColumns.map((col) => {
          const modelMeta = SUPPORTED_MODELS.find(m => m.id === col.modelId) || SUPPORTED_MODELS[0];
          return (
            <div key={col.id} className="flex flex-col h-full overflow-hidden bg-[#0B0F17]/60">
              <div className="p-3 border-b border-gray-800/80 bg-gray-950/60 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span 
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: modelMeta.iconColor }}
                  />
                  <select
                    value={col.modelId}
                    onChange={e => handleUpdateModel(col.id, e.target.value)}
                    className="bg-gray-900 border border-gray-700 text-xs text-white rounded-lg px-2.5 py-1 focus:outline-none focus:border-purple-500 font-semibold"
                  >
                    {SUPPORTED_MODELS.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.badge})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  {col.responseTimeMs && (
                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {col.responseTimeMs}ms
                    </span>
                  )}
                  {col.content && (
                    <button
                      onClick={() => handleCopy(col.id, col.content)}
                      className="p-1 text-gray-400 hover:text-white"
                      title="Copy response"
                    >
                      {copiedColId === col.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {col.isGenerating ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-3 text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
                    <span className="text-xs">{modelMeta.name} is formulating response...</span>
                  </div>
                ) : col.content ? (
                  <div className="prose prose-invert prose-xs max-w-none text-xs leading-relaxed text-gray-200">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {col.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-600 space-y-2 p-6">
                    <Sparkles className="w-8 h-8 opacity-40 text-purple-400" />
                    <p className="text-xs">Type a prompt below and click "Run Battle" to generate output from {modelMeta.name}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-gray-800 bg-[#0E131F]/90">
        <div className="max-w-4xl mx-auto flex items-center space-x-3">
          <input
            type="text"
            placeholder="Type one prompt to test against all selected models simultaneously..."
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleRunBattle();
            }}
            className="flex-1 px-4 py-3 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 shadow-inner"
          />
          <button
            onClick={handleRunBattle}
            disabled={!prompt.trim()}
            className="px-5 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30 transition-all flex items-center space-x-2 shrink-0"
          >
            <Flame className="w-4 h-4 text-amber-300" />
            <span>Run Battle</span>
          </button>
        </div>
      </div>
    </div>
  );
};
