import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../features/auth/providers/auth_provider.dart';

DateTime? _lastRootBackPress;
bool _handlingBack = false;

const _shellTabRoutes = {
  '/',
  '/votes',
  '/events',
  '/my-tickets',
  '/dashboard',
  '/profile',
};

/// Signs the user out and navigates to the login screen.
Future<void> signOutUser(BuildContext context) async {
  await context.read<AuthProvider>().logout();
  if (!context.mounted) return;
  GoRouter.of(context).go('/login');
}

String _homeRoute(BuildContext context) {
  final auth = context.read<AuthProvider>();
  if (auth.isAuthenticated) {
    return auth.needsVerification ? '/verification' : '/dashboard';
  }
  return '/';
}

/// Handles Android/iOS system back and edge-swipe back navigation.
void handleAppBack(BuildContext context, {String? fallbackRoute}) {
  if (_handlingBack || !context.mounted) return;
  _handlingBack = true;

  try {
    final router = GoRouter.of(context);
    final loc = GoRouterState.of(context).matchedLocation;

    // Scanner portal manages its own back stack (tabs).
    if (loc.startsWith('/scanner')) return;

    if (loc.startsWith('/votes/') && loc != '/votes') {
      router.go('/votes');
      return;
    }

    if (loc.startsWith('/events/')) {
      final ticketMatch =
          RegExp(r'^/events/([^/]+)/tickets').firstMatch(loc);
      if (ticketMatch != null) {
        router.go('/events/${ticketMatch.group(1)}');
        return;
      }
      router.go('/events');
      return;
    }

    if (loc.startsWith('/profile/')) {
      router.go('/profile');
      return;
    }

    if (loc.startsWith('/admin/events/') && loc.endsWith('/scanner')) {
      final id = RegExp(r'^/admin/events/([^/]+)/scanner')
          .firstMatch(loc)
          ?.group(1);
      if (id != null) {
        router.go('/admin/events/$id');
        return;
      }
    }

    if (loc == '/admin/events/create') {
      router.go('/admin/events');
      return;
    }

    if (loc.startsWith('/admin/events/') && loc != '/admin/events') {
      router.go('/admin/events');
      return;
    }

    if (loc.startsWith('/admin/')) {
      router.go('/admin/dashboard');
      return;
    }

    if (loc == '/change-password') {
      router.go('/profile');
      return;
    }

    if (_isAuthRoute(loc)) {
      router.go(_homeRoute(context));
      return;
    }

    if (loc == '/verification') {
      router.go('/login');
      return;
    }

    if (loc.startsWith('/scan/')) {
      router.go('/scanner/login');
      return;
    }

    if (_shellTabRoutes.contains(loc)) {
      final home = _homeRoute(context);
      if (loc == home) {
        _maybeExitApp(context);
        return;
      }
      router.go(home);
      return;
    }

    if (router.canPop()) {
      router.pop();
      return;
    }

    router.go(fallbackRoute ?? _homeRoute(context));
  } finally {
    Future.microtask(() => _handlingBack = false);
  }
}

bool _isAuthRoute(String loc) =>
    loc.startsWith('/login') ||
    loc.startsWith('/register') ||
    loc.startsWith('/forgot-password');

void _maybeExitApp(BuildContext context) {
  final now = DateTime.now();
  if (_lastRootBackPress == null ||
      now.difference(_lastRootBackPress!) > const Duration(seconds: 2)) {
    _lastRootBackPress = now;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Press back again to exit'),
        duration: const Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
    return;
  }
  SystemNavigator.pop();
}

/// Used by in-app back buttons — same rules as the system back gesture.
void popPage(BuildContext context, {String? fallbackRoute}) {
  handleAppBack(context, fallbackRoute: fallbackRoute);
}

/// Back navigation inside the scanner portal (tab-aware).
void handleScannerBack(
  BuildContext context, {
  required int tabIndex,
  required VoidCallback goToHomeTab,
}) {
  if (tabIndex != 0) {
    goToHomeTab();
    return;
  }
  GoRouter.of(context).go('/login');
}
