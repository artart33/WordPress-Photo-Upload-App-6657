import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    wordpressUrl: '',
    username: '',
    password: '',
    isConfigured: false
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('wordpress-settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings({
        ...parsed,
        isConfigured: !!(parsed.wordpressUrl && parsed.username && parsed.password)
      });
    }
  }, []);

  const updateSettings = (newSettings) => {
    const updatedSettings = {
      ...settings,
      ...newSettings,
      isConfigured: !!(newSettings.wordpressUrl && newSettings.username && newSettings.password)
    };
    setSettings(updatedSettings);
    localStorage.setItem('wordpress-settings', JSON.stringify(updatedSettings));
  };

  const clearSettings = () => {
    setSettings({
      wordpressUrl: '',
      username: '',
      password: '',
      isConfigured: false
    });
    localStorage.removeItem('wordpress-settings');
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSettings,
      clearSettings
    }}>
      {children}
    </SettingsContext.Provider>
  );
};