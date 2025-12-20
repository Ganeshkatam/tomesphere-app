import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/theme/colors.dart';

class PracticeTestsScreen extends StatefulWidget {
  const PracticeTestsScreen({super.key});

  @override
  State<PracticeTestsScreen> createState() => _PracticeTestsScreenState();
}

class _PracticeTestsScreenState extends State<PracticeTestsScreen> {
  List<Map<String, dynamic>> tests = [];
  List<Map<String, dynamic>> myAttempts = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _loadTests();
  }

  Future<void> _loadTests() async {
    try {
      final data = await Supabase.instance.client
          .from('practice_tests')
          .select('*, profiles(full_name)')
          .order('created_at', ascending: false);

      final user = Supabase.instance.client.auth.currentUser;
      if (user != null) {
        final attempts = await Supabase.instance.client
            .from('user_test_attempts')
            .select()
            .eq('user_id', user.id);
        myAttempts = List<Map<String, dynamic>>.from(attempts);
      }

      setState(() {
        tests = List<Map<String, dynamic>>.from(data);
        loading = false;
      });
    } catch (e) {
      debugPrint('Error: $e');
      setState(() => loading = false);
    }
  }

  int? _getMyScore(String testId) {
    final attempt = myAttempts.where((a) => a['test_id'] == testId).firstOrNull;
    return attempt?['score'];
  }

  Color _getDifficultyColor(String? difficulty) {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return AppColors.accentSecondary;
      case 'medium': return AppColors.accentOrange;
      case 'hard': return AppColors.error;
      default: return AppColors.textMed;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgCanvas,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('Practice Tests', style: TextStyle(fontWeight: FontWeight.w800)),
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.accentPrimary))
          : tests.isEmpty
              ? const Center(child: Text('No tests available', style: TextStyle(color: AppColors.textMed)))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: tests.length,
                  itemBuilder: (context, index) => _buildTestCard(tests[index]),
                ),
    );
  }

  Widget _buildTestCard(Map<String, dynamic> test) {
    final difficulty = test['difficulty'];
    final diffColor = _getDifficultyColor(difficulty);
    final timeLimit = test['time_limit_minutes'] ?? 30;
    final subject = test['subject'];
    final myScore = _getMyScore(test['id']);
    final creatorName = test['profiles']?['full_name'] ?? 'TomeSphere';

    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        _showTestDetails(test);
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.surface1,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: myScore != null ? AppColors.accentSecondary.withOpacity(0.3) : AppColors.surface2),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.accentPrimary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(Icons.quiz, color: AppColors.accentPrimary, size: 24),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(test['title'] ?? 'Untitled Test', style: const TextStyle(color: AppColors.textHigh, fontWeight: FontWeight.w700, fontSize: 15)),
                      Text('by $creatorName', style: const TextStyle(color: AppColors.textMed, fontSize: 12)),
                    ],
                  ),
                ),
                if (myScore != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.accentSecondary.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text('$myScore%', style: const TextStyle(color: AppColors.accentSecondary, fontWeight: FontWeight.w800)),
                  ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                _buildInfoChip(Icons.timer, '$timeLimit min', AppColors.accentBlue),
                const SizedBox(width: 12),
                if (subject != null)
                  _buildInfoChip(Icons.school, subject, AppColors.accentPrimary),
                const Spacer(),
                if (difficulty != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: diffColor.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      difficulty.toString().toUpperCase(),
                      style: TextStyle(color: diffColor, fontWeight: FontWeight.w700, fontSize: 10, letterSpacing: 1),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoChip(IconData icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 6),
          Text(label, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  void _showTestDetails(Map<String, dynamic> test) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface1,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(test['title'] ?? 'Test', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.textHigh)),
            const SizedBox(height: 8),
            Text('${test['time_limit_minutes'] ?? 30} minutes • ${test['difficulty'] ?? 'Medium'}', style: const TextStyle(color: AppColors.textMed)),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Test feature coming soon!')),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.accentPrimary,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: const Text('Start Test', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
