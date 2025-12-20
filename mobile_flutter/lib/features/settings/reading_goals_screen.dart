import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/theme/colors.dart';

class ReadingGoalsScreen extends StatefulWidget {
  const ReadingGoalsScreen({super.key});

  @override
  State<ReadingGoalsScreen> createState() => _ReadingGoalsScreenState();
}

class _ReadingGoalsScreenState extends State<ReadingGoalsScreen> {
  int weeklyGoal = 2;
  int monthlyGoal = 8;
  int yearlyGoal = 50;
  bool loading = true;
  bool saving = false;

  @override
  void initState() {
    super.initState();
    _loadGoals();
  }

  Future<void> _loadGoals() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) {
      setState(() => loading = false);
      return;
    }

    try {
      final data = await Supabase.instance.client
          .from('reading_goals')
          .select()
          .eq('user_id', user.id)
          .maybeSingle();

      if (data != null) {
        setState(() {
          weeklyGoal = data['weekly_goal'] ?? 2;
          monthlyGoal = data['monthly_goal'] ?? 8;
          yearlyGoal = data['yearly_goal'] ?? 50;
        });
      }
    } catch (e) {
      debugPrint('Error: $e');
    }
    setState(() => loading = false);
  }

  Future<void> _saveGoals() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return;

    setState(() => saving = true);
    HapticFeedback.mediumImpact();

    try {
      await Supabase.instance.client.from('reading_goals').upsert({
        'user_id': user.id,
        'weekly_goal': weeklyGoal,
        'monthly_goal': monthlyGoal,
        'yearly_goal': yearlyGoal,
        'updated_at': DateTime.now().toIso8601String(),
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Goals saved!'), backgroundColor: AppColors.accentSecondary),
      );
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
        title: const Text('Reading Goals', style: TextStyle(fontWeight: FontWeight.w800)),
        actions: [
          TextButton(
            onPressed: saving ? null : _saveGoals,
            child: saving
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.accentPrimary))
                : const Text('Save', style: TextStyle(color: AppColors.accentPrimary, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.accentPrimary))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: [AppColors.accentPrimary, AppColors.accentBlue]),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.flag, color: Colors.white, size: 32),
                        SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Set Your Goals', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 18)),
                              Text('Stay motivated and track your progress', style: TextStyle(color: Colors.white70)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Weekly Goal
                  _buildGoalCard(
                    'Weekly Goal',
                    'Books per week',
                    weeklyGoal,
                    1,
                    10,
                    Icons.calendar_view_week,
                    AppColors.accentSecondary,
                    (val) => setState(() => weeklyGoal = val),
                  ),
                  const SizedBox(height: 20),

                  // Monthly Goal
                  _buildGoalCard(
                    'Monthly Goal',
                    'Books per month',
                    monthlyGoal,
                    1,
                    30,
                    Icons.calendar_month,
                    AppColors.accentOrange,
                    (val) => setState(() => monthlyGoal = val),
                  ),
                  const SizedBox(height: 20),

                  // Yearly Goal
                  _buildGoalCard(
                    'Yearly Goal',
                    'Books per year',
                    yearlyGoal,
                    1,
                    100,
                    Icons.calendar_today,
                    AppColors.accentCoral,
                    (val) => setState(() => yearlyGoal = val),
                  ),
                  const SizedBox(height: 32),

                  // Tips
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surface1,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.lightbulb, color: AppColors.accentOrange),
                        SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Tip: Start small and increase your goals as you build a reading habit!',
                            style: TextStyle(color: AppColors.textMed, fontSize: 13),
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

  Widget _buildGoalCard(String title, String subtitle, int value, int min, int max, IconData icon, Color color, Function(int) onChanged) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface1,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color),
              ),
              const SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(color: AppColors.textHigh, fontWeight: FontWeight.w700, fontSize: 16)),
                  Text(subtitle, style: const TextStyle(color: AppColors.textMed, fontSize: 12)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              IconButton(
                onPressed: value > min ? () { HapticFeedback.selectionClick(); onChanged(value - 1); } : null,
                icon: Icon(Icons.remove_circle, color: value > min ? color : AppColors.textLow),
              ),
              Expanded(
                child: Column(
                  children: [
                    Text('$value', style: TextStyle(fontSize: 36, fontWeight: FontWeight.w900, color: color)),
                    Text('books', style: const TextStyle(color: AppColors.textMed)),
                  ],
                ),
              ),
              IconButton(
                onPressed: value < max ? () { HapticFeedback.selectionClick(); onChanged(value + 1); } : null,
                icon: Icon(Icons.add_circle, color: value < max ? color : AppColors.textLow),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SliderTheme(
            data: SliderThemeData(
              activeTrackColor: color,
              inactiveTrackColor: color.withOpacity(0.2),
              thumbColor: color,
            ),
            child: Slider(
              value: value.toDouble(),
              min: min.toDouble(),
              max: max.toDouble(),
              onChanged: (val) => onChanged(val.round()),
            ),
          ),
        ],
      ),
    );
  }
}
