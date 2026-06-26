import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../core/services/notification_service.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/list_response_utils.dart';

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
  bool _loadingMore = false;
  List<Map<String, dynamic>> _items = [];
  int _page = 1;
  int _lastPage = 1;

  @override
  void initState() {
    super.initState();
    _load(reset: true);
  }

  bool get _hasMore => _page < _lastPage;

  Future<void> _load({bool reset = false}) async {
    if (reset) {
      setState(() {
        _loading = true;
        _page = 1;
      });
    }

    try {
      final response = await _service.getNotifications(
        page: _page,
        perPage: _pageSize,
      );
      final items = parseListItems(response['data'] as List?);
      final meta = response['meta'] as Map<String, dynamic>? ?? {};

      if (mounted) {
        setState(() {
          _items = reset ? items : [..._items, ...items];
          _lastPage = meta['last_page'] ?? meta['total_pages'] ?? 1;
          _loading = false;
          _loadingMore = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          if (reset) _items = [];
          _loading = false;
          _loadingMore = false;
        });
      }
    }
  }

  Future<void> _loadMore() async {
    if (_loadingMore || !_hasMore) return;
    setState(() => _loadingMore = true);
    _page++;
    await _load();
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
                        padding: const EdgeInsets.fromLTRB(12, 12, 12, 8),
                        itemCount: _items.length + 1,
                        separatorBuilder: (_, index) {
                          if (index >= _items.length - 1) {
                            return const SizedBox(height: 8);
                          }
                          return const SizedBox(height: 8);
                        },
                        itemBuilder: (_, i) {
                          if (i == _items.length) {
                            if (!_hasMore) return const SizedBox.shrink();
                            return Padding(
                              padding: const EdgeInsets.only(top: 4, bottom: 8),
                              child: Center(
                                child: _loadingMore
                                    ? const SizedBox(
                                        width: 24,
                                        height: 24,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                        ),
                                      )
                                    : OutlinedButton(
                                        onPressed: _loadMore,
                                        style: OutlinedButton.styleFrom(
                                          foregroundColor: AppColors.primary,
                                          side: const BorderSide(
                                            color: AppColors.primary,
                                          ),
                                          shape: RoundedRectangleBorder(
                                            borderRadius:
                                                BorderRadius.circular(12),
                                          ),
                                        ),
                                        child: const Text('Load more'),
                                      ),
                              ),
                            );
                          }

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
