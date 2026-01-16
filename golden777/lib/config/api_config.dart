class ApiConfig {
  static const String baseUrl = 'http://localhost:3001/api';
  
  // Auth endpoints
  static const String loginEndpoint = '$baseUrl/auth/login';
  static const String registerEndpoint = '$baseUrl/auth/register';
  static const String logoutEndpoint = '$baseUrl/auth/logout';
  
  // Slot endpoints
  static const String spinEndpoint = '$baseUrl/slot/spin';
  static const String getThemesEndpoint = '$baseUrl/slot/themes';
  static const String selectThemeEndpoint = '$baseUrl/slot/theme';
  
  // Wallet endpoints
  static const String getWalletEndpoint = '$baseUrl/wallet/balance';
  static const String updateWalletEndpoint = '$baseUrl/wallet/update';
  
  // Deposit endpoints
  static const String getPaymentLinksEndpoint = '$baseUrl/deposit/payment-links';
  static const String createDepositEndpoint = '$baseUrl/deposit/create';
  
  // Admin endpoints
  static const String getAdminStatsEndpoint = '$baseUrl/admin/stats';
  static const String getUsersEndpoint = '$baseUrl/admin/users';
  
  // Report endpoints
  static const String getReportsEndpoint = '$baseUrl/report/analytics';
}
