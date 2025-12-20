import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/colors.dart';

class MainScaffold extends StatefulWidget {
  final Widget child;
  
  const MainScaffold({super.key, required this.child});

  @override
  State<MainScaffold> createState() => _MainScaffoldState();
}

class _MainScaffoldState extends State<MainScaffold> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: widget.child,
      extendBody: true,
      bottomNavigationBar: Container(
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 20),
        decoration: BoxDecoration(
          color: AppColors.surface1.withOpacity(0.98),
          borderRadius: BorderRadius.circular(28),
          border: Border.all(color: AppColors.surface2, width: 1),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.3),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(Icons.home_outlined, Icons.home_rounded, 'Home', 0, '/'),
              _buildNavItem(Icons.explore_outlined, Icons.explore_rounded, 'Explore', 1, '/explore'),
              _buildNavItem(Icons.library_books_outlined, Icons.library_books_rounded, 'Library', 2, '/library'),
              _buildNavItem(Icons.school_outlined, Icons.school_rounded, 'Academics', 3, '/academics'),
              _buildNavItem(Icons.person_outline, Icons.person_rounded, 'Profile', 4, '/profile'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(IconData icon, IconData activeIcon, String label, int index, String route) {
    final isActive = _currentIndex == index;
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() => _currentIndex = index);
        context.go(route);
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isActive ? activeIcon : icon,
            size: 26,
            color: isActive ? AppColors.accentPrimary : AppColors.textLow,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
              color: isActive ? AppColors.accentPrimary : AppColors.textLow,
            ),
          ),
        ],
      ),
    );
  }
}
