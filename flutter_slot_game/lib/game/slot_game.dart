import 'package:flame/game.dart';
import 'package:flame/components.dart';
import 'package:flutter/material.dart';
import '../models/models.dart' hide Theme;

class SlotGame extends FlameGame {
  final SlotTheme theme;
  final double betAmount;
  bool isSpinning = false;

  SlotGame({
    required this.theme,
    required this.betAmount,
  });

  @override
  Future<void> onLoad() async {
    await super.onLoad();
    // Game initialization
  }
}

/// Enhanced Flame-based slot game widget wrapper
class FlameSlotGameWidget extends StatefulWidget {
  final SlotTheme theme;
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
  bool isSpinning = false;

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

  void _performSpin() async {
    if (isSpinning) return;

    setState(() {
      isSpinning = true;
    });

    // Simulate spin animation
    await Future.delayed(const Duration(seconds: 2));

    // Generate random result
    final result = [
      DateTime.now().millisecond % widget.theme.symbols.length,
      (DateTime.now().millisecond + 1) % widget.theme.symbols.length,
      (DateTime.now().millisecond + 2) % widget.theme.symbols.length,
    ];

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

    setState(() {
      isSpinning = false;
    });
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
            child: Container(
              margin: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF2a2a2a),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _buildReel('Reel 1'),
                    _buildReel('Reel 2'),
                    _buildReel('Reel 3'),
                  ],
                ),
              ),
            ),
          ),
          // Controls below game
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: ElevatedButton(
              onPressed: !isSpinning ? _performSpin : null,
              style: ElevatedButton.styleFrom(
                padding:
                    const EdgeInsets.symmetric(horizontal: 48, vertical: 16),
                backgroundColor: Colors.orange,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Text(
                isSpinning ? 'SPINNING...' : 'SPIN',
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

  Widget _buildReel(String label) {
    return Container(
      width: 80,
      height: 200,
      decoration: BoxDecoration(
        color: const Color(0xFF444444),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.yellow, width: 2),
      ),
      child: Center(
        child: Text(
          label,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}

