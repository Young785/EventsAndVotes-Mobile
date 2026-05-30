import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/services/profile_service.dart';
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
    } catch (e) {
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

  Future<void> _logout() async {
    if (!mounted) return;
    final rootContext = context;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: const Text(
          'Sign Out',
          style: TextStyle(fontWeight: FontWeight.w700),
        ),
        content: const Text('Are you sure you want to sign out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text(
              'Cancel',
              style: TextStyle(color: AppColors.textSecondary),
            ),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );
    if (confirmed == true && rootContext.mounted) {
      await signOutUser(rootContext);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    if (!auth.isAuthenticated) {
      return Scaffold(
        backgroundColor: AppColors.background,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: AppColors.primarySurface,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(
                  Icons.person_outline_rounded,
                  color: AppColors.primary,
                  size: 36,
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'Sign in to view your profile',
                style: AppTextStyles.headlineSmall,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => context.go('/login'),
                child: const Text('Sign In'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: _load,
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child:
                  _loading
                      ? const Padding(
                        padding: EdgeInsets.all(16),
                        child: ShimmerList(count: 4, itemHeight: 80),
                      )
                      : _buildContent(auth),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent(AuthProvider auth) {
    final user = auth.user;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _buildProfileHeaderCard(user),
        const SizedBox(height: 8),
        _buildMenuSection(),
        const SizedBox(height: 18),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: ElevatedButton.icon(
            onPressed: _logout,
            icon: const Icon(Icons.logout_rounded, size: 18),
            label: const Text('Sign Out'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(18),
              ),
            ),
          ),
        ).animate().fadeIn(delay: 200.ms, duration: 300.ms),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildProfileHeaderCard(UserModel? user) {
    final displayName = user?.fullName ?? 'Valued Member';
    final initial = user?.firstName.isNotEmpty == true
        ? user!.firstName.substring(0, 1).toUpperCase()
        : 'U';

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 4),
      decoration: BoxDecoration(
        gradient: AppColors.primaryGradient,
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.12),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => context.push('/profile/details'),
          borderRadius: BorderRadius.circular(22),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 18),
            child: Column(
              children: [
                Stack(
                  clipBehavior: Clip.none,
                  children: [
                    _AvatarCircle(imageUrl: user?.image, initial: initial),
                    Positioned(
                      right: -2,
                      bottom: 0,
                      child: Material(
                        color: Colors.white,
                        shape: const CircleBorder(),
                        elevation: 2,
                        child: InkWell(
                          onTap: () => context.push('/profile/edit'),
                          customBorder: const CircleBorder(),
                          child: const Padding(
                            padding: EdgeInsets.all(7),
                            child: Icon(
                              Icons.edit_rounded,
                              size: 16,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  displayName,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Tap for balance, plan & membership',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.8),
                    fontSize: 11,
                  ),
                ),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 5,
                  ),
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
              ],
            ),
          ),
        ),
      ),
    ).animate().fadeIn(duration: 300.ms);
  }

  Widget _buildMenuSection() {
    final items = [
      {
        'icon': Icons.info_outline_rounded,
        'label': 'Account Details',
        'color': AppColors.info,
        'route': '/profile/details',
      },
      {
        'icon': Icons.confirmation_number_outlined,
        'label': 'My Tickets',
        'color': AppColors.primary,
        'route': '/my-tickets',
      },
      {
        'icon': Icons.edit_outlined,
        'label': 'Edit Profile',
        'color': AppColors.accent,
        'route': '/profile/edit',
      },
      if (context.read<AuthProvider>().user?.isAdmin == true)
        {
          'icon': Icons.admin_panel_settings_outlined,
          'label': 'Vendor Portal',
          'color': AppColors.primary,
          'route': '/admin/dashboard',
        },
      {
        'icon': Icons.lock_outline_rounded,
        'label': 'Change Password',
        'color': AppColors.warning,
        'route': '/change-password',
      },
      {
        'icon': Icons.notifications_outlined,
        'label': 'Notification Settings',
        'color': AppColors.warning,
        'route': null,
      },
      {
        'icon': Icons.help_outline_rounded,
        'label': 'Help Center',
        'color': AppColors.info,
        'route': null,
      },
      {
        'icon': Icons.privacy_tip_outlined,
        'label': 'Privacy Policy',
        'color': AppColors.textSecondary,
        'route': null,
      },
      {
        'icon': Icons.description_outlined,
        'label': 'Terms of Service',
        'color': AppColors.textSecondary,
        'route': null,
      },
    ];

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 18, 16, 10),
            child: Text(
              'Quick Actions',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
          ),
          ...items.asMap().entries.map((e) {
            final item = e.value;
            return Column(
              children: [
                InkWell(
                  onTap:
                      item['route'] != null
                          ? () => context.go(item['route'] as String)
                          : null,
                  borderRadius: BorderRadius.circular(20),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 38,
                          height: 38,
                          decoration: BoxDecoration(
                            color: (item['color'] as Color).withValues(
                              alpha: 0.12,
                            ),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(
                            item['icon'] as IconData,
                            size: 18,
                            color: item['color'] as Color,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Text(
                            item['label'] as String,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ),
                        const Icon(
                          Icons.chevron_right_rounded,
                          size: 18,
                          color: AppColors.textHint,
                        ),
                      ],
                    ),
                  ),
                ),
                if (e.key < items.length - 1)
                  const Divider(height: 1, color: AppColors.border, indent: 66),
              ],
            );
          }),
        ],
      ),
    ).animate().fadeIn(delay: 200.ms, duration: 300.ms);
  }
}

/// Avatar that shows the user's photo when available, or their initial letter
/// on error / when no photo is set. Uses CachedNetworkImage so 404s are caught.
class _AvatarCircle extends StatelessWidget {
  final String? imageUrl;
  final String initial;
  const _AvatarCircle({this.imageUrl, required this.initial});

  @override
  Widget build(BuildContext context) {
    final url = imageUrl != null && imageUrl!.isNotEmpty
        ? (imageUrl!.startsWith('http')
            ? imageUrl!
            : AppConstants.storageUrl(imageUrl))
        : null;

    return CircleAvatar(
      radius: 40,
      backgroundColor: Colors.white,
      child: url != null
          ? ClipOval(
              child: CachedNetworkImage(
                imageUrl: url,
                width: 80,
                height: 80,
                fit: BoxFit.cover,
                errorWidget: (_, __, ___) => _initial(),
                placeholder: (_, __) => _initial(),
              ),
            )
          : _initial(),
    );
  }

  Widget _initial() => Text(
        initial,
        style: const TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.w800,
          color: AppColors.primary,
        ),
      );
}
