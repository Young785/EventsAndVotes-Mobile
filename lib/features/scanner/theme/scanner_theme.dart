import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

/// Scanner portal — white & blue (matches main app).
class ScannerTheme {
  static const Color primary = AppColors.primary;
  static const Color primaryDark = AppColors.primaryDark;
  static const Color primaryLight = AppColors.primarySurface;
  static const Color surface = AppColors.background;
  static const Color textDark = AppColors.textPrimary;
  static const Color textMuted = AppColors.textSecondary;

  static const LinearGradient primaryGradient = AppColors.primaryGradient;

  static BoxDecoration cardDecoration = BoxDecoration(
    color: Colors.white,
    borderRadius: BorderRadius.circular(24),
    boxShadow: [
      BoxShadow(
        color: Colors.black.withValues(alpha: 0.06),
        blurRadius: 20,
        offset: const Offset(0, 8),
      ),
    ],
  );

  static BoxDecoration islandDecoration = BoxDecoration(
    color: Colors.white,
    borderRadius: BorderRadius.circular(32),
    boxShadow: [
      BoxShadow(
        color: Colors.black.withValues(alpha: 0.12),
        blurRadius: 24,
        offset: const Offset(0, 6),
      ),
    ],
  );
}
