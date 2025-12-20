import 'package:flutter/material.dart';
import '../../core/theme/colors.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [AppColors.bgCanvas, Color(0xFF1a103d), AppColors.bgCanvas],
        ),
      ),
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 20),
              const Text(
                'TOMESPHERE',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.w900,
                  color: AppColors.textHigh,
                  letterSpacing: 2,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'DISCOVER YOUR NEXT ADVENTURE',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textMed,
                  letterSpacing: 2,
                ),
              ),
              const SizedBox(height: 32),
              
              // Featured Card
              Container(
                width: double.infinity,
                height: 200,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: AppColors.primaryGradient),
                  borderRadius: BorderRadius.circular(24),
                ),
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.black26,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Text(
                        'FEATURED',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Discover New Books',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Explore trending titles',
                      style: TextStyle(color: Colors.white70, fontSize: 14),
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 32),
              const Text(
                'QUICK ACTIONS',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textMed,
                  letterSpacing: 2,
                ),
              ),
              const SizedBox(height: 16),
              
              // Quick action cards
              Row(
                children: [
                  Expanded(
                    child: _buildQuickAction(Icons.search, 'Search', AppColors.accentBlue),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildQuickAction(Icons.bookmark, 'Saved', AppColors.accentOrange),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildQuickAction(Icons.trending_up, 'Trending', AppColors.accentPink),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildQuickAction(Icons.new_releases, 'New', AppColors.accentSecondary),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickAction(IconData icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface1,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.surface2),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: color.withOpacity(0.15),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(width: 14),
          Text(
            label,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppColors.textHigh,
            ),
          ),
        ],
      ),
    );
  }
}
