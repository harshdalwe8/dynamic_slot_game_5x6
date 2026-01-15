# 📱 Platform-Specific Setup Guide

## Android Setup

### 1. Update `android/app/build.gradle`

```gradle
android {
    compileSdkVersion 34
    
    defaultConfig {
        applicationId "com.yourcompany.slotgame"
        minSdkVersion 21
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 2. Update `android/app/src/main/AndroidManifest.xml`

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.yourcompany.slotgame">
    
    <!-- Required permissions -->
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
    
    <application
        android:label="Slot Game"
        android:icon="@mipmap/ic_launcher"
        android:usesCleartextTraffic="true"
        android:networkSecurityConfig="@xml/network_security_config">
        
        <activity
            android:name=".MainActivity"
            android:launchMode="singleTop"
            android:theme="@style/LaunchTheme"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|smallestScreenSize|locale|layoutDirection|fontScale|screenLayout|density|uiMode"
            android:hardwareAccelerated="true"
            android:windowSoftInputMode="adjustResize">
            
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
    </application>
</manifest>
```

### 3. Create `android/app/src/main/res/xml/network_security_config.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
</network-security-config>
```

### 4. Generate Signing Key (for release builds)

```bash
keytool -genkey -v -keystore ~/slot-game-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias slotgame

# Create android/key.properties
storePassword=<password>
keyPassword=<password>
keyAlias=slotgame
storeFile=<path to slot-game-key.jks>
```

## iOS Setup

### 1. Update `ios/Runner/Info.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>
    <string>Slot Game</string>
    <key>CFBundleDisplayName</key>
    <string>Slot Game</string>
    <key>CFBundleIdentifier</key>
    <string>com.yourcompany.slotgame</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <true/>
    </dict>
    <key>UILaunchStoryboardName</key>
    <string>LaunchScreen</string>
    <key>UISupportedInterfaceOrientations</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
    </array>
</dict>
</plist>
```

### 2. Install CocoaPods Dependencies

```bash
cd ios
pod install
cd ..
```

### 3. Update Deployment Target

Open `ios/Runner.xcworkspace` in Xcode:
- Select Runner project
- Set iOS Deployment Target to 12.0 or higher

## Web Setup

### 1. Update `web/index.html`

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="description" content="Dynamic Slot Game System">
    <title>🎰 Slot Game</title>
    
    <link rel="icon" type="image/png" href="favicon.png"/>
    <link rel="apple-touch-icon" href="icons/Icon-192.png">
    
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #0A0E27;
        }
    </style>
</head>
<body>
    <script src="main.dart.js" type="application/javascript"></script>
</body>
</html>
```

### 2. Enable CORS for Development

When running backend, ensure CORS is enabled:

```typescript
// In backend/src/app.ts
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:3000'],
  credentials: true
}));
```

## Windows Desktop Setup

### Requirements
- Visual Studio 2019 or later with C++ desktop development tools

### Build
```bash
flutter config --enable-windows-desktop
flutter build windows --release
```

The executable will be in: `build/windows/runner/Release/slot_game.exe`

## macOS Desktop Setup

### Requirements
- Xcode with Command Line Tools

### Update Entitlements

Edit `macos/Runner/DebugProfile.entitlements` and `macos/Runner/Release.entitlements`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.app-sandbox</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>
    <key>com.apple.security.network.server</key>
    <true/>
</dict>
</plist>
```

### Build
```bash
flutter config --enable-macos-desktop
flutter build macos --release
```

## Linux Desktop Setup

### Requirements
```bash
sudo apt-get install clang cmake ninja-build pkg-config libgtk-3-dev
```

### Build
```bash
flutter config --enable-linux-desktop
flutter build linux --release
```

## Environment Variables

Create `.env` file in project root:

```env
# Development
API_URL=http://localhost:3000/api
ENVIRONMENT=development
DEBUG=true

# Production (example)
# API_URL=https://api.yourslotgame.com/api
# ENVIRONMENT=production
# DEBUG=false
# SENTRY_DSN=your-sentry-dsn
```

### Using Environment Variables in Flutter

```bash
# Development
flutter run --dart-define=API_URL=http://localhost:3000/api --dart-define=ENVIRONMENT=development

# Production
flutter run --dart-define=API_URL=https://api.yourslotgame.com/api --dart-define=ENVIRONMENT=production
```

## Firebase Setup (Optional for Analytics/Crashlytics)

### 1. Install FlutterFire CLI
```bash
dart pub global activate flutterfire_cli
```

### 2. Configure Firebase
```bash
flutterfire configure
```

### 3. Add Dependencies
```yaml
# In pubspec.yaml
dependencies:
  firebase_core: ^2.24.0
  firebase_analytics: ^10.7.0
  firebase_crashlytics: ^3.4.0
```

### 4. Initialize in main.dart
```dart
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(ProviderScope(child: SlotGameApp()));
}
```

## Push Notifications (Optional)

### Android

1. Add to `android/app/build.gradle`:
```gradle
dependencies {
    implementation 'com.google.firebase:firebase-messaging:23.0.0'
}
```

2. Add to `AndroidManifest.xml`:
```xml
<service
    android:name="com.google.firebase.messaging.FirebaseMessagingService"
    android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
</service>
```

### iOS

1. Enable Push Notifications in Xcode capabilities
2. Add to `Info.plist`:
```xml
<key>UIBackgroundModes</key>
<array>
    <string>remote-notification</string>
</array>
```

## App Icons

### Generate Icons

1. Create 1024x1024 PNG icon
2. Use [https://appicon.co/](https://appicon.co/) or flutter_launcher_icons

Add to `pubspec.yaml`:
```yaml
dev_dependencies:
  flutter_launcher_icons: ^0.13.0

flutter_launcher_icons:
  android: true
  ios: true
  image_path: "assets/icon/app_icon.png"
```

Run:
```bash
flutter pub run flutter_launcher_icons
```

## Troubleshooting

### Android Build Issues

```bash
# Clear cache
cd android
./gradlew clean
cd ..
flutter clean
flutter pub get

# Update Gradle wrapper
cd android
./gradlew wrapper --gradle-version 8.0
```

### iOS Build Issues

```bash
# Clean derived data
rm -rf ~/Library/Developer/Xcode/DerivedData

# Clean and reinstall pods
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
cd ..

flutter clean
flutter pub get
```

### Web CORS Issues

Use a proxy or configure your backend to allow your web domain:

```dart
// Development proxy solution
flutter run -d chrome --web-port=8080
```

---

**Platform-specific issues?** Check Flutter's official documentation for each platform.
