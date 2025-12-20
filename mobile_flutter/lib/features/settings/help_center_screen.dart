import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/theme/colors.dart';

class HelpCenterScreen extends StatelessWidget {
  const HelpCenterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgCanvas,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('Help Center', style: TextStyle(fontWeight: FontWeight.w800)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [AppColors.accentPrimary, AppColors.accentBlue]),
              borderRadius: BorderRadius.circular(24),
            ),
            child: const Column(
              children: [
                Icon(Icons.help, color: Colors.white, size: 48),
                SizedBox(height: 16),
                Text('How can we help?', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 22)),
                SizedBox(height: 8),
                Text('Find answers to common questions', style: TextStyle(color: Colors.white70)),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Quick Actions
          Row(
            children: [
              Expanded(child: _buildQuickAction('FAQs', Icons.quiz, () {})),
              const SizedBox(width: 12),
              Expanded(child: _buildQuickAction('Contact', Icons.mail, () {
                HapticFeedback.selectionClick();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Email: support@tomesphere.com')),
                );
              })),
            ],
          ),
          const SizedBox(height: 24),

          // FAQs
          const Text('FREQUENTLY ASKED', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textLow, letterSpacing: 2)),
          const SizedBox(height: 12),
          _buildFAQ('How do I add a book to my library?', 
            'Go to Explore, find a book, tap on it to see details, then tap "Add to List" to add it to your reading list.'),
          _buildFAQ('How do I track my reading time?', 
            'Use the Reading Timer feature from the Home screen. Start the timer when you begin reading and save your session when done.'),
          _buildFAQ('How do study groups work?', 
            'You can create or join study groups from the Academics section. Share notes, discuss books, and study together.'),
          _buildFAQ('How do I generate citations?', 
            'Go to Academics > Citations, enter the book/article details, choose a format (APA, MLA, etc.), and generate your citation.'),
          _buildFAQ('How do I create flashcards?', 
            'Navigate to Academics > Flashcards, tap the + button, and add your question and answer. Study by tapping cards to flip them.'),
          _buildFAQ('How do I edit my profile?', 
            'Go to Profile > Settings > Edit Profile to update your name, bio, and other information.'),
          _buildFAQ('How do I set reading goals?', 
            'Go to Settings > Reading Goals and use the sliders to set your weekly, monthly, and yearly book targets.'),
          const SizedBox(height: 24),

          // Contact Section
          const Text('STILL NEED HELP?', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textLow, letterSpacing: 2)),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.surface1,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                const Text('Contact Support', style: TextStyle(color: AppColors.textHigh, fontWeight: FontWeight.w700, fontSize: 16)),
                const SizedBox(height: 8),
                const Text('Our team is here to help you', style: TextStyle(color: AppColors.textMed)),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          HapticFeedback.selectionClick();
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Email: support@tomesphere.com')),
                          );
                        },
                        icon: const Icon(Icons.email),
                        label: const Text('Email'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.accentPrimary,
                          side: const BorderSide(color: AppColors.accentPrimary),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () {
                          HapticFeedback.selectionClick();
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Live chat coming soon!')),
                          );
                        },
                        icon: const Icon(Icons.chat),
                        label: const Text('Chat'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.accentPrimary,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
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

  Widget _buildQuickAction(String label, IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        decoration: BoxDecoration(
          color: AppColors.surface1,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            Icon(icon, color: AppColors.accentPrimary, size: 28),
            const SizedBox(height: 8),
            Text(label, style: const TextStyle(color: AppColors.textHigh, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }

  Widget _buildFAQ(String question, String answer) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.surface1,
        borderRadius: BorderRadius.circular(14),
      ),
      child: ExpansionTile(
        title: Text(question, style: const TextStyle(color: AppColors.textHigh, fontWeight: FontWeight.w600, fontSize: 14)),
        iconColor: AppColors.accentPrimary,
        collapsedIconColor: AppColors.textMed,
        childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        children: [
          Text(answer, style: const TextStyle(color: AppColors.textMed, height: 1.5)),
        ],
      ),
    );
  }
}
