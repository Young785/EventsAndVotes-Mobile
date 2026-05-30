import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../../core/services/events_service.dart';
import '../../../core/services/notification_service.dart';
import '../../../core/services/tickets_service.dart';
import '../../../features/events/models/event_model.dart';
import '../../../shared/widgets/notifications_sheet.dart';
import '../models/scan_record.dart';
import '../theme/scanner_theme.dart';
import '../utils/scan_session_utils.dart';
import '../widgets/scanner_result_card.dart';
import '../widgets/scanner_scan_frame.dart';

class AdminScannerScreen extends StatefulWidget {
  final String eventId;
  const AdminScannerScreen({super.key, required this.eventId});

  @override
  State<AdminScannerScreen> createState() => _AdminScannerScreenState();
}

class _AdminScannerScreenState extends State<AdminScannerScreen>
    with TickerProviderStateMixin {
  final TicketsService _tickets = TicketsService();
  final EventsService _events = EventsService();
  final NotificationService _notifications = NotificationService();
  final MobileScannerController _controller = MobileScannerController();

  EventModel? _event;
  Map<String, dynamic>? _stats;
  bool _loadingEvent = true;
  bool _processing = false;
  bool _flashOn = false;
  bool _cameraGranted = false;
  int _unreadNotifications = 0;
  int _todayScans = 0;
  ScanRecord? _lastResult;
  final List<ScanRecord> _history = [];

  late final AnimationController _lineAnim;
  late final AnimationController _cardAnim;

  @override
  void initState() {
    super.initState();
    _lineAnim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2200),
    )..repeat(reverse: true);
    _cardAnim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 420),
    );
    _ensureCamera();
    _loadEvent();
    _loadNotifications();
  }

  Future<void> _loadEvent() async {
    try {
      final data = await _events.getEventDetails(widget.eventId);
      if (mounted) {
        setState(() {
          _event = EventModel.fromJson(data);
          _stats = data['statistics'] is Map
              ? Map<String, dynamic>.from(data['statistics'] as Map)
              : null;
          _todayScans = _stats?['total_scans'] as int? ?? 0;
          _loadingEvent = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingEvent = false);
    }
  }

  Future<void> _loadNotifications() async {
    final count = await _notifications.getUnreadCount();
    if (mounted) setState(() => _unreadNotifications = count);
  }

  Future<void> _ensureCamera() async {
    var status = await Permission.camera.status;
    if (!status.isGranted) status = await Permission.camera.request();
    if (mounted) setState(() => _cameraGranted = status.isGranted);
  }

  Future<void> _toggleFlash() async {
    await _controller.toggleTorch();
    setState(() => _flashOn = !_flashOn);
  }

  void _showResult(ScanRecord record) {
    setState(() => _lastResult = record);
    _cardAnim.forward(from: 0);
  }

  Future<void> _processScan(String raw) async {
    if (_processing) return;
    setState(() {
      _processing = true;
      _lastResult = null;
    });
    _cardAnim.reset();

    try {
      final result = await _tickets.staffScan(qrData: raw);
      final record = recordFromScanResponse(result, qrData: raw);
      HapticFeedback.mediumImpact();
      if (mounted) {
        setState(() {
          _history.insert(0, record);
          _todayScans++;
        });
        _showResult(record);
      }
    } catch (e) {
      HapticFeedback.heavyImpact();
      final record = ScanRecord(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        guestName: 'Unknown Guest',
        ticketCode: raw.length > 24 ? '${raw.substring(0, 24)}…' : raw,
        approved: false,
        scannedAt: DateTime.now(),
        declineReason: e.toString().replaceAll('Exception: ', ''),
      );
      if (mounted) {
        setState(() => _history.insert(0, record));
        _showResult(record);
      }
    } finally {
      await Future.delayed(const Duration(seconds: 2));
      if (mounted) setState(() => _processing = false);
    }
  }

  Future<void> _onScan(BarcodeCapture capture) async {
    final raw = capture.barcodes.firstOrNull?.rawValue;
    if (raw == null || raw.isEmpty) return;
    await _processScan(raw);
  }

  @override
  void dispose() {
    _lineAnim.dispose();
    _cardAnim.dispose();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          if (_cameraGranted)
            MobileScanner(
              controller: _controller,
              fit: BoxFit.cover,
              onDetect: _onScan,
            )
          else
            _CameraDenied(onRetry: _ensureCamera),
          IgnorePointer(
            child: Container(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: Alignment.center,
                  radius: 1.1,
                  colors: [
                    Colors.transparent,
                    Colors.black.withValues(alpha: 0.45),
                  ],
                  stops: const [0.55, 1.0],
                ),
              ),
            ),
          ),
          if (_processing)
            Container(
              color: Colors.black45,
              child: const Center(
                child: CircularProgressIndicator(color: ScannerTheme.primary),
              ),
            ),
          SafeArea(
            child: Column(
              children: [
                _AdminScannerHeader(
                  event: _event,
                  loading: _loadingEvent,
                  unreadCount: _unreadNotifications,
                  flashOn: _flashOn,
                  onBack: () => context.pop(),
                  onFlash: _toggleFlash,
                  onNotifications: () => NotificationsSheet.show(
                    context,
                    onCountChanged: _loadNotifications,
                  ),
                ),
                const Spacer(),
                ScannerScanFrame(lineAnim: _lineAnim),
                const Spacer(),
                if (_lastResult == null)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(24, 0, 24, 16),
                    child: Column(
                      children: [
                        if (_event != null) ...[
                          _EventStatsBar(
                            event: _event!,
                            stats: _stats,
                            sessionScans: _todayScans,
                          ),
                          const SizedBox(height: 12),
                        ],
                        const Text(
                          'Point at ticket QR code',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
          if (_lastResult != null)
            Positioned(
              left: 0,
              right: 0,
              bottom: 24,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: ScannerResultPanel(
                  record: _lastResult!,
                  anim: _cardAnim,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _AdminScannerHeader extends StatelessWidget {
  final EventModel? event;
  final bool loading;
  final int unreadCount;
  final bool flashOn;
  final VoidCallback onBack;
  final VoidCallback onFlash;
  final VoidCallback onNotifications;

  const _AdminScannerHeader({
    required this.event,
    required this.loading,
    required this.unreadCount,
    required this.flashOn,
    required this.onBack,
    required this.onFlash,
    required this.onNotifications,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
      child: Row(
        children: [
          _CircleBtn(icon: Icons.arrow_back_rounded, onTap: onBack),
          const SizedBox(width: 10),
          Expanded(
            child: loading
                ? Container(
                    height: 44,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                  )
                : Material(
                    color: Colors.black.withValues(alpha: 0.55),
                    borderRadius: BorderRadius.circular(14),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 8,
                      ),
                      child: Row(
                        children: [
                          if (event?.posterImage != null)
                            ClipRRect(
                              borderRadius: BorderRadius.circular(6),
                              child: CachedNetworkImage(
                                imageUrl: event!.posterImage!,
                                width: 32,
                                height: 32,
                                fit: BoxFit.cover,
                                errorWidget: (_, __, ___) =>
                                    const _EventIcon(),
                              ),
                            )
                          else
                            const _EventIcon(),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  event?.title ?? 'Gate Scanner',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 13,
                                  ),
                                ),
                                if (event != null)
                                  Text(
                                    event!.venue,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(
                                      color: Colors.white.withValues(alpha: 0.7),
                                      fontSize: 11,
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
          ),
          const SizedBox(width: 8),
          _FlashBtn(on: flashOn, onTap: onFlash),
          const SizedBox(width: 6),
          Stack(
            clipBehavior: Clip.none,
            children: [
              _CircleBtn(
                icon: Icons.notifications_none_rounded,
                onTap: onNotifications,
              ),
              if (unreadCount > 0)
                Positioned(
                  right: 4,
                  top: 4,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: Color(0xFFE74C3C),
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 18,
                      minHeight: 18,
                    ),
                    child: Text(
                      unreadCount > 9 ? '9+' : '$unreadCount',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 9,
                        fontWeight: FontWeight.w800,
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

class _EventIcon extends StatelessWidget {
  const _EventIcon();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        color: ScannerTheme.primary,
        borderRadius: BorderRadius.circular(6),
      ),
      child: const Icon(Icons.event, color: Colors.white, size: 16),
    );
  }
}

class _EventStatsBar extends StatelessWidget {
  final EventModel event;
  final Map<String, dynamic>? stats;
  final int sessionScans;

  const _EventStatsBar({
    required this.event,
    required this.stats,
    required this.sessionScans,
  });

  @override
  Widget build(BuildContext context) {
    final sold = stats?['total_tickets_sold'] ?? event.totalSoldTickets ?? 0;
    final totalScans = stats?['total_scans'] ?? 0;
    final dateFmt = DateFormat('MMM d');

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.55),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
      ),
      child: Row(
        children: [
          _StatPill(icon: Icons.confirmation_number_outlined, label: '$sold sold'),
          _divider(),
          _StatPill(icon: Icons.qr_code_scanner_rounded, label: '$totalScans scans'),
          _divider(),
          _StatPill(icon: Icons.today_rounded, label: '$sessionScans this session'),
          if (event.startDate.isNotEmpty) ...[
            _divider(),
            _StatPill(
              icon: Icons.calendar_today_rounded,
              label: dateFmt.format(DateTime.tryParse(event.startDate) ?? DateTime.now()),
            ),
          ],
        ],
      ),
    );
  }

  Widget _divider() => Container(
        width: 1,
        height: 20,
        margin: const EdgeInsets.symmetric(horizontal: 8),
        color: Colors.white.withValues(alpha: 0.15),
      );
}

class _StatPill extends StatelessWidget {
  final IconData icon;
  final String label;

  const _StatPill({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 13, color: Colors.white70),
          const SizedBox(width: 4),
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CircleBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _CircleBtn({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white.withValues(alpha: 0.92),
      shape: const CircleBorder(),
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: SizedBox(
          width: 44,
          height: 44,
          child: Icon(icon, color: ScannerTheme.textDark, size: 22),
        ),
      ),
    );
  }
}

class _FlashBtn extends StatelessWidget {
  final bool on;
  final VoidCallback onTap;

  const _FlashBtn({required this.on, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white.withValues(alpha: 0.92),
      borderRadius: BorderRadius.circular(22),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Icon(
            on ? Icons.flash_on_rounded : Icons.flash_off_rounded,
            size: 22,
            color: on ? Colors.amber : ScannerTheme.textDark,
          ),
        ),
      ),
    );
  }
}

class _CameraDenied extends StatelessWidget {
  final VoidCallback onRetry;

  const _CameraDenied({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.videocam_off_rounded, color: Colors.white54, size: 48),
            const SizedBox(height: 16),
            const Text(
              'Camera access is required to scan tickets at the gate.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white70, fontSize: 14),
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: onRetry,
              style: FilledButton.styleFrom(backgroundColor: ScannerTheme.primary),
              child: const Text('Allow camera'),
            ),
          ],
        ),
      ),
    );
  }
}
