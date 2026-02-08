import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { setUserGeminiKey } from '../services/geminiService';
import { setUserGitHubToken } from '../services/githubService';

export interface UserApiKeys {
  githubToken?: string;
  geminiKey?: string;
  openaiKey?: string;
  anthropicKey?: string;
  notionKey?: string;
  googleDriveKey?: string;
  awsAccessKey?: string;
  awsSecretKey?: string;
  awsRegion?: string;
  hubspotKey?: string;
  freshdeskKey?: string;
  freshdeskDomain?: string;
  bitwardenClientId?: string;
  bitwardenClientSecret?: string;
  vsaxKey?: string;
  microsoftClientId?: string;
  microsoftClientSecret?: string;
  microsoftTenantId?: string;
  teamsWebhook?: string;
  sharePointSiteUrl?: string;
  powerAppsEnvironment?: string;
}

interface UserSettingsContextType {
  apiKeys: UserApiKeys;
  setApiKey: (service: keyof UserApiKeys, value: string) => void;
  clearApiKey: (service: keyof UserApiKeys) => void;
  clearAllKeys: () => void;
  hasKey: (service: keyof UserApiKeys) => boolean;
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'flash-n-frame-user-api-keys';

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const [apiKeys, setApiKeys] = useState<UserApiKeys>({});
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const keys = JSON.parse(stored);
        setApiKeys(keys);
        if (keys.geminiKey) {
          setUserGeminiKey(keys.geminiKey);
        }
        if (keys.githubToken) {
          setUserGitHubToken(keys.githubToken);
        }
      }
    } catch (e) {
      console.error('Failed to load user API keys:', e);
    }
  }, []);

  const saveToStorage = (keys: UserApiKeys) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
    } catch (e) {
      console.error('Failed to save user API keys:', e);
    }
  };

  const setApiKey = (service: keyof UserApiKeys, value: string) => {
    const newKeys = { ...apiKeys, [service]: value };
    setApiKeys(newKeys);
    saveToStorage(newKeys);
    
    if (service === 'geminiKey') {
      setUserGeminiKey(value || null);
    }
    if (service === 'githubToken') {
      setUserGitHubToken(value || null);
    }
  };

  const clearApiKey = (service: keyof UserApiKeys) => {
    const newKeys = { ...apiKeys };
    delete newKeys[service];
    setApiKeys(newKeys);
    saveToStorage(newKeys);

    if (service === 'geminiKey') {
      setUserGeminiKey(null);
    }
    if (service === 'githubToken') {
      setUserGitHubToken(null);
    }
  };

  const clearAllKeys = () => {
    setApiKeys({});
    localStorage.removeItem(STORAGE_KEY);
    setUserGeminiKey(null);
    setUserGitHubToken(null);
  };

  const hasKey = (service: keyof UserApiKeys) => {
    return Boolean(apiKeys[service] && apiKeys[service]!.trim().length > 0);
  };

  const openSettings = () => setIsSettingsOpen(true);
  const closeSettings = () => setIsSettingsOpen(false);

  return (
    <UserSettingsContext.Provider
      value={{
        apiKeys,
        setApiKey,
        clearApiKey,
        clearAllKeys,
        hasKey,
        isSettingsOpen,
        openSettings,
        closeSettings,
      }}
    >
      {children}
    </UserSettingsContext.Provider>
  );
}

export function useUserSettings() {
  const context = useContext(UserSettingsContext);
  if (!context) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider');
  }
  return context;
}
