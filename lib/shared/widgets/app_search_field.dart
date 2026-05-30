import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class AppSearchField extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final ValueChanged<String>? onSubmitted;
  final VoidCallback? onClear;

  const AppSearchField({
    super.key,
    required this.controller,
    required this.hint,
    this.onSubmitted,
    this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    final defaults = Theme.of(context).inputDecorationTheme;

    return TextField(
      controller: controller,
      onSubmitted: onSubmitted,
      style: const TextStyle(fontSize: 14, color: AppColors.textPrimary),
      decoration: InputDecoration(
        hintText: hint,
        prefixIcon: const Icon(Icons.search_rounded, color: AppColors.textHint, size: 20),
        suffixIcon: onClear != null
            ? IconButton(
                icon: const Icon(Icons.close_rounded, size: 18, color: AppColors.textHint),
                onPressed: onClear,
              )
            : null,
      ).applyDefaults(defaults),
    );
  }
}
