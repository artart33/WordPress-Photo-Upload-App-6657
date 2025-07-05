import CapacitorService from './CapacitorService';

class EnhancedLocationService {
  static async getPhotoLocation(file) {
    try {
      // First try to get EXIF data (web only)
      if (!await CapacitorService.isNativeApp()) {
        const exifLocation = await this.getLocationFromEXIF(file);
        if (exifLocation) {
          return exifLocation;
        }
      }
    } catch (error) {
      console.warn('EXIF location extraction failed:', error);
    }

    // Fallback to current location
    return await this.getCurrentLocation();
  }

  static getLocationFromEXIF(file) {
    return new Promise((resolve, reject) => {
      reject(new Error('EXIF not available in demo'));
    });
  }

  static async getCurrentLocation() {
    try {
      // Use CapacitorService which handles both native and web
      const position = await CapacitorService.getCurrentPosition();
      const { latitude, longitude } = position;

      try {
        const locationData = await this.reverseGeocode(latitude, longitude);
        return {
          latitude,
          longitude,
          locationName: locationData.locationName,
          address: locationData.address,
          mapUrl: `https://maps.google.com/?q=${latitude},${longitude}`,
          source: await CapacitorService.isNativeApp() ? 'native-gps' : 'web-geolocation'
        };
      } catch (error) {
        return {
          latitude,
          longitude,
          locationName: null,
          address: null,
          mapUrl: `https://maps.google.com/?q=${latitude},${longitude}`,
          source: await CapacitorService.isNativeApp() ? 'native-gps' : 'web-geolocation'
        };
      }
    } catch (error) {
      throw new Error(`Kon locatie niet bepalen: ${error.message}`);
    }
  }

  static async reverseGeocode(latitude, longitude) {
    try {
      // Check network connectivity
      const isConnected = await CapacitorService.checkNetworkStatus();
      if (!isConnected) {
        throw new Error('Geen internetverbinding');
      }

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
        const locationParts = [];

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

        return {
          locationName: locationName.trim(),
          address: data.display_name || null,
          rawData: data
        };
      }

      throw new Error('No address data found');
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      throw new Error('Could not determine location name');
    }
  }

  static dmsToDecimal(dms, ref) {
    let decimal = dms[0] + dms[1] / 60 + dms[2] / 3600;
    if (ref === 'S' || ref === 'W') {
      decimal = -decimal;
    }
    return decimal;
  }
}

export default EnhancedLocationService;