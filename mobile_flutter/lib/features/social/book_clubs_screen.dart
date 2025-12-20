import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/colors.dart';

class BookClubsScreen extends StatefulWidget {
  const BookClubsScreen({super.key});

  @override
  State<BookClubsScreen> createState() => _BookClubsScreenState();
}

class _BookClubsScreenState extends State<BookClubsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Map<String, dynamic>> allClubs = [];
  List<Map<String, dynamic>> myClubs = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadClubs();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadClubs() async {
    final user = Supabase.instance.client.auth.currentUser;

    try {
      final clubs = await Supabase.instance.client
          .from('book_clubs')
          .select('*, profiles!book_clubs_creator_id_fkey(full_name)')
          .eq('is_public', true)
          .order('member_count', ascending: false);

      List<Map<String, dynamic>> userClubs = [];
      if (user != null) {
        final members = await Supabase.instance.client
            .from('club_members')
            .select('club_id')
            .eq('user_id', user.id);

        final memberClubIds = members.map((m) => m['club_id']).toSet();
        userClubs = clubs.where((c) => memberClubIds.contains(c['id'])).toList().cast<Map<String, dynamic>>();
      }

      setState(() {
        allClubs = List<Map<String, dynamic>>.from(clubs);
        myClubs = userClubs;
        loading = false;
      });
    } catch (e) {
      debugPrint('Error: $e');
      setState(() => loading = false);
    }
  }

  Future<void> _joinClub(String clubId) async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return;

    HapticFeedback.mediumImpact();
    try {
      await Supabase.instance.client.from('club_members').insert({
        'club_id': clubId,
        'user_id': user.id,
        'role': 'member',
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Joined club!'), backgroundColor: AppColors.accentSecondary),
      );
      _loadClubs();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
      );
    }
  }

  void _showCreateClub() {
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
          left: 20, right: 20, top: 20,
          bottom: MediaQuery.of(context).viewInsets.bottom + 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Create Book Club', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.textHigh)),
            const SizedBox(height: 20),
            TextField(
              controller: nameController,
              style: const TextStyle(color: AppColors.textHigh),
              decoration: _inputDecoration('Club Name'),
            ),
            const SizedBox(height: 12),
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

                  HapticFeedback.mediumImpact();

                  try {
                    await Supabase.instance.client.from('book_clubs').insert({
                      'name': nameController.text,
                      'description': descController.text,
                      'creator_id': user.id,
                      'is_public': true,
                      'member_count': 1,
                    });
                    Navigator.pop(context);
                    _loadClubs();
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
                child: const Text('Create Club', style: TextStyle(fontWeight: FontWeight.w700)),
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
        title: const Text('Book Clubs', style: TextStyle(fontWeight: FontWeight.w800)),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.accentPrimary,
          labelColor: AppColors.accentPrimary,
          unselectedLabelColor: AppColors.textMed,
          tabs: const [
            Tab(text: 'Discover'),
            Tab(text: 'My Clubs'),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showCreateClub,
        backgroundColor: AppColors.accentPrimary,
        child: const Icon(Icons.add),
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.accentPrimary))
          : TabBarView(
              controller: _tabController,
              children: [
                _buildClubList(allClubs),
                _buildClubList(myClubs),
              ],
            ),
    );
  }

  Widget _buildClubList(List<Map<String, dynamic>> clubs) {
    if (clubs.isEmpty) {
      return const Center(
        child: Text('No clubs found', style: TextStyle(color: AppColors.textMed)),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: clubs.length,
      itemBuilder: (context, index) => _buildClubCard(clubs[index]),
    );
  }

  Widget _buildClubCard(Map<String, dynamic> club) {
    final memberCount = club['member_count'] ?? 0;
    final creatorName = club['profiles']?['full_name'] ?? 'Unknown';

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
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [AppColors.accentPrimary, AppColors.accentBlue]),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Icon(Icons.menu_book, color: Colors.white, size: 28),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(club['name'] ?? 'Unnamed', style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: AppColors.textHigh)),
                    Text('by $creatorName • $memberCount members', style: const TextStyle(color: AppColors.textMed, fontSize: 12)),
                  ],
                ),
              ),
            ],
          ),
          if (club['description'] != null && club['description'].toString().isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(club['description'], style: const TextStyle(color: AppColors.textMed, fontSize: 13), maxLines: 2, overflow: TextOverflow.ellipsis),
          ],
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => _joinClub(club['id']),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.accentPrimary,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Join Club'),
            ),
          ),
        ],
      ),
    );
  }
}
