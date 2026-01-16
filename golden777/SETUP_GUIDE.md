# Golden777 - Flutter Slot Game Application

A complete Flutter slot game application built with Flame game engine and Rive animations.

## Project Overview

Golden777 is a full-featured slot machine gaming platform with user authentication, wallet management, deposits, admin dashboard, and comprehensive reporting features.

## Technology Stack

- **Framework**: Flutter
- **Game Engine**: Flame 1.34.0
- **Animations**: Rive 0.14.1
- **State Management**: Provider
- **HTTP Client**: Dio & HTTP
- **Routing**: GoRouter 17.0.1
- **Local Storage**: SharedPreferences
- **Font Packages**: GoogleFonts

## Project Structure

```
lib/
├── config/
│   ├── api_config.dart          # API endpoints configuration
│   └── app_router.dart          # Navigation routing setup
├── game/
│   ├── slot_game_widget.dart    # Flame game widget wrapper
│   ├── slot_machine_game.dart   # Main game logic
│   └── reel.dart                # Individual reel component
├── models/
│   ├── user.dart                # User data model
│   ├── theme.dart               # Game theme model
│   └── spin_result.dart         # Spin result model
├── providers/
│   ├── auth_provider.dart       # Authentication state
│   ├── slot_provider.dart       # Slot game state
│   ├── wallet_provider.dart     # Wallet/balance state
│   └── theme_provider.dart      # App theme state
├── services/
│   ├── auth_service.dart        # Authentication API calls
│   ├── slot_service.dart        # Slot game API calls
│   ├── wallet_service.dart      # Wallet API calls
│   ├── deposit_service.dart     # Deposit API calls
│   ├── admin_service.dart       # Admin API calls
│   └── report_service.dart      # Reports API calls
├── screens/
│   ├── auth/
│   │   ├── login_screen.dart
│   │   └── register_screen.dart
│   ├── home/
│   │   └── home_screen.dart
│   ├── slot/
│   │   └── slot_machine_screen.dart
│   ├── wallet/
│   │   └── wallet_screen.dart
│   ├── deposit/
│   │   └── deposit_screen.dart
│   ├── admin/
│   │   └── admin_dashboard_screen.dart
│   ├── reports/
│   │   └── reports_screen.dart
│   └── settings/
│       └── settings_screen.dart
├── widgets/
│   └── (custom widgets)
├── utils/
│   └── (utility functions)
└── main.dart                    # App entry point
```

## Installation & Setup

### Prerequisites
- Flutter SDK (3.x or higher)
- Dart (included with Flutter)
- Android Studio / VS Code with Flutter extension

### Step 1: Navigate to Project Directory
```bash
cd golden777
```

### Step 2: Verify Flutter Installation
```bash
flutter doctor
```

### Step 3: Install Dependencies
All dependencies have been installed via flutter pub add:
```bash
flutter pub get
```

To view all installed packages:
```bash
flutter pub deps
```

### Step 4: Configure API Base URL
Edit `lib/config/api_config.dart` and update the baseUrl to match your backend:
```dart
static const String baseUrl = 'http://your-backend-url:3001/api';
```

## Running the Application

### Run on Android Device/Emulator
```bash
flutter run
```

### Run on iOS Device/Simulator
```bash
flutter run -d ios
```

### Run on Web
```bash
flutter run -d web-server
```

### Build Release APK (Android)
```bash
flutter build apk --release
```

### Build App Bundle (Android Play Store)
```bash
flutter build appbundle --release
```

### Build iOS App
```bash
flutter build ios --release
```

## Key Features

### 1. Authentication
- User registration with email and password
- Login with validation
- Session persistence using SharedPreferences
- Token-based API authentication

### 2. Slot Machine Game
- 3-reel slot machine with Flame engine
- Multiple game themes
- Customizable bet amounts
- Win/lose detection
- Smooth reel animations

### 3. Wallet Management
- Real-time balance display
- Transaction history
- Automatic balance updates after spins
- Deposit functionality

### 4. User Dashboard
- Quick access to all features
- Balance overview
- Navigation to deposit, wallet, and game

### 5. Deposit System
- Multiple payment method options
- Deposit amount input
- Payment processing integration

### 6. Admin Dashboard
- User statistics
- Revenue tracking
- Active games monitoring
- Win rate analytics

### 7. Reports & Analytics
- Personal gameplay statistics
- Win/loss tracking
- Performance metrics

### 8. Settings
- Dark mode toggle
- Password management
- Two-factor authentication options

## API Integration

The app communicates with a backend API for:
- User authentication
- Game state management
- Balance updates
- Spin results
- Reporting and analytics

### Required Backend Endpoints

1. **Authentication**
   - POST `/api/auth/login`
   - POST `/api/auth/register`
   - GET `/api/auth/me`
   - POST `/api/auth/logout`

2. **Slot Game**
   - GET `/api/slot/themes`
   - POST `/api/slot/spin`
   - POST `/api/slot/theme`

3. **Wallet**
   - GET `/api/wallet/balance`
   - POST `/api/wallet/update`

4. **Deposits**
   - GET `/api/deposit/payment-links`
   - POST `/api/deposit/create`

5. **Admin**
   - GET `/api/admin/stats`
   - GET `/api/admin/users`

6. **Reports**
   - GET `/api/report/analytics`

## Flame Game Engine Implementation

### Slot Machine Game Features
- **Reel System**: 3 independent reels with symbols
- **Spin Animation**: Smooth spinning animation with staggered timing
- **Win Detection**: Matches symbols to determine wins
- **Symbol Display**: Emoji-based symbols for visual feedback

### Game Components
- **SlotMachineGame**: Main game class extending FlameGame
- **Reel**: Individual reel component with rotation and symbol display
- **SlotGameWidget**: Flutter widget wrapper for the Flame game

### Customization
To add new symbols, edit `lib/game/reel.dart`:
```dart
static const List<String> symbols = ['🍒', '🍋', '🍊', '🍇', '🎰', '💎'];
```

## Rive Animation Integration

To integrate Rive animations:
1. Import Rive package in your screen
2. Add Rive animation files to assets
3. Use `RiveAnimation` widget to display animations
4. Trigger animations on game events

Example:
```dart
import 'package:rive/rive.dart';

RiveAnimation.asset(
  'assets/animations/win.riv',
  onInit: (Artboard artboard) {
    // Trigger animation
  },
)
```

## State Management (Provider)

The app uses Provider package for state management:

### Providers
1. **AuthProvider**: Manages user login, registration, and session
2. **SlotProvider**: Manages game state, themes, and spins
3. **WalletProvider**: Manages user balance and transactions
4. **ThemeProvider**: Manages app-wide theme preferences

### Usage
```dart
// Access provider
final authProvider = Provider.of<AuthProvider>(context);

// Using Consumer widget
Consumer<AuthProvider>(
  builder: (context, authProvider, _) {
    return Text(authProvider.user?.email ?? 'Not logged in');
  },
)
```

## Debugging

### Enable Debug Output
```bash
flutter run -v
```

### Check Flutter Logs
```bash
flutter logs
```

### Hot Reload During Development
Press 'r' in terminal while running app

### Hot Restart
Press 'R' in terminal for full app restart

## Production Build Checklist

- [ ] Update API endpoints for production
- [ ] Remove debug banners
- [ ] Test all authentication flows
- [ ] Verify payment integration
- [ ] Test on real devices
- [ ] Enable ProGuard for Android (build.gradle)
- [ ] Set up proper error handling and logging
- [ ] Configure app signing certificates

## Troubleshooting

### Common Issues

**Issue**: Build fails with "Plugin requires Android API level 31"
**Solution**: Update `android/app/build.gradle`:
```gradle
android {
    compileSdkVersion 33
    ...
}
```

**Issue**: Hot reload doesn't work
**Solution**: Run `flutter clean` and rebuild

**Issue**: Dio HTTP requests failing
**Solution**: Check API base URL in `api_config.dart` and ensure backend is running

## Environment Configuration

Create `.env` file in project root (optional):
```
BACKEND_URL=http://localhost:3001
ENVIRONMENT=development
```

## Performance Optimization

- Use `const` constructors where possible
- Avoid rebuilding unnecessary widgets
- Use `RepaintBoundary` for expensive rendering
- Profile app with DevTools: `flutter pub global run devtools`

## Contributing Guidelines

1. Create feature branches from develop
2. Follow Dart/Flutter style guide
3. Write widget tests for new screens
4. Test on multiple devices before merging
5. Update documentation

## License

Copyright © 2024 Golden777. All rights reserved.

## Support

For issues and feature requests, contact: support@golden777.com

---

**Last Updated**: January 2026
**App Version**: 1.0.0
**Flutter Version**: 3.x+
**Dart Version**: 3.x+
