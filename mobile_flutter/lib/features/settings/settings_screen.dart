import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/colors.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.bgCanvas,
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            const SizedBox(height: 20),
            const Text(
              'SETTINGS',
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.w900,
                color: AppColors.textHigh,
                letterSpacing: 2,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'MANAGE YOUR PREFERENCES',
              style: TextStyle(
                fontSize: 12,
                color: AppColors.textMed,
                letterSpacing: 2,
              ),
            ),
            const SizedBox(height: 32),

            // Account Section
            _buildSectionHeader('ACCOUNT'),
            const SizedBox(height: 12),
            _buildSettingsCard([
              _SettingsTile(
                icon: Icons.person_outline,
                title: 'Edit Profile',
                subtitle: 'Update your personal information',
                onTap: () => context.push('/settings/edit-profile'),
              ),
              _SettingsTile(
                icon: Icons.flag_outlined,
                title: 'Reading Goals',
                subtitle: 'Set your weekly and monthly targets',
                onTap: () => context.push('/settings/goals'),
              ),
              _SettingsTile(
                icon: Icons.bar_chart,
                title: 'Reading Stats',
                subtitle: 'View your reading analytics',
                onTap: () => context.push('/settings/stats'),
              ),
            ]),
            const SizedBox(height: 24),

            // Preferences Section
            _buildSectionHeader('PREFERENCES'),
            const SizedBox(height: 12),
            _buildSettingsCard([
              _SettingsTile(
                icon: Icons.notifications_outlined,
                title: 'Notifications',
                subtitle: 'Configure alerts and reminders',
                onTap: () => context.push('/settings/notifications'),
              ),
              _SettingsTile(
                icon: Icons.shield_outlined,
                title: 'Privacy',
                subtitle: 'Manage your data and privacy',
                onTap: () => context.push('/settings/privacy'),
              ),
            ]),
            const SizedBox(height: 24),

            // Support Section
            _buildSectionHeader('SUPPORT'),
            const SizedBox(height: 12),
            _buildSettingsCard([
              _SettingsTile(
                icon: Icons.help_outline,
                title: 'Help Center',
                subtitle: 'FAQs and support guides',
                onTap: () => context.push('/settings/help'),
              ),
              _SettingsTile(
                icon: Icons.info_outline,
                title: 'About TomeSphere',
                subtitle: 'Version 1.0.0',
                onTap: () => context.push('/settings/about'),
              ),
            ]),
            const SizedBox(height: 32),

            // Sign Out Button
            GestureDetector(
              onTap: () => _showSignOutDialog(context),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 16),
                decoration: BoxDecoration(
                  color: AppColors.error.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.error.withOpacity(0.3)),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.logout, color: AppColors.error),
                    SizedBox(width: 12),
                    Text(
                      'Sign Out',
                      style: TextStyle(
                        color: AppColors.error,
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 100),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w700,
        color: AppColors.textLow,
        letterSpacing: 2,
      ),
    );
  }

  Widget _buildSettingsCard(List<_SettingsTile> tiles) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface1,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.surface2),
      ),
      child: Column(
        children: tiles.asMap().entries.map((entry) {
          final index = entry.key;
          final tile = entry.value;
          return Column(
            children: [
              tile,
              if (index < tiles.length - 1)
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16),
                  child: Divider(color: AppColors.surface2, height: 1),
                ),
            ],
          );
        }).toList(),
      ),
    );
  }

  void _showSignOutDialog(BuildContext context) {
    HapticFeedback.mediumImpact();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface1,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Sign Out', style: TextStyle(color: AppColors.textHigh)),
        content: const Text('Are you sure you want to sign out?', style: TextStyle(color: AppColors.textMed)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: AppColors.textMed)),
          ),
          TextButton(
            onPressed: () async {
              await Supabase.instance.client.auth.signOut();
              if (context.mounted) {
                context.go('/login');
              }
            },
            child: const Text('Sign Out', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _SettingsTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.accentPrimary.withOpacity(0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: AppColors.accentPrimary),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      color: AppColors.textHigh,
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(color: AppColors.textMed, fontSize: 12),
                  ),
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
