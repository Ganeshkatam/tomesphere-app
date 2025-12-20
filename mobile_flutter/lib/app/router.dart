import 'package:go_router/go_router.dart';
import 'package:flutter/material.dart';
import '../features/auth/login_screen.dart';
import '../features/auth/signup_screen.dart';
import '../features/home/home_screen.dart';
import '../features/explore/explore_screen.dart';
import '../features/library/library_screen.dart';
import '../features/academics/academics_screen.dart';
import '../features/academics/study_groups_screen.dart';
import '../features/academics/citations_screen.dart';
import '../features/academics/textbook_exchange_screen.dart';
import '../features/academics/flashcards_screen.dart';
import '../features/profile/profile_screen.dart';
import '../features/book/book_detail_screen.dart';
import '../features/book/book_reviews_screen.dart';
import '../features/settings/settings_screen.dart';
import '../features/settings/edit_profile_screen.dart';
import '../features/settings/about_screen.dart';
import '../features/settings/reading_stats_screen.dart';
import '../features/settings/reading_goals_screen.dart';
import '../features/settings/notifications_settings_screen.dart';
import '../features/settings/privacy_settings_screen.dart';
import '../features/settings/help_center_screen.dart';
import '../features/admin/admin_dashboard_screen.dart';
import '../features/admin/add_book_screen.dart';
import '../features/admin/manage_users_screen.dart';
import '../features/reading/reading_timer_screen.dart';
import '../features/notes/smart_notes_screen.dart';
import '../features/social/activity_feed_screen.dart';
import '../shared/widgets/main_scaffold.dart';

final appRouter = GoRouter(
  initialLocation: '/',
  routes: [
    // Auth routes
    GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
    GoRoute(path: '/signup', builder: (context, state) => const SignupScreen()),
    
    // Book routes
    GoRoute(
      path: '/book/:id',
      builder: (context, state) => BookDetailScreen(bookId: state.pathParameters['id'] ?? ''),
    ),
    GoRoute(
      path: '/book/:id/reviews',
      builder: (context, state) => BookReviewsScreen(
        bookId: state.pathParameters['id'] ?? '',
        bookTitle: state.uri.queryParameters['title'] ?? 'Book',
      ),
    ),
    
    // Settings routes (all implemented)
    GoRoute(path: '/settings', builder: (context, state) => const SettingsScreen()),
    GoRoute(path: '/settings/edit-profile', builder: (context, state) => const EditProfileScreen()),
    GoRoute(path: '/settings/about', builder: (context, state) => const AboutScreen()),
    GoRoute(path: '/settings/stats', builder: (context, state) => const ReadingStatsScreen()),
    GoRoute(path: '/settings/goals', builder: (context, state) => const ReadingGoalsScreen()),
    GoRoute(path: '/settings/notifications', builder: (context, state) => const NotificationsSettingsScreen()),
    GoRoute(path: '/settings/privacy', builder: (context, state) => const PrivacySettingsScreen()),
    GoRoute(path: '/settings/help', builder: (context, state) => const HelpCenterScreen()),

    // Academic routes
    GoRoute(path: '/academics/study-groups', builder: (context, state) => const StudyGroupsScreen()),
    GoRoute(path: '/academics/citations', builder: (context, state) => const CitationsScreen()),
    GoRoute(path: '/academics/textbooks', builder: (context, state) => const TextbookExchangeScreen()),
    GoRoute(path: '/academics/flashcards', builder: (context, state) => const FlashcardsScreen()),
    GoRoute(
      path: '/academics/exam-prep',
      builder: (context, state) => Scaffold(
        backgroundColor: const Color(0xFF0f172a),
        appBar: AppBar(backgroundColor: Colors.transparent, title: const Text('Exam Prep')),
        body: const Center(child: Text('Exam prep tools coming soon', style: TextStyle(color: Colors.white54))),
      ),
    ),
    
    // Feature routes
    GoRoute(path: '/reading-timer', builder: (context, state) => const ReadingTimerScreen()),
    GoRoute(path: '/notes', builder: (context, state) => const SmartNotesScreen()),
    GoRoute(path: '/activity', builder: (context, state) => const ActivityFeedScreen()),
    
    // Admin routes
    GoRoute(path: '/admin', builder: (context, state) => const AdminDashboardScreen()),
    GoRoute(path: '/admin/add-book', builder: (context, state) => const AddBookScreen()),
    GoRoute(path: '/admin/users', builder: (context, state) => const ManageUsersScreen()),
    GoRoute(
      path: '/admin/books',
      builder: (context, state) => Scaffold(
        backgroundColor: const Color(0xFF0f172a),
        appBar: AppBar(backgroundColor: Colors.transparent, title: const Text('Manage Books')),
        body: const Center(child: Text('Book management coming soon', style: TextStyle(color: Colors.white54))),
      ),
    ),
    GoRoute(
      path: '/admin/verifications',
      builder: (context, state) => Scaffold(
        backgroundColor: const Color(0xFF0f172a),
        appBar: AppBar(backgroundColor: Colors.transparent, title: const Text('Verifications')),
        body: const Center(child: Text('User verifications coming soon', style: TextStyle(color: Colors.white54))),
      ),
    ),
    
    // Main app with bottom navigation
    ShellRoute(
      builder: (context, state, child) => MainScaffold(child: child),
      routes: [
        GoRoute(path: '/', builder: (context, state) => const HomeScreen()),
        GoRoute(path: '/explore', builder: (context, state) => const ExploreScreen()),
        GoRoute(path: '/library', builder: (context, state) => const LibraryScreen()),
        GoRoute(path: '/academics', builder: (context, state) => const AcademicsScreen()),
        GoRoute(path: '/profile', builder: (context, state) => const ProfileScreen()),
      ],
    ),
  ],
);
