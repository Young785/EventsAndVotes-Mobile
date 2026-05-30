import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../core/services/notification_service.dart';
import '../../core/theme/app_theme.dart';

class NotificationsSheet extends StatefulWidget {
  final VoidCallback? onCountChanged;

  const NotificationsSheet({super.key, this.onCountChanged});

  static Future<void> show(
    BuildContext context, {
    VoidCallback? onCountChanged,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => NotificationsSheet(onCountChanged: onCountChanged),
    );
  }

  @override
  State<NotificationsSheet> createState() => _NotificationsSheetState();
}

class _NotificationsSheetState extends State<NotificationsSheet> {
  final _service = NotificationService();
  bool _loading = true;
  List<Map<String, dynamic>> _items = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final items = await _service.getRecent(limit: 30);
      if (mounted) setState(() {
        _items = items;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _markAllRead() async {
    try {
      await _service.markAllAsRead();
      widget.onCountChanged?.call();
      await _load();
    } catch (_) {}
  }

  Future<void> _markRead(String id) async {
    try {
      await _service.markAsRead(id);
      widget.onCountChanged?.call();
      await _load();
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final height = MediaQuery.sizeOf(context).height * 0.72;
    return Container(
      height: height,
      decoration: const BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 10),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.border,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 8, 8),
            child: Row(
              children: [
                const Expanded(
                  child: Text('Notifications', style: AppTextStyles.headlineSmall),
                ),
                TextButton(
                  onPressed: _items.isEmpty ? null : _markAllRead,
                  child: const Text('Mark all read'),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close_rounded),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _items.isEmpty
                    ? const Center(
                        child: Text(
                          'No notifications yet',
                          style: AppTextStyles.bodyMedium,
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.all(12),
                        itemCount: _items.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemBuilder: (_, i) {
                          final n = _items[i];
                          final data = n['data'] is Map
                              ? Map<String, dynamic>.from(n['data'] as Map)
                              : <String, dynamic>{};
                          final title =
                              data['title']?.toString() ?? 'Notification';
                          final message = data['message']?.toString() ?? '';
                          final isUnread = n['read_at'] == null;
                          final created = n['created_at']?.toString() ?? '';
                          final id = n['id']?.toString() ?? '$i';

                          return Material(
                            color: isUnread
                                ? AppColors.primarySurface
                                : AppColors.surfaceVariant,
                            borderRadius: BorderRadius.circular(12),
                            child: InkWell(
                              onTap: isUnread ? () => _markRead(id) : null,
                              borderRadius: BorderRadius.circular(12),
                              child: Padding(
                                padding: const EdgeInsets.all(12),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Icon(
                                      Icons.notifications_rounded,
                                      color: isUnread
                                          ? AppColors.primary
                                          : AppColors.textHint,
                                      size: 22,
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            title,
                                            style: TextStyle(
                                              fontWeight: isUnread
                                                  ? FontWeight.w700
                                                  : FontWeight.w500,
                                              fontSize: 14,
                                            ),
                                          ),
                                          if (message.isNotEmpty) ...[
                                            const SizedBox(height: 4),
                                            Text(
                                              message,
                                              style: const TextStyle(
                                                fontSize: 12,
                                                color: AppColors.textSecondary,
                                              ),
                                            ),
                                          ],
                                          if (created.isNotEmpty) ...[
                                            const SizedBox(height: 6),
                                            Text(
                                              timeago.format(
                                                DateTime.tryParse(created) ??
                                                    DateTime.now(),
                                              ),
                                              style: const TextStyle(
                                                fontSize: 10,
                                                color: AppColors.textHint,
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                    if (isUnread)
                                      Container(
                                        width: 8,
                                        height: 8,
                                        decoration: const BoxDecoration(
                                          color: AppColors.primary,
                                          shape: BoxShape.circle,
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                            ),
                          )
                              .animate()
                              .fadeIn(delay: (i * 30).ms, duration: 250.ms)
                              .slideY(begin: 0.05, end: 0);
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
