import 'package:flutter/material.dart';
import '../models/spin_result.dart';
import '../models/theme.dart';
import '../services/slot_service.dart';

class SlotProvider extends ChangeNotifier {
  final SlotService _slotService = SlotService();
  
  List<Theme> _themes = [];
  Theme? _selectedTheme;
  SpinResult? _lastSpinResult;
  bool _isSpinning = false;
  bool _isLoading = false;
  String? _error;
  int _currentBet = 10;

  List<Theme> get themes => _themes;
  Theme? get selectedTheme => _selectedTheme;
  SpinResult? get lastSpinResult => _lastSpinResult;
  bool get isSpinning => _isSpinning;
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get currentBet => _currentBet;

  Future<void> loadThemes(String token) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _themes = await _slotService.getThemes(token);
      if (_themes.isNotEmpty) {
        _selectedTheme = _themes[0];
      }
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  void selectTheme(Theme theme) {
    _selectedTheme = theme;
    notifyListeners();
  }

  void setBet(int bet) {
    if (_selectedTheme != null &&
        bet >= _selectedTheme!.minBet &&
        bet <= _selectedTheme!.maxBet) {
      _currentBet = bet;
      notifyListeners();
    }
  }

  Future<void> spin(String token) async {
    if (_isSpinning || _selectedTheme == null) return;

    _isSpinning = true;
    _error = null;
    notifyListeners();

    try {
      _lastSpinResult = await _slotService.spin(
        token,
        _selectedTheme!.id,
        _currentBet,
      );
      _isSpinning = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isSpinning = false;
      notifyListeners();
    }
  }
}
