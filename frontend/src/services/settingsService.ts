// Settings and preferences management service

const SETTINGS_KEY = 'carbon_vault_settings';
const THEME_KEY = 'carbon_vault_theme';
const API_KEYS_KEY = 'carbon_vault_api_keys';

export interface UserSettings {
  // Profile
  profile: {
    displayName: string;
    email: string;
    company: string;
    role: string;
    avatar?: string;
  };
  
  // Notifications
  notifications: {
    transactionAlerts: boolean;
    stakingRewards: boolean;
    marketplaceUpdates: boolean;
    complianceReminders: boolean;
    validatorUpdates: boolean;
    priceAlerts: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
    weeklyDigest: boolean;
  };
  
  // Security
  security: {
    twoFactorEnabled: boolean;
    biometricEnabled: boolean;
    sessionTimeout: number; // minutes
    autoLogout: boolean;
    requirePasswordChange: boolean;
    trustedDevices: string[];
  };
  
  // Wallet
  wallet: {
    autoApprove: boolean;
    autoApproveLimit: number; // USD
    defaultSlippage: number; // percentage
    gasPreference: 'low' | 'medium' | 'high';
    showBalanceInUSD: boolean;
    hideSmallBalances: boolean;
  };
  
  // API
  api: {
    enabled: boolean;
    webhookUrl: string;
    rateLimitNotifications: boolean;
  };
  
  // Appearance
  appearance: {
    theme: 'light' | 'dark' | 'system';
    compactMode: boolean;
    showAnimations: boolean;
    fontSize: 'small' | 'medium' | 'large';
    colorScheme: 'default' | 'blue' | 'green' | 'purple';
  };
  
  // Privacy
  privacy: {
    shareAnalytics: boolean;
    showActivity: boolean;
    publicProfile: boolean;
    allowIndexing: boolean;
  };
  
  // Advanced
  advanced: {
    developerMode: boolean;
    showTestnet: boolean;
    customRPC: string;
    debugMode: boolean;
  };
}

export interface APIKey {
  id: string;
  name: string;
  key: string;
  createdAt: number;
  lastUsed?: number;
  permissions: string[];
  active: boolean;
}

// Default settings
export const defaultSettings: UserSettings = {
  profile: {
    displayName: '',
    email: '',
    company: '',
    role: '',
  },
  notifications: {
    transactionAlerts: true,
    stakingRewards: true,
    marketplaceUpdates: false,
    complianceReminders: true,
    validatorUpdates: true,
    priceAlerts: false,
    emailNotifications: true,
    pushNotifications: false,
    weeklyDigest: true,
  },
  security: {
    twoFactorEnabled: false,
    biometricEnabled: false,
    sessionTimeout: 30,
    autoLogout: true,
    requirePasswordChange: false,
    trustedDevices: [],
  },
  wallet: {
    autoApprove: false,
    autoApproveLimit: 100,
    defaultSlippage: 0.5,
    gasPreference: 'medium',
    showBalanceInUSD: true,
    hideSmallBalances: false,
  },
  api: {
    enabled: false,
    webhookUrl: '',
    rateLimitNotifications: true,
  },
  appearance: {
    theme: 'system',
    compactMode: false,
    showAnimations: true,
    fontSize: 'medium',
    colorScheme: 'default',
  },
  privacy: {
    shareAnalytics: true,
    showActivity: true,
    publicProfile: false,
    allowIndexing: false,
  },
  advanced: {
    developerMode: false,
    showTestnet: false,
    customRPC: '',
    debugMode: false,
  },
};

// Get settings from localStorage
export function getSettings(): UserSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure all fields exist
      return {
        ...defaultSettings,
        ...parsed,
        profile: { ...defaultSettings.profile, ...parsed.profile },
        notifications: { ...defaultSettings.notifications, ...parsed.notifications },
        security: { ...defaultSettings.security, ...parsed.security },
        wallet: { ...defaultSettings.wallet, ...parsed.wallet },
        api: { ...defaultSettings.api, ...parsed.api },
        appearance: { ...defaultSettings.appearance, ...parsed.appearance },
        privacy: { ...defaultSettings.privacy, ...parsed.privacy },
        advanced: { ...defaultSettings.advanced, ...parsed.advanced },
      };
    }
    return defaultSettings;
  } catch (error) {
    console.error('Error loading settings:', error);
    return defaultSettings;
  }
}

// Save settings to localStorage
export function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

// Update specific setting section
export function updateSettings(
  section: keyof UserSettings,
  updates: Partial<UserSettings[keyof UserSettings]>
): UserSettings {
  const settings = getSettings();
  settings[section] = { ...settings[section], ...updates } as any;
  saveSettings(settings);
  return settings;
}

// Reset settings to defaults
export function resetSettings(): UserSettings {
  saveSettings(defaultSettings);
  return defaultSettings;
}

// Export all settings as JSON
export function exportSettings(): string {
  const settings = getSettings();
  return JSON.stringify(settings, null, 2);
}

// Import settings from JSON
export function importSettings(jsonString: string): boolean {
  try {
    const settings = JSON.parse(jsonString) as UserSettings;
    // Validate structure
    if (!settings.profile || !settings.notifications) {
      return false;
    }
    saveSettings(settings);
    return true;
  } catch (error) {
    console.error('Error importing settings:', error);
    return false;
  }
}

// Theme management
export function getTheme(): 'light' | 'dark' | 'system' {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return (stored as any) || 'system';
  } catch (error) {
    return 'system';
  }
}

export function setTheme(theme: 'light' | 'dark' | 'system'): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
  } catch (error) {
    console.error('Error setting theme:', error);
  }
}

export function applyTheme(theme: 'light' | 'dark' | 'system'): void {
  const root = document.documentElement;
  
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
}

// API Keys management
export function getAPIKeys(): APIKey[] {
  try {
    const stored = localStorage.getItem(API_KEYS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading API keys:', error);
    return [];
  }
}

export function saveAPIKeys(keys: APIKey[]): void {
  try {
    localStorage.setItem(API_KEYS_KEY, JSON.stringify(keys));
  } catch (error) {
    console.error('Error saving API keys:', error);
  }
}

export function generateAPIKey(name: string, permissions: string[]): APIKey {
  const key: APIKey = {
    id: `key-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    key: `cv_sk_${generateRandomString(32)}`,
    createdAt: Date.now(),
    permissions,
    active: true,
  };
  
  const keys = getAPIKeys();
  keys.push(key);
  saveAPIKeys(keys);
  
  return key;
}

export function revokeAPIKey(keyId: string): boolean {
  const keys = getAPIKeys();
  const key = keys.find(k => k.id === keyId);
  
  if (key) {
    key.active = false;
    saveAPIKeys(keys);
    return true;
  }
  
  return false;
}

export function deleteAPIKey(keyId: string): boolean {
  const keys = getAPIKeys();
  const filtered = keys.filter(k => k.id !== keyId);
  
  if (filtered.length < keys.length) {
    saveAPIKeys(filtered);
    return true;
  }
  
  return false;
}

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Validate email
export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Validate webhook URL
export function validateWebhookURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// Calculate storage usage
export function calculateStorageUsage(): {
  used: number;
  total: number;
  percentage: number;
} {
  let used = 0;
  
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      used += localStorage[key].length + key.length;
    }
  }
  
  const total = 5 * 1024 * 1024; // 5MB typical limit
  const percentage = (used / total) * 100;
  
  return {
    used,
    total,
    percentage,
  };
}

// Clear all app data
export function clearAllData(): void {
  const keysToKeep = [THEME_KEY]; // Keep theme preference
  const allKeys = Object.keys(localStorage);
  
  allKeys.forEach(key => {
    if (key.startsWith('carbon_vault_') && !keysToKeep.includes(key)) {
      localStorage.removeItem(key);
    }
  });
}

// Export all data
export function exportAllData(): string {
  const data: any = {};
  
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key) && key.startsWith('carbon_vault_')) {
      try {
        data[key] = JSON.parse(localStorage[key]);
      } catch {
        data[key] = localStorage[key];
      }
    }
  }
  
  return JSON.stringify(data, null, 2);
}

// Format bytes to human readable
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Get notification count
export function getEnabledNotificationsCount(settings: UserSettings): number {
  const notifications = settings.notifications;
  return Object.values(notifications).filter(v => v === true).length;
}

// Validate session timeout
export function validateSessionTimeout(minutes: number): boolean {
  return minutes >= 5 && minutes <= 1440; // 5 minutes to 24 hours
}

// Get security score
export function calculateSecurityScore(settings: UserSettings): number {
  let score = 0;
  
  if (settings.security.twoFactorEnabled) score += 30;
  if (settings.security.biometricEnabled) score += 20;
  if (settings.security.autoLogout) score += 15;
  if (settings.security.sessionTimeout <= 30) score += 15;
  if (settings.security.trustedDevices.length === 0) score += 10;
  if (!settings.wallet.autoApprove) score += 10;
  
  return Math.min(score, 100);
}

