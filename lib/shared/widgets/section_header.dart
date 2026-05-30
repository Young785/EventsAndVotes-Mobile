import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_spacing.dart';

class SectionHeader extends StatelessWidget {
  final String title;
  final String? actionLabel;
  final String? actionRoute;

  const SectionHeader({
    super.key,
    required this.title,
    this.actionLabel = 'See all',
    this.actionRoute,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: AppSpacing.sectionHeader,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: AppTextStyles.headlineMedium),
          if (actionRoute != null)
            GestureDetector(
              onTap: () => context.go(actionRoute!),
              child: Text(
                actionLabel!,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.primary,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
