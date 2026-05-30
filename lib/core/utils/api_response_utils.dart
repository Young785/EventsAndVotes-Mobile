import 'package:dio/dio.dart';

/// Parses Laravel API error payloads into a user-friendly message.
String parseApiErrorMessage(dynamic error, [String fallback = 'Request failed']) {
  if (error is DioException) {
    final status = error.response?.statusCode;
    final responseData = error.response?.data;

    // Always try to read the API's own message from the response body first.
    if (responseData is Map) {
      final apiMsg =
          _messageFromMap(Map<String, dynamic>.from(responseData));
      if (apiMsg != null && apiMsg.isNotEmpty) return apiMsg;
    }

    if (status == 404) {
      return fallback.isNotEmpty && fallback != 'Request failed'
          ? fallback
          : 'The requested resource was not found (404).';
    }
    if (status == 401) {
      return 'Session expired. Please log in again.';
    }
    if (status == 403) {
      return 'You do not have permission to perform this action.';
    }
    if (status != null && status >= 500) {
      return 'Server error ($status). Please try again shortly.';
    }

    if (responseData is String && responseData.contains('<html')) {
      return fallback;
    }
    final msg = error.message;
    if (msg != null &&
        !msg.contains('validateStatus') &&
        !msg.contains('status code of')) {
      return msg;
    }
    return fallback;
  }
  if (error is Map) {
    return _messageFromMap(Map<String, dynamic>.from(error)) ?? fallback;
  }
  return error.toString().replaceAll('Exception: ', '');
}

String? _messageFromMap(Map<String, dynamic> data) {
  final errors = data['errors'];
  if (errors is Map && errors.isNotEmpty) {
    final parts = <String>[];
    errors.forEach((key, value) {
      final field = _humanizeField(key.toString());
      if (value is List && value.isNotEmpty) {
        parts.add('$field: ${value.first}');
      } else if (value != null) {
        parts.add('$field: $value');
      }
    });
    if (parts.isNotEmpty) return parts.join('\n');
  }

  final message = data['message']?.toString();
  if (message != null && message.isNotEmpty) {
    if (message.toLowerCase() == 'validation failed' && errors is Map) {
      return _messageFromMap({...data, 'message': null}) ??
          'Please check your input and try again.';
    }
    return message;
  }

  if (data['error'] != null) return data['error'].toString();
  return null;
}

String _humanizeField(String key) {
  return key
      .replaceAll('_', ' ')
      .replaceAllMapped(
        RegExp(r'\b\w'),
        (m) => m.group(0)!.toUpperCase(),
      );
}

/// Throws if the API body reports `status: error`.
void ensureApiSuccess(Map<String, dynamic> body) {
  final status = body['status']?.toString().toLowerCase();
  if (status == 'error') {
    throw Exception(_messageFromMap(body) ?? 'Request failed');
  }
}

/// Extracts token, user, and settings from login/register responses.
({String? token, Map<String, dynamic>? user, Map<String, dynamic>? settings})
    parseAuthPayload(Map<String, dynamic> body) {
  ensureApiSuccess(body);

  final data = body['data'] is Map
      ? Map<String, dynamic>.from(body['data'] as Map)
      : body;

  final token = data['token']?.toString() ?? body['token']?.toString();

  final userRaw = data['user'] ?? body['user'];
  final user = userRaw is Map ? Map<String, dynamic>.from(userRaw) : null;

  final settingsRaw = data['settings'] ?? body['settings'];
  final settings =
      settingsRaw is Map ? Map<String, dynamic>.from(settingsRaw) : null;

  return (token: token, user: user, settings: settings);
}
