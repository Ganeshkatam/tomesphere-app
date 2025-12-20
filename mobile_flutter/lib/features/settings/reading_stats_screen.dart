import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/theme/colors.dart';

class ReadingStatsScreen extends StatefulWidget {
  const ReadingStatsScreen({super.key});

  @override
  State<ReadingStatsScreen> createState() => _ReadingStatsScreenState();
}

class _ReadingStatsScreenState extends State<ReadingStatsScreen> {
  Map<String, dynamic> stats = {};
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _fetchStats();
  }

  Future<void> _fetchStats() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) {
      setState(() => loading = false);
      return;
    }

    try {
      final readingList = await Supabase.instance.client
          .from('reading_lists')
          .select('status, created_at')
          .eq('user_id', user.id);

      final total = readingList.length;
      final finished = readingList.where((r) => r['status'] == 'finished').length;
      final reading = readingList.where((r) => r['status'] == 'currently_reading').length;
      final wantToRead = readingList.where((r) => r['status'] == 'want_to_read').length;

      // Calculate streak (simplified)
      final reviews = await Supabase.instance.client
          .from('reviews')
          .select('id')
          .eq('user_id', user.id);

      setState(() {
        stats = {
          'total': total,
          'finished': finished,
          'reading': reading,
          'wantToRead': wantToRead,
          'reviews': reviews.length,
          'streak': 7, // Placeholder
        };
        loading = false;
      });
    } catch (e) {
      debugPrint('Error: $e');
      setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgCanvas,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('Reading Stats', style: TextStyle(fontWeight: FontWeight.w800)),
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.accentPrimary))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  // Streak Card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppColors.accentOrange, AppColors.accentCoral],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Column(
                      children: [
                        const Icon(Icons.local_fire_department, color: Colors.white, size: 48),
                        const SizedBox(height: 12),
                        Text(
                          '${stats['streak'] ?? 0}',
                          style: const TextStyle(fontSize: 48, fontWeight: FontWeight.w900, color: Colors.white),
                        ),
                        const Text('Day Streak', style: TextStyle(color: Colors.white70, fontSize: 16)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Stats Grid
                  GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2,
                    mainAxisSpacing: 16,
                    crossAxisSpacing: 16,
                    children: [
                      _buildStatCard('Total Books', stats['total'] ?? 0, Icons.menu_book, AppColors.accentPrimary),
                      _buildStatCard('Finished', stats['finished'] ?? 0, Icons.check_circle, AppColors.accentSecondary),
                      _buildStatCard('Currently Reading', stats['reading'] ?? 0, Icons.auto_stories, AppColors.accentOrange),
                      _buildStatCard('Want to Read', stats['wantToRead'] ?? 0, Icons.bookmark, AppColors.accentBlue),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Reviews stat
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppColors.surface1,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.surface2),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: AppColors.accentCoral.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Icon(Icons.rate_review, color: AppColors.accentCoral),
                        ),
                        const SizedBox(width: 16),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('${stats['reviews'] ?? 0}', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: AppColors.textHigh)),
                            const Text('Reviews Written', style: TextStyle(color: AppColors.textMed)),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Achievement badges placeholder
                  const Align(
                    alignment: Alignment.centerLeft,
                    child: Text('ACHIEVEMENTS', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textLow, letterSpacing: 2)),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildBadge('📚', 'Bookworm', (stats['total'] ?? 0) >= 5),
                      _buildBadge('🏆', 'Finisher', (stats['finished'] ?? 0) >= 3),
                      _buildBadge('🔥', 'Streak', (stats['streak'] ?? 0) >= 7),
                      _buildBadge('⭐', 'Reviewer', (stats['reviews'] ?? 0) >= 5),
                    ],
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildStatCard(String label, int value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface1,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: color, size: 32),
          const SizedBox(height: 12),
          Text('$value', style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: color)),
          Text(label, style: const TextStyle(color: AppColors.textMed, fontSize: 12), textAlign: TextAlign.center),
        ],
      ),
    );
  }

  Widget _buildBadge(String emoji, String label, bool unlocked) {
    return Column(
      children: [
        Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            color: unlocked ? AppColors.accentPrimary.withOpacity(0.2) : AppColors.surface1,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: unlocked ? AppColors.accentPrimary : AppColors.surface2),
          ),
          child: Center(
            child: Text(emoji, style: TextStyle(fontSize: 28, color: unlocked ? null : Colors.grey)),
          ),
        ),
        const SizedBox(height: 8),
        Text(label, style: TextStyle(color: unlocked ? AppColors.textHigh : AppColors.textLow, fontSize: 11, fontWeight: FontWeight.w600)),
      ],
    );
  }
}
