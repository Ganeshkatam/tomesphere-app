import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/theme/colors.dart';

class AchievementsScreen extends StatefulWidget {
  const AchievementsScreen({super.key});

  @override
  State<AchievementsScreen> createState() => _AchievementsScreenState();
}

class _AchievementsScreenState extends State<AchievementsScreen> {
  List<Map<String, dynamic>> allAchievements = [];
  Set<String> earnedIds = {};
  int totalPoints = 0;
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _loadAchievements();
  }

  Future<void> _loadAchievements() async {
    final user = Supabase.instance.client.auth.currentUser;
    
    try {
      // Load all achievements
      final achievements = await Supabase.instance.client
          .from('achievements')
          .select()
          .order('points', ascending: true);

      // Load user's earned achievements
      if (user != null) {
        final userAchievements = await Supabase.instance.client
            .from('user_achievements')
            .select('achievement_id')
            .eq('user_id', user.id);

        earnedIds = Set<String>.from(
          userAchievements.map((a) => a['achievement_id'].toString())
        );

        // Calculate total points
        for (final a in achievements) {
          if (earnedIds.contains(a['id'].toString())) {
            totalPoints += (a['points'] ?? 0) as int;
          }
        }
      }

      setState(() {
        allAchievements = List<Map<String, dynamic>>.from(achievements);
        loading = false;
      });
    } catch (e) {
      debugPrint('Error: $e');
      setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final earned = allAchievements.where((a) => earnedIds.contains(a['id'].toString())).toList();
    final locked = allAchievements.where((a) => !earnedIds.contains(a['id'].toString())).toList();

    return Scaffold(
      backgroundColor: AppColors.bgCanvas,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('Achievements', style: TextStyle(fontWeight: FontWeight.w800)),
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.accentPrimary))
          : ListView(
              padding: const EdgeInsets.all(20),
              children: [
                // Points Card
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppColors.accentOrange, AppColors.accentCoral],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.stars, color: Colors.white, size: 40),
                      const SizedBox(width: 16),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('$totalPoints', style: const TextStyle(fontSize: 36, fontWeight: FontWeight.w900, color: Colors.white)),
                          const Text('Total Points', style: TextStyle(color: Colors.white70)),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Progress
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surface1,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Unlocked', style: TextStyle(color: AppColors.textHigh, fontWeight: FontWeight.w600)),
                          Text('${earned.length} / ${allAchievements.length}', style: const TextStyle(color: AppColors.accentPrimary, fontWeight: FontWeight.w700)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      LinearProgressIndicator(
                        value: allAchievements.isEmpty ? 0 : earned.length / allAchievements.length,
                        backgroundColor: AppColors.surface2,
                        valueColor: const AlwaysStoppedAnimation(AppColors.accentSecondary),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Earned Achievements
                if (earned.isNotEmpty) ...[
                  const Text('UNLOCKED', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.accentSecondary, letterSpacing: 2)),
                  const SizedBox(height: 12),
                  ...earned.map((a) => _buildAchievementCard(a, true)),
                  const SizedBox(height: 24),
                ],

                // Locked Achievements
                if (locked.isNotEmpty) ...[
                  const Text('LOCKED', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textLow, letterSpacing: 2)),
                  const SizedBox(height: 12),
                  ...locked.map((a) => _buildAchievementCard(a, false)),
                ],
              ],
            ),
    );
  }

  Widget _buildAchievementCard(Map<String, dynamic> achievement, bool unlocked) {
    final points = achievement['points'] ?? 0;
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: unlocked ? AppColors.accentSecondary.withOpacity(0.1) : AppColors.surface1,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: unlocked ? AppColors.accentSecondary.withOpacity(0.3) : AppColors.surface2,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: unlocked ? AppColors.accentSecondary.withOpacity(0.2) : AppColors.surface2,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Center(
              child: Text(
                achievement['badge_icon'] ?? '🏆',
                style: TextStyle(fontSize: 28, color: unlocked ? null : Colors.grey),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  achievement['name'] ?? 'Achievement',
                  style: TextStyle(
                    color: unlocked ? AppColors.textHigh : AppColors.textMed,
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  achievement['description'] ?? '',
                  style: TextStyle(color: unlocked ? AppColors.textMed : AppColors.textLow, fontSize: 12),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: unlocked ? AppColors.accentOrange.withOpacity(0.2) : AppColors.surface2,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              '+$points',
              style: TextStyle(
                color: unlocked ? AppColors.accentOrange : AppColors.textLow,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
