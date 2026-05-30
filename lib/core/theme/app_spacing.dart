import 'package:flutter/material.dart';

/// Consistent spacing tokens used across the app.
class AppSpacing {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 20;
  static const double xxl = 24;
  static const double section = 28;

  static const double screenHorizontal = lg;
  static const double cardRadius = 16;
  static const double chipRadius = 20;
  static const double itemGap = md;

  static const EdgeInsets screenPadding =
      EdgeInsets.symmetric(horizontal: screenHorizontal);
  static const EdgeInsets sectionHeader =
      EdgeInsets.fromLTRB(screenHorizontal, xxl, screenHorizontal, md);
}
