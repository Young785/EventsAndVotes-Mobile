import 'dart:math' as math;

import 'package:flutter/material.dart';

/// Same ring as the web `.spinner`: light track, blue arc, two-second spin.
class AppLoader extends StatefulWidget {
  final double size;
  final double strokeWidth;
  final Color color;
  final Color trackColor;

  const AppLoader({
    super.key,
    this.size = 40,
    this.strokeWidth = 4,
    this.color = const Color(0xFF3498DB),
    this.trackColor = const Color(0xFFF3F3F3),
  });

  @override
  State<AppLoader> createState() => _AppLoaderState();
}

class _AppLoaderState extends State<AppLoader>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 2),
  )..repeat();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return RotationTransition(
      turns: _controller,
      child: CustomPaint(
        size: Size.square(widget.size),
        painter: _SpinnerPainter(
          color: widget.color,
          trackColor: widget.trackColor,
          strokeWidth: widget.strokeWidth,
        ),
      ),
    );
  }
}

class _SpinnerPainter extends CustomPainter {
  final Color color;
  final Color trackColor;
  final double strokeWidth;

  _SpinnerPainter({
    required this.color,
    required this.trackColor,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final arc = rect.deflate(strokeWidth / 2);
    final track = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..color = trackColor;
    final head = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round
      ..color = color;
    canvas.drawArc(arc, 0, math.pi * 2, false, track);
    canvas.drawArc(arc, -math.pi / 2, math.pi / 2, false, head);
  }

  @override
  bool shouldRepaint(covariant _SpinnerPainter oldDelegate) =>
      oldDelegate.color != color ||
      oldDelegate.trackColor != trackColor ||
      oldDelegate.strokeWidth != strokeWidth;
}
