import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/services/notification_service.dart';
import '../../core/theme/app_theme.dart';
import '../../features/auth/providers/auth_provider.dart';
import 'app_pop_scope.dart';
import 'notifications_sheet.dart';

class MainShell extends StatelessWidget {
  final Widget child;
  const MainShell({super.key, required this.child});

  static bool isDetailRoute(String location) {
    if (location.startsWith('/votes/') && location != '/votes') return true;
    if (location.startsWith('/events/') && location != '/events') return true;
    if (location.startsWith('/profile/edit')) return true;
    return false;
  }

  int _tabIndex(String location, AuthProvider auth) {
    if (location.startsWith('/votes')) return 1;
    if (location.startsWith('/events')) return 2;
    if (location.startsWith('/profile') ||
        location.startsWith('/my-tickets') ||
        location.startsWith('/dashboard')) {
      return 3;
    }
    return 0;
  }

  String _headerTitle(String location) {
    if (location == '/') return 'Events & Votes';
    if (location == '/votes') return 'Votes';
    if (location == '/events') return 'Events';
    if (location == '/my-tickets') return 'My Tickets';
    if (location == '/dashboard') return 'Rewards';
    if (location == '/profile') return 'Profile';
    return 'Events & Votes';
  }

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    final isDetail = isDetailRoute(location);
    final auth = context.watch<AuthProvider>();
    final index = _tabIndex(location, auth);

    final dark = Theme.of(context).brightness == Brightness.dark;
    final colors = AppPalette.of(context);

    if (isDetail) {
      return Scaffold(backgroundColor: colors.background, body: child);
    }

    final hideHeader = location == '/profile';

    return AppPopScope(
      child: AnnotatedRegion<SystemUiOverlayStyle>(
      value: dark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
      child: Scaffold(
        backgroundColor: colors.background,
        extendBody: true,
        body: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (!hideHeader)
              _ShellHeader(
                auth: auth,
                title: _headerTitle(location),
                showActions: location == '/',
              ),
            Expanded(child: child),
          ],
        ),
        bottomNavigationBar: _ShellBottomNav(
          currentIndex: index,
          auth: auth,
        ),
      ),
      ),
    );
  }
}

class _ShellHeader extends StatefulWidget {
  final AuthProvider auth;
  final String title;
  final bool showActions;

  const _ShellHeader({
    required this.auth,
    required this.title,
    required this.showActions,
  });

  @override
  State<_ShellHeader> createState() => _ShellHeaderState();
}

class _ShellHeaderState extends State<_ShellHeader> {
  final _notificationService = NotificationService();
  int _unreadCount = 0;

  @override
  void initState() {
    super.initState();
    if (widget.auth.isAuthenticated) _refreshUnread();
  }

  @override
  void didUpdateWidget(covariant _ShellHeader oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.auth.isAuthenticated &&
        (!oldWidget.auth.isAuthenticated || oldWidget.auth.user?.id != widget.auth.user?.id)) {
      _refreshUnread();
    }
  }

  Future<void> _refreshUnread() async {
    final count = await _notificationService.getUnreadCount();
    if (mounted) setState(() => _unreadCount = count);
  }

  void _openNotifications() {
    NotificationsSheet.show(context, onCountChanged: _refreshUnread);
  }

  @override
  Widget build(BuildContext context) {
    final auth = widget.auth;
    return Material(
      color: AppPalette.of(context).background,
      child: SafeArea(
        bottom: false,
        child: Container(
          height: 56,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              const SizedBox(
                width: 96,
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: _BrandMark(),
                ),
              ),
              Expanded(
                child: Text(
                  widget.title,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    color: AppPalette.of(context).text,
                    letterSpacing: -0.2,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              SizedBox(
                width: 96,
                child: Align(
                  alignment: Alignment.centerRight,
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 220),
                    switchInCurve: Curves.easeOut,
                    switchOutCurve: Curves.easeIn,
                    transitionBuilder: (child, animation) {
                      final slide = Tween<Offset>(
                        begin: const Offset(0.35, 0),
                        end: Offset.zero,
                      ).animate(animation);
                      return FadeTransition(
                        opacity: animation,
                        child: SlideTransition(position: slide, child: child),
                      );
                    },
                    child: widget.showActions
                        ? _HeaderActions(
                            key: const ValueKey('home-actions'),
                            signedIn: auth.isAuthenticated,
                            unreadCount: _unreadCount,
                            onNotifications: auth.isAuthenticated
                                ? _openNotifications
                                : () => context.go('/login'),
                            onProfile: () => context.go(
                              auth.isAuthenticated ? '/profile' : '/login',
                            ),
                          )
                        : const SizedBox(
                            key: ValueKey('no-actions'),
                            width: 96,
                            height: 40,
                          ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BrandMark extends StatelessWidget {
  const _BrandMark();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 34,
      height: 34,
      decoration: BoxDecoration(
        color: AppColors.primary,
        borderRadius: BorderRadius.circular(10),
      ),
      child: const Icon(
        Icons.bolt_rounded,
        color: Colors.white,
        size: 20,
      ),
    );
  }
}

class _HeaderActions extends StatelessWidget {
  final bool signedIn;
  final int unreadCount;
  final VoidCallback onNotifications;
  final VoidCallback onProfile;

  const _HeaderActions({
    super.key,
    required this.signedIn,
    required this.unreadCount,
    required this.onNotifications,
    required this.onProfile,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _NotificationBell(
          unreadCount: unreadCount,
          onTap: onNotifications,
        ),
        const SizedBox(width: 6),
        _ProfileChip(signedIn: signedIn, onTap: onProfile),
      ],
    );
  }
}

class _NotificationBell extends StatefulWidget {
  final int unreadCount;
  final VoidCallback onTap;

  const _NotificationBell({required this.unreadCount, required this.onTap});

  @override
  State<_NotificationBell> createState() => _NotificationBellState();
}

class _NotificationBellState extends State<_NotificationBell> {
  Timer? _timer;
  int _shakeTick = 0;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 10), (_) {
      if (mounted) setState(() => _shakeTick++);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: 40,
        height: 40,
        child: Stack(
          clipBehavior: Clip.none,
          alignment: Alignment.center,
          children: [
            Icon(
              Icons.notifications_outlined,
              color: AppPalette.of(context).text,
              size: 24,
            )
                .animate(key: ValueKey(_shakeTick))
                .shake(
                  duration: 900.ms,
                  hz: 2,
                  rotation: 0.04,
                  curve: Curves.easeInOut,
                ),
            if (widget.unreadCount > 0)
              Positioned(
                right: 0,
                top: 2,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                  constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                  decoration: const BoxDecoration(
                    color: AppColors.error,
                    shape: BoxShape.circle,
                  ),
                  child: Text(
                    widget.unreadCount > 9 ? '9+' : '${widget.unreadCount}',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 8,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _ProfileChip extends StatelessWidget {
  final bool signedIn;
  final VoidCallback onTap;

  const _ProfileChip({
    required this.signedIn,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(2, 6, 8, 6),
        child: CircleAvatar(
          radius: 16,
          backgroundColor: signedIn ? AppColors.primary : AppPalette.of(context).surface,
          child: Icon(
            Icons.person_rounded,
            size: 16,
            color: signedIn ? Colors.white : AppPalette.of(context).muted,
          ),
        ),
      ),
    );
  }
}

class _ShellBottomNav extends StatelessWidget {
  final int currentIndex;
  final AuthProvider auth;

  const _ShellBottomNav({required this.currentIndex, required this.auth});

  @override
  Widget build(BuildContext context) {
    final destinations = <({
      IconData icon,
      IconData activeIcon,
      String label,
      String route,
    })>[
      (
        icon: Icons.home_outlined,
        activeIcon: Icons.home_rounded,
        label: 'Home',
        route: '/',
      ),
      (
        icon: Icons.track_changes_outlined,
        activeIcon: Icons.track_changes_rounded,
        label: 'Votes',
        route: '/votes',
      ),
      (
        icon: Icons.calendar_today_outlined,
        activeIcon: Icons.calendar_today_rounded,
        label: 'Events',
        route: '/events',
      ),
      (
        icon: Icons.person_outline_rounded,
        activeIcon: Icons.person_rounded,
        label: 'Profile',
        route: auth.isAuthenticated ? '/profile' : '/login',
      ),
    ];

    final dark = Theme.of(context).brightness == Brightness.dark;
    final glassTop = dark
        ? Colors.white.withValues(alpha: 0.16)
        : Colors.white.withValues(alpha: 0.72);
    final glassBottom = dark
        ? Colors.white.withValues(alpha: 0.06)
        : Colors.white.withValues(alpha: 0.38);
    final line = dark
        ? Colors.white.withValues(alpha: 0.22)
        : Colors.white.withValues(alpha: 0.9);

    final homeInset = MediaQuery.paddingOf(context).bottom;
    final bottomGap = homeInset > 20 ? homeInset - 22 : (homeInset > 0 ? homeInset : 8.0);

    return Material(
      type: MaterialType.transparency,
      child: Padding(
          padding: EdgeInsets.fromLTRB(18, 0, 18, bottomGap),
          child: DecoratedBox(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(32),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: dark ? 0.28 : 0.08),
                  blurRadius: 24,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: ClipRRect(
            borderRadius: BorderRadius.circular(32),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 28, sigmaY: 28),
              child: Container(
                height: 64,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [glassTop, glassBottom],
                  ),
                  borderRadius: BorderRadius.circular(32),
                  border: Border.all(color: line),
                ),
                child: Row(
              children: destinations.asMap().entries.map((entry) {
                final i = entry.key;
                final d = entry.value;
                final isActive = currentIndex >= 0 && i == currentIndex;

                return Expanded(
                  child: GestureDetector(
                    onTap: () => context.go(d.route),
                    behavior: HitTestBehavior.opaque,
                    child: Center(
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: isActive
                              ? (dark
                                  ? Colors.white.withValues(alpha: 0.16)
                                  : Colors.white.withValues(alpha: 0.72))
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(18),
                          border: isActive
                              ? Border.all(
                                  color: Colors.white.withValues(alpha: dark ? 0.2 : 0.9),
                                )
                              : null,
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              isActive ? d.activeIcon : d.icon,
                              size: 20,
                              color: isActive
                                  ? AppColors.primary
                                  : AppPalette.of(context).muted,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              d.label,
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: isActive
                                    ? FontWeight.w700
                                    : FontWeight.w500,
                                color: isActive
                                    ? AppColors.primary
                                    : AppPalette.of(context).muted,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
                ),
              ),
            ),
          ),
        ),
        ),
    );
  }
}
