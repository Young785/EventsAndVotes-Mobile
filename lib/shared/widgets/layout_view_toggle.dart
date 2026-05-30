import 'package:flutter/material.dart';
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
    return Material(
      color: AppColors.white,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: () => onChanged(!isGrid),
        borderRadius: BorderRadius.circular(12),
        child: Container(
          width: 42,
          height: 38,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
          ),
          child: Icon(
            isGrid ? Icons.view_list_rounded : Icons.grid_view_rounded,
            size: 20,
            color: AppColors.primary,
          ),
        ),
      ),
    );
  }
}
