import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/theme/colors.dart';

class StudyGroupsScreen extends StatefulWidget {
  const StudyGroupsScreen({super.key});

  @override
  State<StudyGroupsScreen> createState() => _StudyGroupsScreenState();
}

class _StudyGroupsScreenState extends State<StudyGroupsScreen> {
  List<Map<String, dynamic>> groups = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _fetchGroups();
  }

  Future<void> _fetchGroups() async {
    try {
      final data = await Supabase.instance.client
          .from('study_groups')
          .select('*, study_group_members(count)')
          .order('created_at', ascending: false);
      
      setState(() {
        groups = List<Map<String, dynamic>>.from(data);
        loading = false;
      });
    } catch (e) {
      debugPrint('Error: $e');
      setState(() => loading = false);
    }
  }

  Future<void> _joinGroup(String groupId) async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return;

    HapticFeedback.mediumImpact();
    try {
      await Supabase.instance.client.from('study_group_members').insert({
        'group_id': groupId,
        'user_id': user.id,
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Joined group!'), backgroundColor: AppColors.accentSecondary),
      );
      _fetchGroups();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
      );
    }
  }

  void _showCreateDialog() {
    final nameController = TextEditingController();
    final descController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface1,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          left: 24,
          right: 24,
          top: 24,
          bottom: MediaQuery.of(context).viewInsets.bottom + 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Create Study Group', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.textHigh)),
            const SizedBox(height: 20),
            TextField(
              controller: nameController,
              style: const TextStyle(color: AppColors.textHigh),
              decoration: _inputDecoration('Group Name'),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: descController,
              style: const TextStyle(color: AppColors.textHigh),
              maxLines: 3,
              decoration: _inputDecoration('Description'),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  if (nameController.text.isEmpty) return;
                  final user = Supabase.instance.client.auth.currentUser;
                  if (user == null) return;

                  await Supabase.instance.client.from('study_groups').insert({
                    'name': nameController.text,
                    'description': descController.text,
                    'created_by': user.id,
                  });
                  Navigator.pop(context);
                  _fetchGroups();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.accentPrimary,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: const Text('Create Group', style: TextStyle(fontWeight: FontWeight.w700)),
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
        title: const Text('Study Groups', style: TextStyle(fontWeight: FontWeight.w800)),
        actions: [
          IconButton(
            onPressed: _showCreateDialog,
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
          : groups.isEmpty
              ? _buildEmptyState()
              : ListView.builder(
                  padding: const EdgeInsets.all(20),
                  itemCount: groups.length,
                  itemBuilder: (context, index) => _buildGroupCard(groups[index]),
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
            child: const Icon(Icons.groups, size: 48, color: AppColors.textLow),
          ),
          const SizedBox(height: 20),
          const Text('No study groups yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textHigh)),
          const SizedBox(height: 8),
          const Text('Create one to get started!', style: TextStyle(color: AppColors.textMed)),
        ],
      ),
    );
  }

  Widget _buildGroupCard(Map<String, dynamic> group) {
    final memberCount = group['study_group_members']?[0]?['count'] ?? 0;
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface1,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.surface2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [AppColors.accentPrimary, AppColors.accentBlue]),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(Icons.groups, color: Colors.white),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(group['name'] ?? 'Unnamed', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textHigh)),
                    Text('$memberCount members', style: const TextStyle(color: AppColors.textMed, fontSize: 12)),
                  ],
                ),
              ),
            ],
          ),
          if (group['description'] != null) ...[
            const SizedBox(height: 12),
            Text(group['description'], style: const TextStyle(color: AppColors.textMed, fontSize: 13), maxLines: 2, overflow: TextOverflow.ellipsis),
          ],
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => _joinGroup(group['id']),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppColors.accentPrimary),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Join', style: TextStyle(color: AppColors.accentPrimary)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.accentPrimary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('View'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
