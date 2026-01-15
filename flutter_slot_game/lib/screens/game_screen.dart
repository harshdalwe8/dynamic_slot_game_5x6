import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../game/slot_game.dart';
import '../models/models.dart' hide Theme;

class GameScreen extends ConsumerStatefulWidget {
  final String themeId;

  const GameScreen({required this.themeId, Key? key}) : super(key: key);

  @override
  ConsumerState<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends ConsumerState<GameScreen> {
  late SlotTheme _currentTheme;
  double _selectedBet = 10.0;
  double _balance = 100.0;

  @override
  void initState() {
    super.initState();
    _loadTheme();
  }

  void _loadTheme() {
    // TODO: Fetch theme from API
    _currentTheme = SlotTheme(
      id: widget.themeId,
      name: 'Classic Slots',
      description: 'Traditional slot machine',
      symbols: [
        const Symbol(id: '1', name: 'Cherry', imageUrl: '', multiplier: 1, value: 1),
        const Symbol(id: '2', name: 'Diamond', imageUrl: '', multiplier: 2, value: 2),
        const Symbol(id: '3', name: 'Gold', imageUrl: '', multiplier: 5, value: 3),
        const Symbol(id: '4', name: 'Jackpot', imageUrl: '', multiplier: 10, value: 4),
      ],
      minBet: 1.0,
      maxBet: 100.0,
      rtp: 0.96,
      isActive: true,
      createdAt: DateTime.now(),
    );
  }

  void _onSpinComplete(SpinResult result) {
    setState(() {
      _balance = result.newBalance;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          result.isWin
              ? 'You won \$${result.winAmount.toStringAsFixed(2)}!'
              : 'No win this time',
        ),
        backgroundColor: result.isWin ? Colors.green : Colors.red,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Game'),
        actions: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Center(
              child: Text(
                'Balance: \$${_balance.toStringAsFixed(2)}',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: FlameSlotGameWidget(
                theme: _currentTheme,
                betAmount: _selectedBet,
                onSpinComplete: _onSpinComplete,
              ),
            ),
          ),
          // Betting controls
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF1a1f3a),
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(16),
              ),
            ),
            child: Column(
              children: [
                Text(
                  'Bet Amount: \$${_selectedBet.toStringAsFixed(2)}',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Slider(
                  value: _selectedBet,
                  min: _currentTheme.minBet,
                  max: _currentTheme.maxBet,
                  divisions: 50,
                  onChanged: (value) {
                    setState(() => _selectedBet = value);
                  },
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    ElevatedButton(
                      onPressed: () {
                        setState(() =>
                            _selectedBet = _currentTheme.minBet.clamp(0.0, _selectedBet));
                      },
                      child: const Text('Min Bet'),
                    ),
                    ElevatedButton(
                      onPressed: () {
                        setState(() => _selectedBet = (_selectedBet / 2)
                            .clamp(_currentTheme.minBet, _currentTheme.maxBet));
                      },
                      child: const Text('Half'),
                    ),
                    ElevatedButton(
                      onPressed: () {
                        setState(() => _selectedBet = (_selectedBet * 2)
                            .clamp(_currentTheme.minBet, _currentTheme.maxBet));
                      },
                      child: const Text('Double'),
                    ),
                    ElevatedButton(
                      onPressed: () {
                        setState(() =>
                            _selectedBet = _currentTheme.maxBet.clamp(0.0, _currentTheme.maxBet));
                      },
                      child: const Text('Max Bet'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
