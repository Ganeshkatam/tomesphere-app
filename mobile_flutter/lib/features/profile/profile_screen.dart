import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/colors.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> with SingleTickerProviderStateMixin {
  Map<String, dynamic>? profile;
  User? user;
  Map<String, int> stats = {'total': 0, 'reading': 0, 'finished': 0};
  late AnimationController _animController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    )..repeat(reverse: true);
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.05).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeInOut),
    );
    _checkAuth();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  Future<void> _checkAuth() async {
    final currentUser = Supabase.instance.client.auth.currentUser;
    if (currentUser != null) {
      setState(() => user = currentUser);
      await _fetchProfile(currentUser.id);
      await _fetchStats(currentUser.id);
    }
  }

  Future<void> _fetchProfile(String uid) async {
    try {
      final data = await Supabase.instance.client
          .from('profiles')
          .select()
          .eq('id', uid)
          .single();
      setState(() => profile = data);
    } catch (e) {
      debugPrint('Error fetching profile: $e');
    }
  }

  Future<void> _fetchStats(String uid) async {
    try {
      final data = await Supabase.instance.client
          .from('reading_lists')
          .select('status')
          .eq('user_id', uid);
      
      setState(() {
        stats = {
          'total': data.length,
          'reading': data.where((d) => d['status'] == 'currently_reading').length,
          'finished': data.where((d) => d['status'] == 'finished').length,
        };
      });
    } catch (e) {
      debugPrint('Error fetching stats: $e');
    }
  }

  Future<void> _signOut() async {
    HapticFeedback.heavyImpact();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface1,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Sign Out', style: TextStyle(color: AppColors.textHigh)),
        content: const Text('Are you sure?', style: TextStyle(color: AppColors.textMed)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Sign Out', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
    
    if (confirmed == true) {
      await Supabase.instance.client.auth.signOut();
      if (mounted) context.go('/login');
    }
  }

  int get level => (stats['finished']! / 2).floor().clamp(1, 99);

  @override
  Widget build(BuildContext context) {
    if (user == null) {
      return _buildAuthScreen();
    }
    return _buildProfileScreen();
  }

  Widget _buildAuthScreen() {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.bgCanvas,
            const Color(0xFF1a103d),
            AppColors.bgCanvas,
          ],
        ),
      ),
      child: SafeArea(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Logo
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: AppColors.primaryGradient),
                  borderRadius: BorderRadius.circular(40),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.accentPrimary.withOpacity(0.4),
                      blurRadius: 30,
                      spreadRadius: 5,
                    ),
                  ],
                ),
                child: const Icon(Icons.book, size: 56, color: Colors.white),
              ),
              const SizedBox(height: 32),
              const Text(
                'TomeSphere',
                style: TextStyle(
                  fontSize: 36,
                  fontWeight: FontWeight.w900,
                  color: AppColors.textHigh,
                  letterSpacing: 1,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Your Reading Adventure Awaits',
                style: TextStyle(fontSize: 16, color: AppColors.textMed),
              ),
              const SizedBox(height: 48),
              // CTA Button
              GestureDetector(
                onTap: () => context.go('/login'),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 18),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: AppColors.coralGradient),
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.accentCoral.withOpacity(0.4),
                        blurRadius: 20,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Get Started',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
                      SizedBox(width: 12),
                      Icon(Icons.arrow_forward, color: Colors.white),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProfileScreen() {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            AppColors.bgCanvas,
            const Color(0xFF1a103d),
            AppColors.bgCanvas,
          ],
        ),
      ),
      child: SafeArea(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: Padding(
            padding: const EdgeInsets.only(bottom: 120),
            child: Column(
              children: [
                const SizedBox(height: 40),
                
                // ===== AVATAR SECTION =====
                _buildAvatarSection(),
                const SizedBox(height: 32),
                
                // ===== STATS CARDS =====
                _buildStatsRow(),
                const SizedBox(height: 32),
                
                // ===== ACTION BUTTONS =====
                _buildActionButtons(),
                const SizedBox(height: 24),
                
                // ===== ADMIN CARD =====
                if (profile?['role'] == 'admin') _buildAdminCard(),
                
                // ===== MENU LIST =====
                _buildMenuList(),
                const SizedBox(height: 16),
                
                // ===== SIGN OUT =====
                _buildSignOutButton(),
                const SizedBox(height: 24),
                
                // ===== FOOTER =====
                _buildFooter(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildAvatarSection() {
    return Column(
      children: [
        // Avatar with animated ring
        AnimatedBuilder(
          animation: _pulseAnimation,
          builder: (context, child) {
            return Transform.scale(
              scale: _pulseAnimation.value,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // Glow
                  Container(
                    width: 180,
                    height: 180,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: RadialGradient(
                        colors: [
                          AppColors.accentPrimary.withOpacity(0.3),
                          Colors.transparent,
                        ],
                      ),
                    ),
                  ),
                  // Ring
                  Container(
                    width: 150,
                    height: 150,
                    padding: const EdgeInsets.all(5),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          AppColors.accentCoral,
                          AppColors.accentPrimary,
                          AppColors.accentCyan,
                        ],
                      ),
                    ),
                    child: Container(
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.bgCanvas,
                      ),
                      padding: const EdgeInsets.all(4),
                      child: ClipOval(
                        child: Image.network(
                          profile?['avatar_url'] ?? 
                            'https://api.dicebear.com/7.x/initials/png?seed=${profile?['name'] ?? 'U'}',
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            color: AppColors.accentPrimary,
                            child: const Icon(Icons.person, size: 60, color: Colors.white),
                          ),
                        ),
                      ),
                    ),
                  ),
                  // Level badge
                  Positioned(
                    bottom: 0,
                    right: 10,
                    child: Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(colors: AppColors.amberGradient),
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.bgCanvas, width: 4),
                      ),
                      child: Center(
                        child: Text(
                          '$level',
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            color: Colors.black,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
        const SizedBox(height: 20),
        // Name
        Text(
          profile?['name'] ?? 'Reader',
          style: const TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.w900,
            color: AppColors.textHigh,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          user?.email ?? '',
          style: const TextStyle(fontSize: 14, color: AppColors.textMed),
        ),
        const SizedBox(height: 12),
        // Admin badge
        if (profile?['role'] == 'admin')
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.accentOrange.withOpacity(0.15),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.verified, size: 16, color: AppColors.accentOrange),
                SizedBox(width: 6),
                Text(
                  'Admin',
                  style: TextStyle(
                    color: AppColors.accentOrange,
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildStatsRow() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          _buildStatCard('BOOKS', stats['total']!, AppColors.blueGradient, Icons.library_books),
          const SizedBox(width: 12),
          _buildStatCard('READING', stats['reading']!, AppColors.amberGradient, Icons.local_fire_department, isMain: true),
          const SizedBox(width: 12),
          _buildStatCard('DONE', stats['finished']!, AppColors.emeraldGradient, Icons.check_circle),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, int value, List<Color> gradient, IconData icon, {bool isMain = false}) {
    return Expanded(
      child: Container(
        margin: EdgeInsets.only(top: isMain ? 0 : 12),
        decoration: BoxDecoration(
          gradient: LinearGradient(colors: gradient),
          borderRadius: BorderRadius.circular(24),
        ),
        padding: const EdgeInsets.symmetric(vertical: 24),
        child: Column(
          children: [
            Icon(icon, size: isMain ? 40 : 32, color: Colors.white),
            const SizedBox(height: 8),
            Text(
              '$value',
              style: TextStyle(
                fontSize: isMain ? 48 : 36,
                fontWeight: FontWeight.w900,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                color: Colors.white.withOpacity(0.9),
                letterSpacing: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButtons() {
    final actions = [
      {'icon': Icons.edit, 'label': 'Edit', 'color': AppColors.accentPrimary},
      {'icon': Icons.emoji_events, 'label': 'Goals', 'color': AppColors.accentOrange},
      {'icon': Icons.bar_chart, 'label': 'Stats', 'color': AppColors.accentPink},
      {'icon': Icons.library_books, 'label': 'Library', 'color': AppColors.accentCyan},
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: actions.map((action) {
          return GestureDetector(
            onTap: () => HapticFeedback.selectionClick(),
            child: Column(
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: action['color'] as Color,
                    borderRadius: BorderRadius.circular(22),
                  ),
                  child: Icon(action['icon'] as IconData, size: 28, color: Colors.white),
                ),
                const SizedBox(height: 10),
                Text(
                  action['label'] as String,
                  style: const TextStyle(
                    color: AppColors.textHigh,
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildAdminCard() {
    return GestureDetector(
      onTap: () => HapticFeedback.heavyImpact(),
      child: Container(
        margin: const EdgeInsets.fromLTRB(20, 0, 20, 24),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF7c3aed), Color(0xFF5b21b6)],
          ),
          borderRadius: BorderRadius.circular(24),
        ),
        child: Row(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.15),
                borderRadius: BorderRadius.circular(18),
              ),
              child: const Icon(Icons.rocket_launch, size: 28, color: Colors.white),
            ),
            const SizedBox(width: 16),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '🌌 Admin Dashboard',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                    ),
                  ),
                  SizedBox(height: 2),
                  Text(
                    'Manage books & users',
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.white70,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Colors.white70, size: 28),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuList() {
    final items = [
      {'icon': Icons.notifications, 'label': 'Notifications', 'color': AppColors.accentPink},
      {'icon': Icons.shield, 'label': 'Privacy & Security', 'color': AppColors.accentCyan},
      {'icon': Icons.help, 'label': 'Help Center', 'color': AppColors.accentOrange},
      {'icon': Icons.info, 'label': 'About', 'color': AppColors.textMed},
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        children: items.map((item) {
          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: AppColors.surface1,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: AppColors.surface2),
            ),
            child: ListTile(
              onTap: () => HapticFeedback.selectionClick(),
              leading: Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  color: (item['color'] as Color).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(item['icon'] as IconData, color: item['color'] as Color, size: 24),
              ),
              title: Text(
                item['label'] as String,
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textHigh,
                ),
              ),
              trailing: const Icon(Icons.chevron_right, color: AppColors.textLow),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildSignOutButton() {
    return GestureDetector(
      onTap: _signOut,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 20),
        padding: const EdgeInsets.symmetric(vertical: 18),
        decoration: BoxDecoration(
          color: AppColors.error.withOpacity(0.08),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.error.withOpacity(0.2)),
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.logout, color: AppColors.error, size: 22),
            SizedBox(width: 10),
            Text(
              'Sign Out',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w700,
                color: AppColors.error,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFooter() {
    return const Column(
      children: [
        Text(
          '✦ TOMESPHERE ✦',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: AppColors.textLow,
            letterSpacing: 4,
          ),
        ),
        SizedBox(height: 4),
        Text(
          'v2.5.0 • Premium Edition',
          style: TextStyle(fontSize: 11, color: AppColors.surface2),
        ),
      ],
    );
  }
}
