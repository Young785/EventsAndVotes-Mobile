import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/services/admin_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/shimmer_card.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  final AdminService _admin = AdminService();
  Map<String, dynamic>? _stats;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final stats = await _admin.getDashboardStats();
      if (mounted) setState(() { _stats = stats; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        onRefresh: _load,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Vendor Dashboard',
                        style: AppTextStyles.displayMedium),
                    const SizedBox(height: 4),
                    Text(
                      '${user?.role.displayName ?? 'Admin'} · ${user?.fullName ?? ''}',
                      style: AppTextStyles.bodyMedium,
                    ),
                    const SizedBox(height: 20),
                    if (_loading)
                      const ShimmerList(count: 2, itemHeight: 90)
                    else ...[
                      _statCard(
                        'Total Events',
                        '${_stats?['total_events'] ?? _stats?['events_count'] ?? 0}',
                        Icons.event_rounded,
                        AppColors.primary,
                      ),
                      const SizedBox(height: 10),
                      _statCard(
                        'Ticket Sales',
                        '₦${_stats?['total_revenue'] ?? _stats?['ticket_revenue'] ?? 0}',
                        Icons.payments_rounded,
                        AppColors.success,
                      ),
                      const SizedBox(height: 10),
                      _statCard(
                        'Active Events',
                        '${_stats?['active_events'] ?? 0}',
                        Icons.play_circle_outline,
                        AppColors.accent,
                      ),
                    ],
                    const SizedBox(height: 24),
                    const Text('Quick actions',
                        style: AppTextStyles.headlineSmall),
                    const SizedBox(height: 12),
                    if (user?.canManageEvents == true) ...[
                      _actionTile(
                        icon: Icons.event_note_rounded,
                        title: 'Manage Events',
                        subtitle: 'Create, edit, publish events',
                        onTap: () => context.go('/admin/events'),
                      ),
                      _actionTile(
                        icon: Icons.add_circle_outline,
                        title: 'Create Event',
                        subtitle: 'Set up a new event',
                        onTap: () => context.go('/admin/events/create'),
                      ),
                    ],
                    if (user?.canManageVotes == true)
                      _actionTile(
                        icon: Icons.how_to_vote_rounded,
                        title: 'Manage Votes',
                        subtitle: 'Campaigns and nominees',
                        onTap: () => context.go('/votes'),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _statCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: AppTextStyles.bodyMedium),
                Text(value,
                    style: const TextStyle(
                        fontSize: 20, fontWeight: FontWeight.w800)),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 300.ms);
  }

  Widget _actionTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                Icon(icon, color: AppColors.primary),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title,
                          style: const TextStyle(fontWeight: FontWeight.w700)),
                      Text(subtitle,
                          style: const TextStyle(
                              fontSize: 12, color: AppColors.textSecondary)),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right_rounded,
                    color: AppColors.textHint),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
