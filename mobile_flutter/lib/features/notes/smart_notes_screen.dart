import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/theme/colors.dart';

class SmartNotesScreen extends StatefulWidget {
  const SmartNotesScreen({super.key});

  @override
  State<SmartNotesScreen> createState() => _SmartNotesScreenState();
}

class _SmartNotesScreenState extends State<SmartNotesScreen> {
  List<Map<String, dynamic>> notes = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _loadNotes();
  }

  Future<void> _loadNotes() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) {
      setState(() => loading = false);
      return;
    }

    try {
      final data = await Supabase.instance.client
          .from('student_notes')
          .select('*, books(title)')
          .eq('user_id', user.id)
          .order('updated_at', ascending: false);

      setState(() {
        notes = List<Map<String, dynamic>>.from(data);
        loading = false;
      });
    } catch (e) {
      debugPrint('Error: $e');
      setState(() => loading = false);
    }
  }

  void _showNoteEditor({Map<String, dynamic>? note}) {
    final titleController = TextEditingController(text: note?['title'] ?? '');
    final contentController = TextEditingController(text: note?['content'] ?? '');
    final isEditing = note != null;

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
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(isEditing ? 'Edit Note' : 'New Note', 
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.textHigh)),
                if (isEditing)
                  IconButton(
                    onPressed: () => _deleteNote(note['id']),
                    icon: const Icon(Icons.delete, color: AppColors.error),
                  ),
              ],
            ),
            const SizedBox(height: 20),
            TextField(
              controller: titleController,
              style: const TextStyle(color: AppColors.textHigh, fontWeight: FontWeight.w700),
              decoration: const InputDecoration(
                hintText: 'Note title...',
                hintStyle: TextStyle(color: AppColors.textLow),
                border: InputBorder.none,
              ),
            ),
            const Divider(color: AppColors.surface2),
            TextField(
              controller: contentController,
              style: const TextStyle(color: AppColors.textHigh),
              maxLines: 8,
              decoration: const InputDecoration(
                hintText: 'Write your note here...',
                hintStyle: TextStyle(color: AppColors.textLow),
                border: InputBorder.none,
              ),
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
                    if (isEditing) {
                      await Supabase.instance.client.from('student_notes').update({
                        'title': titleController.text,
                        'content': contentController.text,
                        'updated_at': DateTime.now().toIso8601String(),
                      }).eq('id', note['id']);
                    } else {
                      await Supabase.instance.client.from('student_notes').insert({
                        'user_id': user.id,
                        'title': titleController.text,
                        'content': contentController.text,
                      });
                    }
                    Navigator.pop(context);
                    _loadNotes();
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
                child: Text(isEditing ? 'Update Note' : 'Save Note', 
                    style: const TextStyle(fontWeight: FontWeight.w700)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _deleteNote(String noteId) async {
    HapticFeedback.heavyImpact();
    Navigator.pop(context);

    try {
      await Supabase.instance.client.from('student_notes').delete().eq('id', noteId);
      _loadNotes();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Note deleted'), backgroundColor: AppColors.accentSecondary),
      );
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
        title: const Text('Smart Notes', style: TextStyle(fontWeight: FontWeight.w800)),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showNoteEditor(),
        backgroundColor: AppColors.accentPrimary,
        child: const Icon(Icons.add),
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.accentPrimary))
          : notes.isEmpty
              ? _buildEmptyState()
              : ListView.builder(
                  padding: const EdgeInsets.all(20),
                  itemCount: notes.length,
                  itemBuilder: (context, index) => _buildNoteCard(notes[index]),
                ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.surface1,
              borderRadius: BorderRadius.circular(24),
            ),
            child: const Icon(Icons.note_alt, size: 48, color: AppColors.textLow),
          ),
          const SizedBox(height: 20),
          const Text('No notes yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textHigh)),
          const SizedBox(height: 8),
          const Text('Tap + to create your first note', style: TextStyle(color: AppColors.textMed)),
        ],
      ),
    );
  }

  Widget _buildNoteCard(Map<String, dynamic> note) {
    final updatedAt = DateTime.parse(note['updated_at'] ?? note['created_at']);
    final dateStr = '${updatedAt.day}/${updatedAt.month}/${updatedAt.year}';
    final bookTitle = note['books']?['title'];

    return GestureDetector(
      onTap: () => _showNoteEditor(note: note),
      child: Container(
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
                Expanded(
                  child: Text(
                    note['title'] ?? 'Untitled',
                    style: const TextStyle(color: AppColors.textHigh, fontWeight: FontWeight.w700, fontSize: 16),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Text(dateStr, style: const TextStyle(color: AppColors.textLow, fontSize: 12)),
              ],
            ),
            if (bookTitle != null) ...[
              const SizedBox(height: 4),
              Row(
                children: [
                  const Icon(Icons.menu_book, size: 14, color: AppColors.accentPrimary),
                  const SizedBox(width: 4),
                  Text(bookTitle, style: const TextStyle(color: AppColors.accentPrimary, fontSize: 12)),
                ],
              ),
            ],
            if (note['content'] != null && note['content'].toString().isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                note['content'],
                style: const TextStyle(color: AppColors.textMed, fontSize: 13),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
