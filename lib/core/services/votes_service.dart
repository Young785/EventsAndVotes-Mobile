import '../network/api_client.dart';
import '../utils/list_response_utils.dart';

class VotesService {
  final ApiClient _apiClient = ApiClient.instance;

  Future<Map<String, dynamic>> getVotes({
    String? status,
    String? category,
    int? page,
    String? search,
  }) async {
    try {
      final params = <String, dynamic>{};
      if (status != null && status.isNotEmpty) params['status'] = status;
      if (category != null) params['category'] = category;
      if (page != null) params['page'] = page;
      if (search != null && search.isNotEmpty) params['search'] = search;

      final response = await _apiClient.get('/votes', params: params);
      return parsePaginatedResponse(response.data);
    } catch (e) {
      throw Exception('Failed to load votes: $e');
    }
  }

  Future<Map<String, dynamic>> getVoteDetails(String slug, String id) async {
    try {
      final response = await _apiClient.get('/votes/$slug/$id');
      return response.data['data'] ?? {};
    } catch (e) {
      throw Exception('Failed to load vote details: $e');
    }
  }

  Future<Map<String, dynamic>> getVoteResults(String slug, String id) async {
    try {
      final response = await _apiClient.get('/votes/$slug/$id/results');
      return response.data['data'] ?? {};
    } catch (e) {
      throw Exception('Failed to load vote results: $e');
    }
  }

  Future<Map<String, dynamic>> voteForNominee(
    String nomineeId, {
    int? quantity,
  }) async {
    try {
      final data = <String, dynamic>{'nominee_id': nomineeId};
      if (quantity != null) data['quantity'] = quantity;

      final response =
          await _apiClient.post('/nominees/$nomineeId/vote', data: data);
      return response.data;
    } catch (e) {
      throw Exception('Failed to submit vote: $e');
    }
  }
}
