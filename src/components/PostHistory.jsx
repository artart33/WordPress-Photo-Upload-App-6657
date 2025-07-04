import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import SafeIcon from '../common/SafeIcon'
import StarRating from './StarRating'
import * as FiIcons from 'react-icons/fi'
import { useSettings } from '../context/SettingsContext'
import WordPressService from '../services/WordPressService'
import Notification from './Notification'

const { FiClock, FiExternalLink, FiMapPin, FiRefreshCw, FiImage, FiTag } = FiIcons

const PostHistory = () => {
  const { settings } = useSettings()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState(null)

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  const loadPosts = async () => {
    if (!settings.isConfigured) {
      showNotification('Configureer eerst je WordPress instellingen', 'error')
      return
    }

    setLoading(true)
    try {
      const recentPosts = await WordPressService.getPosts(settings)
      setPosts(recentPosts)
    } catch (error) {
      console.error('Failed to load posts:', error)
      showNotification('Kon posts niet laden', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (settings.isConfigured) {
      loadPosts()
    }
  }, [settings.isConfigured])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const extractRatingFromContent = (content) => {
    const ratingMatch = content.match(/\((\d)\/5 sterren\)/)
    return ratingMatch ? parseInt(ratingMatch[1]) : 0
  }

  const extractTagsFromContent = (content) => {
    const tagsMatch = content.match(/🏷️ \*\*Tags:\*\* (.+?)(?:\n|$)/)
    if (tagsMatch) {
      return tagsMatch[1].split(' ').map(tag => tag.replace('#', ''))
    }
    return []
  }

  const extractLocationFromContent = (content) => {
    // Extract location name
    const locationNameMatch = content.match(/📍 \*\*Locatie:\*\* ([^<\n]*)/)
    const locationName = locationNameMatch ? locationNameMatch[1].trim() : null

    // Extract coordinates
    const coordsMatch = content.match(/🌐 \*\*Coördinaten:\*\* ([0-9.-]+)°,([0-9.-]+)°/) || 
                       content.match(/📍 \*\*Locatie:\*\* ([0-9.-]+)°,([0-9.-]+)°/)

    // Extract map URL
    const mapMatch = content.match(/<a href="([^"]*maps[^"]*)"[^>]*>/)
    const mapUrl = mapMatch ? mapMatch[1] : null

    return {
      locationName,
      coordinates: coordsMatch ? {
        lat: coordsMatch[1],
        lon: coordsMatch[2]
      } : null,
      mapUrl
    }
  }

  if (!settings.isConfigured) {
    return (
      <div className="text-center py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 shadow-lg"
        >
          <SafeIcon icon={FiClock} className="text-6xl text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">WordPress Configuratie Vereist</h2>
          <p className="text-gray-600 mb-6">
            Configureer eerst je WordPress instellingen om je post geschiedenis te bekijken.
          </p>
          <motion.a
            href="#/settings"
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <SafeIcon icon={FiClock} />
            <span>Naar Instellingen</span>
          </motion.a>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Notification notification={notification} />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Post Geschiedenis</h2>
          <motion.button
            onClick={loadPosts}
            disabled={loading}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            whileHover={{ scale: loading ? 1 : 1.05 }}
            whileTap={{ scale: loading ? 1 : 0.95 }}
          >
            <SafeIcon icon={FiRefreshCw} className={loading ? 'animate-spin' : ''} />
            <span>Vernieuwen</span>
          </motion.button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <SafeIcon icon={FiRefreshCw} className="text-4xl text-blue-600 animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <SafeIcon icon={FiImage} className="text-6xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Geen Posts Gevonden</h3>
            <p className="text-gray-500">Upload je eerste foto om deze hier te zien verschijnen.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {posts.map((post, index) => {
              const rating = extractRatingFromContent(post.content.rendered)
              const tags = extractTagsFromContent(post.content.rendered)
              const locationData = extractLocationFromContent(post.content.rendered)

              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        {post.title.rendered}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center space-x-1">
                          <SafeIcon icon={FiClock} />
                          <span>{formatDate(post.date)}</span>
                        </div>
                        {post.featured_media && (
                          <div className="flex items-center space-x-1">
                            <SafeIcon icon={FiImage} />
                            <span>Met afbeelding</span>
                          </div>
                        )}
                      </div>

                      {rating > 0 && (
                        <div className="mb-3">
                          <StarRating rating={rating} readonly={true} />
                        </div>
                      )}

                      {/* Tags Display */}
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                            >
                              <SafeIcon icon={FiTag} className="text-xs" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <motion.a
                      href={post.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <SafeIcon icon={FiExternalLink} />
                      <span className="text-sm">Bekijken</span>
                    </motion.a>
                  </div>

                  {post.excerpt.rendered && (
                    <div 
                      className="text-gray-600 text-sm mb-4"
                      dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
                    />
                  )}

                  {(locationData.locationName || locationData.coordinates || locationData.mapUrl) && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <SafeIcon icon={FiMapPin} className="text-green-600" />
                          <div>
                            <span className="text-sm font-medium text-green-800">
                              {locationData.locationName ? locationData.locationName : 'Locatie beschikbaar'}
                            </span>
                            {locationData.coordinates && (
                              <p className="text-xs text-green-600 mt-1">
                                {locationData.coordinates.lat}°, {locationData.coordinates.lon}°
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {locationData.mapUrl && (
                          <motion.a
                            href={locationData.mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <SafeIcon icon={FiMapPin} className="text-xs" />
                            <span>Bekijk op kaart</span>
                          </motion.a>
                        )}
                      </div>
                    </div>
                  )}

                  {post.categories && post.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {post.categories.map((categoryId) => (
                        <span
                          key={categoryId}
                          className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                        >
                          Categorie {categoryId}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default PostHistory