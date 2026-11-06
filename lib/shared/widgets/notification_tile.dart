import 'package:flutter/material.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../core/theme/app_theme.dart';

class NotificationTile extends StatelessWidget {
  final Map<String, dynamic> notification;
  final VoidCallback? onTap;

  const NotificationTile({
    super.key,
    required this.notification,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final data = notification['data'] is Map
        ? Map<String, dynamic>.from(notification['data'] as Map)
        : <String, dynamic>{};
    final title = data['title']?.toString() ?? 'Notification';
    final message = data['message']?.toString() ?? '';
    final isUnread = notification['read_at'] == null;
    final created = notification['created_at']?.toString() ?? '';
    final palette = AppPalette.of(context);

    return Material(
      color: isUnread
          ? AppColors.primary.withValues(alpha: 0.16)
          : palette.raised,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                Icons.notifications_rounded,
                color: isUnread ? AppColors.primary : AppColors.textHint,
                size: 22,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontWeight: isUnread ? FontWeight.w700 : FontWeight.w500,
                        fontSize: 14,
                        color: palette.text,
                      ),
                    ),
                    if (message.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        message,
                        style: TextStyle(fontSize: 12, color: palette.muted),
                      ),
                    ],
                    if (created.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text(
                        timeago.format(DateTime.tryParse(created) ?? DateTime.now()),
                        style: TextStyle(fontSize: 10, color: palette.muted),
                      ),
                    ],
                  ],
                ),
              ),
              if (isUnread)
                Container(
                  width: 8,
                  height: 8,
                  margin: const EdgeInsets.only(top: 4),
                  decoration: const BoxDecoration(
                    color: AppColors.primary,
                    shape: BoxShape.circle,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
