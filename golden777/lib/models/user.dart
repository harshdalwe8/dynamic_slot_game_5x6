class User {
  final String id;
  final String email;
  final String username;
  final String? fullName;
  final double balance;
  final DateTime createdAt;
  final bool isAdmin;

  User({
    required this.id,
    required this.email,
    required this.username,
    this.fullName,
    required this.balance,
    required this.createdAt,
    required this.isAdmin,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      username: json['username'] ?? '',
      fullName: json['fullName'],
      balance: (json['balance'] ?? 0).toDouble(),
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toString()),
      isAdmin: json['isAdmin'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'username': username,
      'fullName': fullName,
      'balance': balance,
      'createdAt': createdAt.toIso8601String(),
      'isAdmin': isAdmin,
    };
  }
}
