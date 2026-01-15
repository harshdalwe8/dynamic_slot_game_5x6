class AppConfig {
  // API Configuration
  static const String apiBaseUrl =
      String.fromEnvironment('API_URL', defaultValue: 'http://localhost:3000/api');

  static const String environment =
      String.fromEnvironment('ENVIRONMENT', defaultValue: 'development');

  static const bool isProduction = environment == 'production';
  static const bool isDevelopment = environment == 'development';

  // App Configuration
  static const String appName = '🎰 Slot Game';
  static const String appVersion = '1.0.0';

  // Game Configuration
  static const int reelCount = 3;
  static const int symbolsPerReel = 5;
  static const double minBetAmount = 1.0;
  static const double maxBetAmount = 100.0;
  static const double defaultBetAmount = 10.0;

  // Animation Configuration
  static const Duration spinDuration = Duration(seconds: 2);
  static const Duration reelStopDelay = Duration(milliseconds: 300);
  static const Duration winAnimationDuration = Duration(seconds: 1);

  // Cache Configuration
  static const Duration cacheExpiration = Duration(minutes: 5);
  static const int maxCachedThemes = 20;

  // Network Configuration
  static const Duration apiTimeout = Duration(seconds: 30);
  static const int maxRetries = 3;

  // Local Storage Keys
  static const String authTokenKey = 'auth_token';
  static const String userIdKey = 'user_id';
  static const String lastThemeKey = 'last_theme';
  static const String soundEnabledKey = 'sound_enabled';
  static const String musicEnabledKey = 'music_enabled';

  // Asset Paths
  static const String imagesPath = 'assets/images/';
  static const String animationsPath = 'assets/animations/';
  static const String soundsPath = 'assets/sounds/';
  static const String themesPath = 'assets/themes/';

  // Rive Animation Files
  static const String coinSpinAnimation = '${animationsPath}coin_spin.riv';
  static const String confettiAnimation = '${animationsPath}confetti.riv';
  static const String loaderAnimation = '${animationsPath}loader.riv';
  static const String buttonPressAnimation = '${animationsPath}button_press.riv';

  // Sound Files
  static const String spinSound = '${soundsPath}spin.mp3';
  static const String winSound = '${soundsPath}win.mp3';
  static const String coinSound = '${soundsPath}coin.mp3';
  static const String backgroundMusic = '${soundsPath}background.mp3';

  // Colors
  static const int primaryColorValue = 0xFFFF9800; // Orange
  static const int secondaryColorValue = 0xFF2196F3; // Blue
  static const int backgroundColor = 0xFF0A0E27;
  static const int cardColor = 0xFF1a1f3a;

  // Feature Flags
  static const bool enableSounds = true;
  static const bool enableHaptics = true;
  static const bool enableAnalytics = isProduction;
  static const bool enableCrashReporting = isProduction;

  // Logging
  static const bool enableLogging = isDevelopment;
  static const bool enableNetworkLogging = isDevelopment;

  // Sentry Configuration (if enabled)
  static const String sentryDsn = String.fromEnvironment(
    'SENTRY_DSN',
    defaultValue: '',
  );
}
