# Golden777 - Quick Command Reference

## Project Creation & Setup Commands

### Initial Project Creation
```bash
# Create new Flutter project
flutter create --org com.golden777 --description "Golden777 Slot Game" golden777

# Navigate to project
cd golden777
```

## Dependency Installation Commands

All dependencies have been installed. To add more packages use:

```bash
# Add individual package
flutter pub add package_name

# Add multiple packages
flutter pub add package1 package2 package3

# Remove package
flutter pub remove package_name

# Update all packages
flutter pub upgrade

# Get dependencies
flutter pub get

# Clean dependencies
flutter pub cache clean
```

## Current Installed Packages

```bash
# Core Game & UI Packages
flutter pub add flame              # Game engine
flutter pub add rive               # Animations
flutter pub add provider           # State management
flutter pub add go_router          # Routing

# HTTP & API
flutter pub add http               # HTTP client
flutter pub add dio                # Advanced HTTP

# Data & Storage
flutter pub add shared_preferences # Local storage
flutter pub add intl               # Localization

# Utilities
flutter pub add uuid               # Unique IDs
flutter pub add google_fonts       # Custom fonts
flutter pub add connectivity_plus  # Network detection
```

## Running the Application

```bash
# Run in debug mode
flutter run

# Run on specific device
flutter run -d <device_id>

# Run in profile mode (optimized)
flutter run --profile

# Run in release mode (fully optimized)
flutter run --release

# Run with verbose output
flutter run -v

# Run on web
flutter run -d web-server

# Run on iOS
flutter run -d ios

# Run on Android
flutter run -d android
```

## Building for Production

```bash
# Build APK (Android)
flutter build apk --release

# Build App Bundle (Google Play)
flutter build appbundle --release

# Build iOS app
flutter build ios --release

# Build web version
flutter build web --release
```

## Development Commands

```bash
# Get all available devices
flutter devices

# Check Flutter setup
flutter doctor

# Format code
flutter format lib/

# Analyze code for issues
flutter analyze

# Run tests
flutter test

# Clean build files
flutter clean

# Get latest packages
flutter pub get

# Upgrade Flutter
flutter upgrade
```

## Hot Reload & Hot Restart

**During `flutter run` session:**
- Press `r` - Hot reload (fast development)
- Press `R` - Hot restart (full restart)
- Press `h` - Show help
- Press `q` - Quit

## Debugging Commands

```bash
# View logs
flutter logs

# Open DevTools
flutter pub global run devtools

# Run with debugging
flutter run --debug

# Run with verbose logging
flutter run -vvv
```

## Adding New Files/Directories

```bash
# Create directory structure
mkdir -p lib/screens/auth
mkdir -p lib/screens/game
mkdir -p lib/services
mkdir -p lib/models
mkdir -p lib/providers
mkdir -p lib/widgets
mkdir -p lib/utils
mkdir -p lib/config
```

## Asset Management

```bash
# Add assets (create pubspec.yaml section)
# flutter:
#   assets:
#     - assets/images/
#     - assets/animations/

# Use in code:
# Image.asset('assets/images/logo.png')
```

## Publishing to App Stores

### Android (Google Play Store)
```bash
# Generate signing key
keytool -genkey -v -keystore ~/upload-keystore.jks \
  -keyalg RSA -keysize 2048 -validity 10950 \
  -alias upload

# Build signed APK
flutter build apk --release

# Build signed App Bundle
flutter build appbundle --release
```

### iOS (Apple App Store)
```bash
# Build iOS app
flutter build ios --release

# Archive and upload from Xcode
open ios/Runner.xcworkspace
```

## Environment & Configuration

```bash
# Set up environment variables
export FLUTTER_HOME=$(which flutter)

# Check Flutter version
flutter --version

# Check Dart version
dart --version

# Switch to different Flutter channel
flutter channel dev
flutter upgrade

# Switch back to stable
flutter channel stable
flutter upgrade
```

## Cleaning Up

```bash
# Clean everything
flutter clean

# Remove generated files
dart clean

# Clean pub cache
flutter pub cache clean

# Remove build outputs
rm -rf build/
rm -rf .dart_tool/
```

## Package Management

```bash
# Check outdated packages
flutter pub outdated

# Get dependency tree
flutter pub deps

# Check for security issues
dart pub outdated --mode=null-safety

# Lock dependencies
flutter pub lock

# Upgrade specific package
flutter pub upgrade package_name
```

## Code Generation (if needed)

```bash
# Generate code for annotations
flutter pub run build_runner build

# Watch for changes and regenerate
flutter pub run build_runner watch

# Clean generated files
flutter pub run build_runner clean
```

## Testing Commands

```bash
# Run all tests
flutter test

# Run specific test file
flutter test test/widget_test.dart

# Run tests with coverage
flutter test --coverage

# Watch tests (re-run on changes)
flutter test --watch
```

## Emulator Commands

```bash
# List available emulators
flutter emulators

# Launch emulator
flutter emulators launch <emulator_id>

# Create new Android emulator (using Android Studio)
flutter emulators launch android_emulator

# List all connected devices
flutter devices --verbose
```

## Useful Development Tips

```bash
# Check app size
flutter build apk --analyze-size

# Build for specific architecture
flutter build apk --target-platform=android-arm64

# Skip null safety checks (if needed)
flutter run --no-sound-null-safety
```

## Troubleshooting Commands

```bash
# Reset Flutter environment
flutter clean && flutter pub get

# Full system diagnostics
flutter doctor -v

# Fix common issues
flutter pub global activate fvm  # Flutter version management

# Check SDK setup
sdkmanager --list

# Restart ADB daemon
adb kill-server
adb start-server
```

## Documentation & Help

```bash
# View command help
flutter --help
flutter run --help
flutter build --help

# Access Flutter documentation
flutter doc

# Open issues/PRs in browser
flutter feedback
```

---

**Quick Setup Recap:**
1. `flutter create golden777`
2. `cd golden777`
3. `flutter pub get`
4. `flutter run`

**API Configuration:**
- Edit: `lib/config/api_config.dart`
- Update: `baseUrl` to your backend server

**Development Workflow:**
1. Make code changes
2. Press 'r' for hot reload
3. Press 'R' for full restart if needed
4. Press 'q' to quit

**For Production:**
1. `flutter clean`
2. `flutter pub get`
3. `flutter build apk --release` (Android)
4. `flutter build ios --release` (iOS)
