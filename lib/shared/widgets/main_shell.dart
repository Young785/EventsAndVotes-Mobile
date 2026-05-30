import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/services/notification_service.dart';
import '../../core/theme/app_theme.dart';
import '../../features/auth/providers/auth_provider.dart';
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
    if (location.startsWith('/my-tickets')) return 3;
    if (location.startsWith('/votes')) return 1;
    if (location.startsWith('/events')) return 2;
    if (location.startsWith('/dashboard')) return 4;
    if (location.startsWith('/profile')) return 5;
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

    if (isDetail) {
      return Scaffold(backgroundColor: AppColors.background, body: child);
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _ShellHeader(auth: auth, title: _headerTitle(location)),
          Expanded(child: child),
        ],
      ),
      bottomNavigationBar: _ShellBottomNav(
        currentIndex: index,
        auth: auth,
      ),
    );
  }
}

class _ShellHeader extends StatefulWidget {
  final AuthProvider auth;
  final String title;

  const _ShellHeader({required this.auth, required this.title});

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
      color: AppColors.white,
      child: SafeArea(
        bottom: false,
        child: Container(
          height: 56,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: const BoxDecoration(
            border: Border(bottom: BorderSide(color: AppColors.border)),
          ),
          child: Row(
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  gradient: AppColors.primaryGradient,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.how_to_vote_rounded,
                  color: Colors.white,
                  size: 18,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  widget.title,
                  style: AppTextStyles.headlineSmall,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (auth.user?.isAdmin == true)
                IconButton(
                  icon: const Icon(Icons.admin_panel_settings_outlined,
                      size: 22),
                  color: AppColors.primary,
                  onPressed: () => context.push('/admin/dashboard'),
                  tooltip: 'Vendor portal',
                ),
              if (auth.isAuthenticated) ...[
                _NotificationBell(
                  unreadCount: _unreadCount,
                  onTap: _openNotifications,
                ),
                const SizedBox(width: 4),
                _ProfileChip(
                  name: auth.user?.firstName ?? 'User',
                  onTap: () => context.go('/profile'),
                ),
              ] else
                TextButton(
                  onPressed: () => context.go('/login'),
                  style: TextButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 8,
                    ),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                  ),
                  child: const Text(
                    'Sign In',
                    style:
                        TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                  ),
                ),
            ],
          ),
        ),
      ),
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
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Icon(
            Icons.notifications_outlined,
            color: AppColors.textPrimary,
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
              right: -4,
              top: -4,
              child: Container(
                padding: const EdgeInsets.all(4),
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
    );
  }
}

class _ProfileChip extends StatelessWidget {
  final String name;
  final VoidCallback onTap;

  const _ProfileChip({required this.name, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: AppColors.primarySurface,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircleAvatar(
              radius: 12,
              backgroundColor: AppColors.primary,
              child: Text(
                name.isNotEmpty ? name[0].toUpperCase() : 'U',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            const SizedBox(width: 6),
            Text(name, style: AppTextStyles.labelLarge),
          ],
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
        icon: Icons.how_to_vote_outlined,
        activeIcon: Icons.how_to_vote_rounded,
        label: 'Votes',
        route: '/votes',
      ),
      (
        icon: Icons.event_outlined,
        activeIcon: Icons.event_rounded,
        label: 'Events',
        route: '/events',
      ),
      if (auth.isAuthenticated)
        (
          icon: Icons.confirmation_number_outlined,
          activeIcon: Icons.confirmation_number_rounded,
          label: 'Tickets',
          route: '/my-tickets',
        )
      else
        (
          icon: Icons.login_rounded,
          activeIcon: Icons.login_rounded,
          label: 'Sign In',
          route: '/login',
        ),
      (
        icon: Icons.card_giftcard_outlined,
        activeIcon: Icons.card_giftcard_rounded,
        label: 'Reward',
        route: auth.isAuthenticated ? '/dashboard' : '/login',
      ),
      (
        icon: Icons.person_outline_rounded,
        activeIcon: Icons.person_rounded,
        label: 'Profile',
        route: auth.isAuthenticated ? '/profile' : '/login',
      ),
    ];

    return Material(
      color: AppColors.white,
      child: SafeArea(
        top: false,
        child: Container(
          height: 64,
          decoration: const BoxDecoration(
            border: Border(top: BorderSide(color: AppColors.border)),
          ),
          child: Row(
            children: destinations.asMap().entries.map((entry) {
              final i = entry.key;
              final d = entry.value;
              final isActive = currentIndex >= 0 && i == currentIndex;

              return Expanded(
                child: InkWell(
                  onTap: () => context.go(d.route),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          isActive ? d.activeIcon : d.icon,
                          size: 22,
                          color: isActive
                              ? AppColors.primary
                              : AppColors.textHint,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          d.label,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight:
                                isActive ? FontWeight.w600 : FontWeight.w400,
                            color: isActive
                                ? AppColors.primary
                                : AppColors.textHint,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
      ),
    );
  }
}
