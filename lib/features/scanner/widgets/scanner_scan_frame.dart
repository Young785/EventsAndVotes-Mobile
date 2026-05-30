import 'package:flutter/material.dart';
import '../theme/scanner_theme.dart';

/// Animated QR scan viewport with rounded border and corner brackets.
class ScannerScanFrame extends StatelessWidget {
  final AnimationController lineAnim;
  final double size;

  const ScannerScanFrame({
    super.key,
    required this.lineAnim,
    this.size = 260,
  });

  static const _radius = 28.0;
  static const _cornerLen = 40.0;
  static const _stroke = 3.5;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Rounded outer frame
          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(_radius),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.22),
                width: 1.5,
              ),
            ),
          ),
          // Rounded corner accents
          _RoundedCornerBracket(
            alignment: Alignment.topLeft,
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(_radius),
            ),
            showTop: true,
            showLeft: true,
          ),
          _RoundedCornerBracket(
            alignment: Alignment.topRight,
            borderRadius: const BorderRadius.only(
              topRight: Radius.circular(_radius),
            ),
            showTop: true,
            showRight: true,
          ),
          _RoundedCornerBracket(
            alignment: Alignment.bottomLeft,
            borderRadius: const BorderRadius.only(
              bottomLeft: Radius.circular(_radius),
            ),
            showBottom: true,
            showLeft: true,
          ),
          _RoundedCornerBracket(
            alignment: Alignment.bottomRight,
            borderRadius: const BorderRadius.only(
              bottomRight: Radius.circular(_radius),
            ),
            showBottom: true,
            showRight: true,
          ),
          // Scan line clipped to rounded frame
          ClipRRect(
            borderRadius: BorderRadius.circular(_radius),
            child: AnimatedBuilder(
              animation: lineAnim,
              builder: (_, __) {
                return Align(
                  alignment: Alignment(0, -1 + lineAnim.value * 2),
                  child: Container(
                    width: size * 0.78,
                    height: 2.5,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Colors.transparent,
                          ScannerTheme.primary,
                          Colors.transparent,
                        ],
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: ScannerTheme.primary.withValues(alpha: 0.85),
                          blurRadius: 10,
                          spreadRadius: 1,
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _RoundedCornerBracket extends StatelessWidget {
  final Alignment alignment;
  final BorderRadius borderRadius;
  final bool showTop;
  final bool showBottom;
  final bool showLeft;
  final bool showRight;

  const _RoundedCornerBracket({
    required this.alignment,
    required this.borderRadius,
    this.showTop = false,
    this.showBottom = false,
    this.showLeft = false,
    this.showRight = false,
  });

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: alignment,
      child: Container(
        width: ScannerScanFrame._cornerLen,
        height: ScannerScanFrame._cornerLen,
        decoration: BoxDecoration(
          borderRadius: borderRadius,
          border: Border(
            top: showTop
                ? const BorderSide(color: Colors.white, width: ScannerScanFrame._stroke)
                : BorderSide.none,
            bottom: showBottom
                ? const BorderSide(color: Colors.white, width: ScannerScanFrame._stroke)
                : BorderSide.none,
            left: showLeft
                ? const BorderSide(color: Colors.white, width: ScannerScanFrame._stroke)
                : BorderSide.none,
            right: showRight
                ? const BorderSide(color: Colors.white, width: ScannerScanFrame._stroke)
                : BorderSide.none,
          ),
        ),
      ),
    );
  }
}
