import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileCode, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  MessageSquare, 
  ArrowRight,
  Loader2,
  LogIn
} from 'lucide-react';
import { ProviderAccount, AIProvider } from '../types';
import { parseChatExport, ParsedChat } from '../lib/importers';

interface ImportChatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: ProviderAccount[];
  selectedAccountId?: string;
  onImportChats: (
    accountId: string,
    provider: AIProvider,
    chats: ParsedChat[]
  ) => Promise<{ conversationCount: number; messageCount: number }>;
  onGoogleSignIn: () => Promise<void>;
}

export const ImportChatsModal: React.FC<ImportChatsModalProps> = ({
  isOpen,
  onClose,
  accounts,
  selectedAccountId,
  onImportChats,
  onGoogleSignIn,
}) => {
  const [targetAccountId, setTargetAccountId] = useState<string>(
    selectedAccountId || accounts[0]?.id || ''
  );
  const [parsedChats, setParsedChats] = useState<ParsedChat[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<{ convs: number; msgs: number } | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleStatusNote, setGoogleStatusNote] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const currentAccount = accounts.find(a => a.id === targetAccountId) || accounts[0];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setFileName(file.name);
    setErrorMessage(null);
    setSuccessCount(null);
    setIsParsing(true);

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const text = event.target?.result as string;
        const chats = parseChatExport(text, currentAccount?.provider || 'openai');
        if (chats.length === 0) {
          setErrorMessage('No conversations found in this file. Make sure it is an export from ChatGPT (conversations.json) or Claude.');
        } else {
          setParsedChats(chats);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to parse JSON file.');
      } finally {
        setIsParsing(false);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read file from disk.');
      setIsParsing(false);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (parsedChats.length === 0 || !targetAccountId) return;
    setIsImporting(true);
    setErrorMessage(null);
    try {
      const res = await onImportChats(
        targetAccountId,
        currentAccount?.provider || 'openai',
        parsedChats
      );
      setSuccessCount({ convs: res.conversationCount, msgs: res.messageCount });
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving chats into database.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleLoadDemoHistory = () => {
    const demoChats: ParsedChat[] = [
      {
        title: 'Project Architecture & Memory Specs',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        messages: [
          {
            role: 'user',
            content: 'How can we unite multiple Google accounts and AI models into a single persistent memory workspace?',
            timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
          },
          {
            role: 'assistant',
            content: 'By establishing a unified memory layer connected via Supabase. Every account retains independent identity, while shared instructions and project context flow seamlessly across ChatGPT, Claude, and Gemini.',
            timestamp: new Date(Date.now() - 86400000 * 3 + 4000).toISOString(),
          },
        ],
      },
      {
        title: 'Fullstack Next.js & Supabase Auth Audit',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        messages: [
          {
            role: 'user',
            content: 'Check our Google OAuth configuration for multi-account profile linking.',
            timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
          },
          {
            role: 'assistant',
            content: 'Google OAuth callback URL is set to your origin. Each authenticated Google token assigns a profile that connects to all active AI providers with zero logouts required.',
            timestamp: new Date(Date.now() - 86400000 * 2 + 6000).toISOString(),
          },
        ],
      },
      {
        title: 'Python Script for Automated Backups',
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        messages: [
          {
            role: 'user',
            content: 'Write a quick python script to dump all chat history to JSON.',
            timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
          },
          {
            role: 'assistant',
            content: '```python\nimport json, requests\n\ndef export_all_conversations(api_url, key):\n    headers = {"apikey": key, "Authorization": f"Bearer {key}"}\n    resp = requests.get(f"{api_url}/rest/v1/conversations?select=*", headers=headers)\n    with open("chats_backup.json", "w") as f:\n        json.dump(resp.json(), f, indent=2)\n    print("Export complete!")\n```',
            timestamp: new Date(Date.now() - 86400000 * 1 + 3000).toISOString(),
          },
        ],
      },
    ];

    setFileName('Demo_Real_History_Export.json');
    setParsedChats(demoChats);
    setErrorMessage(null);
  };

  const handleTriggerGoogleAuth = async () => {
    setIsGoogleLoading(true);
    setGoogleStatusNote(null);
    try {
      await onGoogleSignIn();
      setGoogleStatusNote('Redirecting to Google Sign-In...');
    } catch (err: any) {
      setGoogleStatusNote(err.message || 'Google OAuth prompt error.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-[#171717] border border-[#333] rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 text-neutral-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <UploadCloud className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Google Accounts & Chat History Importer
              </h2>
              <p className="text-xs text-[#888]">
                Sign in with Google or load all past chats from your existing AI accounts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#777] hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Real Google Sign-In */}
        <div className="bg-[#1f1f1f] border border-[#2d2d2d] rounded-xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span className="text-xs font-semibold text-white">Google OAuth Authentication</span>
            </div>
            <span className="text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full font-medium">
              Live Supabase Auth
            </span>
          </div>

          <p className="text-[11px] text-[#8e8e8e]">
            Click below to authenticate with your Google account. Your Google profile name, email, and avatar will automatically link as an active account profile.
          </p>

          <div className="flex items-center space-x-3 pt-1">
            <button
              onClick={handleTriggerGoogleAuth}
              disabled={isGoogleLoading}
              className="flex items-center space-x-2 bg-white hover:bg-neutral-100 text-black px-4 py-2 rounded-xl text-xs font-semibold shadow transition-all active:scale-95 disabled:opacity-50"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogIn className="w-3.5 h-3.5" />
              )}
              <span>Sign in with Google</span>
            </button>

            {googleStatusNote && (
              <span className="text-[11px] text-blue-400 animate-pulse">{googleStatusNote}</span>
            )}
          </div>
        </div>

        {/* Section 2: Import Real Chat History */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-white flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-blue-400" />
              <span>Import Chat History File (ChatGPT / Claude)</span>
            </label>
            <button
              type="button"
              onClick={handleLoadDemoHistory}
              className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center space-x-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>Load sample past history</span>
            </button>
          </div>

          {/* Account selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-[#888] shrink-0">Import into account:</span>
            <select
              value={targetAccountId}
              onChange={e => setTargetAccountId(e.target.value)}
              className="flex-1 bg-[#121212] border border-[#333] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.provider.toUpperCase()} — {acc.name} {acc.email ? `(${acc.email})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Dropzone */}
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#3a3a3a] hover:border-blue-500/60 bg-[#141414] hover:bg-[#1a1a1a] rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-10 h-10 rounded-full bg-[#242424] group-hover:bg-blue-600/20 text-[#888] group-hover:text-blue-400 mx-auto flex items-center justify-center transition-colors">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-white">
                {fileName ? fileName : 'Click to select or drag & drop conversations.json'}
              </p>
              <p className="text-[11px] text-[#777] mt-0.5">
                Exported from ChatGPT (Settings ➔ Data Controls ➔ Export) or Claude
              </p>
            </div>
          </div>

          {/* Parsing Spinner */}
          {isParsing && (
            <div className="flex items-center justify-center space-x-2 text-xs text-[#aaa] py-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              <span>Analyzing conversations & messages...</span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl p-3 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Parsed Preview */}
          {parsedChats.length > 0 && (
            <div className="bg-[#1b1b1b] border border-[#2e2e2e] rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-green-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Ready to import {parsedChats.length} conversation{parsedChats.length > 1 ? 's' : ''}
                </span>
                <span className="text-[#888]">
                  {parsedChats.reduce((acc, c) => acc + c.messages.length, 0)} total messages
                </span>
              </div>

              {/* Sample titles preview */}
              <div className="max-h-24 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {parsedChats.slice(0, 5).map((chat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-2 text-[11px] text-[#ccc] bg-[#141414] px-2.5 py-1.5 rounded-lg border border-[#262626]"
                  >
                    <MessageSquare className="w-3 h-3 text-blue-400 shrink-0" />
                    <span className="truncate flex-1">{chat.title}</span>
                    <span className="text-[#666] shrink-0">{chat.messages.length} msgs</span>
                  </div>
                ))}
                {parsedChats.length > 5 && (
                  <p className="text-[10px] text-[#777] italic text-center">
                    + {parsedChats.length - 5} more conversations
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Success state */}
          {successCount && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-300 text-xs rounded-xl p-3 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                Successfully imported {successCount.convs} conversations ({successCount.msgs} messages) into your account!
              </span>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t border-[#282828] flex items-center justify-between">
          <div className="text-[11px] text-[#777]">
            All imported chats will appear in the sidebar under {currentAccount?.name}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#242424] hover:bg-[#2e2e2e] text-[#aaa] hover:text-white rounded-xl text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteImport}
              disabled={parsedChats.length === 0 || isImporting}
              className="flex items-center space-x-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-[#333] text-white disabled:text-[#666] font-semibold rounded-xl text-xs shadow-md transition-all active:scale-95 disabled:scale-100"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <span>Import to Sidebar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
