# WordPress Photo Uploader - Android APK Build Instructions

## Prerequisites

1. **Install Android Studio**: Download from https://developer.android.com/studio
2. **Install Java Development Kit (JDK)**: Version 11 or higher
3. **Install Node.js**: Version 16 or higher
4. **Install Capacitor CLI**: `npm install -g @capacitor/cli`

## Build Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Build Web Assets
```bash
npm run build
```

### 3. Add Android Platform
```bash
npx cap add android
```

### 4. Sync Web Assets to Android
```bash
npx cap sync android
```

### 5. Open Android Studio
```bash
npx cap open android
```

### 6. Build APK in Android Studio

1. **Wait for Gradle sync** to complete
2. **Connect Android device** or start emulator
3. **Build APK**: 
   - Go to `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
   - Or use `Build` → `Generate Signed Bundle / APK` for production

### 7. Install APK on Device

**Debug APK Location:**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

**Install via ADB:**
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## Production Build

### 1. Create Keystore (First time only)
```bash
keytool -genkey -v -keystore my-upload-key.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
```

### 2. Configure Signing
Create `android/app/build.gradle` signing config:
```gradle
android {
    signingConfigs {
        release {
            storeFile file('my-upload-key.keystore')
            storePassword 'your-keystore-password'
            keyAlias 'my-key-alias'
            keyPassword 'your-key-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 3. Build Production APK
```bash
cd android
./gradlew assembleRelease
```

**Production APK Location:**
```
android/app/build/outputs/apk/release/app-release.apk
```

## Features in Native App

### 📱 **Native Capabilities:**
- **Camera Access**: Direct camera integration
- **Photo Gallery**: Native photo picker
- **GPS Location**: Accurate location services
- **Network Detection**: Connectivity status
- **Native Sharing**: Share posts via system dialog
- **Status Bar**: Themed status bar
- **Splash Screen**: Professional app loading
- **Permissions**: Proper Android permissions

### 🔧 **Technical Features:**
- **Offline Capable**: Works without internet (limited)
- **File Management**: Proper file handling
- **Security**: Secure HTTP requests
- **Performance**: Optimized for mobile
- **Responsive**: Adapts to all screen sizes

## Troubleshooting

### Common Issues:

1. **Gradle Build Fails**:
   ```bash
   cd android
   ./gradlew clean
   ./gradlew build
   ```

2. **Permissions Not Working**:
   - Check `AndroidManifest.xml` permissions
   - Test on real device, not emulator

3. **Camera Not Working**:
   - Ensure camera permissions granted
   - Test on physical device

4. **Location Services**:
   - Enable GPS on device
   - Grant location permissions

### Debug Commands:
```bash
# Check device connection
adb devices

# View app logs
adb logcat | grep -i "wordpress"

# Uninstall app
adb uninstall com.wordpressuploader.app

# Install debug APK
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## App Store Deployment

### Google Play Store:
1. Create signed AAB bundle: `./gradlew bundleRelease`
2. Upload to Google Play Console
3. Follow store guidelines for app listing

### Direct APK Distribution:
1. Build signed APK: `./gradlew assembleRelease`
2. Distribute APK file directly
3. Users need to enable "Unknown Sources" in Android settings

## File Structure
```
android/
├── app/
│   ├── src/main/
│   │   ├── AndroidManifest.xml
│   │   ├── res/
│   │   │   ├── values/strings.xml
│   │   │   └── xml/file_paths.xml
│   │   └── java/
│   └── build.gradle
├── build.gradle
└── gradle.properties
```

The app is now ready to be built as a native Android APK! 🎉