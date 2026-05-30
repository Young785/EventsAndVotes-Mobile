import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../models/scan_record.dart';
import '../theme/scanner_theme.dart';

/// Bottom sheet showing recent scan activity for gate staff.
class ScannerActivitySheet extends StatelessWidget {
  final List<ScanRecord> records;
  final VoidCallback? onRefresh;

  const ScannerActivitySheet({
    super.key,
    required this.records,
    this.onRefresh,
  });

  static Future<void> show(
    BuildContext context, {
    required List<ScanRecord> records,
    VoidCallback? onRefresh,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ScannerActivitySheet(
        records: records,
        onRefresh: onRefresh,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final height = MediaQuery.sizeOf(context).height * 0.65;
    final declined = records.where((r) => !r.approved).length;
    final approved = records.where((r) => r.approved).length;

    return Container(
      height: height,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 10),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: const Color(0xFFE0E4EA),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 12, 0),
            child: Row(
              children: [
                const Expanded(
                  child: Text(
                    'Scan activity',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: ScannerTheme.textDark,
                    ),
                  ),
                ),
                if (onRefresh != null)
                  IconButton(
                    icon: const Icon(Icons.refresh_rounded),
                    onPressed: () {
                      onRefresh?.call();
                      Navigator.pop(context);
                    },
                    tooltip: 'Refresh session',
                  ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
            child: Row(
              children: [
                _SummaryChip(
                  label: 'Approved',
                  count: approved,
                  color: ScannerTheme.primary,
                ),
                const SizedBox(width: 8),
                _SummaryChip(
                  label: 'Declined',
                  count: declined,
                  color: const Color(0xFFE74C3C),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: records.isEmpty
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.notifications_none_rounded,
                          size: 48,
                          color: ScannerTheme.textMuted.withValues(alpha: 0.5),
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'No scan activity yet',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: ScannerTheme.textMuted,
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                    itemCount: records.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final r = records[index];
                      return _ActivityTile(record: r);
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

class _SummaryChip extends StatelessWidget {
  final String label;
  final int count;
  final Color color;

  const _SummaryChip({
    required this.label,
    required this.count,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Text(
              '$count',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: color,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: color.withValues(alpha: 0.85),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ActivityTile extends StatelessWidget {
  final ScanRecord record;

  const _ActivityTile({required this.record});

  @override
  Widget build(BuildContext context) {
    final approved = record.approved;
    final color = approved ? ScannerTheme.primary : const Color(0xFFE74C3C);
    final timeFmt = DateFormat('h:mm a');

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.15)),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(
              approved ? Icons.check_rounded : Icons.close_rounded,
              color: color,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  record.guestName,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                    color: ScannerTheme.textDark,
                  ),
                ),
                Text(
                  record.ticketCode,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 11,
                    color: ScannerTheme.textMuted,
                  ),
                ),
                if (!approved && record.declineReason != null)
                  Text(
                    record.declineReason!,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: color,
                    ),
                  ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                timeFmt.format(record.scannedAt),
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: ScannerTheme.textMuted,
                ),
              ),
              Text(
                timeago.format(record.scannedAt),
                style: const TextStyle(fontSize: 10, color: ScannerTheme.textMuted),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
