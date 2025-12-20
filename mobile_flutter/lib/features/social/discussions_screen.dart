import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/theme/colors.dart';

class DiscussionsScreen extends StatefulWidget {
  final String? bookId;
  const DiscussionsScreen({super.key, this.bookId});

  @override
  State<DiscussionsScreen> createState() => _DiscussionsScreenState();
}

class _DiscussionsScreenState extends State<DiscussionsScreen> {
  List<Map<String, dynamic>> discussions = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _loadDiscussions();
  }

  Future<void> _loadDiscussions() async {
    try {
      var query = Supabase.instance.client
          .from('discussions')
          .select('*, profiles(full_name), books(title)')
          .order('created_at', ascending: false);

      if (widget.bookId != null) {
        query = query.eq('book_id', widget.bookId!);
      }

      final data = await query.limit(50);

      setState(() {
        discussions = List<Map<String, dynamic>>.from(data);
        loading = false;
      });
    } catch (e) {
      debugPrint('Error: $e');
      setState(() => loading = false);
    }
  }

  void _showCreateDiscussion() {
    final titleController = TextEditingController();
    final contentController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface1,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          left: 20, right: 20, top: 20,
          bottom: MediaQuery.of(context).viewInsets.bottom + 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Start Discussion', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.textHigh)),
            const SizedBox(height: 20),
            TextField(
              controller: titleController,
              style: const TextStyle(color: AppColors.textHigh),
              decoration: _inputDecoration('Discussion Title'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: contentController,
              style: const TextStyle(color: AppColors.textHigh),
              maxLines: 4,
              decoration: _inputDecoration('What would you like to discuss?'),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  if (titleController.text.isEmpty) return;
                  final user = Supabase.instance.client.auth.currentUser;
                  if (user == null) return;

                  HapticFeedback.mediumImpact();

                  try {
                    await Supabase.instance.client.from('discussions').insert({
                      'user_id': user.id,
                      'book_id': widget.bookId,
                      'title': titleController.text,
                      'content': contentController.text,
                    });
                    Navigator.pop(context);
                    _loadDiscussions();
                  } catch (e) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
                    );
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.accentPrimary,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: const Text('Post Discussion', style: TextStyle(fontWeight: FontWeight.w700)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: AppColors.textLow),
      filled: true,
      fillColor: AppColors.bgCanvas,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgCanvas,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('Discussions', style: TextStyle(fontWeight: FontWeight.w800)),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showCreateDiscussion,
        backgroundColor: AppColors.accentPrimary,
        child: const Icon(Icons.add),
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.accentPrimary))
          : discussions.isEmpty
              ? const Center(child: Text('No discussions yet', style: TextStyle(color: AppColors.textMed)))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: discussions.length,
                  itemBuilder: (context, index) => _buildDiscussionCard(discussions[index]),
                ),
    );
  }

  Widget _buildDiscussionCard(Map<String, dynamic> discussion) {
    final userName = discussion['profiles']?['full_name'] ?? 'Anonymous';
    final bookTitle = discussion['books']?['title'];
    final isPinned = discussion['is_pinned'] == true;
    final viewCount = discussion['view_count'] ?? 0;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface1,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isPinned ? AppColors.accentOrange.withOpacity(0.5) : AppColors.surface2,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (isPinned) ...[
                const Icon(Icons.push_pin, color: AppColors.accentOrange, size: 16),
                const SizedBox(width: 8),
              ],
              Expanded(
                child: Text(
                  discussion['title'] ?? 'Untitled',
                  style: const TextStyle(color: AppColors.textHigh, fontWeight: FontWeight.w700, fontSize: 15),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (discussion['content'] != null)
            Text(
              discussion['content'],
              style: const TextStyle(color: AppColors.textMed, fontSize: 13, height: 1.4),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          const SizedBox(height: 12),
          Row(
            children: [
              CircleAvatar(
                radius: 12,
                backgroundColor: AppColors.accentPrimary.withOpacity(0.2),
                child: Text(userName[0], style: const TextStyle(color: AppColors.accentPrimary, fontSize: 10)),
              ),
              const SizedBox(width: 8),
              Text(userName, style: const TextStyle(color: AppColors.textMed, fontSize: 12)),
              const Spacer(),
              if (bookTitle != null) ...[
                const Icon(Icons.menu_book, size: 12, color: AppColors.textLow),
                const SizedBox(width: 4),
                Text(bookTitle, style: const TextStyle(color: AppColors.textLow, fontSize: 11)),
              ],
              const SizedBox(width: 12),
              const Icon(Icons.visibility, size: 12, color: AppColors.textLow),
              const SizedBox(width: 4),
              Text('$viewCount', style: const TextStyle(color: AppColors.textLow, fontSize: 11)),
            ],
          ),
        ],
      ),
    );
  }
}
