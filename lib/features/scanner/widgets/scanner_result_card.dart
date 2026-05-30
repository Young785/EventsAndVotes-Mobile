import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../models/scan_record.dart';
import '../theme/scanner_theme.dart';
import 'scan_status_badge.dart';

/// Scan result overlay shown after a ticket is scanned.
class ScannerResultPanel extends StatelessWidget {
  final ScanRecord record;
  final AnimationController? anim;

  const ScannerResultPanel({
    super.key,
    required this.record,
    this.anim,
  });

  @override
  Widget build(BuildContext context) {
    final approved = record.approved;

    Widget content = Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        ScanStatusBadge(approved: approved, size: 64),
        const SizedBox(height: 12),
        _ResultCard(record: record),
      ],
    );

    if (anim != null) {
      content = AnimatedBuilder(
        animation: anim!,
        builder: (context, child) {
          final t = Curves.easeOutCubic.transform(anim!.value);
          return Transform.translate(
            offset: Offset(0, 48 * (1 - t)),
            child: Opacity(opacity: t, child: child),
          );
        },
        child: content,
      );
    }

    return content;
  }
}

class _ResultCard extends StatelessWidget {
  final ScanRecord record;

  const _ResultCard({required this.record});

  @override
  Widget build(BuildContext context) {
    final approved = record.approved;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      record.guestName,
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 17,
                        color: ScannerTheme.textDark,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      record.ticketCode,
                      style: const TextStyle(
                        fontSize: 12,
                        color: ScannerTheme.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: approved
                      ? ScannerTheme.primaryLight
                      : const Color(0xFFFFECEC),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  approved ? 'Approved' : 'Declined',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: approved
                        ? ScannerTheme.primary
                        : const Color(0xFFE74C3C),
                  ),
                ),
              ),
            ],
          ),
          if (record.ticketType != null) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFF4F6FA),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.confirmation_number_outlined,
                    size: 14,
                    color: ScannerTheme.textMuted,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    record.ticketType!,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: ScannerTheme.textDark,
                    ),
                  ),
                ],
              ),
            ),
          ],
          if (!approved && record.declineReason != null) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFFFECEC),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.info_outline_rounded,
                    size: 16,
                    color: Color(0xFFE74C3C),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      record.declineReason!,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFFE74C3C),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    ).animate().fadeIn(delay: 120.ms, duration: 280.ms);
  }
}
