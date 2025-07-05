// Safe Capacitor service that works in both web and native environments
class CapacitorService {
  static async isNativeApp() {
    try {
      // Check if we're in a Capacitor environment
      if (typeof window !== 'undefined' && window.Capacitor) {
        const { Device } = await import('@capacitor/device');
        const info = await Device.getInfo();
        return info.platform === 'android' || info.platform === 'ios';
      }
      return false;
    } catch {
      return false;
    }
  }

  static async setupStatusBar() {
    try {
      if (await this.isNativeApp()) {
        const { StatusBar } = await import('@capacitor/status-bar');
        await StatusBar.setBackgroundColor({ color: '#3b82f6' });
        await StatusBar.setStyle({ style: 'light' });
      }
    } catch (error) {
      console.log('StatusBar setup failed:', error);
    }
  }

  static async takePicture() {
    try {
      if (await this.isNativeApp()) {
        const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
        
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera
        });

        // Convert data URL to File object
        const response = await fetch(image.dataUrl);
        const blob = await response.blob();
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });

        return file;
      } else {
        throw new Error('Camera only available in native app');
      }
    } catch (error) {
      console.error('Camera error:', error);
      throw new Error('Kon geen foto maken');
    }
  }

  static async selectFromGallery() {
    try {
      if (await this.isNativeApp()) {
        const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
        
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Photos
        });

        // Convert data URL to File object
        const response = await fetch(image.dataUrl);
        const blob = await response.blob();
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });

        return file;
      } else {
        throw new Error('Gallery only available in native app');
      }
    } catch (error) {
      console.error('Gallery error:', error);
      throw new Error('Kon geen foto selecteren');
    }
  }

  static async getCurrentPosition() {
    try {
      if (await this.isNativeApp()) {
        const { Geolocation } = await import('@capacitor/geolocation');
        
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000  // Accept location up to 1 minute old
        });

        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp
        };
      } else {
        // Fallback to web geolocation
        return new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
          }

          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              altitude: pos.coords.altitude,
              heading: pos.coords.heading,
              speed: pos.coords.speed,
              timestamp: pos.timestamp
            }),
            (error) => reject(new Error(`Geolocation error: ${error.message}`)),
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000
            }
          );
        });
      }
    } catch (error) {
      console.error('Geolocation error:', error);
      throw new Error('Kon locatie niet bepalen');
    }
  }

  static async checkNetworkStatus() {
    try {
      if (await this.isNativeApp()) {
        const { Network } = await import('@capacitor/network');
        const status = await Network.getStatus();
        return status.connected;
      } else {
        // Fallback for web - check navigator.onLine
        return navigator.onLine;
      }
    } catch (error) {
      console.error('Network check failed:', error);
      return true; // Assume connected if check fails
    }
  }

  static async sharePost(url, title) {
    try {
      if (await this.isNativeApp()) {
        const { Share } = await import('@capacitor/share');
        
        await Share.share({
          title: title,
          text: `Bekijk mijn nieuwe foto post: ${title}`,
          url: url,
          dialogTitle: 'Deel je foto post'
        });
      } else {
        // Fallback for web
        if (navigator.share) {
          await navigator.share({
            title: title,
            text: `Bekijk mijn nieuwe foto post: ${title}`,
            url: url
          });
        } else {
          // Copy to clipboard fallback
          await navigator.clipboard.writeText(url);
          return 'Link gekopieerd naar klembord';
        }
      }
    } catch (error) {
      console.error('Share failed:', error);
      throw new Error('Kon niet delen');
    }
  }

  static async requestPermissions() {
    try {
      if (await this.isNativeApp()) {
        const { Camera } = await import('@capacitor/camera');
        const { Geolocation } = await import('@capacitor/geolocation');

        // Request camera permissions
        const cameraPermission = await Camera.requestPermissions();
        
        // Request location permissions  
        const locationPermission = await Geolocation.requestPermissions();

        return {
          camera: cameraPermission.camera === 'granted',
          location: locationPermission.location === 'granted'
        };
      }

      return { camera: true, location: true };
    } catch (error) {
      console.error('Permission request failed:', error);
      return { camera: false, location: false };
    }
  }
}

export default CapacitorService;