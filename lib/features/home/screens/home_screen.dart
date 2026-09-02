import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/constants/app_constants.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../features/votes/models/vote_model.dart';
import '../../../features/events/models/event_model.dart';
import '../../../core/services/votes_service.dart';
import '../../../core/services/events_service.dart';
import '../../../core/utils/list_response_utils.dart';
import '../../../shared/widgets/shimmer_card.dart';
import '../../../shared/widgets/section_header.dart';
import '../../../shared/widgets/status_badge.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<VoteModel> _votes = [];
  List<EventModel> _events = [];
  bool _loading = true;
  int _carouselIndex = 0;
  Timer? _slideTimer;
  List<_HeroSlide> _heroSlides = [];
  Map<String, dynamic> _platformStats = {};

  @override
  void initState() {
    super.initState();
    _loadData();
    _slideTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (mounted && _heroSlides.length > 1) {
        setState(
          () => _carouselIndex = (_carouselIndex + 1) % _heroSlides.length,
        );
      }
    });
  }

  @override
  void dispose() {
    _slideTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    final votesService = VotesService();
    final eventsService = EventsService();
    var votes = <VoteModel>[];
    var events = <EventModel>[];
    var votesFailed = false;
    var eventsFailed = false;
    Map<String, dynamic> votesMeta = {};
    Map<String, dynamic> eventsMeta = {};

    try {
      final response = await votesService.getVotes(page: 1);
      votesMeta = Map<String, dynamic>.from(response['meta'] as Map? ?? {});
      for (final item in parseListItems(response['data'] as List?)) {
        try {
          votes.add(VoteModel.fromJson(item));
        } catch (_) {}
      }
    } catch (_) {
      votesFailed = true;
    }

    try {
      final response = await eventsService.getEvents(page: 1);
      eventsMeta = Map<String, dynamic>.from(response['meta'] as Map? ?? {});
      for (final item in parseListItems(response['data'] as List?)) {
        try {
          events.add(EventModel.fromJson(item));
        } catch (_) {}
      }
    } catch (_) {
      eventsFailed = true;
    }

    if (!mounted) return;

    final settings = context.read<AuthProvider>().settings;
    final heroSlides = _buildHeroSlides(
      votes: votes,
      events: events,
      settings: settings,
    );

    setState(() {
      _votes = votes.take(6).toList();
      _events = events.take(6).toList();
      _heroSlides = heroSlides;
      _carouselIndex = 0;
      _platformStats = {
        'votes': _metaTotal(votesMeta, votes.length),
        'events': _metaTotal(eventsMeta, events.length),
        'total_votes_cast': _sumVoteCounts(votes),
      };
      _loading = false;
    });

    if (votesFailed && eventsFailed && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to load home data')),
      );
    }
  }

  int _metaTotal(Map<String, dynamic> meta, int fallback) {
    for (final key in ['total', 'total_count', 'count']) {
      final v = meta[key];
      if (v is int) return v;
      final n = int.tryParse(v?.toString() ?? '');
      if (n != null) return n;
    }
    return fallback;
  }

  int _sumVoteCounts(List<VoteModel> votes) {
    return votes.fold<int>(0, (sum, v) => sum + v.totalVotes);
  }

  List<_HeroSlide> _buildHeroSlides({
    required List<VoteModel> votes,
    required List<EventModel> events,
    required Map<String, dynamic> settings,
  }) {
    final slides = <_HeroSlide>[];

    for (final vote in votes.take(2)) {
      slides.add(
        _HeroSlide(
          imageUrl: vote.image ?? AppConstants.votePlaceholder,
          tag: 'Featured vote',
          heading: vote.title,
          route: '/votes',
        ),
      );
    }
    for (final event in events.take(2)) {
      slides.add(
        _HeroSlide(
          imageUrl: event.posterImage ?? AppConstants.eventPlaceholder,
          tag: 'Upcoming event',
          heading: event.title,
          route: '/events',
        ),
      );
    }

    if (slides.isEmpty) {
      final banner = settings['site_banner']?.toString();
      final siteName =
          settings['site_name']?.toString() ?? AppConstants.appName;
      slides.add(
        _HeroSlide(
          imageUrl: banner != null && banner.isNotEmpty
              ? AppConstants.storageUrl(banner)
              : AppConstants.heroImage,
          tag: 'Welcome',
          heading: siteName,
          route: '/votes',
        ),
      );
    }

    return slides;
  }

  String _formatStatCount(int count) {
    if (count >= 1000) {
      final k = count / 1000;
      return k >= 10 ? '${k.round()}K+' : '${k.toStringAsFixed(1)}K+';
    }
    return count > 0 ? '$count+' : '0';
  }


  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: _loadData,
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildHero(auth),
                  _buildStats(),
                  const SectionHeader(
                    title: 'Featured Votes',
                    actionRoute: '/votes',
                  ),
                  _buildVotesSection(),
                  _buildEarnBanner(),
                  const SectionHeader(
                    title: 'Upcoming Events',
                    actionRoute: '/events',
                  ),
                  _buildEventsSection(),
                  // _buildHowItWorks(),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHero(AuthProvider auth) {
    if (_loading || _heroSlides.isEmpty) {
      return Container(
        margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
        height: 138,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          color: AppColors.primarySurface,
        ),
        child: const Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
      );
    }

    final slide = _heroSlides[_carouselIndex];
    final siteName =
        auth.settings['site_name']?.toString() ?? AppConstants.appName;
    final firstName = auth.user?.firstName ?? 'there';

    return Column(
      children: [
        Container(
          margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          height: 138,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            color: Colors.black,
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.18),
                blurRadius: 24,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: Stack(
            fit: StackFit.expand,
            children: [
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 800),
                transitionBuilder: (child, animation) =>
                    FadeTransition(opacity: animation, child: child),
                child: CachedNetworkImage(
                  key: ValueKey(slide.imageUrl),
                  imageUrl: slide.imageUrl,
                  fit: BoxFit.cover,
                  width: double.infinity,
                  height: double.infinity,
                  errorWidget: (_, __, ___) => Image.network(
                    AppConstants.heroImage,
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Colors.black.withValues(alpha: 0.1),
                      Colors.black.withValues(alpha: 0.78),
                    ],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Hello, $firstName 👋',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.88),
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const Spacer(),
                    AnimatedSwitcher(
                      duration: const Duration(milliseconds: 400),
                      child: Column(
                        key: ValueKey(_carouselIndex),
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.18),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: Colors.white.withValues(alpha: 0.35),
                              ),
                            ),
                            child: Text(
                              slide.tag,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            slide.heading,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              height: 1.15,
                              letterSpacing: -0.5,
                            ),
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              _heroBtn(
                                'Explore',
                                () => context.go(slide.route),
                                filled: true,
                              ),
                              const SizedBox(width: 10),
                              _heroBtn(
                                siteName.length > 18
                                    ? 'Dashboard'
                                    : siteName,
                                () => context.go('/dashboard'),
                                filled: false,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        if (_heroSlides.length > 1) ...[
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(_heroSlides.length, (i) {
              final active = i == _carouselIndex;
              return AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                margin: const EdgeInsets.symmetric(horizontal: 3),
                width: active ? 20 : 6,
                height: 6,
                decoration: BoxDecoration(
                  color: active
                      ? AppColors.primary
                      : AppColors.primary.withValues(alpha: 0.25),
                  borderRadius: BorderRadius.circular(3),
                ),
              );
            }),
          ),
        ],
      ],
    ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.05, end: 0);
  }

  Widget _heroBtn(String label, VoidCallback onTap, {required bool filled}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 6),
        decoration: BoxDecoration(
          color: filled ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white, width: 1.5),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: filled ? AppColors.primary : Colors.white,
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  Widget _buildStats() {
    final voteCount = _platformStats['votes'] as int? ?? _votes.length;
    final eventCount = _platformStats['events'] as int? ?? _events.length;
    final castCount =
        _platformStats['total_votes_cast'] as int? ?? _sumVoteCounts(_votes);

    final stats = [
      {
        'value': _formatStatCount(voteCount),
        'label': 'Active Votes',
        'icon': HugeIcons.strokeRoundedCheckList,
      },
      {
        'value': _formatStatCount(eventCount),
        'label': 'Events',
        'icon': HugeIcons.strokeRoundedCalendar03,
      },
      {
        'value': _formatStatCount(castCount),
        'label': 'Votes Cast',
        'icon': HugeIcons.strokeRoundedBarChart,
      },
      {
        'value': _formatStatCount(voteCount + eventCount),
        'label': 'Opportunities',
        'icon': HugeIcons.strokeRoundedCompass,
      },
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
      child: Row(
        children: stats.asMap().entries.map((entry) {
          final i = entry.key;
          final s = entry.value;
          return Expanded(
            child: Container(
              margin: EdgeInsets.only(right: i < 3 ? 8 : 0),
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 6),
              decoration: BoxDecoration(
                color: AppColors.white,
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.06),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  HugeIcon(
                    icon: s['icon'] as List<List<dynamic>>,
                    color: AppColors.primary,
                    size: 22,
                  ),
                  const SizedBox(height: 5),
                  Text(
                    s['value'] as String,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    s['label'] as String,
                    style: const TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w500,
                      color: AppColors.textSecondary,
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    ).animate().fadeIn(delay: 100.ms, duration: 400.ms);
  }

  Widget _buildVotesSection() {
    if (_loading) {
      return SizedBox(
        height: 160,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          itemCount: 3,
          separatorBuilder: (_, __) => const SizedBox(width: 12),
          itemBuilder: (_, __) => const ShimmerCard(height: 160, width: 200),
        ),
      );
    }
    if (_votes.isEmpty) {
      return _emptyState('No votes available', HugeIcons.strokeRoundedCheckList);
    }
    return SizedBox(
      height: 180,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: _votes.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder:
            (_, i) => _VoteCard(vote: _votes[i])
                .animate()
                .fadeIn(delay: (i * 80).ms, duration: 350.ms)
                .slideX(begin: 0.1, end: 0),
      ),
    );
  }

  Widget _buildEventsSection() {
    if (_loading) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: const ShimmerList(count: 3, itemHeight: 90),
      );
    }
    if (_events.isEmpty) {
      return _emptyState('No events available', HugeIcons.strokeRoundedCalendar03);
    }
    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: _events.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder:
          (_, i) => _EventCard(event: _events[i])
              .animate()
              .fadeIn(delay: (i * 80).ms, duration: 350.ms)
              .slideY(begin: 0.05, end: 0),
    );
  }

  Widget _buildEarnBanner() {
    final settings = context.watch<AuthProvider>().settings;
    final commission = settings['commission_rates'] is Map
        ? Map<String, dynamic>.from(settings['commission_rates'] as Map)
        : <String, dynamic>{};
    final eventRate = commission['event_purchase']?.toString() ?? '10';

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 20, 16, 0),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: AppColors.primaryGradient,
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.22),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Earn with Referrals',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Earn up to $eventRate% commission on event purchases and referrals.',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.88),
                    fontSize: 12,
                    height: 1.45,
                  ),
                ),
                const SizedBox(height: 12),
                GestureDetector(
                  onTap: () => context.go('/dashboard'),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 7,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      'Start Earning →',
                      style: TextStyle(
                        color: AppColors.primary,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(16),
            ),
            child: HugeIcon(
              icon: HugeIcons.strokeRoundedCoins01,
              color: Colors.white,
              size: 32,
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 200.ms, duration: 400.ms);
  }

  // ── How It Works (commented out) ──────────────────────────────────────────
  // Widget _buildHowItWorks() {
  //   final steps = [
  //     {'icon': Icons.search_rounded, 'title': 'Discover', 'desc': 'Find events & votes near you'},
  //     {'icon': Icons.how_to_vote_rounded, 'title': 'Participate', 'desc': 'Cast votes & buy tickets'},
  //     {'icon': Icons.monetization_on_rounded, 'title': 'Earn', 'desc': 'Refer friends & earn cash'},
  //   ];
  //   return Column( ... );
  // }

  Widget _emptyState(String msg, List<List<dynamic>> icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Center(
        child: Column(
          children: [
            HugeIcon(icon: icon, size: 40, color: AppColors.textHint),
            const SizedBox(height: 8),
            Text(
              msg,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 13,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _VoteCard extends StatelessWidget {
  final VoteModel vote;
  const _VoteCard({required this.vote});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/votes/${vote.slug}/${vote.voteId}'),
      child: Container(
        width: 190,
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              height: 90,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  CachedNetworkImage(
                    imageUrl: vote.image ?? AppConstants.votePlaceholder,
                    fit: BoxFit.cover,
                    errorWidget:
                        (_, __, ___) => Container(
                          color: AppColors.primarySurface,
                          child: Center(
                            child: HugeIcon(
                              icon: HugeIcons.strokeRoundedCheckList,
                              color: AppColors.primary,
                              size: 32,
                            ),
                          ),
                        ),
                  ),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: StatusBadge(status: vote.status),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    vote.title,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      HugeIcon(
                        icon: HugeIcons.strokeRoundedUserGroup,
                        size: 12,
                        color: AppColors.textSecondary,
                      ),
                      const SizedBox(width: 3),
                      Text(
                        '${vote.totalVotes} votes',
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 7,
                          vertical: 2,
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
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color:
                                vote.isFree
                                    ? AppColors.success
                                    : AppColors.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EventCard extends StatelessWidget {
  final EventModel event;
  const _EventCard({required this.event});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/events/${event.id}'),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Row(
          children: [
            SizedBox(
              width: 96,
              height: 96,
              child: CachedNetworkImage(
                imageUrl: event.posterImage ?? AppConstants.eventPlaceholder,
                fit: BoxFit.cover,
                errorWidget:
                    (_, __, ___) => Container(
                      color: AppColors.primarySurface,
                      child: Center(
                        child: HugeIcon(
                          icon: HugeIcons.strokeRoundedCalendar03,
                          color: AppColors.primary,
                          size: 28,
                        ),
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
                    Text(
                      event.title,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        HugeIcon(
                          icon: HugeIcons.strokeRoundedLocation01,
                          size: 12,
                          color: AppColors.textSecondary,
                        ),
                        const SizedBox(width: 3),
                        Expanded(
                          child: Text(
                            event.venue,
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.textSecondary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        HugeIcon(
                          icon: HugeIcons.strokeRoundedCalendar03,
                          size: 12,
                          color: AppColors.textSecondary,
                        ),
                        const SizedBox(width: 3),
                        Text(
                          event.startDate.length >= 10
                              ? event.startDate.substring(0, 10)
                              : event.startDate,
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        const Spacer(),
                        StatusBadge(status: event.status),
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

class _HeroSlide {
  final String imageUrl;
  final String tag;
  final String heading;
  final String route;

  const _HeroSlide({
    required this.imageUrl,
    required this.tag,
    required this.heading,
    required this.route,
  });
}
