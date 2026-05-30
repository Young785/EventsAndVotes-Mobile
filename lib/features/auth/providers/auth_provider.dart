import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/network/api_client.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/services/settings_service.dart';
import '../../../core/utils/api_response_utils.dart';
import '../../../shared/models/user_model.dart';

class AuthProvider extends ChangeNotifier {
  UserModel? _user;
  String? _token;
  bool _isLoading = true;
  String? _error;
  bool _onboardingCompleted = false;
  bool _needsVerification = false;
  bool _isLoggingOut = false;
  Map<String, dynamic> _settings = {};
  final AuthService _authService = AuthService();
  final SettingsService _settingsService = SettingsService();

  UserModel? get user => _user;
  String? get token => _token;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _user != null && _token != null;
  bool get onboardingCompleted => _onboardingCompleted;
  bool get needsVerification => _needsVerification;
  Map<String, dynamic> get settings => _settings;

  Future<void> initialize() async {
    _isLoading = true;
    notifyListeners();

    ApiClient.instance.onAuthError = _handleAuthError;

    try {
      _settings = await _settingsService.loadSettings();
    } catch (_) {}

    final prefs = await SharedPreferences.getInstance();
    _onboardingCompleted =
        prefs.getBool(AppConstants.onboardingCompletedKey) ?? false;
    _token = await ApiClient.instance.getToken();
    final userJson = prefs.getString(AppConstants.userKey);

    if (_token != null && userJson != null) {
      try {
        _user = UserModel.fromJson(jsonDecode(userJson));
        await _verifyToken();
      } catch (_) {
        await _clearAuth();
      }
    }

    _isLoading = false;
    notifyListeners();
  }

  void _handleAuthError(int statusCode, Map<String, dynamic>? data) {
    if (_isLoggingOut) return;

    if (statusCode == 403 &&
        (data?['verification_required'] == true ||
            data?['message']?.toString().toLowerCase().contains('verif') ==
                true)) {
      _needsVerification = true;
      notifyListeners();
      return;
    }
    if (statusCode == 401) {
      _clearAuth();
    }
  }

  Future<void> _verifyToken() async {
    try {
      final userData = await _authService.getCurrentUser();
      _user = UserModel.fromJson(userData);
      await _saveUser(_user!);
      await _syncVerificationFromApi();
      notifyListeners();
    } catch (e) {
      await _clearAuth();
    }
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _authService.login(email: email, password: password);
      final parsed = parseAuthPayload(result);

      if (parsed.token == null || parsed.token!.isEmpty) {
        throw Exception('Login succeeded but no token was returned.');
      }

      _token = parsed.token;
      if (parsed.user != null) {
        _user = UserModel.fromJson(parsed.user!);
      }
      if (parsed.settings != null) {
        _settings = parsed.settings!;
      }

      await ApiClient.instance.saveToken(_token!);
      if (_user != null) {
        await _saveUser(_user!);
      }
      await _syncVerificationFromApi(autoSend: true);

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = parseApiErrorMessage(e, 'Login failed');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register(Map<String, dynamic> data) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _authService.register(
        firstName: data['first_name']?.toString() ?? '',
        lastName: data['last_name']?.toString() ?? '',
        email: data['email']?.toString() ?? '',
        password: data['password']?.toString() ?? '',
        passwordConfirmation: data['password_confirmation']?.toString() ?? '',
        phone: data['phone']?.toString() ?? '',
        dob: data['dob']?.toString() ?? '',
        gender: data['gender']?.toString() ?? 'male',
        country: data['country']?.toString() ?? 'Nigeria',
        state: data['state']?.toString() ?? '',
        address: data['address']?.toString() ?? '',
        roleId: data['role_id']?.toString() ?? 'user',
        referralCode: data['referral_code']?.toString() ?? '',
        terms: data['terms'] == true,
      );

      final parsed = parseAuthPayload(result);

      if (parsed.token == null || parsed.token!.isEmpty) {
        throw Exception('Registration succeeded but no token was returned.');
      }

      _token = parsed.token;
      if (parsed.user != null) {
        _user = UserModel.fromJson(parsed.user!);
      }

      await ApiClient.instance.saveToken(_token!);
      if (_user != null) {
        await _saveUser(_user!);
      }
      await _syncVerificationFromApi(autoSend: true);

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = parseApiErrorMessage(e, 'Registration failed');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    _isLoggingOut = true;
    try {
      await _authService.logout();
    } catch (_) {}
    await _clearAuth();
    _isLoggingOut = false;
  }

  void updateUser(UserModel user) {
    _user = user;
    _saveUser(user);
    notifyListeners();
  }

  Future<void> _syncVerificationFromApi({bool autoSend = false}) async {
    try {
      final status = await _authService.getVerificationStatus(autoSend: autoSend);
      final emailVerified = status['email_verified'] == true;
      _needsVerification = !emailVerified;
      if (emailVerified) {
        final userData = await _authService.getCurrentUser();
        _user = UserModel.fromJson(userData);
        await _saveUser(_user!);
      }
    } catch (_) {
      if (_user != null) {
        _needsVerification = !_user!.isEmailVerified;
      }
    }
  }

  Future<bool> loadVerificationStatus({bool autoSend = false}) async {
    try {
      await _syncVerificationFromApi(autoSend: autoSend);
      notifyListeners();
      return !_needsVerification;
    } catch (e) {
      _error = parseApiErrorMessage(e, 'Failed to load verification status');
      notifyListeners();
      return false;
    }
  }

  Future<bool> resendVerificationCode() async {
    _error = null;
    try {
      await _authService.resendVerificationCode();
      notifyListeners();
      return true;
    } catch (e) {
      _error = parseApiErrorMessage(e, 'Failed to resend code');
      notifyListeners();
      return false;
    }
  }

  Future<bool> verifyEmailCode(String code) async {
    _error = null;
    notifyListeners();
    try {
      await _authService.confirmEmailVerification(code);
      final userData = await _authService.getCurrentUser();
      _user = UserModel.fromJson(userData);
      _needsVerification = !_user!.isEmailVerified;
      await _saveUser(_user!);
      notifyListeners();
      return !_needsVerification;
    } catch (e) {
      _error = parseApiErrorMessage(e, 'Verification failed');
      notifyListeners();
      return false;
    }
  }

  Future<void> markOnboardingComplete() async {
    _onboardingCompleted = true;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(AppConstants.onboardingCompletedKey, true);
    notifyListeners();
  }

  Future<void> _saveUser(UserModel user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.userKey, jsonEncode(user.toJson()));
  }

  Future<void> _clearAuth() async {
    _user = null;
    _token = null;
    _needsVerification = false;
    await ApiClient.instance.clearToken();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConstants.userKey);
    notifyListeners();
  }
}
