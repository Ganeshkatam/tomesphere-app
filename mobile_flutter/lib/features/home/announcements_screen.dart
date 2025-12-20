import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/theme/colors.dart';

class AnnouncementsScreen extends StatefulWidget {
  const AnnouncementsScreen({super.key});

  @override
  State<AnnouncementsScreen> createState() => _AnnouncementsScreenState();
}

class _AnnouncementsScreenState extends State<AnnouncementsScreen> {
  List<Map<String, dynamic>> announcements = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _loadAnnouncements();
  }

  Future<void> _loadAnnouncements() async {
    try {
      final now = DateTime.now().toIso8601String();
      final data = await Supabase.instance.client
          .from('announcements')
          .select()
          .eq('is_active', true)
          .lte('starts_at', now)
          .order('created_at', ascending: false);

      setState(() {
        announcements = List<Map<String, dynamic>>.from(data);
        loading = false;
      });
    } catch (e) {
      debugPrint('Error: $e');
      setState(() => loading = false);
    }
  }

  IconData _getTypeIcon(String? type) {
    switch (type) {
      case 'update': return Icons.system_update;
      case 'event': return Icons.event;
      case 'promo': return Icons.local_offer;
      case 'alert': return Icons.warning;
      default: return Icons.campaign;
    }
  }

  Color _getTypeColor(String? type) {
    switch (type) {
      case 'update': return AppColors.accentBlue;
      case 'event': return AppColors.accentSecondary;
      case 'promo': return AppColors.accentOrange;
      case 'alert': return AppColors.error;
      default: return AppColors.accentPrimary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgCanvas,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('Announcements', style: TextStyle(fontWeight: FontWeight.w800)),
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.accentPrimary))
          : announcements.isEmpty
              ? const Center(child: Text('No announcements', style: TextStyle(color: AppColors.textMed)))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: announcements.length,
                  itemBuilder: (context, index) => _buildAnnouncementCard(announcements[index]),
                ),
    );
  }

  Widget _buildAnnouncementCard(Map<String, dynamic> announcement) {
    final type = announcement['type'];
    final color = _getTypeColor(type);
    final icon = _getTypeIcon(type);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: AppColors.surface1,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: color, size: 24),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        announcement['title'] ?? 'Announcement',
                        style: const TextStyle(color: AppColors.textHigh, fontWeight: FontWeight.w700, fontSize: 16),
                      ),
                      if (type != null)
                        Text(
                          type.toString().toUpperCase(),
                          style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(
              announcement['content'] ?? '',
              style: const TextStyle(color: AppColors.textMed, height: 1.5),
            ),
          ),
        ],
      ),
    );
  }
}
