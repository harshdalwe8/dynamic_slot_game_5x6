import 'package:freezed_annotation/freezed_annotation.dart';

part 'models.freezed.dart';
part 'models.g.dart';

// ==================== User Models ====================
@freezed
class User with _$User {
  const factory User({
    required String id,
    required String email,
    required String username,
    String? firstName,
    String? lastName,
    required String role,
    required double balance,
    String? referralCode,
    String? referredBy,
    bool? isGuest,
    required DateTime createdAt,
    DateTime? updatedAt,
  }) = _User;

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
}

@freezed
class AuthResponse with _$AuthResponse {
  const factory AuthResponse({
    required String token,
    required User user,
    String? refreshToken,
  }) = _AuthResponse;

  factory AuthResponse.fromJson(Map<String, dynamic> json) =>
      _$AuthResponseFromJson(json);
}

// ==================== Theme Models ====================
@freezed
class Theme with _$Theme {
  const factory Theme({
    required String id,
    required String name,
    required String description,
    String? backgroundUrl,
    required List<Symbol> symbols,
    required double minBet,
    required double maxBet,
    required double rtp,
    required bool isActive,
    String? createdBy,
    required DateTime createdAt,
    DateTime? updatedAt,
  }) = _Theme;

  factory Theme.fromJson(Map<String, dynamic> json) => _$ThemeFromJson(json);
}

@freezed
class Symbol with _$Symbol {
  const factory Symbol({
    required String id,
    required String name,
    required String imageUrl,
    required int multiplier,
    required int value,
  }) = _Symbol;

  factory Symbol.fromJson(Map<String, dynamic> json) => _$SymbolFromJson(json);
}

// ==================== Spin/Game Models ====================
@freezed
class SpinRequest with _$SpinRequest {
  const factory SpinRequest({
    required String themeId,
    required double betAmount,
    String? promoCode,
  }) = _SpinRequest;

  factory SpinRequest.fromJson(Map<String, dynamic> json) =>
      _$SpinRequestFromJson(json);

  Map<String, dynamic> toJson() => _$SpinRequestToJson(this);
}

@freezed
class SpinResult with _$SpinResult {
  const factory SpinResult({
    required String spinId,
    required String themeId,
    required List<int> reels,
    required List<Symbol> resultSymbols,
    required double winAmount,
    required double betAmount,
    required double newBalance,
    required bool isWin,
    String? message,
    required DateTime createdAt,
  }) = _SpinResult;

  factory SpinResult.fromJson(Map<String, dynamic> json) =>
      _$SpinResultFromJson(json);
}

// ==================== Wallet Models ====================
@freezed
class WalletTransaction with _$WalletTransaction {
  const factory WalletTransaction({
    required String id,
    required String type, // 'SPIN', 'DEPOSIT', 'WITHDRAWAL', 'REFERRAL_BONUS'
    required double amount,
    required double balanceBefore,
    required double balanceAfter,
    String? description,
    String? relatedSpinId,
    required DateTime createdAt,
  }) = _WalletTransaction;

  factory WalletTransaction.fromJson(Map<String, dynamic> json) =>
      _$WalletTransactionFromJson(json);
}

// ==================== Achievement Models ====================
@freezed
class Achievement with _$Achievement {
  const factory Achievement({
    required String id,
    required String name,
    required String description,
    String? imageUrl,
    required int requiredValue,
    String? category, // 'SPINS', 'WINNINGS', 'STREAKS'
  }) = _Achievement;

  factory Achievement.fromJson(Map<String, dynamic> json) =>
      _$AchievementFromJson(json);
}

@freezed
class UserAchievement with _$UserAchievement {
  const factory UserAchievement({
    required String achievementId,
    required Achievement achievement,
    required DateTime unlockedAt,
    int? progress,
  }) = _UserAchievement;

  factory UserAchievement.fromJson(Map<String, dynamic> json) =>
      _$UserAchievementFromJson(json);
}

// ==================== Leaderboard Models ====================
@freezed
class LeaderboardEntry with _$LeaderboardEntry {
  const factory LeaderboardEntry({
    required int rank,
    required String userId,
    required String username,
    required double score,
    int? consecutiveWins,
    DateTime? lastUpdated,
  }) = _LeaderboardEntry;

  factory LeaderboardEntry.fromJson(Map<String, dynamic> json) =>
      _$LeaderboardEntryFromJson(json);
}

// ==================== Payment Models ====================
@freezed
class PaymentLink with _$PaymentLink {
  const factory PaymentLink({
    required String id,
    required double amount,
    required String status, // 'PENDING', 'COMPLETED', 'FAILED', 'EXPIRED'
    String? paymentUrl,
    required DateTime createdAt,
    DateTime? completedAt,
  }) = _PaymentLink;

  factory PaymentLink.fromJson(Map<String, dynamic> json) =>
      _$PaymentLinkFromJson(json);
}

@freezed
class OfferCode with _$OfferCode {
  const factory OfferCode({
    required String id,
    required String code,
    required double bonusAmount,
    String? description,
    required DateTime expiresAt,
    bool? isUsed,
  }) = _OfferCode;

  factory OfferCode.fromJson(Map<String, dynamic> json) =>
      _$OfferCodeFromJson(json);
}

// ==================== Report Models ====================
@freezed
class RTPReport with _$RTPReport {
  const factory RTPReport({
    required String themeId,
    required double rtp,
    required int totalSpins,
    required double totalWinnings,
    required double totalBets,
    required DateTime reportDate,
  }) = _RTPReport;

  factory RTPReport.fromJson(Map<String, dynamic> json) =>
      _$RTPReportFromJson(json);
}

@freezed
class UserActivityReport with _$UserActivityReport {
  const factory UserActivityReport({
    required String userId,
    required int totalSpins,
    required double totalBet,
    required double totalWinnings,
    required double netProfit,
    required DateTime lastActive,
    required List<String> favoriteThemes,
  }) = _UserActivityReport;

  factory UserActivityReport.fromJson(Map<String, dynamic> json) =>
      _$UserActivityReportFromJson(json);
}

// ==================== Admin Models ====================
@freezed
class AdminUser with _$AdminUser {
  const factory AdminUser({
    required String id,
    required String email,
    required String role, // 'SUPER_ADMIN', 'GAME_MANAGER', 'SUPPORT_STAFF'
    required DateTime createdAt,
  }) = _AdminUser;

  factory AdminUser.fromJson(Map<String, dynamic> json) =>
      _$AdminUserFromJson(json);
}

@freezed
class AdminLog with _$AdminLog {
  const factory AdminLog({
    required String id,
    required String adminId,
    required String action,
    String? description,
    String? targetId,
    String? targetType,
    Map<String, dynamic>? changes,
    required DateTime createdAt,
  }) = _AdminLog;

  factory AdminLog.fromJson(Map<String, dynamic> json) =>
      _$AdminLogFromJson(json);
}
