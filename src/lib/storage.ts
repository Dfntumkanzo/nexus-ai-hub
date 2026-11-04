import { GoogleAccountProfile } from '../types';
import { DEFAULT_GOOGLE_PROFILES } from './constants';
import { getSupabaseClient } from './supabase';

const KEYS = {
  PROFILES: 'nexus_google_profiles_v3',
  ACTIVE_PROFILE: 'nexus_active_profile_v3',
  ACTIVE_SERVICE: 'nexus_active_service_v3',
};

export const getStoredProfiles = (): GoogleAccountProfile[] => {
  try {
    const raw = localStorage.getItem(KEYS.PROFILES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to parse profiles from storage', e);
  }

  localStorage.setItem(KEYS.PROFILES, JSON.stringify(DEFAULT_GOOGLE_PROFILES));
  return DEFAULT_GOOGLE_PROFILES;
};

export const saveProfile = async (profile: GoogleAccountProfile): Promise<void> => {
  const current = getStoredProfiles();
  const existingIdx = current.findIndex(p => p.id === profile.id);
  let updated: GoogleAccountProfile[];

  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = profile;
  } else {
    updated = [...current, profile];
  }

  localStorage.setItem(KEYS.PROFILES, JSON.stringify(updated));

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('ai_accounts').upsert({
        name: profile.displayName,
        description: profile.email,
        badge_label: 'GOOGLE',
        avatar_color: profile.color,
        is_default: profile.isDefault,
      });
    } catch (err) {
      console.warn('Supabase sync error (profile):', err);
    }
  }
};

export const deleteProfile = async (id: string): Promise<void> => {
  const current = getStoredProfiles();
  const updated = current.filter(p => p.id !== id);
  localStorage.setItem(KEYS.PROFILES, JSON.stringify(updated));
};

export const getActiveProfileId = (): string => {
  const saved = localStorage.getItem(KEYS.ACTIVE_PROFILE);
  if (saved) return saved;
  const profiles = getStoredProfiles();
  const def = profiles.find(p => p.isDefault) || profiles[0];
  const defId = def ? def.id : 'account_1';
  localStorage.setItem(KEYS.ACTIVE_PROFILE, defId);
  return defId;
};

export const setActiveProfileId = (id: string): void => {
  localStorage.setItem(KEYS.ACTIVE_PROFILE, id);
  window.dispatchEvent(new CustomEvent('nexus:profile-changed', { detail: { profileId: id } }));
};

export const getActiveServiceId = (): string => {
  return localStorage.getItem(KEYS.ACTIVE_SERVICE) || 'chatgpt';
};

export const setActiveServiceId = (serviceId: string): void => {
  localStorage.setItem(KEYS.ACTIVE_SERVICE, serviceId);
  window.dispatchEvent(new CustomEvent('nexus:service-changed', { detail: { serviceId } }));
};
