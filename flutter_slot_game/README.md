# 🎰 Flutter Slot Game App

A complete Flutter conversion of the dynamic slot game system, built with **Flame** game engine for smooth slot animations and **Rive** for UI animations.

## ✨ Features

- **Flame Game Engine Integration**: Smooth, physics-based slot reel spinning
- **Rive Animations**: Beautiful UI transitions and effects
- **Complete API Integration**: Full backend API support
- **State Management**: Using Riverpod for reactive state management
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Real-time Balance Updates**: Instant wallet synchronization
- **Multiple Themes**: Support for various slot game themes
- **Gamification**: Achievements, leaderboards, and rewards
- **Admin Panel**: Complete admin dashboard for management

## 🏗️ Architecture

```
flutter_slot_game/
├── lib/
│   ├── main.dart                 # App entry point
│   ├── models/
│   │   └── models.dart           # All data models with Freezed
│   ├── services/
│   │   └── api_service.dart      # API client & providers
│   ├── providers/
│   │   └── auth_provider.dart    # Authentication state
│   ├── game/
│   │   ├── slot_game.dart        # Flame game implementation
│   │   └── components/
│   │       └── slot_game_component.dart
│   ├── screens/
│   │   ├── login_screen.dart
│   │   ├── register_screen.dart
│   │   ├── home_screen.dart
│   │   ├── game_screen.dart
│   │   ├── wallet_screen.dart
│   │   ├── admin_login_screen.dart
│   │   └── admin_panel_screen.dart
│   └── widgets/                  # Reusable widgets
├── assets/
│   ├── images/
│   ├── animations/              # Rive animation files (.riv)
│   ├── sounds/
│   └── themes/
└── pubspec.yaml
```

## 🚀 Getting Started

### Prerequisites

- Flutter SDK (3.0 or higher)
- Dart SDK (3.0 or higher)
- Android Studio / Xcode (for mobile development)
- Backend API running (from ../backend)

### Installation

1. **Install dependencies:**
   ```bash
   flutter pub get
   ```

2. **Generate code (for Freezed models):**
   ```bash
   flutter pub run build_runner build --delete-conflicting-outputs
   ```

3. **Update API URL:**
   Edit `lib/services/api_service.dart` and change the `baseUrl`:
   ```dart
   baseUrl: 'http://YOUR_BACKEND_URL:3000/api',
   ```

4. **Run the app:**
   ```bash
   # For mobile
   flutter run
   
   # For web
   flutter run -d chrome
   
   # For desktop (Windows)
   flutter run -d windows
   ```

## 🎮 Flame Game Engine

The slot game uses Flame for rendering and animation:

### Key Components

1. **SlotGame**: Main game class managing reels and game state
2. **SlotMachineReel**: Individual reel component with spin animation
3. **Symbol Components**: Visual representation of slot symbols

### Spin Animation Flow

```dart
// 1. User presses spin button
// 2. API call to backend for spin result
// 3. Start reel animations
reel1.startSpin();
reel2.startSpin();
reel3.startSpin();

// 4. Staggered stopping with result
await Future.delayed(Duration(milliseconds: 500));
reel1.stopAt(result[0]);

await Future.delayed(Duration(milliseconds: 300));
reel2.stopAt(result[1]);

await Future.delayed(Duration(milliseconds: 300));
reel3.stopAt(result[2]);

// 5. Show win/loss animation
```

## 🎨 Rive Animations

Rive is used for UI animations throughout the app:

### Adding Rive Animations

1. **Create animations in Rive Editor** (https://rive.app)
2. **Export as .riv files**
3. **Place in `assets/animations/`**
4. **Load and use:**

```dart
import 'package:rive/rive.dart';

RiveAnimation.asset(
  'assets/animations/coin_spin.riv',
  animations: ['Spin'],
)
```

### Recommended Rive Animations

- `coin_spin.riv` - Coin spinning for wins
- `confetti.riv` - Celebration for big wins
- `loader.riv` - Loading states
- `button_press.riv` - Button interactions
- `reel_spin.riv` - Reel movement effect

## 🗄️ State Management (Riverpod)

### Providers

```dart
// API Service
final apiServiceProvider = Provider<ApiService>((ref) => ...);

// Current User
final currentUserProvider = FutureProvider<User>((ref) async => ...);

// Wallet Balance
final walletBalanceProvider = FutureProvider<double>((ref) async => ...);

// Active Themes
final activeThemesProvider = FutureProvider<List<Theme>>((ref) async => ...);

// Leaderboard
final leaderboardProvider = FutureProvider.family<List<LeaderboardEntry>, String>(
  (ref, timeframe) async => ...
);
```

### Using Providers

```dart
class MyWidget extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final balance = ref.watch(walletBalanceProvider);
    
    return balance.when(
      data: (value) => Text('Balance: \$${value.toStringAsFixed(2)}'),
      loading: () => CircularProgressIndicator(),
      error: (error, stack) => Text('Error: $error'),
    );
  }
}
```

## 📱 Screens Overview

### Player Screens
- **Login**: Email/password login or guest mode
- **Register**: New user registration
- **Home**: Theme selection and navigation
- **Game**: Main slot game with Flame engine
- **Wallet**: Balance, deposits, withdrawals, transaction history
- **Profile**: User details, achievements, referral code
- **Leaderboard**: Rankings and competitions

### Admin Screens
- **Admin Login**: Separate admin authentication
- **Admin Dashboard**: Overview and quick actions
- **Theme Management**: Create, edit, activate themes
- **User Management**: View and manage users
- **Reports**: RTP reports, activity analytics
- **Settings**: System configuration

## 🔧 Development

### Code Generation

Run when you modify Freezed models:
```bash
flutter pub run build_runner watch
```

### Testing

```bash
# Run all tests
flutter test

# Run with coverage
flutter test --coverage
```

### Building for Production

```bash
# Android
flutter build apk --release
flutter build appbundle --release

# iOS
flutter build ios --release

# Web
flutter build web --release

# Desktop
flutter build windows --release
flutter build macos --release
flutter build linux --release
```

## 🎯 Key Dependencies

| Package | Purpose |
|---------|---------|
| `flame` | Game engine for slot animations |
| `rive` | UI animations |
| `flutter_riverpod` | State management |
| `dio` | HTTP client for API calls |
| `go_router` | Navigation |
| `freezed` | Immutable models |
| `shared_preferences` | Local storage |
| `google_fonts` | Custom fonts |

## 🌐 API Configuration

Update the API URL in `lib/services/api_service.dart`:

```dart
final apiServiceProvider = Provider<ApiService>((ref) {
  return ApiService(
    baseUrl: 'http://localhost:3000/api', // Change this
  );
});
```

For production, use environment variables:

```dart
import 'package:flutter_dotenv/flutter_dotenv.dart';

final apiServiceProvider = Provider<ApiService>((ref) {
  return ApiService(
    baseUrl: dotenv.env['API_URL'] ?? 'http://localhost:3000/api',
  );
});
```

## 📦 Assets Structure

```
assets/
├── images/
│   ├── logo.png
│   └── symbols/
│       ├── cherry.png
│       ├── diamond.png
│       ├── gold.png
│       └── jackpot.png
├── animations/
│   ├── coin_spin.riv
│   ├── confetti.riv
│   ├── loader.riv
│   └── button_press.riv
├── sounds/
│   ├── spin.mp3
│   ├── win.mp3
│   └── coin.mp3
└── themes/
    ├── classic/
    ├── ocean/
    └── space/
```

## 🔐 Security

- Token-based authentication (JWT)
- Secure local storage with encryption
- HTTPS-only communication in production
- Input validation on all forms
- Protected routes with authentication guards

## 🚧 TODO / Next Steps

- [ ] Complete all screen implementations
- [ ] Add Rive animation files
- [ ] Implement sound effects
- [ ] Add haptic feedback
- [ ] Optimize Flame game performance
- [ ] Add offline mode support
- [ ] Implement push notifications
- [ ] Add analytics integration
- [ ] Complete unit and widget tests
- [ ] Set up CI/CD pipeline

## 📄 License

Same license as the main project.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For issues and questions, please open an issue in the main repository.

---

**Happy Gaming! 🎰✨**
