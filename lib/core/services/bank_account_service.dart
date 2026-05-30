import 'package:dio/dio.dart';
import '../data/nigerian_banks.dart';
import '../network/api_client.dart';
import '../utils/api_response_utils.dart';

class BankNameEnquiryResult {
  final String? accountName;
  final String? errorMessage;

  const BankNameEnquiryResult({this.accountName, this.errorMessage});

  bool get isSuccess => accountName != null && accountName!.isNotEmpty;
}

/// Bank accounts — Swagger: GET/POST `/bank-accounts`, verify via `/admin/banks/verify-account`.
class BankAccountService {
  final ApiClient _apiClient = ApiClient.instance;

  Future<List<dynamic>> getBankAccounts() async {
    try {
      final response = await _apiClient.get('/bank-accounts');
      return _parseAccountList(response.data);
    } catch (_) {
      try {
        final response = await _apiClient.get('/admin/banks/user-banks');
        return _parseAccountList(response.data);
      } catch (_) {
        return [];
      }
    }
  }

  Future<List<Map<String, dynamic>>> getAvailableBanks() async {
    const endpoints = ['/admin/banks/all', '/admin/banks'];

    for (final path in endpoints) {
      try {
        final response = await _apiClient.get(path);
        final list = _parseBankList(response.data);
        if (list.isNotEmpty) {
          return list.map(_normalizeBank).toList()
            ..sort((a, b) => bankDisplayName(a).compareTo(bankDisplayName(b)));
        }
      } catch (_) {}
    }

    return nigerianBanksFallback
        .map((b) => _normalizeBank(Map<String, dynamic>.from(b)))
        .toList();
  }

  /// Resolves account holder name via `POST /bank-accounts/verify-account`.
  /// Payload matches the production curl: {"bank_code":"305","account_no":"..."}.
  Future<BankNameEnquiryResult> resolveAccountName({
    required String bankCode,
    required String accountNumber,
    String? bankName,
  }) async {
    final code = normalizeBankCode(bankCode);
    final accountNo = accountNumber.trim();

    if (code.isEmpty || accountNo.length < 10) {
      return const BankNameEnquiryResult(
        errorMessage: 'Enter a valid account number and select a bank.',
      );
    }

    // Correct payload format confirmed by production curl.
    final payload = {'bank_code': code, 'account_no': accountNo};

    // Primary endpoint (matches web frontend curl).
    // Fallbacks in order:
    final endpoints = [
      '/bank-accounts/verify-account',
      '/admin/banks/verify-account',
      '/admin/banks/name-enquiry',
    ];

    Object? lastError;

    // Use validateStatus so Dio never throws — we always read the response body.
    final opts = Options(validateStatus: (s) => true);

    for (final path in endpoints) {
      try {
        final response = await _apiClient.post(path, data: payload, options: opts);
        final statusOk =
            response.statusCode != null && response.statusCode! < 300;
        if (statusOk) {
          final name = _parseAccountName(response.data);
          if (name != null) return BankNameEnquiryResult(accountName: name);
        }
        final msg = _parseErrorMessage(response.data);
        if (msg != null) lastError = msg;
      } catch (e) {
        lastError = e;
      }
    }

    return BankNameEnquiryResult(
      errorMessage: parseApiErrorMessage(
        lastError,
        'Could not verify this account. Check your account number and bank.',
      ),
    );
  }

  /// NIBSS codes are often 3 digits (e.g. 58 → 058). Keep longer codes as-is (Kuda, Opay).
  static String normalizeBankCode(String code) {
    final trimmed = code.trim();
    if (trimmed.isEmpty) return trimmed;
    if (RegExp(r'^\d{1,3}$').hasMatch(trimmed)) {
      return trimmed.padLeft(3, '0');
    }
    return trimmed;
  }

  List<Map<String, dynamic>> _parseBankList(dynamic body) {
    return _extractList(body)
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
  }

  List<dynamic> _parseAccountList(dynamic body) => _extractList(body);

  List<dynamic> _extractList(dynamic body) {
    if (body is List) return body;

    if (body is Map) {
      if (body['status']?.toString().toLowerCase() == 'error') return [];

      final data = body['data'];
      if (data is List) return data;

      if (data is Map) {
        for (final key in ['data', 'banks', 'items', 'results', 'user_banks']) {
          if (data[key] is List) return data[key] as List;
        }
      }

      for (final key in ['banks', 'items', 'results']) {
        if (body[key] is List) return body[key] as List;
      }
    }

    return [];
  }

  Map<String, dynamic> _normalizeBank(Map<String, dynamic> bank) {
    final normalized = Map<String, dynamic>.from(bank);
    normalized['name'] ??=
        bank['bank_name'] ?? bank['title'] ?? bank['label'];
    normalized['code'] ??= bank['bank_code'] ?? bank['sort_code'];
    normalized['bank_id'] ??=
        bank['bank_id']?.toString() ?? bank['id']?.toString();
    normalized['id'] ??= normalized['bank_id'];
    return normalized;
  }

  static String bankDisplayName(Map<String, dynamic> bank) =>
      bank['name']?.toString() ??
      bank['bank_name']?.toString() ??
      'Bank';

  static String bankPickerKey(Map<String, dynamic> bank, int index) {
    final code = bankCodeFrom(bank);
    final id = bankIdFrom(bank);
    return 'b_${index}_${code}_$id';
  }

  String? _parseAccountName(dynamic body) {
    if (body is! Map) return null;

    final map = Map<String, dynamic>.from(body);

    if (map['error'] == true) return null;
    if (map['status']?.toString().toLowerCase() == 'error') return null;

    final candidates = <String?>[];

    void collect(dynamic node) {
      if (node is! Map) return;
      final m = Map<String, dynamic>.from(node);
      for (final key in [
        'account_name',
        'accountName',
        'account_holder',
        'account_holder_name',
        'beneficiary_name',
        'name',
      ]) {
        final v = m[key]?.toString();
        if (v != null && v.isNotEmpty) candidates.add(v);
      }
      if (m['data'] is Map) collect(m['data']);
    }

    collect(map);

    for (final name in candidates) {
      if (name != null && name.length > 2 && !name.contains('@')) {
        return name;
      }
    }
    return null;
  }

  String? _parseErrorMessage(dynamic body) {
    if (body is! Map) return null;
    return body['message']?.toString() ?? body['error']?.toString();
  }

  static String? _messageFromBody(dynamic body) {
    if (body is! Map) return null;
    return body['message']?.toString() ??
        body['error']?.toString() ??
        (body['errors'] is Map
            ? (body['errors'] as Map).values.first?.toString()
            : null);
  }

  /// Saves a bank account.
  ///
  /// Confirmed working payload from web app curl:
  ///   POST /bank-accounts
  ///   { "bank_id": "BK10346", "account_no": "...", "account_name": "...", "settlement_mode": "instant" }
  Future<Map<String, dynamic>> createBankAccount({
    required String bankId,
    required String bankName,
    required String bankCode,
    required String accountName,
    required String accountNumber,
  }) async {
    final acct = accountNumber.trim();

    // Primary payload — exact format confirmed by production curl.
    final primaryPayload = {
      'bank_id': bankId,
      'account_no': acct,
      'account_name': accountName,
      'settlement_mode': 'instant',
    };

    // Fallback variants in case the server accepts alternative field names.
    final fallbacks = [
      {
        'bank_id': bankId,
        'account_number': acct,
        'account_name': accountName,
        'settlement_mode': 'instant',
      },
      {
        'bank_name': bankName,
        'bank_code': normalizeBankCode(bankCode),
        'account_name': accountName,
        'account_no': acct,
        'settlement_mode': 'instant',
      },
    ];

    final opts = Options(validateStatus: (s) => true);
    String? lastMsg;

    for (final payload in [primaryPayload, ...fallbacks]) {
      try {
        final response =
            await _apiClient.post('/bank-accounts', data: payload, options: opts);
        final status = response.statusCode ?? 0;
        if (status >= 200 && status < 300) {
          return Map<String, dynamic>.from(response.data as Map? ?? {});
        }
        final body = response.data;
        if (body is Map) lastMsg = _messageFromBody(body);
      } catch (_) {}
    }

    throw Exception(lastMsg ?? 'Failed to add bank account');
  }

  /// NIBSS/Paystack code used for name enquiry — never the internal bank_id UUID.
  static String bankCodeFrom(Map<String, dynamic> bank) {
    final code = bank['code']?.toString() ??
        bank['bank_code']?.toString() ??
        bank['sort_code']?.toString() ??
        '';
    if (code.isNotEmpty) return normalizeBankCode(code);

    final id = bank['bank_id']?.toString() ?? bank['id']?.toString() ?? '';
    if (RegExp(r'^\d+$').hasMatch(id)) return normalizeBankCode(id);
    return '';
  }

  static String bankIdFrom(Map<String, dynamic> bank) =>
      bank['bank_id']?.toString() ??
      bank['id']?.toString() ??
      bankCodeFrom(bank);
}
