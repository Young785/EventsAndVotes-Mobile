import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/services/events_service.dart';
import '../../../core/utils/list_response_utils.dart';
import '../models/event_model.dart';
import '../../../shared/widgets/shimmer_card.dart';
import '../../../shared/widgets/app_search_field.dart';
import '../../../shared/widgets/status_badge.dart';
import '../../../shared/widgets/layout_view_toggle.dart';
import '../../../core/theme/app_spacing.dart';

class EventsScreen extends StatefulWidget {
  const EventsScreen({super.key});
  @override
  State<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends State<EventsScreen> {
  List<EventModel> _events = [];
  bool _loading = true;
  String _status = '';
  int _page = 1;
  int _lastPage = 1;
  final _searchCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  String _search = '';
  final EventsService _eventsService = EventsService();
  bool _gridView = false;

  final _tabs = ['All', 'Active', 'Upcoming', 'Completed'];

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
      final response = await _eventsService.getEvents(
        status: _status.isEmpty ? null : _status,
        page: _page,
        search: _search.isEmpty ? null : _search,
      );

      if (mounted) {
        final items = parseListItems(response['data'] as List?);
        final events = <EventModel>[];
        for (final item in items) {
          try {
            events.add(EventModel.fromJson(item));
          } catch (_) {}
        }
        final meta = response['meta'] as Map<String, dynamic>? ?? {};

        setState(() {
          _events = reset ? events : [..._events, ...events];
          _lastPage = meta['last_page'] ?? 1;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          if (reset) _events = [];
          _loading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to load events')),
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
      'Active': 'active',
      'Upcoming': 'draft',
      'Completed': 'completed',
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
                  child: ShimmerList(count: 5, itemHeight: 130),
                ),
              )
            else if (_events.isEmpty)
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
                          childAspectRatio: 0.75,
                        ),
                        delegate: SliverChildBuilderDelegate(
                          (context, i) {
                            if (i >= _events.length) {
                              return const Center(
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: AppColors.primary,
                                ),
                              );
                            }
                            return _EventGridCard(event: _events[i]);
                          },
                          childCount:
                              _events.length + (_page < _lastPage ? 1 : 0),
                        ),
                      ),
                    )
                  : SliverPadding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                      sliver: SliverList.separated(
                        itemCount: _events.length + (_page < _lastPage ? 1 : 0),
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (_, i) {
                          if (i == _events.length) {
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
                          return _EventCard(event: _events[i])
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
    final map = {
      'All': '',
      'Active': 'active',
      'Upcoming': 'draft',
      'Completed': 'completed',
    };

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      child: Column(
        children: [
          AppSearchField(
            controller: _searchCtrl,
            hint: 'Search events...',
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
                    itemBuilder: (_, i) {
                      final active = _status == (map[_tabs[i]] ?? '');
                      return GestureDetector(
                        onTap: () => _setStatus(_tabs[i]),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: active ? AppColors.primary : AppColors.white,
                            borderRadius:
                                BorderRadius.circular(AppSpacing.chipRadius),
                            border: Border.all(
                              color: active ? AppColors.primary : AppColors.border,
                            ),
                          ),
                          child: Text(
                            _tabs[i],
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color:
                                  active ? Colors.white : AppColors.textSecondary,
                            ),
                          ),
                        ),
                      );
                    },
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
              Icons.event_outlined,
              color: AppColors.primary,
              size: 36,
            ),
          ),
          const SizedBox(height: 16),
          const Text('No events found', style: AppTextStyles.headlineSmall),
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

class _EventGridCard extends StatelessWidget {
  final EventModel event;
  const _EventGridCard({required this.event});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/events/${event.id}'),
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
              child: Stack(
                fit: StackFit.expand,
                children: [
                  CachedNetworkImage(
                    imageUrl:
                        event.posterImage ?? AppConstants.eventPlaceholder,
                    fit: BoxFit.cover,
                    errorWidget: (_, __, ___) => Container(
                      color: AppColors.primarySurface,
                      child: const Icon(
                        Icons.event_rounded,
                        color: AppColors.primary,
                        size: 28,
                      ),
                    ),
                  ),
                  if (event.ticketTiers.isNotEmpty)
                    Positioned(
                      bottom: 6,
                      left: 6,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.65),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '₦${event.minPrice.toStringAsFixed(0)}+',
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    StatusBadge(status: event.status),
                    const SizedBox(height: 6),
                    Text(
                      event.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const Spacer(),
                    Text(
                      event.venue,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
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

class _EventCard extends StatelessWidget {
  final EventModel event;
  const _EventCard({required this.event});

  Color _statusColor(String s) {
    switch (s) {
      case 'active':
        return AppColors.success;
      case 'completed':
        return AppColors.info;
      case 'cancelled':
        return AppColors.error;
      default:
        return AppColors.warning;
    }
  }

  Color _statusBg(String s) {
    switch (s) {
      case 'active':
        return AppColors.successLight;
      case 'completed':
        return AppColors.infoLight;
      case 'cancelled':
        return AppColors.errorLight;
      default:
        return AppColors.warningLight;
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/events/${event.id}'),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                SizedBox(
                  height: 140,
                  width: double.infinity,
                  child: CachedNetworkImage(
                    imageUrl:
                        event.posterImage ?? AppConstants.eventPlaceholder,
                    fit: BoxFit.cover,
                    errorWidget:
                        (_, __, ___) => Container(
                          color: AppColors.primarySurface,
                          child: const Icon(
                            Icons.event_rounded,
                            color: AppColors.primary,
                            size: 40,
                          ),
                        ),
                  ),
                ),
                Positioned(
                  top: 10,
                  right: 10,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: _statusBg(event.status),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      event.status[0].toUpperCase() + event.status.substring(1),
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: _statusColor(event.status),
                      ),
                    ),
                  ),
                ),
                if (event.ticketTiers.isNotEmpty)
                  Positioned(
                    bottom: 10,
                    left: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.6),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        'From ₦${event.minPrice.toStringAsFixed(0)}',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    event.title,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(
                        Icons.location_on_outlined,
                        size: 13,
                        color: AppColors.textSecondary,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          event.venue,
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textSecondary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Icon(
                        Icons.calendar_today_outlined,
                        size: 13,
                        color: AppColors.textSecondary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        event.startDate.length >= 10
                            ? event.startDate.substring(0, 10)
                            : event.startDate,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                  if (event.ticketTiers.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        const Icon(
                          Icons.confirmation_number_outlined,
                          size: 13,
                          color: AppColors.primary,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '${event.ticketTiers.length} ticket tier${event.ticketTiers.length > 1 ? 's' : ''}',
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.primary,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.primarySurface,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text(
                            'Get Tickets',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
