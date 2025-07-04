import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useSettings } from '../context/SettingsContext';
import WordPressService from '../services/WordPressService';
import Notification from './Notification';

const { FiSave, FiTrash2, FiEye, FiEyeOff, FiCheck, FiLoader, FiWifi, FiWifiOff, FiSmartphone } = FiIcons;

const Settings = () => {
  const { settings, updateSettings, clearSettings } = useSettings();
  const [formData, setFormData] = useState({
    wordpressUrl: settings.wordpressUrl || '',
    username: settings.username || '',
    password: settings.password || ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const testConnection = async () => {
    if (!formData.wordpressUrl || !formData.username || !formData.password) {
      showNotification('Vul alle velden in om de verbinding te testen', 'error');
      return;
    }

    setIsTesting(true);
    setConnectionStatus('testing');

    try {
      const userAgent = navigator.userAgent;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      
      if (isMobile) {
        showNotification('📱 Mobiele verbinding wordt getest... Dit kan even duren.', 'info');
      } else {
        showNotification('🔄 Verbinding wordt getest...', 'info');
      }

      await WordPressService.testConnection(formData);
      setConnectionStatus('success');
      showNotification('🎉 Verbinding succesvol! Instellingen zijn geldig.', 'success');

      // Auto-save on successful connection
      const cleanUrl = formData.wordpressUrl.replace(/\/$/, '');
      const newSettings = { ...formData, wordpressUrl: cleanUrl };
      updateSettings(newSettings);
      
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('failed');
      
      let errorMessage = error.message || 'Verbinding mislukt.';
      
      // Add mobile-specific advice
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        errorMessage += '\n\n📱 Mobiele tips:\n• Controleer WiFi/mobiele data\n• Probeer een andere browser\n• Zorg dat je WordPress site HTTPS gebruikt';
      }
      
      showNotification(errorMessage, 'error');
    } finally {
      setIsTesting(false);
      setTimeout(() => setConnectionStatus(null), 3000);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!formData.wordpressUrl || !formData.username || !formData.password) {
      showNotification('Alle velden zijn verplicht', 'error');
      return;
    }

    // Clean URL (remove trailing slash)
    const cleanUrl = formData.wordpressUrl.replace(/\/$/, '');
    const newSettings = { ...formData, wordpressUrl: cleanUrl };
    
    updateSettings(newSettings);
    showNotification('Instellingen opgeslagen!', 'success');
  };

  const handleClear = () => {
    if (confirm('Weet je zeker dat je alle instellingen wilt wissen?')) {
      clearSettings();
      setFormData({
        wordpressUrl: '',
        username: '',
        password: ''
      });
      setConnectionStatus(null);
      showNotification('Instellingen gewist', 'info');
    }
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'testing': return FiLoader;
      case 'success': return FiWifi;
      case 'failed': return FiWifiOff;
      default: return FiCheck;
    }
  };

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'testing': return 'text-blue-600';
      case 'success': return 'text-green-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Detect mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  return (
    <div className="space-y-6">
      <Notification notification={notification} />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-gray-800">WordPress Instellingen</h2>
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
                <SafeIcon 
                  icon={getConnectionIcon()} 
                  className={connectionStatus === 'testing' ? 'animate-spin' : ''} 
                />
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
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WordPress Site URL *
            </label>
            <input
              type="url"
              name="wordpressUrl"
              value={formData.wordpressUrl}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="https://jouwsite.nl"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              De volledige URL van je WordPress site (zonder /wp-admin)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gebruikersnaam *
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Je WordPress gebruikersnaam"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wachtwoord / App Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Je WordPress wachtwoord"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <SafeIcon icon={showPassword ? FiEyeOff : FiEye} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Voor extra beveiliging kun je een Application Password gebruiken
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <motion.button
              type="submit"
              className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex-1"
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

            <motion.button
              type="button"
              onClick={handleClear}
              className="flex items-center justify-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <SafeIcon icon={FiTrash2} />
              <span>Wissen</span>
            </motion.button>
          </div>
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

      {/* Help Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-blue-50 border border-blue-200 rounded-2xl p-6"
      >
        <h3 className="text-lg font-bold text-blue-800 mb-4">Hulp bij Configuratie</h3>
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
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;