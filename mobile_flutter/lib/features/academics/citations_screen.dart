import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/theme/colors.dart';

class CitationsScreen extends StatefulWidget {
  const CitationsScreen({super.key});

  @override
  State<CitationsScreen> createState() => _CitationsScreenState();
}

class _CitationsScreenState extends State<CitationsScreen> {
  final _titleController = TextEditingController();
  final _authorController = TextEditingController();
  final _yearController = TextEditingController();
  String _selectedFormat = 'APA';
  String _generatedCitation = '';
  List<Map<String, dynamic>> history = [];

  final formats = ['APA', 'MLA', 'Chicago', 'Harvard', 'IEEE'];

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return;

    try {
      final data = await Supabase.instance.client
          .from('citations')
          .select()
          .eq('user_id', user.id)
          .order('created_at', ascending: false)
          .limit(10);
      setState(() => history = List<Map<String, dynamic>>.from(data));
    } catch (e) {
      debugPrint('Error: $e');
    }
  }

  void _generateCitation() {
    if (_titleController.text.isEmpty || _authorController.text.isEmpty) return;
    HapticFeedback.mediumImpact();

    final title = _titleController.text;
    final author = _authorController.text;
    final year = _yearController.text.isNotEmpty ? _yearController.text : 'n.d.';

    String citation;
    switch (_selectedFormat) {
      case 'APA':
        citation = '$author ($year). $title.';
        break;
      case 'MLA':
        citation = '$author. "$title." $year.';
        break;
      case 'Chicago':
        citation = '$author. $title. $year.';
        break;
      case 'Harvard':
        citation = '$author ($year) $title.';
        break;
      case 'IEEE':
        citation = '[$year] $author, "$title."';
        break;
      default:
        citation = '$author - $title ($year)';
    }

    setState(() => _generatedCitation = citation);
    _saveCitation(citation);
  }

  Future<void> _saveCitation(String citation) async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return;

    try {
      await Supabase.instance.client.from('citations').insert({
        'user_id': user.id,
        'title': _titleController.text,
        'author': _authorController.text,
        'year': _yearController.text,
        'format': _selectedFormat,
        'citation_text': citation,
      });
      _loadHistory();
    } catch (e) {
      debugPrint('Error: $e');
    }
  }

  void _copyToClipboard() {
    Clipboard.setData(ClipboardData(text: _generatedCitation));
    HapticFeedback.lightImpact();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Copied to clipboard!'), backgroundColor: AppColors.accentSecondary),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgCanvas,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('Citations', style: TextStyle(fontWeight: FontWeight.w800)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Generator Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.surface1,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.surface2),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Generate Citation', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.textHigh)),
                  const SizedBox(height: 20),
                  TextField(
                    controller: _titleController,
                    style: const TextStyle(color: AppColors.textHigh),
                    decoration: _inputDecoration('Book/Article Title'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _authorController,
                    style: const TextStyle(color: AppColors.textHigh),
                    decoration: _inputDecoration('Author(s)'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _yearController,
                    style: const TextStyle(color: AppColors.textHigh),
                    keyboardType: TextInputType.number,
                    decoration: _inputDecoration('Year'),
                  ),
                  const SizedBox(height: 16),

                  // Format selector
                  const Text('Format', style: TextStyle(color: AppColors.textMed, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: formats.map((format) {
                      final isSelected = _selectedFormat == format;
                      return GestureDetector(
                        onTap: () => setState(() => _selectedFormat = format),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                          decoration: BoxDecoration(
                            color: isSelected ? AppColors.accentPrimary : AppColors.bgCanvas,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: isSelected ? AppColors.accentPrimary : AppColors.surface2),
                          ),
                          child: Text(format, style: TextStyle(color: isSelected ? Colors.white : AppColors.textMed, fontWeight: FontWeight.w600)),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 20),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _generateCitation,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.accentPrimary,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: const Text('Generate', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Result
            if (_generatedCitation.isNotEmpty) ...[
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: [AppColors.accentPrimary.withOpacity(0.2), AppColors.accentBlue.withOpacity(0.1)]),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.accentPrimary.withOpacity(0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(_selectedFormat, style: const TextStyle(color: AppColors.accentPrimary, fontWeight: FontWeight.w700)),
                        IconButton(
                          onPressed: _copyToClipboard,
                          icon: const Icon(Icons.copy, color: AppColors.accentPrimary),
                        ),
                      ],
                    ),
                    Text(_generatedCitation, style: const TextStyle(color: AppColors.textHigh, fontSize: 14, height: 1.5)),
                  ],
                ),
              ),
              const SizedBox(height: 24),
            ],

            // History
            if (history.isNotEmpty) ...[
              const Text('RECENT CITATIONS', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textLow, letterSpacing: 2)),
              const SizedBox(height: 12),
              ...history.map((item) => Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surface1,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(item['title'] ?? '', style: const TextStyle(color: AppColors.textHigh, fontWeight: FontWeight.w600), maxLines: 1, overflow: TextOverflow.ellipsis),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(color: AppColors.accentPrimary.withOpacity(0.2), borderRadius: BorderRadius.circular(6)),
                          child: Text(item['format'] ?? '', style: const TextStyle(color: AppColors.accentPrimary, fontSize: 10, fontWeight: FontWeight.w700)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(item['citation_text'] ?? '', style: const TextStyle(color: AppColors.textMed, fontSize: 12), maxLines: 2, overflow: TextOverflow.ellipsis),
                  ],
                ),
              )),
            ],
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
}
