import 'dart:async';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import '../../core/providers/ticket_cart_provider.dart';
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

  // 5-tab layout: Home(0) Votes(1) Events(2) Reward(3) Profile(4)
  int _tabIndex(String location, AuthProvider auth) {
    if (location.startsWith('/votes')) return 1;
    if (location.startsWith('/events')) return 2;
    if (location.startsWith('/dashboard')) return 3;
    if (location.startsWith('/profile')) return 4;
    return 0;
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
          _ShellHeader(auth: auth),
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

// ─── Top Header ───────────────────────────────────────────────────────────────

class _ShellHeader extends StatefulWidget {
  final AuthProvider auth;
  const _ShellHeader({required this.auth});

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
        (!oldWidget.auth.isAuthenticated ||
            oldWidget.auth.user?.id != widget.auth.user?.id)) {
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

  // ── Top Header (flat, no shadow, no border) ──────────────────────────────
  @override
  Widget build(BuildContext context) {
    final auth = widget.auth;
    final user = auth.user;

    return Material(
      color: AppColors.white,
      elevation: 0,
      child: SafeArea(
        bottom: false,
        child: Container(
          height: 68,
          padding: const EdgeInsets.symmetric(horizontal: 18),
          color: AppColors.white,   // flat — no border, no shadow
          child: Row(
            children: [
              // ── Left: avatar + greeting ──────────────────────────────────
              if (auth.isAuthenticated && user != null)
                GestureDetector(
                  onTap: () => context.go('/profile'),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _UserAvatar(
                        imageUrl: user.image,
                        name: user.firstName,
                        radius: 21,
                      ),
                      const SizedBox(width: 10),
                      Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Hello 👋',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.textHint,
                              fontWeight: FontWeight.w400,
                            ),
                          ),
                          Text(
                            user.firstName,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                              height: 1.1,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                )
              else
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        gradient: AppColors.primaryGradient,
                        borderRadius: BorderRadius.circular(11),
                      ),
                      child: Center(
                        child: HugeIcon(
                          icon: HugeIcons.strokeRoundedCheckList,
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                    ),
                    const SizedBox(width: 9),
                    const Text(
                      'Evote',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),

              const Spacer(),

              // ── Right: admin · cart · bell / sign-in ─────────────────────
              if (auth.user?.isAdmin == true)
                _HeaderIconBtn(
                  icon: HugeIcons.strokeRoundedUserAccount,
                  onTap: () => context.push('/admin/dashboard'),
                  tooltip: 'Vendor portal',
                ),

              if (auth.isAuthenticated) ...[
                _CartBadgeBtn(onTap: () => context.go('/my-tickets')),
                const SizedBox(width: 2),
                _NotificationBell(
                  unreadCount: _unreadCount,
                  onTap: _openNotifications,
                ),
              ] else
                TextButton(
                  onPressed: () => context.go('/login'),
                  style: TextButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 9),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                  ),
                  child: const Text(
                    'Sign In',
                    style:
                        TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── User Avatar ──────────────────────────────────────────────────────────────

class _UserAvatar extends StatelessWidget {
  final String? imageUrl;
  final String name;
  final double radius;

  const _UserAvatar({
    required this.imageUrl,
    required this.name,
    this.radius = 21,
  });

  @override
  Widget build(BuildContext context) {
    if (imageUrl != null && imageUrl!.isNotEmpty) {
      return CircleAvatar(
        radius: radius,
        backgroundColor: AppColors.primarySurface,
        child: ClipOval(
          child: CachedNetworkImage(
            imageUrl: imageUrl!,
            width: radius * 2,
            height: radius * 2,
            fit: BoxFit.cover,
            errorWidget: (_, __, ___) =>
                _Initials(name: name, radius: radius),
          ),
        ),
      );
    }
    return _Initials(name: name, radius: radius);
  }
}

class _Initials extends StatelessWidget {
  final String name;
  final double radius;
  const _Initials({required this.name, required this.radius});

  @override
  Widget build(BuildContext context) {
    return CircleAvatar(
      radius: radius,
      backgroundColor: AppColors.primary,
      child: Text(
        name.isNotEmpty ? name[0].toUpperCase() : 'U',
        style: TextStyle(
          color: Colors.white,
          fontSize: radius * 0.72,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

// ─── Header Icon Button ───────────────────────────────────────────────────────

class _HeaderIconBtn extends StatelessWidget {
  final List<List<dynamic>> icon;
  final VoidCallback onTap;
  final String? tooltip;

  const _HeaderIconBtn({
    required this.icon,
    required this.onTap,
    this.tooltip,
  });

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip ?? '',
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: HugeIcon(
            icon: icon,
            size: 24,
            color: AppColors.textPrimary,
          ),
        ),
      ),
    );
  }
}

// ─── Cart Badge Button ────────────────────────────────────────────────────────

class _CartBadgeBtn extends StatelessWidget {
  final VoidCallback onTap;
  const _CartBadgeBtn({required this.onTap});

  @override
  Widget build(BuildContext context) {
    final count = context.watch<TicketCartProvider>().count;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(22),
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            HugeIcon(
              icon: HugeIcons.strokeRoundedShoppingBag01,
              size: 24,
              color: AppColors.textPrimary,
            ),
            if (count > 0)
              Positioned(
                right: -5,
                top: -5,
                child: Container(
                  padding: const EdgeInsets.all(3),
                  constraints:
                      const BoxConstraints(minWidth: 17, minHeight: 17),
                  decoration: const BoxDecoration(
                    color: AppColors.primary,
                    shape: BoxShape.circle,
                  ),
                  child: Text(
                    count > 9 ? '9+' : '$count',
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

// ─── Notification Bell ────────────────────────────────────────────────────────

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
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            HugeIcon(
              icon: widget.unreadCount > 0
                  ? HugeIcons.strokeRoundedBellDot
                  : HugeIcons.strokeRoundedBellElectric,
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
                right: -5,
                top: -5,
                child: Container(
                  padding: const EdgeInsets.all(3),
                  constraints:
                      const BoxConstraints(minWidth: 17, minHeight: 17),
                  decoration: const BoxDecoration(
                    color: AppColors.error,
                    shape: BoxShape.circle,
                  ),
                  child: Text(
                    widget.unreadCount > 9
                        ? '9+'
                        : '${widget.unreadCount}',
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

// ─── Bottom Navigation ────────────────────────────────────────────────────────

class _ShellBottomNav extends StatelessWidget {
  final int currentIndex;
  final AuthProvider auth;
  const _ShellBottomNav({required this.currentIndex, required this.auth});

  @override
  Widget build(BuildContext context) {
    // Each tab: inactive icon, active icon, label, route
    final tabs = <({
      List<List<dynamic>> icon,
      List<List<dynamic>> activeIcon,
      String label,
      String route,
    })>[
      (
        icon: HugeIcons.strokeRoundedHome01,
        activeIcon: HugeIcons.strokeRoundedHome09,
        label: 'Home',
        route: '/',
      ),
      (
        icon: HugeIcons.strokeRoundedCheckList,
        activeIcon: HugeIcons.strokeRoundedCheckList,
        label: 'Vote',
        route: '/votes',
      ),
      (
        icon: HugeIcons.strokeRoundedCalendar03,
        activeIcon: HugeIcons.strokeRoundedCalendar04,
        label: 'Events',
        route: '/events',
      ),
      (
        icon: HugeIcons.strokeRoundedGift,
        activeIcon: HugeIcons.strokeRoundedAward01,
        label: 'Reward',
        route: auth.isAuthenticated ? '/dashboard' : '/login',
      ),
      (
        icon: HugeIcons.strokeRoundedUser,
        activeIcon: HugeIcons.strokeRoundedUserCircle,
        label: 'Profile',
        route: auth.isAuthenticated ? '/profile' : '/login',
      ),
    ];

    return Material(
      color: AppColors.white,
      elevation: 0,
      child: SafeArea(
        top: false,
        child: Container(
          height: 68,
          decoration: BoxDecoration(
            color: AppColors.white,
            border: Border(
              top: BorderSide(color: AppColors.border, width: 0.8),
            ),
          ),
          child: Row(
            children: tabs.asMap().entries.map((entry) {
              final i = entry.key;
              final tab = entry.value;
              final isActive = currentIndex >= 0 && i == currentIndex;

              return Expanded(
                child: InkWell(
                  onTap: () => context.go(tab.route),
                  splashColor: AppColors.primarySurface,
                  highlightColor: Colors.transparent,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Active indicator dot above icon
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          height: 3,
                          width: isActive ? 20 : 0,
                          margin: const EdgeInsets.only(bottom: 4),
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                        HugeIcon(
                          icon: isActive ? tab.activeIcon : tab.icon,
                          size: 24,
                          color: isActive
                              ? AppColors.primary
                              : AppColors.textHint,
                        ),
                        const SizedBox(height: 3),
                        Text(
                          tab.label,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: isActive
                                ? FontWeight.w700
                                : FontWeight.w400,
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
