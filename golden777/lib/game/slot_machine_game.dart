import 'package:flame/game.dart';
import 'package:flutter/material.dart';
import 'dart:math';
import 'reel.dart';

class SlotMachineGame extends FlameGame {
  final String themeId;
  final Function(Map<String, dynamic> result) onSpinComplete;
  
  late List<Reel> reels;
  bool isSpinning = false;
  Random random = Random();

  SlotMachineGame({
    required this.themeId,
    required this.onSpinComplete,
  });

  @override
  Future<void> onLoad() async {
    super.onLoad();
    
    initializeReels();
  }

  void initializeReels() {
    reels = [
      Reel(position: Vector2(50, size.height / 2), symbolId: 0),
      Reel(position: Vector2(size.width / 2, size.height / 2), symbolId: 1),
      Reel(position: Vector2(size.width - 50, size.height / 2), symbolId: 2),
    ];
    
    for (var reel in reels) {
      add(reel);
    }
  }

  Future<void> spin() async {
    if (isSpinning) return;

    isSpinning = true;
    
    // Start spinning animation
    final List<int> finalSymbols = [
      random.nextInt(6),
      random.nextInt(6),
      random.nextInt(6),
    ];

    // Spin each reel
    final spinDuration = 1.5;
    final delays = [0, 0.2, 0.4]; // Stagger the reels

    for (int i = 0; i < reels.length; i++) {
      Future.delayed(Duration(milliseconds: (delays[i] * 1000).toInt()), () {
        reels[i].spin(duration: spinDuration, finalSymbol: finalSymbols[i]);
      });
    }

    // Wait for all reels to finish spinning
    await Future.delayed(Duration(milliseconds: (spinDuration * 1000 + 800).toInt()));

    isSpinning = false;
    
    // Determine if it's a win
    final isWin = finalSymbols[0] == finalSymbols[1] && finalSymbols[1] == finalSymbols[2];
    final winAmount = isWin ? (finalSymbols[0] + 1) * 10 : 0;

    onSpinComplete({
      'symbols': finalSymbols,
      'isWin': isWin,
      'winAmount': winAmount,
      'payline': 'middle',
    });
  }

  void reset() {
    for (var reel in reels) {
      reel.reset();
    }
  }

  @override
  void render(Canvas canvas) {
    super.render(canvas);
    
    // Draw game background
    canvas.drawRect(
      Rect.fromLTWH(0, 0, size.width, size.height),
      Paint()..color = const Color(0xFF1a1a2e),
    );
  }
}
