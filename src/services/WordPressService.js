import axios from 'axios';

class WordPressService {
  static async testConnection(settings) {
    const { wordpressUrl, username, password } = settings;

    try {
      const response = await axios.get(`${wordpressUrl}/wp-json/wp/v2/users/me`, {
        auth: {
          username,
          password
        },
        timeout: 10000
      });
      
      return response.data;
    } catch (error) {
      throw new Error(`Connection failed: ${error.response?.status || error.message}`);
    }
  }

  static async getCategories(settings) {
    const { wordpressUrl, username, password } = settings;

    try {
      const response = await axios.get(`${wordpressUrl}/wp-json/wp/v2/categories`, {
        auth: {
          username,
          password
        },
        params: {
          per_page: 100
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      return [];
    }
  }

  static async getPosts(settings, limit = 10) {
    const { wordpressUrl, username, password } = settings;

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
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      throw error;
    }
  }

  static async uploadMedia(file, settings) {
    const { wordpressUrl, username, password } = settings;
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${wordpressUrl}/wp-json/wp/v2/media`, formData, {
        auth: {
          username,
          password
        },
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Media upload failed:', error);
      throw error;
    }
  }

  static async createPost(postData, settings) {
    const { photo, title, content, categories, location, rating } = postData;
    const { wordpressUrl, username, password } = settings;

    try {
      // First upload the image
      const media = await this.uploadMedia(photo, settings);

      // Prepare post content
      let postContent = content || '';

      // Add rating to content if provided
      if (rating > 0) {
        const stars = '⭐'.repeat(rating);
        const emptyStars = '☆'.repeat(5 - rating);
        postContent += `\n\n📊 **Beoordeling:** ${stars}${emptyStars} (${rating}/5 sterren)`;
      }

      // Add location info to content if available
      if (location) {
        if (location.locationName) {
          postContent += `\n\n📍 **Locatie:** ${location.locationName}`;
          postContent += `\n🌐 **Coördinaten:** ${location.latitude.toFixed(6)}°, ${location.longitude.toFixed(6)}°`;
          
          if (location.address) {
            postContent += `\n🗺️ **Volledig adres:** ${location.address}`;
          }
        } else {
          postContent += `\n\n📍 **Locatie:** ${location.latitude.toFixed(6)}°, ${location.longitude.toFixed(6)}°`;
        }
        
        postContent += `\n🗺️ <a href="${location.mapUrl}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">Bekijk locatie op Google Maps</a>`;
      }

      // Create the post
      const postPayload = {
        title,
        content: postContent,
        status: 'publish',
        featured_media: media.id
      };

      // Add categories if selected
      if (categories && categories.length > 0) {
        postPayload.categories = categories;
      }

      // Add custom fields for rating and location
      const customFields = {};
      
      if (rating > 0) {
        customFields.rating = rating;
      }
      
      if (location) {
        customFields.location_latitude = location.latitude;
        customFields.location_longitude = location.longitude;
        customFields.location_map_url = location.mapUrl;
        
        if (location.locationName) {
          customFields.location_name = location.locationName;
        }
        
        if (location.address) {
          customFields.location_address = location.address;
        }
      }

      if (Object.keys(customFields).length > 0) {
        postPayload.meta = customFields;
      }

      const response = await axios.post(`${wordpressUrl}/wp-json/wp/v2/posts`, postPayload, {
        auth: {
          username,
          password
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Post creation failed:', error);
      throw error;
    }
  }
}

export default WordPressService;