import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:share_plus/share_plus.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/services/dashboard_service.dart';
import '../../../core/services/tickets_service.dart';
import '../../../core/utils/json_parse_utils.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/shimmer_card.dart';
import '../../../shared/widgets/withdrawal_request_sheet.dart';
import '../../../shared/widgets/app_alert.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic>? _profile;
  Map<String, dynamic>? _referral;
  List<dynamic>? _transactions;
  bool _loading = true;
  bool _hideBalance = false;
  int _activeTab = 0;
  final DashboardService _dashboardService = DashboardService();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      // Load dashboard + referral in parallel; tickets are non-critical
      final results = await Future.wait([
        _dashboardService.getStats(),
        _dashboardService.getReferralDashboard(),
      ]);
      final stats = results[0];
      final referral = results[1];

      // Build referral-based transactions list
      final referralTxns =
          (referral['statistics']?['recent_referrals'] as List? ?? [])
              .whereType<Map>()
              .map((r) => <String, dynamic>{
                    'type': 'credit',
                    'description':
                        r['description']?.toString() ?? 'Referral earning',
                    'amount': r['commission_amount'] ?? 0,
                    'status': r['status']?.toString() ?? 'completed',
                    'created_at': r['created_at']?.toString() ?? '',
                    '_icon': 'referral',
                  })
              .toList();

      // Load ticket purchases and format them as debit transactions
      List<Map<String, dynamic>> ticketTxns = [];
      try {
        final tickets = await TicketsService().getMyTickets();
        ticketTxns = tickets.map((t) {
          final event =
              t['event'] is Map ? t['event'] as Map : <String, dynamic>{};
          final title =
              event['title']?.toString() ?? t['event_title']?.toString();
          final price = (t['price'] as num?)?.toDouble() ?? 0;
          return <String, dynamic>{
            'type': 'debit',
            'description': title != null ? 'Ticket — $title' : 'Event Ticket',
            'amount': price,
            'status': t['status']?.toString() ?? 'completed',
            'created_at': t['created_at']?.toString() ?? '',
            '_icon': 'ticket',
          };
        }).toList();
      } catch (_) {}

      // Merge and sort by date descending
      final allTxns = [...referralTxns, ...ticketTxns];
      allTxns.sort((a, b) {
        final da = a['created_at']?.toString() ?? '';
        final db = b['created_at']?.toString() ?? '';
        return db.compareTo(da);
      });

      if (mounted) {
        setState(() {
          _profile = {
            'user_info': {
              'balance': parseApiDoubleOrZero(stats['balance']),
              'phone': stats['phone'] ?? '',
              'account_id': stats['account_id'] ?? '',
              'created_at':
                  stats['created_at'] ?? DateTime.now().toIso8601String(),
            },
            'referral_code': referral['referral_code'] ?? '',
            'referral_earnings': parseApiDoubleOrZero(
              referral['statistics']?['total_earnings'],
            ),
          };
          _referral = referral;
          _transactions = allTxns;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _profile = null;
          _referral = null;
          _transactions = [];
          _loading = false;
        });
        showTopAlert(context, 
          const SnackBar(content: Text('Failed to load rewards data')),
        );
      }
    }
  }

  String get _referralCode =>
      _referral?['referral_code']?.toString() ??
      _profile?['referral_code']?.toString() ??
      '';

  String get _referralLink {
    final fromApi = _referral?['referral_link']?.toString();
    if (fromApi != null && fromApi.isNotEmpty) {
      if (fromApi.contains('admin=true')) return fromApi;
      return fromApi.contains('?') ? '$fromApi&admin=true' : '$fromApi?admin=true';
    }
    final code =
        _referral?['referral_code']?.toString() ??
        _profile?['referral_code']?.toString() ??
        '';
    return '${AppConstants.frontendUrl}/register?ref=$code&admin=true';
  }

  Future<void> _shareLink() async {
    await Share.share(
      'Join Events & Votes with my referral link:\n$_referralLink',
      subject: 'Events & Votes Referral',
    );
  }

  Future<void> _openWithdrawal() async {
    final submitted = await WithdrawalRequestSheet.show(context);
    if (submitted == true) _load();
  }

  void _copyCode() {
    if (_referralCode.isEmpty) return;
    Clipboard.setData(ClipboardData(text: _referralCode));
    showTopAlert(context, 
      const SnackBar(content: Text('Referral code copied!')),
    );
  }

  void _copyLink() {
    Clipboard.setData(ClipboardData(text: _referralLink));
    showTopAlert(context, 
      SnackBar(
        content: const Text('Referral link copied!'),
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (!auth.isAuthenticated) {
      return Scaffold(
        backgroundColor: AppPalette.of(context).background,
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
                  Icons.lock_outline_rounded,
                  color: AppColors.primary,
                  size: 36,
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'Sign in to access your dashboard',
                style: AppTextStyles.tone(AppTextStyles.headlineSmall, context),
              ),
              const SizedBox(height: 8),
              Text(
                'Track referrals, earnings and more',
                style: AppTextStyles.tone(AppTextStyles.bodyMedium, context, muted: true),
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
      backgroundColor: AppPalette.of(context).background,
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
                        child: ShimmerList(count: 5, itemHeight: 90),
                      )
                      : Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 6),
                          _buildWelcomeBanner(auth),
                          _buildStatsGrid(),
                          _buildTabBar(),
                          _buildTabContent(),
                          const SizedBox(height: 120),
                        ],
                      ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWelcomeBanner(AuthProvider auth) {
    final balance = _walletBalance;
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        gradient: AppColors.primaryGradient,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.12),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Text(
                      'Wallet Balance',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.85),
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(width: 6),
                    GestureDetector(
                      onTap: () => setState(() => _hideBalance = !_hideBalance),
                      child: Icon(
                        _hideBalance
                            ? Icons.visibility_off_outlined
                            : Icons.visibility_outlined,
                        size: 16,
                        color: Colors.white.withValues(alpha: 0.85),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  _hideBalance ? '₦ ••••••' : '₦${balance.toStringAsFixed(2)}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.5,
                  ),
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: _openWithdrawal,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
              ),
              child: const Text(
                'Withdraw',
                style: TextStyle(
                  color: AppColors.primary,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 350.ms);
  }

  Widget _buildStatsGrid() {
    final stats = _referral?['statistics'] ?? {};
    final items = [
      {
        'icon': Icons.people_outline_rounded,
        'label': 'Total Referrals',
        'value': '${stats['total_referrals'] ?? 0}',
        'color': AppColors.primary,
        'bg': AppColors.primarySurface,
      },
      {
        'icon': Icons.check_circle_outline_rounded,
        'label': 'Completed',
        'value': '${stats['completed_referrals'] ?? 0}',
        'color': AppColors.success,
        'bg': AppColors.successLight,
      },
      {
        'icon': Icons.access_time_rounded,
        'label': 'Pending',
        'value': '₦${formatApiAmount(stats['pending_earnings'], decimals: 0)}',
        'color': AppColors.warning,
        'bg': AppColors.warningLight,
      },
      {
        'icon': Icons.trending_up_rounded,
        'label': 'This Month',
        'value': '₦${formatApiAmount(stats['monthly_earnings'], decimals: 0)}',
        'color': AppColors.accent,
        'bg': AppColors.accentLight,
      },
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 10,
          mainAxisSpacing: 10,
          childAspectRatio: 1.7,
        ),
        itemCount: items.length,
        itemBuilder: (_, i) {
          final item = items[i];
          return Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppPalette.of(context).card,
              borderRadius: BorderRadius.circular(18),
              boxShadow: [
                BoxShadow(
                  color: AppColors.textHint.withValues(alpha: 0.06),
                  blurRadius: 12,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: (item['color'] as Color).withValues(alpha: 0.16),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    item['icon'] as IconData,
                    color: item['color'] as Color,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        item['value'] as String,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: item['color'] as Color,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        item['label'] as String,
                        style: TextStyle(
                          fontSize: 11,
                          color: AppPalette.of(context).muted,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ).animate().fadeIn(delay: (i * 60).ms, duration: 300.ms);
        },
      ),
    );
  }

  Widget _buildReferralCard() {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppPalette.of(context).card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppPalette.of(context).border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Your Referral Code', style: AppTextStyles.tone(AppTextStyles.headlineSmall, context)),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: Theme.of(context).brightness == Brightness.dark
                  ? AppColors.primary.withValues(alpha: 0.16)
                  : AppColors.primarySurface,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
            ),
            child: Row(
              children: [
                const Icon(Icons.tag_rounded, size: 16, color: AppColors.primary),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _referralCode.isEmpty ? 'No code yet' : _referralCode,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
                GestureDetector(
                  onTap: _copyCode,
                  child: const Icon(Icons.copy_rounded,
                      size: 18, color: AppColors.primary),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Text('Your Referral Link', style: AppTextStyles.tone(AppTextStyles.headlineSmall, context)),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: AppPalette.of(context).surface,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppPalette.of(context).border),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.link_rounded,
                  size: 16,
                  color: AppPalette.of(context).muted,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _referralLink,
                    style: TextStyle(
                      fontSize: 12,
                      color: AppPalette.of(context).muted,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: _copyLink,
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      color: Theme.of(context).brightness == Brightness.dark
                          ? AppColors.primary.withValues(alpha: 0.16)
                          : AppColors.primarySurface,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.copy_rounded,
                          size: 16,
                          color: AppColors.primary,
                        ),
                        SizedBox(width: 8),
                        Text(
                          'Copy Link',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: GestureDetector(
                  onTap: _shareLink,
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      gradient: AppColors.primaryGradient,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.share_rounded,
                          size: 16,
                          color: Colors.white,
                        ),
                        SizedBox(width: 8),
                        Text(
                          'Share',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Earn commissions when friends register and make purchases!',
            style: TextStyle(
              fontSize: 11,
              color: AppPalette.of(context).muted,
              height: 1.4,
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 200.ms, duration: 350.ms);
  }

  Widget _buildTabBar() {
    final tabs = ['Overview', 'Referrals', 'Earnings', 'Transactions'];
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: AppPalette.of(context).surface,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          children:
              tabs.asMap().entries.map((e) {
                final active = _activeTab == e.key;
                return Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _activeTab = e.key),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 220),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: active ? AppPalette.of(context).card : Colors.transparent,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow:
                            active
                                ? [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.05),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ]
                                : null,
                      ),
                      child: Text(
                        e.value,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight:
                              active ? FontWeight.w700 : FontWeight.w500,
                          color: active
                              ? AppPalette.of(context).text
                              : AppPalette.of(context).muted,
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
        ),
      ),
    );
  }

  Widget _buildTabContent() {
    switch (_activeTab) {
      case 0:
        return _buildOverviewTab();
      case 1:
        return _buildReferralsTab();
      case 2:
        return _buildEarningsTab();
      case 3:
        return _buildTransactionsTab();
      default:
        return const SizedBox();
    }
  }

  Widget _buildOverviewTab() {
    final stats = _referral?['statistics'] ?? {};
    final rates = _referral?['commission_rates'] ?? {};
    final rateItems = [
      {'label': 'User Registration', 'value': '${rates['registration'] ?? 0}%'},
      {
        'label': 'Admin Registration',
        'value': '${rates['admin_registration'] ?? 0}%',
      },
      {'label': 'Subscription', 'value': '${rates['subscription'] ?? 10}%'},
      {'label': 'Vote Purchase', 'value': '${rates['vote_purchase'] ?? 5}%'},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildReferralCard(),
        Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Earnings Overview', style: AppTextStyles.tone(AppTextStyles.headlineSmall, context)),
          const SizedBox(height: 10),
          _buildEarningsChart(stats),
          const SizedBox(height: 16),
          Text('Commission Rates', style: AppTextStyles.tone(AppTextStyles.headlineSmall, context)),
          const SizedBox(height: 10),
          Container(
            decoration: BoxDecoration(
              color: AppPalette.of(context).card,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppPalette.of(context).border),
            ),
            child: Column(
              children:
                  rateItems.asMap().entries.map((e) {
                    return Column(
                      children: [
                        Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 12,
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                e.value['label']!,
                                style: TextStyle(
                                  fontSize: 13,
                                  color: AppPalette.of(context).muted,
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: AppColors.primarySurface,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  e.value['value']!,
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.primary,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (e.key < rateItems.length - 1)
                          Divider(height: 1, color: AppPalette.of(context).border),
                      ],
                    );
                  }).toList(),
            ),
          ).animate().fadeIn(delay: 100.ms, duration: 300.ms),
          const SizedBox(height: 16),
          Text('Recent Activity', style: AppTextStyles.tone(AppTextStyles.headlineSmall, context)),
          const SizedBox(height: 10),
          _buildRecentActivity(stats['recent_referrals'] as List? ?? []),
        ],
      ),
        ),
      ],
    );
  }

  Widget _buildRecentActivity(List items) {
    if (items.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: AppPalette.of(context).card,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppPalette.of(context).border),
        ),
        child: Center(
          child: Column(
            children: [
              Icon(Icons.inbox_outlined, size: 32, color: AppColors.textHint),
              SizedBox(height: 8),
              Text('No recent activity', style: AppTextStyles.tone(AppTextStyles.bodyMedium, context, muted: true)),
            ],
          ),
        ),
      );
    }
    return Container(
      decoration: BoxDecoration(
        color: AppPalette.of(context).card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppPalette.of(context).border),
      ),
      child: Column(
        children:
            items.take(5).toList().asMap().entries.map((e) {
              final item = e.value as Map;
              return Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: AppColors.successLight,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(
                            Icons.person_add_outlined,
                            color: AppColors.success,
                            size: 18,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item['description']?.toString() ??
                                    'Referral activity',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                  color: AppPalette.of(context).text,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              Text(
                                item['created_at']?.toString().substring(
                                      0,
                                      10,
                                    ) ??
                                    '',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: AppPalette.of(context).muted,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (e.key < items.length - 1)
                    Divider(height: 1, color: AppPalette.of(context).border),
                ],
              );
            }).toList(),
      ),
    );
  }

  Widget _buildEarningsChart(Map stats) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppPalette.of(context).card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppPalette.of(context).border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Monthly Earnings',
                style: AppTextStyles.tone(AppTextStyles.headlineSmall, context),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.successLight,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.trending_up_rounded,
                      size: 12,
                      color: AppColors.success,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '+${stats['monthly_growth'] ?? 12}%',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: AppColors.success,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 180,
            child: LineChart(
              LineChartData(
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: 1,
                  getDrawingHorizontalLine:
                      (value) => FlLine(
                        color: AppPalette.of(context).border.withValues(alpha: 0.3),
                        strokeWidth: 1,
                      ),
                ),
                titlesData: FlTitlesData(
                  show: true,
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, meta) {
                        const months = [
                          'Jan',
                          'Feb',
                          'Mar',
                          'Apr',
                          'May',
                          'Jun',
                        ];
                        if (value.toInt() >= 0 &&
                            value.toInt() < months.length) {
                          return Text(
                            months[value.toInt()],
                            style: TextStyle(
                              fontSize: 10,
                              color: AppPalette.of(context).muted,
                            ),
                          );
                        }
                        return const SizedBox();
                      },
                      interval: 1,
                    ),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, meta) {
                        if (value.toInt() % 5000 == 0 && value.toInt() > 0) {
                          return Text(
                            '₦${(value.toInt() / 1000).toInt()}k',
                            style: TextStyle(
                              fontSize: 10,
                              color: AppPalette.of(context).muted,
                            ),
                          );
                        }
                        return const SizedBox();
                      },
                      reservedSize: 40,
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: const [
                      FlSpot(0, 2000),
                      FlSpot(1, 4500),
                      FlSpot(2, 3800),
                      FlSpot(3, 7200),
                      FlSpot(4, 6500),
                      FlSpot(5, 9500),
                    ],
                    isCurved: true,
                    gradient: AppColors.primaryGradient,
                    barWidth: 3,
                    isStrokeCapRound: true,
                    dotData: FlDotData(
                      show: true,
                      getDotPainter:
                          (spot, percent, barData, index) => FlDotCirclePainter(
                            radius: 4,
                            color: AppColors.primary,
                            strokeWidth: 2,
                            strokeColor: AppColors.white,
                          ),
                    ),
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        colors: [
                          AppColors.primary.withValues(alpha: 0.2),
                          AppColors.primary.withValues(alpha: 0.0),
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 50.ms, duration: 300.ms);
  }

  Widget _buildTransactionsTab() {
    final transactions = _transactions ?? [];
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child:
          transactions.isEmpty
              ? Container(
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  color: AppPalette.of(context).card,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppPalette.of(context).border),
                ),
                child: Center(
                  child: Column(
                    children: [
                      Icon(
                        Icons.receipt_long_rounded,
                        size: 40,
                        color: AppColors.textHint,
                      ),
                      SizedBox(height: 12),
                      Text(
                        'No transactions yet',
                        style: AppTextStyles.tone(AppTextStyles.headlineSmall, context),
                      ),
                      SizedBox(height: 6),
                      Text(
                        'Your transaction history will appear here',
                        style: AppTextStyles.tone(AppTextStyles.bodyMedium, context, muted: true),
                      ),
                    ],
                  ),
                ),
              )
              : Column(
                children:
                    transactions.asMap().entries.map((e) {
                      final t = e.value as Map;
                      final isCredit = t['type'] == 'credit' || t['amount'] > 0;
                      return Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppPalette.of(context).card,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppPalette.of(context).border),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: t['_icon'] == 'ticket'
                                    ? AppColors.primarySurface
                                    : isCredit
                                        ? AppColors.successLight
                                        : AppColors.errorLight,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(
                                t['_icon'] == 'ticket'
                                    ? Icons.confirmation_number_outlined
                                    : isCredit
                                        ? Icons.arrow_downward_rounded
                                        : Icons.arrow_upward_rounded,
                                color: t['_icon'] == 'ticket'
                                    ? AppColors.primary
                                    : isCredit
                                        ? AppColors.success
                                        : AppColors.error,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    t['description']?.toString() ??
                                        'Transaction',
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: AppPalette.of(context).text,
                                    ),
                                  ),
                                  Text(
                                    t['created_at']?.toString().substring(
                                          0,
                                          10,
                                        ) ??
                                        '',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: AppPalette.of(context).muted,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  '${isCredit ? '+' : '-'}₦${formatApiAmount(t['amount'])}',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color:
                                        isCredit
                                            ? AppColors.success
                                            : AppColors.error,
                                  ),
                                ),
                                _TransactionStatus(
                                  status:
                                      t['status']?.toString() ?? 'completed',
                                ),
                              ],
                            ),
                          ],
                        ),
                      ).animate().fadeIn(
                        delay: (e.key * 50).ms,
                        duration: 300.ms,
                      );
                    }).toList(),
              ),
    );
  }

  Widget _buildReferralsTab() {
    final referrals =
        _referral?['statistics']?['recent_referrals'] as List? ?? [];
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child:
          referrals.isEmpty
              ? Container(
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  color: AppPalette.of(context).card,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppPalette.of(context).border),
                ),
                child: Center(
                  child: Column(
                    children: [
                      Icon(
                        Icons.card_giftcard_rounded,
                        size: 40,
                        color: AppColors.textHint,
                      ),
                      SizedBox(height: 12),
                      Text(
                        'No referrals yet',
                        style: AppTextStyles.tone(AppTextStyles.headlineSmall, context),
                      ),
                      SizedBox(height: 6),
                      Text(
                        'Share your link to start earning!',
                        style: AppTextStyles.tone(AppTextStyles.bodyMedium, context, muted: true),
                      ),
                    ],
                  ),
                ),
              )
              : Column(
                children:
                    referrals.asMap().entries.map((e) {
                      final r = e.value as Map;
                      return Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppPalette.of(context).card,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppPalette.of(context).border),
                        ),
                        child: Row(
                          children: [
                            CircleAvatar(
                              radius: 20,
                              backgroundColor: AppColors.primarySurface,
                              child: Text(
                                (r['referred_user_name']?.toString() ?? 'U')
                                    .substring(0, 1)
                                    .toUpperCase(),
                                style: const TextStyle(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    r['referred_user_name']?.toString() ??
                                        'User',
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: AppPalette.of(context).text,
                                    ),
                                  ),
                                  Text(
                                    r['commission_type']?.toString() ?? '',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: AppPalette.of(context).muted,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  '₦${r['commission_amount']?.toString() ?? '0'}',
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.success,
                                  ),
                                ),
                                _StatusPill(
                                  status: r['status']?.toString() ?? 'pending',
                                ),
                              ],
                            ),
                          ],
                        ),
                      ).animate().fadeIn(
                        delay: (e.key * 50).ms,
                        duration: 300.ms,
                      );
                    }).toList(),
              ),
    );
  }

  Widget _buildEarningsTab() {
    final canWithdraw = _referral?['can_withdraw']?['can_withdraw'] == true;
    final balance = _walletBalance;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: AppColors.primaryGradient,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Available Balance',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.8),
                          fontSize: 12,
                        ),
                      ),
                      Text(
                        '₦${balance.toStringAsFixed(2)}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 28,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                ),
                GestureDetector(
                  onTap: canWithdraw ? _showWithdrawDialog : null,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color:
                          canWithdraw
                              ? Colors.white
                              : Colors.white.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      'Withdraw',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: canWithdraw ? AppColors.primary : Colors.white,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ).animate().fadeIn(duration: 300.ms),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppPalette.of(context).card,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppPalette.of(context).border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Earnings Breakdown',
                  style: AppTextStyles.tone(AppTextStyles.headlineSmall, context),
                ),
                const SizedBox(height: 12),
                _EarningRow(
                  label: 'Total Earnings',
                  value:
                      '₦${(_referral?['statistics']?['total_earnings'] ?? 0).toString()}',
                  color: AppColors.success,
                ),
                Divider(height: 20, color: AppPalette.of(context).border),
                _EarningRow(
                  label: 'Registration Referrals',
                  value:
                      '${_referral?['statistics']?['registration_referrals'] ?? 0}',
                  color: AppColors.primary,
                ),
                Divider(height: 20, color: AppPalette.of(context).border),
                _EarningRow(
                  label: 'Subscription Referrals',
                  value:
                      '${_referral?['statistics']?['subscription_referrals'] ?? 0}',
                  color: AppColors.accent,
                ),
                Divider(height: 20, color: AppPalette.of(context).border),
                _EarningRow(
                  label: 'Vote Referrals',
                  value: '${_referral?['statistics']?['vote_referrals'] ?? 0}',
                  color: AppColors.warning,
                ),
              ],
            ),
          ).animate().fadeIn(delay: 100.ms, duration: 300.ms),
          const SizedBox(height: 16),
          _buildWithdrawalInfo(),
        ],
      ),
    );
  }

  Widget _buildWithdrawalInfo() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppPalette.of(context).card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppPalette.of(context).border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppColors.infoLight,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.info_outline_rounded,
                  color: AppColors.info,
                  size: 18,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Withdrawal Information',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppPalette.of(context).text,
                      ),
                    ),
                    Text(
                      'Minimum withdrawal: ₦1,000',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppPalette.of(context).muted,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Divider(color: AppPalette.of(context).border),
          const SizedBox(height: 12),
          _infoRow(label: 'Processing Time', value: '1-3 business days'),
          _infoRow(label: 'Withdrawal Method', value: 'Bank Transfer'),
          _infoRow(label: 'Fee', value: 'Free'),
        ],
      ),
    ).animate().fadeIn(delay: 150.ms, duration: 300.ms);
  }

  Widget _infoRow({required String label, required String value}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 13,
              color: AppPalette.of(context).muted,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppPalette.of(context).text,
            ),
          ),
        ],
      ),
    );
  }

  double get _walletBalance {
    final fromUserInfo = parseApiDouble(_profile?['user_info']?['balance']);
    if (fromUserInfo != null) return fromUserInfo;
    return parseApiDoubleOrZero(_profile?['balance']);
  }

  void _showWithdrawDialog() {
    final balance = _walletBalance;
    final amountCtrl = TextEditingController();
    final accountCtrl = TextEditingController();
    final bankCtrl = TextEditingController();

    showDialog(
      context: context,
      builder:
          (_) => AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
            title: const Text(
              'Request Withdrawal',
              style: TextStyle(fontWeight: FontWeight.w700),
            ),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Available: ₦${balance.toStringAsFixed(2)}',
                    style: TextStyle(
                      fontSize: 13,
                      color: AppPalette.of(context).muted,
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: amountCtrl,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: 'Amount',
                      prefixText: '₦',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: bankCtrl,
                    decoration: InputDecoration(
                      labelText: 'Bank Name',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: accountCtrl,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: 'Account Number',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Minimum withdrawal: ₦1,000',
                    style: TextStyle(
                      fontSize: 11,
                      color: AppPalette.of(context).muted,
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: Text(
                  'Cancel',
                  style: TextStyle(color: AppPalette.of(context).muted),
                ),
              ),
              ElevatedButton(
                onPressed: () async {
                  final amount = double.tryParse(amountCtrl.text) ?? 0;
                  if (amount < 1000) {
                    showTopAlert(context, 
                      const SnackBar(
                        content: Text('Minimum withdrawal is ₦1,000'),
                        backgroundColor: AppColors.error,
                      ),
                    );
                    return;
                  }
                  if (amount > balance) {
                    showTopAlert(context, 
                      const SnackBar(
                        content: Text('Insufficient balance'),
                        backgroundColor: AppColors.error,
                      ),
                    );
                    return;
                  }
                  Navigator.pop(context);
                  // Show loading
                  showTopAlert(context, 
                    const SnackBar(
                      content: Row(
                        children: [
                          SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          ),
                          SizedBox(width: 12),
                          Text('Processing withdrawal...'),
                        ],
                      ),
                      backgroundColor: AppColors.primary,
                      duration: Duration(seconds: 2),
                    ),
                  );
                  // Simulate API call
                  await Future.delayed(const Duration(seconds: 2));
                  if (mounted) {
                    showTopAlert(context, 
                      const SnackBar(
                        content: Text(
                          'Withdrawal request submitted successfully!',
                        ),
                        backgroundColor: AppColors.success,
                      ),
                    );
                    _load();
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text('Submit'),
              ),
            ],
          ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  final String status;
  const _StatusPill({required this.status});

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    switch (status.toLowerCase()) {
      case 'completed':
        bg = AppColors.successLight;
        fg = AppColors.success;
        break;
      case 'pending':
        bg = AppColors.warningLight;
        fg = AppColors.warning;
        break;
      default:
        bg = AppPalette.of(context).border;
        fg = AppPalette.of(context).muted;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        status,
        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: fg),
      ),
    );
  }
}

class _EarningRow extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _EarningRow({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(fontSize: 13, color: AppPalette.of(context).muted),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: color,
          ),
        ),
      ],
    );
  }
}

class _TransactionStatus extends StatelessWidget {
  final String status;
  const _TransactionStatus({required this.status});

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        bg = AppColors.successLight;
        fg = AppColors.success;
        break;
      case 'pending':
        bg = AppColors.warningLight;
        fg = AppColors.warning;
        break;
      case 'failed':
        bg = AppColors.errorLight;
        fg = AppColors.error;
        break;
      default:
        bg = AppPalette.of(context).border;
        fg = AppPalette.of(context).muted;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        status[0].toUpperCase() + status.substring(1),
        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: fg),
      ),
    );
  }
}
