import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../providers/scanner_session_provider.dart';
import '../theme/scanner_theme.dart';

/// Compact event summary card for scanner screens.
class ScannerEventBanner extends StatelessWidget {
  final ScannerSessionProvider scanner;

  const ScannerEventBanner({super.key, required this.scanner});

  Color _statusColor(String status) {
    switch (status) {
      case 'live':
        return const Color(0xFF27AE60);
      case 'ended':
        return const Color(0xFF95A5A6);
      default:
        return const Color(0xFFF39C12);
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'live':
        return 'Live';
      case 'ended':
        return 'Ended';
      default:
        return 'Upcoming';
    }
  }

  @override
  Widget build(BuildContext context) {
    final status = scanner.eventStatus;
    final statusColor = _statusColor(status);
    final poster = scanner.eventPosterUrl;
    final start = scanner.eventStartAt;
    final dateFmt = DateFormat('EEE, MMM d');

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE8ECF2)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _PosterThumb(poster: poster),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  scanner.eventTitle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: ScannerTheme.textDark,
                    letterSpacing: -0.2,
                  ),
                ),
                const SizedBox(height: 3),
                Row(
                  children: [
                    Icon(
                      Icons.location_on_outlined,
                      size: 12,
                      color: ScannerTheme.textMuted.withValues(alpha: 0.9),
                    ),
                    const SizedBox(width: 2),
                    Expanded(
                      child: Text(
                        scanner.eventVenue,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 11,
                          color: ScannerTheme.textMuted,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    _MetaChip(
                      icon: Icons.calendar_today_rounded,
                      label: start != null ? dateFmt.format(start) : '—',
                    ),
                    _StatusPill(
                      label: _statusLabel(status),
                      color: statusColor,
                    ),
                    if (scanner.totalScans > 0)
                      _MetaChip(
                        icon: Icons.qr_code_2_rounded,
                        label: '${scanner.totalScans}',
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PosterThumb extends StatelessWidget {
  final String? poster;

  const _PosterThumb({this.poster});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(10),
      child: SizedBox(
        width: 48,
        height: 48,
        child: poster != null
            ? CachedNetworkImage(
                imageUrl: poster!,
                fit: BoxFit.cover,
                errorWidget: (_, __, ___) => const _PosterFallback(),
              )
            : const _PosterFallback(),
      ),
    );
  }
}

class _PosterFallback extends StatelessWidget {
  const _PosterFallback();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: ScannerTheme.primaryLight,
      child: const Icon(
        Icons.event_rounded,
        color: ScannerTheme.primary,
        size: 22,
      ),
    );
  }
}

class _MetaChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _MetaChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: const Color(0xFFF4F6FA),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 10, color: ScannerTheme.textMuted),
          const SizedBox(width: 3),
          Text(
            label,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: ScannerTheme.textMuted,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  final String label;
  final Color color;

  const _StatusPill({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 5,
            height: 5,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

/// Compact event chip for the scan camera overlay.
class ScannerEventChip extends StatelessWidget {
  final String title;
  final String location;
  final String? posterUrl;

  const ScannerEventChip({
    super.key,
    required this.title,
    required this.location,
    this.posterUrl,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.black.withValues(alpha: 0.55),
      borderRadius: BorderRadius.circular(14),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (posterUrl != null)
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: CachedNetworkImage(
                  imageUrl: posterUrl!,
                  width: 28,
                  height: 28,
                  fit: BoxFit.cover,
                  errorWidget: (_, __, ___) => Container(
                    width: 28,
                    height: 28,
                    color: ScannerTheme.primary,
                    child: const Icon(Icons.event, color: Colors.white, size: 14),
                  ),
                ),
              )
            else
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: ScannerTheme.primary,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Icon(Icons.event, color: Colors.white, size: 14),
              ),
            const SizedBox(width: 10),
            Flexible(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                    ),
                  ),
                  Text(
                    location,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.75),
                      fontSize: 11,
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
