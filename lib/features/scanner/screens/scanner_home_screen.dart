import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../models/migration_record.dart';
import '../providers/scanner_session_provider.dart';
import '../scanner_tab_scope.dart';
import '../theme/scanner_theme.dart';
import '../widgets/scanner_event_banner.dart';

class ScannerHomeScreen extends StatefulWidget {
  const ScannerHomeScreen({super.key});

  @override
  State<ScannerHomeScreen> createState() => _ScannerHomeScreenState();
}

class _ScannerHomeScreenState extends State<ScannerHomeScreen> {
  Timer? _ticker;

  @override
  void initState() {
    super.initState();
    _ticker = Timer.periodic(const Duration(seconds: 30), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scanner = context.watch<ScannerSessionProvider>();
    final todayLabel = DateFormat('EEEE, MMM d').format(DateTime.now());
    final scope = ScannerTabScope.maybeOf(context);

    if (scanner.isLoading && scanner.session == null) {
      return const Center(
        child: CircularProgressIndicator(color: ScannerTheme.primary),
      );
    }

    return RefreshIndicator(
      onRefresh: scanner.refreshSession,
      color: ScannerTheme.primary,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(
          parent: BouncingScrollPhysics(),
        ),
        padding: const EdgeInsets.fromLTRB(16, 2, 16, 16),
        children: [
          Text(
            todayLabel,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: ScannerTheme.textMuted,
            ),
          ),
          const SizedBox(height: 10),
          ScannerEventBanner(scanner: scanner),
          const SizedBox(height: 12),
          _TodayStats(scanner: scanner),
          const SizedBox(height: 10),
          _SyncStatusCard(
            scanner: scanner,
            onOpenSync: scope != null ? () => scope.goTo(1) : null,
          ),
          const SizedBox(height: 10),
          _QuickActions(
            onScan: scope != null ? () => scope.goTo(2) : null,
            onSync: scope != null ? () => scope.goTo(1) : null,
            onRecords: scope != null ? () => scope.goTo(3) : null,
          ),
          const SizedBox(height: 14),
          _MigrationHistorySection(scanner: scanner),
        ],
      ),
    );
  }
}

class _MigrationHistorySection extends StatelessWidget {
  final ScannerSessionProvider scanner;

  const _MigrationHistorySection({required this.scanner});

  String _nextLabel() {
    if (scanner.isMigrating) return 'Uploading now…';
    final remaining = scanner.nextMigrationIn;
    if (remaining == null) return 'After first sync';
    if (remaining == Duration.zero) return 'Due now';
    final mins = remaining.inMinutes;
    if (mins >= 60) return 'Next in ${mins ~/ 60}h ${mins % 60}m';
    if (mins > 0) return 'Next in ${mins}m';
    return 'Next in ${remaining.inSeconds}s';
  }

  @override
  Widget build(BuildContext context) {
    final history = scanner.migrationHistory;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Text(
              'Migration history',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w800,
                color: ScannerTheme.textDark,
              ),
            ),
            const Spacer(),
            if (scanner.pendingMigrationCount > 0)
              Container(
                margin: const EdgeInsets.only(right: 8),
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF3E0),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  '${scanner.pendingMigrationCount} pending',
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFFE67E22),
                  ),
                ),
              ),
            Text(
              _nextLabel(),
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: ScannerTheme.textMuted,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        if (history.isEmpty)
          _MigrationEmptyState(
            onMigrate: scanner.pendingMigrationCount > 0
                ? () => scanner.migrateToBackend(manual: true)
                : null,
            isMigrating: scanner.isMigrating,
          )
        else
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE8ECF2)),
            ),
            child: Column(
              children: history.asMap().entries.map((entry) {
                final record = entry.value;
                final isLast = entry.key == history.length - 1;
                return _MigrationRow(record: record, showDivider: !isLast);
              }).toList(),
            ),
          ),
        if (history.isNotEmpty && scanner.pendingMigrationCount > 0) ...[
          const SizedBox(height: 8),
          Center(
            child: TextButton.icon(
              onPressed: scanner.isMigrating
                  ? null
                  : () => scanner.migrateToBackend(manual: true),
              icon: scanner.isMigrating
                  ? const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.cloud_upload_outlined, size: 16),
              label: Text(
                scanner.isMigrating ? 'Uploading…' : 'Upload pending now',
              ),
              style: TextButton.styleFrom(
                foregroundColor: ScannerTheme.primary,
                textStyle: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _MigrationEmptyState extends StatelessWidget {
  final VoidCallback? onMigrate;
  final bool isMigrating;

  const _MigrationEmptyState({this.onMigrate, required this.isMigrating});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE8ECF2)),
      ),
      child: Column(
        children: [
          Icon(
            Icons.cloud_sync_outlined,
            size: 28,
            color: ScannerTheme.textMuted.withValues(alpha: 0.45),
          ),
          const SizedBox(height: 8),
          const Text(
            'No migrations yet',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: ScannerTheme.textDark,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Local scans auto-upload to the server every 20 minutes.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 11,
              height: 1.4,
              color: ScannerTheme.textMuted,
            ),
          ),
          if (onMigrate != null) ...[
            const SizedBox(height: 12),
            TextButton(
              onPressed: isMigrating ? null : onMigrate,
              child: Text(isMigrating ? 'Uploading…' : 'Upload now'),
            ),
          ],
        ],
      ),
    );
  }
}

class _MigrationRow extends StatelessWidget {
  final MigrationRecord record;
  final bool showDivider;

  const _MigrationRow({required this.record, required this.showDivider});

  @override
  Widget build(BuildContext context) {
    final timeFmt = DateFormat('h:mm a');
    final (icon, color, label) = _statusVisuals(record);

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
          child: Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 16, color: color),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: ScannerTheme.textDark,
                      ),
                    ),
                    if (record.message != null && record.message!.isNotEmpty)
                      Text(
                        record.message!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 10,
                          color: ScannerTheme.textMuted,
                        ),
                      ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    timeFmt.format(record.migratedAt),
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: ScannerTheme.textDark,
                    ),
                  ),
                  Text(
                    timeago.format(record.migratedAt),
                    style: const TextStyle(
                      fontSize: 9,
                      color: ScannerTheme.textMuted,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        if (showDivider)
          const Divider(height: 1, indent: 56, color: Color(0xFFE8ECF2)),
      ],
    );
  }

  (IconData, Color, String) _statusVisuals(MigrationRecord record) {
    switch (record.status) {
      case MigrationStatus.success:
        return (
          Icons.cloud_done_rounded,
          ScannerTheme.primary,
          '${record.uploadedCount} scan${record.uploadedCount == 1 ? '' : 's'} uploaded',
        );
      case MigrationStatus.partial:
        return (
          Icons.cloud_sync_rounded,
          const Color(0xFFE67E22),
          '${record.uploadedCount} uploaded · ${record.failedCount} failed',
        );
      case MigrationStatus.skipped:
        return (
          Icons.cloud_off_outlined,
          ScannerTheme.textMuted,
          'No pending scans',
        );
      case MigrationStatus.failed:
        return (
          Icons.cloud_off_rounded,
          const Color(0xFFE74C3C),
          'Upload failed',
        );
    }
  }
}

class _TodayStats extends StatelessWidget {
  final ScannerSessionProvider scanner;

  const _TodayStats({required this.scanner});

  @override
  Widget build(BuildContext context) {
    final total = scanner.todayScans;
    final approved = scanner.approvedCount;
    final declined = scanner.declinedCount;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE8ECF2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                'Today',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  color: ScannerTheme.textDark,
                ),
              ),
              const Spacer(),
              if (scanner.lastScan != null)
                Text(
                  'Last ${timeago.format(scanner.lastScan!)}',
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: ScannerTheme.textMuted,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _StatTile(
                  label: 'Scanned',
                  value: '$total',
                  color: ScannerTheme.textDark,
                ),
              ),
              Container(width: 1, height: 28, color: const Color(0xFFE8ECF2)),
              Expanded(
                child: _StatTile(
                  label: 'Approved',
                  value: '$approved',
                  color: ScannerTheme.primary,
                ),
              ),
              Container(width: 1, height: 28, color: const Color(0xFFE8ECF2)),
              Expanded(
                child: _StatTile(
                  label: 'Declined',
                  value: '$declined',
                  color: const Color(0xFFE74C3C),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _StatTile({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: color,
            height: 1,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w600,
            color: ScannerTheme.textMuted,
          ),
        ),
      ],
    );
  }
}

class _SyncStatusCard extends StatelessWidget {
  final ScannerSessionProvider scanner;
  final VoidCallback? onOpenSync;

  const _SyncStatusCard({required this.scanner, this.onOpenSync});

  @override
  Widget build(BuildContext context) {
    final ready = scanner.hasOfflineData;
    final synced = scanner.lastSyncedAt;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onOpenSync,
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: ready ? ScannerTheme.primaryLight.withValues(alpha: 0.5) : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: ready
                  ? ScannerTheme.primary.withValues(alpha: 0.15)
                  : const Color(0xFFE8ECF2),
            ),
          ),
          child: Row(
            children: [
              Icon(
                ready ? Icons.offline_bolt_rounded : Icons.cloud_download_outlined,
                size: 20,
                color: ScannerTheme.primary,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      ready ? 'Offline data ready' : 'Sync paid tickets',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: ScannerTheme.textDark,
                      ),
                    ),
                    Text(
                      ready
                          ? '${scanner.offlinePaidCount} guests · ${synced != null ? timeago.format(synced) : 'recently'}'
                          : 'Download for fast gate scanning',
                      style: const TextStyle(
                        fontSize: 11,
                        color: ScannerTheme.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right_rounded,
                size: 18,
                color: ScannerTheme.textMuted.withValues(alpha: 0.7),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _QuickActions extends StatelessWidget {
  final VoidCallback? onScan;
  final VoidCallback? onSync;
  final VoidCallback? onRecords;

  const _QuickActions({this.onScan, this.onSync, this.onRecords});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _ActionChip(
            icon: Icons.qr_code_scanner_rounded,
            label: 'Scan',
            onTap: onScan,
            primary: true,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _ActionChip(
            icon: Icons.sync_rounded,
            label: 'Sync',
            onTap: onSync,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _ActionChip(
            icon: Icons.receipt_long_rounded,
            label: 'Records',
            onTap: onRecords,
          ),
        ),
      ],
    );
  }
}

class _ActionChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  final bool primary;

  const _ActionChip({
    required this.icon,
    required this.label,
    this.onTap,
    this.primary = false,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Ink(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: primary ? ScannerTheme.primary : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: primary ? null : Border.all(color: const Color(0xFFE8ECF2)),
          ),
          child: Column(
            children: [
              Icon(
                icon,
                size: 20,
                color: primary ? Colors.white : ScannerTheme.primary,
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: primary ? Colors.white : ScannerTheme.textDark,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
