import React, { useState, useEffect } from 'react';
import { 
  AIAccount, 
  ViewMode, 
  SupabaseConfig, 
  AIProvider, 
  AccountCredential 
} from './types';
import { 
  getStoredAccounts, 
  saveAccount, 
  deleteAccount, 
  getActiveAccountId, 
  setActiveAccountId, 
  getStoredCredentials, 
  saveCredential 
} from './lib/storage';
import { getSupabaseConfig, saveSupabaseConfig } from './lib/supabase';
import { Navbar } from './components/Navbar';
import { ChatView } from './components/ChatView';
import { SplitComparisonView } from './components/SplitComparisonView';
import { AppsLaunchpadView } from './components/AppsLaunchpadView';
import { SunoStudioView } from './components/SunoStudioView';
import { ManusAgentView } from './components/ManusAgentView';
import { AccountSwitcherModal } from './components/AccountSwitcherModal';
import { ApiVaultModal } from './components/ApiVaultModal';
import { SupabaseSettingsModal } from './components/SupabaseSettingsModal';

export const App: React.FC = () => {
  const [accounts, setAccounts] = useState<AIAccount[]>([]);
  const [activeAccountId, setActiveId] = useState<string>('');
  const [activeView, setActiveView] = useState<ViewMode>('chat');
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getSupabaseConfig());

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  const [activeCreds, setActiveCreds] = useState<Record<AIProvider, AccountCredential | null>>({
    openai: null,
    anthropic: null,
    gemini: null,
    grok: null,
    manus: null,
    suno: null,
    deepseek: null,
    custom: null,
  });

  const [credCounts, setCredCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadedAccounts = getStoredAccounts();
    setAccounts(loadedAccounts);
    const initialActiveId = getActiveAccountId();
    setActiveId(initialActiveId);
    refreshCredCounts(loadedAccounts);
    refreshActiveCreds(initialActiveId);

    const handleAccountChange = (e: any) => {
      const newId = e.detail?.accountId;
      if (newId) {
        setActiveId(newId);
        refreshActiveCreds(newId);
      }
    };

    window.addEventListener('nexus:account-changed', handleAccountChange);
    return () => window.removeEventListener('nexus:account-changed', handleAccountChange);
  }, []);

  const refreshActiveCreds = (accId: string) => {
    const creds = getStoredCredentials(accId);
    setActiveCreds(creds);
  };

  const refreshCredCounts = (accList: AIAccount[]) => {
    const counts: Record<string, number> = {};
    accList.forEach(acc => {
      const c = getStoredCredentials(acc.id);
      counts[acc.id] = Object.values(c).filter(item => Boolean(item?.apiKey)).length;
    });
    setCredCounts(counts);
  };

  const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0] || {
    id: 'acc-personal',
    name: 'Personal Pro Workspace',
    description: 'Primary personal subscription for ChatGPT Plus, Claude & Suno',
    badgeLabel: 'PERSONAL',
    avatarColor: '#3B82F6',
    iconName: 'Sparkles',
    isDefault: true,
    createdAt: new Date().toISOString(),
  };

  const handleSelectAccount = (id: string) => {
    setActiveId(id);
    setActiveAccountId(id);
    refreshActiveCreds(id);
  };

  const handleSaveAccount = async (account: AIAccount) => {
    await saveAccount(account);
    const updated = getStoredAccounts();
    setAccounts(updated);
    refreshCredCounts(updated);
  };

  const handleDeleteAccount = async (id: string) => {
    await deleteAccount(id);
    const updated = getStoredAccounts();
    setAccounts(updated);
    if (activeAccountId === id && updated.length > 0) {
      handleSelectAccount(updated[0].id);
    }
    refreshCredCounts(updated);
  };

  const handleSaveCredential = async (cred: AccountCredential) => {
    await saveCredential(cred);
    refreshActiveCreds(cred.accountId);
    refreshCredCounts(accounts);
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col overflow-hidden font-sans">
      <Navbar
        accounts={accounts}
        activeAccount={activeAccount}
        onSelectAccount={handleSelectAccount}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
        onOpenVaultModal={() => setIsVaultModalOpen(true)}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        activeView={activeView}
        onSelectView={setActiveView}
        supabaseConfig={supabaseConfig}
        credentialCounts={credCounts}
      />

      <div className="flex-1 flex overflow-hidden">
        {activeView === 'chat' && (
          <ChatView
            activeAccount={activeAccount}
            credentials={activeCreds}
            onOpenVault={() => setIsVaultModalOpen(true)}
            onOpenSplitArena={() => setActiveView('split')}
          />
        )}

        {activeView === 'split' && (
          <SplitComparisonView
            activeAccount={activeAccount}
            credentials={activeCreds}
          />
        )}

        {activeView === 'launchpad' && (
          <AppsLaunchpadView
            activeAccount={activeAccount}
            onOpenModelChat={(modelId) => {
              setActiveView('chat');
            }}
          />
        )}

        {activeView === 'suno' && (
          <SunoStudioView
            activeAccount={activeAccount}
          />
        )}

        {activeView === 'manus' && (
          <ManusAgentView
            activeAccount={activeAccount}
          />
        )}
      </div>

      <AccountSwitcherModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        accounts={accounts}
        activeAccountId={activeAccountId}
        onSelectAccount={handleSelectAccount}
        onSaveAccount={handleSaveAccount}
        onDeleteAccount={handleDeleteAccount}
        credentialCounts={credCounts}
      />

      <ApiVaultModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
        activeAccount={activeAccount}
        credentials={activeCreds}
        onSaveCredential={handleSaveCredential}
      />

      <SupabaseSettingsModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        config={supabaseConfig}
        onUpdateConfig={setSupabaseConfig}
      />
    </div>
  );
};

export default App;
