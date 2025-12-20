import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/colors.dart';

class AddBookScreen extends StatefulWidget {
  const AddBookScreen({super.key});

  @override
  State<AddBookScreen> createState() => _AddBookScreenState();
}

class _AddBookScreenState extends State<AddBookScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _authorController = TextEditingController();
  final _descController = TextEditingController();
  final _coverController = TextEditingController();
  final _pagesController = TextEditingController();
  final _yearController = TextEditingController();
  String _genre = 'Fiction';
  bool _isTextbook = false;
  bool saving = false;

  final genres = ['Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Sci-Fi', 'Fantasy', 'Biography', 'Self-Help', 'History'];

  @override
  void dispose() {
    _titleController.dispose();
    _authorController.dispose();
    _descController.dispose();
    _coverController.dispose();
    _pagesController.dispose();
    _yearController.dispose();
    super.dispose();
  }

  Future<void> _saveBook() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => saving = true);
    HapticFeedback.mediumImpact();

    try {
      await Supabase.instance.client.from('books').insert({
        'title': _titleController.text.trim(),
        'author': _authorController.text.trim(),
        'description': _descController.text.trim(),
        'cover_url': _coverController.text.trim().isNotEmpty ? _coverController.text.trim() : null,
        'pages': int.tryParse(_pagesController.text) ?? 0,
        'year': int.tryParse(_yearController.text),
        'genre': _genre,
        'is_textbook': _isTextbook,
      });

      // Log admin action
      final user = Supabase.instance.client.auth.currentUser;
      if (user != null) {
        await Supabase.instance.client.from('admin_audit_logs').insert({
          'admin_id': user.id,
          'action': 'add_book',
          'details': 'Added book: ${_titleController.text}',
        });
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Book added!'), backgroundColor: AppColors.accentSecondary),
        );
        context.pop();
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
      );
    }
    setState(() => saving = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgCanvas,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('Add Book', style: TextStyle(fontWeight: FontWeight.w800)),
        actions: [
          TextButton(
            onPressed: saving ? null : _saveBook,
            child: saving
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.accentPrimary))
                : const Text('Save', style: TextStyle(color: AppColors.accentPrimary, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildField('Title *', _titleController, 'Enter book title', validator: (v) => v!.isEmpty ? 'Required' : null),
              const SizedBox(height: 16),
              _buildField('Author *', _authorController, 'Enter author name', validator: (v) => v!.isEmpty ? 'Required' : null),
              const SizedBox(height: 16),
              _buildField('Description', _descController, 'Enter description', maxLines: 4),
              const SizedBox(height: 16),
              _buildField('Cover URL', _coverController, 'https://...'),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(child: _buildField('Pages', _pagesController, '0', keyboardType: TextInputType.number)),
                  const SizedBox(width: 16),
                  Expanded(child: _buildField('Year', _yearController, '2024', keyboardType: TextInputType.number)),
                ],
              ),
              const SizedBox(height: 20),

              // Genre
              const Text('Genre', style: TextStyle(color: AppColors.textMed, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: genres.map((g) {
                  final isSelected = _genre == g;
                  return GestureDetector(
                    onTap: () => setState(() => _genre = g),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        color: isSelected ? AppColors.accentPrimary : AppColors.surface1,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: isSelected ? AppColors.accentPrimary : AppColors.surface2),
                      ),
                      child: Text(g, style: TextStyle(color: isSelected ? Colors.white : AppColors.textMed, fontWeight: FontWeight.w600, fontSize: 13)),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 20),

              // Textbook toggle
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surface1,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.school, color: AppColors.accentPrimary),
                        SizedBox(width: 12),
                        Text('Academic Textbook', style: TextStyle(color: AppColors.textHigh, fontWeight: FontWeight.w600)),
                      ],
                    ),
                    Switch(
                      value: _isTextbook,
                      onChanged: (val) => setState(() => _isTextbook = val),
                      activeColor: AppColors.accentPrimary,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 100),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildField(String label, TextEditingController controller, String hint, {String? Function(String?)? validator, int maxLines = 1, TextInputType? keyboardType}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: AppColors.textMed, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          validator: validator,
          maxLines: maxLines,
          keyboardType: keyboardType,
          style: const TextStyle(color: AppColors.textHigh),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: AppColors.textLow),
            filled: true,
            fillColor: AppColors.surface1,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppColors.accentPrimary, width: 2)),
          ),
        ),
      ],
    );
  }
}
