import '../network/api_client.dart';

/// Resolves Paystack public key from GET /payment-gateways (OpenAPI public endpoint).
class PaystackService {
  PaystackService._();
  static final PaystackService instance = PaystackService._();

  final ApiClient _api = ApiClient.instance;
  String? _cachedPaystackPublicKey;

  Future<String?> fetchPaystackPublicKey() async {
    if (_cachedPaystackPublicKey != null) return _cachedPaystackPublicKey;

    try {
      final response = await _api.get('/payment-gateways');
      final body = response.data;
      final list = body is Map ? (body['data'] ?? body) : body;
      if (list is! List) return null;

      for (final item in list) {
        if (item is! Map) continue;
        if (item['slug']?.toString().toLowerCase() != 'paystack') continue;
        final key = item['key']?.toString();
        if (key != null && key.isNotEmpty) {
          _cachedPaystackPublicKey = key;
          return key;
        }
      }
    } catch (_) {}

    return null;
  }
}
