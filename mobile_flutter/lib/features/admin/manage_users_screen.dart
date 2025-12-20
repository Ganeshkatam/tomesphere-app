import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/theme/colors.dart';

class ManageUsersScreen extends StatefulWidget {
  const ManageUsersScreen({super.key});

  @override
  State<ManageUsersScreen> createState() => _ManageUsersScreenState();
}

class _ManageUsersScreenState extends State<ManageUsersScreen> {
  List<Map<String, dynamic>> users = [];
  bool loading = true;
  String filter = 'all';

  @override
  void initState() {
    super.initState();
    _fetchUsers();
  }

  Future<void> _fetchUsers() async {
    try {
      var query = Supabase.instance.client.from('profiles').select();
      
      if (filter == 'admin') {
        query = query.eq('role', 'admin');
      } else if (filter == 'unverified') {
        query = query.eq('is_verified', false);
      }

      final data = await query.order('created_at', ascending: false);
      setState(() {
        users = List<Map<String, dynamic>>.from(data);
        loading = false;
      });
    } catch (e) {
      debugPrint('Error: $e');
      setState(() => loading = false);
    }
  }

  Future<void> _verifyUser(String userId) async {
    try {
      await Supabase.instance.client
          .from('profiles')
          .update({'is_verified': true})
          .eq('id', userId);
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('User verified!'), backgroundColor: AppColors.accentSecondary),
      );
      _fetchUsers();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
      );
    }
  }

  Future<void> _toggleAdmin(String userId, bool isAdmin) async {
    try {
      await Supabase.instance.client
          .from('profiles')
          .update({'role': isAdmin ? 'user' : 'admin'})
          .eq('id', userId);
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(isAdmin ? 'Admin revoked' : 'Made admin!'), backgroundColor: AppColors.accentSecondary),
      );
      _fetchUsers();
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
        title: const Text('Manage Users', style: TextStyle(fontWeight: FontWeight.w800)),
      ),
      body: Column(
        children: [
          // Filter tabs
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                _buildFilterTab('All', 'all'),
                const SizedBox(width: 10),
                _buildFilterTab('Admins', 'admin'),
                const SizedBox(width: 10),
                _buildFilterTab('Unverified', 'unverified'),
              ],
            ),
          ),

          // User list
          Expanded(
            child: loading
                ? const Center(child: CircularProgressIndicator(color: AppColors.accentPrimary))
                : users.isEmpty
                    ? const Center(child: Text('No users found', style: TextStyle(color: AppColors.textMed)))
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: users.length,
                        itemBuilder: (context, index) => _buildUserCard(users[index]),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterTab(String label, String value) {
    final isActive = filter == value;
    return GestureDetector(
      onTap: () {
        setState(() {
          filter = value;
          loading = true;
        });
        _fetchUsers();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isActive ? AppColors.accentPrimary : AppColors.surface1,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Text(label, style: TextStyle(color: isActive ? Colors.white : AppColors.textMed, fontWeight: FontWeight.w600)),
      ),
    );
  }

  Widget _buildUserCard(Map<String, dynamic> user) {
    final isAdmin = user['role'] == 'admin';
    final isVerified = user['is_verified'] == true;

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
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.accentPrimary.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    (user['full_name'] ?? 'U')[0].toUpperCase(),
                    style: const TextStyle(color: AppColors.accentPrimary, fontWeight: FontWeight.w800, fontSize: 20),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            user['full_name'] ?? 'Unknown',
                            style: const TextStyle(color: AppColors.textHigh, fontWeight: FontWeight.w700),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (isAdmin) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.accentPrimary.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text('Admin', style: TextStyle(color: AppColors.accentPrimary, fontSize: 10, fontWeight: FontWeight.w700)),
                          ),
                        ],
                        if (!isVerified) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.accentOrange.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text('Pending', style: TextStyle(color: AppColors.accentOrange, fontSize: 10, fontWeight: FontWeight.w700)),
                          ),
                        ],
                      ],
                    ),
                    Text(user['email'] ?? '', style: const TextStyle(color: AppColors.textMed, fontSize: 12)),
                  ],
                ),
              ),
              PopupMenuButton(
                color: AppColors.surface1,
                icon: const Icon(Icons.more_vert, color: AppColors.textMed),
                itemBuilder: (context) => [
                  if (!isVerified)
                    const PopupMenuItem(value: 'verify', child: Text('Verify User', style: TextStyle(color: AppColors.textHigh))),
                  PopupMenuItem(
                    value: 'admin',
                    child: Text(isAdmin ? 'Remove Admin' : 'Make Admin', style: const TextStyle(color: AppColors.textHigh)),
                  ),
                ],
                onSelected: (value) {
                  if (value == 'verify') _verifyUser(user['id']);
                  if (value == 'admin') _toggleAdmin(user['id'], isAdmin);
                },
              ),
            ],
          ),
        ],
      ),
    );
  }
}
