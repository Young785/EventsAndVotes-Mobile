import 'dart:async';
import 'package:flutter/material.dart';
import '../models/migration_record.dart';
import '../theme/scanner_theme.dart';

/// Floating toast with a 3D-style cloud mascot for migration events.
class MigrationToast {
  static OverlayEntry? _entry;
  static Timer? _timer;

  static void show(BuildContext context, {required MigrationRecord record}) {
    dismiss();

    final overlay = Overlay.maybeOf(context);
    if (overlay == null) return;

    _entry = OverlayEntry(
      builder: (ctx) => _MigrationToastOverlay(
        record: record,
        onDismiss: dismiss,
      ),
    );
    overlay.insert(_entry!);

    _timer = Timer(const Duration(seconds: 4), dismiss);
  }

  static void dismiss() {
    _timer?.cancel();
    _timer = null;
    _entry?.remove();
    _entry = null;
  }
}

class _MigrationToastOverlay extends StatefulWidget {
  final MigrationRecord record;
  final VoidCallback onDismiss;

  const _MigrationToastOverlay({
    required this.record,
    required this.onDismiss,
  });

  @override
  State<_MigrationToastOverlay> createState() => _MigrationToastOverlayState();
}

class _MigrationToastOverlayState extends State<_MigrationToastOverlay>
    with SingleTickerProviderStateMixin {
  late final AnimationController _anim;
  late final Animation<double> _scale;
  late final Animation<double> _fade;

  @override
  void initState() {
    super.initState();
    _anim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 480),
    );
    _scale = CurvedAnimation(parent: _anim, curve: Curves.elasticOut);
    _fade = CurvedAnimation(
      parent: _anim,
      curve: const Interval(0, 0.5, curve: Curves.easeOut),
    );
    _anim.forward();
  }

  @override
  void dispose() {
    _anim.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.paddingOf(context).bottom + 88;
    final success = widget.record.isSuccess;
    final failed = widget.record.status == MigrationStatus.failed;
    final accent = failed
        ? const Color(0xFFE74C3C)
        : success
            ? ScannerTheme.primary
            : const Color(0xFFE67E22);

    final title = failed
        ? 'Upload failed'
        : success
            ? 'Synced to database!'
            : 'Partially uploaded';

    final subtitle = widget.record.message ??
        (success
            ? '${widget.record.uploadedCount} scan${widget.record.uploadedCount == 1 ? '' : 's'} saved'
            : 'Could not reach the server');

    return Positioned(
      left: 16,
      right: 16,
      bottom: bottom,
      child: FadeTransition(
        opacity: _fade,
        child: ScaleTransition(
          scale: _scale,
          child: Material(
            color: Colors.transparent,
            child: GestureDetector(
              onTap: widget.onDismiss,
              child: Container(
                padding: const EdgeInsets.fromLTRB(14, 14, 16, 14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: accent.withValues(alpha: 0.2)),
                  boxShadow: [
                    BoxShadow(
                      color: accent.withValues(alpha: 0.18),
                      blurRadius: 24,
                      offset: const Offset(0, 8),
                    ),
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.06),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    _CloudMascot(success: success, failed: failed),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            title,
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: accent,
                              letterSpacing: -0.2,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            subtitle,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 12,
                              height: 1.3,
                              color: ScannerTheme.textMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Icon(Icons.close_rounded, size: 18, color: Colors.grey.shade400),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _CloudMascot extends StatelessWidget {
  final bool success;
  final bool failed;

  const _CloudMascot({required this.success, required this.failed});

  @override
  Widget build(BuildContext context) {
    final faceColor = failed
        ? const Color(0xFFFF6B6B)
        : success
            ? ScannerTheme.primary
            : const Color(0xFFF39C12);

    return SizedBox(
      width: 56,
      height: 56,
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.center,
        children: [
          // 3D depth shadow
          Positioned(
            top: 8,
            child: Container(
              width: 46,
              height: 38,
              decoration: BoxDecoration(
                color: faceColor.withValues(alpha: 0.25),
                borderRadius: BorderRadius.circular(20),
              ),
            ),
          ),
          // Main cloud body
          Container(
            width: 50,
            height: 42,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Colors.white,
                  faceColor.withValues(alpha: 0.15),
                ],
              ),
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: faceColor.withValues(alpha: 0.35), width: 1.5),
              boxShadow: [
                BoxShadow(
                  color: faceColor.withValues(alpha: 0.35),
                  blurRadius: 10,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Cheeks
                Positioned(
                  left: 8,
                  bottom: 12,
                  child: Container(
                    width: 8,
                    height: 5,
                    decoration: BoxDecoration(
                      color: faceColor.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ),
                Positioned(
                  right: 8,
                  bottom: 12,
                  child: Container(
                    width: 8,
                    height: 5,
                    decoration: BoxDecoration(
                      color: faceColor.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ),
                // Eyes
                Positioned(
                  top: 13,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _Eye(open: !failed),
                      const SizedBox(width: 10),
                      _Eye(open: !failed),
                    ],
                  ),
                ),
                // Mouth
                Positioned(
                  bottom: 10,
                  child: Icon(
                    success
                        ? Icons.sentiment_very_satisfied_rounded
                        : failed
                            ? Icons.sentiment_dissatisfied_rounded
                            : Icons.sentiment_neutral_rounded,
                    size: 16,
                    color: faceColor,
                  ),
                ),
              ],
            ),
          ),
          // Floating upload badge
          Positioned(
            top: -2,
            right: -2,
            child: Container(
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [faceColor, faceColor.withValues(alpha: 0.75)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: faceColor.withValues(alpha: 0.4),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Icon(
                success ? Icons.cloud_done_rounded : Icons.cloud_off_rounded,
                size: 13,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Eye extends StatelessWidget {
  final bool open;

  const _Eye({required this.open});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 7,
      height: open ? 9 : 3,
      decoration: BoxDecoration(
        color: ScannerTheme.textDark,
        borderRadius: BorderRadius.circular(4),
      ),
    );
  }
}
