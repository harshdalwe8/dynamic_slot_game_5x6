import 'package:dio/dio.dart';
import '../config/api_config.dart';

class AdminService {
  final Dio _dio = Dio();

  Future<Map<String, dynamic>> getStats(String token) async {
    try {
      final response = await _dio.get(
        ApiConfig.getAdminStatsEndpoint,
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      if (response.statusCode == 200) {
        return response.data;
      }
      throw Exception('Failed to load admin stats');
    } catch (e) {
      throw Exception('Error loading admin stats: $e');
    }
  }

  Future<List<dynamic>> getUsers(String token) async {
    try {
      final response = await _dio.get(
        ApiConfig.getUsersEndpoint,
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      if (response.statusCode == 200) {
        return response.data['users'] ?? [];
      }
      throw Exception('Failed to load users');
    } catch (e) {
      throw Exception('Error loading users: $e');
    }
  }
}
