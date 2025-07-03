import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import StarRating from './StarRating';
import TagInput from './TagInput';
import * as FiIcons from 'react-icons/fi';
import { useSettings } from '../context/SettingsContext';
import LocationService from '../services/LocationService';
import WeatherService from '../services/WeatherService';
import WordPressService from '../services/WordPressService';
import Notification from './Notification';

const { FiUpload, FiCamera, FiImage, FiMapPin, FiSend, FiLoader, FiSettings, FiClock, FiCloudRain } = FiIcons;

const PhotoUploader = () => {
  const { settings } = useSettings();
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [location, setLocation] = useState(null);
  const [weather, setWeather] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [rating, setRating] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleFileSelect = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      showNotification('Selecteer een geldige afbeelding', 'error');
      return;
    }

    setSelectedPhoto(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target.result);
    reader.readAsDataURL(file);

    // Extract location from EXIF or get current location
    setLocationLoading(true);
    try {
      const locationData = await LocationService.getPhotoLocation(file);
      setLocation(locationData);
      
      if (locationData.locationName) {
        showNotification(`📍 ${locationData.locationName}`, 'success');
      } else {
        showNotification('📍 Locatie gevonden', 'success');
      }

      // Get weather for this location
      setWeatherLoading(true);
      try {
        const weatherData = await WeatherService.getCurrentWeather(locationData.latitude, locationData.longitude);
        setWeather(weatherData);
        showNotification(`🌤️ ${weatherData.summary}`, 'info');
      } catch (error) {
        console.error('Weather error:', error);
        showNotification('Kon weer info niet ophalen', 'warning');
      } finally {
        setWeatherLoading(false);
      }
      
    } catch (error) {
      console.error('Location error:', error);
      showNotification('Kon geen locatie bepalen', 'warning');
    } finally {
      setLocationLoading(false);
    }

    // Load WordPress categories if configured
    if (settings.isConfigured) {
      try {
        const wpCategories = await WordPressService.getCategories(settings);
        setCategories(wpCategories);
      } catch (error) {
        console.error('Categories error:', error);
        showNotification('Kon categorieën niet laden', 'warning');
      }
    }
  }, [settings]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!settings.isConfigured) {
      showNotification('Configureer eerst je WordPress instellingen', 'error');
      return;
    }

    if (!selectedPhoto || !title.trim()) {
      showNotification('Selecteer een foto en voer een titel in', 'error');
      return;
    }

    setIsUploading(true);

    try {
      await WordPressService.createPost({
        photo: selectedPhoto,
        title: title.trim(),
        content: content.trim(),
        categories: selectedCategories,
        tags: tags,
        location,
        weather,
        rating
      }, settings);

      showNotification('🎉 Post succesvol gepubliceerd!', 'success');
      
      // Reset form
      setSelectedPhoto(null);
      setPhotoPreview(null);
      setLocation(null);
      setWeather(null);
      setTitle('');
      setContent('');
      setSelectedCategories([]);
      setTags([]);
      setRating(0);
      
    } catch (error) {
      console.error('Upload error:', error);
      showNotification('❌ Er ging iets mis bij het uploaden', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  if (!settings.isConfigured) {
    return (
      <div className="text-center py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 shadow-lg"
        >
          <SafeIcon icon={FiSettings} className="text-6xl text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">WordPress Configuratie Vereist</h2>
          <p className="text-gray-600 mb-6">
            Configureer eerst je WordPress instellingen om foto's te kunnen uploaden.
          </p>
          <motion.a
            href="#/settings"
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <SafeIcon icon={FiSettings} />
            <span>Naar Instellingen</span>
          </motion.a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Notification notification={notification} />
      
      {/* Photo Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Foto Uploaden</h2>
        
        {!selectedPhoto ? (
          <div
            className={`upload-area border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
              dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <SafeIcon icon={FiUpload} className="text-6xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Sleep een foto hierheen</h3>
            <p className="text-gray-500 mb-6">of kies een optie hieronder</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <SafeIcon icon={FiImage} />
                <span>Kies uit Galerij</span>
              </motion.button>
              
              <motion.button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <SafeIcon icon={FiCamera} />
                <span>Maak Foto</span>
              </motion.button>
            </div>
            
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
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={photoPreview}
                alt="Preview"
                className="photo-preview w-full h-64 object-cover rounded-xl"
              />
              <motion.button
                type="button"
                onClick={() => {
                  setSelectedPhoto(null);
                  setPhotoPreview(null);
                  setLocation(null);
                  setWeather(null);
                  setTags([]);
                  setRating(0);
                }}
                className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                ×
              </motion.button>
            </div>
            
            {/* Location & Weather Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Location Display */}
              {locationLoading ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                >
                  <div className="flex items-center space-x-2">
                    <SafeIcon icon={FiClock} className="text-blue-600 animate-pulse" />
                    <span className="font-medium text-blue-800">📍 Locatie bepalen...</span>
                  </div>
                </motion.div>
              ) : location ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 border border-green-200 rounded-lg p-4"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <SafeIcon icon={FiMapPin} className="text-green-600" />
                    <span className="font-medium text-green-800">Locatie</span>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-green-800 font-medium text-sm">
                      📍 {location.locationName || `${location.latitude.toFixed(4)}°, ${location.longitude.toFixed(4)}°`}
                    </p>
                    {location.locationName && (
                      <p className="text-xs text-green-600">
                        🌐 {location.latitude.toFixed(6)}°, {location.longitude.toFixed(6)}°
                      </p>
                    )}
                  </div>
                  
                  <motion.a
                    href={location.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-blue-700 transition-colors mt-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <SafeIcon icon={FiMapPin} className="text-xs" />
                    <span>Kaart</span>
                  </motion.a>
                </motion.div>
              ) : null}

              {/* Weather Display */}
              {weatherLoading ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                >
                  <div className="flex items-center space-x-2">
                    <SafeIcon icon={FiCloudRain} className="text-blue-600 animate-pulse" />
                    <span className="font-medium text-blue-800">🌤️ Weer ophalen...</span>
                  </div>
                </motion.div>
              ) : weather ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <SafeIcon icon={FiCloudRain} className="text-blue-600" />
                    <span className="font-medium text-blue-800">Weer</span>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-blue-800 font-medium text-sm">
                      {weather.icon} {weather.temperature}°C
                    </p>
                    <p className="text-xs text-blue-600">
                      💨 {weather.windSpeed} km/h • 💧 {weather.humidity}%
                    </p>
                    <p className="text-xs text-blue-700 capitalize">
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
          className="bg-white rounded-2xl p-6 shadow-lg space-y-6"
        >
          <h3 className="text-xl font-bold text-gray-800">Post Details</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titel *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Voer een titel in voor je post..."
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Beschrijving
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Beschrijf je foto..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Beoordeling
            </label>
            <StarRating
              rating={rating}
              onRatingChange={setRating}
            />
          </div>

          {/* Tags Input */}
          <TagInput
            tags={tags}
            onTagsChange={setTags}
            placeholder="Voeg tags toe voor specifieke trefwoorden..."
          />
          
          {categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categorieën
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories([...selectedCategories, category.id]);
                        } else {
                          setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                        }
                      }}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{category.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          
          <motion.button
            type="submit"
            disabled={isUploading || !title.trim()}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            whileHover={{ scale: isUploading ? 1 : 1.02 }}
            whileTap={{ scale: isUploading ? 1 : 0.98 }}
          >
            {isUploading ? (
              <>
                <SafeIcon icon={FiLoader} className="animate-spin" />
                <span>Uploaden...</span>
              </>
            ) : (
              <>
                <SafeIcon icon={FiSend} />
                <span>Publiceer Post</span>
              </>
            )}
          </motion.button>
        </motion.form>
      )}
    </div>
  );
};

export default PhotoUploader;