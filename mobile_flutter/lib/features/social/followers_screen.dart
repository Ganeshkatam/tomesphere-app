import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/theme/colors.dart';

class FollowersScreen extends StatefulWidget {
  final String? userId;
  const FollowersScreen({super.key, this.userId});

  @override
  State<FollowersScreen> createState() => _FollowersScreenState();
}

class _FollowersScreenState extends State<FollowersScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Map<String, dynamic>> followers = [];
  List<Map<String, dynamic>> following = [];
  bool loading = true;
  String? currentUserId;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    currentUserId = widget.userId ?? Supabase.instance.client.auth.currentUser?.id;
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    if (currentUserId == null) return;

    try {
      // Get followers (people who follow this user)
      final followersData = await Supabase.instance.client
          .from('user_follows')
          .select('follower_id, profiles!user_follows_follower_id_fkey(id, full_name, avatar_url)')
          .eq('following_id', currentUserId!);

      // Get following (people this user follows)
      final followingData = await Supabase.instance.client
          .from('user_follows')
          .select('following_id, profiles!user_follows_following_id_fkey(id, full_name, avatar_url)')
          .eq('follower_id', currentUserId!);

      setState(() {
        followers = List<Map<String, dynamic>>.from(followersData);
        following = List<Map<String, dynamic>>.from(followingData);
        loading = false;
      });
    } catch (e) {
      debugPrint('Error: $e');
      setState(() => loading = false);
    }
  }

  Future<void> _followUser(String userId) async {
    final myId = Supabase.instance.client.auth.currentUser?.id;
    if (myId == null) return;

    HapticFeedback.mediumImpact();
    try {
      await Supabase.instance.client.from('user_follows').insert({
        'follower_id': myId,
        'following_id': userId,
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Followed!'), backgroundColor: AppColors.accentSecondary),
      );
      _loadData();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
      );
    }
  }

  Future<void> _unfollowUser(String oderId) async {
    final myId = Supabase.instance.client.auth.currentUser?.id;
    if (myId == null) return;

    HapticFeedback.selectionClick();
    try {
      await Supabase.instance.client.from('user_follows')
          .delete()
          .eq('follower_id', myId)
          .eq('following_id', userId);
      _loadData();
    } catch (e) {
      debugPrint('Error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgCanvas,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('Connections', style: TextStyle(fontWeight: FontWeight.w800)),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.accentPrimary,
          labelColor: AppColors.accentPrimary,
          unselectedLabelColor: AppColors.textMed,
          tabs: [
            Tab(text: 'Followers (${followers.length})'),
            Tab(text: 'Following (${following.length})'),
          ],
        ),
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.accentPrimary))
          : TabBarView(
              controller: _tabController,
              children: [
                _buildUserList(followers, 'follower'),
                _buildUserList(following, 'following'),
              ],
            ),
    );
  }

  Widget _buildUserList(List<Map<String, dynamic>> users, String type) {
    if (users.isEmpty) {
      return Center(
        child: Text(
          type == 'follower' ? 'No followers yet' : 'Not following anyone',
          style: const TextStyle(color: AppColors.textMed),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: users.length,
      itemBuilder: (context, index) {
        final user = users[index];
        final profile = type == 'follower' 
            ? user['profiles'] 
            : user['profiles'];
        return _buildUserCard(profile);
      },
    );
  }

  Widget _buildUserCard(Map<String, dynamic>? profile) {
    if (profile == null) return const SizedBox();
    
    final name = profile['full_name'] ?? 'Unknown';
    final avatarUrl = profile['avatar_url'];
    final userId = profile['id'];

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface1,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.surface2),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: AppColors.accentPrimary.withOpacity(0.2),
            backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl) : null,
            child: avatarUrl == null
                ? Text(name[0].toUpperCase(), style: const TextStyle(color: AppColors.accentPrimary, fontWeight: FontWeight.w700))
                : null,
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Text(name, style: const TextStyle(color: AppColors.textHigh, fontWeight: FontWeight.w600, fontSize: 15)),
          ),
          OutlinedButton(
            onPressed: () => _followUser(userId),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.accentPrimary,
              side: const BorderSide(color: AppColors.accentPrimary),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Follow'),
          ),
        ],
      ),
    );
  }
}
