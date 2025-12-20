import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/theme/colors.dart';

class LibraryScreen extends ConsumerStatefulWidget {
  const LibraryScreen({super.key});

  @override
  ConsumerState<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends ConsumerState<LibraryScreen> {
  List<Map<String, dynamic>> books = [];
  String selectedTab = 'all';
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _fetchBooks();
  }

  Future<void> _fetchBooks() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) {
      setState(() => loading = false);
      return;
    }

    try {
      final data = await Supabase.instance.client
          .from('reading_lists')
          .select('*, books(*)')
          .eq('user_id', user.id);
      
      setState(() {
        books = List<Map<String, dynamic>>.from(data);
        loading = false;
      });
    } catch (e) {
      debugPrint('Error: $e');
      setState(() => loading = false);
    }
  }

  List<Map<String, dynamic>> get filteredBooks {
    if (selectedTab == 'all') return books;
    if (selectedTab == 'reading') {
      return books.where((b) => b['status'] == 'currently_reading').toList();
    }
    if (selectedTab == 'finished') {
      return books.where((b) => b['status'] == 'finished').toList();
    }
    return books.where((b) => b['status'] == 'want_to_read').toList();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.bgCanvas,
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 20),
                  const Text(
                    'MY LIBRARY',
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w900,
                      color: AppColors.textHigh,
                      letterSpacing: 2,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${books.length} BOOKS IN YOUR COLLECTION',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textMed,
                      letterSpacing: 2,
                    ),
                  ),
                ],
              ),
            ),

            // Tabs
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  _buildTab('All', 'all'),
                  const SizedBox(width: 10),
                  _buildTab('Reading', 'reading'),
                  const SizedBox(width: 10),
                  _buildTab('Finished', 'finished'),
                  const SizedBox(width: 10),
                  _buildTab('Want to Read', 'want'),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Books Grid
            Expanded(
              child: loading
                  ? const Center(child: CircularProgressIndicator(color: AppColors.accentPrimary))
                  : filteredBooks.isEmpty
                      ? _buildEmptyState()
                      : GridView.builder(
                          padding: const EdgeInsets.fromLTRB(20, 0, 20, 120),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            crossAxisSpacing: 16,
                            mainAxisSpacing: 16,
                            childAspectRatio: 0.65,
                          ),
                          itemCount: filteredBooks.length,
                          itemBuilder: (context, index) {
                            final item = filteredBooks[index];
                            final book = item['books'] as Map<String, dynamic>?;
                            if (book == null) return const SizedBox();
                            return _buildBookCard(book, item['status']);
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTab(String label, String value) {
    final isActive = selectedTab == value;
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() => selectedTab = value);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        decoration: BoxDecoration(
          color: isActive ? AppColors.accentPrimary : AppColors.surface1,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isActive ? Colors.white : AppColors.textMed,
            fontWeight: FontWeight.w700,
            fontSize: 14,
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              color: AppColors.surface1,
              borderRadius: BorderRadius.circular(30),
            ),
            child: const Icon(Icons.library_books_outlined, size: 48, color: AppColors.textLow),
          ),
          const SizedBox(height: 24),
          const Text(
            'No books yet',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: AppColors.textHigh,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Start exploring to add books',
            style: TextStyle(color: AppColors.textMed, fontSize: 14),
          ),
        ],
      ),
    );
  }

  Widget _buildBookCard(Map<String, dynamic> book, String status) {
    return GestureDetector(
      onTap: () => HapticFeedback.selectionClick(),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface1,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.surface2),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Cover
            Expanded(
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                child: book['cover_url'] != null
                    ? CachedNetworkImage(
                        imageUrl: book['cover_url'],
                        fit: BoxFit.cover,
                        width: double.infinity,
                        placeholder: (_, __) => Container(
                          color: AppColors.surface2,
                          child: const Icon(Icons.book, color: AppColors.textLow, size: 40),
                        ),
                        errorWidget: (_, __, ___) => Container(
                          color: AppColors.accentPrimary.withOpacity(0.2),
                          child: const Icon(Icons.book, color: AppColors.accentPrimary, size: 40),
                        ),
                      )
                    : Container(
                        color: AppColors.accentPrimary.withOpacity(0.2),
                        child: const Center(
                          child: Icon(Icons.book, color: AppColors.accentPrimary, size: 40),
                        ),
                      ),
              ),
            ),
            // Info
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    book['title'] ?? 'Unknown',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textHigh,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    book['author'] ?? 'Unknown Author',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textMed,
                    ),
                  ),
                  const SizedBox(height: 8),
                  _buildStatusBadge(status),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color;
    String label;
    
    switch (status) {
      case 'currently_reading':
        color = AppColors.accentOrange;
        label = 'Reading';
        break;
      case 'finished':
        color = AppColors.success;
        label = 'Finished';
        break;
      default:
        color = AppColors.accentBlue;
        label = 'To Read';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
