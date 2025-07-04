import axios from 'axios'

class WordPressService {
  static async testConnection(settings) {
    const { wordpressUrl, username, password } = settings

    try {
      const response = await axios.get(`${wordpressUrl}/wp-json/wp/v2/users/me`, {
        auth: {
          username,
          password
        },
        timeout: 15000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'WordPress-Photo-Uploader/1.0'
        }
      })
      
      return response.data
    } catch (error) {
      console.error('Connection test failed:', error)
      
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        try {
          return await this.testConnectionFallback(settings)
        } catch (fallbackError) {
          console.error('Fallback connection also failed:', fallbackError)
        }
      }
      
      throw new Error(`Connection failed: ${error.response?.status || error.message}`)
    }
  }

  static async testConnectionFallback(settings) {
    const { wordpressUrl, username, password } = settings
    
    try {
      const response = await fetch(`${wordpressUrl}/wp-json/wp/v2/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${username}:${password}`)}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'WordPress-Photo-Uploader/1.0'
        },
        mode: 'cors',
        credentials: 'omit'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Fetch fallback failed:', error)
      throw error
    }
  }

  static async getCategories(settings) {
    const { wordpressUrl, username, password } = settings

    try {
      const response = await axios.get(`${wordpressUrl}/wp-json/wp/v2/categories`, {
        auth: {
          username,
          password
        },
        params: {
          per_page: 100
        },
        timeout: 15000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'WordPress-Photo-Uploader/1.0'
        }
      })
      
      return response.data
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      
      try {
        return await this.getCategoriesFallback(settings)
      } catch (fallbackError) {
        console.error('Categories fallback failed:', fallbackError)
        return []
      }
    }
  }

  static async getCategoriesFallback(settings) {
    const { wordpressUrl, username, password } = settings
    
    try {
      const response = await fetch(`${wordpressUrl}/wp-json/wp/v2/categories?per_page=100`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${username}:${password}`)}`,
          'Accept': 'application/json',
          'User-Agent': 'WordPress-Photo-Uploader/1.0'
        },
        mode: 'cors',
        credentials: 'omit'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Categories fetch fallback failed:', error)
      return []
    }
  }

  static async createTags(tagNames, settings) {
    const { wordpressUrl, username, password } = settings
    const createdTags = []

    for (const tagName of tagNames) {
      try {
        const existingResponse = await axios.get(`${wordpressUrl}/wp-json/wp/v2/tags`, {
          auth: {
            username,
            password
          },
          params: {
            search: tagName
          },
          timeout: 15000,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'WordPress-Photo-Uploader/1.0'
          }
        })

        let tagId
        if (existingResponse.data.length > 0) {
          tagId = existingResponse.data[0].id
        } else {
          const createResponse = await axios.post(`${wordpressUrl}/wp-json/wp/v2/tags`, {
            name: tagName,
            slug: tagName.toLowerCase().replace(/\s+/g, '-')
          }, {
            auth: {
              username,
              password
            },
            timeout: 15000,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'User-Agent': 'WordPress-Photo-Uploader/1.0'
            }
          })
          tagId = createResponse.data.id
        }

        createdTags.push(tagId)
      } catch (error) {
        console.error(`Failed to create/find tag "${tagName}":`, error)
      }
    }

    return createdTags
  }

  static async getPosts(settings, limit = 10) {
    const { wordpressUrl, username, password } = settings

    try {
      const response = await axios.get(`${wordpressUrl}/wp-json/wp/v2/posts`, {
        auth: {
          username,
          password
        },
        params: {
          per_page: limit,
          orderby: 'date',
          order: 'desc'
        },
        timeout: 15000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'WordPress-Photo-Uploader/1.0'
        }
      })
      
      return response.data
    } catch (error) {
      console.error('Failed to fetch posts:', error)
      
      try {
        return await this.getPostsFallback(settings, limit)
      } catch (fallbackError) {
        console.error('Posts fallback failed:', fallbackError)
        throw error
      }
    }
  }

  static async getPostsFallback(settings, limit = 10) {
    const { wordpressUrl, username, password } = settings
    
    try {
      const response = await fetch(`${wordpressUrl}/wp-json/wp/v2/posts?per_page=${limit}&orderby=date&order=desc`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${username}:${password}`)}`,
          'Accept': 'application/json',
          'User-Agent': 'WordPress-Photo-Uploader/1.0'
        },
        mode: 'cors',
        credentials: 'omit'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Posts fetch fallback failed:', error)
      throw error
    }
  }

  static async uploadMedia(file, settings) {
    const { wordpressUrl, username, password } = settings
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post(`${wordpressUrl}/wp-json/wp/v2/media`, formData, {
        auth: {
          username,
          password
        },
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
          'User-Agent': 'WordPress-Photo-Uploader/1.0'
        },
        timeout: 30000,
        maxContentLength: 50000000,
        maxBodyLength: 50000000
      })
      
      return response.data
    } catch (error) {
      console.error('Media upload failed:', error)
      
      try {
        return await this.uploadMediaFallback(file, settings)
      } catch (fallbackError) {
        console.error('Media upload fallback failed:', fallbackError)
        throw error
      }
    }
  }

  static async uploadMediaFallback(file, settings) {
    const { wordpressUrl, username, password } = settings
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${wordpressUrl}/wp-json/wp/v2/media`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${username}:${password}`)}`,
          'Accept': 'application/json',
          'User-Agent': 'WordPress-Photo-Uploader/1.0'
        },
        body: formData,
        mode: 'cors',
        credentials: 'omit'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Media upload fetch fallback failed:', error)
      throw error
    }
  }

  static async createPost(postData, settings) {
    const { photo, title, content, categories, tags, location, weather, rating } = postData
    const { wordpressUrl, username, password } = settings

    try {
      const media = await this.uploadMedia(photo, settings)

      let tagIds = []
      if (tags && tags.length > 0) {
        tagIds = await this.createTags(tags, settings)
      }

      let postContent = content || ''

      if (rating > 0) {
        const stars = '⭐'.repeat(rating)
        const emptyStars = '☆'.repeat(5 - rating)
        postContent += `\n\n📊 **Beoordeling:** ${stars}${emptyStars} (${rating}/5 sterren)`
      }

      if (tags && tags.length > 0) {
        postContent += `\n\n🏷️ **Tags:** ${tags.map(tag => `#${tag}`).join(' ')}`
      }

      if (location) {
        if (location.locationName) {
          postContent += `\n\n📍 **Locatie:** ${location.locationName}`
          postContent += `\n🌐 **Coördinaten:** ${location.latitude.toFixed(6)}°, ${location.longitude.toFixed(6)}°`
          
          if (location.address) {
            postContent += `\n🗺️ **Volledig adres:** ${location.address}`
          }
        } else {
          postContent += `\n\n📍 **Locatie:** ${location.latitude.toFixed(6)}°, ${location.longitude.toFixed(6)}°`
        }
        
        postContent += `\n🗺️ <a href="${location.mapUrl}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">Bekijk locatie op Google Maps</a>`
      }

      if (weather) {
        postContent += `\n\n🌤️ **Weer tijdens foto:** ${weather.icon} ${weather.temperature}°C`
        postContent += `\n🌡️ **Gevoelstemperatuur:** ${weather.feelsLike}°C`
        postContent += `\n💨 **Wind:** ${weather.windSpeed} km/h`
        postContent += `\n💧 **Luchtvochtigheid:** ${weather.humidity}%`
        if (weather.condition) {
          postContent += `\n☁️ **Omstandigheden:** ${weather.condition}`
        }
      }

      const postPayload = {
        title,
        content: postContent,
        status: 'publish',
        featured_media: media.id
      }

      if (categories && categories.length > 0) {
        postPayload.categories = categories
      }

      if (tagIds.length > 0) {
        postPayload.tags = tagIds
      }

      const customFields = {}
      
      if (rating > 0) {
        customFields.rating = rating
      }
      
      if (tags && tags.length > 0) {
        customFields.custom_tags = tags.join(',')
      }
      
      if (location) {
        customFields.location_latitude = location.latitude
        customFields.location_longitude = location.longitude
        customFields.location_map_url = location.mapUrl
        
        if (location.locationName) {
          customFields.location_name = location.locationName
        }
        
        if (location.address) {
          customFields.location_address = location.address
        }
      }

      if (weather) {
        customFields.weather_temperature = weather.temperature
        customFields.weather_feels_like = weather.feelsLike
        customFields.weather_condition = weather.condition
        customFields.weather_icon = weather.icon
        customFields.weather_humidity = weather.humidity
        customFields.weather_wind_speed = weather.windSpeed
        customFields.weather_summary = weather.summary
      }

      if (Object.keys(customFields).length > 0) {
        postPayload.meta = customFields
      }

      const response = await axios.post(`${wordpressUrl}/wp-json/wp/v2/posts`, postPayload, {
        auth: {
          username,
          password
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'WordPress-Photo-Uploader/1.0'
        },
        timeout: 30000
      })
      
      return response.data
    } catch (error) {
      console.error('Post creation failed:', error)
      
      try {
        return await this.createPostFallback(postData, settings)
      } catch (fallbackError) {
        console.error('Post creation fallback failed:', fallbackError)
        throw error
      }
    }
  }

  static async createPostFallback(postData, settings) {
    const { photo, title, content, categories, tags, location, weather, rating } = postData
    const { wordpressUrl, username, password } = settings

    try {
      const media = await this.uploadMediaFallback(photo, settings)

      let postContent = content || ''

      if (rating > 0) {
        const stars = '⭐'.repeat(rating)
        const emptyStars = '☆'.repeat(5 - rating)
        postContent += `\n\n📊 **Beoordeling:** ${stars}${emptyStars} (${rating}/5 sterren)`
      }

      if (tags && tags.length > 0) {
        postContent += `\n\n🏷️ **Tags:** ${tags.map(tag => `#${tag}`).join(' ')}`
      }

      if (location) {
        if (location.locationName) {
          postContent += `\n\n📍 **Locatie:** ${location.locationName}`
          postContent += `\n🌐 **Coördinaten:** ${location.latitude.toFixed(6)}°, ${location.longitude.toFixed(6)}°`
          
          if (location.address) {
            postContent += `\n🗺️ **Volledig adres:** ${location.address}`
          }
        } else {
          postContent += `\n\n📍 **Locatie:** ${location.latitude.toFixed(6)}°, ${location.longitude.toFixed(6)}°`
        }
        
        postContent += `\n🗺️ <a href="${location.mapUrl}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">Bekijk locatie op Google Maps</a>`
      }

      if (weather) {
        postContent += `\n\n🌤️ **Weer tijdens foto:** ${weather.icon} ${weather.temperature}°C`
        postContent += `\n🌡️ **Gevoelstemperatuur:** ${weather.feelsLike}°C`
        postContent += `\n💨 **Wind:** ${weather.windSpeed} km/h`
        postContent += `\n💧 **Luchtvochtigheid:** ${weather.humidity}%`
        if (weather.condition) {
          postContent += `\n☁️ **Omstandigheden:** ${weather.condition}`
        }
      }

      const postPayload = {
        title,
        content: postContent,
        status: 'publish',
        featured_media: media.id
      }

      if (categories && categories.length > 0) {
        postPayload.categories = categories
      }

      const response = await fetch(`${wordpressUrl}/wp-json/wp/v2/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${username}:${password}`)}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'WordPress-Photo-Uploader/1.0'
        },
        body: JSON.stringify(postPayload),
        mode: 'cors',
        credentials: 'omit'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Post creation fetch fallback failed:', error)
      throw error
    }
  }
}

export default WordPressService