import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';
import '../network/api_client.dart';

class SettingsService {
  final ApiClient _api = ApiClient.instance;

  Future<Map<String, dynamic>> loadSettings({bool forceRefresh = false}) async {
    final prefs = await SharedPreferences.getInstance();
    if (!forceRefresh) {
      final cached = prefs.getString(AppConstants.settingsKey);
      if (cached != null) {
        try {
          return jsonDecode(cached) as Map<String, dynamic>;
        } catch (_) {}
      }
    }

    final response = await _api.get('/public/settings');
    final body = response.data;
    final data = body is Map
        ? (body['data'] ?? body)
        : body;
    final settings = Map<String, dynamic>.from(data as Map? ?? {});
    await prefs.setString(AppConstants.settingsKey, jsonEncode(settings));
    return settings;
  }

  String currencySymbol(Map<String, dynamic> settings) =>
      settings['currency_symbol']?.toString() ?? '₦';
}
