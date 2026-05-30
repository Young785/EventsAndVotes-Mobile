import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/offline_ticket.dart';
import '../providers/scanner_session_provider.dart';
import '../theme/scanner_theme.dart';
import '../widgets/scanner_event_banner.dart';

class ScannerSyncScreen extends StatefulWidget {
  const ScannerSyncScreen({super.key});

  @override
  State<ScannerSyncScreen> createState() => _ScannerSyncScreenState();
}

class _ScannerSyncScreenState extends State<ScannerSyncScreen> {
  final _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _showGuestInfo(OfflineTicket ticket) async {
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => _GuestTicketSheet(ticket: ticket),
    );
  }

  Future<void> _sync(ScannerSessionProvider scanner) async {
    await scanner.syncPaidTickets();
    if (!mounted) return;
    final err = scanner.syncError;
    if (err != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(err),
          backgroundColor: const Color(0xFFE74C3C),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '${scanner.offlineTicketCount} paid tickets saved on this device',
          ),
          backgroundColor: ScannerTheme.primary,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final scanner = context.watch<ScannerSessionProvider>();
    final query = _searchCtrl.text.trim().toLowerCase();
    final tickets = query.isEmpty
        ? scanner.offlineTickets
        : scanner.offlineTickets.where((t) {
            return t.guestName.toLowerCase().contains(query) ||
                t.ticketCode.toLowerCase().contains(query);
          }).toList();
    final dateFmt = DateFormat('MMM d, yyyy · h:mm a');

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
      children: [
        ScannerEventBanner(scanner: scanner),
        const SizedBox(height: 16),
        _SyncHeroCard(
          scanner: scanner,
          onSync: () => _sync(scanner),
        ),
        const SizedBox(height: 16),
        if (scanner.hasOfflineData) ...[
          Row(
            children: [
              const Text(
                'Cached tickets',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: ScannerTheme.textDark,
                ),
              ),
              const Spacer(),
              Text(
                scanner.lastSyncedAt != null
                    ? 'Synced ${dateFmt.format(scanner.lastSyncedAt!)}'
                    : 'Not synced yet',
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: ScannerTheme.textMuted,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _searchCtrl,
            onChanged: (_) => setState(() {}),
            decoration: InputDecoration(
              hintText: 'Search cached guests',
              prefixIcon: const Icon(Icons.search_rounded, size: 20),
              filled: true,
              fillColor: Colors.white,
              contentPadding: const EdgeInsets.symmetric(vertical: 12),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(color: ScannerTheme.primaryLight),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(color: ScannerTheme.primaryLight),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: ScannerTheme.primary, width: 1.5),
              ),
            ),
          ),
          const SizedBox(height: 12),
          ...tickets.map(
            (t) => _TicketCacheRow(
              ticket: t,
              isScanned: scanner.isOfflineTicketScanned(t),
              onTap: () => _showGuestInfo(t),
            ),
          ),
          if (tickets.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Center(
                child: Text(
                  'No guests match your search',
                  style: TextStyle(color: ScannerTheme.textMuted),
                ),
              ),
            ),
        ] else
          _EmptySyncState(onSync: () => _sync(scanner), syncing: scanner.isSyncing),
      ],
    );
  }
}

class _SyncHeroCard extends StatelessWidget {
  final ScannerSessionProvider scanner;
  final VoidCallback onSync;

  const _SyncHeroCard({required this.scanner, required this.onSync});

  @override
  Widget build(BuildContext context) {
    final ready = scanner.hasOfflineData;
    final pending = scanner.offlinePaidCount;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: ScannerTheme.cardDecoration,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  gradient: ScannerTheme.primaryGradient,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(Icons.cloud_download_rounded, color: Colors.white),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Offline Sync',
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        color: ScannerTheme.textDark,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      ready
                          ? '$pending guests ready for fast gate scanning'
                          : 'Download paid tickets before event day',
                      style: const TextStyle(
                        fontSize: 13,
                        height: 1.35,
                        color: ScannerTheme.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              _MiniStat(
                label: 'Cached',
                value: '${scanner.offlineTicketCount}',
                icon: Icons.people_outline_rounded,
              ),
              const SizedBox(width: 10),
              _MiniStat(
                label: 'Ready',
                value: '$pending',
                icon: Icons.verified_outlined,
                accent: true,
              ),
              const SizedBox(width: 10),
              _MiniStat(
                label: 'Used',
                value: '${scanner.offlineTicketCount - pending}',
                icon: Icons.check_circle_outline_rounded,
              ),
            ],
          ),
          const SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: scanner.isSyncing ? null : onSync,
              icon: scanner.isSyncing
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Icon(ready ? Icons.sync_rounded : Icons.download_rounded),
              label: Text(
                scanner.isSyncing
                    ? 'Syncing…'
                    : ready
                        ? 'Sync again'
                        : 'Download paid tickets',
              ),
              style: FilledButton.styleFrom(
                backgroundColor: ScannerTheme.primary,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),
          ),
          if (ready) ...[
            const SizedBox(height: 10),
            Center(
              child: TextButton(
                onPressed: scanner.isSyncing ? null : scanner.clearOfflineTickets,
                child: const Text(
                  'Clear local cache',
                  style: TextStyle(color: ScannerTheme.textMuted),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final bool accent;

  const _MiniStat({
    required this.label,
    required this.value,
    required this.icon,
    this.accent = false,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
        decoration: BoxDecoration(
          color: accent ? ScannerTheme.primaryLight : const Color(0xFFF4F6FA),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Icon(icon, size: 16, color: accent ? ScannerTheme.primary : ScannerTheme.textMuted),
            const SizedBox(height: 4),
            Text(
              value,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: accent ? ScannerTheme.primary : ScannerTheme.textDark,
              ),
            ),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: accent ? ScannerTheme.primary : ScannerTheme.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TicketCacheRow extends StatelessWidget {
  final OfflineTicket ticket;
  final bool isScanned;
  final VoidCallback onTap;

  const _TicketCacheRow({
    required this.ticket,
    required this.isScanned,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final scanned = isScanned;

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Ink(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFE8ECF2)),
            ),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: scanned ? const Color(0xFFF4F6FA) : ScannerTheme.primaryLight,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  scanned ? Icons.check_rounded : Icons.confirmation_number_outlined,
                  size: 18,
                  color: scanned ? ScannerTheme.textMuted : ScannerTheme.primary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      ticket.guestName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                        color: ScannerTheme.textDark,
                      ),
                    ),
                    Text(
                      '${ticket.ticketType} · ${ticket.ticketCode}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 11, color: ScannerTheme.textMuted),
                    ),
                    if (ticket.displayGmail != 'Not provided') ...[
                      const SizedBox(height: 2),
                      Text(
                        ticket.displayGmail,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: ScannerTheme.primary.withValues(alpha: 0.85),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: scanned ? const Color(0xFFF4F6FA) : ScannerTheme.primaryLight,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  scanned ? 'Used' : 'Ready',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: scanned ? ScannerTheme.textMuted : ScannerTheme.primary,
                  ),
                ),
              ),
              const SizedBox(width: 4),
              Icon(
                Icons.chevron_right_rounded,
                size: 18,
                color: ScannerTheme.textMuted.withValues(alpha: 0.6),
              ),
            ],
          ),
        ),
      ),
      ),
    );
  }
}

class _GuestTicketSheet extends StatelessWidget {
  final OfflineTicket ticket;

  const _GuestTicketSheet({required this.ticket});

  String get _initials {
    final parts = ticket.guestName.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts.first.isEmpty) return '?';
    if (parts.length == 1) return parts.first[0].toUpperCase();
    return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
  }

  Future<void> _launchEmail(String email) async {
    final uri = Uri(scheme: 'mailto', path: email);
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  Future<void> _launchPhone(String phone) async {
    final digits = phone.replaceAll(RegExp(r'[^\d+]'), '');
    final uri = Uri(scheme: 'tel', path: digits);
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  @override
  Widget build(BuildContext context) {
    final scanner = context.watch<ScannerSessionProvider>();
    final gmail = ticket.displayGmail;
    final canEmail = gmail != 'Not provided';
    final phone = ticket.guestPhone?.trim();
    final scanned = scanner.isOfflineTicketScanned(ticket);
    final scanRecord = scanner.approvedScanForOfflineTicket(ticket);
    final dateFmt = DateFormat('MMM d, yyyy · h:mm a');

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
            const SizedBox(height: 18),
            _ScanStatusBanner(
              scanned: scanned,
              scannedAt: scanRecord?.scannedAt,
              dateFmt: dateFmt,
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    gradient: ScannerTheme.primaryGradient,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    _initials,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        ticket.guestName,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                          color: ScannerTheme.textDark,
                        ),
                      ),
                      if (canEmail) ...[
                        const SizedBox(height: 4),
                        Text(
                          gmail,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: ScannerTheme.primary.withValues(alpha: 0.9),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            _InfoCard(
              children: [
                _InfoRow(
                  icon: scanned ? Icons.check_circle_rounded : Icons.pending_outlined,
                  label: 'Scan status',
                  value: scanned ? 'Scanned' : 'Not scanned',
                  valueColor: scanned ? const Color(0xFF27AE60) : const Color(0xFFE67E22),
                ),
                if (scanned && scanRecord != null)
                  _InfoRow(
                    icon: Icons.schedule_rounded,
                    label: 'Scanned at',
                    value: dateFmt.format(scanRecord.scannedAt),
                  ),
                _InfoRow(
                  icon: Icons.confirmation_number_outlined,
                  label: 'Ticket type',
                  value: ticket.ticketType,
                ),
                _InfoRow(
                  icon: Icons.tag_rounded,
                  label: 'Ticket code',
                  value: ticket.ticketCode,
                ),
                _InfoRow(
                  icon: Icons.payments_outlined,
                  label: 'Payment',
                  value: ticket.paymentStatus.toUpperCase(),
                  valueColor: ticket.isPaid ? const Color(0xFF27AE60) : const Color(0xFFE74C3C),
                ),
                _InfoRow(
                  icon: Icons.email_outlined,
                  label: 'Gmail',
                  value: gmail,
                  tappable: canEmail,
                  onTap: canEmail ? () => _launchEmail(gmail) : null,
                ),
                if (phone != null && phone.isNotEmpty)
                  _InfoRow(
                    icon: Icons.phone_outlined,
                    label: 'Phone',
                    value: phone,
                    tappable: true,
                    onTap: () => _launchPhone(phone),
                    isLast: true,
                  )
                else
                  _InfoRow(
                    icon: Icons.qr_code_2_rounded,
                    label: 'QR ref',
                    value: ticket.qrCode.length > 28
                        ? '${ticket.qrCode.substring(0, 28)}…'
                        : ticket.qrCode,
                    isLast: true,
                  ),
              ],
            ),
            const SizedBox(height: 14),
            FilledButton(
              onPressed: () => Navigator.of(context).pop(),
              style: FilledButton.styleFrom(
                backgroundColor: ScannerTheme.primary,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text('Close'),
            ),
          ],
        ),
      ),
    );
  }
}

class _ScanStatusBanner extends StatelessWidget {
  final bool scanned;
  final DateTime? scannedAt;
  final DateFormat dateFmt;

  const _ScanStatusBanner({
    required this.scanned,
    required this.scannedAt,
    required this.dateFmt,
  });

  @override
  Widget build(BuildContext context) {
    final color = scanned ? const Color(0xFF27AE60) : const Color(0xFFE67E22);
    final bg = scanned ? const Color(0xFFEAF7EE) : const Color(0xFFFFF4E8);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(
              scanned ? Icons.verified_rounded : Icons.qr_code_scanner_rounded,
              color: color,
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  scanned ? 'Ticket scanned' : 'Not scanned yet',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: color,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  scanned && scannedAt != null
                      ? 'Checked in ${dateFmt.format(scannedAt!)}'
                      : 'This guest has not been checked in at the gate',
                  style: TextStyle(
                    fontSize: 11,
                    height: 1.35,
                    color: color.withValues(alpha: 0.85),
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

class _InfoCard extends StatelessWidget {
  final List<Widget> children;

  const _InfoCard({required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 4),
      decoration: BoxDecoration(
        color: const Color(0xFFF8F9FB),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE8ECF2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Guest information',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: ScannerTheme.textDark,
            ),
          ),
          const SizedBox(height: 8),
          ...children,
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color? valueColor;
  final bool tappable;
  final VoidCallback? onTap;
  final bool isLast;

  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
    this.valueColor,
    this.tappable = false,
    this.onTap,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = valueColor ??
        (tappable ? ScannerTheme.primary : ScannerTheme.textDark);

    return Padding(
      padding: EdgeInsets.only(bottom: isLast ? 8 : 10),
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
                Icon(icon, size: 15, color: ScannerTheme.textMuted),
                const SizedBox(width: 8),
                SizedBox(
                  width: 82,
                  child: Text(
                    label,
                    style: const TextStyle(
                      fontSize: 12,
                      color: ScannerTheme.textMuted,
                    ),
                  ),
                ),
                Expanded(
                  child: Text(
                    value,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: color,
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

class _EmptySyncState extends StatelessWidget {
  final VoidCallback onSync;
  final bool syncing;

  const _EmptySyncState({required this.onSync, required this.syncing});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(28),
      decoration: ScannerTheme.cardDecoration,
      child: Column(
        children: [
          Icon(
            Icons.offline_bolt_rounded,
            size: 40,
            color: ScannerTheme.primary.withValues(alpha: 0.7),
          ),
          const SizedBox(height: 14),
          const Text(
            'No tickets on device yet',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: ScannerTheme.textDark,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Sync before event day so scanning works instantly — even with poor network at the gate.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              height: 1.45,
              color: ScannerTheme.textMuted,
            ),
          ),
          const SizedBox(height: 18),
          FilledButton.icon(
            onPressed: syncing ? null : onSync,
            icon: const Icon(Icons.download_rounded),
            label: const Text('Start sync'),
            style: FilledButton.styleFrom(
              backgroundColor: ScannerTheme.primary,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ],
      ),
    );
  }
}
