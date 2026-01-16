import 'package:dio/dio.dart';
import '../config/api_config.dart';

class WalletService {
  final Dio _dio = Dio();

  Future<double> getBalance(String token) async {
    try {
      final response = await _dio.get(
        ApiConfig.getWalletEndpoint,
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      if (response.statusCode == 200) {
        return (response.data['balance'] ?? 0).toDouble();
      }
      throw Exception('Failed to get balance');
    } catch (e) {
      throw Exception('Error getting balance: $e');
    }
  }

  Future<double> updateBalance(String token, double amount) async {
    try {
      final response = await _dio.post(
        ApiConfig.updateWalletEndpoint,
        data: {'amount': amount},
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      if (response.statusCode == 200) {
        return (response.data['balance'] ?? 0).toDouble();
      }
      throw Exception('Failed to update balance');
    } catch (e) {
      throw Exception('Error updating balance: $e');
    }
  }
}
