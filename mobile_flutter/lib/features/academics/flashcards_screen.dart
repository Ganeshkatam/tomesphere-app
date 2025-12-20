import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/theme/colors.dart';

class FlashcardsScreen extends StatefulWidget {
  const FlashcardsScreen({super.key});

  @override
  State<FlashcardsScreen> createState() => _FlashcardsScreenState();
}

class _FlashcardsScreenState extends State<FlashcardsScreen> {
  List<Map<String, dynamic>> cards = [];
  int currentIndex = 0;
  bool showAnswer = false;
  bool loading = true;
  int correct = 0;
  int total = 0;

  @override
  void initState() {
    super.initState();
    _loadCards();
  }

  Future<void> _loadCards() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) {
      setState(() => loading = false);
      return;
    }

    try {
      final data = await Supabase.instance.client
          .from('flashcards')
          .select()
          .eq('user_id', user.id)
          .order('created_at', ascending: false);

      setState(() {
        cards = List<Map<String, dynamic>>.from(data);
        cards.shuffle(Random());
        loading = false;
      });
    } catch (e) {
      debugPrint('Error: $e');
      setState(() => loading = false);
    }
  }

  void _nextCard(bool wasCorrect) {
    HapticFeedback.selectionClick();
    setState(() {
      total++;
      if (wasCorrect) correct++;
      showAnswer = false;
      if (currentIndex < cards.length - 1) {
        currentIndex++;
      } else {
        _showResults();
      }
    });
  }

  void _showResults() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface1,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Session Complete!', style: TextStyle(color: AppColors.textHigh)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '$correct / $total',
              style: const TextStyle(fontSize: 48, fontWeight: FontWeight.w900, color: AppColors.accentSecondary),
            ),
            const SizedBox(height: 8),
            Text(
              '${((correct / total) * 100).round()}% correct',
              style: const TextStyle(color: AppColors.textMed),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              setState(() {
                currentIndex = 0;
                correct = 0;
                total = 0;
                cards.shuffle(Random());
              });
            },
            child: const Text('Study Again', style: TextStyle(color: AppColors.accentPrimary)),
          ),
        ],
      ),
    );
  }

  void _showCreateCard() {
    final questionController = TextEditingController();
    final answerController = TextEditingController();

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
            const Text('New Flashcard', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.textHigh)),
            const SizedBox(height: 20),
            TextField(
              controller: questionController,
              style: const TextStyle(color: AppColors.textHigh),
              maxLines: 2,
              decoration: _inputDecoration('Question'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: answerController,
              style: const TextStyle(color: AppColors.textHigh),
              maxLines: 2,
              decoration: _inputDecoration('Answer'),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  if (questionController.text.isEmpty || answerController.text.isEmpty) return;
                  
                  final user = Supabase.instance.client.auth.currentUser;
                  if (user == null) return;

                  HapticFeedback.mediumImpact();

                  try {
                    await Supabase.instance.client.from('flashcards').insert({
                      'user_id': user.id,
                      'question': questionController.text,
                      'answer': answerController.text,
                    });
                    Navigator.pop(context);
                    _loadCards();
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
                child: const Text('Create Card', style: TextStyle(fontWeight: FontWeight.w700)),
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
        title: const Text('Flashcards', style: TextStyle(fontWeight: FontWeight.w800)),
        actions: [
          IconButton(
            onPressed: _showCreateCard,
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.accentPrimary,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.add, color: Colors.white, size: 20),
            ),
          ),
        ],
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.accentPrimary))
          : cards.isEmpty
              ? _buildEmptyState()
              : _buildCardView(),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.style, size: 48, color: AppColors.textLow),
          const SizedBox(height: 16),
          const Text('No flashcards yet', style: TextStyle(color: AppColors.textMed)),
          const SizedBox(height: 8),
          ElevatedButton(
            onPressed: _showCreateCard,
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.accentPrimary),
            child: const Text('Create First Card'),
          ),
        ],
      ),
    );
  }

  Widget _buildCardView() {
    final card = cards[currentIndex];

    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          // Progress
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Card ${currentIndex + 1} of ${cards.length}', style: const TextStyle(color: AppColors.textMed)),
              Text('$correct correct', style: const TextStyle(color: AppColors.accentSecondary, fontWeight: FontWeight.w600)),
            ],
          ),
          LinearProgressIndicator(
            value: (currentIndex + 1) / cards.length,
            backgroundColor: AppColors.surface1,
            valueColor: const AlwaysStoppedAnimation(AppColors.accentPrimary),
          ),
          const SizedBox(height: 32),

          // Card
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => showAnswer = !showAnswer),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                width: double.infinity,
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: showAnswer
                        ? [AppColors.accentSecondary.withOpacity(0.2), AppColors.accentSecondary.withOpacity(0.05)]
                        : [AppColors.accentPrimary.withOpacity(0.2), AppColors.accentPrimary.withOpacity(0.05)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(28),
                  border: Border.all(color: showAnswer ? AppColors.accentSecondary : AppColors.accentPrimary, width: 2),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      showAnswer ? 'ANSWER' : 'QUESTION',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: showAnswer ? AppColors.accentSecondary : AppColors.accentPrimary,
                        letterSpacing: 2,
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      showAnswer ? (card['answer'] ?? '') : (card['question'] ?? ''),
                      style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.textHigh),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    Text(
                      showAnswer ? '' : 'Tap to reveal',
                      style: const TextStyle(color: AppColors.textLow, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Buttons
          if (showAnswer)
            Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => _nextCard(false),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 18),
                      decoration: BoxDecoration(
                        color: AppColors.error.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.error),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.close, color: AppColors.error),
                          SizedBox(width: 8),
                          Text('Wrong', style: TextStyle(color: AppColors.error, fontWeight: FontWeight.w700, fontSize: 16)),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: GestureDetector(
                    onTap: () => _nextCard(true),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 18),
                      decoration: BoxDecoration(
                        color: AppColors.accentSecondary,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.check, color: Colors.white),
                          SizedBox(width: 8),
                          Text('Correct', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16)),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }
}
