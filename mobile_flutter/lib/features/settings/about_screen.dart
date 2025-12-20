import 'package:flutter/material.dart';
import '../../core/theme/colors.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgCanvas,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('About', style: TextStyle(fontWeight: FontWeight.w800)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const SizedBox(height: 20),
            // App Icon
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppColors.accentPrimary, AppColors.accentBlue],
                ),
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.accentPrimary.withOpacity(0.4),
                    blurRadius: 30,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: const Icon(Icons.menu_book, size: 50, color: Colors.white),
            ),
            const SizedBox(height: 24),
            const Text(
              'TomeSphere',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.w900,
                color: AppColors.textHigh,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Version 1.0.0',
              style: TextStyle(color: AppColors.textMed),
            ),
            const SizedBox(height: 32),

            // Description Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.surface1,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.surface2),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Your Reading Adventure',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textHigh,
                    ),
                  ),
                  SizedBox(height: 12),
                  Text(
                    'TomeSphere is your personal reading companion. Track your books, set reading goals, join study groups, and discover new favorites.',
                    style: TextStyle(color: AppColors.textMed, height: 1.6),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Features List
            _buildFeatureItem(Icons.library_books, 'Personal Library', 'Organize all your books'),
            _buildFeatureItem(Icons.trending_up, 'Reading Stats', 'Track your progress'),
            _buildFeatureItem(Icons.school, 'Academics', 'Study tools & groups'),
            _buildFeatureItem(Icons.bookmark, 'Smart Lists', 'Reading, finished, want to read'),
            const SizedBox(height: 32),

            // Footer
            Text(
              'Made with ❤️ by TomeSphere Team',
              style: TextStyle(color: AppColors.textLow, fontSize: 12),
            ),
            const SizedBox(height: 8),
            Text(
              '© 2024 TomeSphere. All rights reserved.',
              style: TextStyle(color: AppColors.textLow, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeatureItem(IconData icon, String title, String subtitle) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
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
                Text(title, style: const TextStyle(color: AppColors.textHigh, fontWeight: FontWeight.w600)),
                Text(subtitle, style: const TextStyle(color: AppColors.textMed, fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
