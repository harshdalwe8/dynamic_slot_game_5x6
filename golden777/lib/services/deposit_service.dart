import 'package:dio/dio.dart';
import '../config/api_config.dart';

class DepositService {
  final Dio _dio = Dio();

  Future<List<dynamic>> getPaymentLinks(String token) async {
    try {
      final response = await _dio.get(
        ApiConfig.getPaymentLinksEndpoint,
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      if (response.statusCode == 200) {
        return response.data['paymentLinks'] ?? [];
      }
      throw Exception('Failed to load payment links');
    } catch (e) {
      throw Exception('Error loading payment links: $e');
    }
  }

  Future<Map<String, dynamic>> createDeposit(
    String token,
    double amount,
    String paymentMethod,
  ) async {
    try {
      final response = await _dio.post(
        ApiConfig.createDepositEndpoint,
        data: {
          'amount': amount,
          'paymentMethod': paymentMethod,
        },
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      if (response.statusCode == 201) {
        return response.data;
      }
      throw Exception('Failed to create deposit');
    } catch (e) {
      throw Exception('Error creating deposit: $e');
    }
  }
}
