import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
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
import '../../../shared/widgets/app_loader.dart';
import '../../../shared/widgets/status_badge.dart';
import '../../../shared/widgets/app_alert.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<VoteModel> _votes = [];
  List<EventModel> _events = [];
  bool _loading = true;
  List<_HeroSlide> _heroSlides = [];
  bool _refreshing = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData({bool silent = false}) async {
    if (silent) {
      if (mounted) setState(() => _refreshing = true);
    } else {
      setState(() => _loading = true);
    }
    final votesService = VotesService();
    final eventsService = EventsService();
    var votes = <VoteModel>[];
    var events = <EventModel>[];
    var votesFailed = false;
    var eventsFailed = false;

    try {
      final response = await votesService.getVotes(page: 1);
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
      _events = events.where((event) => !event.hasEnded).take(6).toList();
      _heroSlides = heroSlides;
      _loading = false;
      _refreshing = false;
    });

    if (votesFailed && eventsFailed && mounted) {
      showTopAlert(context, 
        const SnackBar(content: Text('Failed to load home data')),
      );
    }
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

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      backgroundColor: AppPalette.of(context).background,
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: () => _loadData(silent: !_loading),
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_refreshing) _buildRefreshBanner(),
                  _buildFeaturedEvent(),
                  _buildShortcuts(auth),
                  _sectionTitle('Featured Votes', '/votes'),
                  _buildVotesSection(),
                  _sectionTitle('Upcoming Events', '/events'),
                  _buildEventsSection(),
                  const SizedBox(height: 120),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRefreshBanner() {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFF152038),
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Row(
        children: [
          Icon(Icons.sync_rounded, color: AppColors.primaryLight, size: 16),
          SizedBox(width: 8),
          Text(
            'Updating live feed...',
            style: TextStyle(
              color: AppColors.primaryLight,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _sectionTitle(String title, String route) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 22, 16, 12),
      child: Row(
        children: [
          Text(
            title,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppPalette.of(context).text,
            ),
          ),
          const Spacer(),
          GestureDetector(
            onTap: () => context.go(route),
            child: const Text(
              'See all',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.primaryLight,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeaturedEvent() {
    if (_loading) {
      return Container(
        margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
        height: 176,
        decoration: BoxDecoration(
          color: AppPalette.of(context).surface,
          borderRadius: BorderRadius.circular(22),
        ),
        child: const Center(child: AppLoader()),
      );
    }

    final event = _events.isNotEmpty ? _events.first : null;
    final image = event?.posterImage ??
        (_heroSlides.isNotEmpty
            ? _heroSlides.first.imageUrl
            : AppConstants.heroImage);
    final title = event?.title ??
        (_heroSlides.isNotEmpty ? _heroSlides.first.heading : 'Events & Votes');
    final venue = event?.venue ?? '';
    final price = event == null ? '' : 'Starting ${_naira(event.minPrice)}';

    return GestureDetector(
      onTap: () {
        if (event != null) {
          context.push('/events/${event.id}');
        } else {
          context.go('/events');
        }
      },
      child: Container(
        margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
        height: 176,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(22),
          color: AppPalette.of(context).surface,
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          fit: StackFit.expand,
          children: [
            CachedNetworkImage(
              imageUrl: image,
              fit: BoxFit.cover,
              errorWidget: (_, __, ___) => const DecoratedBox(
                decoration: BoxDecoration(gradient: AppColors.heroGradient),
              ),
            ),
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0x660B1020), Color(0xE60B1020)],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      'Featured Event',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const Spacer(),
                  Text(
                    title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      height: 1.15,
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    [venue, price].where((s) => s.isNotEmpty).join(' · '),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.82),
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildShortcuts(AuthProvider auth) {
    final items = <({IconData icon, String label, VoidCallback onTap})>[
      (icon: Icons.explore_outlined, label: 'Browse', onTap: () => context.go('/events')),
      (
        icon: Icons.check_box_outlined,
        label: 'Vote',
        onTap: () {
          if (_votes.isEmpty) {
            context.go('/votes');
            return;
          }
          final vote = _votes.first;
          context.push('/votes/${vote.slug}/${vote.voteId}');
        },
      ),
      (icon: Icons.local_fire_department_outlined, label: 'Contests', onTap: () => context.go('/votes')),
      (
        icon: Icons.confirmation_number_outlined,
        label: 'Tickets',
        onTap: () => context.go(auth.isAuthenticated ? '/my-tickets' : '/login'),
      ),
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
      child: Row(
        children: [
          for (var i = 0; i < items.length; i++) ...[
            if (i > 0) const SizedBox(width: 10),
            Expanded(
              child: GestureDetector(
                onTap: items[i].onTap,
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(
                    color: AppPalette.of(context).card,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppPalette.of(context).border),
                  ),
                  child: Column(
                    children: [
                      Icon(items[i].icon, color: AppColors.primaryLight, size: 22),
                      const SizedBox(height: 6),
                      Text(
                        items[i].label,
                        style: TextStyle(
                          color: AppPalette.of(context).text,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _naira(double value) => '₦${value.toStringAsFixed(2)}';

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
      return _emptyState('No votes available', Icons.how_to_vote_outlined);
    }
    return SizedBox(
      height: 210,
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
      return _emptyState('No events available', Icons.event_outlined);
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

  Widget _emptyState(String msg, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Center(
        child: Column(
          children: [
            Icon(icon, size: 40, color: AppColors.textHint),
            const SizedBox(height: 8),
            Text(
              msg,
              style: TextStyle(
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
        width: 176,
        decoration: BoxDecoration(
          color: AppPalette.of(context).card,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppPalette.of(context).border),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  CachedNetworkImage(
                    imageUrl: vote.image ?? AppConstants.votePlaceholder,
                    fit: BoxFit.cover,
                    errorWidget: (_, __, ___) => Container(
                      color: AppPalette.of(context).raised,
                      child: const Icon(
                        Icons.how_to_vote_rounded,
                        color: AppColors.primaryLight,
                        size: 32,
                      ),
                    ),
                  ),
                  const DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Colors.transparent, Color(0xCC0B1020)],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                  Positioned(
                    top: 10,
                    left: 10,
                    child: StatusBadge(status: vote.status),
                  ),
                  Positioned(
                    left: 12,
                    right: 12,
                    bottom: 10,
                    child: Text(
                      vote.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        height: 1.2,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
              child: Row(
                children: [
                  Icon(
                    Icons.how_to_vote_outlined,
                    size: 13,
                    color: AppPalette.of(context).muted,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '${vote.totalVotes} votes',
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
      ),
    );
  }
}

class _EventCard extends StatelessWidget {
  final EventModel event;
  const _EventCard({required this.event});

  String _when() {
    final raw = event.startDate;
    DateTime? date;
    try {
      date = DateTime.parse(raw);
    } catch (_) {}
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    final datePart = date == null
        ? (raw.length >= 10 ? raw.substring(0, 10) : raw)
        : '${date.day} ${months[date.month - 1]}';
    final venue = event.venue.trim();
    if (venue.isEmpty) return datePart;
    return '$datePart · $venue';
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/events/${event.id}'),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: AppPalette.of(context).card,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppPalette.of(context).border),
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: SizedBox(
                width: 54,
                height: 54,
                child: CachedNetworkImage(
                  imageUrl: event.posterImage ?? AppConstants.eventPlaceholder,
                  fit: BoxFit.cover,
                  errorWidget: (_, __, ___) => Container(
                    color: AppPalette.of(context).raised,
                    child: const Icon(
                      Icons.bolt_rounded,
                      color: AppColors.primaryLight,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    event.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: AppPalette.of(context).text,
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    _when(),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: AppPalette.of(context).muted,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'From ₦${event.minPrice.toStringAsFixed(2)}',
                    style: TextStyle(
                      color: AppColors.primaryLight,
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded, color: AppPalette.of(context).muted),
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
