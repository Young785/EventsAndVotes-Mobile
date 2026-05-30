import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/constants/app_constants.dart';
import '../providers/scanner_session_provider.dart';
import '../theme/scanner_theme.dart';
import '../widgets/bouncer_avatar.dart';

class ScannerStaffDetailScreen extends StatelessWidget {
  const ScannerStaffDetailScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final scanner = context.watch<ScannerSessionProvider>();
    final dateFmt = DateFormat('MMM d, yyyy · h:mm a');

    return Scaffold(
      backgroundColor: ScannerTheme.surface,
      appBar: AppBar(
        backgroundColor: ScannerTheme.surface,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: ScannerTheme.textDark),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'My account',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: ScannerTheme.textDark,
          ),
        ),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
        children: [
          _CompactHero(scanner: scanner),
          const SizedBox(height: 12),
          _CompactCard(
            title: 'Staff details',
            child: Column(
              children: [
                _DetailRow(label: 'Name', value: scanner.scannerName),
                _DetailRow(label: 'Role', value: scanner.role.toUpperCase()),
                _ContactRow(
                  icon: Icons.email_outlined,
                  label: 'Gmail',
                  value: scanner.scannerEmail,
                  onTap: scanner.scannerEmail != '—'
                      ? () => _launchEmail(scanner.scannerEmail)
                      : null,
                ),
                _ContactRow(
                  icon: Icons.phone_outlined,
                  label: 'Phone',
                  value: scanner.scannerPhone,
                  onTap: scanner.scannerPhone != '—'
                      ? () => _launchPhone(scanner.scannerPhone)
                      : null,
                ),
                _DetailRow(label: 'Event', value: scanner.eventTitle),
                _DetailRow(label: 'Venue', value: scanner.eventVenue),
                _DetailRow(label: 'Gate', value: scanner.locationName),
                _DetailRow(label: 'Scan type', value: scanner.scanType.toUpperCase()),
                if (scanner.tokenExpiresAt != null)
                  _DetailRow(
                    label: 'Access until',
                    value: dateFmt.format(scanner.tokenExpiresAt!),
                    isLast: true,
                  )
                else
                  _DetailRow(
                    label: 'Access',
                    value: 'Active',
                    isLast: true,
                  ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          _CompactCard(
            title: 'Device status',
            child: Column(
              children: [
                _DetailRow(
                  label: 'Offline guests',
                  value: '${scanner.offlinePaidCount} ready',
                ),
                _DetailRow(
                  label: 'Pending upload',
                  value: '${scanner.pendingMigrationCount} scans',
                ),
                _DetailRow(
                  label: 'Last sync',
                  value: scanner.lastSyncedAt != null
                      ? dateFmt.format(scanner.lastSyncedAt!)
                      : 'Not synced yet',
                  isLast: true,
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          _CompactCard(
            title: 'Support',
            child: Column(
              children: [
                _ActionRow(
                  icon: Icons.help_outline_rounded,
                  label: 'Help',
                  subtitle: 'Scanning tips & FAQs',
                  onTap: () => _openHelp(context),
                ),
                const Divider(height: 1, color: Color(0xFFE8ECF2)),
                _ActionRow(
                  icon: Icons.bug_report_outlined,
                  label: 'Report a bug',
                  subtitle: 'Tell us what went wrong',
                  onTap: () => _openReportBug(context, scanner),
                  isLast: true,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _openHelp(BuildContext context) async {
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => const _HelpSheet(),
    );
  }

  Future<void> _openReportBug(
    BuildContext context,
    ScannerSessionProvider scanner,
  ) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => _ReportBugSheet(scanner: scanner),
    );
  }
}

Future<void> _launchEmail(String email) async {
  final uri = Uri(scheme: 'mailto', path: email);
  if (await canLaunchUrl(uri)) {
    await launchUrl(uri);
  }
}

Future<void> _launchPhone(String phone) async {
  final digits = phone.replaceAll(RegExp(r'[^\d+]'), '');
  final uri = Uri(scheme: 'tel', path: digits);
  if (await canLaunchUrl(uri)) {
    await launchUrl(uri);
  }
}

class _CompactHero extends StatelessWidget {
  final ScannerSessionProvider scanner;

  const _CompactHero({required this.scanner});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        gradient: ScannerTheme.primaryGradient,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: ScannerTheme.primary.withValues(alpha: 0.22),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          const BouncerAvatar(size: 52),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  scanner.scannerName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  '${scanner.role.toUpperCase()} · ${scanner.locationName}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.85),
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (scanner.scannerEmail != '—') ...[
                  const SizedBox(height: 4),
                  Text(
                    scanner.scannerEmail,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.75),
                      fontSize: 10,
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
                      color: Colors.white.withValues(alpha: 0.75),
                      fontSize: 10,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CompactCard extends StatelessWidget {
  final String title;
  final Widget child;

  const _CompactCard({required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE8ECF2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: ScannerTheme.textDark,
              letterSpacing: 0.2,
            ),
          ),
          const SizedBox(height: 8),
          child,
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isLast;

  const _DetailRow({
    required this.label,
    required this.value,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: isLast ? 8 : 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 96,
            child: Text(
              label,
              style: const TextStyle(fontSize: 12, color: ScannerTheme.textMuted),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: ScannerTheme.textDark,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ContactRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final VoidCallback? onTap;

  const _ContactRow({
    required this.icon,
    required this.label,
    required this.value,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final tappable = onTap != null && value != '—';

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: tappable ? onTap : null,
          borderRadius: BorderRadius.circular(8),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 2),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: 96,
                  child: Row(
                    children: [
                      Icon(icon, size: 13, color: ScannerTheme.textMuted),
                      const SizedBox(width: 4),
                      Text(
                        label,
                        style: const TextStyle(
                          fontSize: 12,
                          color: ScannerTheme.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: Text(
                    value,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: tappable ? ScannerTheme.primary : ScannerTheme.textDark,
                    ),
                  ),
                ),
                if (tappable)
                  Icon(
                    Icons.open_in_new_rounded,
                    size: 14,
                    color: ScannerTheme.primary.withValues(alpha: 0.7),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ActionRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String subtitle;
  final VoidCallback onTap;
  final bool isLast;

  const _ActionRow({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.onTap,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Padding(
        padding: EdgeInsets.fromLTRB(0, 10, 0, isLast ? 10 : 10),
        child: Row(
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: ScannerTheme.primaryLight,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, size: 18, color: ScannerTheme.primary),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: ScannerTheme.textDark,
                    ),
                  ),
                  Text(
                    subtitle,
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
              size: 20,
              color: ScannerTheme.textMuted.withValues(alpha: 0.7),
            ),
          ],
        ),
      ),
    );
  }
}

class _HelpSheet extends StatelessWidget {
  const _HelpSheet();

  static const _tips = [
    ('Sync before event day', 'Download paid tickets so scanning works offline at the gate.'),
    ('Scan inside the frame', 'Hold the QR steady until you see approved or declined.'),
    ('Auto-upload every 20 min', 'Local scans migrate to the server automatically.'),
    ('Need a new token?', 'Ask your event host from the admin scan-locations page.'),
  ];

  Future<void> _openWebHelp() async {
    final uri = Uri.parse('${AppConstants.frontendUrl}/help');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFFE0E0E0),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Scanner help',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: ScannerTheme.textDark,
              ),
            ),
            const SizedBox(height: 12),
            ..._tips.map(
              (t) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.check_circle_outline_rounded,
                        size: 16, color: ScannerTheme.primary),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            t.$1,
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: ScannerTheme.textDark,
                            ),
                          ),
                          Text(
                            t.$2,
                            style: const TextStyle(
                              fontSize: 11,
                              height: 1.35,
                              color: ScannerTheme.textMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: _openWebHelp,
              icon: const Icon(Icons.open_in_new_rounded, size: 16),
              label: const Text('Open full help center'),
              style: OutlinedButton.styleFrom(
                foregroundColor: ScannerTheme.primary,
                padding: const EdgeInsets.symmetric(vertical: 11),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ReportBugSheet extends StatefulWidget {
  final ScannerSessionProvider scanner;

  const _ReportBugSheet({required this.scanner});

  @override
  State<_ReportBugSheet> createState() => _ReportBugSheetState();
}

class _ReportBugSheetState extends State<_ReportBugSheet> {
  final _ctrl = TextEditingController();
  bool _sending = false;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final text = _ctrl.text.trim();
    if (text.length < 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please describe the issue in a few words'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    setState(() => _sending = true);
    await Future.delayed(const Duration(milliseconds: 700));
    if (!mounted) return;

    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);
    final body = Uri.encodeComponent(
      'Scanner bug report\n'
      'Staff: ${widget.scanner.scannerName}\n'
      'Event: ${widget.scanner.eventTitle}\n'
      'Gate: ${widget.scanner.locationName}\n\n'
      '$text',
    );
    final uri = Uri.parse(
      'mailto:support@bizinvestify.com?subject=Scanner%20Bug%20Report&body=$body',
    );

    setState(() => _sending = false);
    navigator.pop();

    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else {
      await Clipboard.setData(ClipboardData(text: text));
      messenger.showSnackBar(
        const SnackBar(
          content: Text('Report copied — email support@bizinvestify.com'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.viewInsetsOf(context).bottom;

    return Padding(
      padding: EdgeInsets.fromLTRB(20, 12, 20, 20 + bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: const Color(0xFFE0E0E0),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Report a bug',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: ScannerTheme.textDark,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Describe what happened. We\'ll include your gate and event info.',
            style: TextStyle(fontSize: 12, color: ScannerTheme.textMuted, height: 1.35),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _ctrl,
            maxLines: 4,
            decoration: InputDecoration(
              hintText: 'e.g. Camera freezes after scanning…',
              filled: true,
              fillColor: const Color(0xFFF8F9FB),
              contentPadding: const EdgeInsets.all(12),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Color(0xFFE8ECF2)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Color(0xFFE8ECF2)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: ScannerTheme.primary),
              ),
            ),
          ),
          const SizedBox(height: 14),
          FilledButton(
            onPressed: _sending ? null : _submit,
            style: FilledButton.styleFrom(
              backgroundColor: ScannerTheme.primary,
              padding: const EdgeInsets.symmetric(vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: _sending
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Text('Send report'),
          ),
        ],
      ),
    );
  }
}
