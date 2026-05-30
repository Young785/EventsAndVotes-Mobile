import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/scanner_theme.dart';

/// Animated check or X when scan result appears.
class ScanStatusBadge extends StatelessWidget {
  final bool approved;
  final double size;

  const ScanStatusBadge({
    super.key,
    required this.approved,
    this.size = 56,
  });

  @override
  Widget build(BuildContext context) {
    final color = approved ? ScannerTheme.primary : const Color(0xFFE74C3C);
    final bg = approved ? ScannerTheme.primaryLight : const Color(0xFFFFECEC);

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: bg,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.35),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Icon(
        approved ? Icons.check_rounded : Icons.close_rounded,
        color: color,
        size: size * 0.5,
      ),
    )
        .animate()
        .scale(
          begin: const Offset(0, 0),
          end: const Offset(1, 1),
          duration: 450.ms,
          curve: Curves.elasticOut,
        )
        .fadeIn(duration: 200.ms);
  }
}
