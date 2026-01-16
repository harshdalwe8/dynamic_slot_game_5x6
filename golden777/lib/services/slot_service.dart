import 'package:dio/dio.dart';
import '../config/api_config.dart';
import '../models/theme.dart';
import '../models/spin_result.dart';

class SlotService {
  final Dio _dio = Dio();

  Future<List<Theme>> getThemes(String token) async {
    try {
      final response = await _dio.get(
        ApiConfig.getThemesEndpoint,
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['themes'] ?? [];
        return data.map((t) => Theme.fromJson(t as Map<String, dynamic>)).toList();
      }
      throw Exception('Failed to load themes');
    } catch (e) {
      throw Exception('Error loading themes: $e');
    }
  }

  Future<SpinResult> spin(String token, String themeId, int betAmount) async {
    try {
      final response = await _dio.post(
        ApiConfig.spinEndpoint,
        data: {
          'themeId': themeId,
          'betAmount': betAmount,
        },
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      if (response.statusCode == 200) {
        return SpinResult.fromJson(response.data['spinResult']);
      }
      throw Exception('Spin failed');
    } catch (e) {
      throw Exception('Spin error: $e');
    }
  }

  Future<void> selectTheme(String token, String themeId) async {
    try {
      await _dio.post(
        ApiConfig.selectThemeEndpoint,
        data: {'themeId': themeId},
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );
    } catch (e) {
      throw Exception('Error selecting theme: $e');
    }
  }
}
