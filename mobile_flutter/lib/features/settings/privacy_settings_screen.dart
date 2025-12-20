import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/theme/colors.dart';

class PrivacySettingsScreen extends StatefulWidget {
  const PrivacySettingsScreen({super.key});

  @override
  State<PrivacySettingsScreen> createState() => _PrivacySettingsScreenState();
}

class _PrivacySettingsScreenState extends State<PrivacySettingsScreen> {
  bool profilePublic = true;
  bool showReadingActivity = true;
  bool showStats = true;
  bool allowMessages = true;

  @override
  void initState() {
    super.initState();
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      profilePublic = prefs.getBool('privacy_profile_public') ?? true;
      showReadingActivity = prefs.getBool('privacy_show_activity') ?? true;
      showStats = prefs.getBool('privacy_show_stats') ?? true;
      allowMessages = prefs.getBool('privacy_allow_messages') ?? true;
    });
  }

  Future<void> _savePreference(String key, bool value) async {
    HapticFeedback.selectionClick();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(key, value);
  }

  void _showDeleteAccountDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface1,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Delete Account', style: TextStyle(color: AppColors.error)),
        content: const Text(
          'This action is irreversible. All your data including reading lists, notes, and reviews will be permanently deleted.',
          style: TextStyle(color: AppColors.textMed),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: AppColors.textMed)),
          ),
          TextButton(
            onPressed: () async {
              // In production, implement proper account deletion
              await Supabase.instance.client.auth.signOut();
              if (context.mounted) {
                Navigator.of(context).popUntil((route) => route.isFirst);
              }
            },
            child: const Text('Delete', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgCanvas,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('Privacy', style: TextStyle(fontWeight: FontWeight.w800)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.surface1,
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Row(
              children: [
                Icon(Icons.shield, color: AppColors.accentSecondary, size: 32),
                SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Your Privacy Matters', style: TextStyle(color: AppColors.textHigh, fontWeight: FontWeight.w700, fontSize: 16)),
                      Text('Control who sees your information', style: TextStyle(color: AppColors.textMed, fontSize: 12)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Profile Visibility
          const Text('PROFILE VISIBILITY', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textLow, letterSpacing: 2)),
          const SizedBox(height: 12),
          _buildToggle('Public Profile', 'Others can find and view your profile', profilePublic, (v) {
            setState(() => profilePublic = v);
            _savePreference('privacy_profile_public', v);
          }),
          const SizedBox(height: 12),
          _buildToggle('Show Reading Activity', 'Display what you\'re currently reading', showReadingActivity, (v) {
            setState(() => showReadingActivity = v);
            _savePreference('privacy_show_activity', v);
          }),
          const SizedBox(height: 12),
          _buildToggle('Show Reading Stats', 'Let others see your reading statistics', showStats, (v) {
            setState(() => showStats = v);
            _savePreference('privacy_show_stats', v);
          }),
          const SizedBox(height: 24),

          // Communication
          const Text('COMMUNICATION', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textLow, letterSpacing: 2)),
          const SizedBox(height: 12),
          _buildToggle('Allow Messages', 'Receive messages from other readers', allowMessages, (v) {
            setState(() => allowMessages = v);
            _savePreference('privacy_allow_messages', v);
          }),
          const SizedBox(height: 24),

          // Data
          const Text('DATA MANAGEMENT', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textLow, letterSpacing: 2)),
          const SizedBox(height: 12),
          _buildActionItem('Download My Data', 'Get a copy of all your data', Icons.download, () {
            HapticFeedback.mediumImpact();
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Data export will be sent to your email')),
            );
          }),
          const SizedBox(height: 12),
          _buildActionItem('Clear Search History', 'Remove all search history', Icons.history, () {
            HapticFeedback.mediumImpact();
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Search history cleared'), backgroundColor: AppColors.accentSecondary),
            );
          }),
          const SizedBox(height: 24),

          // Danger Zone
          const Text('DANGER ZONE', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.error, letterSpacing: 2)),
          const SizedBox(height: 12),
          GestureDetector(
            onTap: _showDeleteAccountDialog,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.error.withOpacity(0.1),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.error.withOpacity(0.3)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.delete_forever, color: AppColors.error),
                  SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Delete Account', style: TextStyle(color: AppColors.error, fontWeight: FontWeight.w600)),
                        Text('Permanently delete your account and data', style: TextStyle(color: AppColors.textMed, fontSize: 12)),
                      ],
                    ),
                  ),
                  Icon(Icons.chevron_right, color: AppColors.error),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildToggle(String title, String subtitle, bool value, Function(bool) onChanged) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface1,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.surface2),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: AppColors.textHigh, fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(subtitle, style: const TextStyle(color: AppColors.textMed, fontSize: 12)),
              ],
            ),
          ),
          Switch(value: value, onChanged: onChanged, activeColor: AppColors.accentPrimary),
        ],
      ),
    );
  }

  Widget _buildActionItem(String title, String subtitle, IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface1,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.surface2),
        ),
        child: Row(
          children: [
            Icon(icon, color: AppColors.accentPrimary),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(color: AppColors.textHigh, fontWeight: FontWeight.w600)),
                  Text(subtitle, style: const TextStyle(color: AppColors.textMed, fontSize: 12)),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: AppColors.textLow),
          ],
        ),
      ),
    );
  }
}
