import EXIF from 'exif-js';

class LocationService {
  static async getPhotoLocation(file) {
    try {
      // First try to get location from EXIF data
      const exifLocation = await this.getLocationFromEXIF(file);
      if (exifLocation) {
        return exifLocation;
      }
    } catch (error) {
      console.warn('EXIF location extraction failed:', error);
    }

    // Fallback to device location
    return await this.getCurrentLocation();
  }

  static getLocationFromEXIF(file) {
    return new Promise((resolve, reject) => {
      EXIF.getData(file, function() {
        const lat = EXIF.getTag(this, 'GPSLatitude');
        const lon = EXIF.getTag(this, 'GPSLongitude');
        const latRef = EXIF.getTag(this, 'GPSLatitudeRef');
        const lonRef = EXIF.getTag(this, 'GPSLongitudeRef');

        if (lat && lon && latRef && lonRef) {
          // Convert DMS to decimal degrees
          const latitude = LocationService.dmsToDecimal(lat, latRef);
          const longitude = LocationService.dmsToDecimal(lon, lonRef);
          
          // Get location name using reverse geocoding
          LocationService.reverseGeocode(latitude, longitude)
            .then(locationData => {
              resolve({
                latitude,
                longitude,
                locationName: locationData.locationName,
                address: locationData.address,
                mapUrl: `https://maps.google.com/?q=${latitude},${longitude}`,
                source: 'exif'
              });
            })
            .catch(() => {
              // Fallback without location name
              resolve({
                latitude,
                longitude,
                locationName: null,
                address: null,
                mapUrl: `https://maps.google.com/?q=${latitude},${longitude}`,
                source: 'exif'
              });
            });
        } else {
          reject(new Error('No GPS data in EXIF'));
        }
      });
    });
  }

  static getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Get location name using reverse geocoding
            const locationData = await this.reverseGeocode(latitude, longitude);
            resolve({
              latitude,
              longitude,
              locationName: locationData.locationName,
              address: locationData.address,
              mapUrl: `https://maps.google.com/?q=${latitude},${longitude}`,
              source: 'device'
            });
          } catch (error) {
            // Fallback without location name
            resolve({
              latitude,
              longitude,
              locationName: null,
              address: null,
              mapUrl: `https://maps.google.com/?q=${latitude},${longitude}`,
              source: 'device'
            });
          }
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }

  static async reverseGeocode(latitude, longitude) {
    try {
      // Using OpenStreetMap Nominatim API (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1&accept-language=nl,en`,
        {
          headers: {
            'User-Agent': 'WordPress-Photo-Uploader/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }

      const data = await response.json();
      
      if (data && data.address) {
        const address = data.address;
        
        // Build location name from components
        const locationParts = [];
        
        // Add specific location (building, shop, etc.)
        if (address.amenity) {
          locationParts.push(address.amenity);
        } else if (address.shop) {
          locationParts.push(address.shop);
        } else if (address.building) {
          locationParts.push(address.building);
        }
        
        // Add road/street
        if (address.road || address.pedestrian) {
          locationParts.push(address.road || address.pedestrian);
        }
        
        // Add neighborhood/suburb
        if (address.neighbourhood || address.suburb) {
          locationParts.push(address.neighbourhood || address.suburb);
        }
        
        // Add city/town/village
        if (address.city || address.town || address.village) {
          locationParts.push(address.city || address.town || address.village);
        }
        
        // Add country
        if (address.country) {
          locationParts.push(address.country);
        }

        const locationName = locationParts.length > 0 
          ? locationParts.slice(0, 3).join(', ') // Limit to first 3 parts
          : data.display_name?.split(',').slice(0, 3).join(',') || 'Onbekende locatie';

        return {
          locationName: locationName.trim(),
          address: data.display_name || null,
          rawData: data
        };
      }
      
      throw new Error('No address data found');
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      
      // Fallback: try to get basic location info
      try {
        const fallbackResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=nl,en`,
          {
            headers: {
              'User-Agent': 'WordPress-Photo-Uploader/1.0'
            }
          }
        );
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const basicLocation = fallbackData.display_name?.split(',').slice(0, 2).join(', ') || 'Onbekende locatie';
          
          return {
            locationName: basicLocation,
            address: fallbackData.display_name || null,
            rawData: fallbackData
          };
        }
      } catch (fallbackError) {
        console.warn('Fallback geocoding also failed:', fallbackError);
      }
      
      throw new Error('Could not determine location name');
    }
  }

  static dmsToDecimal(dms, ref) {
    let decimal = dms[0] + dms[1]/60 + dms[2]/3600;
    if (ref === 'S' || ref === 'W') {
      decimal = -decimal;
    }
    return decimal;
  }
}

export default LocationService;