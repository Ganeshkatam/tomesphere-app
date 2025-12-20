import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/theme/colors.dart';

class BookDetailScreen extends StatefulWidget {
  final String bookId;
  
  const BookDetailScreen({super.key, required this.bookId});

  @override
  State<BookDetailScreen> createState() => _BookDetailScreenState();
}

class _BookDetailScreenState extends State<BookDetailScreen> {
  Map<String, dynamic>? book;
  bool loading = true;
  String? userStatus;

  @override
  void initState() {
    super.initState();
    _fetchBook();
    _fetchUserStatus();
  }

  Future<void> _fetchBook() async {
    try {
      final data = await Supabase.instance.client
          .from('books')
          .select()
          .eq('id', widget.bookId)
          .single();
      
      setState(() {
        book = data;
        loading = false;
      });
    } catch (e) {
      debugPrint('Error: $e');
      setState(() => loading = false);
    }
  }

  Future<void> _fetchUserStatus() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return;

    try {
      final data = await Supabase.instance.client
          .from('reading_lists')
          .select('status')
          .eq('user_id', user.id)
          .eq('book_id', widget.bookId)
          .maybeSingle();
      
      if (data != null) {
        setState(() => userStatus = data['status']);
      }
    } catch (e) {
      debugPrint('Error: $e');
    }
  }

  Future<void> _addToLibrary(String status) async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please sign in first')),
      );
      return;
    }

    HapticFeedback.mediumImpact();

    try {
      if (userStatus != null) {
        await Supabase.instance.client
            .from('reading_lists')
            .update({'status': status})
            .eq('user_id', user.id)
            .eq('book_id', widget.bookId);
      } else {
        await Supabase.instance.client.from('reading_lists').insert({
          'user_id': user.id,
          'book_id': widget.bookId,
          'status': status,
        });
      }

      setState(() => userStatus = status);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Added to $status!')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return Scaffold(
        backgroundColor: AppColors.bgCanvas,
        body: const Center(child: CircularProgressIndicator(color: AppColors.accentPrimary)),
      );
    }

    if (book == null) {
      return Scaffold(
        backgroundColor: AppColors.bgCanvas,
        appBar: AppBar(backgroundColor: Colors.transparent),
        body: const Center(child: Text('Book not found', style: TextStyle(color: AppColors.textMed))),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.bgCanvas,
      body: CustomScrollView(
        slivers: [
          // Hero Header
          SliverAppBar(
            expandedHeight: 300,
            pinned: true,
            backgroundColor: AppColors.bgCanvas,
            leading: IconButton(
              onPressed: () => Navigator.pop(context),
              icon: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.black45,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.arrow_back, color: Colors.white),
              ),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  // Cover image
                  book!['cover_url'] != null
                      ? CachedNetworkImage(
                          imageUrl: book!['cover_url'],
                          fit: BoxFit.cover,
                        )
                      : Container(
                          color: AppColors.accentPrimary.withOpacity(0.3),
                          child: const Icon(Icons.book, size: 80, color: AppColors.accentPrimary),
                        ),
                  // Gradient overlay
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          AppColors.bgCanvas.withOpacity(0.8),
                          AppColors.bgCanvas,
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title
                  Text(
                    book!['title'] ?? 'Unknown Title',
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w900,
                      color: AppColors.textHigh,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'by ${book!['author'] ?? 'Unknown Author'}',
                    style: const TextStyle(fontSize: 16, color: AppColors.textMed),
                  ),
                  const SizedBox(height: 16),

                  // Stats row
                  Row(
                    children: [
                      _buildStatChip(Icons.category, book!['genre'] ?? 'General'),
                      const SizedBox(width: 12),
                      _buildStatChip(Icons.menu_book, '${book!['pages'] ?? 'N/A'} pages'),
                      const SizedBox(width: 12),
                      if (book!['year'] != null) _buildStatChip(Icons.calendar_today, '${book!['year']}'),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Action buttons
                  Row(
                    children: [
                      Expanded(
                        child: _buildActionButton(
                          'Read Now',
                          Icons.play_arrow,
                          AppColors.accentPrimary,
                          () => _addToLibrary('currently_reading'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildActionButton(
                          'Add to List',
                          Icons.bookmark_add,
                          AppColors.surface1,
                          () => _showStatusPicker(),
                          outlined: true,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Status badge
                  if (userStatus != null)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        color: AppColors.accentSecondary.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.check_circle, color: AppColors.accentSecondary, size: 18),
                          const SizedBox(width: 8),
                          Text(
                            'In your library: ${_formatStatus(userStatus!)}',
                            style: const TextStyle(color: AppColors.accentSecondary, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(height: 24),

                  // Description
                  const Text(
                    'DESCRIPTION',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textMed,
                      letterSpacing: 2,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    book!['description'] ?? 'No description available.',
                    style: const TextStyle(
                      fontSize: 15,
                      color: AppColors.textMed,
                      height: 1.6,
                    ),
                  ),
                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatChip(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.surface1,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: AppColors.textMed),
          const SizedBox(width: 6),
          Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textMed)),
        ],
      ),
    );
  }

  Widget _buildActionButton(String label, IconData icon, Color color, VoidCallback onTap, {bool outlined = false}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: outlined ? Colors.transparent : color,
          borderRadius: BorderRadius.circular(16),
          border: outlined ? Border.all(color: AppColors.surface2, width: 2) : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: Colors.white, size: 20),
            const SizedBox(width: 8),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w700,
                fontSize: 15,
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatStatus(String status) {
    switch (status) {
      case 'currently_reading':
        return 'Reading';
      case 'finished':
        return 'Finished';
      case 'want_to_read':
        return 'Want to Read';
      default:
        return status;
    }
  }

  void _showStatusPicker() {
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
            const Text(
              'Add to...',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.textHigh),
            ),
            const SizedBox(height: 20),
            _buildStatusOption('Want to Read', 'want_to_read', Icons.bookmark, AppColors.accentBlue),
            _buildStatusOption('Currently Reading', 'currently_reading', Icons.menu_book, AppColors.accentOrange),
            _buildStatusOption('Finished', 'finished', Icons.check_circle, AppColors.accentSecondary),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusOption(String label, String status, IconData icon, Color color) {
    return ListTile(
      onTap: () {
        Navigator.pop(context);
        _addToLibrary(status);
      },
      leading: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: color.withOpacity(0.15),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: color),
      ),
      title: Text(label, style: const TextStyle(color: AppColors.textHigh, fontWeight: FontWeight.w600)),
      trailing: userStatus == status
          ? const Icon(Icons.check, color: AppColors.accentSecondary)
          : null,
    );
  }
}
