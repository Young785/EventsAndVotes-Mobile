import 'package:dio/dio.dart';
import '../network/api_client.dart';
import '../utils/list_response_utils.dart';

class EventsService {
  final ApiClient _apiClient = ApiClient.instance;

  Future<Map<String, dynamic>> getEvents({
    String? status,
    int? page,
    String? search,
  }) async {
    final params = <String, dynamic>{};
    if (status != null && status.isNotEmpty) params['status'] = status;
    if (page != null) params['page'] = page;
    if (search != null && search.isNotEmpty) params['search'] = search;

    try {
      final response = await _apiClient.get('/events', params: params);
      return parsePaginatedResponse(response.data);
    } on DioException catch (e) {
      final code = e.response?.statusCode;
      if (code == 401 || code == 403) {
        return _getPublicEvents(status: status, page: page, search: search);
      }
      throw Exception('Failed to load events: ${e.message}');
    } catch (e) {
      throw Exception('Failed to load events: $e');
    }
  }

  Future<Map<String, dynamic>> _getPublicEvents({
    String? status,
    int? page,
    String? search,
  }) async {
    final params = <String, dynamic>{};
    if (page != null) params['page'] = page;
    if (search != null && search.isNotEmpty) params['search'] = search;

    String path = '/events/upcoming';
    switch (status) {
      case 'active':
        path = '/events/ongoing';
        break;
      case 'completed':
        path = '/events/past';
        break;
      case 'upcoming':
      case 'draft':
        path = '/events/upcoming';
        break;
      default:
        path = '/events/upcoming';
    }

    final response = await _apiClient.get(path, params: params);
    return parsePaginatedResponse(response.data);
  }

  Future<Map<String, dynamic>> getEventDetails(String eventId) async {
    try {
      final response = await _apiClient.get('/events/$eventId');
      return response.data['data'] ?? response.data ?? {};
    } catch (e) {
      throw Exception('Failed to load event details: $e');
    }
  }

  Future<Map<String, dynamic>> purchaseTickets({
    required String eventId,
    required List<Map<String, dynamic>> tickets,
    required String customerName,
    required String customerEmail,
    String? customerPhone,
  }) async {
    try {
      final data = {
        'event_id': eventId,
        'tickets': tickets,
        'customer_name': customerName,
        'customer_email': customerEmail,
        if (customerPhone != null) 'customer_phone': customerPhone,
      };

      final response = await _apiClient.post('/tickets/purchase', data: data);
      return response.data;
    } catch (e) {
      throw Exception('Failed to purchase tickets: $e');
    }
  }
}
