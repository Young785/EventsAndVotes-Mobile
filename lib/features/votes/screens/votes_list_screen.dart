import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/services/votes_service.dart';
import '../../../core/utils/list_response_utils.dart';
import '../models/vote_model.dart';
import '../../../shared/widgets/shimmer_card.dart';
import '../../../shared/widgets/app_search_field.dart';
import '../../../shared/widgets/status_badge.dart';
import '../../../shared/widgets/layout_view_toggle.dart';
import '../../../core/theme/app_spacing.dart';

class VotesListScreen extends StatefulWidget {
  const VotesListScreen({super.key});
  @override
  State<VotesListScreen> createState() => _VotesListScreenState();
}

class _VotesListScreenState extends State<VotesListScreen> {
  List<VoteModel> _votes = [];
  bool _loading = true;
  String _status = '';
  String _search = '';
  int _page = 1;
  int _lastPage = 1;
  final _searchCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  final VotesService _votesService = VotesService();
  bool _gridView = false;

  final _tabs = ['All', 'Active', 'Completed', 'Upcoming'];

  @override
  void initState() {
    super.initState();
    _load();
    _scrollCtrl.addListener(() {
      if (_scrollCtrl.position.pixels >=
          _scrollCtrl.position.maxScrollExtent - 200) {
        if (_page < _lastPage && !_loading) _loadMore();
      }
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  Future<void> _load({bool reset = true}) async {
    if (reset)
      setState(() {
        _loading = true;
        _page = 1;
      });

    try {
      final response = await _votesService.getVotes(
        status: _status.isEmpty ? null : _status,
        page: _page,
        search: _search.isEmpty ? null : _search,
      );

      if (mounted) {
        final items = parseListItems(response['data'] as List?);
        final votes = <VoteModel>[];
        for (final item in items) {
          try {
            votes.add(VoteModel.fromJson(item));
          } catch (_) {}
        }
        final meta = response['meta'] as Map<String, dynamic>? ?? {};

        setState(() {
          _votes = reset ? votes : [..._votes, ...votes];
          _lastPage = meta['last_page'] ?? 1;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          if (reset) _votes = [];
          _loading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to load votes')),
        );
      }
    }
  }

  Future<void> _loadMore() async {
    _page++;
    await _load(reset: false);
  }

  void _setStatus(String s) {
    final map = {
      'All': '',
      'Active': 'STARTED',
      'Completed': 'COMPLETED',
      'Upcoming': 'INACTIVE',
    };
    setState(() => _status = map[s] ?? '');
    _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: () => _load(),
        child: CustomScrollView(
          controller: _scrollCtrl,
          physics: const AlwaysScrollableScrollPhysics(
            parent: BouncingScrollPhysics(),
          ),
          slivers: [
            SliverToBoxAdapter(child: _buildFilters()),
            if (_loading)
              const SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: ShimmerList(count: 5, itemHeight: 110),
                ),
              )
            else if (_votes.isEmpty)
              SliverFillRemaining(hasScrollBody: false, child: _emptyState())
            else
              _gridView
                  ? SliverPadding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                      sliver: SliverGrid(
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                          childAspectRatio: 0.72,
                        ),
                        delegate: SliverChildBuilderDelegate(
                          (context, i) {
                            if (i >= _votes.length) {
                              return const Center(
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: AppColors.primary,
                                ),
                              );
                            }
                            return _VoteGridCard(vote: _votes[i]);
                          },
                          childCount:
                              _votes.length + (_page < _lastPage ? 1 : 0),
                        ),
                      ),
                    )
                  : SliverPadding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                      sliver: SliverList.separated(
                        itemCount: _votes.length + (_page < _lastPage ? 1 : 0),
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (_, i) {
                          if (i == _votes.length) {
                            return const Padding(
                              padding: EdgeInsets.all(16),
                              child: Center(
                                child: CircularProgressIndicator(
                                  color: AppColors.primary,
                                  strokeWidth: 2,
                                ),
                              ),
                            );
                          }
                          return _VoteListCard(vote: _votes[i])
                              .animate()
                              .fadeIn(delay: (i * 40).ms, duration: 300.ms)
                              .slideY(begin: 0.04, end: 0);
                        },
                      ),
                    ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilters() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      child: Column(
        children: [
          AppSearchField(
            controller: _searchCtrl,
            hint: 'Search elections...',
            onSubmitted: (v) {
              _search = v;
              _load();
            },
            onClear: _search.isNotEmpty
                ? () {
                    _searchCtrl.clear();
                    setState(() => _search = '');
                    _load();
                  }
                : null,
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: SizedBox(
                  height: 38,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: _tabs.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 8),
                    itemBuilder: (_, i) => _FilterChip(
                      label: _tabs[i],
                      active: (_status == '' && _tabs[i] == 'All') ||
                          (_status == 'STARTED' && _tabs[i] == 'Active') ||
                          (_status == 'COMPLETED' && _tabs[i] == 'Completed') ||
                          (_status == 'INACTIVE' && _tabs[i] == 'Upcoming'),
                      onTap: () => _setStatus(_tabs[i]),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              LayoutViewToggle(
                isGrid: _gridView,
                onChanged: (v) => setState(() => _gridView = v),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _emptyState() {
    return Center(
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
              Icons.how_to_vote_outlined,
              color: AppColors.primary,
              size: 36,
            ),
          ),
          const SizedBox(height: 16),
          const Text('No elections found', style: AppTextStyles.headlineSmall),
          const SizedBox(height: 6),
          const Text(
            'Try adjusting your filters',
            style: AppTextStyles.bodyMedium,
          ),
        ],
      ),
    );
  }
}

class _VoteListCard extends StatelessWidget {
  final VoteModel vote;
  const _VoteListCard({required this.vote});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/votes/${vote.slug}/${vote.voteId}'),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        clipBehavior: Clip.antiAlias,
        child: Row(
          children: [
            SizedBox(
              width: 100,
              height: 110,
              child: CachedNetworkImage(
                imageUrl: vote.image ?? AppConstants.votePlaceholder,
                fit: BoxFit.cover,
                errorWidget:
                    (_, __, ___) => Container(
                      color: AppColors.primarySurface,
                      child: const Icon(
                        Icons.how_to_vote_rounded,
                        color: AppColors.primary,
                        size: 32,
                      ),
                    ),
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        StatusBadge(status: vote.status),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color:
                                vote.isFree
                                    ? AppColors.successLight
                                    : AppColors.primarySurface,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            vote.isFree
                                ? 'Free'
                                : '₦${vote.pricePerVote.toStringAsFixed(0)}',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color:
                                  vote.isFree
                                      ? AppColors.success
                                      : AppColors.primary,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      vote.title,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _InfoChip(
                          icon: Icons.people_outline_rounded,
                          label: '${vote.totalVotes} votes',
                        ),
                        const SizedBox(width: 8),
                        _InfoChip(
                          icon: Icons.list_alt_rounded,
                          label: '${vote.positionsCount} positions',
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(
                          Icons.calendar_today_outlined,
                          size: 11,
                          color: AppColors.textHint,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          vote.endDate.length >= 10
                              ? vote.endDate.substring(0, 10)
                              : vote.endDate,
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.textHint,
                          ),
                        ),
                      ],
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
}

class _VoteGridCard extends StatelessWidget {
  final VoteModel vote;
  const _VoteGridCard({required this.vote});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/votes/${vote.slug}/${vote.voteId}'),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              flex: 3,
              child: CachedNetworkImage(
                imageUrl: vote.image ?? AppConstants.votePlaceholder,
                fit: BoxFit.cover,
                width: double.infinity,
                errorWidget: (_, __, ___) => Container(
                  color: AppColors.primarySurface,
                  child: const Icon(
                    Icons.how_to_vote_rounded,
                    color: AppColors.primary,
                    size: 28,
                  ),
                ),
              ),
            ),
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    StatusBadge(status: vote.status),
                    const SizedBox(height: 6),
                    Text(
                      vote.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const Spacer(),
                    Text(
                      '${vote.totalVotes} votes',
                      style: const TextStyle(
                        fontSize: 10,
                        color: AppColors.textSecondary,
                      ),
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
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: active ? AppColors.primary : AppColors.white,
          borderRadius: BorderRadius.circular(AppSpacing.chipRadius),
          border: Border.all(color: active ? AppColors.primary : AppColors.border),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: active ? Colors.white : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _InfoChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 11, color: AppColors.textSecondary),
        const SizedBox(width: 3),
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
        ),
      ],
    );
  }
}
