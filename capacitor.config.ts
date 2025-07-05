import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'com.wordpressuploader.app',
  appName: 'WordPress Photo Uploader',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Camera: {
      permissions: {
        camera: 'required',
        photos: 'required'
      }
    },
    Geolocation: {
      permissions: {
        location: 'required'
      }
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#8b5cf6',
      backgroundColor: '#3b82f6'
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#3b82f6'
    }
  }
};

export default config;