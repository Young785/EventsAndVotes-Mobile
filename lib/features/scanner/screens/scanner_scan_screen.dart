import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../scanner_tab_scope.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:provider/provider.dart';
import '../models/scan_record.dart';
import '../models/scan_exceptions.dart';
import '../providers/scanner_session_provider.dart';
import '../theme/scanner_theme.dart';
import '../widgets/scan_toast.dart';
import '../widgets/scanner_scan_frame.dart';
import '../widgets/scanner_result_card.dart';

class ScannerScanScreen extends StatefulWidget {
  const ScannerScanScreen({super.key});

  @override
  State<ScannerScanScreen> createState() => _ScannerScanScreenState();
}

class _ScannerScanScreenState extends State<ScannerScanScreen>
    with TickerProviderStateMixin {
  final MobileScannerController _controller = MobileScannerController();
  bool _processing = false;
  bool _flashOn = false;
  bool _cameraGranted = false;
  bool _cameraChecking = true;
  String? _cameraError;
  ScanRecord? _lastResult;
  late final AnimationController _lineAnim;
  late final AnimationController _cardAnim;

  @override
  void initState() {
    super.initState();
    _ensureCamera();
    _lineAnim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2200),
    )..repeat(reverse: true);
    _cardAnim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 420),
    );
  }

  @override
  void dispose() {
    _lineAnim.dispose();
    _cardAnim.dispose();
    _controller.dispose();
    super.dispose();
  }

  void _showResult(ScanRecord record) {
    setState(() => _lastResult = record);
    _cardAnim.forward(from: 0);
  }

  Future<void> _ensureCamera() async {
    setState(() => _cameraChecking = true);
    var status = await Permission.camera.status;
    if (!status.isGranted) {
      status = await Permission.camera.request();
    }
    if (!mounted) return;
    setState(() {
      _cameraGranted = status.isGranted;
      _cameraChecking = false;
      _cameraError = status.isGranted
          ? null
          : 'Camera permission is required to scan tickets.';
    });
  }

  Future<void> _toggleFlash() async {
    await _controller.toggleTorch();
    setState(() => _flashOn = !_flashOn);
  }

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_processing) return;
    final raw = capture.barcodes.firstOrNull?.rawValue;
    if (raw == null || raw.isEmpty) return;

    setState(() {
      _processing = true;
      _lastResult = null;
    });
    _cardAnim.reset();

    final scanner = context.read<ScannerSessionProvider>();

    try {
      final record = await scanner.scanTicket(raw);
      HapticFeedback.mediumImpact();
      if (mounted) _showResult(record);
    } on AlreadyScannedException catch (e) {
      HapticFeedback.lightImpact();
      if (mounted) {
        ScanToast.alreadyScanned(context, guestName: e.guestName);
      }
    } catch (e) {
      HapticFeedback.heavyImpact();
      if (mounted && scanner.scanHistory.isNotEmpty) {
        final last = scanner.scanHistory.first;
        if (last.declineReason != 'Ticket already scanned') {
          _showResult(last);
        }
      }
    } finally {
      await Future.delayed(const Duration(milliseconds: 1200));
      if (mounted) setState(() => _processing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    const navClearance = 24.0;
    final scanner = context.watch<ScannerSessionProvider>();

    return LayoutBuilder(
      builder: (context, constraints) {
        return SizedBox(
          width: constraints.maxWidth,
          height: constraints.maxHeight,
          child: ColoredBox(
            color: Colors.black,
            child: Stack(
              fit: StackFit.expand,
              children: [
                if (_cameraChecking)
                  const Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        CircularProgressIndicator(color: ScannerTheme.primary),
                        SizedBox(height: 16),
                        Text(
                          'Starting camera…',
                          style: TextStyle(color: Colors.white70, fontSize: 14),
                        ),
                      ],
                    ),
                  )
                else if (_cameraGranted)
                  MobileScanner(
                    controller: _controller,
                    fit: BoxFit.cover,
                    onDetect: _onDetect,
                    errorBuilder: (context, error, _) => _CameraMessage(
                      message: error.errorDetails?.message ??
                          'Could not open the camera.',
                      onRetry: _ensureCamera,
                    ),
                  )
                else
                  _CameraMessage(
                    message: _cameraError ?? 'Camera unavailable',
                    onRetry: _ensureCamera,
                  ),
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
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                        child: Row(
                          children: [
                            _TopCircleBtn(
                              icon: Icons.arrow_back_rounded,
                              onTap: () {
                                final scope = ScannerTabScope.maybeOf(context);
                                if (scope != null) {
                                  scope.goTo(0);
                                } else {
                                  context.go('/scanner/home');
                                }
                              },
                            ),
                            const Spacer(),
                            _FlashPill(on: _flashOn, onTap: _toggleFlash),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      _ScannerContextBar(scanner: scanner),
                      const Spacer(),
                      ScannerScanFrame(lineAnim: _lineAnim),
                      const Spacer(),
                      if (_lastResult == null)
                        Padding(
                          padding: const EdgeInsets.fromLTRB(24, 0, 24, navClearance),
                          child: Column(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 10,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.black.withValues(alpha: 0.45),
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(
                                    color: Colors.white.withValues(alpha: 0.12),
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      Icons.center_focus_strong_rounded,
                                      size: 18,
                                      color: Colors.white.withValues(alpha: 0.85),
                                    ),
                                    const SizedBox(width: 8),
                                    const Text(
                                      'Align QR code inside the frame',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 14),
                              TextButton.icon(
                                onPressed: () => _showManualEntry(context, scanner),
                                icon: const Icon(Icons.keyboard_rounded, size: 18),
                                label: const Text('Enter ticket code'),
                                style: TextButton.styleFrom(
                                  foregroundColor: Colors.white70,
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
                    bottom: navClearance,
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
          ),
        );
      },
    );
  }

  Future<void> _showManualEntry(
    BuildContext context,
    ScannerSessionProvider scanner,
  ) async {
    final ctrl = TextEditingController();
    final submitted = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        final bottom = MediaQuery.viewInsetsOf(ctx).bottom;
        return StatefulBuilder(
          builder: (context, setSheetState) {
            final code = ctrl.text.trim();
            final canSubmit = code.length == 6;

            return Padding(
              padding: EdgeInsets.only(bottom: bottom),
              child: Container(
                margin: const EdgeInsets.all(16),
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text(
                      'Enter ticket code',
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        color: ScannerTheme.textDark,
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Type the 6-digit code printed on the ticket.',
                      style: TextStyle(
                        fontSize: 13,
                        color: ScannerTheme.textMuted,
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: ctrl,
                      autofocus: true,
                      keyboardType: TextInputType.number,
                      textInputAction: TextInputAction.done,
                      maxLength: 6,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      onChanged: (_) => setSheetState(() {}),
                      onSubmitted: canSubmit ? (_) => Navigator.pop(ctx, true) : null,
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 6,
                        color: ScannerTheme.textDark,
                      ),
                      textAlign: TextAlign.center,
                      decoration: InputDecoration(
                        hintText: '000000',
                        counterText: '',
                        filled: true,
                        fillColor: const Color(0xFFF4F6FA),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 14,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: BorderSide.none,
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: BorderSide(
                            color: ScannerTheme.primaryLight,
                          ),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(
                            color: ScannerTheme.primary,
                            width: 1.5,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed:
                          canSubmit ? () => Navigator.pop(ctx, true) : null,
                      style: FilledButton.styleFrom(
                        backgroundColor: ScannerTheme.primary,
                        disabledBackgroundColor:
                            ScannerTheme.primary.withValues(alpha: 0.35),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: const Text(
                        'Verify ticket',
                        style: TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
    if (submitted != true || ctrl.text.trim().length != 6) {
      ctrl.dispose();
      return;
    }

    final raw = ctrl.text.trim();
    ctrl.dispose();
    if (_processing) return;

    setState(() {
      _processing = true;
      _lastResult = null;
    });
    _cardAnim.reset();

    try {
      final record = await scanner.scanTicket(raw);
      HapticFeedback.mediumImpact();
      if (mounted) _showResult(record);
    } catch (_) {
      HapticFeedback.heavyImpact();
      if (mounted && scanner.scanHistory.isNotEmpty) {
        _showResult(scanner.scanHistory.first);
      }
    } finally {
      await Future.delayed(const Duration(seconds: 2));
      if (mounted) setState(() => _processing = false);
    }
  }
}

class _CameraMessage extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _CameraMessage({required this.message, required this.onRetry});

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
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white70, fontSize: 14),
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: onRetry,
              style: FilledButton.styleFrom(
                backgroundColor: ScannerTheme.primary,
              ),
              child: const Text('Allow camera'),
            ),
          ],
        ),
      ),
    );
  }
}

class _TopCircleBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _TopCircleBtn({required this.icon, required this.onTap});

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
          child: Icon(icon, color: ScannerTheme.textDark),
        ),
      ),
    );
  }
}

class _FlashPill extends StatelessWidget {
  final bool on;
  final VoidCallback onTap;

  const _FlashPill({required this.on, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white.withValues(alpha: 0.92),
      borderRadius: BorderRadius.circular(24),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(24),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                on ? Icons.flash_on_rounded : Icons.flash_off_rounded,
                size: 20,
                color: on ? Colors.amber : ScannerTheme.textDark,
              ),
              const SizedBox(width: 6),
              const Text(
                'Flash',
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                  color: ScannerTheme.textDark,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ScannerContextBar extends StatelessWidget {
  final ScannerSessionProvider scanner;

  const _ScannerContextBar({required this.scanner});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Material(
        color: Colors.black.withValues(alpha: 0.55),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: ScannerTheme.primary.withValues(alpha: 0.9),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.qr_code_scanner_rounded,
                  color: Colors.white,
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      scanner.locationName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                        fontSize: 14,
                      ),
                    ),
                    if (scanner.eventTitle.isNotEmpty &&
                        scanner.eventTitle != 'Event')
                      Text(
                        scanner.eventTitle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.72),
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '${scanner.todayScans} today',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
