/// Safe parsing for API values that may be num or String.
double? parseApiDouble(dynamic value) {
  if (value == null) return null;
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value);
  return null;
}

int parseApiInt(dynamic value, [int fallback = 0]) {
  if (value == null) return fallback;
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value) ?? fallback;
  return fallback;
}

/// Parses API amounts and formats for display (e.g. balance, earnings).
double parseApiDoubleOrZero(dynamic value) => parseApiDouble(value) ?? 0;

String formatApiAmount(dynamic value, {int decimals = 2}) {
  return parseApiDoubleOrZero(value).toStringAsFixed(decimals);
}

bool parseApiBool(dynamic value, [bool fallback = false]) {
  if (value == null) return fallback;
  if (value is bool) return value;
  if (value is num) return value != 0;
  if (value is String) {
    final v = value.toLowerCase();
    if (v == 'true' || v == '1' || v == 'yes') return true;
    if (v == 'false' || v == '0' || v == 'no') return false;
  }
  return fallback;
}
