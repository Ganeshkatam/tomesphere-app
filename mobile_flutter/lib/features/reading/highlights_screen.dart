import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/theme/colors.dart';

class HighlightsScreen extends StatefulWidget {
  const HighlightsScreen({super.key});

  @override
  State<HighlightsScreen> createState() => _HighlightsScreenState();
}

class _HighlightsScreenState extends State<HighlightsScreen> {
  List<Map<String, dynamic>> highlights = [];
  bool loading = true;

  final List<Color> highlightColors = [
    const Color(0xFFFFEB3B),
    const Color(0xFF4CAF50),
    const Color(0xFF2196F3),
    const Color(0xFFE91E63),
    const Color(0xFFFF9800),
  ];

  @override
  void initState() {
    super.initState();
    _loadHighlights();
  }

  Future<void> _loadHighlights() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) {
      setState(() => loading = false);
      return;
    }

    try {
      final data = await Supabase.instance.client
          .from('highlights')
          .select('*, books(title, author)')
          .eq('user_id', user.id)
          .order('created_at', ascending: false);

      setState(() {
        highlights = List<Map<String, dynamic>>.from(data);
        loading = false;
      });
    } catch (e) {
      debugPrint('Error: $e');
      setState(() => loading = false);
    }
  }

  Color _getColor(String? colorName) {
    switch (colorName?.toLowerCase()) {
      case 'yellow': return highlightColors[0];
      case 'green': return highlightColors[1];
      case 'blue': return highlightColors[2];
      case 'pink': return highlightColors[3];
      case 'orange': return highlightColors[4];
      default: return highlightColors[0];
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgCanvas,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('Highlights', style: TextStyle(fontWeight: FontWeight.w800)),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: Text('${highlights.length} highlights', style: const TextStyle(color: AppColors.textMed)),
            ),
          ),
        ],
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.accentPrimary))
          : highlights.isEmpty
              ? _buildEmptyState()
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: highlights.length,
                  itemBuilder: (context, index) => _buildHighlightCard(highlights[index]),
                ),
    );
  }

  Widget _buildEmptyState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.highlight, size: 48, color: AppColors.textLow),
          SizedBox(height: 16),
          Text('No highlights yet', style: TextStyle(color: AppColors.textMed)),
          SizedBox(height: 8),
          Text('Highlight text while reading to save it here', style: TextStyle(color: AppColors.textLow, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildHighlightCard(Map<String, dynamic> highlight) {
    final book = highlight['books'];
    final color = _getColor(highlight['color']);
    final note = highlight['note'];
    final pageNumber = highlight['page_number'];

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: AppColors.surface1,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.surface2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Color bar
          Container(
            height: 4,
            decoration: BoxDecoration(
              color: color,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Highlighted text
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '"${highlight['text'] ?? ''}"',
                    style: TextStyle(color: AppColors.textHigh, fontStyle: FontStyle.italic, height: 1.5),
                  ),
                ),
                const SizedBox(height: 12),
                
                // Note if exists
                if (note != null && note.toString().isNotEmpty) ...[
                  Row(
                    children: [
                      const Icon(Icons.note, size: 14, color: AppColors.textMed),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(note, style: const TextStyle(color: AppColors.textMed, fontSize: 13)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                ],
                
                // Book info
                Row(
                  children: [
                    const Icon(Icons.menu_book, size: 14, color: AppColors.accentPrimary),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        book?['title'] ?? 'Unknown Book',
                        style: const TextStyle(color: AppColors.accentPrimary, fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                    ),
                    if (pageNumber != null)
                      Text('p. $pageNumber', style: const TextStyle(color: AppColors.textLow, fontSize: 12)),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
