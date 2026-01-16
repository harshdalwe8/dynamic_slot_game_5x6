import 'package:dio/dio.dart';
import '../config/api_config.dart';
import '../models/user.dart';

class AuthService {
  final Dio _dio = Dio();

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await _dio.post(
        ApiConfig.loginEndpoint,
        data: {
          'email': email,
          'password': password,
        },
      );

      if (response.statusCode == 200) {
        return {
          'user': User.fromJson(response.data['user']),
          'token': response.data['token'],
        };
      }
      throw Exception('Login failed');
    } catch (e) {
      throw Exception('Login error: $e');
    }
  }

  Future<Map<String, dynamic>> register(
    String email,
    String username,
    String password,
  ) async {
    try {
      final response = await _dio.post(
        ApiConfig.registerEndpoint,
        data: {
          'email': email,
          'username': username,
          'password': password,
        },
      );

      if (response.statusCode == 201) {
        return {
          'user': User.fromJson(response.data['user']),
          'token': response.data['token'],
        };
      }
      throw Exception('Registration failed');
    } catch (e) {
      throw Exception('Registration error: $e');
    }
  }

  Future<User> getCurrentUser(String token) async {
    try {
      final response = await _dio.get(
        '${ApiConfig.baseUrl}/auth/me',
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      if (response.statusCode == 200) {
        return User.fromJson(response.data);
      }
      throw Exception('Failed to get current user');
    } catch (e) {
      throw Exception('Error getting current user: $e');
    }
  }

  Future<void> logout(String token) async {
    try {
      await _dio.post(
        ApiConfig.logoutEndpoint,
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );
    } catch (e) {
      throw Exception('Logout error: $e');
    }
  }
}
