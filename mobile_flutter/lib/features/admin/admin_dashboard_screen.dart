import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/colors.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  Map<String, int> stats = {'users': 0, 'books': 0, 'reviews': 0, 'pending': 0};
  List<Map<String, dynamic>> recentActions = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _fetchStats();
  }

  Future<void> _fetchStats() async {
    try {
      // Fetch counts
      final users = await Supabase.instance.client.from('profiles').select('id');
      final books = await Supabase.instance.client.from('books').select('id');
      final reviews = await Supabase.instance.client.from('reviews').select('id');
      final pending = await Supabase.instance.client.from('profiles').select('id').eq('is_verified', false);

      // Fetch recent admin actions
      final actions = await Supabase.instance.client
          .from('admin_audit_logs')
          .select()
          .order('created_at', ascending: false)
          .limit(5);

      setState(() {
        stats = {
          'users': users.length,
          'books': books.length,
          'reviews': reviews.length,
          'pending': pending.length,
        };
        recentActions = List<Map<String, dynamic>>.from(actions);
        loading = false;
      });
    } catch (e) {
      debugPrint('Error: $e');
      setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgCanvas,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('Admin Dashboard', style: TextStyle(fontWeight: FontWeight.w800)),
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.accentPrimary))
          : RefreshIndicator(
              onRefresh: _fetchStats,
              color: AppColors.accentPrimary,
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  // Stats Grid
                  GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2,
                    mainAxisSpacing: 16,
                    crossAxisSpacing: 16,
                    childAspectRatio: 1.3,
                    children: [
                      _buildStatCard('Total Users', stats['users']!, Icons.people, AppColors.accentPrimary),
                      _buildStatCard('Total Books', stats['books']!, Icons.menu_book, AppColors.accentSecondary),
                      _buildStatCard('Reviews', stats['reviews']!, Icons.rate_review, AppColors.accentOrange),
                      _buildStatCard('Pending', stats['pending']!, Icons.pending_actions, AppColors.accentCoral),
                    ],
                  ),
                  const SizedBox(height: 28),

                  // Quick Actions
                  const Text(
                    'QUICK ACTIONS',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textLow,
                      letterSpacing: 2,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: _buildActionButton('Add Book', Icons.add, () => context.push('/admin/add-book'))),
                      const SizedBox(width: 12),
                      Expanded(child: _buildActionButton('Manage Users', Icons.people, () => context.push('/admin/users'))),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: _buildActionButton('All Books', Icons.library_books, () => context.push('/admin/books'))),
                      const SizedBox(width: 12),
                      Expanded(child: _buildActionButton('Verifications', Icons.verified, () => context.push('/admin/verifications'))),
                    ],
                  ),
                  const SizedBox(height: 28),

                  // Recent Activity
                  const Text(
                    'RECENT ACTIONS',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textLow,
                      letterSpacing: 2,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    decoration: BoxDecoration(
                      color: AppColors.surface1,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.surface2),
                    ),
                    child: recentActions.isEmpty
                        ? const Padding(
                            padding: EdgeInsets.all(24),
                            child: Center(
                              child: Text('No recent actions', style: TextStyle(color: AppColors.textMed)),
                            ),
                          )
                        : Column(
                            children: recentActions.map((action) {
                              return ListTile(
                                leading: Container(
                                  width: 40,
                                  height: 40,
                                  decoration: BoxDecoration(
                                    color: AppColors.accentPrimary.withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: const Icon(Icons.history, color: AppColors.accentPrimary, size: 20),
                                ),
                                title: Text(
                                  action['action'] ?? 'Unknown action',
                                  style: const TextStyle(color: AppColors.textHigh, fontWeight: FontWeight.w600, fontSize: 14),
                                ),
                                subtitle: Text(
                                  action['details'] ?? '',
                                  style: const TextStyle(color: AppColors.textMed, fontSize: 12),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              );
                            }).toList(),
                          ),
                  ),
                  const SizedBox(height: 100),
                ],
              ),
            ),
    );
  }

  Widget _buildStatCard(String label, int value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [color.withOpacity(0.2), color.withOpacity(0.05)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '$value',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  color: color,
                ),
              ),
              Text(
                label,
                style: const TextStyle(color: AppColors.textMed, fontSize: 12),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(String label, IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: AppColors.surface1,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.surface2),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: AppColors.accentPrimary, size: 20),
            const SizedBox(width: 8),
            Text(
              label,
              style: const TextStyle(
                color: AppColors.textHigh,
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
