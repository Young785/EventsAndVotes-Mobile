import 'package:dio/dio.dart';
import '../network/api_client.dart';
import '../utils/api_response_utils.dart';

class AuthService {
  final ApiClient _apiClient = ApiClient.instance;

  String _handleError(dynamic e, String defaultMessage) =>
      parseApiErrorMessage(e, defaultMessage);

  /// Login with email and password
  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _apiClient.post(
        '/auth/login',
        data: {'email': email, 'password': password},
      );
      final body = Map<String, dynamic>.from(response.data as Map);
      ensureApiSuccess(body);
      return body;
    } on DioException catch (e) {
      throw Exception(_handleError(e, 'Failed to login'));
    }
  }

  /// Register a new user (payload matches web signup)
  Future<Map<String, dynamic>> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    required String passwordConfirmation,
    required String phone,
    required String dob,
    required String gender,
    required String country,
    required String state,
    required String address,
    String roleId = 'user',
    String referralCode = '',
    bool terms = true,
  }) async {
    try {
      final data = {
        'first_name': firstName,
        'last_name': lastName,
        'email': email,
        'phone': phone,
        'password': password,
        'password_confirmation': passwordConfirmation,
        'dob': dob,
        'gender': gender.toLowerCase(),
        'country': country,
        'state': state,
        'role_id': roleId,
        'address': address,
        'referral_code': referralCode,
        'terms': terms,
      };

      final response = await _apiClient.post('/auth/register', data: data);
      final body = Map<String, dynamic>.from(response.data as Map);
      ensureApiSuccess(body);
      return body;
    } on DioException catch (e) {
      throw Exception(_handleError(e, 'Failed to register'));
    }
  }

  /// Logout
  Future<void> logout() async {
    try {
      await _apiClient.post('/auth/logout');
    } catch (e) {
      throw Exception(_handleError(e, 'Failed to logout'));
    }
  }

  /// Get current user
  Future<Map<String, dynamic>> getCurrentUser() async {
    try {
      final response = await _apiClient.get('/auth/user');
      final body = response.data;
      if (body is Map) {
        final map = Map<String, dynamic>.from(body);
        if (map['data'] is Map) {
          return Map<String, dynamic>.from(map['data'] as Map);
        }
        return map;
      }
      return {};
    } on DioException catch (e) {
      throw Exception(_handleError(e, 'Failed to get current user'));
    }
  }

  /// Forgot password
  Future<void> forgotPassword(String email) async {
    try {
      await _apiClient.post('/auth/forgot-password', data: {'email': email});
    } on DioException catch (e) {
      throw Exception(_handleError(e, 'Failed to send reset email'));
    }
  }

  /// Reset password
  Future<void> resetPassword({
    required String token,
    required String email,
    required String password,
    required String passwordConfirmation,
  }) async {
    try {
      await _apiClient.post(
        '/auth/reset-password',
        data: {
          'token': token,
          'email': email,
          'password': password,
          'password_confirmation': passwordConfirmation,
        },
      );
    } on DioException catch (e) {
      throw Exception(_handleError(e, 'Failed to reset password'));
    }
  }

  Map<String, dynamic> _unwrapData(dynamic body) {
    if (body is Map) {
      final map = Map<String, dynamic>.from(body);
      if (map['data'] is Map) {
        return Map<String, dynamic>.from(map['data'] as Map);
      }
      return map;
    }
    return {};
  }

  /// Email verification status (GET /verification)
  Future<Map<String, dynamic>> getVerificationStatus({bool autoSend = false}) async {
    try {
      final response = await _apiClient.get(
        '/verification',
        params: autoSend ? {'auto_send': 'true'} : null,
      );
      return _unwrapData(response.data);
    } on DioException catch (e) {
      throw Exception(_handleError(e, 'Failed to load verification status'));
    }
  }

  /// Resend email verification code (POST /verification)
  Future<Map<String, dynamic>> resendVerificationCode() async {
    try {
      final response = await _apiClient.post('/verification');
      final body = Map<String, dynamic>.from(response.data as Map);
      ensureApiSuccess(body);
      return _unwrapData(body);
    } on DioException catch (e) {
      throw Exception(_handleError(e, 'Failed to send verification code'));
    }
  }

  /// Confirm email with 6-digit code (POST /verification/confirm)
  Future<Map<String, dynamic>> confirmEmailVerification(String code) async {
    try {
      final response = await _apiClient.post(
        '/verification/confirm',
        data: {'code': code},
      );
      final body = Map<String, dynamic>.from(response.data as Map);
      ensureApiSuccess(body);
      return _unwrapData(body);
    } on DioException catch (e) {
      throw Exception(_handleError(e, 'Failed to verify email'));
    }
  }

  /// Validate referral code
  Future<Map<String, dynamic>> validateReferralCode(String referralCode) async {
    try {
      final response = await _apiClient.post(
        '/auth/validate-referral',
        data: {'referral_code': referralCode},
      );
      final body = response.data;
      if (body is Map && body['data'] is Map) {
        return Map<String, dynamic>.from(body['data'] as Map);
      }
      return {};
    } on DioException catch (e) {
      throw Exception(_handleError(e, 'Failed to validate referral code'));
    }
  }
}
