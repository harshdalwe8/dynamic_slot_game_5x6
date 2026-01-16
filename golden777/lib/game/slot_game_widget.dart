import 'package:flame/game.dart';
import 'package:flutter/material.dart';
import 'slot_machine_game.dart';

class SlotGameWidget extends StatefulWidget {
  final String themeId;
  final Function(Map<String, dynamic> result) onSpinComplete;

  const SlotGameWidget({
    Key? key,
    required this.themeId,
    required this.onSpinComplete,
  }) : super(key: key);

  @override
  State<SlotGameWidget> createState() => _SlotGameWidgetState();
}

class _SlotGameWidgetState extends State<SlotGameWidget> {
  late SlotMachineGame game;

  @override
  void initState() {
    super.initState();
    game = SlotMachineGame(
      themeId: widget.themeId,
      onSpinComplete: widget.onSpinComplete,
    );
  }

  @override
  Widget build(BuildContext context) {
    return GameWidget(game: game);
  }
}
