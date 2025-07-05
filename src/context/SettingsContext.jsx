import React, { createContext, useContext, useState, useEffect } from 'react'

const SettingsContext = createContext()

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    wordpressUrl: '',
    username: '',
    password: '',
    rememberMe: true,
    autoSave: true,
    isConfigured: false
  })

  const [isLoading, setIsLoading] = useState(true)

  // Load settings on component mount
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      
      // Try to load from localStorage first
      const savedSettings = localStorage.getItem('wordpress-settings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        
        // Validate required fields
        const isConfigured = !!(parsed.wordpressUrl && parsed.username && parsed.password)
        
        setSettings({
          ...parsed,
          isConfigured,
          rememberMe: parsed.rememberMe !== false, // Default to true
          autoSave: parsed.autoSave !== false // Default to true
        })
        
        if (isConfigured) {
          console.log('✅ WordPress settings loaded successfully')
        }
      }
    } catch (error) {
      console.error('❌ Error loading settings:', error)
      // Reset to defaults on error
      setSettings({
        wordpressUrl: '',
        username: '',
        password: '',
        rememberMe: true,
        autoSave: true,
        isConfigured: false
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = (newSettings) => {
    try {
      const settingsToSave = {
        ...settings,
        ...newSettings,
        lastUpdated: new Date().toISOString()
      }
      
      // Only save if rememberMe is enabled
      if (settingsToSave.rememberMe) {
        localStorage.setItem('wordpress-settings', JSON.stringify(settingsToSave))
        console.log('💾 Settings saved to localStorage')
      } else {
        // Clear saved settings if rememberMe is disabled
        localStorage.removeItem('wordpress-settings')
        console.log('🗑️ Settings cleared from localStorage (Remember Me disabled)')
      }
      
      return true
    } catch (error) {
      console.error('❌ Error saving settings:', error)
      return false
    }
  }

  const updateSettings = (newSettings) => {
    const updatedSettings = {
      ...settings,
      ...newSettings,
      isConfigured: !!(
        (newSettings.wordpressUrl || settings.wordpressUrl) && 
        (newSettings.username || settings.username) && 
        (newSettings.password || settings.password)
      )
    }
    
    setSettings(updatedSettings)
    
    // Auto-save if enabled
    if (updatedSettings.autoSave && updatedSettings.rememberMe) {
      saveSettings(updatedSettings)
    }
    
    return updatedSettings
  }

  const clearSettings = () => {
    const clearedSettings = {
      wordpressUrl: '',
      username: '',
      password: '',
      rememberMe: true,
      autoSave: true,
      isConfigured: false
    }
    
    setSettings(clearedSettings)
    
    try {
      localStorage.removeItem('wordpress-settings')
      console.log('🗑️ All settings cleared')
    } catch (error) {
      console.error('❌ Error clearing settings:', error)
    }
  }

  const exportSettings = () => {
    try {
      const exportData = {
        wordpressUrl: settings.wordpressUrl,
        username: settings.username,
        // Don't export password for security
        rememberMe: settings.rememberMe,
        autoSave: settings.autoSave,
        exportedAt: new Date().toISOString()
      }
      
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
      
      const exportFileDefaultName = 'wordpress-uploader-settings.json'
      
      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()
      
      return true
    } catch (error) {
      console.error('❌ Error exporting settings:', error)
      return false
    }
  }

  const importSettings = (settingsData) => {
    try {
      const imported = typeof settingsData === 'string' ? JSON.parse(settingsData) : settingsData
      
      // Validate imported data
      if (!imported.wordpressUrl || !imported.username) {
        throw new Error('Invalid settings data')
      }
      
      const newSettings = {
        wordpressUrl: imported.wordpressUrl,
        username: imported.username,
        password: '', // Don't import password for security
        rememberMe: imported.rememberMe !== false,
        autoSave: imported.autoSave !== false,
        isConfigured: false // Will be set to true when password is entered
      }
      
      updateSettings(newSettings)
      return true
    } catch (error) {
      console.error('❌ Error importing settings:', error)
      return false
    }
  }

  const getSettingsStatus = () => {
    return {
      isConfigured: settings.isConfigured,
      hasUrl: !!settings.wordpressUrl,
      hasUsername: !!settings.username,
      hasPassword: !!settings.password,
      rememberMe: settings.rememberMe,
      autoSave: settings.autoSave,
      lastUpdated: settings.lastUpdated
    }
  }

  return (
    <SettingsContext.Provider value={{
      settings,
      isLoading,
      updateSettings,
      clearSettings,
      saveSettings,
      exportSettings,
      importSettings,
      getSettingsStatus,
      loadSettings
    }}>
      {children}
    </SettingsContext.Provider>
  )
}