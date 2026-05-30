import 'package:flutter/material.dart';
import '../theme/scanner_theme.dart';

/// 3D-style cartoon bouncer avatar for gate staff profile.
class BouncerAvatar extends StatelessWidget {
  final double size;

  const BouncerAvatar({super.key, this.size = 64});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.center,
        children: [
          // Ground shadow
          Positioned(
            bottom: 2,
            child: Container(
              width: size * 0.62,
              height: size * 0.12,
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.18),
                borderRadius: BorderRadius.circular(20),
              ),
            ),
          ),
          // Outer glow ring
          Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Colors.white.withValues(alpha: 0.45),
                  Colors.white.withValues(alpha: 0.08),
                ],
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.22),
                  blurRadius: 12,
                  offset: Offset(0, size * 0.08),
                ),
              ],
            ),
            padding: EdgeInsets.all(size * 0.04),
            child: ClipOval(
              child: CustomPaint(
                painter: _BouncerPainter(),
                size: Size.square(size * 0.92),
              ),
            ),
          ),
          // Ear-piece detail
          Positioned(
            right: size * 0.06,
            top: size * 0.34,
            child: Container(
              width: size * 0.09,
              height: size * 0.14,
              decoration: BoxDecoration(
                color: const Color(0xFF2C3E50),
                borderRadius: BorderRadius.circular(4),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.3),
                    blurRadius: 2,
                    offset: const Offset(1, 1),
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

class _BouncerPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final cx = w / 2;

    // Background
    final bg = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          const Color(0xFF5DADE2),
          ScannerTheme.primary.withValues(alpha: 0.85),
        ],
      ).createShader(Rect.fromLTWH(0, 0, w, h));
    canvas.drawRect(Rect.fromLTWH(0, 0, w, h), bg);

    // Body / suit
    final bodyPath = Path()
      ..moveTo(cx - w * 0.28, h * 0.92)
      ..lineTo(cx - w * 0.22, h * 0.58)
      ..lineTo(cx - w * 0.30, h * 0.50)
      ..lineTo(cx - w * 0.26, h * 0.42)
      ..lineTo(cx + w * 0.26, h * 0.42)
      ..lineTo(cx + w * 0.30, h * 0.50)
      ..lineTo(cx + w * 0.22, h * 0.58)
      ..lineTo(cx + w * 0.28, h * 0.92)
      ..close();

    canvas.drawPath(
      bodyPath,
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
          colors: const [Color(0xFF1C2833), Color(0xFF2C3E50), Color(0xFF1C2833)],
        ).createShader(Rect.fromLTWH(0, h * 0.42, w, h * 0.5)),
    );

    // White shirt V
    final shirt = Path()
      ..moveTo(cx, h * 0.48)
      ..lineTo(cx - w * 0.06, h * 0.58)
      ..lineTo(cx + w * 0.06, h * 0.58)
      ..close();
    canvas.drawPath(shirt, Paint()..color = Colors.white);

    // Tie
    canvas.drawPath(
      Path()
        ..moveTo(cx, h * 0.48)
        ..lineTo(cx - w * 0.025, h * 0.72)
        ..lineTo(cx + w * 0.025, h * 0.72)
        ..close(),
      Paint()..color = const Color(0xFFE74C3C),
    );

    // Crossed arms
    final armPaint = Paint()
      ..color = const Color(0xFF17202A)
      ..style = PaintingStyle.stroke
      ..strokeWidth = w * 0.11
      ..strokeCap = StrokeCap.round;

    canvas.drawLine(
      Offset(cx - w * 0.32, h * 0.54),
      Offset(cx + w * 0.08, h * 0.62),
      armPaint,
    );
    canvas.drawLine(
      Offset(cx + w * 0.32, h * 0.54),
      Offset(cx - w * 0.08, h * 0.62),
      armPaint,
    );

    // Head
    final headCenter = Offset(cx, h * 0.30);
    final headR = w * 0.19;

    canvas.drawCircle(
      Offset(headCenter.dx + 2, headCenter.dy + 3),
      headR,
      Paint()..color = Colors.black.withValues(alpha: 0.15),
    );

    canvas.drawCircle(
      headCenter,
      headR,
      Paint()
        ..shader = RadialGradient(
          center: const Alignment(-0.3, -0.4),
          colors: const [Color(0xFFFAD7A0), Color(0xFFE0AC69)],
        ).createShader(
          Rect.fromCircle(center: headCenter, radius: headR),
        ),
    );

    // Buzz cut / hair
    canvas.drawArc(
      Rect.fromCircle(center: headCenter, radius: headR * 0.98),
      3.4,
      2.8,
      false,
      Paint()
        ..color = const Color(0xFF1B2631)
        ..style = PaintingStyle.stroke
        ..strokeWidth = headR * 0.55
        ..strokeCap = StrokeCap.round,
    );

    // Sunglasses
    final lensR = headR * 0.28;
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromCenter(
          center: Offset(cx - headR * 0.38, headCenter.dy + headR * 0.05),
          width: lensR * 2.1,
          height: lensR * 1.5,
        ),
        Radius.circular(lensR * 0.4),
      ),
      Paint()..color = const Color(0xFF1A1A2E),
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromCenter(
          center: Offset(cx + headR * 0.38, headCenter.dy + headR * 0.05),
          width: lensR * 2.1,
          height: lensR * 1.5,
        ),
        Radius.circular(lensR * 0.4),
      ),
      Paint()..color = const Color(0xFF1A1A2E),
    );
    canvas.drawLine(
      Offset(cx - headR * 0.15, headCenter.dy + headR * 0.05),
      Offset(cx + headR * 0.15, headCenter.dy + headR * 0.05),
      Paint()
        ..color = const Color(0xFF111111)
        ..strokeWidth = 2,
    );

    // Lens shine
    for (final dx in [-headR * 0.38, headR * 0.38]) {
      canvas.drawCircle(
        Offset(cx + dx - lensR * 0.35, headCenter.dy + headR * 0.05 - lensR * 0.2),
        lensR * 0.18,
        Paint()..color = Colors.white.withValues(alpha: 0.35),
      );
    }

    // Stern mouth
    canvas.drawLine(
      Offset(cx - headR * 0.22, headCenter.dy + headR * 0.42),
      Offset(cx + headR * 0.22, headCenter.dy + headR * 0.42),
      Paint()
        ..color = const Color(0xFFC0392B)
        ..strokeWidth = 2.2
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
