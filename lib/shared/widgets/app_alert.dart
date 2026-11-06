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

/// Centered confirmation. Returns true only when the confirm button is pressed.
Future<bool> showConfirmModal(
  BuildContext context, {
  required String title,
  required String message,
  String confirmLabel = 'Confirm',
  String cancelLabel = 'Cancel',
  bool destructive = false,
  IconData icon = Icons.help_outline_rounded,
}) async {
  final result = await showGeneralDialog<bool>(
    context: context,
    barrierDismissible: true,
    barrierLabel: 'Dismiss',
    barrierColor: const Color(0xFF0D1B2A).withValues(alpha: 0.55),
    transitionDuration: const Duration(milliseconds: 180),
    pageBuilder: (dialogContext, _, __) {
      return _ConfirmModal(
        title: title,
        message: message,
        confirmLabel: confirmLabel,
        cancelLabel: cancelLabel,
        destructive: destructive,
        icon: icon,
      );
    },
    transitionBuilder: (context, animation, _, child) {
      final curved = CurvedAnimation(parent: animation, curve: Curves.easeOutCubic);
      return FadeTransition(
        opacity: curved,
        child: ScaleTransition(
          scale: Tween<double>(begin: 0.94, end: 1).animate(curved),
          child: child,
        ),
      );
    },
  );
  return result == true;
}

class _ConfirmModal extends StatelessWidget {
  final String title;
  final String message;
  final String confirmLabel;
  final String cancelLabel;
  final bool destructive;
  final IconData icon;

  const _ConfirmModal({
    required this.title,
    required this.message,
    required this.confirmLabel,
    required this.cancelLabel,
    required this.destructive,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final palette = AppPalette.of(context);
    final accent = destructive ? AppColors.error : AppColors.primary;

    return Center(
      child: Material(
        color: Colors.transparent,
        child: Container(
          width: 320,
          margin: const EdgeInsets.symmetric(horizontal: 28),
          padding: const EdgeInsets.fromLTRB(22, 22, 22, 18),
          decoration: BoxDecoration(
            color: palette.card,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.18),
                blurRadius: 32,
                offset: const Offset(0, 16),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: accent.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: accent, size: 26),
              ),
              const SizedBox(height: 14),
              Text(
                title,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: palette.text,
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.2,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                message,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: palette.muted,
                  fontSize: 14,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.of(context).pop(false),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: palette.text,
                        side: BorderSide(color: palette.border),
                        minimumSize: const Size.fromHeight(46),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: Text(
                        cancelLabel,
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: FilledButton(
                      onPressed: () => Navigator.of(context).pop(true),
                      style: FilledButton.styleFrom(
                        backgroundColor: accent,
                        foregroundColor: Colors.white,
                        minimumSize: const Size.fromHeight(46),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: Text(
                        confirmLabel,
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
