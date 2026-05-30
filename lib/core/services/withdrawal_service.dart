import '../network/api_client.dart';
import '../utils/list_response_utils.dart';

class WithdrawalService {
  final ApiClient _apiClient = ApiClient.instance;

  Future<Map<String, dynamic>> getWithdrawalStats() async {
    final response = await _apiClient.get('/referral-withdrawals/stats');
    return response.data['data'] ?? response.data ?? {};
  }

  Future<Map<String, dynamic>> getWithdrawalSources() async {
    final response = await _apiClient.get('/withdrawal-sources');
    return response.data['data'] ?? response.data ?? {};
  }

  Future<List<dynamic>> getWithdrawals({int page = 1}) async {
    final response = await _apiClient.get(
      '/withdrawals',
      params: {'page': page},
    );
    final parsed = parsePaginatedResponse(response.data);
    return parsed['data'] as List? ?? [];
  }

  Future<List<dynamic>> getReferralWithdrawals({int page = 1}) async {
    final response = await _apiClient.get(
      '/referral-withdrawals',
      params: {'page': page},
    );
    final body = response.data;
    if (body is Map && body['data'] is Map) {
      final inner = body['data'] as Map;
      if (inner['withdrawals'] is Map && inner['withdrawals']['data'] is List) {
        return inner['withdrawals']['data'] as List;
      }
    }
    final parsed = parsePaginatedResponse(body);
    return parsed['data'] as List? ?? [];
  }

  Future<Map<String, dynamic>> createWithdrawal({
    required double amount,
    required int bankAccountId,
    required String sourceType,
    String? sourceId,
    String pace = 'NORMAL',
    String? notes,
  }) async {
    final response = await _apiClient.post('/withdrawals', data: {
      'amount': amount,
      'bank_account_id': bankAccountId,
      'source_type': sourceType,
      if (sourceId != null && sourceId.isNotEmpty) 'source_id': sourceId,
      'pace': pace,
      if (notes != null && notes.isNotEmpty) 'notes': notes,
    });
    return response.data;
  }
}
