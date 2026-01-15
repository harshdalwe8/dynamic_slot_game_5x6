import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/models.dart';

class ApiService {
  final Dio _dio;
  final String baseUrl;
  String? _authToken;

  ApiService({
    required this.baseUrl,
    String? initialToken,
  })  : _dio = Dio(
          BaseOptions(
            baseUrl: baseUrl,
            connectTimeout: const Duration(seconds: 30),
            receiveTimeout: const Duration(seconds: 30),
            sendTimeout: const Duration(seconds: 30),
          ),
        ),
        _authToken = initialToken {
    _setupInterceptors();
  }

  void _setupInterceptors() {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          if (_authToken != null) {
            options.headers['Authorization'] = 'Bearer $_authToken';
          }
          return handler.next(options);
        },
        onError: (error, handler) {
          if (error.response?.statusCode == 401) {
            // Token expired, need to refresh
            return handler.next(error);
          }
          return handler.next(error);
        },
      ),
    );
  }

  void setAuthToken(String token) {
    _authToken = token;
  }

  void clearAuthToken() {
    _authToken = null;
  }

  // ==================== Authentication ====================
  Future<AuthResponse> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _dio.post(
        '/auth/login',
        data: {'email': email, 'password': password},
      );
      final authResponse = AuthResponse.fromJson(response.data);
      setAuthToken(authResponse.token);
      return authResponse;
    } catch (e) {
      rethrow;
    }
  }

  Future<AuthResponse> register({
    required String email,
    required String username,
    required String password,
    String? firstName,
    String? lastName,
  }) async {
    try {
      final response = await _dio.post(
        '/auth/register',
        data: {
          'email': email,
          'username': username,
          'password': password,
          'firstName': firstName,
          'lastName': lastName,
        },
      );
      final authResponse = AuthResponse.fromJson(response.data);
      setAuthToken(authResponse.token);
      return authResponse;
    } catch (e) {
      rethrow;
    }
  }

  Future<void> logout() async {
    try {
      await _dio.post('/auth/logout');
      clearAuthToken();
    } catch (e) {
      // Even if logout fails on server, clear local token
      clearAuthToken();
      rethrow;
    }
  }

  Future<User> getCurrentUser() async {
    final response = await _dio.get('/auth/me');
    return User.fromJson(response.data);
  }

  Future<AuthResponse> guestLogin() async {
    final response = await _dio.post('/auth/guest');
    final authResponse = AuthResponse.fromJson(response.data);
    setAuthToken(authResponse.token);
    return authResponse;
  }

  // ==================== Player API ====================
  Future<double> getWalletBalance() async {
    final response = await _dio.get('/player/wallet');
    return (response.data['balance'] as num).toDouble();
  }

  Future<List<WalletTransaction>> getTransactionHistory({
    int page = 1,
    int limit = 20,
  }) async {
    final response = await _dio.get(
      '/player/transactions',
      queryParameters: {'page': page, 'limit': limit},
    );
    return (response.data['transactions'] as List)
        .map((e) => WalletTransaction.fromJson(e))
        .toList();
  }

  Future<SpinResult> spinSlot({
    required String themeId,
    required double betAmount,
    String? promoCode,
  }) async {
    final response = await _dio.post(
      '/player/spin',
      data: {
        'themeId': themeId,
        'betAmount': betAmount,
        'promoCode': promoCode,
      },
    );
    return SpinResult.fromJson(response.data);
  }

  Future<List<SlotTheme>> getActiveThemes() async {
    final response = await _dio.get('/player/themes/active');
    return (response.data['themes'] as List)
        .map((e) => SlotTheme.fromJson(e))
        .toList();
  }

  Future<SlotTheme> getThemeDetails(String themeId) async {
    final response = await _dio.get('/player/themes/$themeId');
    return SlotTheme.fromJson(response.data);
  }

  Future<List<UserAchievement>> getUserAchievements() async {
    final response = await _dio.get('/player/achievements');
    return (response.data['achievements'] as List)
        .map((e) => UserAchievement.fromJson(e))
        .toList();
  }

  Future<List<LeaderboardEntry>> getLeaderboard({
    int limit = 50,
    String timeframe = 'week', // 'day', 'week', 'month', 'all'
  }) async {
    final response = await _dio.get(
      '/player/leaderboard',
      queryParameters: {'limit': limit, 'timeframe': timeframe},
    );
    return (response.data['entries'] as List)
        .map((e) => LeaderboardEntry.fromJson(e))
        .toList();
  }

  Future<String> generateReferralCode() async {
    final response = await _dio.post('/player/referral/generate');
    return response.data['referralCode'];
  }

  Future<String> regenerateReferralCode() async {
    final response = await _dio.post('/player/referral/regenerate');
    return response.data['referralCode'];
  }

  // ==================== Admin API ====================
  Future<AuthResponse> adminLogin({
    required String email,
    required String password,
  }) async {
    final response = await _dio.post(
      '/admin/auth/login',
      data: {'email': email, 'password': password},
    );
    final authResponse = AuthResponse.fromJson(response.data);
    setAuthToken(authResponse.token);
    return authResponse;
  }

  Future<List<SlotTheme>> getAllThemes() async {
    final response = await _dio.get('/admin/themes');
    return (response.data['themes'] as List)
        .map((e) => SlotTheme.fromJson(e))
        .toList();
  }

  Future<SlotTheme> createTheme({
    required String name,
    required String description,
    required List<Map<String, dynamic>> symbols,
    required double minBet,
    required double maxBet,
    required double rtp,
  }) async {
    final response = await _dio.post(
      '/admin/themes',
      data: {
        'name': name,
        'description': description,
        'symbols': symbols,
        'minBet': minBet,
        'maxBet': maxBet,
        'rtp': rtp,
      },
    );
    return SlotTheme.fromJson(response.data);
  }

  Future<SlotTheme> updateTheme({
    required String themeId,
    String? name,
    String? description,
    double? minBet,
    double? maxBet,
    double? rtp,
  }) async {
    final response = await _dio.put(
      '/admin/themes/$themeId',
      data: {
        if (name != null) 'name': name,
        if (description != null) 'description': description,
        if (minBet != null) 'minBet': minBet,
        if (maxBet != null) 'maxBet': maxBet,
        if (rtp != null) 'rtp': rtp,
      },
    );
    return SlotTheme.fromJson(response.data);
  }

  Future<RTPReport> getRTPReport(String themeId) async {
    final response = await _dio.get('/admin/reports/rtp/$themeId');
    return RTPReport.fromJson(response.data);
  }

  Future<List<AdminLog>> getAdminLogs({
    int page = 1,
    int limit = 50,
  }) async {
    final response = await _dio.get(
      '/admin/logs',
      queryParameters: {'page': page, 'limit': limit},
    );
    return (response.data['logs'] as List)
        .map((e) => AdminLog.fromJson(e))
        .toList();
  }

  // ==================== Deposits & Payments ====================
  Future<PaymentLink> createDepositLink(double amount) async {
    final response = await _dio.post(
      '/deposits/create-link',
      data: {'amount': amount},
    );
    return PaymentLink.fromJson(response.data);
  }

  Future<PaymentLink> checkDepositStatus(String linkId) async {
    final response = await _dio.get('/deposits/status/$linkId');
    return PaymentLink.fromJson(response.data);
  }

  // ==================== Offer Codes ====================
  Future<OfferCode> validateOfferCode(String code) async {
    final response = await _dio.post(
      '/offer-codes/validate',
      data: {'code': code},
    );
    return OfferCode.fromJson(response.data);
  }

  Future<void> applyOfferCode(String code) async {
    await _dio.post(
      '/offer-codes/apply',
      data: {'code': code},
    );
  }
}

// Providers
final apiServiceProvider = Provider<ApiService>((ref) {
  return ApiService(
    baseUrl: 'http://localhost:3000/api', // Change to your backend URL
  );
});

final currentUserProvider = FutureProvider<User>((ref) async {
  final apiService = ref.watch(apiServiceProvider);
  return apiService.getCurrentUser();
});

final walletBalanceProvider = FutureProvider<double>((ref) async {
  final apiService = ref.watch(apiServiceProvider);
  return apiService.getWalletBalance();
});

final activeThemesProvider = FutureProvider<List<SlotTheme>>((ref) async {
  final apiService = ref.watch(apiServiceProvider);
  return apiService.getActiveThemes();
});

final leaderboardProvider = FutureProvider.family<List<LeaderboardEntry>, String>(
  (ref, timeframe) async {
    final apiService = ref.watch(apiServiceProvider);
    return apiService.getLeaderboard(timeframe: timeframe);
  },
);

final userAchievementsProvider = FutureProvider<List<UserAchievement>>((ref) async {
  final apiService = ref.watch(apiServiceProvider);
  return apiService.getUserAchievements();
});
