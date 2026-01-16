class Theme {
  final String id;
  final String name;
  final String description;
  final String image;
  final int minBet;
  final int maxBet;
  final double rtp;
  final DateTime createdAt;

  Theme({
    required this.id,
    required this.name,
    required this.description,
    required this.image,
    required this.minBet,
    required this.maxBet,
    required this.rtp,
    required this.createdAt,
  });

  factory Theme.fromJson(Map<String, dynamic> json) {
    return Theme(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      image: json['image'] ?? '',
      minBet: json['minBet'] ?? 1,
      maxBet: json['maxBet'] ?? 100,
      rtp: (json['rtp'] ?? 96.5).toDouble(),
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toString()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'image': image,
      'minBet': minBet,
      'maxBet': maxBet,
      'rtp': rtp,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
