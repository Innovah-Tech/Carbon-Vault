import { useState, useEffect, useCallback } from 'react';
import {
  UserSettings,
  getSettings,
  saveSettings,
  updateSettings as updateSettingsService,
  resetSettings as resetSettingsService,
  getTheme,
  setTheme as setThemeService,
  getAPIKeys,
  generateAPIKey as generateAPIKeyService,
  revokeAPIKey as revokeAPIKeyService,
  deleteAPIKey as deleteAPIKeyService,
  calculateSecurityScore,
  APIKey,
} from '@/services/settingsService';
import { useToast } from '@/hooks/use-toast';

export function useSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings>(getSettings());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load settings on mount
  useEffect(() => {
    setSettings(getSettings());
  }, []);

  // Update settings
  const updateSettings = useCallback(
    (section: keyof UserSettings, updates: Partial<UserSettings[keyof UserSettings]>) => {
      const newSettings = updateSettingsService(section, updates);
      setSettings(newSettings);
      setHasUnsavedChanges(false);
      
      toast({
        title: 'Settings Updated',
        description: 'Your preferences have been saved successfully.',
      });
      
      return newSettings;
    },
    [toast]
  );

  // Save all settings
  const save = useCallback(() => {
    saveSettings(settings);
    setHasUnsavedChanges(false);
    
    toast({
      title: 'Settings Saved',
      description: 'All changes have been saved.',
    });
  }, [settings, toast]);

  // Reset settings
  const reset = useCallback(() => {
    const defaultSettings = resetSettingsService();
    setSettings(defaultSettings);
    setHasUnsavedChanges(false);
    
    toast({
      title: 'Settings Reset',
      description: 'All settings have been reset to defaults.',
    });
  }, [toast]);

  // Update local state (marks as unsaved)
  const updateLocal = useCallback(
    (section: keyof UserSettings, updates: Partial<UserSettings[keyof UserSettings]>) => {
      setSettings(prev => ({
        ...prev,
        [section]: { ...prev[section], ...updates },
      }));
      setHasUnsavedChanges(true);
    },
    []
  );

  return {
    settings,
    updateSettings,
    updateLocal,
    save,
    reset,
    hasUnsavedChanges,
  };
}

export function useTheme() {
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>(getTheme());

  const setTheme = useCallback((newTheme: 'light' | 'dark' | 'system') => {
    setThemeService(newTheme);
    setThemeState(newTheme);
  }, []);

  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'system') {
        setThemeService('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return {
    theme,
    setTheme,
  };
}

export function useAPIKeys() {
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load API keys
  useEffect(() => {
    setApiKeys(getAPIKeys());
    setIsLoading(false);
  }, []);

  // Generate new API key
  const generateKey = useCallback(
    (name: string, permissions: string[]) => {
      const newKey = generateAPIKeyService(name, permissions);
      setApiKeys(getAPIKeys());
      
      toast({
        title: 'API Key Generated',
        description: `New API key "${name}" has been created.`,
      });
      
      return newKey;
    },
    [toast]
  );

  // Revoke API key
  const revokeKey = useCallback(
    (keyId: string) => {
      const success = revokeAPIKeyService(keyId);
      
      if (success) {
        setApiKeys(getAPIKeys());
        toast({
          title: 'API Key Revoked',
          description: 'The API key has been deactivated.',
        });
      }
      
      return success;
    },
    [toast]
  );

  // Delete API key
  const deleteKey = useCallback(
    (keyId: string) => {
      const success = deleteAPIKeyService(keyId);
      
      if (success) {
        setApiKeys(getAPIKeys());
        toast({
          title: 'API Key Deleted',
          description: 'The API key has been permanently removed.',
        });
      }
      
      return success;
    },
    [toast]
  );

  return {
    apiKeys,
    isLoading,
    generateKey,
    revokeKey,
    deleteKey,
  };
}

export function useSecurityScore() {
  const { settings } = useSettings();
  const [score, setScore] = useState(0);

  useEffect(() => {
    setScore(calculateSecurityScore(settings));
  }, [settings]);

  const getScoreColor = () => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreLabel = () => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Weak';
  };

  return {
    score,
    scoreColor: getScoreColor(),
    scoreLabel: getScoreLabel(),
  };
}

