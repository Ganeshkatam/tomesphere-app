import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/theme/colors.dart';

class BookmarksScreen extends StatefulWidget {
  const BookmarksScreen({super.key});

  @override
  State<BookmarksScreen> createState() => _BookmarksScreenState();
}

class _BookmarksScreenState extends State<BookmarksScreen> {
  List<Map<String, dynamic>> bookmarks = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _loadBookmarks();
  }

  Future<void> _loadBookmarks() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) {
      setState(() => loading = false);
      return;
    }

    try {
      final data = await Supabase.instance.client
          .from('bookmarks')
          .select('*, books(title, author, cover_url)')
          .eq('user_id', user.id)
          .order('created_at', ascending: false);

      setState(() {
        bookmarks = List<Map<String, dynamic>>.from(data);
        loading = false;
      });
    } catch (e) {
      debugPrint('Error: $e');
      setState(() => loading = false);
    }
  }

  Future<void> _deleteBookmark(String id) async {
    HapticFeedback.selectionClick();
    try {
      await Supabase.instance.client.from('bookmarks').delete().eq('id', id);
      _loadBookmarks();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgCanvas,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('Bookmarks', style: TextStyle(fontWeight: FontWeight.w800)),
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.accentPrimary))
          : bookmarks.isEmpty
              ? _buildEmptyState()
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: bookmarks.length,
                  itemBuilder: (context, index) => _buildBookmarkCard(bookmarks[index]),
                ),
    );
  }

  Widget _buildEmptyState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.bookmark_border, size: 48, color: AppColors.textLow),
          SizedBox(height: 16),
          Text('No bookmarks yet', style: TextStyle(color: AppColors.textMed)),
        ],
      ),
    );
  }

  Widget _buildBookmarkCard(Map<String, dynamic> bookmark) {
    final book = bookmark['books'];
    final pageNumber = bookmark['page_number'] ?? 0;
    final label = bookmark['label'] ?? 'Page $pageNumber';

    return Dismissible(
      key: Key(bookmark['id'].toString()),
      direction: DismissDirection.endToStart,
      onDismissed: (_) => _deleteBookmark(bookmark['id']),
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        decoration: BoxDecoration(
          color: AppColors.error,
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Icon(Icons.delete, color: Colors.white),
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface1,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.surface2),
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 64,
              decoration: BoxDecoration(
                color: AppColors.accentPrimary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: book?['cover_url'] != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.network(book['cover_url'], fit: BoxFit.cover),
                    )
                  : const Icon(Icons.book, color: AppColors.accentPrimary),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(book?['title'] ?? 'Unknown Book', style: const TextStyle(color: AppColors.textHigh, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text(label, style: const TextStyle(color: AppColors.accentPrimary, fontSize: 13)),
                  Text('Page $pageNumber', style: const TextStyle(color: AppColors.textMed, fontSize: 12)),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.accentOrange.withOpacity(0.2),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.bookmark, color: AppColors.accentOrange, size: 20),
            ),
          ],
        ),
      ),
    );
  }
}
