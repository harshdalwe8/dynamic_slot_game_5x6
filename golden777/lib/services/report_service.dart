import 'package:dio/dio.dart';
import '../config/api_config.dart';

class ReportService {
  final Dio _dio = Dio();

  Future<Map<String, dynamic>> getAnalytics(String token) async {
    try {
      final response = await _dio.get(
        ApiConfig.getReportsEndpoint,
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      if (response.statusCode == 200) {
        return response.data;
      }
      throw Exception('Failed to load analytics');
    } catch (e) {
      throw Exception('Error loading analytics: $e');
    }
  }
}
