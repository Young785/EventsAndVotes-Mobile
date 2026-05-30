import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body:
          _loading
              ? _buildSkeleton()
              : _event == null
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
                  const ShimmerCard(height: 240, radius: 0),
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
          const Text('Failed to load event', style: AppTextStyles.bodyMedium),
          const SizedBox(height: 16),
          TextButton(onPressed: _load, child: const Text('Retry')),
        ],
      ),
    );
  }

  Widget _buildContent() {
    final event = _event!;
    return Stack(
      children: [
        CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: Stack(
                children: [
                  CachedNetworkImage(
                    imageUrl:
                        event.posterImage ?? AppConstants.eventPlaceholder,
                    fit: BoxFit.cover,
                    height: 240,
                    errorWidget:
                        (_, __, ___) => Container(
                          height: 240,
                          decoration: const BoxDecoration(
                            gradient: AppColors.heroGradient,
                          ),
                        ),
                  ),
                  Container(
                    height: 240,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Colors.transparent,
                          Colors.black.withValues(alpha: 0.75),
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
                        StatusBadge(status: event.status),
                        const SizedBox(height: 6),
                        Text(
                          event.title,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 22,
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
                    // Key info row
                    Row(
                      children: [
                        _InfoTile(
                          icon: Icons.location_on_outlined,
                          label: 'Venue',
                          value: event.venue,
                          color: AppColors.error,
                        ),
                        const SizedBox(width: 10),
                        _InfoTile(
                          icon: Icons.calendar_today_outlined,
                          label: 'Date',
                          value:
                              event.startDate.length >= 10
                                  ? event.startDate.substring(0, 10)
                                  : event.startDate,
                          color: AppColors.primary,
                        ),
                      ],
                    ).animate().fadeIn(duration: 300.ms),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        if (event.startTime != null)
                          Expanded(
                            child: _InfoTile(
                              icon: Icons.access_time_rounded,
                              label: 'Time',
                              value:
                                  '${event.startTime} - ${event.endTime ?? ''}',
                              color: AppColors.accent,
                            ),
                          ),
                        if (event.totalCapacity != null) ...[
                          const SizedBox(width: 10),
                          Expanded(
                            child: _InfoTile(
                              icon: Icons.people_outline_rounded,
                              label: 'Capacity',
                              value: '${event.totalCapacity} seats',
                              color: AppColors.success,
                            ),
                          ),
                        ],
                      ],
                    ).animate().fadeIn(delay: 60.ms, duration: 300.ms),
                    const SizedBox(height: 20),

                    // Description
                    const Text(
                      'About this Event',
                      style: AppTextStyles.headlineSmall,
                    ).animate().fadeIn(delay: 100.ms),
                    const SizedBox(height: 8),
                    Text(
                      event.description,
                      style: const TextStyle(
                        fontSize: 14,
                        color: AppColors.textSecondary,
                        height: 1.6,
                      ),
                    ).animate().fadeIn(delay: 120.ms, duration: 300.ms),
                    const SizedBox(height: 24),

                    // Ticket Tiers
                    if (event.ticketTiers.isNotEmpty) ...[
                      const Text(
                        'Ticket Tiers',
                        style: AppTextStyles.headlineSmall,
                      ).animate().fadeIn(delay: 140.ms),
                      const SizedBox(height: 12),
                      ...event.ticketTiers.asMap().entries.map(
                        (e) => Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: _TicketTierCard(
                            tier: e.value,
                            eventId: widget.eventId,
                          )
                              .animate()
                              .fadeIn(
                                delay: (160 + e.key * 50).ms,
                                duration: 300.ms,
                              )
                              .slideY(begin: 0.04, end: 0),
                        ),
                      ),
                    ],
                    const SizedBox(height: 100),
                  ],
                ),
              ),
            ),
          ],
        ),
        if (event.ticketTiers.any((t) => t.isActive))
          Positioned(
            left: 16,
            right: 16,
            bottom: 24,
            child: ElevatedButton(
              onPressed: () =>
                  context.push('/events/${widget.eventId}/tickets'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: const Text(
                'Buy Tickets',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
            ),
          ),
      ],
    );
  }

}

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;
  const _InfoTile({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: color, size: 16),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
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
                    value,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
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

class _TicketTierCard extends StatelessWidget {
  final TicketTierModel tier;
  final String eventId;
  const _TicketTierCard({required this.tier, required this.eventId});

  @override
  Widget build(BuildContext context) {
    final isFree = tier.price == 0;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              gradient:
                  isFree
                      ? const LinearGradient(
                        colors: [AppColors.success, Color(0xFF34D399)],
                      )
                      : AppColors.primaryGradient,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.confirmation_number_rounded,
              color: Colors.white,
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  tier.name,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                if (tier.description != null && tier.description!.isNotEmpty)
                  Text(
                    tier.description!,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    if (tier.capacity != null)
                      Text(
                        '${tier.capacity! - tier.soldCount} left',
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    if (tier.capacity != null) const SizedBox(width: 8),
                    Text(
                      '${tier.soldCount} sold',
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                isFree ? 'FREE' : '₦${tier.price.toStringAsFixed(0)}',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: isFree ? AppColors.success : AppColors.primary,
                ),
              ),
              const SizedBox(height: 4),
              GestureDetector(
                onTap: tier.isActive
                    ? () => context.push('/events/$eventId/tickets')
                    : null,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color:
                        tier.isActive
                            ? AppColors.primarySurface
                            : AppColors.border,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    tier.isActive ? 'Buy Now' : 'Sold Out',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color:
                          tier.isActive
                              ? AppColors.primary
                              : AppColors.textSecondary,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

