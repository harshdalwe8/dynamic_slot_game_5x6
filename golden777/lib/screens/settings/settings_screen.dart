import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/theme_provider.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Preferences',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 16),
            Consumer<ThemeProvider>(
              builder: (context, themeProvider, _) {
                return SwitchListTile(
                  title: const Text(
                    'Dark Mode',
                    style: TextStyle(color: Colors.white),
                  ),
                  value: themeProvider.isDarkMode,
                  onChanged: (value) => themeProvider.toggleTheme(),
                  activeColor: const Color(0xFFFFD700),
                );
              },
            ),
            const Divider(color: Colors.grey),
            const SizedBox(height: 16),
            const Text(
              'Account',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 16),
            ListTile(
              title: const Text(
                'Change Password',
                style: TextStyle(color: Colors.white),
              ),
              trailing: const Icon(Icons.arrow_forward, color: Color(0xFFFFD700)),
              onTap: () {},
            ),
            ListTile(
              title: const Text(
                'Two-Factor Authentication',
                style: TextStyle(color: Colors.white),
              ),
              trailing: const Icon(Icons.arrow_forward, color: Color(0xFFFFD700)),
              onTap: () {},
            ),
          ],
        ),
      ),
    );
  }
}
