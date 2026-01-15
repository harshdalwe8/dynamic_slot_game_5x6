import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class AuthNotifier extends StateNotifier<AsyncValue<User?>> {
  final ApiService apiService;
  final SharedPreferences prefs;

  AuthNotifier({required this.apiService, required this.prefs})
      : super(const AsyncValue.data(null)) {
    _restoreSession();
  }

  Future<void> _restoreSession() async {
    final token = prefs.getString('auth_token');
    if (token != null) {
      apiService.setAuthToken(token);
      try {
        final user = await apiService.getCurrentUser();
        state = AsyncValue.data(user);
      } catch (e) {
        prefs.remove('auth_token');
        state = AsyncValue.error(e, StackTrace.current);
      }
    }
  }

  Future<void> login({
    required String email,
    required String password,
  }) async {
    state = const AsyncValue.loading();
    try {
      final response = await apiService.login(email: email, password: password);
      await prefs.setString('auth_token', response.token);
      apiService.setAuthToken(response.token);
      state = AsyncValue.data(response.user);
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      rethrow;
    }
  }

  Future<void> register({
    required String email,
    required String username,
    required String password,
    String? firstName,
    String? lastName,
  }) async {
    state = const AsyncValue.loading();
    try {
      final response = await apiService.register(
        email: email,
        username: username,
        password: password,
        firstName: firstName,
        lastName: lastName,
      );
      await prefs.setString('auth_token', response.token);
      apiService.setAuthToken(response.token);
      state = AsyncValue.data(response.user);
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      rethrow;
    }
  }

  Future<void> guestLogin() async {
    state = const AsyncValue.loading();
    try {
      final response = await apiService.guestLogin();
      await prefs.setString('auth_token', response.token);
      apiService.setAuthToken(response.token);
      state = AsyncValue.data(response.user);
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      rethrow;
    }
  }

  Future<void> logout() async {
    try {
      await apiService.logout();
      await prefs.remove('auth_token');
      state = const AsyncValue.data(null);
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      rethrow;
    }
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AsyncValue<User?>>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  // Simulating shared preferences - in real app, get it properly
  // For now, return a provider that requires manual initialization
  throw UnimplementedError('Auth provider needs SharedPreferences to be initialized');
});

// Helper provider for checking if user is authenticated
final isAuthenticatedProvider = Provider<bool>((ref) {
  final authState = ref.watch(authProvider);
  return authState.whenData((user) => user != null).value ?? false;
});

// Helper provider to check if user is admin
final isAdminProvider = Provider<bool>((ref) {
  final authState = ref.watch(authProvider);
  return authState.whenData((user) {
    if (user == null) return false;
    return user.role == 'SUPER_ADMIN' ||
        user.role == 'GAME_MANAGER' ||
        user.role == 'SUPPORT_STAFF';
  }).value ??
      false;
});
