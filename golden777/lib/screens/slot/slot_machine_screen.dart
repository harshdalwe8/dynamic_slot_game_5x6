import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/slot_provider.dart';
import '../../providers/wallet_provider.dart';
import '../../game/slot_game_widget.dart';

class SlotMachineScreen extends StatefulWidget {
  const SlotMachineScreen({Key? key}) : super(key: key);

  @override
  State<SlotMachineScreen> createState() => _SlotMachineScreenState();
}

class _SlotMachineScreenState extends State<SlotMachineScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final slotProvider = Provider.of<SlotProvider>(context, listen: false);
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final walletProvider = Provider.of<WalletProvider>(context, listen: false);
      
      if (authProvider.token != null) {
        slotProvider.loadThemes(authProvider.token!);
        walletProvider.loadBalance(authProvider.token!);
      }
    });
  }

  void _handleSpinComplete(Map<String, dynamic> result) {
    final walletProvider = Provider.of<WalletProvider>(context, listen: false);
    final slotProvider = Provider.of<SlotProvider>(context, listen: false);
    
    // Deduct bet from wallet
    walletProvider.subtractFromBalance(slotProvider.currentBet.toDouble());
    
    // Add winnings if won
    if (result['isWin'] == true) {
      walletProvider.addToBalance(result['winAmount'].toDouble());
      _showWinDialog(result);
    }
  }

  void _showWinDialog(Map<String, dynamic> result) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF16213e),
        title: const Text(
          'Congratulations!',
          style: TextStyle(color: Colors.white),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'You Won!',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Color(0xFFFFD700),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Win Amount: \$${result['winAmount']}',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w500,
                color: Colors.white,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text(
              'OK',
              style: TextStyle(color: Color(0xFFFFD700)),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Slot Machine'),
      ),
      body: Consumer3<SlotProvider, WalletProvider, AuthProvider>(
        builder: (context, slotProvider, walletProvider, authProvider, _) {
          return SingleChildScrollView(
            child: Column(
              children: [
                // Game Area
                Container(
                  height: 300,
                  color: const Color(0xFF16213e),
                  child: slotProvider.selectedTheme != null
                      ? SlotGameWidget(
                          themeId: slotProvider.selectedTheme!.id,
                          onSpinComplete: _handleSpinComplete,
                        )
                      : const Center(
                          child: CircularProgressIndicator(),
                        ),
                ),
                
                // Theme Selection
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Select Theme',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 100,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          itemCount: slotProvider.themes.length,
                          itemBuilder: (context, index) {
                            final theme = slotProvider.themes[index];
                            final isSelected = slotProvider.selectedTheme?.id == theme.id;
                            return GestureDetector(
                              onTap: () => slotProvider.selectTheme(theme),
                              child: Container(
                                margin: const EdgeInsets.only(right: 12),
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  border: Border.all(
                                    color: isSelected ? const Color(0xFFFFD700) : Colors.grey,
                                    width: isSelected ? 3 : 1,
                                  ),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      theme.name,
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: isSelected ? const Color(0xFFFFD700) : Colors.white,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'RTP: ${theme.rtp}%',
                                      style: const TextStyle(
                                        fontSize: 10,
                                        color: Colors.grey,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),

                // Betting Controls
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Bet Amount',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          Text(
                            '\$${slotProvider.currentBet}',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFFFFD700),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Slider(
                        value: slotProvider.currentBet.toDouble(),
                        min: slotProvider.selectedTheme?.minBet.toDouble() ?? 1,
                        max: slotProvider.selectedTheme?.maxBet.toDouble() ?? 100,
                        onChanged: (value) {
                          slotProvider.setBet(value.toInt());
                        },
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Balance: \$${walletProvider.balance.toStringAsFixed(2)}',
                            style: const TextStyle(color: Colors.grey),
                          ),
                          if (slotProvider.lastSpinResult != null)
                            Text(
                              'Last Win: \$${slotProvider.lastSpinResult!.winAmount}',
                              style: const TextStyle(
                                color: Color(0xFFFFD700),
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Spin Button
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: slotProvider.isSpinning ||
                              walletProvider.balance < slotProvider.currentBet ||
                              authProvider.token == null
                          ? null
                          : () => slotProvider.spin(authProvider.token!),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFFFD700),
                        disabledBackgroundColor: Colors.grey,
                      ),
                      child: Text(
                        slotProvider.isSpinning ? 'SPINNING...' : 'SPIN',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1a1a2e),
                        ),
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 24),
              ],
            ),
          );
        },
      ),
    );
  }
}
