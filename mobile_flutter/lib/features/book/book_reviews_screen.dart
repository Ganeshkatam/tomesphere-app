import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/theme/colors.dart';

class BookReviewsScreen extends StatefulWidget {
  final String bookId;
  final String bookTitle;

  const BookReviewsScreen({super.key, required this.bookId, required this.bookTitle});

  @override
  State<BookReviewsScreen> createState() => _BookReviewsScreenState();
}

class _BookReviewsScreenState extends State<BookReviewsScreen> {
  List<Map<String, dynamic>> reviews = [];
  bool loading = true;
  double averageRating = 0;

  @override
  void initState() {
    super.initState();
    _loadReviews();
  }

  Future<void> _loadReviews() async {
    try {
      final data = await Supabase.instance.client
          .from('reviews')
          .select('*, profiles(full_name, avatar_url)')
          .eq('book_id', widget.bookId)
          .order('created_at', ascending: false);

      double total = 0;
      for (final r in data) {
        total += (r['rating'] ?? 0);
      }

      setState(() {
        reviews = List<Map<String, dynamic>>.from(data);
        averageRating = reviews.isNotEmpty ? total / reviews.length : 0;
        loading = false;
      });
    } catch (e) {
      debugPrint('Error: $e');
      setState(() => loading = false);
    }
  }

  void _showWriteReview() {
    final contentController = TextEditingController();
    int selectedRating = 5;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface1,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Padding(
          padding: EdgeInsets.only(
            left: 20, right: 20, top: 20,
            bottom: MediaQuery.of(context).viewInsets.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Write a Review', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.textHigh)),
              const SizedBox(height: 8),
              Text(widget.bookTitle, style: const TextStyle(color: AppColors.textMed)),
              const SizedBox(height: 20),
              
              // Star rating
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (index) {
                  return GestureDetector(
                    onTap: () => setModalState(() => selectedRating = index + 1),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: Icon(
                        index < selectedRating ? Icons.star : Icons.star_border,
                        color: AppColors.accentOrange,
                        size: 40,
                      ),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 20),
              
              TextField(
                controller: contentController,
                style: const TextStyle(color: AppColors.textHigh),
                maxLines: 4,
                decoration: InputDecoration(
                  hintText: 'Share your thoughts about this book...',
                  hintStyle: const TextStyle(color: AppColors.textLow),
                  filled: true,
                  fillColor: AppColors.bgCanvas,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 20),
              
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    final user = Supabase.instance.client.auth.currentUser;
                    if (user == null) return;

                    HapticFeedback.mediumImpact();

                    try {
                      await Supabase.instance.client.from('reviews').insert({
                        'user_id': user.id,
                        'book_id': widget.bookId,
                        'rating': selectedRating,
                        'content': contentController.text,
                      });
                      Navigator.pop(context);
                      _loadReviews();
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Review posted!'), backgroundColor: AppColors.accentSecondary),
                      );
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
                  child: const Text('Post Review', style: TextStyle(fontWeight: FontWeight.w700)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgCanvas,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('Reviews', style: TextStyle(fontWeight: FontWeight.w800)),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showWriteReview,
        backgroundColor: AppColors.accentPrimary,
        icon: const Icon(Icons.edit),
        label: const Text('Write Review'),
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.accentPrimary))
          : Column(
              children: [
                // Average rating header
                Container(
                  margin: const EdgeInsets.all(16),
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [AppColors.accentOrange.withOpacity(0.2), AppColors.accentOrange.withOpacity(0.05)],
                    ),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        averageRating.toStringAsFixed(1),
                        style: const TextStyle(fontSize: 48, fontWeight: FontWeight.w900, color: AppColors.accentOrange),
                      ),
                      const SizedBox(width: 16),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: List.generate(5, (i) => Icon(
                              i < averageRating.round() ? Icons.star : Icons.star_border,
                              color: AppColors.accentOrange,
                              size: 20,
                            )),
                          ),
                          Text('${reviews.length} reviews', style: const TextStyle(color: AppColors.textMed)),
                        ],
                      ),
                    ],
                  ),
                ),
                
                // Reviews list
                Expanded(
                  child: reviews.isEmpty
                      ? const Center(child: Text('No reviews yet. Be the first!', style: TextStyle(color: AppColors.textMed)))
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: reviews.length,
                          itemBuilder: (context, index) => _buildReviewCard(reviews[index]),
                        ),
                ),
              ],
            ),
    );
  }

  Widget _buildReviewCard(Map<String, dynamic> review) {
    final userName = review['profiles']?['full_name'] ?? 'Anonymous';
    final rating = review['rating'] ?? 0;
    final content = review['content'] ?? '';
    final createdAt = DateTime.parse(review['created_at']);
    final dateStr = '${createdAt.day}/${createdAt.month}/${createdAt.year}';

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
                  color: AppColors.accentPrimary.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(userName[0].toUpperCase(), style: const TextStyle(color: AppColors.accentPrimary, fontWeight: FontWeight.w800)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(userName, style: const TextStyle(color: AppColors.textHigh, fontWeight: FontWeight.w600)),
                    Text(dateStr, style: const TextStyle(color: AppColors.textLow, fontSize: 12)),
                  ],
                ),
              ),
              Row(
                children: List.generate(5, (i) => Icon(
                  i < rating ? Icons.star : Icons.star_border,
                  color: AppColors.accentOrange,
                  size: 16,
                )),
              ),
            ],
          ),
          if (content.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(content, style: const TextStyle(color: AppColors.textMed, height: 1.5)),
          ],
        ],
      ),
    );
  }
}
