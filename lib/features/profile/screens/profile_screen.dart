import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/services/profile_service.dart';
import '../../../core/utils/json_parse_utils.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/models/user_model.dart';
import '../../../shared/utils/navigation_utils.dart';
import '../../../shared/widgets/shimmer_card.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  static const _alertsKey = 'event_alerts_enabled';

  Map<String, dynamic>? _profile;
  bool _loading = true;
  bool _alertsOn = true;
  bool _showTopUp = false;
  int? _topUpAmount;
  final ProfileService _profileService = ProfileService();

  @override
  void initState() {
    super.initState();
    _load();
    SharedPreferences.getInstance().then((prefs) {
      if (!mounted) return;
      setState(() => _alertsOn = prefs.getBool(_alertsKey) ?? true);
    });
  }

  Future<void> _load() async {
    try {
      final profile = await _profileService.getProfile();
      if (mounted) {
        setState(() {
          _profile = profile;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _profile = null;
          _loading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to load profile')),
        );
      }
    }
  }

  Future<void> _setAlerts(bool value) async {
    setState(() => _alertsOn = value);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_alertsKey, value);
  }

  Future<void> _logout() async {
    if (!mounted) return;
    final rootContext = context;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: AppNight.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text(
          'Sign Out',
          style: TextStyle(fontWeight: FontWeight.w700, color: AppNight.text),
        ),
        content: const Text(
          'Are you sure you want to sign out?',
          style: TextStyle(color: AppNight.muted),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );
    if (confirmed == true && rootContext.mounted) {
      await signOutUser(rootContext);
    }
  }

  double _balance(UserModel? user) {
    final info = _profile?['user_info'];
    if (info is Map) {
      final parsed = parseApiDouble(info['balance']);
      if (parsed != null) return parsed;
    }
    return user?.balance ?? parseApiDoubleOrZero(_profile?['balance']);
  }

  String _referralCode(UserModel? user) {
    final info = _profile?['user_info'];
    if (info is Map && (info['referral_code']?.toString().isNotEmpty ?? false)) {
      return info['referral_code'].toString();
    }
    return user?.referralCode ?? '';
  }

  String _subtitle(UserModel? user) {
    final info = _profile?['user_info'];
    final created = (info is Map ? info['created_at'] : null)?.toString() ??
        user?.createdAt ??
        '';
    String? year;
    try {
      if (created.isNotEmpty) year = DateTime.parse(created).year.toString();
    } catch (_) {}
    final role = user?.isAdmin == true
        ? (user?.role.displayName ?? 'Organizer')
        : 'Attendee & Voter';
    if (year == null) return role;
    return '$role · Member since $year';
  }

  void _chooseTopUp(int amount) {
    setState(() => _topUpAmount = amount);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'Wallet top-up of ₦${amount.toStringAsFixed(0)} is not available yet. '
          'Tickets and paid votes are charged with Paystack at checkout. '
          'Your balance updates from referral rewards.',
        ),
      ),
    );
  }

  Future<void> _openHelp() async {
    final uri = Uri.parse(AppConstants.frontendUrl);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open help')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: AppNight.background,
        body: !auth.isAuthenticated
            ? _signedOut()
            : RefreshIndicator(
                color: AppColors.primary,
                onRefresh: _load,
                child: CustomScrollView(
                  physics: const BouncingScrollPhysics(),
                  slivers: [
                    SliverToBoxAdapter(
                      child: _loading
                          ? const Padding(
                              padding: EdgeInsets.all(16),
                              child: ShimmerList(count: 4, itemHeight: 80),
                            )
                          : _buildContent(auth),
                    ),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _signedOut() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.person_outline_rounded, color: AppColors.primaryLight, size: 42),
          const SizedBox(height: 16),
          const Text(
            'Sign in to view your profile',
            style: TextStyle(
              color: AppNight.text,
              fontSize: 16,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: () => context.go('/login'),
            child: const Text('Sign In'),
          ),
        ],
      ),
    );
  }

  Widget _buildContent(AuthProvider auth) {
    final user = auth.user;
    final code = _referralCode(user);
    final balance = _balance(user);

    return Column(
      children: [
        const SizedBox(height: 12),
        const Text(
          'Profile',
          style: TextStyle(
            color: AppNight.text,
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 18),
        _Avatar(user: user),
        const SizedBox(height: 12),
        Text(
          user?.fullName.trim().isNotEmpty == true ? user!.fullName : 'Member',
          style: const TextStyle(
            color: AppNight.text,
            fontSize: 22,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          _subtitle(user),
          style: const TextStyle(color: AppNight.muted, fontSize: 13),
        ),
        const SizedBox(height: 14),
        GestureDetector(
          onTap: () => setState(() => _showTopUp = !_showTopUp),
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 24),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: AppNight.card,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppNight.border),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.account_balance_wallet_outlined, color: AppColors.primaryLight, size: 18),
                const SizedBox(width: 8),
                Text(
                  'Wallet Balance: ₦${balance.toStringAsFixed(2)}',
                  style: const TextStyle(
                    color: AppNight.text,
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                  ),
                ),
                const Icon(Icons.chevron_right_rounded, color: AppNight.muted, size: 18),
              ],
            ),
          ),
        ),
        if (_showTopUp) ...[
          const SizedBox(height: 12),
          _topUpCard(),
        ],
        const SizedBox(height: 16),
        _menuCard([
          _MenuItem(
            icon: Icons.confirmation_number_outlined,
            title: 'My Tickets',
            subtitle: 'Your digital passes',
            onTap: () => context.go('/my-tickets'),
          ),
          _MenuItem(
            icon: Icons.track_changes_outlined,
            title: 'My Votes & Contests',
            subtitle: 'Competitions you can join',
            onTap: () => context.go('/votes'),
          ),
          _MenuItem(
            icon: Icons.calendar_today_outlined,
            title: 'My Events',
            subtitle: 'Upcoming productions',
            onTap: () => context.go('/events'),
          ),
          _MenuItem(
            icon: Icons.share_outlined,
            title: 'Referral Rewards',
            subtitle: code.isEmpty ? 'Open your rewards' : 'Code: $code',
            onTap: () => context.go('/dashboard'),
          ),
        ]),
        const SizedBox(height: 12),
        _menuCard([
          _MenuItem(
            icon: Icons.notifications_none_rounded,
            title: 'Notifications',
            subtitle: 'Event alerts & vote tally updates',
            trailing: Switch.adaptive(
              value: _alertsOn,
              activeTrackColor: AppColors.primary,
              onChanged: _setAlerts,
            ),
          ),
          if (user?.isAdmin == true)
            _MenuItem(
              icon: Icons.admin_panel_settings_outlined,
              title: 'Vendor Portal',
              subtitle: 'Organizer tooling & stage rosters',
              onTap: () => context.push('/admin/dashboard'),
            ),
          _MenuItem(
            icon: Icons.qr_code_scanner_rounded,
            title: 'Login as Scanner',
            subtitle: 'Gate staff, offline ticket database sync',
            onTap: () => context.push('/scanner/login'),
          ),
          _MenuItem(
            icon: Icons.help_outline_rounded,
            title: 'Help Center & Policies',
            onTap: _openHelp,
          ),
          _MenuItem(
            icon: Icons.edit_outlined,
            title: 'Edit Profile',
            subtitle: 'Name, phone and photo',
            onTap: () => context.push('/profile/edit'),
          ),
          _MenuItem(
            icon: Icons.lock_outline_rounded,
            title: 'Change Password',
            onTap: () => context.push('/change-password'),
          ),
        ]),
        const SizedBox(height: 8),
        TextButton(
          onPressed: _logout,
          child: const Text(
            'Sign Out',
            style: TextStyle(color: AppColors.error, fontWeight: FontWeight.w700),
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _topUpCard() {
    const amounts = [1000, 2500, 5000];
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppNight.card,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.7)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.payments_outlined, color: AppColors.primaryLight, size: 18),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'Top Up Wallet',
                  style: TextStyle(
                    color: AppNight.text,
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              IconButton(
                onPressed: () => setState(() {
                  _showTopUp = false;
                  _topUpAmount = null;
                }),
                icon: const Icon(Icons.close_rounded, color: AppNight.muted, size: 18),
              ),
            ],
          ),
          const Text(
            'Add funds with Paystack to cast votes and buy event passes. '
            'Funding is not switched on for this account yet.',
            style: TextStyle(color: AppNight.muted, fontSize: 13, height: 1.4),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              for (var i = 0; i < amounts.length; i++) ...[
                if (i > 0) const SizedBox(width: 8),
                Expanded(
                  child: GestureDetector(
                    onTap: () => _chooseTopUp(amounts[i]),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: _topUpAmount == amounts[i]
                            ? AppColors.primary
                            : AppNight.surfaceHigh,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        '+ ₦${amounts[i].toStringAsFixed(0)}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _menuCard(List<_MenuItem> items) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: AppNight.card,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppNight.border),
      ),
      child: Column(
        children: [
          for (var i = 0; i < items.length; i++) ...[
            if (i > 0) const Divider(height: 1, color: AppNight.border),
            items[i],
          ],
        ],
      ),
    );
  }
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback? onTap;
  final Widget? trailing;

  const _MenuItem({
    required this.icon,
    required this.title,
    this.subtitle,
    this.onTap,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: const BoxDecoration(
                color: AppNight.surfaceHigh,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 18, color: AppColors.primaryLight),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      color: AppNight.text,
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  if (subtitle != null)
                    Text(
                      subtitle!,
                      style: const TextStyle(color: AppNight.muted, fontSize: 12),
                    ),
                ],
              ),
            ),
            trailing ??
                const Icon(Icons.chevron_right_rounded, color: AppNight.muted),
          ],
        ),
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  final UserModel? user;
  const _Avatar({required this.user});

  @override
  Widget build(BuildContext context) {
    final first = user?.firstName ?? '';
    final last = user?.lastName ?? '';
    final initials = [
      if (first.isNotEmpty) first[0],
      if (last.isNotEmpty) last[0],
    ].join().toUpperCase();
    final label = initials.isEmpty ? 'U' : initials;
    final raw = user?.image;
    final url = raw != null && raw.isNotEmpty
        ? (raw.startsWith('http') ? raw : AppConstants.storageUrl(raw))
        : null;

    return CircleAvatar(
      radius: 42,
      backgroundColor: const Color(0xFF2A3B5C),
      child: url == null
          ? Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 28,
                fontWeight: FontWeight.w800,
              ),
            )
          : ClipOval(
              child: CachedNetworkImage(
                imageUrl: url,
                width: 84,
                height: 84,
                fit: BoxFit.cover,
                errorWidget: (_, __, ___) => Text(
                  label,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ),
    );
  }
}
