import 'package:flutter/material.dart';
import '../../core/theme/colors.dart';

class AcademicsScreen extends StatelessWidget {
  const AcademicsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.bgCanvas,
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 20),
              const Text(
                'ACADEMICS',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.w900,
                  color: AppColors.textHigh,
                  letterSpacing: 2,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'LEVEL UP YOUR INTELLIGENCE',
                style: TextStyle(
                  fontSize: 12,
                  color: AppColors.textMed,
                  letterSpacing: 2,
                ),
              ),
              const SizedBox(height: 24),
              
              // Upcoming Exam Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: AppColors.blueGradient),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.black26,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Text(
                        'UPCOMING EXAM',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Calculus II',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      '3 days left · 85% Prepared',
                      style: TextStyle(color: Colors.white70, fontSize: 14),
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 24),
              
              // Feature Grid 2x2
              Row(
                children: [
                  Expanded(child: _buildFeatureCard(Icons.people, 'Study Groups', 'Collaborate with squad', AppColors.accentPrimary)),
                  const SizedBox(width: 14),
                  Expanded(child: _buildFeatureCard(Icons.menu_book, 'Textbook Exchange', 'Trade gear & books', AppColors.accentOrange)),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(child: _buildFeatureCard(Icons.auto_awesome, 'Citation Gen', 'Magic references', AppColors.accentCoral)),
                  const SizedBox(width: 14),
                  Expanded(child: _buildFeatureCard(Icons.bolt, 'Brain Boost', 'Ace every test', AppColors.accentPink)),
                ],
              ),
              
              const SizedBox(height: 32),
              const Text(
                'LIVE FEED',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textMed,
                  letterSpacing: 2,
                ),
              ),
              const SizedBox(height: 16),
              
              _buildFeedItem(AppColors.accentSecondary, 'John joined Physics 101', '2 mins ago'),
              const SizedBox(height: 12),
              _buildFeedItem(AppColors.accentCoral, 'New offer: Calculus Book', '2 mins ago'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFeatureCard(IconData icon, String title, String subtitle, Color color) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface1,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.surface2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: color.withOpacity(0.15),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: color, size: 26),
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppColors.textHigh,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textMed,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeedItem(Color dotColor, String title, String time) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface1,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        children: [
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              color: dotColor,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textHigh,
                  ),
                ),
                Text(
                  time,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textMed,
                  ),
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right, color: AppColors.textLow),
        ],
      ),
    );
  }
}
