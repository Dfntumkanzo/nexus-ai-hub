import React, { useState, useEffect } from 'react';
import { GoogleAccountProfile, SupabaseConfig } from './types';
import { 
  getStoredGoogleAccounts, 
  saveGoogleAccount, 
  deleteGoogleAccount, 
  getActiveGoogleAccountId, 
  setActiveGoogleAccountId 
} from './lib/storage';
import { getSupabaseConfig, saveSupabaseConfig } from './lib/supabase';
import { ChatGPTLayout } from './components/ChatGPTLayout';
import { GoogleAccountsModal } from './components/GoogleAccountsModal';
import { SupabaseSettingsModal } from './components/SupabaseSettingsModal';

export const App: React.FC = () => {
  const [accounts, setAccounts] = useState<GoogleAccountProfile[]>([]);
  const [activeAccountId, setActiveId] = useState<string>('');
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getSupabaseConfig());

  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  useEffect(() => {
    const loadedAccounts = getStoredGoogleAccounts();
    setAccounts(loadedAccounts);
    const initialActiveId = getActiveGoogleAccountId();
    setActiveId(initialActiveId);

    const handleAccountChange = (e: any) => {
      const newId = e.detail?.accountId;
      if (newId) setActiveId(newId);
    };

    window.addEventListener('nexus:google-account-changed', handleAccountChange);
    return () => window.removeEventListener('nexus:google-account-changed', handleAccountChange);
  }, []);

  const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0] || {
    id: 'google-acc-personal',
    email: 'personal@gmail.com',
    displayName: 'Personal',
    isDefault: true,
    color: '#4285F4',
    createdAt: new Date().toISOString(),
  };

  const handleSelectAccount = (id: string) => {
    setActiveId(id);
    setActiveGoogleAccountId(id);
  };

  const handleAddAccount = async (account: GoogleAccountProfile) => {
    await saveGoogleAccount(account);
    const updated = getStoredGoogleAccounts();
    setAccounts(updated);
  };

  const handleDeleteAccount = async (id: string) => {
    await deleteGoogleAccount(id);
    const updated = getStoredGoogleAccounts();
    setAccounts(updated);
    if (activeAccountId === id && updated.length > 0) {
      handleSelectAccount(updated[0].id);
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#212121]">
      <ChatGPTLayout
        accounts={accounts}
        activeAccount={activeAccount}
        onSelectAccount={handleSelectAccount}
        onOpenAccountsModal={() => setIsAccountsModalOpen(true)}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        isSupabaseConnected={supabaseConfig.isConnected}
      />

      <GoogleAccountsModal
        isOpen={isAccountsModalOpen}
        onClose={() => setIsAccountsModalOpen(false)}
        accounts={accounts}
        activeAccountId={activeAccountId}
        onSelectAccount={handleSelectAccount}
        onAddAccount={handleAddAccount}
        onDeleteAccount={handleDeleteAccount}
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
