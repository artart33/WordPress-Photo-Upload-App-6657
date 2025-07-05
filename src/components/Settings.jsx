import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import SafeIcon from '../common/SafeIcon'
import * as FiIcons from 'react-icons/fi'
import { useSettings } from '../context/SettingsContext'
import WordPressService from '../services/WordPressService'
import Notification from './Notification'

const {
  FiSave, FiTrash2, FiEye, FiEyeOff, FiCheck, FiLoader, FiWifi, FiWifiOff, 
  FiSmartphone, FiDownload, FiUpload, FiSettings, FiShield, FiClock, FiToggleLeft, FiToggleRight
} = FiIcons

const Settings = () => {
  const { 
    settings, 
    updateSettings, 
    clearSettings, 
    saveSettings, 
    exportSettings, 
    importSettings, 
    getSettingsStatus,
    isLoading 
  } = useSettings()
  
  const [formData, setFormData] = useState({
    wordpressUrl: settings.wordpressUrl || '',
    username: settings.username || '',
    password: settings.password || '',
    rememberMe: settings.rememberMe !== false,
    autoSave: settings.autoSave !== false
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [notification, setNotification] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState(null)
  const [lastSaved, setLastSaved] = useState(settings.lastUpdated || null)
  
  const fileInputRef = useRef(null)

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const testConnection = async () => {
    if (!formData.wordpressUrl || !formData.username || !formData.password) {
      showNotification('Vul alle velden in om de verbinding te testen', 'error')
      return
    }

    setIsTesting(true)
    setConnectionStatus('testing')

    try {
      const userAgent = navigator.userAgent
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
      
      if (isMobile) {
        showNotification('📱 Mobiele verbinding wordt getest... Dit kan even duren.', 'info')
      } else {
        showNotification('🔄 Verbinding wordt getest...', 'info')
      }

      await WordPressService.testConnection(formData)
      setConnectionStatus('success')
      showNotification('🎉 Verbinding succesvol! Instellingen zijn geldig.', 'success')

      // Auto-save on successful connection if enabled
      if (formData.autoSave && formData.rememberMe) {
        const cleanUrl = formData.wordpressUrl.replace(/\/$/, '')
        const newSettings = { ...formData, wordpressUrl: cleanUrl }
        updateSettings(newSettings)
        setLastSaved(new Date().toISOString())
        showNotification('💾 Instellingen automatisch opgeslagen', 'info')
      }
    } catch (error) {
      console.error('Connection test failed:', error)
      setConnectionStatus('failed')
      
      let errorMessage = error.message || 'Verbinding mislukt.'
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      
      if (isMobile) {
        errorMessage += '\n\n📱 Mobiele tips:\n• Controleer WiFi/mobiele data\n• Probeer een andere browser\n• Zorg dat je WordPress site HTTPS gebruikt'
      }
      
      showNotification(errorMessage, 'error')
    } finally {
      setIsTesting(false)
      setTimeout(() => setConnectionStatus(null), 3000)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    
    if (!formData.wordpressUrl || !formData.username || !formData.password) {
      showNotification('Alle velden zijn verplicht', 'error')
      return
    }

    // Clean URL (remove trailing slash)
    const cleanUrl = formData.wordpressUrl.replace(/\/$/, '')
    const newSettings = { ...formData, wordpressUrl: cleanUrl }
    
    const updated = updateSettings(newSettings)
    
    if (formData.rememberMe) {
      const saved = saveSettings(updated)
      if (saved) {
        setLastSaved(new Date().toISOString())
        showNotification('💾 Instellingen opgeslagen!', 'success')
      } else {
        showNotification('⚠️ Instellingen bijgewerkt maar niet opgeslagen', 'warning')
      }
    } else {
      showNotification('✅ Instellingen bijgewerkt (niet opgeslagen)', 'success')
    }
  }

  const handleClear = () => {
    if (confirm('Weet je zeker dat je alle instellingen wilt wissen?')) {
      clearSettings()
      setFormData({
        wordpressUrl: '',
        username: '',
        password: '',
        rememberMe: true,
        autoSave: true
      })
      setConnectionStatus(null)
      setLastSaved(null)
      showNotification('🗑️ Instellingen gewist', 'info')
    }
  }

  const handleExport = () => {
    const success = exportSettings()
    if (success) {
      showNotification('📥 Instellingen geëxporteerd', 'success')
    } else {
      showNotification('❌ Export mislukt', 'error')
    }
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result)
        const success = importSettings(importedData)
        
        if (success) {
          // Update form data with imported settings
          setFormData(prev => ({
            ...prev,
            wordpressUrl: importedData.wordpressUrl || '',
            username: importedData.username || '',
            password: '', // Don't import password
            rememberMe: importedData.rememberMe !== false,
            autoSave: importedData.autoSave !== false
          }))
          showNotification('📤 Instellingen geïmporteerd (voer wachtwoord opnieuw in)', 'success')
        } else {
          showNotification('❌ Import mislukt - controleer het bestand', 'error')
        }
      } catch (error) {
        showNotification('❌ Ongeldig bestand', 'error')
      }
    }
    reader.readAsText(file)
    
    // Reset file input
    e.target.value = ''
  }

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'testing': return FiLoader
      case 'success': return FiWifi
      case 'failed': return FiWifiOff
      default: return FiCheck
    }
  }

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'testing': return 'text-blue-600'
      case 'success': return 'text-green-600'
      case 'failed': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const formatLastSaved = (timestamp) => {
    if (!timestamp) return null
    const date = new Date(timestamp)
    return date.toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Detect mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <SafeIcon icon={FiLoader} className="text-2xl text-blue-600 animate-spin" />
          <span className="text-lg font-medium text-primary">Instellingen laden...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Notification notification={notification} />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glassmorphism-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-primary">WordPress Instellingen</h2>
            {isMobile && (
              <div className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                <SafeIcon icon={FiSmartphone} className="text-xs" />
                <span>Mobiel</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {connectionStatus && (
              <div className={`flex items-center space-x-2 ${getConnectionColor()}`}>
                <SafeIcon icon={getConnectionIcon()} className={connectionStatus === 'testing' ? 'animate-spin' : ''} />
                <span className="text-sm font-medium">
                  {connectionStatus === 'testing' && 'Testen...'}
                  {connectionStatus === 'success' && 'Verbonden'}
                  {connectionStatus === 'failed' && 'Niet verbonden'}
                </span>
              </div>
            )}
            
            {settings.isConfigured && !connectionStatus && (
              <div className="flex items-center space-x-2 text-green-600">
                <SafeIcon icon={FiCheck} />
                <span className="text-sm font-medium">Geconfigureerd</span>
              </div>
            )}
            
            {lastSaved && (
              <div className="flex items-center space-x-2 text-gray-500">
                <SafeIcon icon={FiClock} className="text-sm" />
                <span className="text-xs">
                  Opgeslagen: {formatLastSaved(lastSaved)}
                </span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block form-label mb-3">
              WordPress Site URL *
            </label>
            <input
              type="url"
              name="wordpressUrl"
              value={formData.wordpressUrl}
              onChange={handleInputChange}
              className="w-full px-4 py-3 form-input"
              placeholder="https://jouwsite.nl"
              required
            />
            <p className="text-xs text-secondary mt-1">
              De volledige URL van je WordPress site (zonder /wp-admin)
            </p>
          </div>

          <div>
            <label className="block form-label mb-3">
              Gebruikersnaam *
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full px-4 py-3 form-input"
              placeholder="Je WordPress gebruikersnaam"
              required
            />
          </div>

          <div>
            <label className="block form-label mb-3">
              Wachtwoord / App Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 pr-12 form-input"
                placeholder="Je WordPress wachtwoord"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary hover:text-primary"
              >
                <SafeIcon icon={showPassword ? FiEyeOff : FiEye} />
              </button>
            </div>
            <p className="text-xs text-secondary mt-1">
              Voor extra beveiliging kun je een Application Password gebruiken
            </p>
          </div>

          {/* Privacy & Storage Settings */}
          <div className="border-t border-white/10 pt-6">
            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center space-x-2">
              <SafeIcon icon={FiShield} />
              <span>Privacy & Opslag</span>
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-primary">
                    Instellingen onthouden
                  </label>
                  <p className="text-xs text-secondary">
                    Sla je instellingen op voor de volgende keer
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, rememberMe: !prev.rememberMe }))}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    formData.rememberMe 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <SafeIcon icon={formData.rememberMe ? FiToggleRight : FiToggleLeft} className="text-lg" />
                  <span className="text-sm font-medium">
                    {formData.rememberMe ? 'Aan' : 'Uit'}
                  </span>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-primary">
                    Automatisch opslaan
                  </label>
                  <p className="text-xs text-secondary">
                    Sla wijzigingen automatisch op bij succesvolle test
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, autoSave: !prev.autoSave }))}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    formData.autoSave 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <SafeIcon icon={formData.autoSave ? FiToggleRight : FiToggleLeft} className="text-lg" />
                  <span className="text-sm font-medium">
                    {formData.autoSave ? 'Aan' : 'Uit'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <motion.button
              type="submit"
              className="flex items-center justify-center space-x-2 btn-primary px-6 py-3 font-medium flex-1"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <SafeIcon icon={FiSave} />
              <span>Opslaan</span>
            </motion.button>

            <motion.button
              type="button"
              onClick={testConnection}
              disabled={isTesting}
              className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors flex-1 ${
                connectionStatus === 'success' 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : connectionStatus === 'failed' 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              } disabled:opacity-50`}
              whileHover={{ scale: isTesting ? 1 : 1.02 }}
              whileTap={{ scale: isTesting ? 1 : 0.98 }}
            >
              {isTesting ? (
                <>
                  <SafeIcon icon={FiLoader} className="animate-spin" />
                  <span>Testen...</span>
                </>
              ) : (
                <>
                  <SafeIcon icon={getConnectionIcon()} />
                  <span>Test Verbinding</span>
                </>
              )}
            </motion.button>
          </div>

          {/* Import/Export & Clear */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/10">
            <motion.button
              type="button"
              onClick={handleExport}
              className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <SafeIcon icon={FiDownload} />
              <span>Exporteren</span>
            </motion.button>

            <motion.button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <SafeIcon icon={FiUpload} />
              <span>Importeren</span>
            </motion.button>

            <motion.button
              type="button"
              onClick={handleClear}
              className="flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <SafeIcon icon={FiTrash2} />
              <span>Wissen</span>
            </motion.button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </form>
      </motion.div>

      {/* Mobile-specific Help Section */}
      {isMobile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-blue-50 border border-blue-200 rounded-2xl p-6"
        >
          <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center space-x-2">
            <SafeIcon icon={FiSmartphone} />
            <span>Mobiele Tips</span>
          </h3>
          <div className="space-y-3 text-sm text-blue-700">
            <div>
              <strong>📱 Verbindingsproblemen?</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Zorg voor een stabiele WiFi of mobiele data verbinding</li>
                <li>Controleer of je WordPress site HTTPS gebruikt</li>
                <li>Probeer een andere browser (Chrome, Firefox, Safari)</li>
                <li>Schakel VPN uit als je er een gebruikt</li>
              </ul>
            </div>
            <div>
              <strong>🔐 WordPress Instellingen:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Zorg dat REST API ingeschakeld is</li>
                <li>Gebruik Application Password voor extra beveiliging</li>
                <li>Controleer of CORS instellingen correct zijn</li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Enhanced Help Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-blue-50 border border-blue-200 rounded-2xl p-6"
      >
        <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center space-x-2">
          <SafeIcon icon={FiSettings} />
          <span>Hulp bij Configuratie</span>
        </h3>
        <div className="space-y-3 text-sm text-blue-700">
          <div>
            <strong>WordPress Site URL:</strong> De hoofdURL van je WordPress site (bijv. https://jouwsite.nl)
          </div>
          <div>
            <strong>Gebruikersnaam:</strong> Je WordPress admin gebruikersnaam
          </div>
          <div>
            <strong>Application Password (aanbevolen):</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1 ml-4">
              <li>Ga naar je WordPress admin → Gebruikers → Profiel</li>
              <li>Scroll naar beneden naar "Application Passwords"</li>
              <li>Geef een naam op (bijv. "Photo Uploader")</li>
              <li>Klik "Add New Application Password"</li>
              <li>Kopieer het gegenereerde wachtwoord en plak het hier</li>
            </ol>
          </div>
          <div>
            <strong>🔒 Privacy & Beveiliging:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li><strong>Instellingen onthouden:</strong> Sla je instellingen lokaal op in je browser</li>
              <li><strong>Automatisch opslaan:</strong> Sla instellingen automatisch op bij succesvolle verbindingstest</li>
              <li><strong>Export/Import:</strong> Maak backups van je instellingen (zonder wachtwoord)</li>
              <li>Alle gegevens worden alleen lokaal opgeslagen, niet op externe servers</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Settings