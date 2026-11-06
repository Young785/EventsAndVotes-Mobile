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
    final colors = AppPalette.of(context);
    final defaults = Theme.of(context).inputDecorationTheme;

    return TextField(
      controller: controller,
      onSubmitted: onSubmitted,
      style: TextStyle(fontSize: 14, color: colors.text),
      decoration: InputDecoration(
        hintText: hint,
        prefixIcon: Icon(Icons.search_rounded, color: colors.muted, size: 20),
        suffixIcon: onClear != null
            ? IconButton(
                icon: Icon(Icons.close_rounded, size: 18, color: colors.muted),
                onPressed: onClear,
              )
            : null,
      ).applyDefaults(defaults),
    );
  }
}
