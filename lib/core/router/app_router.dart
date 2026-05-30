import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/scanner/providers/scanner_session_provider.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/register_screen.dart';
import '../../features/auth/screens/forgot_password_screen.dart';
import '../../features/auth/screens/change_password_screen.dart';
import '../../features/auth/screens/verification_screen.dart';
import '../../features/home/screens/home_screen.dart';
import '../../features/votes/screens/votes_list_screen.dart';
import '../../features/votes/screens/vote_detail_screen.dart';
import '../../features/events/screens/events_screen.dart';
import '../../features/events/screens/event_detail_screen.dart';
import '../../features/dashboard/screens/dashboard_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/profile/screens/edit_profile_screen.dart';
import '../../features/profile/screens/profile_details_screen.dart';
import '../../features/splash/screens/splash_screen.dart';
import '../../features/onboarding/screens/onboarding_screen.dart';
import '../../features/tickets/screens/my_tickets_screen.dart';
import '../../features/tickets/screens/buy_tickets_screen.dart';
import '../../features/tickets/screens/payment_callback_screen.dart';
import '../../features/admin/screens/admin_dashboard_screen.dart';
import '../../features/admin/screens/admin_events_screen.dart';
import '../../features/admin/screens/admin_event_detail_screen.dart';
import '../../features/admin/screens/admin_create_event_screen.dart';
import '../../features/scanner/screens/scan_portal_screen.dart';
import '../../features/scanner/screens/scanner_login_screen.dart';
import '../../features/scanner/screens/admin_scanner_screen.dart';
import '../../shared/widgets/main_shell.dart';
import '../../features/scanner/screens/scanner_portal_screen.dart';
import '../../features/scanner/screens/scanner_staff_detail_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

bool _isAuthRoute(String loc) =>
    loc.startsWith('/login') ||
    loc.startsWith('/register') ||
    loc.startsWith('/forgot-password');

bool _isScannerAuthRoute(String loc) => loc.startsWith('/scanner/login');

bool _isScannerRoute(String loc) => loc.startsWith('/scanner');

bool _isPublicBrowseRoute(String loc) {
  if (loc == '/' || loc == '/votes' || loc == '/events') return true;
  if (loc.startsWith('/votes/') && loc != '/votes') return true;
  if (loc.startsWith('/events/') && !loc.contains('/tickets')) return true;
  return false;
}

bool _isGuestAllowedRoute(String loc) =>
    loc == '/splash' ||
    loc == '/onboarding' ||
    _isAuthRoute(loc) ||
    _isScannerAuthRoute(loc) ||
    _isPublicBrowseRoute(loc) ||
    loc.startsWith('/scan/') ||
    loc.startsWith('/payment/callback');

bool _isVerificationRoute(String loc) => loc == '/verification';

bool _isAdminRoute(String loc) => loc.startsWith('/admin');

bool _requiresUserAuth(String loc) =>
    loc.startsWith('/dashboard') ||
    loc.startsWith('/profile') ||
    loc.startsWith('/my-tickets') ||
    _isVerificationRoute(loc);

String _authenticatedHome(AuthProvider auth) {
  if (auth.needsVerification) return '/verification';
  return '/dashboard';
}

GoRouter createRouter(
  AuthProvider authProvider,
  ScannerSessionProvider scannerProvider,
) {
  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/splash',
    refreshListenable: Listenable.merge([authProvider, scannerProvider]),
    errorBuilder: (context, state) => const LoginScreen(),
    redirect: (context, state) {
      final isAuth = authProvider.isAuthenticated;
      final onboardingDone = authProvider.onboardingCompleted;
      final isLoading = authProvider.isLoading || scannerProvider.isLoading;
      final loc = state.matchedLocation;
      final isScanner = scannerProvider.isAuthenticated;

      if (isLoading) return null;

      if (loc == '/splash') {
        if (!onboardingDone) return '/onboarding';
        if (isScanner) return '/scanner/home';
        if (!isAuth) return '/login';
        return _authenticatedHome(authProvider);
      }

      if (loc == '/onboarding') {
        if (!onboardingDone) return null;
        if (isScanner) return '/scanner/home';
        return isAuth ? _authenticatedHome(authProvider) : '/login';
      }

      if (_isScannerRoute(loc)) {
        if (_isScannerAuthRoute(loc)) {
          if (isScanner) return '/scanner/home';
          return null;
        }
        if (!isScanner) return '/scanner/login';
        return null;
      }

      if (!isAuth && _requiresUserAuth(loc)) {
        return '/login';
      }

      if (isAuth && _isAuthRoute(loc)) {
        return _authenticatedHome(authProvider);
      }

      if (!isAuth && !_isGuestAllowedRoute(loc)) {
        return '/login';
      }

      if (!isAuth && loc.contains('/tickets')) {
        return '/login';
      }

      if (isAuth &&
          !authProvider.needsVerification &&
          _isVerificationRoute(loc)) {
        return '/dashboard';
      }

      if (isAuth &&
          authProvider.needsVerification &&
          !_isVerificationRoute(loc) &&
          !loc.startsWith('/payment/callback') &&
          !_isScannerRoute(loc)) {
        return '/verification';
      }

      if (_isAdminRoute(loc)) {
        final user = authProvider.user;
        if (!isAuth || user == null || !user.isAdmin) {
          return isAuth ? '/dashboard' : '/';
        }
        if (loc.contains('/events') &&
            !user.canManageEvents &&
            !user.isSuperAdmin) {
          return '/admin/dashboard';
        }
      }

      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (c, s) => const SplashScreen()),
      GoRoute(path: '/onboarding', builder: (c, s) => const OnboardingScreen()),
      GoRoute(
        path: '/login',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (c, s) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (c, s) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/forgot-password',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (c, s) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/verification',
        builder: (c, s) => const VerificationScreen(),
      ),
      GoRoute(
        path: '/scan/:token',
        builder: (c, s) =>
            ScanPortalScreen(token: s.pathParameters['token']!),
      ),
      GoRoute(
        path: '/scanner',
        redirect: (_, __) => '/scanner/home',
      ),
      GoRoute(
        path: '/scanner/login',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (c, s) => const ScannerLoginScreen(),
      ),
      GoRoute(
        path: '/scanner/home',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (c, s) => const ScannerPortalScreen(initialIndex: 0),
      ),
      GoRoute(
        path: '/scanner/sync',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (c, s) => const ScannerPortalScreen(initialIndex: 1),
      ),
      GoRoute(
        path: '/scanner/scan',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (c, s) => const ScannerPortalScreen(initialIndex: 2),
      ),
      GoRoute(
        path: '/scanner/records',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (c, s) => const ScannerPortalScreen(initialIndex: 3),
      ),
      GoRoute(
        path: '/scanner/profile',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (c, s) => const ScannerPortalScreen(initialIndex: 4),
      ),
      GoRoute(
        path: '/scanner/account',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (c, s) => const ScannerStaffDetailScreen(),
      ),
      GoRoute(
        path: '/payment/callback',
        builder: (c, s) => PaymentCallbackScreen(
          type: s.uri.queryParameters['type'] ?? 'tickets',
          reference: s.uri.queryParameters['reference'] ?? '',
        ),
      ),
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) => MainShell(child: child),
        routes: [
          GoRoute(path: '/', builder: (c, s) => const HomeScreen()),
          GoRoute(path: '/votes', builder: (c, s) => const VotesListScreen()),
          GoRoute(path: '/events', builder: (c, s) => const EventsScreen()),
          GoRoute(
            path: '/my-tickets',
            builder: (c, s) => const MyTicketsScreen(),
          ),
          GoRoute(
            path: '/dashboard',
            builder: (c, s) => const DashboardScreen(),
          ),
          GoRoute(path: '/profile', builder: (c, s) => const ProfileScreen()),
        ],
      ),
      GoRoute(
        path: '/profile/edit',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (c, s) => const EditProfileScreen(),
      ),
      GoRoute(
        path: '/profile/details',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (c, s) => const ProfileDetailsScreen(),
      ),
      GoRoute(
        path: '/votes/:slug/:id',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (c, s) => VoteDetailScreen(
          slug: s.pathParameters['slug']!,
          voteId: s.pathParameters['id']!,
        ),
      ),
      GoRoute(
        path: '/events/:id',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (c, s) => EventDetailScreen(eventId: s.pathParameters['id']!),
      ),
      GoRoute(
        path: '/events/:id/tickets',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (c, s) =>
            BuyTicketsScreen(eventId: s.pathParameters['id']!),
      ),
      GoRoute(
        path: '/change-password',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (c, s) => const ChangePasswordScreen(),
      ),
      GoRoute(
        path: '/admin/dashboard',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (c, s) => const AdminDashboardScreen(),
      ),
      GoRoute(
        path: '/admin/events',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (c, s) => const AdminEventsScreen(),
      ),
      GoRoute(
        path: '/admin/events/create',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (c, s) => const AdminCreateEventScreen(),
      ),
      GoRoute(
        path: '/admin/events/:id',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (c, s) =>
            AdminEventDetailScreen(eventId: s.pathParameters['id']!),
      ),
      GoRoute(
        path: '/admin/events/:id/scanner',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (c, s) =>
            AdminScannerScreen(eventId: s.pathParameters['id']!),
      ),
    ],
  );
}
