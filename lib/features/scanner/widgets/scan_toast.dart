import 'dart:async';
import 'package:flutter/material.dart';

/// Small toast for scan-screen alerts (e.g. duplicate scan).
class ScanToast {
  static OverlayEntry? _entry;
  static Timer? _timer;

  static void show(
    BuildContext context, {
    required String message,
    IconData icon = Icons.info_outline_rounded,
    Color? accent,
  }) {
    dismiss();

    final overlay = Overlay.maybeOf(context);
    if (overlay == null) return;

    final color = accent ?? const Color(0xFFE67E22);

    _entry = OverlayEntry(
      builder: (ctx) => Positioned(
        top: MediaQuery.paddingOf(context).top + 12,
        left: 20,
        right: 20,
        child: Material(
          color: Colors.transparent,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.82),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: color.withValues(alpha: 0.45)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.25),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Row(
              children: [
                Icon(icon, size: 18, color: color),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    message,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      height: 1.3,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
    overlay.insert(_entry!);
    _timer = Timer(const Duration(seconds: 2), dismiss);
  }

  static void alreadyScanned(BuildContext context, {String? guestName}) {
    final name = guestName?.trim();
    final msg = name != null && name.isNotEmpty
        ? 'You have scanned $name before'
        : 'You have scanned this ticket before';
    show(
      context,
      message: msg,
      icon: Icons.history_rounded,
      accent: const Color(0xFFE67E22),
    );
  }

  static void dismiss() {
    _timer?.cancel();
    _timer = null;
    _entry?.remove();
    _entry = null;
  }
}
