import 'dart:typed_data';
import 'package:dio/dio.dart';
import '../network/api_client.dart';
import '../utils/api_response_utils.dart';

class TicketsService {
  final ApiClient _api = ApiClient.instance;

  String _handleError(dynamic e, String defaultMessage) =>
      parseApiErrorMessage(e, defaultMessage);

  Future<List<Map<String, dynamic>>> getMyTickets({
    String? eventId,
    String? status,
    int page = 1,
  }) async {
    try {
      final params = <String, dynamic>{'page': page};
      if (eventId != null) params['event_id'] = eventId;
      if (status != null) params['status'] = status;
      final response = await _api.get('/tickets/my-tickets', params: params);
      return _extractTicketList(response.data);
    } catch (e) {
      throw Exception(_handleError(e, 'Failed to load tickets'));
    }
  }

  /// Handles both flat `{ data: [...] }` and paginated `{ data: { data: [...] } }`.
  static List<Map<String, dynamic>> _extractTicketList(dynamic raw) {
    dynamic payload = raw;

    // Unwrap top-level { data: ... }
    if (payload is Map && payload.containsKey('data')) {
      payload = payload['data'];
    }

    // Paginated: { data: [...], total: N, ... }
    if (payload is Map && payload.containsKey('data')) {
      payload = payload['data'];
    }

    if (payload is List) {
      return payload
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList();
    }

    return [];
  }

  Future<Map<String, dynamic>> getTicketDetails(String uuid) async {
    try {
      final response = await _api.get('/tickets/$uuid/details');
      return Map<String, dynamic>.from(response.data['data'] ?? response.data);
    } catch (e) {
      throw Exception(_handleError(e, 'Failed to load ticket'));
    }
  }

  String qrImageUrl(String uuid, {int size = 220}) =>
      '${_api.dio.options.baseUrl}/tickets/$uuid/qr-image?size=$size';

  static String? qrUrlFromTicketJson(Map<String, dynamic> json) {
    for (final key in [
      'qr_image_url',
      'qr_code_url',
      'qr_code',
      'qr_url',
    ]) {
      final value = json[key]?.toString().trim();
      if (value != null && value.isNotEmpty) {
        if (value.startsWith('http://') || value.startsWith('https://')) {
          return value;
        }
      }
    }
    return null;
  }

  Future<Uint8List?> getQrImageBytes(String uuid, {int size = 200}) async {
    try {
      final response = await _api.dio.get<List<int>>(
        '/tickets/$uuid/qr-image',
        queryParameters: {'size': size},
        options: Options(responseType: ResponseType.bytes),
      );
      final data = response.data;
      return data != null ? Uint8List.fromList(data) : null;
    } catch (_) {
      return null;
    }
  }

  Future<Uint8List?> getQrImageBytesFromUrl(
    String url, {
    int? size,
  }) async {
    try {
      final response = await _api.dio.get<List<int>>(
        url,
        queryParameters: size != null ? {'size': size} : null,
        options: Options(responseType: ResponseType.bytes),
      );
      final data = response.data;
      return data != null ? Uint8List.fromList(data) : null;
    } catch (_) {
      return null;
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
      final response = await _api.post(
        '/tickets/purchase',
        data: {
          'event_id': eventId,
          'tickets': tickets,
          'customer_name': customerName,
          'customer_email': customerEmail,
          if (customerPhone != null) 'customer_phone': customerPhone,
        },
      );
      return Map<String, dynamic>.from(response.data);
    } catch (e) {
      throw Exception(_handleError(e, 'Failed to purchase tickets'));
    }
  }

  Future<Map<String, dynamic>> paymentCallback({
    required String reference,
    String status = 'success',
  }) async {
    try {
      final response = await _api.post(
        '/tickets/payment-callback',
        data: {'reference': reference, 'status': status},
      );
      return Map<String, dynamic>.from(response.data);
    } catch (e) {
      throw Exception(_handleError(e, 'Payment verification failed'));
    }
  }

  Future<Map<String, dynamic>> staffScan({
    required String qrData,
    String scanType = 'entry',
    String? location,
  }) async {
    try {
      final response = await _api.post(
        '/tickets/scan',
        data: {
          'qr_data': qrData,
          'scan_type': scanType,
          if (location != null) 'location': location,
        },
      );
      return Map<String, dynamic>.from(response.data);
    } catch (e) {
      throw Exception(_handleError(e, 'Scan failed'));
    }
  }
}
