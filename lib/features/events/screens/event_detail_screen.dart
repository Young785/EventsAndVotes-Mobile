import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/services/events_service.dart';
import '../models/event_model.dart';
import '../../../shared/widgets/shimmer_card.dart';
import '../../../shared/widgets/detail_back_button.dart';
import '../../../shared/widgets/status_badge.dart';

class EventDetailScreen extends StatefulWidget {
  final String eventId;
  const EventDetailScreen({super.key, required this.eventId});

  @override
  State<EventDetailScreen> createState() => _EventDetailScreenState();
}

class _EventDetailScreenState extends State<EventDetailScreen> {
  final EventsService _eventsService = EventsService();
  EventModel? _event;
  bool _loading = true;
  int? _selectedTierId;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await _eventsService.getEventDetails(widget.eventId);
      if (mounted) {
        setState(() {
          _event = EventModel.fromJson(data);
          _loading = false;
        });
      }
      return;
    } catch (_) {
      if (mounted) {
        setState(() {
          _event = null;
          _loading = false;
        });
      }
    }
  }

  TicketTierModel? get _selected {
    final event = _event;
    if (event == null || _selectedTierId == null) return null;
    for (final tier in event.ticketTiers) {
      if (tier.id == _selectedTierId) return tier;
    }
    return null;
  }

  void _buy() {
    final event = _event;
    final tier = _selected;
    if (event == null) return;
    if (tier == null || !tier.isActive) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Choose a ticket tier to continue')),
      );
      return;
    }
    context.push('/events/${widget.eventId}/tickets?tier=${tier.id}');
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: AppNight.background,
        body: _loading
            ? _buildSkeleton()
            : _event == null
                ? _buildError()
                : _buildContent(),
      ),
    );
  }

  Widget _buildSkeleton() {
    return const Stack(
      children: [
        ShimmerCard(height: 280, radius: 0),
        Positioned(top: 0, left: 0, child: DetailBackButton()),
      ],
    );
  }

  Widget _buildError() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 48, color: AppNight.muted),
          const SizedBox(height: 12),
          const Text(
            'Failed to load event',
            style: TextStyle(color: AppNight.muted),
          ),
          const SizedBox(height: 16),
          TextButton(onPressed: _load, child: const Text('Retry')),
        ],
      ),
    );
  }

  Widget _buildContent() {
    final event = _event!;
    final selected = _selected;
    final activeTiers = event.ticketTiers.where((t) => t.isActive).toList();

    return Stack(
      children: [
        CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: SizedBox(
                height: 220,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    CachedNetworkImage(
                      imageUrl: event.posterImage ?? AppConstants.eventPlaceholder,
                      fit: BoxFit.cover,
                      errorWidget: (_, __, ___) => const DecoratedBox(
                        decoration: BoxDecoration(gradient: AppColors.heroGradient),
                      ),
                    ),
                    const DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Color(0x330B1020), AppNight.background],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        ),
                      ),
                    ),
                    const Positioned(top: 0, left: 0, child: DetailBackButton()),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 120),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    StatusBadge(status: event.status),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Container(
                          width: 36,
                          height: 36,
                          decoration: const BoxDecoration(
                            color: AppNight.surfaceHigh,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.location_on_outlined,
                            color: AppColors.primaryLight,
                            size: 18,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                event.venue.isEmpty ? 'Venue to be announced' : event.venue,
                                style: const TextStyle(
                                  color: AppNight.text,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              if (event.totalCapacity != null)
                                Text(
                                  'Capacity ${event.totalCapacity} verified attendees',
                                  style: const TextStyle(
                                    color: AppNight.muted,
                                    fontSize: 12,
                                  ),
                                ),
                            ],
                          ),
                        ),
                        const Icon(Icons.chevron_right_rounded, color: AppNight.muted),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      event.title,
                      style: const TextStyle(
                        color: AppNight.text,
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                        height: 1.15,
                        letterSpacing: -0.4,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'From ${_naira(event.minPrice)}',
                      style: const TextStyle(
                        color: AppColors.primaryLight,
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _when(event),
                      style: const TextStyle(color: AppNight.muted, fontSize: 14),
                    ),
                    if (event.ticketTiers.isNotEmpty) ...[
                      const SizedBox(height: 18),
                      const Text(
                        'Ticket Tier',
                        style: TextStyle(
                          color: AppNight.muted,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 8),
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            for (final tier in event.ticketTiers) ...[
                              _TierChip(
                                label: '${tier.name} (${_naira(tier.price)})',
                                selected: tier.id == _selectedTierId,
                                enabled: tier.isActive,
                                onTap: tier.isActive
                                    ? () => setState(() {
                                          _selectedTierId =
                                              _selectedTierId == tier.id ? null : tier.id;
                                        })
                                    : null,
                              ),
                              const SizedBox(width: 8),
                            ],
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: 16),
                    Text(
                      event.description.isEmpty
                          ? 'Details for this event will appear here.'
                          : event.description,
                      style: const TextStyle(
                        color: AppNight.text,
                        fontSize: 15,
                        height: 1.45,
                      ),
                    ),
                    const SizedBox(height: 14),
                    const Row(
                      children: [
                        Icon(Icons.verified_user_outlined, color: AppColors.success, size: 16),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Instant digital pass delivery with QR gate admission',
                            style: TextStyle(color: AppNight.muted, fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _TierInfoCard(tier: selected),
                    const SizedBox(height: 22),
                    GestureDetector(
                      onTap: () => context.go('/events'),
                      child: const Text(
                        'More live productions',
                        style: TextStyle(
                          color: AppNight.text,
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        if (activeTiers.isNotEmpty)
          Positioned(
            left: 16,
            right: 16,
            bottom: 16,
            child: Container(
              padding: const EdgeInsets.fromLTRB(16, 10, 8, 10),
              decoration: BoxDecoration(
                color: AppNight.surfaceHigh,
                borderRadius: BorderRadius.circular(28),
                border: Border.all(color: AppNight.border),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      selected?.name ?? 'Choose Tier',
                      style: const TextStyle(
                        color: AppNight.text,
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  FilledButton(
                    onPressed: _buy,
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: Text(
                      selected == null
                          ? 'Select Tier · From ${_naira(event.minPrice)}'
                          : 'Buy Tickets · ${_naira(selected.price)}',
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class _TierChip extends StatelessWidget {
  final String label;
  final bool selected;
  final bool enabled;
  final VoidCallback? onTap;

  const _TierChip({
    required this.label,
    required this.selected,
    required this.enabled,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: selected ? Colors.white : AppNight.surfaceHigh,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          enabled ? label : '$label · Sold out',
          style: TextStyle(
            color: selected ? const Color(0xFF121826) : AppNight.muted,
            fontWeight: FontWeight.w700,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}

class _TierInfoCard extends StatelessWidget {
  final TicketTierModel? tier;
  const _TierInfoCard({required this.tier});

  @override
  Widget build(BuildContext context) {
    final selected = tier;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppNight.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppNight.border),
      ),
      child: selected == null
          ? const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.auto_awesome, color: AppColors.primaryLight, size: 18),
                    SizedBox(width: 8),
                    Text(
                      'Select Admission Tier',
                      style: TextStyle(
                        color: AppNight.text,
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 6),
                Text(
                  'Choose a tier to view what is included and reserve admission.',
                  style: TextStyle(color: AppNight.muted, fontSize: 13, height: 1.4),
                ),
              ],
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.workspace_premium_outlined, color: AppColors.primaryLight, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        '${selected.name} Inclusions',
                        style: const TextStyle(
                          color: AppNight.text,
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  (selected.description != null && selected.description!.trim().isNotEmpty)
                      ? selected.description!
                      : 'Admission for ${selected.name}. Your pass is delivered in the app with a QR code for the gate.',
                  style: const TextStyle(color: AppNight.muted, fontSize: 13, height: 1.4),
                ),
              ],
            ),
    );
  }
}

String _naira(double value) => '₦${value.toStringAsFixed(2)}';

String _when(EventModel event) {
  DateTime? date;
  try {
    date = DateTime.parse(event.startDate);
  } catch (_) {}
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  final datePart = date == null
      ? event.startDate
      : '${date.day} ${months[date.month - 1]}';
  final time = event.startTime?.trim();
  if (time == null || time.isEmpty) return datePart;
  return '$datePart · $time';
}
