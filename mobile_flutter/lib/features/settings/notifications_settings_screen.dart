import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/theme/colors.dart';

class NotificationsSettingsScreen extends StatefulWidget {
  const NotificationsSettingsScreen({super.key});

  @override
  State<NotificationsSettingsScreen> createState() => _NotificationsSettingsScreenState();
}

class _NotificationsSettingsScreenState extends State<NotificationsSettingsScreen> {
  bool dailyReminder = true;
  bool goalUpdates = true;
  bool studyGroupAlerts = true;
  bool newBooks = false;
  bool reviews = true;
  TimeOfDay reminderTime = const TimeOfDay(hour: 20, minute: 0);

  @override
  void initState() {
    super.initState();
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      dailyReminder = prefs.getBool('notif_daily_reminder') ?? true;
      goalUpdates = prefs.getBool('notif_goal_updates') ?? true;
      studyGroupAlerts = prefs.getBool('notif_study_groups') ?? true;
      newBooks = prefs.getBool('notif_new_books') ?? false;
      reviews = prefs.getBool('notif_reviews') ?? true;
    });
  }

  Future<void> _savePreference(String key, bool value) async {
    HapticFeedback.selectionClick();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(key, value);
  }

  Future<void> _selectTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: reminderTime,
      builder: (context, child) {
        return Theme(
          data: ThemeData.dark().copyWith(
            colorScheme: const ColorScheme.dark(
              primary: AppColors.accentPrimary,
              surface: AppColors.surface1,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() => reminderTime = picked);
      HapticFeedback.selectionClick();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgCanvas,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('Notifications', style: TextStyle(fontWeight: FontWeight.w800)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [AppColors.accentPrimary.withOpacity(0.2), AppColors.accentBlue.withOpacity(0.1)]),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Row(
              children: [
                Icon(Icons.notifications, color: AppColors.accentPrimary, size: 32),
                SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Stay Updated', style: TextStyle(color: AppColors.textHigh, fontWeight: FontWeight.w700, fontSize: 16)),
                      Text('Choose what notifications you receive', style: TextStyle(color: AppColors.textMed, fontSize: 12)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Reading Reminders
          const Text('READING REMINDERS', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textLow, letterSpacing: 2)),
          const SizedBox(height: 12),
          _buildToggle('Daily Reading Reminder', 'Get reminded to read every day', dailyReminder, (v) {
            setState(() => dailyReminder = v);
            _savePreference('notif_daily_reminder', v);
          }),
          if (dailyReminder) ...[
            const SizedBox(height: 12),
            GestureDetector(
              onTap: _selectTime,
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surface1,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.surface2),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.schedule, color: AppColors.accentPrimary),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Reminder Time', style: TextStyle(color: AppColors.textHigh, fontWeight: FontWeight.w600)),
                          Text(reminderTime.format(context), style: const TextStyle(color: AppColors.textMed, fontSize: 12)),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right, color: AppColors.textLow),
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: 24),

          // Activity Alerts
          const Text('ACTIVITY ALERTS', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textLow, letterSpacing: 2)),
          const SizedBox(height: 12),
          _buildToggle('Goal Progress', 'Updates on your reading goals', goalUpdates, (v) {
            setState(() => goalUpdates = v);
            _savePreference('notif_goal_updates', v);
          }),
          const SizedBox(height: 12),
          _buildToggle('Study Group Activity', 'New posts and updates from groups', studyGroupAlerts, (v) {
            setState(() => studyGroupAlerts = v);
            _savePreference('notif_study_groups', v);
          }),
          const SizedBox(height: 12),
          _buildToggle('New Reviews', 'When someone reviews a book you read', reviews, (v) {
            setState(() => reviews = v);
            _savePreference('notif_reviews', v);
          }),
          const SizedBox(height: 24),

          // Discovery
          const Text('DISCOVERY', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textLow, letterSpacing: 2)),
          const SizedBox(height: 12),
          _buildToggle('New Book Recommendations', 'Get personalized book suggestions', newBooks, (v) {
            setState(() => newBooks = v);
            _savePreference('notif_new_books', v);
          }),
        ],
      ),
    );
  }

  Widget _buildToggle(String title, String subtitle, bool value, Function(bool) onChanged) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface1,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.surface2),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: AppColors.textHigh, fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(subtitle, style: const TextStyle(color: AppColors.textMed, fontSize: 12)),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: AppColors.accentPrimary,
          ),
        ],
      ),
    );
  }
}
