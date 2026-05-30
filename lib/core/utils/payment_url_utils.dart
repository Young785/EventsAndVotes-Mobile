import '../constants/app_constants.dart';

/// Unwraps nested `data` from purchase/checkout API responses.
Map<String, dynamic> unwrapPaymentPayload(Map<String, dynamic> response) {
  dynamic current = response;

  for (var i = 0; i < 4; i++) {
    if (current is! Map) break;
    final map = Map<String, dynamic>.from(current);

    final hasPaymentFields = map.containsKey('paystack_data') ||
        map.containsKey('authorization_url') ||
        map.containsKey('payment_url') ||
        map.containsKey('payment_status') ||
        map.containsKey('reference') ||
        map.containsKey('public_key') ||
        map.containsKey('access_code');

    if (hasPaymentFields || map['data'] is! Map) {
      return map;
    }
    current = map['data'];
  }

  if (current is Map) {
    return Map<String, dynamic>.from(current);
  }
  return response;
}

/// Merges payment fields found anywhere in the purchase JSON tree.
Map<String, dynamic> enrichPaymentPayload(Map<String, dynamic> response) {
  final base = unwrapPaymentPayload(response);
  final enriched = Map<String, dynamic>.from(base);
  final found = <String, dynamic>{};
  _deepCollectPaymentFields(response, found);

  if (found['paystack_data'] is Map && enriched['paystack_data'] is! Map) {
    enriched['paystack_data'] =
        Map<String, dynamic>.from(found['paystack_data'] as Map);
  }

  for (final key in [
    'access_code',
    'authorization_url',
    'reference',
    'public_key',
    'amount',
    'total_amount',
  ]) {
    final value = found[key];
    if (value != null &&
        (enriched[key] == null || enriched[key].toString().isEmpty)) {
      enriched[key] = value;
    }
  }

  return enriched;
}

void _deepCollectPaymentFields(dynamic node, Map<String, dynamic> into) {
  if (node is Map) {
    for (final entry in node.entries) {
      final key = entry.key.toString();
      if (key == 'paystack_data' && entry.value is Map) {
        into.putIfAbsent(
          key,
          () => Map<String, dynamic>.from(entry.value as Map),
        );
      } else if (const {
        'access_code',
        'authorization_url',
        'reference',
        'public_key',
        'amount',
        'total_amount',
      }.contains(key)) {
        into.putIfAbsent(key, () => entry.value);
      }
      _deepCollectPaymentFields(entry.value, into);
    }
  } else if (node is List) {
    for (final item in node) {
      _deepCollectPaymentFields(item, into);
    }
  }
}

Map<String, dynamic>? paystackDataFrom(Map<String, dynamic> data) {
  if (data['paystack_data'] is Map) {
    return Map<String, dynamic>.from(data['paystack_data'] as Map);
  }
  if (data['transaction'] is Map) {
    final tx = Map<String, dynamic>.from(data['transaction'] as Map);
    if (tx['paystack_data'] is Map) {
      return Map<String, dynamic>.from(tx['paystack_data'] as Map);
    }
  }
  if (data['payment'] is Map) {
    final payment = Map<String, dynamic>.from(data['payment'] as Map);
    if (payment['paystack'] is Map) {
      return Map<String, dynamic>.from(payment['paystack'] as Map);
    }
    if (payment['paystack_data'] is Map) {
      return Map<String, dynamic>.from(payment['paystack_data'] as Map);
    }
  }
  if (data.containsKey('public_key') ||
      data.containsKey('access_code') ||
      data.containsKey('authorization_url')) {
    return data;
  }
  return null;
}

bool isPaystackHostedUrl(String? url) {
  if (url == null || url.isEmpty) return false;
  try {
    final host = Uri.parse(url.trim()).host.toLowerCase();
    return host == 'checkout.paystack.com' ||
        host == 'standard.paystack.co' ||
        host.endsWith('.paystack.com') ||
        host.endsWith('.paystack.co');
  } catch (_) {
    return false;
  }
}

bool isAppFrontendPaymentUrl(String? url) {
  if (url == null || url.isEmpty) return false;
  try {
    final uri = Uri.parse(url.trim());
    final host = uri.host.toLowerCase();
    final path = uri.path.toLowerCase();
    if (host.contains('bizinvestify.com') &&
        (path.startsWith('/payment/process') ||
            path.startsWith('/payment/callback'))) {
      return true;
    }
    return false;
  } catch (_) {
    return false;
  }
}

/// Builds a Paystack-hosted checkout URL (never the SPA `/payment/process` route).
String? resolvePaystackCheckoutUrl(Map<String, dynamic> data) {
  final paystack = paystackDataFrom(data);

  final accessCode = paystack?['access_code']?.toString() ??
      data['access_code']?.toString();
  if (accessCode != null && accessCode.isNotEmpty) {
    return 'https://checkout.paystack.com/$accessCode';
  }

  final candidates = <String?>[
    paystack?['authorization_url']?.toString(),
    paystack?['checkout_url']?.toString(),
    data['authorization_url']?.toString(),
    data['checkout_url']?.toString(),
  ];

  for (final raw in candidates) {
    final url = _sanitizePaystackUrl(raw);
    if (url != null) return url;
  }

  return null;
}

/// Inline Paystack only when the purchase API returned a public key (votes/subscriptions).
PaystackInlineConfig? resolvePaystackInlineConfig(
  Map<String, dynamic> data, {
  required String email,
  double? amountNaira,
}) {
  final paystack = paystackDataFrom(data);
  if (paystack == null) return null;

  final publicKey = paystack['public_key']?.toString();
  final reference = paymentReferenceFrom(data);

  if (publicKey == null || publicKey.isEmpty || reference.isEmpty) {
    return null;
  }

  final amount = _amountKobo(data, paystack, amountNaira);
  if (amount <= 0) return null;

  return PaystackInlineConfig(
    publicKey: publicKey,
    email: email,
    reference: reference,
    amountKobo: amount,
  );
}

int _amountKobo(
  Map<String, dynamic> data,
  Map<String, dynamic>? paystack,
  double? amountNaira,
) {
  for (final source in [paystack, data]) {
    if (source == null) continue;
    for (final key in [
      'amount',
      'total_amount',
      'payment_amount',
      'amount_kobo',
    ]) {
      if (source[key] == null) continue;
      final v = source[key];
      if (v is int) return v;
      if (v is double) return (v * 100).round();
      final parsed = int.tryParse(v.toString());
      if (parsed != null && parsed > 0) return parsed;
    }
  }
  if (amountNaira != null && amountNaira > 0) {
    return (amountNaira * 100).round();
  }
  return 0;
}

String? _sanitizePaystackUrl(String? url) {
  if (url == null || url.isEmpty) return null;

  var normalized = url.trim();

  if (normalized.contains('eventsandvotes.test') ||
      normalized.contains('.test/') ||
      normalized.contains('localhost')) {
    try {
      final uri = Uri.parse(normalized);
      if (isPaystackHostedUrl(normalized)) return normalized;
      final path = uri.path;
      final query = uri.query.isNotEmpty ? '?${uri.query}' : '';
      normalized = '${AppConstants.frontendUrl}$path$query';
    } catch (_) {
      return null;
    }
  }

  if (normalized.contains('.test') || normalized.contains('localhost')) {
    return null;
  }

  if (!normalized.startsWith('http')) return null;
  if (isAppFrontendPaymentUrl(normalized)) return null;
  if (!isPaystackHostedUrl(normalized)) return null;

  return normalized;
}

String paymentReferenceFrom(Map<String, dynamic> data) {
  final paystack = paystackDataFrom(data);
  final direct = paystack?['reference']?.toString() ??
      data['reference']?.toString() ??
      data['transaction_reference']?.toString() ??
      '';

  if (direct.isNotEmpty) return direct;

  for (final key in ['payment_url', 'authorization_url', 'redirect_url']) {
    final url = data[key]?.toString();
    if (url == null || url.isEmpty) continue;
    final ref = _referenceFromPaymentProcessUrl(url);
    if (ref != null) return ref;
  }

  return '';
}

String? _referenceFromPaymentProcessUrl(String url) {
  try {
    final uri = Uri.parse(url);
    final segments = uri.pathSegments;
    final idx = segments.indexOf('process');
    if (idx >= 0 && idx + 1 < segments.length) {
      return segments[idx + 1];
    }
    if (segments.isNotEmpty) {
      final last = segments.last;
      if (last.startsWith('EVT_') || last.startsWith('TXN_')) return last;
    }
  } catch (_) {}
  return null;
}

/// Official Paystack SDK launch config (access_code from POST /tickets/purchase).
class PaystackSdkLaunchConfig {
  final String accessCode;
  final String publicKey;
  final String reference;

  const PaystackSdkLaunchConfig({
    required this.accessCode,
    required this.publicKey,
    required this.reference,
  });
}

/// Resolves Paystack SDK config from purchase API response (OpenAPI + Paystack docs).
PaystackSdkLaunchConfig? resolvePaystackSdkLaunch(Map<String, dynamic> data) {
  final paystack = paystackDataFrom(data);
  final accessCode = paystack?['access_code']?.toString() ??
      data['access_code']?.toString();
  final publicKey = paystack?['public_key']?.toString();
  final reference = paymentReferenceFrom(data);

  if (accessCode == null ||
      accessCode.isEmpty ||
      reference.isEmpty) {
    return null;
  }

  if (publicKey == null || publicKey.isEmpty) {
    return PaystackSdkLaunchConfig(
      accessCode: accessCode,
      publicKey: '',
      reference: reference,
    );
  }

  return PaystackSdkLaunchConfig(
    accessCode: accessCode,
    publicKey: publicKey,
    reference: reference,
  );
}

class PaystackInlineConfig {
  final String publicKey;
  final String email;
  final String reference;
  final int amountKobo;

  const PaystackInlineConfig({
    required this.publicKey,
    required this.email,
    required this.reference,
    required this.amountKobo,
  });
}
