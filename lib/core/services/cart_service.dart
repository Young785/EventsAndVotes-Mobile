import 'package:dio/dio.dart';
import '../network/api_client.dart';

class CartService {
  final ApiClient _api = ApiClient.instance;

  String _handleError(dynamic e, String defaultMessage) {
    if (e is DioException && e.response?.data is Map) {
      final data = e.response!.data as Map;
      if (data['message'] != null) return data['message'].toString();
    }
    return defaultMessage;
  }

  Future<Map<String, dynamic>> getCart() async {
    final response = await _api.get('/cart');
    return Map<String, dynamic>.from(response.data);
  }

  Future<void> addToCart({
    required int voteId,
    required int positionId,
    required int nomineeId,
    int quantity = 1,
  }) async {
    await _api.post(
      '/cart/add',
      data: {
        'vote_id': voteId,
        'position_id': positionId,
        'nominee_id': nomineeId,
        'quantity': quantity,
      },
    );
  }

  Future<Map<String, dynamic>> checkout({
    String? fullName,
    String? customerEmail,
  }) async {
    try {
      final data = <String, dynamic>{};
      if (fullName != null && fullName.isNotEmpty) {
        data['full_name'] = fullName;
      }
      if (customerEmail != null && customerEmail.isNotEmpty) {
        data['customer_email'] = customerEmail;
      }
      final response = await _api.post('/cart/checkout', data: data);
      return Map<String, dynamic>.from(response.data);
    } catch (e) {
      throw Exception(_handleError(e, 'Checkout failed'));
    }
  }

  Future<Map<String, dynamic>> checkoutCallback({
    required String reference,
    String status = 'success',
  }) async {
    final response = await _api.post(
      '/cart/checkout/callback',
      data: {'reference': reference, 'status': status},
    );
    return Map<String, dynamic>.from(response.data);
  }
}
