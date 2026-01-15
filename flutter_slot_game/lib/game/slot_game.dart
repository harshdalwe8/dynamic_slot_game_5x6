import 'package:flame/game.dart';
import 'package:flame/events.dart';
import 'package:flame/components.dart';
import 'package:flutter/material.dart';
import '../models/models.dart';

class SlotGame extends FlameGame {
  late SlotMachineReel reel1;
  late SlotMachineReel reel2;
  late SlotMachineReel reel3;

  final Theme theme;
  final double betAmount;
  bool isSpinning = false;
  double spinDuration = 0.0;

  SlotGame({
    required this.theme,
    required this.betAmount,
  });

  @override
  Future<void> onLoad() async {
    await super.onLoad();

    // Initialize reels
    const reelWidth = 100.0;
    const reelHeight = 300.0;
    const spacing = 20.0;

    final startX = (size.x - (reelWidth * 3 + spacing * 2)) / 2;
    final startY = (size.y - reelHeight) / 2;

    reel1 = SlotMachineReel(
      symbols: theme.symbols.map((s) => s.name).toList(),
      position: Vector2(startX, startY),
      size: Vector2(reelWidth, reelHeight),
    );

    reel2 = SlotMachineReel(
      symbols: theme.symbols.map((s) => s.name).toList(),
      position: Vector2(startX + reelWidth + spacing, startY),
      size: Vector2(reelWidth, reelHeight),
    );

    reel3 = SlotMachineReel(
      symbols: theme.symbols.map((s) => s.name).toList(),
      position: Vector2(startX + (reelWidth + spacing) * 2, startY),
      size: Vector2(reelWidth, reelHeight),
    );

    add(reel1);
    add(reel2);
    add(reel3);
  }

  Future<void> spin(List<int> result) async {
    if (isSpinning) return;

    isSpinning = true;
    spinDuration = 0.0;

    // Stagger the reel stops
    await Future.delayed(const Duration(milliseconds: 500));
    reel1.stopAt(result[0]);

    await Future.delayed(const Duration(milliseconds: 300));
    reel2.stopAt(result[1]);

    await Future.delayed(const Duration(milliseconds: 300));
    reel3.stopAt(result[2]);

    isSpinning = false;
  }

  @override
  void update(double dt) {
    super.update(dt);
    if (isSpinning) {
      spinDuration += dt;
    }
  }
}

class SlotMachineReel extends Component {
  final List<String> symbols;
  final double symbolHeight = 80.0;
  late Paint symbolPaint;
  late Paint borderPaint;

  int currentPosition = 0;
  int targetPosition = 0;
  bool isSpinning = false;
  double spinSpeed = 0.0;
  final double maxSpinSpeed = 600.0;
  final double acceleration = 2000.0;
  final double deceleration = 1500.0;

  double offset = 0.0;
  final double spinStartTime = 0.0;
  final double spinDuration = 2.0; // 2 seconds total spin time

  SlotMachineReel({
    required this.symbols,
    required Vector2 position,
    required Vector2 size,
  }) {
    this.position = position;
    this.size = size;

    symbolPaint = Paint()
      ..color = const Color(0xFF2a2a2a)
      ..style = PaintingStyle.fill;

    borderPaint = Paint()
      ..color = Colors.yellow
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;
  }

  void startSpin() {
    if (isSpinning) return;
    isSpinning = true;
    spinSpeed = 0;
    offset = 0;
  }

  void stopAt(int position) {
    targetPosition = position % symbols.length;
    // Stop after spinning for a bit
  }

  @override
  void update(double dt) {
    super.update(dt);

    if (!isSpinning) return;

    // Accelerate first 0.5s
    if (spinSpeed < maxSpinSpeed) {
      spinSpeed += acceleration * dt;
      if (spinSpeed > maxSpinSpeed) spinSpeed = maxSpinSpeed;
    }

    // Calculate offset based on speed
    offset += spinSpeed * dt;

    // Move position
    currentPosition = (offset / symbolHeight).toInt();

    // Stop condition - simplified for now
    // In production, use proper deceleration logic
  }

  @override
  void render(Canvas canvas) {
    super.render(canvas);

    // Draw reel background
    canvas.drawRect(
      Rect.fromLTWH(0, 0, size.x, size.y),
      symbolPaint,
    );

    // Draw symbols
    const visibleSymbols = 3;
    final startIndex = currentPosition;

    for (int i = 0; i < visibleSymbols; i++) {
      final symbolIndex = (startIndex + i) % symbols.length;
      final symbol = symbols[symbolIndex];

      final y = (i * symbolHeight) - (offset % symbolHeight);

      // Draw symbol background
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(5, y + 5, size.x - 10, symbolHeight - 10),
          const Radius.circular(8),
        ),
        Paint()
          ..color = const Color(0xFF444444)
          ..style = PaintingStyle.fill,
      );

      // Draw symbol text
      final textPainter = TextPainter(
        text: TextSpan(
          text: symbol,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 28,
            fontWeight: FontWeight.bold,
          ),
        ),
        textDirection: TextDirection.ltr,
      );

      textPainter.layout();
      textPainter.paint(
        canvas,
        Offset(
          size.x / 2 - textPainter.width / 2,
          y + symbolHeight / 2 - textPainter.height / 2,
        ),
      );
    }

    // Draw border and highlight for center symbol (winning position)
    canvas.drawRect(
      Rect.fromLTWH(0, symbolHeight, size.x, symbolHeight),
      borderPaint,
    );
  }
}

/// Enhanced Flame-based slot game widget wrapper
class FlameSlotGameWidget extends StatefulWidget {
  final Theme theme;
  final double betAmount;
  final Function(SpinResult) onSpinComplete;

  const FlameSlotGameWidget({
    required this.theme,
    required this.betAmount,
    required this.onSpinComplete,
    Key? key,
  }) : super(key: key);

  @override
  State<FlameSlotGameWidget> createState() => _FlameSlotGameWidgetState();
}

class _FlameSlotGameWidgetState extends State<FlameSlotGameWidget> {
  late SlotGame game;

  @override
  void initState() {
    super.initState();
    game = SlotGame(
      theme: widget.theme,
      betAmount: widget.betAmount,
    );
  }

  @override
  void dispose() {
    game.removeFromParent();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
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
      child: Column(
        children: [
          // Game canvas
          Expanded(
            child: GameWidget(
              game: game,
            ),
          ),
          // Controls below game
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: ElevatedButton(
              onPressed: !game.isSpinning
                  ? () async {
                      // Simulate spin result
                      final result = [
                        DateTime.now().millisecond % widget.theme.symbols.length,
                        (DateTime.now().millisecond + 1) % widget.theme.symbols.length,
                        (DateTime.now().millisecond + 2) % widget.theme.symbols.length,
                      ];

                      // Start spin animation
                      game.reel1.startSpin();
                      game.reel2.startSpin();
                      game.reel3.startSpin();

                      // Simulate API call and get result
                      await Future.delayed(const Duration(seconds: 3));

                      game.reel1.stopAt(result[0]);
                      game.reel2.stopAt(result[1]);
                      game.reel3.stopAt(result[2]);

                      // Create spin result
                      final spinResult = SpinResult(
                        spinId: 'spin_${DateTime.now().millisecondsSinceEpoch}',
                        themeId: widget.theme.id,
                        reels: result,
                        resultSymbols: [
                          widget.theme.symbols[result[0]],
                          widget.theme.symbols[result[1]],
                          widget.theme.symbols[result[2]],
                        ],
                        winAmount: 0,
                        betAmount: widget.betAmount,
                        newBalance: 0,
                        isWin: false,
                        createdAt: DateTime.now(),
                      );

                      widget.onSpinComplete(spinResult);
                    }
                  : null,
              style: ElevatedButton.styleFrom(
                padding:
                    const EdgeInsets.symmetric(horizontal: 48, vertical: 16),
                backgroundColor: Colors.orange,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Text(
                game.isSpinning ? 'SPINNING...' : 'SPIN',
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
