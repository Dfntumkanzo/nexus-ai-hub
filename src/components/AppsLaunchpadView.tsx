import React, { useState } from 'react';
import { 
  ExternalLink, 
  Sparkles, 
  ShieldCheck, 
  Search, 
  HelpCircle 
} from 'lucide-react';
import { AI_WEB_APPS } from '../lib/constants';
import { AIAccount } from '../types';

interface AppsLaunchpadViewProps {
  activeAccount: AIAccount;
  onOpenModelChat: (modelId: string) => void;
}

export const AppsLaunchpadView: React.FC<AppsLaunchpadViewProps> = ({
  activeAccount,
  onOpenModelChat,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchFilter, setSearchFilter] = useState('');

  const categories = ['All', 'Chat & Search', 'Agents & Code', 'Media & Music'];

  const filteredApps = AI_WEB_APPS.filter(app => {
    const matchCategory = selectedCategory === 'All' || app.category === selectedCategory;
    const matchSearch = app.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
                        app.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
                        app.provider.toLowerCase().includes(searchFilter.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-y-auto bg-[#0B0F17]">
      <div className="p-6 md:p-8 border-b border-gray-800 bg-gradient-to-b from-[#0E131F] to-[#0B0F17]">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ALL-IN-ONE DIRECTORY
                </span>
                <span className="text-xs text-gray-500">Active Profile: <strong className="text-gray-300">{activeAccount.name}</strong></span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
                AI Ecosystem & Web Portals
              </h1>
              <p className="text-xs md:text-sm text-gray-400 mt-1 max-w-2xl">
                Access every major AI platform in one unified launchpad. Use the embedded hub chat or launch isolated sessions without logging out.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-900/80 border border-gray-800 flex items-center space-x-3 shrink-0">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="text-xs">
                <div className="font-semibold text-white">Multi-Session Isolation</div>
                <div className="text-gray-400 text-[11px]">Separate credentials per account profile</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search AI apps..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 max-w-6xl mx-auto w-full flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApps.map(app => (
            <div
              key={app.id}
              className="p-5 rounded-2xl bg-[#0E131F]/90 border border-gray-800 hover:border-gray-700 hover:shadow-xl hover:shadow-black/50 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-md"
                      style={{ backgroundColor: `${app.iconColor}20`, color: app.iconColor, border: `1.5px solid ${app.iconColor}50` }}
                    >
                      {app.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {app.name}
                      </h3>
                      <span className="text-[11px] text-gray-500">{app.provider}</span>
                    </div>
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-gray-800 text-gray-300 border border-gray-700">
                    {app.badge}
                  </span>
                </div>

                <p className="text-xs text-gray-300 mt-3 font-medium line-clamp-1">{app.tagline}</p>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{app.description}</p>
              </div>

              <div className="pt-5 flex items-center space-x-2">
                <a
                  href={app.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 px-3 bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white rounded-xl text-xs font-semibold border border-gray-700 transition-colors flex items-center justify-center space-x-1.5"
                >
                  <span>Open Web App</span>
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </a>

                {['chatgpt', 'claude', 'gemini', 'grok'].includes(app.id) && (
                  <button
                    onClick={() => onOpenModelChat(app.id)}
                    className="py-2 px-3 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-xl text-xs font-semibold border border-indigo-500/40 transition-colors flex items-center space-x-1"
                    title="Chat via Unified Hub"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Hub Chat</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <h4 className="font-bold text-white">How NexusAI Eliminates Repeated Logins & Logouts</h4>
              <p className="text-gray-300 leading-relaxed max-w-3xl">
                When using official browser websites directly, browser cookies conflict between personal and work accounts. In NexusAI, all chats and generations stream through distinct profile-bound credentials. You can also configure separate Chrome/Firefox Container Profiles for each AI account to keep web sessions isolated.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
