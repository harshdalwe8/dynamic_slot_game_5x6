# 🎰 Quick Start Guide - Flutter Slot Game

## First Time Setup

### 1. Install Flutter (if not already installed)

#### Windows
```powershell
# Download Flutter SDK from https://flutter.dev/docs/get-started/install/windows
# Extract to C:\src\flutter
# Add to PATH: C:\src\flutter\bin

# Verify installation
flutter doctor
```

#### macOS
```bash
# Using Homebrew
brew install flutter

# Or download from https://flutter.dev/docs/get-started/install/macos
```

#### Linux
```bash
# Download from https://flutter.dev/docs/get-started/install/linux
# Extract and add to PATH
export PATH="$PATH:`pwd`/flutter/bin"
```

### 2. Setup Flutter Project

```bash
cd flutter_slot_game

# Get dependencies
flutter pub get

# Generate code for Freezed models
flutter pub run build_runner build --delete-conflicting-outputs
```

### 3. Configure Backend URL

Create a `.env` file:
```bash
cp .env.example .env
```

Edit `.env` and set your backend URL:
```
API_URL=http://localhost:3000/api
```

Or directly edit `lib/services/api_service.dart`:
```dart
final apiServiceProvider = Provider<ApiService>((ref) {
  return ApiService(
    baseUrl: 'http://YOUR_BACKEND_URL:3000/api',
  );
});
```

### 4. Run the App

#### Mobile (Android/iOS)
```bash
# List available devices
flutter devices

# Run on connected device
flutter run

# Or select specific device
flutter run -d <device-id>
```

#### Web
```bash
flutter run -d chrome

# Or with hot reload
flutter run -d chrome --web-port=8080
```

#### Desktop
```bash
# Windows
flutter run -d windows

# macOS
flutter run -d macos

# Linux
flutter run -d linux
```

## Common Commands

### Development

```bash
# Hot reload (press 'r' in terminal while app is running)
# Hot restart (press 'R')
# Quit (press 'q')

# Run with verbose logging
flutter run -v

# Run in profile mode
flutter run --profile

# Run in release mode
flutter run --release
```

### Code Generation

```bash
# Watch mode (auto-regenerate on file changes)
flutter pub run build_runner watch

# One-time build
flutter pub run build_runner build

# Clean and rebuild
flutter pub run build_runner build --delete-conflicting-outputs
```

### Testing

```bash
# Run all tests
flutter test

# Run specific test file
flutter test test/unit/api_service_test.dart

# Run with coverage
flutter test --coverage

# View coverage report (requires lcov)
genhtml coverage/lcov.info -o coverage/html
```

### Building

```bash
# Android APK
flutter build apk --release

# Android App Bundle (for Play Store)
flutter build appbundle --release

# iOS (requires macOS and Xcode)
flutter build ios --release

# Web
flutter build web --release

# Desktop
flutter build windows --release
flutter build macos --release
flutter build linux --release
```

## Troubleshooting

### Issue: "Waiting for another flutter command to release the startup lock"
```bash
# Delete the lock file
rm -rf ~/.flutter/bin/cache/lockfile

# Or on Windows
del %LOCALAPPDATA%\flutter\bin\cache\lockfile
```

### Issue: "Gradle build failed"
```bash
cd android
./gradlew clean
cd ..
flutter clean
flutter pub get
```

### Issue: "CocoaPods not installed" (iOS)
```bash
sudo gem install cocoapods
cd ios
pod install
cd ..
```

### Issue: Build runner conflicts
```bash
flutter pub run build_runner clean
flutter pub run build_runner build --delete-conflicting-outputs
```

### Issue: "Flutter doctor" shows issues
```bash
# Run flutter doctor
flutter doctor -v

# Follow the instructions for each issue
# For Android: Install Android Studio and Android SDK
# For iOS: Install Xcode (macOS only)
# For Web: Chrome should be installed
```

## Folder Structure Quick Reference

```
lib/
├── main.dart                   # Entry point
├── models/                     # Data models
├── services/                   # API & business logic
├── providers/                  # State management
├── game/                       # Flame game engine code
│   ├── slot_game.dart         # Main game class
│   └── components/            # Game components
├── screens/                    # App screens
│   ├── login_screen.dart
│   ├── game_screen.dart
│   └── ...
└── widgets/                    # Reusable widgets
```

## Adding New Features

### 1. Add a new model
```dart
// In lib/models/models.dart
@freezed
class MyNewModel with _$MyNewModel {
  const factory MyNewModel({
    required String id,
    required String name,
  }) = _MyNewModel;

  factory MyNewModel.fromJson(Map<String, dynamic> json) =>
      _$MyNewModelFromJson(json);
}

// Regenerate
flutter pub run build_runner build --delete-conflicting-outputs
```

### 2. Add a new API endpoint
```dart
// In lib/services/api_service.dart
Future<MyNewModel> getMyData() async {
  final response = await _dio.get('/my-endpoint');
  return MyNewModel.fromJson(response.data);
}
```

### 3. Add a new screen
```dart
// In lib/screens/my_new_screen.dart
class MyNewScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: Text('My Screen')),
      body: Center(child: Text('Hello')),
    );
  }
}

// Add to router in main.dart
GoRoute(
  path: '/my-screen',
  builder: (context, state) => MyNewScreen(),
),
```

## Performance Tips

1. **Use const constructors** wherever possible
2. **Lazy load images** with `CachedNetworkImage`
3. **Optimize Flame game**:
   - Limit sprite batch sizes
   - Use sprite sheets instead of individual images
   - Enable FPS counter in debug: `game.debugMode = true;`
4. **Profile your app**:
   ```bash
   flutter run --profile
   # Press 'P' to show performance overlay
   ```

## Resources

- [Flutter Documentation](https://flutter.dev/docs)
- [Flame Documentation](https://docs.flame-engine.org)
- [Rive Documentation](https://rive.app/community/doc/introduction/docgwj6iE7uo)
- [Riverpod Documentation](https://riverpod.dev)
- [Go Router Documentation](https://pub.dev/packages/go_router)

---

**Need Help?** Open an issue or check the README.md for more details.
