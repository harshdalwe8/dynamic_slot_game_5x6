import 'package:flutter/material.dart';
import '../services/wallet_service.dart';

class WalletProvider extends ChangeNotifier {
  final WalletService _walletService = WalletService();
  
  double _balance = 0.0;
  bool _isLoading = false;
  String? _error;

  double get balance => _balance;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadBalance(String token) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _balance = await _walletService.getBalance(token);
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> updateBalance(String token, double amount) async {
    try {
      _balance = await _walletService.updateBalance(token, amount);
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  void addToBalance(double amount) {
    _balance += amount;
    notifyListeners();
  }

  void subtractFromBalance(double amount) {
    if (_balance >= amount) {
      _balance -= amount;
      notifyListeners();
    }
  }
}
