import 'package:flame/components.dart';
import 'package:flutter/material.dart';
import 'dart:math';

class Reel extends Component {
  static const List<String> symbols = ['🍒', '🍋', '🍊', '🍇', '🎰', '💎'];
  
  int currentSymbol = 0;
  double rotationAngle = 0;
  bool isSpinning = false;
  late TextComponent symbolDisplay;

  @override
  Future<void> onLoad() async {
    super.onLoad();
    
    symbolDisplay = TextComponent(
      text: symbols[currentSymbol],
      textRenderer: TextPaint(
        style: const TextStyle(
          color: Colors.amber,
          fontSize: 48,
          fontWeight: FontWeight.bold,
        ),
      ),
      position: position,
    );
    
    add(symbolDisplay);
  }

  void spin({required double duration, required int finalSymbol}) {
    isSpinning = true;
    currentSymbol = finalSymbol;
    
    // Trigger Rive animation if needed
    updateSymbolDisplay();
  }

  void reset() {
    currentSymbol = 0;
    updateSymbolDisplay();
  }

  void updateSymbolDisplay() {
    symbolDisplay.text = symbols[currentSymbol];
  }

  @override
  void render(Canvas canvas) {
    super.render(canvas);
    
    // Draw reel border
    canvas.drawCircle(
      Offset(position.x, position.y),
      40,
      Paint()
        ..color = const Color(0xFFFFD700)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2,
    );
  }
}
