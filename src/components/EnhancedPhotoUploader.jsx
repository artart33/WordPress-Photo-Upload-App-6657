import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import SafeIcon from '../common/SafeIcon'
import StarRating from './StarRating'
import TagInput from './TagInput'
import InteractiveMap from './InteractiveMap'
import * as FiIcons from 'react-icons/fi'
import { useSettings } from '../context/SettingsContext'
import EnhancedLocationService from '../services/EnhancedLocationService'
import WeatherService from '../services/WeatherService'
import WordPressService from '../services/WordPressService'
import CapacitorService from '../services/CapacitorService'
import Notification from './Notification'

const { 
  FiUpload, FiCamera, FiImage, FiMapPin, FiSend, FiLoader, FiSettings, 
  FiClock, FiCloudRain, FiShare, FiSmartphone, FiSave, FiCheck, FiNavigation
} = FiIcons

const EnhancedPhotoUploader = () => {
  const { settings, getSettingsStatus } = useSettings()
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [location, setLocation] = useState(null)
  const [weather, setWeather] = useState(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [categories, setCategories] = useState([])
  const [selectedCategories, setSelectedCategories] = useState([])
  const [tags, setTags] = useState([])
  const [rating, setRating] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [notification, setNotification] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [isNativeApp, setIsNativeApp] = useState(false)
  const [permissions, setPermissions] = useState({ camera: false, location: false })
  const [lastPublishedPost, setLastPublishedPost] = useState(null)

  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  useEffect(() => {
    const initializeApp = async () => {
      const isNative = await CapacitorService.isNativeApp()
      setIsNativeApp(isNative)
      
      if (isNative) {
        await CapacitorService.setupStatusBar()
        const perms = await CapacitorService.requestPermissions()
        setPermissions(perms)
        
        if (!perms.camera || !perms.location) {
          showNotification('📱 Sommige permissies zijn niet toegestaan. De app werkt mogelijk beperkt.', 'warning')
        }
      }
    }
    
    initializeApp()
  }, [])

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  const fetchWeatherForLocation = async (locationData) => {
    setWeatherLoading(true)
    try {
      const weatherData = await WeatherService.getCurrentWeather(
        locationData.latitude,
        locationData.longitude
      )
      setWeather(weatherData)
      showNotification(`🌤️ ${weatherData.summary}`, 'info')
    } catch (error) {
      console.error('Weather error:', error)
      showNotification('Kon weer info niet ophalen', 'warning')
      setWeather(null)
    } finally {
      setWeatherLoading(false)
    }
  }

  const handleFileSelect = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      showNotification('Selecteer een geldige afbeelding', 'error')
      return
    }

    setSelectedPhoto(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => setPhotoPreview(e.target.result)
    reader.readAsDataURL(file)

    // Get location with enhanced priority system
    setLocationLoading(true)
    try {
      showNotification('📍 Locatie bepalen...', 'info')
      
      const locationData = await EnhancedLocationService.getPhotoLocation(file)
      setLocation(locationData)
      
      // Show location source information
      const sourceDescription = EnhancedLocationService.getLocationSourceDescription(locationData.source)
      
      if (locationData.locationName) {
        showNotification(`📍 ${locationData.locationName} (${sourceDescription})`, 'success')
      } else {
        showNotification(`📍 Locatie gevonden (${sourceDescription})`, 'success')
      }

      // Get weather for this location
      await fetchWeatherForLocation(locationData)
    } catch (error) {
      console.error('Location error:', error)
      showNotification(`⚠️ ${error.message}`, 'warning')
      setWeather(null)
    } finally {
      setLocationLoading(false)
    }

    // Load WordPress categories if configured
    if (settings.isConfigured) {
      try {
        const wpCategories = await WordPressService.getCategories(settings)
        setCategories(wpCategories)
      } catch (error) {
        console.error('Categories error:', error)
        showNotification('Kon categorieën niet laden', 'warning')
      }
    }
  }, [settings])

  const handleNativeCamera = async () => {
    try {
      if (!permissions.camera) {
        const newPerms = await CapacitorService.requestPermissions()
        setPermissions(newPerms)
        if (!newPerms.camera) {
          showNotification('Camera permissie is vereist', 'error')
          return
        }
      }

      const file = await CapacitorService.takePicture()
      handleFileSelect(file)
    } catch (error) {
      console.error('Native camera error:', error)
      showNotification(error.message || 'Kon geen foto maken', 'error')
    }
  }

  const handleNativeGallery = async () => {
    try {
      const file = await CapacitorService.selectFromGallery()
      handleFileSelect(file)
    } catch (error) {
      console.error('Native gallery error:', error)
      showNotification(error.message || 'Kon geen foto selecteren', 'error')
    }
  }

  const handleLocationChange = async (newLocation) => {
    setLocation(newLocation)
    showNotification(`📍 Locatie aangepast naar ${newLocation.locationName}`, 'success')
    
    // Fetch weather for the new location
    await fetchWeatherForLocation(newLocation)
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    handleFileSelect(file)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleShare = async () => {
    if (!lastPublishedPost) return

    try {
      await CapacitorService.sharePost(lastPublishedPost.link, lastPublishedPost.title.rendered)
      showNotification('🎉 Post gedeeld!', 'success')
    } catch (error) {
      console.error('Share error:', error)
      showNotification(error.message || 'Kon niet delen', 'error')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!settings.isConfigured) {
      showNotification('Configureer eerst je WordPress instellingen', 'error')
      return
    }

    if (!selectedPhoto || !title.trim()) {
      showNotification('Selecteer een foto en voer een titel in', 'error')
      return
    }

    // Check network connectivity for native apps
    if (isNativeApp) {
      const isConnected = await CapacitorService.checkNetworkStatus()
      if (!isConnected) {
        showNotification('❌ Geen internetverbinding', 'error')
        return
      }
    }

    setIsUploading(true)
    try {
      const publishedPost = await WordPressService.createPost({
        photo: selectedPhoto,
        title: title.trim(),
        content: content.trim(),
        categories: selectedCategories,
        tags: tags,
        location,
        weather,
        rating
      }, settings)

      setLastPublishedPost(publishedPost)
      showNotification('🎉 Post succesvol gepubliceerd!', 'success')

      // Reset form
      setSelectedPhoto(null)
      setPhotoPreview(null)
      setLocation(null)
      setWeather(null)
      setTitle('')
      setContent('')
      setSelectedCategories([])
      setTags([])
      setRating(0)
    } catch (error) {
      console.error('Upload error:', error)
      showNotification('❌ Er ging iets mis bij het uploaden', 'error')
    } finally {
      setIsUploading(false)
    }
  }

  const settingsStatus = getSettingsStatus()

  if (!settings.isConfigured) {
    return (
      <div className="text-center py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glassmorphism-card p-8 animate-fade-in-up"
        >
          <SafeIcon icon={FiSettings} className="text-6xl text-purple-400 mx-auto mb-4 upload-icon-glow" />
          <h2 className="text-2xl font-bold text-primary heading-secondary mb-2">
            WordPress Configuratie Vereist
          </h2>
          <p className="text-secondary mb-6">
            Configureer eerst je WordPress instellingen om foto's te kunnen uploaden.
          </p>
          
          {/* Settings Status */}
          <div className="mb-6 p-4 bg-white/10 rounded-lg">
            <h3 className="text-sm font-semibold text-primary mb-3">Configuratie Status:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-secondary">WordPress URL:</span>
                <SafeIcon icon={settingsStatus.hasUrl ? FiCheck : FiSettings} 
                         className={settingsStatus.hasUrl ? 'text-green-400' : 'text-gray-400'} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-secondary">Gebruikersnaam:</span>
                <SafeIcon icon={settingsStatus.hasUsername ? FiCheck : FiSettings} 
                         className={settingsStatus.hasUsername ? 'text-green-400' : 'text-gray-400'} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-secondary">Wachtwoord:</span>
                <SafeIcon icon={settingsStatus.hasPassword ? FiCheck : FiSettings} 
                         className={settingsStatus.hasPassword ? 'text-green-400' : 'text-gray-400'} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-secondary">Instellingen onthouden:</span>
                <SafeIcon icon={settingsStatus.rememberMe ? FiSave : FiSettings} 
                         className={settingsStatus.rememberMe ? 'text-blue-400' : 'text-gray-400'} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mb-4">
            {isNativeApp && (
              <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                <SafeIcon icon={FiSmartphone} className="text-xs" />
                <span>Native App</span>
              </div>
            )}
            {settingsStatus.lastUpdated && (
              <div className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                <SafeIcon icon={FiClock} className="text-xs" />
                <span>Laatst bijgewerkt</span>
              </div>
            )}
          </div>

          <motion.a
            href="#/settings"
            className="inline-flex items-center space-x-2 btn-primary px-6 py-3 rounded-lg font-medium transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <SafeIcon icon={FiSettings} />
            <span>Naar Instellingen</span>
          </motion.a>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Notification notification={notification} />

      {/* Success message with share button */}
      {lastPublishedPost && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glassmorphism-card p-6 border border-green-300 bg-green-50/10"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <SafeIcon icon={FiSend} className="text-green-400 text-xl" />
              <div>
                <h3 className="font-semibold text-green-100">Post gepubliceerd!</h3>
                <p className="text-sm text-green-200">{lastPublishedPost.title.rendered}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <motion.button
                onClick={handleShare}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <SafeIcon icon={FiShare} />
                <span>Delen</span>
              </motion.button>
              <motion.button
                onClick={() => setLastPublishedPost(null)}
                className="text-green-200 hover:text-green-100 p-2"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                ×
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Photo Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glassmorphism-card p-8 animate-fade-in-up"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-primary heading-primary">
            Foto Uploaden
          </h2>
          {isNativeApp && (
            <div className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              <SafeIcon icon={FiSmartphone} className="text-sm" />
              <span>Native App</span>
            </div>
          )}
        </div>

        {!selectedPhoto ? (
          <div
            className={`upload-area p-12 text-center transition-all duration-300 ${
              dragOver ? 'drag-over' : ''
            }`}
            onDrop={!isNativeApp ? handleDrop : undefined}
            onDragOver={!isNativeApp ? handleDragOver : undefined}
            onDragLeave={!isNativeApp ? handleDragLeave : undefined}
          >
            <SafeIcon icon={FiUpload} className="text-7xl text-purple-400 mx-auto mb-6 upload-icon-glow" />
            <h3 className="text-xl font-semibold text-primary mb-3">
              {isNativeApp ? 'Selecteer een foto' : 'Sleep een foto hierheen'}
            </h3>
            <p className="text-secondary mb-8 text-lg">
              {isNativeApp ? 'Kies een optie hieronder' : 'of kies een optie hieronder'}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                type="button"
                onClick={isNativeApp ? handleNativeGallery : () => fileInputRef.current?.click()}
                className="flex items-center space-x-3 btn-primary px-8 py-4 font-medium hover-lift"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <SafeIcon icon={FiImage} className="text-lg" />
                <span>Kies uit Galerij</span>
              </motion.button>

              <motion.button
                type="button"
                onClick={isNativeApp ? handleNativeCamera : () => cameraInputRef.current?.click()}
                className="flex items-center space-x-3 btn-secondary px-8 py-4 font-medium hover-lift"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <SafeIcon icon={FiCamera} className="text-lg" />
                <span>Maak Foto</span>
              </motion.button>
            </div>

            {!isNativeApp && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative">
              <img
                src={photoPreview}
                alt="Preview"
                className="photo-preview w-full h-64 object-cover"
              />
              <motion.button
                type="button"
                onClick={() => {
                  setSelectedPhoto(null)
                  setPhotoPreview(null)
                  setLocation(null)
                  setWeather(null)
                  setTags([])
                  setRating(0)
                }}
                className="absolute top-4 right-4 bg-red-500 text-white p-3 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                ×
              </motion.button>
            </div>

            {/* Location & Weather Info */}
            <div className="grid grid-cols-1 gap-6">
              {/* Interactive Map */}
              {location && (
                <div className="space-y-2">
                  {/* Location source indicator */}
                  <div className="flex items-center space-x-2 text-sm">
                    <SafeIcon icon={FiNavigation} className="text-blue-400" />
                    <span className="text-secondary">
                      {EnhancedLocationService.getLocationSourceDescription(location.source)}
                    </span>
                    {location.accuracy && (
                      <span className="text-xs text-secondary bg-white/10 px-2 py-1 rounded-full">
                        ±{Math.round(location.accuracy)}m
                      </span>
                    )}
                  </div>
                  <InteractiveMap
                    location={location}
                    onLocationChange={handleLocationChange}
                    className="col-span-1"
                  />
                </div>
              )}

              {/* Loading States */}
              {locationLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glassmorphism-card p-6"
                >
                  <div className="flex items-center space-x-3">
                    <SafeIcon icon={FiClock} className="text-purple-400 animate-pulse text-xl" />
                    <span className="font-medium text-primary">📍 Locatie bepalen...</span>
                  </div>
                  <p className="text-sm text-secondary mt-2">
                    Eerst GPS van apparaat, dan foto EXIF-data
                  </p>
                </motion.div>
              )}

              {/* Weather Display */}
              {weatherLoading ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glassmorphism-card p-6"
                >
                  <div className="flex items-center space-x-3">
                    <SafeIcon icon={FiCloudRain} className="text-blue-400 animate-pulse text-xl" />
                    <span className="font-medium text-primary">🌤️ Weer ophalen...</span>
                  </div>
                </motion.div>
              ) : weather ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glassmorphism-card p-6"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <SafeIcon icon={FiCloudRain} className="text-blue-400 text-xl" />
                    <span className="font-medium text-primary">Weer</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-primary font-medium">
                      {weather.icon} {weather.temperature}°C
                    </p>
                    <p className="text-sm text-secondary">
                      💨 {weather.windSpeed} km/h • 💧 {weather.humidity}%
                    </p>
                    <p className="text-sm text-secondary capitalize">
                      {weather.condition}
                    </p>
                  </div>
                </motion.div>
              ) : null}
            </div>
          </div>
        )}
      </motion.div>

      {/* Post Details Form */}
      {selectedPhoto && (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="glassmorphism-card p-8 space-y-8"
        >
          <h3 className="text-2xl font-bold text-primary heading-secondary">
            Post Details
          </h3>

          <div>
            <label className="block form-label mb-3">
              Titel *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-4 form-input"
              placeholder="Voer een titel in voor je post..."
              required
            />
          </div>

          <div>
            <label className="block form-label mb-3">
              Beschrijving
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full px-4 py-4 form-input"
              placeholder="Beschrijf je foto..."
            />
          </div>

          <div>
            <label className="block form-label mb-4">
              Beoordeling
            </label>
            <StarRating rating={rating} onRatingChange={setRating} />
          </div>

          {/* Tags Input */}
          <TagInput
            tags={tags}
            onTagsChange={setTags}
            placeholder="Voeg tags toe voor specifieke trefwoorden..."
          />

          {categories.length > 0 && (
            <div>
              <label className="block form-label mb-4">
                Categorieën
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center space-x-3 p-3 glassmorphism-card rounded-lg hover:bg-white/10 cursor-pointer transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories([...selectedCategories, category.id])
                        } else {
                          setSelectedCategories(selectedCategories.filter(id => id !== category.id))
                        }
                      }}
                      className="text-purple-600 focus:ring-purple-500 rounded"
                    />
                    <span className="text-sm text-primary">{category.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <motion.button
            type="submit"
            disabled={isUploading || !title.trim()}
            className="w-full flex items-center justify-center space-x-3 btn-primary px-8 py-5 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            whileHover={{ scale: isUploading ? 1 : 1.02 }}
            whileTap={{ scale: isUploading ? 1 : 0.98 }}
          >
            {isUploading ? (
              <>
                <SafeIcon icon={FiLoader} className="animate-spin text-lg" />
                <span>Uploaden...</span>
              </>
            ) : (
              <>
                <SafeIcon icon={FiSend} className="text-lg" />
                <span>Publiceer Post</span>
              </>
            )}
          </motion.button>
        </motion.form>
      )}
    </div>
  )
}

export default EnhancedPhotoUploader