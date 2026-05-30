import 'package:dio/dio.dart';
import '../network/api_client.dart';

class AdminService {
  final ApiClient _api = ApiClient.instance;

  String _handleError(dynamic e, String defaultMessage) {
    if (e is DioException && e.response?.data is Map) {
      final data = e.response!.data as Map;
      if (data['message'] != null) return data['message'].toString();
    }
    return defaultMessage;
  }

  Future<Map<String, dynamic>> getDashboardStats() async {
    final response = await _api.get('/admin/dashboard/stats');
    return Map<String, dynamic>.from(response.data['data'] ?? response.data);
  }

  Future<Map<String, dynamic>> getEvents({int page = 1, String? search}) async {
    final params = <String, dynamic>{'page': page};
    if (search != null) params['search'] = search;
    final response = await _api.get('/admin/events', params: params);
    return Map<String, dynamic>.from(response.data);
  }

  Future<Map<String, dynamic>> getEvent(String id) async {
    final response = await _api.get('/admin/events/$id');
    return Map<String, dynamic>.from(response.data['data'] ?? response.data);
  }

  Future<Map<String, dynamic>> createEvent(Map<String, dynamic> data) async {
    final response = await _api.post('/admin/events', data: data);
    return Map<String, dynamic>.from(response.data['data'] ?? response.data);
  }

  Future<Map<String, dynamic>> updateEvent(
    String id,
    Map<String, dynamic> data,
  ) async {
    final response = await _api.put('/admin/events/$id', data: data);
    return Map<String, dynamic>.from(response.data['data'] ?? response.data);
  }

  Future<void> publishEvent(String id) async {
    await _api.post('/admin/events/$id/publish');
  }

  Future<Map<String, dynamic>> getEventAnalytics(String id) async {
    final response = await _api.get('/admin/events/$id/analytics');
    return Map<String, dynamic>.from(response.data['data'] ?? response.data);
  }

  Future<List<dynamic>> getTicketTemplates() async {
    final response = await _api.get('/admin/events/ticket-templates');
    return response.data['data'] as List? ?? [];
  }

  Future<List<dynamic>> getScanLocations(String eventId) async {
    final response = await _api.get('/admin/events/$eventId/scan-locations');
    return response.data['data'] as List? ?? [];
  }

  Future<Map<String, dynamic>> createScanLocation(
    String eventId,
    Map<String, dynamic> data,
  ) async {
    final response = await _api.post(
      '/admin/events/$eventId/scan-locations',
      data: data,
    );
    return Map<String, dynamic>.from(response.data['data'] ?? response.data);
  }

  Future<Map<String, dynamic>> createScanUser(
    String locationId,
    Map<String, dynamic> data,
  ) async {
    try {
      final response = await _api.post(
        '/admin/scan-locations/$locationId/users',
        data: data,
      );
      return Map<String, dynamic>.from(response.data['data'] ?? response.data);
    } catch (e) {
      throw Exception(_handleError(e, 'Failed to create scan user'));
    }
  }

  Future<Map<String, dynamic>> regenerateScanToken(
    String locationId,
    String userId,
  ) async {
    try {
      final response = await _api.post(
        '/admin/scan-locations/$locationId/users/$userId/regenerate-token',
      );
      return Map<String, dynamic>.from(response.data['data'] ?? response.data);
    } catch (e) {
      throw Exception(_handleError(e, 'Failed to regenerate token'));
    }
  }
}
