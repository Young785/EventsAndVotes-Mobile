import 'package:flutter/material.dart';
import '../../../core/services/notification_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/list_response_utils.dart';
import '../../../shared/widgets/detail_back_button.dart';
import '../../../shared/widgets/notification_tile.dart';
import '../../../shared/widgets/shimmer_card.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  static const _pageSize = 20;

  final _service = NotificationService();
  final _scroll = ScrollController();
  bool _loading = true;
  bool _loadingMore = false;
  List<Map<String, dynamic>> _items = [];
  int _page = 1;
  int _lastPage = 1;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_onScroll);
    _load(reset: true);
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  bool get _hasMore => _page < _lastPage;

  void _onScroll() {
    if (!_scroll.hasClients || _loading || _loadingMore || !_hasMore) return;
    if (_scroll.position.pixels > _scroll.position.maxScrollExtent - 240) {
      _loadMore();
    }
  }

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
      if (!mounted) return;
      setState(() {
        _items = reset ? items : [..._items, ...items];
        _lastPage = meta['last_page'] ?? meta['total_pages'] ?? 1;
        _loading = false;
        _loadingMore = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        if (reset) _items = [];
        _loading = false;
        _loadingMore = false;
      });
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
      await _load(reset: true);
    } catch (_) {}
  }

  Future<void> _markRead(String id) async {
    try {
      await _service.markAsRead(id);
      final index = _items.indexWhere((n) => n['id']?.toString() == id);
      if (index == -1 || !mounted) return;
      setState(() {
        _items[index] = Map<String, dynamic>.from(_items[index])
          ..['read_at'] = DateTime.now().toIso8601String();
      });
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final palette = AppPalette.of(context);
    return Scaffold(
      backgroundColor: palette.background,
      body: Column(
        children: [
          const CenteredPageHeader(title: 'Notifications'),
          Align(
            alignment: Alignment.centerRight,
            child: Padding(
              padding: const EdgeInsets.only(right: 8),
              child: TextButton(
                onPressed: _items.isEmpty ? null : _markAllRead,
                child: const Text('Mark all read'),
              ),
            ),
          ),
          Expanded(
            child: _loading
                ? const Padding(
                    padding: EdgeInsets.all(16),
                    child: ShimmerList(count: 6, itemHeight: 72),
                  )
                : RefreshIndicator(
                    color: AppColors.primary,
                    onRefresh: () => _load(reset: true),
                    child: _items.isEmpty
                        ? ListView(
                            physics: const AlwaysScrollableScrollPhysics(),
                            children: [
                              SizedBox(height: MediaQuery.sizeOf(context).height * 0.28),
                              Center(
                                child: Text(
                                  'No notifications yet',
                                  style: AppTextStyles.tone(
                                    AppTextStyles.bodyMedium,
                                    context,
                                    muted: true,
                                  ),
                                ),
                              ),
                            ],
                          )
                        : ListView.separated(
                            controller: _scroll,
                            physics: const AlwaysScrollableScrollPhysics(),
                            padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
                            itemCount: _items.length + (_loadingMore ? 1 : 0),
                            separatorBuilder: (_, __) => const SizedBox(height: 8),
                            itemBuilder: (_, i) {
                              if (i >= _items.length) {
                                return const Padding(
                                  padding: EdgeInsets.symmetric(vertical: 12),
                                  child: Center(
                                    child: SizedBox(
                                      width: 22,
                                      height: 22,
                                      child: CircularProgressIndicator(strokeWidth: 2),
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
                              );
                            },
                          ),
                  ),
          ),
        ],
      ),
    );
  }
}
