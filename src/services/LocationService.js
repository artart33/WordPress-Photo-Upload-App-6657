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
          
          resolve({
            latitude,
            longitude,
            mapUrl: `https://maps.google.com/?q=${latitude},${longitude}`,
            source: 'exif'
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
        (position) => {
          const { latitude, longitude } = position.coords;
          resolve({
            latitude,
            longitude,
            mapUrl: `https://maps.google.com/?q=${latitude},${longitude}`,
            source: 'device'
          });
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

  static dmsToDecimal(dms, ref) {
    let decimal = dms[0] + dms[1]/60 + dms[2]/3600;
    if (ref === 'S' || ref === 'W') {
      decimal = -decimal;
    }
    return decimal;
  }
}

export default LocationService;