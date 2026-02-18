import React, { useState } from 'react';
import { X, Key, Eye, EyeOff, Check, AlertCircle, Github, Sparkles, Brain, BookOpen, HardDrive, Cloud, Server, Users, Headphones, Lock, Zap, Monitor, MessageSquare, Share2, Grid, FileText, Loader2 } from 'lucide-react';
import { useUserSettings, UserApiKeys } from '../contexts/UserSettingsContext';
import { validateGeminiKey } from '../services/geminiService';
import { validateGitHubToken } from '../services/githubService';

interface ApiKeyField {
  key: keyof UserApiKeys;
  label: string;
  placeholder: string;
  icon: React.ReactNode;
  helpUrl?: string;
}

interface ApiKeySection {
  title: string;
  fields: ApiKeyField[];
}

const API_KEY_SECTIONS: ApiKeySection[] = [
  {
    title: 'Developer & AI Services',
    fields: [
      {
        key: 'githubToken',
        label: 'GitHub Personal Access Token',
        placeholder: 'ghp_xxxxxxxxxxxxxxxxxxxx',
        icon: <Github className="w-5 h-5" />,
        helpUrl: 'https://github.com/settings/tokens',
      },
      {
        key: 'geminiKey',
        label: 'Google Gemini API Key',
        placeholder: 'AIzaSy...',
        icon: <Sparkles className="w-5 h-5" />,
        helpUrl: 'https://aistudio.google.com/apikey',
      },
      {
        key: 'openaiKey',
        label: 'OpenAI API Key',
        placeholder: 'sk-...',
        icon: <Brain className="w-5 h-5" />,
        helpUrl: 'https://platform.openai.com/api-keys',
      },
      {
        key: 'anthropicKey',
        label: 'Anthropic API Key',
        placeholder: 'sk-ant-...',
        icon: <Brain className="w-5 h-5" />,
        helpUrl: 'https://console.anthropic.com/settings/keys',
      },
    ],
  },
  {
    title: 'Cloud Storage',
    fields: [
      {
        key: 'notionKey',
        label: 'Notion Integration Token',
        placeholder: 'secret_...',
        icon: <BookOpen className="w-5 h-5" />,
        helpUrl: 'https://www.notion.so/my-integrations',
      },
      {
        key: 'googleDriveKey',
        label: 'Google Drive API Key',
        placeholder: 'AIzaSy...',
        icon: <Cloud className="w-5 h-5" />,
        helpUrl: 'https://console.cloud.google.com/apis/credentials',
      },
    ],
  },
  {
    title: 'AWS Services',
    fields: [
      {
        key: 'awsAccessKey',
        label: 'AWS Access Key ID',
        placeholder: 'Enter your AWS Access Key ID',
        icon: <Server className="w-5 h-5" />,
        helpUrl: 'https://console.aws.amazon.com/iam/home#/security_credentials',
      },
      {
        key: 'awsSecretKey',
        label: 'AWS Secret Access Key',
        placeholder: 'Enter your AWS Secret Access Key',
        icon: <Server className="w-5 h-5" />,
      },
      {
        key: 'awsRegion',
        label: 'AWS Region',
        placeholder: 'us-east-1',
        icon: <Server className="w-5 h-5" />,
      },
    ],
  },
  {
    title: 'CRM & Support',
    fields: [
      {
        key: 'hubspotKey',
        label: 'HubSpot Private App Token',
        placeholder: 'pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        icon: <Users className="w-5 h-5" />,
        helpUrl: 'https://developers.hubspot.com/docs/api/private-apps',
      },
      {
        key: 'freshdeskKey',
        label: 'Freshdesk API Key',
        placeholder: 'your-freshdesk-api-key',
        icon: <Headphones className="w-5 h-5" />,
        helpUrl: 'https://support.freshdesk.com/support/solutions/articles/215517-how-to-find-your-api-key',
      },
      {
        key: 'freshdeskDomain',
        label: 'Freshdesk Domain',
        placeholder: 'yourcompany.freshdesk.com',
        icon: <Headphones className="w-5 h-5" />,
      },
    ],
  },
  {
    title: 'Security & Passwords',
    fields: [
      {
        key: 'bitwardenClientId',
        label: 'Bitwarden Client ID',
        placeholder: 'client_id_xxxxxxxx',
        icon: <Lock className="w-5 h-5" />,
        helpUrl: 'https://bitwarden.com/help/personal-api-key/',
      },
      {
        key: 'bitwardenClientSecret',
        label: 'Bitwarden Client Secret',
        placeholder: 'client_secret_xxxxxxxx',
        icon: <Lock className="w-5 h-5" />,
      },
    ],
  },
  {
    title: 'Enterprise Tools',
    fields: [
      {
        key: 'vsaxKey',
        label: 'vsaX API Key',
        placeholder: 'your-vsax-api-key',
        icon: <Zap className="w-5 h-5" />,
      },
    ],
  },
  {
    title: 'Microsoft 365 & Azure',
    fields: [
      {
        key: 'microsoftClientId',
        label: 'Microsoft App Client ID',
        placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        icon: <Monitor className="w-5 h-5" />,
        helpUrl: 'https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade',
      },
      {
        key: 'microsoftClientSecret',
        label: 'Microsoft App Client Secret',
        placeholder: 'your-client-secret',
        icon: <Monitor className="w-5 h-5" />,
      },
      {
        key: 'microsoftTenantId',
        label: 'Microsoft Tenant ID',
        placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        icon: <Monitor className="w-5 h-5" />,
      },
      {
        key: 'teamsWebhook',
        label: 'Microsoft Teams Workflow Webhook URL',
        placeholder: 'https://prod-xx.region.logic.azure.com/workflows/...',
        icon: <MessageSquare className="w-5 h-5" />,
        helpUrl: 'https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook',
      },
      {
        key: 'sharePointSiteUrl',
        label: 'SharePoint Site URL',
        placeholder: 'https://yourcompany.sharepoint.com/sites/yoursite',
        icon: <Share2 className="w-5 h-5" />,
      },
      {
        key: 'powerAppsEnvironment',
        label: 'Power Apps Environment ID',
        placeholder: 'Default-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        icon: <Grid className="w-5 h-5" />,
        helpUrl: 'https://make.powerapps.com/',
      },
    ],
  },
];

export default function UserSettingsModal() {
  const { apiKeys, setApiKey, clearApiKey, isSettingsOpen, closeSettings, hasKey } = useUserSettings();
  const [visibleFields, setVisibleFields] = useState<Set<keyof UserApiKeys>>(new Set());
  const [editValues, setEditValues] = useState<Partial<UserApiKeys>>({});
  const [validating, setValidating] = useState<Set<keyof UserApiKeys>>(new Set());
  const [validationResults, setValidationResults] = useState<Record<string, { valid: boolean; error?: string }>>({});

  if (!isSettingsOpen) return null;

  const toggleVisibility = (key: keyof UserApiKeys) => {
    const newVisible = new Set(visibleFields);
    if (newVisible.has(key)) {
      newVisible.delete(key);
    } else {
      newVisible.add(key);
    }
    setVisibleFields(newVisible);
  };

  const handleChange = (key: keyof UserApiKeys, value: string) => {
    setEditValues({ ...editValues, [key]: value });
    setValidationResults((prev) => { const next = { ...prev }; delete next[key]; return next; });
  };

  const handleSave = async (key: keyof UserApiKeys) => {
    const value = editValues[key];
    if (value !== undefined) {
      if (!value.trim()) {
        clearApiKey(key);
        setEditValues({ ...editValues, [key]: undefined });
        return;
      }

      const trimmed = value.trim();

      if (key === 'geminiKey' || key === 'githubToken') {
        setValidating((prev) => new Set(prev).add(key));
        setValidationResults((prev) => { const next = { ...prev }; delete next[key]; return next; });

        let result: { valid: boolean; error?: string };
        if (key === 'geminiKey') {
          result = await validateGeminiKey(trimmed);
        } else {
          result = await validateGitHubToken(trimmed);
        }

        setValidating((prev) => { const next = new Set(prev); next.delete(key); return next; });
        setValidationResults((prev) => ({ ...prev, [key]: result }));

        if (result.valid) {
          setApiKey(key, trimmed);
          setEditValues({ ...editValues, [key]: undefined });
        }
      } else {
        setApiKey(key, trimmed);
        setEditValues({ ...editValues, [key]: undefined });
      }
    }
  };

  const getValue = (key: keyof UserApiKeys): string => {
    if (editValues[key] !== undefined) {
      return editValues[key] || '';
    }
    return apiKeys[key] || '';
  };

  const isEditing = (key: keyof UserApiKeys): boolean => {
    return editValues[key] !== undefined;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <Key className="w-6 h-6 text-[var(--accent-primary)]" />
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Your API Keys</h2>
          </div>
          <button
            onClick={closeSettings}
            className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[var(--text-secondary)]">
              Your API keys are stored securely in your browser's local storage. They are never sent to our servers and remain private to you.
            </p>
          </div>

          <div className="space-y-6">
            {API_KEY_SECTIONS.map((section) => (
              <div key={section.title}>
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                  {section.title}
                </h3>
                <div className="space-y-3">
                  {section.fields.map((field) => (
                    <div key={field.key} className="p-4 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--accent-primary)]">{field.icon}</span>
                          <label className="font-medium text-[var(--text-primary)]">{field.label}</label>
                          {hasKey(field.key) && (
                            <Check className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        {field.helpUrl && (
                          <a
                            href={field.helpUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[var(--accent-primary)] hover:underline"
                          >
                            Get key
                          </a>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type={visibleFields.has(field.key) ? 'text' : 'password'}
                            value={getValue(field.key)}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 pr-10 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent font-mono text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => toggleVisibility(field.key)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          >
                            {visibleFields.has(field.key) ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        
                        {isEditing(field.key) && (
                          <button
                            onClick={() => handleSave(field.key)}
                            disabled={validating.has(field.key)}
                            className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 flex items-center gap-2"
                          >
                            {validating.has(field.key) ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Checking...
                              </>
                            ) : (
                              'Save'
                            )}
                          </button>
                        )}
                      </div>
                      {validationResults[field.key] && (
                        <div className={`mt-2 text-sm flex items-center gap-2 ${validationResults[field.key].valid ? 'text-green-400' : 'text-red-400'}`}>
                          {validationResults[field.key].valid ? (
                            <Check className="w-4 h-4 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          )}
                          <span>{validationResults[field.key].valid ? (validationResults[field.key].error || 'Key verified and saved successfully!') : validationResults[field.key].error}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)]">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-5 h-5 text-[var(--text-secondary)]" />
              <span className="font-medium text-[var(--text-primary)]">Local File Access</span>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              For local hard drive access, use the file upload buttons in the app. Files are processed locally in your browser.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-[var(--border-color)] flex justify-end">
          <button
            onClick={closeSettings}
            className="px-6 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
