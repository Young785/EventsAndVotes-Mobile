import '../network/api_client.dart';

class DashboardService {
  final ApiClient _apiClient = ApiClient.instance;

  /// Get dashboard stats
  Future<Map<String, dynamic>> getStats() async {
    try {
      final response = await _apiClient.get('/dashboard/stats');
      return response.data['data'] ?? {};
    } catch (e) {
      throw Exception('Failed to load dashboard stats: $e');
    }
  }

  /// Get referral dashboard data
  Future<Map<String, dynamic>> getReferralDashboard() async {
    try {
      final response = await _apiClient.get('/profile/referral-dashboard');
      return response.data['data'] ?? {};
    } catch (e) {
      throw Exception('Failed to load referral dashboard: $e');
    }
  }

  /// Generate referral code
  Future<Map<String, dynamic>> generateReferralCode() async {
    try {
      final response = await _apiClient.post('/profile/generate-referral-code');
      return response.data['data'] ?? {};
    } catch (e) {
      throw Exception('Failed to generate referral code: $e');
    }
  }
}
