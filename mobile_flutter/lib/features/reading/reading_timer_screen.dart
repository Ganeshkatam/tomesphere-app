import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/theme/colors.dart';

class ReadingTimerScreen extends StatefulWidget {
  const ReadingTimerScreen({super.key});

  @override
  State<ReadingTimerScreen> createState() => _ReadingTimerScreenState();
}

class _ReadingTimerScreenState extends State<ReadingTimerScreen> {
  Timer? _timer;
  int _seconds = 0;
  bool _isRunning = false;
  int _todayMinutes = 0;
  int _weekMinutes = 0;
  List<Map<String, dynamic>> _recentSessions = [];

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _loadStats() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return;

    try {
      final today = DateTime.now();
      final weekAgo = today.subtract(const Duration(days: 7));

      final sessions = await Supabase.instance.client
          .from('reading_sessions')
          .select()
          .eq('user_id', user.id)
          .gte('created_at', weekAgo.toIso8601String())
          .order('created_at', ascending: false);

      int todayMins = 0;
      int weekMins = 0;

      for (final s in sessions) {
        final int duration = (s['duration_seconds'] ?? 0) as int;
        weekMins = weekMins + (duration ~/ 60);
        
        final createdAt = DateTime.parse(s['created_at']);
        if (createdAt.day == today.day && createdAt.month == today.month) {
          todayMins = todayMins + (duration ~/ 60);
        }
      }

      setState(() {
        _todayMinutes = todayMins;
        _weekMinutes = weekMins;
        _recentSessions = List<Map<String, dynamic>>.from(sessions.take(5));
      });
    } catch (e) {
      debugPrint('Error: $e');
    }
  }

  void _startTimer() {
    HapticFeedback.mediumImpact();
    setState(() => _isRunning = true);
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() => _seconds++);
    });
  }

  void _pauseTimer() {
    HapticFeedback.selectionClick();
    _timer?.cancel();
    setState(() => _isRunning = false);
  }

  Future<void> _saveSession() async {
    if (_seconds < 60) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Read for at least 1 minute to save')),
      );
      return;
    }

    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return;

    HapticFeedback.heavyImpact();

    try {
      await Supabase.instance.client.from('reading_sessions').insert({
        'user_id': user.id,
        'duration_seconds': _seconds,
      });

      setState(() {
        _seconds = 0;
        _isRunning = false;
      });
      _timer?.cancel();
      _loadStats();

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Session saved!'), backgroundColor: AppColors.accentSecondary),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
      );
    }
  }

  void _resetTimer() {
    HapticFeedback.selectionClick();
    _timer?.cancel();
    setState(() {
      _seconds = 0;
      _isRunning = false;
    });
  }

  String _formatTime(int totalSeconds) {
    final hours = totalSeconds ~/ 3600;
    final minutes = (totalSeconds % 3600) ~/ 60;
    final seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return '${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
    }
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgCanvas,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('Reading Timer', style: TextStyle(fontWeight: FontWeight.w800)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Timer Display
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 48),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: _isRunning 
                      ? [AppColors.accentSecondary.withOpacity(0.3), AppColors.accentSecondary.withOpacity(0.1)]
                      : [AppColors.surface1, AppColors.surface1.withOpacity(0.8)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(28),
                border: Border.all(color: _isRunning ? AppColors.accentSecondary : AppColors.surface2),
              ),
              child: Column(
                children: [
                  Icon(
                    _isRunning ? Icons.menu_book : Icons.hourglass_empty,
                    size: 48,
                    color: _isRunning ? AppColors.accentSecondary : AppColors.textMed,
                  ),
                  const SizedBox(height: 20),
                  Text(
                    _formatTime(_seconds),
                    style: TextStyle(
                      fontSize: 64,
                      fontWeight: FontWeight.w900,
                      color: _isRunning ? AppColors.accentSecondary : AppColors.textHigh,
                      fontFeatures: const [FontFeature.tabularFigures()],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _isRunning ? 'Reading...' : 'Ready to read',
                    style: TextStyle(color: _isRunning ? AppColors.accentSecondary : AppColors.textMed),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Controls
            Row(
              children: [
                if (!_isRunning && _seconds == 0)
                  Expanded(
                    child: _buildButton('Start Reading', Icons.play_arrow, AppColors.accentSecondary, _startTimer),
                  ),
                if (_isRunning) ...[
                  Expanded(child: _buildButton('Pause', Icons.pause, AppColors.accentOrange, _pauseTimer)),
                  const SizedBox(width: 12),
                  Expanded(child: _buildButton('Finish', Icons.check, AppColors.accentSecondary, _saveSession)),
                ],
                if (!_isRunning && _seconds > 0) ...[
                  Expanded(child: _buildButton('Resume', Icons.play_arrow, AppColors.accentSecondary, _startTimer)),
                  const SizedBox(width: 12),
                  Expanded(child: _buildButton('Save', Icons.save, AppColors.accentPrimary, _saveSession)),
                  const SizedBox(width: 12),
                  _buildIconButton(Icons.refresh, _resetTimer),
                ],
              ],
            ),
            const SizedBox(height: 32),

            // Stats
            Row(
              children: [
                Expanded(child: _buildStatCard('Today', '$_todayMinutes min', Icons.today, AppColors.accentPrimary)),
                const SizedBox(width: 12),
                Expanded(child: _buildStatCard('This Week', '$_weekMinutes min', Icons.date_range, AppColors.accentOrange)),
              ],
            ),
            const SizedBox(height: 24),

            // Recent Sessions
            if (_recentSessions.isNotEmpty) ...[
              const Align(
                alignment: Alignment.centerLeft,
                child: Text('RECENT SESSIONS', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textLow, letterSpacing: 2)),
              ),
              const SizedBox(height: 12),
              ...(_recentSessions.map((s) => _buildSessionItem(s))),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildButton(String label, IconData icon, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: Colors.white),
            const SizedBox(width: 8),
            Text(label, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }

  Widget _buildIconButton(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface1,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.surface2),
        ),
        child: Icon(icon, color: AppColors.textMed),
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface1,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 12),
          Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: color)),
          Text(label, style: const TextStyle(color: AppColors.textMed, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildSessionItem(Map<String, dynamic> session) {
    final duration = session['duration_seconds'] ?? 0;
    final minutes = (duration / 60).round();
    final createdAt = DateTime.parse(session['created_at']);
    final dateStr = '${createdAt.day}/${createdAt.month}/${createdAt.year}';

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface1,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.accentSecondary.withOpacity(0.2),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.timer, color: AppColors.accentSecondary, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('$minutes minutes', style: const TextStyle(color: AppColors.textHigh, fontWeight: FontWeight.w600)),
                Text(dateStr, style: const TextStyle(color: AppColors.textMed, fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
