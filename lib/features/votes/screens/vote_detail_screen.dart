import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/services/votes_service.dart';
import '../models/vote_model.dart';
import '../../../shared/widgets/shimmer_card.dart';
import '../../../shared/widgets/detail_back_button.dart';
import '../../../shared/widgets/status_badge.dart';

class VoteDetailScreen extends StatefulWidget {
  final String slug;
  final String voteId;
  const VoteDetailScreen({
    super.key,
    required this.slug,
    required this.voteId,
  });

  @override
  State<VoteDetailScreen> createState() => _VoteDetailScreenState();
}

class _VoteDetailScreenState extends State<VoteDetailScreen> {
  VoteModel? _vote;
  List<dynamic> _positions = [];
  bool _loading = true;
  final VotesService _votesService = VotesService();


  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await _votesService.getVoteDetails(widget.slug, widget.voteId);
      if (!mounted) return;
      final voteJson = data['vote'] ?? data;
      setState(() {
        _vote = VoteModel.fromJson(Map<String, dynamic>.from(voteJson as Map));
        _positions = data['positions'] ?? data['categories'] ?? [];
        _loading = false;
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          _vote = null;
          _positions = [];
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body:
          _loading
              ? _buildSkeleton()
              : _vote == null
              ? _buildError()
              : _buildContent(),
    );
  }

  Widget _buildSkeleton() {
    return Stack(
      children: [
        CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Stack(
                children: [
                  const ShimmerCard(height: 220, radius: 0),
                  const Positioned(top: 0, left: 0, child: DetailBackButton()),
                ],
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: ShimmerList(count: 4, itemHeight: 80),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildError() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.error_outline_rounded,
            size: 48,
            color: AppColors.textHint,
          ),
          const SizedBox(height: 12),
          const Text(
            'Failed to load election',
            style: AppTextStyles.bodyMedium,
          ),
          const SizedBox(height: 16),
          TextButton(onPressed: _load, child: const Text('Retry')),
        ],
      ),
    );
  }

  Widget _buildContent() {
    final vote = _vote!;
    return Stack(
      children: [
        CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: Stack(
                children: [
                  CachedNetworkImage(
                    imageUrl: vote.image ?? AppConstants.votePlaceholder,
                    fit: BoxFit.cover,
                    height: 220,
                    errorWidget:
                        (_, __, ___) => Container(
                          height: 220,
                          decoration: const BoxDecoration(
                            gradient: AppColors.heroGradient,
                          ),
                        ),
                  ),
                  Container(
                    height: 220,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Colors.transparent,
                          Colors.black.withValues(alpha: 0.7),
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                  const Positioned(top: 0, left: 0, child: DetailBackButton()),
                  Positioned(
                    bottom: 16,
                    left: 16,
                    right: 16,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        StatusBadge(status: vote.status),
                        const SizedBox(height: 6),
                        Text(
                          vote.title,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            shadows: [
                              Shadow(blurRadius: 8, color: Colors.black54),
                            ],
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Stats row
                    Row(
                      children: [
                        _StatCard(
                          icon: Icons.how_to_vote_rounded,
                          value: '${vote.totalVotes}',
                          label: 'Total Votes',
                          color: AppColors.primary,
                        ),
                        const SizedBox(width: 10),
                        _StatCard(
                          icon: Icons.list_alt_rounded,
                          value: '${vote.positionsCount}',
                          label: 'Positions',
                          color: AppColors.accent,
                        ),
                        const SizedBox(width: 10),
                        _StatCard(
                          icon: Icons.people_outline_rounded,
                          value: '${vote.nomineesCount}',
                          label: 'Nominees',
                          color: AppColors.success,
                        ),
                      ],
                    ).animate().fadeIn(duration: 300.ms),
                    const SizedBox(height: 20),

                    // Payment info
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color:
                            vote.isFree
                                ? AppColors.successLight
                                : AppColors.primarySurface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color:
                              vote.isFree
                                  ? AppColors.success.withValues(alpha: 0.3)
                                  : AppColors.primary.withValues(alpha: 0.2),
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            vote.isFree
                                ? Icons.check_circle_outline_rounded
                                : Icons.monetization_on_outlined,
                            color:
                                vote.isFree
                                    ? AppColors.success
                                    : AppColors.primary,
                            size: 20,
                          ),
                          const SizedBox(width: 10),
                          Text(
                            vote.isFree
                                ? 'This election is FREE to vote'
                                : '₦${vote.pricePerVote.toStringAsFixed(0)} per vote',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color:
                                  vote.isFree
                                      ? AppColors.success
                                      : AppColors.primary,
                            ),
                          ),
                        ],
                      ),
                    ).animate().fadeIn(delay: 80.ms, duration: 300.ms),
                    const SizedBox(height: 20),

                    // Dates
                    const Text(
                      'Election Period',
                      style: AppTextStyles.headlineSmall,
                    ).animate().fadeIn(delay: 120.ms),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: _DateCard(
                            label: 'Start Date',
                            date:
                                vote.startDate.length >= 10
                                    ? vote.startDate.substring(0, 10)
                                    : vote.startDate,
                            icon: Icons.play_circle_outline_rounded,
                            color: AppColors.success,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _DateCard(
                            label: 'End Date',
                            date:
                                vote.endDate.length >= 10
                                    ? vote.endDate.substring(0, 10)
                                    : vote.endDate,
                            icon: Icons.stop_circle_outlined,
                            color: AppColors.error,
                          ),
                        ),
                      ],
                    ).animate().fadeIn(delay: 140.ms, duration: 300.ms),
                    const SizedBox(height: 20),

                    // Description
                    const Text(
                      'About this Election',
                      style: AppTextStyles.headlineSmall,
                    ).animate().fadeIn(delay: 160.ms),
                    const SizedBox(height: 8),
                    Text(
                      vote.description,
                      style: const TextStyle(
                        fontSize: 14,
                        color: AppColors.textSecondary,
                        height: 1.6,
                      ),
                    ).animate().fadeIn(delay: 180.ms, duration: 300.ms),
                    const SizedBox(height: 20),

                    // Positions
                    if (_positions.isNotEmpty) ...[
                      const Text(
                        'Positions',
                        style: AppTextStyles.headlineSmall,
                      ).animate().fadeIn(delay: 200.ms),
                      const SizedBox(height: 10),
                      ..._positions.asMap().entries.map(
                        (e) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: _PositionCard(position: e.value, vote: _vote!)
                              .animate()
                              .fadeIn(
                                delay: (220 + e.key * 40).ms,
                                duration: 300.ms,
                              )
                              .slideY(begin: 0.04, end: 0),
                        ),
                      ),
                    ],
                    const SizedBox(height: 80),
                  ],
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  final Color color;
  const _StatCard({
    required this.icon,
    required this.value,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(height: 6),
            Text(
              value,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: color,
              ),
            ),
            Text(
              label,
              style: const TextStyle(
                fontSize: 10,
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _DateCard extends StatelessWidget {
  final String label;
  final String date;
  final IconData icon;
  final Color color;
  const _DateCard({
    required this.label,
    required this.date,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 18),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 10,
                  color: AppColors.textSecondary,
                ),
              ),
              Text(
                date,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _PositionCard extends StatelessWidget {
  final dynamic position;
  final VoteModel vote;
  const _PositionCard({required this.position, required this.vote});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppColors.primarySurface,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              Icons.list_alt_rounded,
              color: AppColors.primary,
              size: 18,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  position['title'] ?? 'Position',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                if (position['nominees_count'] != null)
                  Text(
                    '${position['nominees_count']} nominees',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
              ],
            ),
          ),
          GestureDetector(
            onTap: () => _showVotingDialog(context, position),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.primarySurface,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text(
                'Vote',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showVotingDialog(BuildContext context, dynamic position) {
    final quantityCtrl = TextEditingController(text: '1');
    final nominees = position['nominees'] as List? ?? [];
    String? selectedNominee;

    showDialog(
      context: context,
      builder:
          (_) => AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
            title: Text(
              'Vote for ${position['title']}',
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
            content: StatefulBuilder(
              builder: (context, setDialogState) {
                final quantity = int.tryParse(quantityCtrl.text) ?? 1;
                final total = vote.isFree ? 0 : vote.pricePerVote * quantity;

                return Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Select a nominee',
                      style: TextStyle(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (nominees.isEmpty)
                      const Text(
                        'No nominees available',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.textHint,
                        ),
                      )
                    else
                      ...nominees.map(
                        (n) => RadioListTile<String>(
                          title: Text(
                            n['name'] ?? 'Nominee',
                            style: const TextStyle(fontSize: 14),
                          ),
                          value: n['id']?.toString() ?? '',
                          groupValue: selectedNominee,
                          onChanged:
                              (v) => setDialogState(() => selectedNominee = v),
                          activeColor: AppColors.primary,
                          contentPadding: EdgeInsets.zero,
                        ),
                      ),
                    const SizedBox(height: 16),
                    if (!vote.isFree) ...[
                      Row(
                        children: [
                          const Text(
                            'Number of votes',
                            style: TextStyle(
                              fontSize: 13,
                              color: AppColors.textSecondary,
                            ),
                          ),
                          const Spacer(),
                          Container(
                            decoration: BoxDecoration(
                              color: AppColors.surfaceVariant,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.remove, size: 18),
                                  onPressed:
                                      quantity > 1
                                          ? () {
                                            quantityCtrl.text =
                                                (quantity - 1).toString();
                                            setDialogState(() {});
                                          }
                                          : null,
                                  padding: const EdgeInsets.all(4),
                                ),
                                SizedBox(
                                  width: 40,
                                  child: TextField(
                                    controller: quantityCtrl,
                                    textAlign: TextAlign.center,
                                    keyboardType: TextInputType.number,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                    ),
                                    decoration: const InputDecoration(
                                      border: InputBorder.none,
                                      contentPadding: EdgeInsets.zero,
                                    ),
                                    onChanged: (v) => setDialogState(() {}),
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.add, size: 18),
                                  onPressed: () {
                                    quantityCtrl.text =
                                        (quantity + 1).toString();
                                    setDialogState(() {});
                                  },
                                  padding: const EdgeInsets.all(4),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                    ],
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.primarySurface,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Total',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          Text(
                            vote.isFree
                                ? 'FREE'
                                : '₦${total.toStringAsFixed(0)}',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: AppColors.primary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                );
              },
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text(
                  'Cancel',
                  style: TextStyle(color: AppColors.textSecondary),
                ),
              ),
              ElevatedButton(
                onPressed:
                    selectedNominee == null
                        ? null
                        : () async {
                          Navigator.pop(context);
                          final quantity = int.tryParse(quantityCtrl.text) ?? 1;

                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Row(
                                children: [
                                  const SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Text('Submitting vote...'),
                                ],
                              ),
                              backgroundColor: AppColors.primary,
                              duration: const Duration(seconds: 2),
                            ),
                          );

                          await Future.delayed(const Duration(seconds: 2));

                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  'Successfully cast $quantity vote(s)!',
                                ),
                                backgroundColor: AppColors.success,
                              ),
                            );
                          }
                        },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text('Submit Vote'),
              ),
            ],
          ),
    );
  }
}

