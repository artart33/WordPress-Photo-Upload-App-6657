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

  static async getTags(settings) {
    const { wordpressUrl, username, password } = settings;

    try {
      const response = await axios.get(`${wordpressUrl}/wp-json/wp/v2/tags`, {
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
      console.error('Failed to fetch tags:', error);
      return [];
    }
  }

  static async createTags(tagNames, settings) {
    const { wordpressUrl, username, password } = settings;
    const createdTags = [];

    for (const tagName of tagNames) {
      try {
        // Check if tag already exists
        const existingResponse = await axios.get(`${wordpressUrl}/wp-json/wp/v2/tags`, {
          auth: {
            username,
            password
          },
          params: {
            search: tagName
          }
        });

        let tagId;
        if (existingResponse.data.length > 0) {
          // Tag exists, use existing ID
          tagId = existingResponse.data[0].id;
        } else {
          // Create new tag
          const createResponse = await axios.post(`${wordpressUrl}/wp-json/wp/v2/tags`, {
            name: tagName,
            slug: tagName.toLowerCase().replace(/\s+/g, '-')
          }, {
            auth: {
              username,
              password
            }
          });
          tagId = createResponse.data.id;
        }

        createdTags.push(tagId);
      } catch (error) {
        console.error(`Failed to create/find tag "${tagName}":`, error);
      }
    }

    return createdTags;
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
    const { photo, title, content, categories, tags, location, weather, rating } = postData;
    const { wordpressUrl, username, password } = settings;

    try {
      // First upload the image
      const media = await this.uploadMedia(photo, settings);

      // Create tags if provided
      let tagIds = [];
      if (tags && tags.length > 0) {
        tagIds = await this.createTags(tags, settings);
      }

      // Prepare post content
      let postContent = content || '';

      // Add rating to content if provided
      if (rating > 0) {
        const stars = '⭐'.repeat(rating);
        const emptyStars = '☆'.repeat(5 - rating);
        postContent += `\n\n📊 **Beoordeling:** ${stars}${emptyStars} (${rating}/5 sterren)`;
      }

      // Add tags to content if provided
      if (tags && tags.length > 0) {
        postContent += `\n\n🏷️ **Tags:** ${tags.map(tag => `#${tag}`).join(' ')}`;
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

      // Add weather info to content if available
      if (weather) {
        postContent += `\n\n🌤️ **Weer tijdens foto:** ${weather.icon} ${weather.temperature}°C`;
        postContent += `\n🌡️ **Gevoelstemperatuur:** ${weather.feelsLike}°C`;
        postContent += `\n💨 **Wind:** ${weather.windSpeed} km/h`;
        postContent += `\n💧 **Luchtvochtigheid:** ${weather.humidity}%`;
        if (weather.condition) {
          postContent += `\n☁️ **Omstandigheden:** ${weather.condition}`;
        }
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

      // Add tags if created
      if (tagIds.length > 0) {
        postPayload.tags = tagIds;
      }

      // Add custom fields for rating, location, weather and tags
      const customFields = {};
      
      if (rating > 0) {
        customFields.rating = rating;
      }
      
      if (tags && tags.length > 0) {
        customFields.custom_tags = tags.join(',');
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

      if (weather) {
        customFields.weather_temperature = weather.temperature;
        customFields.weather_feels_like = weather.feelsLike;
        customFields.weather_condition = weather.condition;
        customFields.weather_icon = weather.icon;
        customFields.weather_humidity = weather.humidity;
        customFields.weather_wind_speed = weather.windSpeed;
        customFields.weather_summary = weather.summary;
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