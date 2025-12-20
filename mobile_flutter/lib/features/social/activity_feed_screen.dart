import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/theme/colors.dart';

class ActivityFeedScreen extends StatefulWidget {
  const ActivityFeedScreen({super.key});

  @override
  State<ActivityFeedScreen> createState() => _ActivityFeedScreenState();
}

class _ActivityFeedScreenState extends State<ActivityFeedScreen> {
  List<Map<String, dynamic>> activities = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _loadActivities();
  }

  Future<void> _loadActivities() async {
    try {
      // Fetch recent reviews
      final reviews = await Supabase.instance.client
          .from('reviews')
          .select('*, profiles(full_name, avatar_url), books(title)')
          .order('created_at', ascending: false)
          .limit(20);

      // Fetch recent reading list updates
      final readingUpdates = await Supabase.instance.client
          .from('reading_lists')
          .select('*, profiles(full_name), books(title)')
          .order('created_at', ascending: false)
          .limit(20);

      List<Map<String, dynamic>> allActivities = [];

      for (final r in reviews) {
        allActivities.add({
          'type': 'review',
          'user': r['profiles']?['full_name'] ?? 'Someone',
          'book': r['books']?['title'] ?? 'a book',
          'rating': r['rating'],
          'content': r['content'],
          'created_at': r['created_at'],
        });
      }

      for (final r in readingUpdates) {
        allActivities.add({
          'type': 'reading_update',
          'user': r['profiles']?['full_name'] ?? 'Someone',
          'book': r['books']?['title'] ?? 'a book',
          'status': r['status'],
          'created_at': r['created_at'],
        });
      }

      // Sort by date
      allActivities.sort((a, b) => (b['created_at'] ?? '').compareTo(a['created_at'] ?? ''));

      setState(() {
        activities = allActivities.take(30).toList();
        loading = false;
      });
    } catch (e) {
      debugPrint('Error: $e');
      setState(() => loading = false);
    }
  }

  String _formatStatus(String status) {
    switch (status) {
      case 'currently_reading': return 'started reading';
      case 'finished': return 'finished reading';
      case 'want_to_read': return 'wants to read';
      default: return 'updated';
    }
  }

  String _timeAgo(String? dateStr) {
    if (dateStr == null) return '';
    final date = DateTime.parse(dateStr);
    final diff = DateTime.now().difference(date);
    
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${date.day}/${date.month}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgCanvas,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('Activity Feed', style: TextStyle(fontWeight: FontWeight.w800)),
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.accentPrimary))
          : activities.isEmpty
              ? const Center(child: Text('No activity yet', style: TextStyle(color: AppColors.textMed)))
              : RefreshIndicator(
                  onRefresh: _loadActivities,
                  color: AppColors.accentPrimary,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: activities.length,
                    itemBuilder: (context, index) => _buildActivityCard(activities[index]),
                  ),
                ),
    );
  }

  Widget _buildActivityCard(Map<String, dynamic> activity) {
    final isReview = activity['type'] == 'review';
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface1,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.surface2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: isReview ? AppColors.accentOrange.withOpacity(0.2) : AppColors.accentSecondary.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isReview ? Icons.rate_review : Icons.menu_book,
                  color: isReview ? AppColors.accentOrange : AppColors.accentSecondary,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    RichText(
                      text: TextSpan(
                        style: const TextStyle(color: AppColors.textHigh, fontSize: 14),
                        children: [
                          TextSpan(text: activity['user'], style: const TextStyle(fontWeight: FontWeight.w700)),
                          TextSpan(
                            text: isReview ? ' reviewed ' : ' ${_formatStatus(activity['status'] ?? '')} ',
                            style: const TextStyle(color: AppColors.textMed),
                          ),
                          TextSpan(text: activity['book'], style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.accentPrimary)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(_timeAgo(activity['created_at']), style: const TextStyle(color: AppColors.textLow, fontSize: 12)),
                  ],
                ),
              ),
              if (isReview && activity['rating'] != null)
                Row(
                  children: [
                    const Icon(Icons.star, color: AppColors.accentOrange, size: 16),
                    const SizedBox(width: 4),
                    Text('${activity['rating']}', style: const TextStyle(color: AppColors.accentOrange, fontWeight: FontWeight.w700)),
                  ],
                ),
            ],
          ),
          if (isReview && activity['content'] != null && activity['content'].toString().isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              '"${activity['content']}"',
              style: const TextStyle(color: AppColors.textMed, fontStyle: FontStyle.italic, fontSize: 13),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ],
      ),
    );
  }
}
