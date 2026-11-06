import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

/// Shows a short alert at the top of the screen.
/// Success is green, problems are red, prompts are amber, everything else is blue.
void showTopAlert(BuildContext context, SnackBar snack) {
  final message = _messageOf(snack.content);
  final color = _colorFor(message, snack.backgroundColor);
  final onColor = color == AppColors.warning ? const Color(0xFF1F2937) : Colors.white;
  final media = MediaQuery.of(context);
  final bottomGap = media.size.height - media.padding.top - 78;

  final messenger = ScaffoldMessenger.of(context);
  messenger.clearSnackBars();
  messenger.showSnackBar(
    SnackBar(
      content: DefaultTextStyle(
        style: TextStyle(
          color: onColor,
          fontSize: 14,
          fontWeight: FontWeight.w600,
          height: 1.3,
        ),
        child: IconTheme(
          data: IconThemeData(color: onColor),
          child: snack.content,
        ),
      ),
      backgroundColor: color,
      behavior: SnackBarBehavior.floating,
      margin: EdgeInsets.fromLTRB(16, 0, 16, bottomGap),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      elevation: 4,
      duration: snack.duration,
      action: snack.action,
      hitTestBehavior: HitTestBehavior.deferToChild,
    ),
  );
}

String _messageOf(Widget widget) {
  if (widget is Text) {
    return widget.data ?? widget.textSpan?.toPlainText() ?? '';
  }
  return '';
}

Color _colorFor(String message, Color? given) {
  if (given != null &&
      given != Colors.black &&
      given != const Color(0xFF323232) &&
      given.a > 0) {
    return given;
  }
  final text = message.toLowerCase();
  if (text.contains('fail') ||
      text.contains('error') ||
      text.contains('could not') ||
      text.contains('invalid') ||
      text.contains('wrong') ||
      text.contains('unable')) {
    return AppColors.error;
  }
  if (text.contains('success') ||
      text.contains('copied') ||
      text.contains('saved') ||
      text.contains('updated') ||
      text.contains('changed') ||
      text.contains('sent')) {
    return AppColors.success;
  }
  if (text.contains('choose') ||
      text.contains('please') ||
      text.contains('wait') ||
      text.contains('required')) {
    return AppColors.warning;
  }
  return AppColors.primary;
}
