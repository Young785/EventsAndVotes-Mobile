import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/services/profile_service.dart';
import '../../../core/utils/json_parse_utils.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/models/user_model.dart';
import '../../../shared/widgets/shimmer_card.dart';
import '../../../shared/widgets/slanted_stat_strip.dart';
import '../../../shared/utils/navigation_utils.dart';

class ProfileDetailsScreen extends StatefulWidget {
  const ProfileDetailsScreen({super.key});

  @override
  State<ProfileDetailsScreen> createState() => _ProfileDetailsScreenState();
}

class _ProfileDetailsScreenState extends State<ProfileDetailsScreen> {
  Map<String, dynamic>? _profile;
  bool _loading = true;
  final ProfileService _profileService = ProfileService();

  @override
  void initState() {
    super.initState();
    _load();
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
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    final userInfo = _profile?['user_info'] ?? {};
    final subInfo = _profile?['subscription_info'];
    final email = user?.email ?? userInfo['email']?.toString() ?? '';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 20),
          onPressed: () => popPage(context),
        ),
        title: const Text(
          'Account Overview',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
      ),
      body: _loading
          ? const Padding(
              padding: EdgeInsets.all(16),
              child: ShimmerList(count: 4, itemHeight: 80),
            )
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                physics: const AlwaysScrollableScrollPhysics(
                  parent: BouncingScrollPhysics(),
                ),
                children: [
                  _heroCard(
                    user: user,
                    balance: formatApiAmount(userInfo['balance']),
                    plan: (subInfo?['plan'] is Map
            ? subInfo!['plan']['name']?.toString()
            : subInfo?['plan']?.toString()) ??
        subInfo?['plan_details']?['name']?.toString() ??
        'Free',
                    memberSince:
                        userInfo['created_at']?.toString().substring(0, 10) ??
                        'N/A',
                  ),
                  const SizedBox(height: 20),
                  _contactSection(
                    email: email,
                    phone: userInfo['phone']?.toString() ?? 'Not set',
                    accountId: userInfo['account_id']?.toString() ?? 'N/A',
                    role: user?.role.displayName,
                  ),
                ],
              ),
            ),
    );
  }

  Widget _heroCard({
    required UserModel? user,
    required String balance,
    required String plan,
    required String memberSince,
  }) {
    final initial = user?.firstName.isNotEmpty == true
        ? user!.firstName.substring(0, 1).toUpperCase()
        : 'U';

    return Container(
      decoration: BoxDecoration(
        gradient: AppColors.primaryGradient,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.15),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          const SizedBox(height: 20),
          Stack(
            clipBehavior: Clip.none,
            children: [
              CircleAvatar(
                radius: 44,
                backgroundColor: Colors.white,
                child: Text(
                  initial,
                  style: const TextStyle(
                    fontSize: 36,
                    fontWeight: FontWeight.w800,
                    color: AppColors.primary,
                  ),
                ),
              ),
              Positioned(
                right: -2,
                bottom: -2,
                child: Material(
                  color: Colors.white,
                  shape: const CircleBorder(),
                  elevation: 2,
                  child: InkWell(
                    onTap: () => context.push('/profile/edit'),
                    customBorder: const CircleBorder(),
                    child: const Padding(
                      padding: EdgeInsets.all(8),
                      child: Icon(
                        Icons.edit_rounded,
                        size: 18,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            user?.fullName ?? 'Member',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            user?.email ?? '',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.85),
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              user?.role.displayName ?? 'User',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 11,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(height: 24),
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 20),
            child: SlantedStatStrip(
              items: [
                SlantedStatItem(
                  label: 'Balance',
                  value: '₦$balance',
                  icon: Icons.account_balance_wallet_rounded,
                  accentColor: AppColors.primary,
                  tilt: -0.08,
                ),
                SlantedStatItem(
                  label: 'Plan',
                  value: plan,
                  icon: Icons.workspace_premium_rounded,
                  accentColor: AppColors.accent,
                  tilt: 0.05,
                ),
                SlantedStatItem(
                  label: 'Member Since',
                  value: memberSince,
                  icon: Icons.calendar_today_rounded,
                  accentColor: AppColors.success,
                  tilt: -0.05,
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 300.ms);
  }

  Widget _contactSection({
    required String email,
    required String phone,
    required String accountId,
    String? role,
  }) {
    final items = <_RowItem>[
      _RowItem(Icons.email_outlined, 'Email', email),
      _RowItem(Icons.phone_outlined, 'Phone', phone),
      _RowItem(Icons.badge_outlined, 'Account ID', accountId),
      if (role != null) _RowItem(Icons.shield_outlined, 'Role', role),
    ];

    return Container(
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text(
              'Contact Information',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
          ),
          ...items.asMap().entries.map((e) {
            final item = e.value;
            return Column(
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: AppColors.surfaceVariant,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(item.icon, size: 18, color: AppColors.primary),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.label,
                              style: const TextStyle(
                                fontSize: 11,
                                color: AppColors.textSecondary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              item.value,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                if (e.key < items.length - 1)
                  const Divider(height: 1, color: AppColors.border),
              ],
            );
          }),
        ],
      ),
    ).animate().fadeIn(delay: 100.ms, duration: 300.ms);
  }
}

class _RowItem {
  final IconData icon;
  final String label;
  final String value;
  const _RowItem(this.icon, this.label, this.value);
}
