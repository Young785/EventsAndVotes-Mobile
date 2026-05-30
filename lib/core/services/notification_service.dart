import '../network/api_client.dart';
import '../utils/list_response_utils.dart';

class NotificationService {
  final ApiClient _apiClient = ApiClient.instance;

  Future<int> getUnreadCount() async {
    try {
      final response =
          await _apiClient.get('/admin/notifications/unread-count');
      final body = response.data;
      if (body is Map) {
        return body['data']?['unread_count'] ??
            body['unread_count'] ??
            0;
      }
      return 0;
    } catch (_) {
      return 0;
    }
  }

  Future<List<Map<String, dynamic>>> getRecent({int limit = 20}) async {
    final response = await _apiClient.get(
      '/admin/notifications/recent',
      params: {'limit': limit},
    );
    final body = response.data;
    if (body is Map && body['data'] is List) {
      return (body['data'] as List)
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList();
    }
    final parsed = parsePaginatedResponse(body);
    return parseListItems(parsed['data'] as List?);
  }

  Future<void> markAsRead(String id) async {
    await _apiClient.put('/admin/notifications/$id/read');
  }

  Future<void> markAllAsRead() async {
    await _apiClient.put('/admin/notifications/mark-all-read');
  }
}
