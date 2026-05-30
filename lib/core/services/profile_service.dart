import 'package:dio/dio.dart';
import '../network/api_client.dart';

class ProfileService {
  final ApiClient _apiClient = ApiClient.instance;

  /// Get user profile
  Future<Map<String, dynamic>> getProfile() async {
    try {
      final response = await _apiClient.get('/profile');
      return response.data['data'] ?? {};
    } catch (e) {
      throw Exception('Failed to load profile: $e');
    }
  }

  /// Update user profile
  Future<Map<String, dynamic>> updateProfile({
    String? firstName,
    String? lastName,
    String? phone,
    String? image,
  }) async {
    try {
      final data = <String, dynamic>{};
      if (firstName != null) data['first_name'] = firstName;
      if (lastName != null) data['last_name'] = lastName;
      if (phone != null) data['phone'] = phone;
      if (image != null) data['image'] = image;

      final response = await _apiClient.put('/profile', data: data);
      return response.data['data'] ?? {};
    } catch (e) {
      throw Exception('Failed to update profile: $e');
    }
  }

  /// Change password
  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
    required String newPasswordConfirmation,
  }) async {
    try {
      final data = {
        'current_password': currentPassword,
        'new_password': newPassword,
        'new_password_confirmation': newPasswordConfirmation,
      };

      await _apiClient.put('/profile/password', data: data);
    } catch (e) {
      throw Exception('Failed to change password: $e');
    }
  }

  /// Upload profile avatar (multipart)
  Future<String?> uploadAvatar(String filePath) async {
    final formData = FormData.fromMap({
      'avatar': await MultipartFile.fromFile(filePath),
    });
    final response =
        await _apiClient.postMultipart('/profile/avatar', data: formData);
    final body = response.data;
    if (body is Map) {
      final data = body['data'];
      if (data is Map) {
        return data['avatar_url']?.toString() ??
            data['image']?.toString();
      }
    }
    return null;
  }

  /// Get referral history
  Future<Map<String, dynamic>> getReferralHistory({int? page, int? perPage}) async {
    try {
      final params = <String, dynamic>{};
      if (page != null) params['page'] = page;
      if (perPage != null) params['per_page'] = perPage;

      final response = await _apiClient.get('/profile/referral-history', params: params);
      return response.data;
    } catch (e) {
      throw Exception('Failed to load referral history: $e');
    }
  }
}
