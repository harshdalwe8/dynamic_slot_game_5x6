import 'package:flame/game.dart';
import 'package:flame/events.dart';
import 'package:flame/components.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/models.dart';

class SlotGameComponent extends PositionComponent {
  final List<String> symbolNames;
  final int reelCount;
  final int symbolsPerReel;
  final VoidCallback? onSpinStart;
  final VoidCallback? onSpinEnd;

  late List<List<int>> reels; // Current reel positions
  late List<List<int>> targetReels; // Target positions after spin
  bool isSpinning = false;
  double spinSpeed = 0.0;
  final double maxSpinSpeed = 100.0;
  double spinAcceleration = 10.0;

  SlotGameComponent({
    required this.symbolNames,
    this.reelCount = 3,
    this.symbolsPerReel = 5,
    this.onSpinStart,
    this.onSpinEnd,
  }) {
    // Initialize reels
    reels = List.generate(
      reelCount,
      (i) => List.generate(symbolsPerReel, (j) => (i * 10 + j) % symbolNames.length),
    );
    targetReels = List.from(reels);
  }

  @override
  Future<void> onLoad() async {
    await super.onLoad();
    size = Vector2(300, 400);
    position = Vector2(20, 50);
  }

  void startSpin(List<int> targetSymbols) {
    if (isSpinning) return;

    isSpinning = true;
    spinSpeed = 0;
    onSpinStart?.call();

    // Set target positions
    targetReels = List.generate(
      reelCount,
      (i) => [
        targetSymbols[i],
        (targetSymbols[i] + 1) % symbolNames.length,
        (targetSymbols[i] + 2) % symbolNames.length,
      ],
    );
  }

  @override
  void update(double dt) {
    super.update(dt);

    if (!isSpinning) return;

    // Accelerate spin
    if (spinSpeed < maxSpinSpeed) {
      spinSpeed += spinAcceleration;
    }

    // Move reels
    for (int i = 0; i < reels.length; i++) {
      for (int j = 0; j < reels[i].length; j++) {
        reels[i][j] = (reels[i][j] + (spinSpeed * dt).toInt()) % symbolNames.length;
      }
    }

    // Check if spin should stop (simplified check)
    if (spinSpeed >= maxSpinSpeed * 0.8) {
      // You would implement proper stop logic here
      // For now, after sufficient time, stop the spin
      isSpinning = false;
      onSpinEnd?.call();
    }
  }

  @override
  void render(Canvas canvas) {
    super.render(canvas);

    final paint = Paint()
      ..color = const Color(0xFF1a1a1a)
      ..style = PaintingStyle.fill;

    final symbolSize = 80.0;
    final reelSpacing = 100.0;
    final reelWidth = 90.0;
    final reelHeight = 250.0;

    // Draw reels background
    for (int i = 0; i < reelCount; i++) {
      final x = i * reelSpacing + 10;
      canvas.drawRect(
        Rect.fromLTWH(x, 0, reelWidth, reelHeight),
        paint,
      );

      // Draw symbols in reel
      _drawReel(canvas, i, x, symbolSize);
    }
  }

  void _drawReel(Canvas canvas, int reelIndex, double x, double symbolSize) {
    const yOffset = 50.0;
    const symbolSpacing = 90.0;

    final textPaint = TextPainter(
      text: const TextSpan(
        text: '',
        style: TextStyle(
          color: Colors.white,
          fontSize: 24,
          fontWeight: FontWeight.bold,
        ),
      ),
      textDirection: TextDirection.ltr,
    );

    for (int i = 0; i < reels[reelIndex].length; i++) {
      final symbolIndex = reels[reelIndex][i];
      final symbol = symbolNames[symbolIndex];
      final y = yOffset + (i * symbolSpacing) - (spinSpeed * 2);

      // Draw symbol background
      final symbolPaint = Paint()
        ..color = const Color(0xFF444444)
        ..style = PaintingStyle.fill;

      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(x, y, 90, 80),
          const Radius.circular(8),
        ),
        symbolPaint,
      );

      // Draw symbol text
      textPaint.text = TextSpan(
        text: symbol.substring(0, 1).toUpperCase(),
        style: const TextStyle(
          color: Colors.white,
          fontSize: 32,
          fontWeight: FontWeight.bold,
        ),
      );
      textPaint.layout();
      textPaint.paint(
        canvas,
        Offset(x + 20, y + 20),
      );
    }

    // Draw center line (winning position)
    final linePaint = Paint()
      ..color = Colors.yellow
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;

    canvas.drawRect(
      Rect.fromLTWH(x, 120, 90, 80),
      linePaint,
    );
  }
}

class SlotGameView extends ConsumerWidget {
  final Theme theme;
  final double betAmount;
  final Function(SpinResult) onSpinComplete;

  const SlotGameView({
    required this.theme,
    required this.betAmount,
    required this.onSpinComplete,
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Colors.blueGrey[800]!,
            Colors.blueGrey[900]!,
          ],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Theme name and info
          Text(
            theme.name,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 16),

          // Game canvas - In a real app, you'd use GameWidget with Flame
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFF1a1a1a),
              borderRadius: BorderRadius.circular(12),
              boxShadow: const [
                BoxShadow(
                  color: Colors.black54,
                  blurRadius: 10,
                  offset: Offset(0, 5),
                )
              ],
            ),
            height: 400,
            child: Center(
              child: Text(
                'Slot Game - ${theme.name}',
                style: const TextStyle(color: Colors.white),
              ),
            ),
          ),

          const SizedBox(height: 20),

          // Bet amount and RTP info
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              Column(
                children: [
                  const Text(
                    'Bet Amount',
                    style: TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                  Text(
                    '\$${betAmount.toStringAsFixed(2)}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              Column(
                children: [
                  const Text(
                    'RTP',
                    style: TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                  Text(
                    '${(theme.rtp * 100).toStringAsFixed(1)}%',
                    style: const TextStyle(
                      color: Colors.yellow,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              Column(
                children: [
                  const Text(
                    'Min/Max Bet',
                    style: TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                  Text(
                    '\$${theme.minBet.toStringAsFixed(2)} - \$${theme.maxBet.toStringAsFixed(2)}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ],
          ),

          const SizedBox(height: 20),

          // Spin button
          ElevatedButton(
            onPressed: () {
              // Trigger spin animation
            },
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 48, vertical: 16),
              backgroundColor: Colors.orange,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text(
              'SPIN',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
