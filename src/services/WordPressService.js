import axios from 'axios'

class WordPressService {
  static async testConnection(settings) {
    const { wordpressUrl, username, password } = settings
    
    try {
      const response = await axios.get(`${wordpressUrl}/wp-json/wp/v2/users/me`, {
        auth: { username, password },
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
        auth: { username, password },
        params: { per_page: 100 },
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
          auth: { username, password },
          params: { search: tagName },
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
            auth: { username, password },
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
        auth: { username, password },
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
        auth: { username, password },
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

  static generateInteractiveMap(location) {
    const { latitude, longitude, locationName, address } = location
    
    // Generate a beautiful, interactive map embed
    const mapHtml = `
      <div class="interactive-location-map" style="
        margin: 20px 0;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        overflow: hidden;
        background: #f9fafb;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      ">
        <!-- Map Header -->
        <div style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 16px;
          text-align: center;
        ">
          <h3 style="
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          ">
            📍 ${locationName || 'Foto Locatie'}
          </h3>
          <p style="
            margin: 4px 0 0 0;
            font-size: 14px;
            opacity: 0.9;
          ">
            ${latitude.toFixed(6)}°, ${longitude.toFixed(6)}°
          </p>
        </div>
        
        <!-- Interactive Map -->
        <div style="position: relative; height: 300px; background: #f3f4f6;">
          <iframe
            src="https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}&layer=mapnik&marker=${latitude},${longitude}"
            style="
              width: 100%;
              height: 100%;
              border: none;
              display: block;
            "
            frameborder="0"
            scrolling="no"
            marginheight="0"
            marginwidth="0"
            loading="lazy"
            title="Foto Locatie Kaart"
          ></iframe>
          
          <!-- Fallback for when iframe doesn't load -->
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            z-index: -1;
          ">
            🗺️ Kaart wordt geladen...
          </div>
        </div>
        
        <!-- Map Footer -->
        <div style="
          background: #f9fafb;
          padding: 12px 16px;
          border-top: 1px solid #e5e7eb;
        ">
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;
          ">
            <div style="
              font-size: 12px;
              color: #6b7280;
            ">
              📍 Locatie automatisch bepaald
            </div>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
              <a href="https://maps.google.com/?q=${latitude},${longitude}" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 style="
                   color: #3b82f6;
                   text-decoration: none;
                   font-size: 13px;
                   font-weight: 500;
                   padding: 4px 8px;
                   border-radius: 6px;
                   background: #eff6ff;
                   transition: all 0.2s;
                 "
                 onmouseover="this.style.background='#dbeafe'"
                 onmouseout="this.style.background='#eff6ff'"
              >
                🗺️ Google Maps
              </a>
              <a href="https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=15" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 style="
                   color: #059669;
                   text-decoration: none;
                   font-size: 13px;
                   font-weight: 500;
                   padding: 4px 8px;
                   border-radius: 6px;
                   background: #ecfdf5;
                   transition: all 0.2s;
                 "
                 onmouseover="this.style.background='#d1fae5'"
                 onmouseout="this.style.background='#ecfdf5'"
              >
                🌍 OpenStreetMap
              </a>
            </div>
          </div>
          ${address ? `
            <div style="
              margin-top: 8px;
              font-size: 12px;
              color: #4b5563;
              font-style: italic;
            ">
              📍 ${address}
            </div>
          ` : ''}
        </div>
      </div>
    `
    
    return mapHtml
  }

  static async createPost(postData, settings) {
    const { photo, title, content, categories, tags, location, weather, rating } = postData
    const { wordpressUrl, username, password } = settings
    
    try {
      // Upload media first
      const media = await this.uploadMedia(photo, settings)
      
      // Create tags if needed
      let tagIds = []
      if (tags && tags.length > 0) {
        tagIds = await this.createTags(tags, settings)
      }
      
      // Build post content
      let postContent = content || ''
      
      // Add rating section
      if (rating > 0) {
        const stars = '⭐'.repeat(rating)
        const emptyStars = '☆'.repeat(5 - rating)
        postContent += `\n\n<div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin: 20px 0; border-radius: 8px;">
          <h4 style="margin: 0 0 8px 0; color: #0369a1; font-size: 16px;">📊 Foto Beoordeling</h4>
          <div style="font-size: 18px; margin-bottom: 4px;">${stars}${emptyStars}</div>
          <p style="margin: 0; color: #0369a1; font-weight: 500;">${rating}/5 sterren</p>
        </div>`
      }
      
      // Add interactive map if location is available
      if (location) {
        postContent += '\n\n' + this.generateInteractiveMap(location)
      }
      
      // Add tags section
      if (tags && tags.length > 0) {
        postContent += `\n\n<div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 8px;">
          <h4 style="margin: 0 0 8px 0; color: #92400e; font-size: 16px;">🏷️ Tags</h4>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${tags.map(tag => `
              <span style="
                background: #fbbf24;
                color: #92400e;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 13px;
                font-weight: 500;
                white-space: nowrap;
              ">#${tag}</span>
            `).join('')}
          </div>
        </div>`
      }
      
      // Add weather section
      if (weather) {
        postContent += `\n\n<div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 8px;">
          <h4 style="margin: 0 0 12px 0; color: #047857; font-size: 16px;">🌤️ Weersomstandigheden</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
            <div>
              <strong style="color: #047857;">Temperatuur:</strong><br>
              <span style="font-size: 18px;">${weather.icon} ${weather.temperature}°C</span>
              <small style="color: #065f46; display: block;">(voelt als ${weather.feelsLike}°C)</small>
            </div>
            <div>
              <strong style="color: #047857;">Omstandigheden:</strong><br>
              <span style="text-transform: capitalize;">${weather.condition}</span>
            </div>
            <div>
              <strong style="color: #047857;">Wind & Vochtigheid:</strong><br>
              💨 ${weather.windSpeed} km/h<br>
              💧 ${weather.humidity}%
            </div>
          </div>
        </div>`
      }
      
      // Prepare post payload
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
      
      // Add custom fields for structured data
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
      
      // Create the post
      const response = await axios.post(`${wordpressUrl}/wp-json/wp/v2/posts`, postPayload, {
        auth: { username, password },
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
      // Upload media first
      const media = await this.uploadMediaFallback(photo, settings)
      
      // Build post content (simplified for fallback)
      let postContent = content || ''
      
      // Add rating
      if (rating > 0) {
        const stars = '⭐'.repeat(rating)
        const emptyStars = '☆'.repeat(5 - rating)
        postContent += `\n\n📊 **Beoordeling:** ${stars}${emptyStars} (${rating}/5 sterren)`
      }
      
      // Add tags
      if (tags && tags.length > 0) {
        postContent += `\n\n🏷️ **Tags:** ${tags.map(tag => `#${tag}`).join(' ')}`
      }
      
      // Add location with map
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
        
        // Add map links
        postContent += `\n\n🗺️ **Bekijk op kaart:**`
        postContent += `\n• <a href="${location.mapUrl}" target="_blank" rel="noopener noreferrer">Google Maps</a>`
        postContent += `\n• <a href="https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}&zoom=15" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>`
        
        // Add embedded map
        postContent += '\n\n' + this.generateInteractiveMap(location)
      }
      
      // Add weather
      if (weather) {
        postContent += `\n\n🌤️ **Weer tijdens foto:** ${weather.icon} ${weather.temperature}°C`
        postContent += `\n🌡️ **Gevoelstemperatuur:** ${weather.feelsLike}°C`
        postContent += `\n💨 **Wind:** ${weather.windSpeed} km/h`
        postContent += `\n💧 **Luchtvochtigheid:** ${weather.humidity}%`
        if (weather.condition) {
          postContent += `\n☁️ **Omstandigheden:** ${weather.condition}`
        }
      }
      
      // Prepare post payload
      const postPayload = {
        title,
        content: postContent,
        status: 'publish',
        featured_media: media.id
      }
      
      if (categories && categories.length > 0) {
        postPayload.categories = categories
      }
      
      // Create the post
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