import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Play, 
  CheckCircle2, 
  Clock, 
  Terminal, 
  Globe, 
  Code2, 
  FileText, 
  RefreshCw, 
  Shield, 
  Layers, 
  Check 
} from 'lucide-react';
import { AIAccount, ManusTask, ManusStep } from '../types';
import { getStoredManusTasks, saveManusTask } from '../lib/storage';
import { runManusAgentTask } from '../lib/ai-service';

interface ManusAgentViewProps {
  activeAccount: AIAccount;
}

export const ManusAgentView: React.FC<ManusAgentViewProps> = ({ activeAccount }) => {
  const [tasks, setTasks] = useState<ManusTask[]>([]);
  const [goal, setGoal] = useState('Compare and benchmark pricing, rate limits, and latency between OpenAI o3-mini, Claude 3.7 Sonnet, and Gemini 2.5 Flash');
  const [activeTask, setActiveTask] = useState<ManusTask | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [copiedResult, setCopiedResult] = useState(false);

  useEffect(() => {
    const list = getStoredManusTasks(activeAccount.id);
    setTasks(list);
    if (list.length > 0 && !activeTask) {
      setActiveTask(list[0]);
    }
  }, [activeAccount.id]);

  const handleStartTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim() || isRunning) return;

    setIsRunning(true);

    try {
      const completedTask = await runManusAgentTask(
        goal,
        activeAccount.id,
        (current) => {
          setActiveTask(current);
        }
      );

      await saveManusTask(completedTask);
      setTasks(prev => [completedTask, ...prev]);
    } catch (err) {
      console.error('Failed to run agent task', err);
    } finally {
      setIsRunning(false);
    }
  };

  const getStepIcon = (type: ManusStep['type']) => {
    switch (type) {
      case 'browser': return <Globe className="w-4 h-4 text-cyan-400" />;
      case 'code': return <Code2 className="w-4 h-4 text-emerald-400" />;
      case 'export': return <FileText className="w-4 h-4 text-amber-400" />;
      default: return <Terminal className="w-4 h-4 text-indigo-400" />;
    }
  };

  const handleCopySummary = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedResult(true);
    setTimeout(() => setCopiedResult(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-[#0B0F17]">
      <div className="p-6 border-b border-gray-800 bg-gradient-to-r from-cyan-950/40 via-blue-950/20 to-[#0B0F17]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Bot className="w-7 h-7 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl md:text-2xl font-black text-white">Manus Autonomous Agent</h1>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  AGENTIC ENGINE
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                Autonomous browser navigation, code execution, research compilation and artifact synthesis
              </p>
            </div>
          </div>

          <div className="text-xs text-gray-400 flex items-center space-x-2 bg-gray-900/80 px-3.5 py-2 rounded-xl border border-gray-800">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>Profile: <strong className="text-white">{activeAccount.name}</strong></span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 max-w-6xl mx-auto w-full space-y-6">
        <form onSubmit={handleStartTask} className="p-6 rounded-2xl bg-[#0E131F] border border-gray-800 shadow-xl space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
              Specify Autonomous Agent Goal
            </label>
            <div className="relative">
              <textarea
                rows={2}
                placeholder="Describe an end-to-end task (e.g. Scrape latest AI announcements, summarize benchmarks, output markdown)..."
                value={goal}
                onChange={e => setGoal(e.target.value)}
                className="w-full px-4 py-3 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 shadow-inner resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-[11px] text-gray-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Includes Isolated Chromium Sandbox & Execution Graph</span>
            </div>

            <button
              type="submit"
              disabled={isRunning || !goal.trim()}
              className="py-2.5 px-5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-600/30 transition-all flex items-center space-x-2"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Agent Executing Task...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Launch Manus Agent</span>
                </>
              )}
            </button>
          </div>
        </form>

        {activeTask && (
          <div className="p-6 rounded-2xl bg-[#0E131F] border border-cyan-500/30 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">Current Execution Trace</span>
                <h3 className="text-sm font-bold text-white mt-0.5 line-clamp-1">{activeTask.goal}</h3>
              </div>
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-mono font-bold ${
                activeTask.status === 'completed'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 animate-pulse'
              }`}>
                {activeTask.status.toUpperCase()}
              </span>
            </div>

            <div className="space-y-3">
              {activeTask.steps.map((step, idx) => (
                <div
                  key={step.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    step.status === 'active'
                      ? 'bg-cyan-950/30 border-cyan-500/60 ring-1 ring-cyan-500/30'
                      : step.status === 'completed'
                      ? 'bg-gray-900/60 border-gray-800'
                      : 'bg-gray-950/40 border-gray-900 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-gray-800/80">
                        {getStepIcon(step.type)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-white">Step {idx + 1}: {step.title}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-gray-800 text-gray-400 uppercase">
                            {step.type}
                          </span>
                        </div>
                        {step.details && (
                          <p className="text-[11px] text-gray-400 mt-0.5">{step.details}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      {step.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : step.status === 'active' ? (
                        <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                      ) : (
                        <Clock className="w-4 h-4 text-gray-600" />
                      )}
                    </div>
                  </div>

                  {step.output && (
                    <div className="mt-2.5 p-2.5 rounded-lg bg-gray-950 border border-gray-800 text-xs font-mono text-cyan-300">
                      → {step.output}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {activeTask.resultSummary && (
              <div className="mt-4 p-4 rounded-xl bg-gray-950 border border-gray-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Deliverable Synthesis</span>
                  </span>
                  <button
                    onClick={() => handleCopySummary(activeTask.resultSummary!)}
                    className="text-xs text-gray-400 hover:text-white flex items-center space-x-1"
                  >
                    {copiedResult ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileText className="w-3.5 h-3.5" />}
                    <span>{copiedResult ? 'Copied' : 'Copy Output'}</span>
                  </button>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed font-sans">
                  {activeTask.resultSummary}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Manus Task Archives ({tasks.length})</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tasks.map(t => (
              <div
                key={t.id}
                onClick={() => setActiveTask(t)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  activeTask?.id === t.id
                    ? 'bg-cyan-950/20 border-cyan-500/50 shadow-md'
                    : 'bg-[#0E131F] border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <h4 className="text-xs font-bold text-white line-clamp-1">{t.goal}</h4>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-gray-800 text-gray-400 uppercase">
                    {t.status}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">{t.resultSummary || 'Running execution trace...'}</p>
                <span className="text-[10px] text-gray-500 font-mono mt-2 block">
                  {new Date(t.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
