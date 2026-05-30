import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class AppTextField extends StatelessWidget {
  final String label;
  final String? hint;
  final TextEditingController? controller;
  final bool obscureText;
  final TextInputType keyboardType;
  final String? Function(String?)? validator;
  final Widget? suffix;
  final Widget? prefix;
  final int maxLines;
  final int? maxLength;
  final TextAlign textAlign;
  final TextStyle? style;
  final TextStyle? hintStyle;
  final bool readOnly;
  final VoidCallback? onTap;
  final void Function(String)? onChanged;

  const AppTextField({
    super.key,
    required this.label,
    this.hint,
    this.controller,
    this.obscureText = false,
    this.keyboardType = TextInputType.text,
    this.validator,
    this.suffix,
    this.prefix,
    this.maxLines = 1,
    this.maxLength,
    this.textAlign = TextAlign.start,
    this.style,
    this.hintStyle,
    this.readOnly = false,
    this.onTap,
    this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          validator: validator,
          maxLines: maxLines,
          maxLength: maxLength,
          textAlign: textAlign,
          readOnly: readOnly,
          onTap: onTap,
          onChanged: onChanged,
          style: style ??
              const TextStyle(
                fontSize: 15,
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w500,
              ),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: hintStyle,
            suffixIcon: suffix,
            prefixIcon: prefix,
            counterText: maxLength != null ? '' : null,
          ).applyDefaults(Theme.of(context).inputDecorationTheme),
        ),
      ],
    );
  }
}
