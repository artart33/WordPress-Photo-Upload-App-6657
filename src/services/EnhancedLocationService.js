import CapacitorService from './CapacitorService';

class EnhancedLocationService {
  static async getPhotoLocation(file) {
    // Priority 1: Try to get current device location first (most accurate)
    try {
      console.log('🎯 Attempting to get current device location...');
      const deviceLocation = await this.getCurrentLocation();
      
      if (deviceLocation) {
        console.log('✅ Device location obtained successfully');
        return {
          ...deviceLocation,
          source: await CapacitorService.isNativeApp() ? 'native-gps-current' : 'web-geolocation-current',
          accuracy: deviceLocation.accuracy || null,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.warn('⚠️ Device location failed, trying EXIF data:', error.message);
    }

    // Priority 2: Try to get location from photo EXIF data
    try {
      console.log('📷 Attempting to extract location from photo EXIF...');
      if (!await CapacitorService.isNativeApp()) {
        const exifLocation = await this.getLocationFromEXIF(file);
        if (exifLocation) {
          console.log('✅ EXIF location extracted successfully');
          return {
            ...exifLocation,
            source: 'exif-photo',
            timestamp: new Date().toISOString()
          };
        }
      }
    } catch (error) {
      console.warn('⚠️ EXIF location extraction failed:', error.message);
    }

    // Priority 3: Fallback to device location with lower accuracy requirements
    try {
      console.log('🔄 Fallback: Attempting device location with relaxed settings...');
      const fallbackLocation = await this.getCurrentLocationFallback();
      
      if (fallbackLocation) {
        console.log('✅ Fallback device location obtained');
        return {
          ...fallbackLocation,
          source: await CapacitorService.isNativeApp() ? 'native-gps-fallback' : 'web-geolocation-fallback',
          accuracy: fallbackLocation.accuracy || null,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.warn('⚠️ Fallback location also failed:', error.message);
    }

    // If all methods fail, throw error
    throw new Error('Kon geen locatie bepalen: GPS en EXIF data niet beschikbaar');
  }

  static async getCurrentLocation() {
    try {
      // Check if we have permission first
      if (await CapacitorService.isNativeApp()) {
        const permissions = await CapacitorService.requestPermissions();
        if (!permissions.location) {
          throw new Error('Location permission not granted');
        }
      }

      // Use CapacitorService for both native and web with high accuracy
      const position = await CapacitorService.getCurrentPosition();
      const { latitude, longitude, accuracy } = position;

      console.log(`📍 Device location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (accuracy: ${accuracy}m)`);

      // Get location name via reverse geocoding
      try {
        const locationData = await this.reverseGeocode(latitude, longitude);
        return {
          latitude,
          longitude,
          accuracy,
          locationName: locationData.locationName,
          address: locationData.address,
          mapUrl: `https://maps.google.com/?q=${latitude},${longitude}`,
          rawData: locationData.rawData
        };
      } catch (geocodeError) {
        console.warn('Reverse geocoding failed, returning coordinates only:', geocodeError);
        return {
          latitude,
          longitude,
          accuracy,
          locationName: `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`,
          address: null,
          mapUrl: `https://maps.google.com/?q=${latitude},${longitude}`,
          rawData: null
        };
      }
    } catch (error) {
      console.error('getCurrentLocation failed:', error);
      throw new Error(`Kon huidige locatie niet bepalen: ${error.message}`);
    }
  }

  static async getCurrentLocationFallback() {
    try {
      console.log('🔄 Using fallback location settings...');
      
      if (await CapacitorService.isNativeApp()) {
        // Native app fallback with relaxed settings
        const { Geolocation } = await import('@capacitor/geolocation');
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: false,  // Lower accuracy for better compatibility
          timeout: 15000,             // Longer timeout
          maximumAge: 300000          // Accept cached location up to 5 minutes old
        });

        const { latitude, longitude, accuracy } = position.coords;
        console.log(`📍 Fallback device location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);

        try {
          const locationData = await this.reverseGeocode(latitude, longitude);
          return {
            latitude,
            longitude,
            accuracy,
            locationName: locationData.locationName,
            address: locationData.address,
            mapUrl: `https://maps.google.com/?q=${latitude},${longitude}`,
            rawData: locationData.rawData
          };
        } catch (geocodeError) {
          return {
            latitude,
            longitude,
            accuracy,
            locationName: `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`,
            address: null,
            mapUrl: `https://maps.google.com/?q=${latitude},${longitude}`,
            rawData: null
          };
        }
      } else {
        // Web fallback
        return new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
          }

          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              const { latitude, longitude, accuracy } = pos.coords;
              console.log(`📍 Web fallback location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);

              try {
                const locationData = await this.reverseGeocode(latitude, longitude);
                resolve({
                  latitude,
                  longitude,
                  accuracy,
                  locationName: locationData.locationName,
                  address: locationData.address,
                  mapUrl: `https://maps.google.com/?q=${latitude},${longitude}`,
                  rawData: locationData.rawData
                });
              } catch (geocodeError) {
                resolve({
                  latitude,
                  longitude,
                  accuracy,
                  locationName: `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`,
                  address: null,
                  mapUrl: `https://maps.google.com/?q=${latitude},${longitude}`,
                  rawData: null
                });
              }
            },
            (error) => {
              reject(new Error(`Web geolocation error: ${error.message}`));
            },
            {
              enableHighAccuracy: false,  // Lower accuracy for better compatibility
              timeout: 15000,             // Longer timeout
              maximumAge: 300000          // Accept cached location up to 5 minutes old
            }
          );
        });
      }
    } catch (error) {
      console.error('getCurrentLocationFallback failed:', error);
      throw new Error(`Fallback locatie ook mislukt: ${error.message}`);
    }
  }

  static getLocationFromEXIF(file) {
    return new Promise((resolve, reject) => {
      // For web environment, we would need an EXIF library
      // This is a placeholder for EXIF extraction
      console.log('📷 EXIF extraction not implemented in demo version');
      reject(new Error('EXIF extraction not available in demo'));
      
      // Real implementation would look like:
      /*
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const exif = EXIF.readFromBinaryFile(e.target.result);
          if (exif.GPSLatitude && exif.GPSLongitude) {
            const lat = this.dmsToDecimal(exif.GPSLatitude, exif.GPSLatitudeRef);
            const lon = this.dmsToDecimal(exif.GPSLongitude, exif.GPSLongitudeRef);
            
            this.reverseGeocode(lat, lon).then(locationData => {
              resolve({
                latitude: lat,
                longitude: lon,
                locationName: locationData.locationName,
                address: locationData.address,
                mapUrl: `https://maps.google.com/?q=${lat},${lon}`,
                source: 'exif'
              });
            }).catch(() => {
              resolve({
                latitude: lat,
                longitude: lon,
                locationName: `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`,
                address: null,
                mapUrl: `https://maps.google.com/?q=${lat},${lon}`,
                source: 'exif'
              });
            });
          } else {
            reject(new Error('No GPS data in EXIF'));
          }
        } catch (error) {
          reject(new Error('EXIF parsing failed'));
        }
      };
      reader.readAsArrayBuffer(file);
      */
    });
  }

  static async reverseGeocode(latitude, longitude) {
    try {
      // Check network connectivity first
      const isConnected = await CapacitorService.checkNetworkStatus();
      if (!isConnected) {
        throw new Error('Geen internetverbinding voor locatienaam');
      }

      console.log(`🌐 Reverse geocoding: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1&accept-language=nl,en`,
        {
          headers: {
            'User-Agent': 'WordPress-Photo-Uploader/1.0'
          },
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Reverse geocoding service unavailable');
      }

      const data = await response.json();

      if (data && data.address) {
        const address = data.address;
        const locationParts = [];

        // Build location name with priority
        if (address.amenity) {
          locationParts.push(address.amenity);
        } else if (address.shop) {
          locationParts.push(address.shop);
        } else if (address.building) {
          locationParts.push(address.building);
        }

        if (address.road || address.pedestrian) {
          locationParts.push(address.road || address.pedestrian);
        }

        if (address.neighbourhood || address.suburb) {
          locationParts.push(address.neighbourhood || address.suburb);
        }

        if (address.city || address.town || address.village) {
          locationParts.push(address.city || address.town || address.village);
        }

        if (address.country) {
          locationParts.push(address.country);
        }

        const locationName = locationParts.length > 0 
          ? locationParts.slice(0, 3).join(', ') 
          : data.display_name?.split(',').slice(0, 3).join(', ') || 'Onbekende locatie';

        console.log(`📍 Location name resolved: ${locationName}`);

        return {
          locationName: locationName.trim(),
          address: data.display_name || null,
          rawData: data
        };
      }

      throw new Error('No address data found');
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('⏱️ Reverse geocoding timeout');
        throw new Error('Locatienaam ophalen duurt te lang');
      } else {
        console.warn('⚠️ Reverse geocoding failed:', error.message);
        throw new Error('Kon locatienaam niet bepalen');
      }
    }
  }

  static dmsToDecimal(dms, ref) {
    let decimal = dms[0] + dms[1] / 60 + dms[2] / 3600;
    if (ref === 'S' || ref === 'W') {
      decimal = -decimal;
    }
    return decimal;
  }

  // Helper method to get location source description
  static getLocationSourceDescription(source) {
    const descriptions = {
      'native-gps-current': '📱 Huidige GPS-locatie (native app)',
      'web-geolocation-current': '🌐 Huidige browser-locatie',
      'native-gps-fallback': '📱 GPS-locatie (lagere precisie)',
      'web-geolocation-fallback': '🌐 Browser-locatie (lagere precisie)',
      'exif-photo': '📷 Locatie uit foto EXIF-data',
      'user-adjusted': '👤 Handmatig aangepast'
    };
    return descriptions[source] || '📍 Locatie bepaald';
  }
}

export default EnhancedLocationService;