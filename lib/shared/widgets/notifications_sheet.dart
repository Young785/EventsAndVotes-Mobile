import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../core/services/notification_service.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/list_response_utils.dart';
import 'notification_tile.dart';
import 'shimmer_card.dart';

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
  static const _pageSize = 5;

  final _service = NotificationService();
  bool _loading = true;
  List<Map<String, dynamic>> _items = [];

  @override
  void initState() {
    super.initState();
    _load(reset: true);
  }

  Future<void> _load({bool reset = false}) async {
    if (reset) {
      setState(() => _loading = true);
    }

    try {
      final response = await _service.getNotifications(
        page: 1,
        perPage: _pageSize,
      );
      final items = parseListItems(response['data'] as List?);

      if (mounted) {
        setState(() {
          _items = items;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          if (reset) _items = [];
          _loading = false;
        });
      }
    }
  }

  void _openAll() {
    final onCountChanged = widget.onCountChanged;
    final router = GoRouter.of(context);
    Navigator.pop(context);
    router.push('/notifications').then((_) => onCountChanged?.call());
  }

  Future<void> _markAllRead() async {
    try {
      await _service.markAllAsRead();
      widget.onCountChanged?.call();
      await _load(reset: true);
    } catch (_) {}
  }

  Future<void> _markRead(String id) async {
    try {
      await _service.markAsRead(id);
      widget.onCountChanged?.call();
      final index = _items.indexWhere((n) => n['id']?.toString() == id);
      if (index != -1 && mounted) {
        setState(() {
          _items[index] = Map<String, dynamic>.from(_items[index])
            ..['read_at'] = DateTime.now().toIso8601String();
        });
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final height = MediaQuery.sizeOf(context).height * 0.72;
    return Container(
      height: height,
      decoration: BoxDecoration(
        color: AppPalette.of(context).card,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 10),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppPalette.of(context).border,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 8, 8),
            child: Row(
              children: [
                Expanded(
                  child: Text('Notifications', style: AppTextStyles.tone(AppTextStyles.headlineSmall, context)),
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
                ? const Padding(
                    padding: EdgeInsets.all(16),
                    child: ShimmerList(count: 5, itemHeight: 72),
                  )
                : _items.isEmpty
                    ? Center(
                        child: Text(
                          'No notifications yet',
                          style: AppTextStyles.tone(AppTextStyles.bodyMedium, context, muted: true),
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.fromLTRB(12, 12, 12, 8),
                        itemCount: _items.length + (_items.isEmpty ? 0 : 1),
                        separatorBuilder: (_, index) {
                          if (index >= _items.length - 1) {
                            return const SizedBox(height: 8);
                          }
                          return const SizedBox(height: 8);
                        },
                        itemBuilder: (_, i) {
                          if (i == _items.length) {
                            return Padding(
                              padding: const EdgeInsets.only(top: 4, bottom: 8),
                              child: Center(
                                child: TextButton(
                                  onPressed: _openAll,
                                  child: const Text('View more'),
                                ),
                              ),
                            );
                          }

                          final n = _items[i];
                          final id = n['id']?.toString() ?? '$i';
                          final isUnread = n['read_at'] == null;

                          return NotificationTile(
                            notification: n,
                            onTap: isUnread ? () => _markRead(id) : null,
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
