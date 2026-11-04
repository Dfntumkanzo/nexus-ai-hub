import React, { useState, useEffect } from 'react';
import { GoogleAccountProfile, SupabaseConfig } from './types';
import { 
  getStoredProfiles, 
  saveProfile, 
  deleteProfile, 
  getActiveProfileId, 
  setActiveProfileId 
} from './lib/storage';
import { getSupabaseConfig, saveSupabaseConfig } from './lib/supabase';
import { Workstation } from './components/Workstation';
import { SupabaseSettingsModal } from './components/SupabaseSettingsModal';

export const App: React.FC = () => {
  const [profiles, setProfiles] = useState<GoogleAccountProfile[]>([]);
  const [activeProfileId, setActiveId] = useState<string>('');
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getSupabaseConfig());
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  useEffect(() => {
    const loadedProfiles = getStoredProfiles();
    setProfiles(loadedProfiles);
    const initialActiveId = getActiveProfileId();
    setActiveId(initialActiveId);

    const handleProfileChange = (e: any) => {
      const newId = e.detail?.profileId;
      if (newId) setActiveId(newId);
    };

    window.addEventListener('nexus:profile-changed', handleProfileChange);
    return () => window.removeEventListener('nexus:profile-changed', handleProfileChange);
  }, []);

  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0] || {
    id: 'account_1',
    email: 'Google Account 1',
    displayName: 'Google Account 1 (Personal)',
    isDefault: true,
    color: '#4285F4',
    createdAt: new Date().toISOString(),
  };

  const handleSelectProfile = (id: string) => {
    setActiveId(id);
    setActiveProfileId(id);
  };

  const handleAddProfile = async (name: string) => {
    const colors = ['#4285F4', '#0F9D58', '#EA4335', '#FBBC05', '#8B5CF6', '#EC4899'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newProfile: GoogleAccountProfile = {
      id: `account_${Date.now()}`,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}`,
      displayName: name,
      isDefault: false,
      color: randomColor,
      createdAt: new Date().toISOString(),
    };

    await saveProfile(newProfile);
    const updated = getStoredProfiles();
    setProfiles(updated);
    handleSelectProfile(newProfile.id);
  };

  const handleDeleteProfile = async (id: string) => {
    await deleteProfile(id);
    const updated = getStoredProfiles();
    setProfiles(updated);
    if (activeProfileId === id && updated.length > 0) {
      handleSelectProfile(updated[0].id);
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#212121]">
      <Workstation
        profiles={profiles}
        activeProfile={activeProfile}
        onSelectProfile={handleSelectProfile}
        onAddProfile={handleAddProfile}
        onDeleteProfile={handleDeleteProfile}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        isSupabaseConnected={supabaseConfig.isConnected}
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
