import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../providers/scanner_session_provider.dart';
import '../../../core/constants/app_constants.dart';
import '../theme/scanner_theme.dart';
import '../widgets/bouncer_avatar.dart';
import '../widgets/scanner_event_banner.dart';

class ScannerProfileScreen extends StatefulWidget {
  const ScannerProfileScreen({super.key});

  @override
  State<ScannerProfileScreen> createState() => _ScannerProfileScreenState();
}

class _ScannerProfileScreenState extends State<ScannerProfileScreen> {
  Timer? _ticker;

  @override
  void initState() {
    super.initState();
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  Future<void> _logout(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Leave scanner mode?'),
        content: const Text(
          'You will need your host token again to scan tickets at the gate.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            style: FilledButton.styleFrom(backgroundColor: const Color(0xFFE74C3C)),
            child: const Text('Exit'),
          ),
        ],
      ),
    );

    if (confirmed != true || !context.mounted) return;
    await context.read<ScannerSessionProvider>().logout();
    if (context.mounted) context.go('/login');
  }

  String _formatDuration(Duration d) {
    final h = d.inHours;
    final m = d.inMinutes.remainder(60);
    final s = d.inSeconds.remainder(60);
    if (h > 0) return '${h}h ${m}m';
    if (m > 0) return '${m}m ${s}s';
    return '${s}s';
  }

  @override
  Widget build(BuildContext context) {
    final scanner = context.watch<ScannerSessionProvider>();
    final dateFmt = DateFormat('EEE, MMM d · h:mm a');
    final start = scanner.eventStartAt;
    final end = scanner.eventEndAt;
    final status = scanner.eventStatus;

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
      children: [
        _StaffCard(scanner: scanner),
        const SizedBox(height: 16),
        ScannerEventBanner(scanner: scanner),
        const SizedBox(height: 14),
        _ScheduleCard(
          start: start,
          end: end,
          dateFmt: dateFmt,
          eventRemaining: scanner.eventTimeRemaining,
          status: status,
        ),
        const SizedBox(height: 14),
        _GateCard(scanner: scanner),
        const SizedBox(height: 14),
        _MigrationUploadCard(
          scanner: scanner,
          dateFmt: dateFmt,
          formatDuration: _formatDuration,
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: () => _logout(context),
            icon: const Icon(Icons.logout_rounded, color: Color(0xFFE74C3C)),
            label: const Text(
              'Exit Scanner Mode',
              style: TextStyle(
                color: Color(0xFFE74C3C),
                fontWeight: FontWeight.w700,
              ),
            ),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              side: const BorderSide(color: Color(0xFFE74C3C)),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _StaffCard extends StatelessWidget {
  final ScannerSessionProvider scanner;

  const _StaffCard({required this.scanner});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => context.push('/scanner/account'),
        borderRadius: BorderRadius.circular(22),
        child: Ink(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: ScannerTheme.primaryGradient,
            borderRadius: BorderRadius.circular(22),
            boxShadow: [
              BoxShadow(
                color: ScannerTheme.primary.withValues(alpha: 0.32),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Row(
            children: [
              const BouncerAvatar(size: 56),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      scanner.scannerName,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.3,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        scanner.role.toUpperCase(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.6,
                        ),
                      ),
                    ),
                    if (scanner.scannerEmail != '—') ...[
                      const SizedBox(height: 6),
                      Text(
                        scanner.scannerEmail,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.8),
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                    if (scanner.scannerPhone != '—')
                      Text(
                        scanner.scannerPhone,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.8),
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right_rounded,
                color: Colors.white.withValues(alpha: 0.85),
                size: 22,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ScheduleCard extends StatelessWidget {
  final DateTime? start;
  final DateTime? end;
  final DateFormat dateFmt;
  final Duration? eventRemaining;
  final String status;

  const _ScheduleCard({
    required this.start,
    required this.end,
    required this.dateFmt,
    required this.eventRemaining,
    required this.status,
  });

  @override
  Widget build(BuildContext context) {
    return _ProfileSection(
      title: 'Event schedule',
      icon: Icons.schedule_rounded,
      child: Column(
        children: [
          _TimelineRow(
            label: 'Starts',
            value: start != null ? dateFmt.format(start!) : '—',
            icon: Icons.play_circle_outline_rounded,
            isFirst: true,
            isLast: false,
            active: status != 'upcoming',
          ),
          _TimelineRow(
            label: 'Ends',
            value: end != null ? dateFmt.format(end!) : '—',
            icon: Icons.stop_circle_outlined,
            isFirst: false,
            isLast: true,
            active: status == 'ended',
          ),
        ],
      ),
    );
  }
}

class _TimelineRow extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final bool isFirst;
  final bool isLast;
  final bool active;

  const _TimelineRow({
    required this.label,
    required this.value,
    required this.icon,
    required this.isFirst,
    required this.isLast,
    required this.active,
  });

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: 32,
            child: Column(
              children: [
                if (!isFirst)
                  Expanded(
                    child: Container(
                      width: 2,
                      color: ScannerTheme.primaryLight,
                    ),
                  ),
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: active ? ScannerTheme.primaryLight : const Color(0xFFF0F2F5),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    icon,
                    size: 16,
                    color: active ? ScannerTheme.primary : ScannerTheme.textMuted,
                  ),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      color: ScannerTheme.primaryLight,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(
                top: isFirst ? 0 : 8,
                bottom: isLast ? 0 : 16,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: ScannerTheme.textMuted,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    value,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: ScannerTheme.textDark,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _GateCard extends StatelessWidget {
  final ScannerSessionProvider scanner;

  const _GateCard({required this.scanner});

  @override
  Widget build(BuildContext context) {
    return _ProfileSection(
      title: 'Gate assignment',
      icon: Icons.door_front_door_outlined,
      child: Column(
        children: [
          _InfoRow(label: 'Location', value: scanner.locationName),
          _InfoRow(label: 'Type', value: scanner.scanType.toUpperCase()),
          _InfoRow(label: 'Details', value: scanner.locationDescription),
        ],
      ),
    );
  }
}

class _MigrationUploadCard extends StatelessWidget {
  final ScannerSessionProvider scanner;
  final DateFormat dateFmt;
  final String Function(Duration) formatDuration;

  const _MigrationUploadCard({
    required this.scanner,
    required this.dateFmt,
    required this.formatDuration,
  });

  @override
  Widget build(BuildContext context) {
    final nextAt = scanner.scheduledMigrationAt;
    final remaining = scanner.nextMigrationIn;
    final pending = scanner.pendingMigrationCount;
    final isDue = remaining == Duration.zero && pending > 0;

    return _ProfileSection(
      title: 'Database upload',
      icon: Icons.cloud_upload_outlined,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (nextAt != null) ...[
            Text(
              'Next migration to server',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: ScannerTheme.textMuted.withValues(alpha: 0.9),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              dateFmt.format(nextAt),
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: ScannerTheme.textDark,
              ),
            ),
            const SizedBox(height: 10),
          ],
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: isDue
                  ? const Color(0xFFFFF3E0)
                  : ScannerTheme.primaryLight,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(
                  scanner.isMigrating
                      ? Icons.sync_rounded
                      : isDue
                          ? Icons.notification_important_rounded
                          : Icons.timer_outlined,
                  size: 18,
                  color: isDue
                      ? const Color(0xFFE67E22)
                      : ScannerTheme.primaryDark,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    scanner.isMigrating
                        ? 'Uploading scans now…'
                        : remaining != null
                            ? 'Upload in ${formatDuration(remaining)}'
                            : 'Sync tickets to enable auto-upload',
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                      color: isDue
                          ? const Color(0xFFE67E22)
                          : ScannerTheme.primaryDark,
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (pending > 0) ...[
            const SizedBox(height: 10),
            Text(
              '$pending scan${pending == 1 ? '' : 's'} waiting to upload · every ${AppConstants.scannerMigrationIntervalMinutes} min',
              style: const TextStyle(
                fontSize: 11,
                color: ScannerTheme.textMuted,
                height: 1.35,
              ),
            ),
          ] else if (scanner.lastMigrationAt != null) ...[
            const SizedBox(height: 10),
            Text(
              'Last upload · ${dateFmt.format(scanner.lastMigrationAt!)}',
              style: const TextStyle(
                fontSize: 11,
                color: ScannerTheme.textMuted,
              ),
            ),
          ],
          if (pending > 0 && !scanner.isMigrating) ...[
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => scanner.migrateToBackend(manual: true),
                icon: const Icon(Icons.cloud_upload_rounded, size: 18),
                label: const Text('Upload now'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: ScannerTheme.primary,
                  side: const BorderSide(color: ScannerTheme.primary),
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _ProfileSection extends StatelessWidget {
  final String title;
  final IconData icon;
  final Widget child;

  const _ProfileSection({
    required this.title,
    required this.icon,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: ScannerTheme.cardDecoration,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 20, color: ScannerTheme.primaryDark),
              const SizedBox(width: 8),
              Text(
                title,
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 15,
                  color: ScannerTheme.textDark,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          child,
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;

  const _InfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 88,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 13,
                color: ScannerTheme.textMuted,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 13,
                color: ScannerTheme.textDark,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
