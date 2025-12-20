import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/theme/colors.dart';

class ExploreScreen extends StatefulWidget {
  const ExploreScreen({super.key});

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> {
  final _searchController = TextEditingController();
  List<Map<String, dynamic>> books = [];
  List<Map<String, dynamic>> filteredBooks = [];
  bool loading = true;
  String selectedGenre = 'All';

  final List<String> genres = ['All', 'Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Sci-Fi', 'Fantasy', 'Biography'];

  @override
  void initState() {
    super.initState();
    _fetchBooks();
    _searchController.addListener(_onSearch);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchBooks() async {
    try {
      final data = await Supabase.instance.client
          .from('books')
          .select()
          .order('created_at', ascending: false);
      
      setState(() {
        books = List<Map<String, dynamic>>.from(data);
        filteredBooks = books;
        loading = false;
      });
    } catch (e) {
      debugPrint('Error: $e');
      setState(() => loading = false);
    }
  }

  void _onSearch() {
    final query = _searchController.text.toLowerCase();
    setState(() {
      filteredBooks = books.where((book) {
        final title = (book['title'] ?? '').toString().toLowerCase();
        final author = (book['author'] ?? '').toString().toLowerCase();
        final matchesSearch = title.contains(query) || author.contains(query);
        final matchesGenre = selectedGenre == 'All' || book['genre'] == selectedGenre;
        return matchesSearch && matchesGenre;
      }).toList();
    });
  }

  void _selectGenre(String genre) {
    HapticFeedback.selectionClick();
    setState(() {
      selectedGenre = genre;
      _onSearch();
    });
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
              padding: const EdgeInsets.fromLTRB(24, 40, 24, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'EXPLORE',
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w900,
                      color: AppColors.textHigh,
                      letterSpacing: 2,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${books.length} BOOKS AVAILABLE',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textMed,
                      letterSpacing: 2,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Search Bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: TextField(
                controller: _searchController,
                style: const TextStyle(color: AppColors.textHigh),
                decoration: InputDecoration(
                  hintText: 'Search books, authors...',
                  hintStyle: const TextStyle(color: AppColors.textMed),
                  prefixIcon: const Icon(Icons.search, color: AppColors.textMed),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, color: AppColors.textMed),
                          onPressed: () {
                            _searchController.clear();
                            _onSearch();
                          },
                        )
                      : null,
                  filled: true,
                  fillColor: AppColors.surface1,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(18),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Genre Filter
            SizedBox(
              height: 40,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: genres.length,
                itemBuilder: (context, index) {
                  final genre = genres[index];
                  final isActive = selectedGenre == genre;
                  return Padding(
                    padding: const EdgeInsets.only(right: 10),
                    child: GestureDetector(
                      onTap: () => _selectGenre(genre),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 18),
                        decoration: BoxDecoration(
                          color: isActive ? AppColors.accentPrimary : AppColors.surface1,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isActive ? AppColors.accentPrimary : AppColors.surface2,
                          ),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          genre,
                          style: TextStyle(
                            color: isActive ? Colors.white : AppColors.textMed,
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ),
                  );
                },
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
                          padding: const EdgeInsets.fromLTRB(24, 0, 24, 120),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            crossAxisSpacing: 16,
                            mainAxisSpacing: 16,
                            childAspectRatio: 0.65,
                          ),
                          itemCount: filteredBooks.length,
                          itemBuilder: (context, index) {
                            return _buildBookCard(filteredBooks[index]);
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.search_off, size: 64, color: AppColors.textLow),
          const SizedBox(height: 16),
          const Text(
            'No books found',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppColors.textHigh,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Try a different search or genre',
            style: TextStyle(color: AppColors.textMed, fontSize: 14),
          ),
        ],
      ),
    );
  }

  Widget _buildBookCard(Map<String, dynamic> book) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        // TODO: Navigate to book details
      },
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
                          child: const Center(
                            child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.accentPrimary),
                          ),
                        ),
                        errorWidget: (_, __, ___) => _buildPlaceholderCover(book['title']),
                      )
                    : _buildPlaceholderCover(book['title']),
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
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.accentPrimary.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      book['genre'] ?? 'General',
                      style: const TextStyle(
                        color: AppColors.accentPrimary,
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlaceholderCover(String? title) {
    return Container(
      color: AppColors.accentPrimary.withOpacity(0.2),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.book, color: AppColors.accentPrimary, size: 40),
            if (title != null) ...[
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Text(
                  title,
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppColors.accentPrimary,
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
