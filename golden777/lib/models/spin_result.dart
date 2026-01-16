class SpinResult {
  final String id;
  final List<String> symbols;
  final int winAmount;
  final bool isWin;
  final String payline;
  final DateTime timestamp;

  SpinResult({
    required this.id,
    required this.symbols,
    required this.winAmount,
    required this.isWin,
    required this.payline,
    required this.timestamp,
  });

  factory SpinResult.fromJson(Map<String, dynamic> json) {
    return SpinResult(
      id: json['id'] ?? '',
      symbols: List<String>.from(json['symbols'] ?? []),
      winAmount: json['winAmount'] ?? 0,
      isWin: json['isWin'] ?? false,
      payline: json['payline'] ?? '',
      timestamp: DateTime.parse(json['timestamp'] ?? DateTime.now().toString()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'symbols': symbols,
      'winAmount': winAmount,
      'isWin': isWin,
      'payline': payline,
      'timestamp': timestamp.toIso8601String(),
    };
  }
}
