import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../core/theme/app_theme.dart';

/// Toggles between list and 2-column grid layout.
class LayoutViewToggle extends StatelessWidget {
  final bool isGrid;
  final ValueChanged<bool> onChanged;

  const LayoutViewToggle({
    super.key,
    required this.isGrid,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => onChanged(!isGrid),
      child: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(14),
          // matches search field — no border
        ),
        child: Center(
          child: HugeIcon(
            icon: isGrid
                ? HugeIcons.strokeRoundedLayoutGrid
                : HugeIcons.strokeRoundedLayoutLeft,
            size: 22,
            color: AppColors.primary,
          ),
        ),
      ),
    );
  }
}
