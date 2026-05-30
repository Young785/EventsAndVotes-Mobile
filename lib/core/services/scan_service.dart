import 'dart:async';

import 'package:dio/dio.dart';

import '../network/api_client.dart';
import '../utils/api_response_utils.dart';
import '../../features/scanner/utils/scan_session_utils.dart';

class ScanSyncResult {
  final List<Map<String, dynamic>> tickets;
  final DateTime? syncedAt;
  final int ticketCount;
  final Map<String, dynamic>? event;
  final Map<String, dynamic>? job;

  const ScanSyncResult({
    required this.tickets,
    this.syncedAt,
    this.ticketCount = 0,
    this.event,
    this.job,
  });
}

class ScanMigrateResult {
  final String jobId;
  final String status;
  final int processedItems;
  final int failedItems;
  final int totalItems;
  final String? errorMessage;
  final Map<String, dynamic>? result;

  const ScanMigrateResult({
    required this.jobId,
    required this.status,
    this.processedItems = 0,
    this.failedItems = 0,
    this.totalItems = 0,
    this.errorMessage,
    this.result,
  });

  bool get isCompleted => status == 'completed';
  bool get isFailed => status == 'failed';
  bool get isPartialSuccess => isCompleted && failedItems > 0;
}

class ScanService {
  final ApiClient _api = ApiClient.instance;

  String _handleError(dynamic e, String defaultMessage) =>
      parseApiErrorMessage(e, defaultMessage);

  Map<String, dynamic> _scanCodeBody(String scanCode) => {
        'scan_code': scanCode.trim(),
      };

  Map<String, dynamic> _unwrap(dynamic body) {
    if (body is! Map) {
      throw Exception('Invalid response from server');
    }
    final map = Map<String, dynamic>.from(body);
    ensureApiSuccess(map);
    if (map['data'] is Map) {
      return normalizeScanSession(
        Map<String, dynamic>.from(map['data'] as Map),
      );
    }
    return normalizeScanSession(map);
  }

  Map<String, dynamic> _unwrapDataMap(dynamic body) {
    if (body is! Map) {
      throw Exception('Invalid response from server');
    }
    final map = Map<String, dynamic>.from(body);
    ensureApiSuccess(map);
    final data = map['data'];
    if (data is Map) return Map<String, dynamic>.from(data);
    return map;
  }

  /// GET /scan/validate/{code} — public, no Bearer auth.
  Future<Map<String, dynamic>> validateToken(String token) async {
    final encoded = Uri.encodeComponent(token.trim());
    try {
      final response = await _api.get(
        '/scan/validate/$encoded',
        public: true,
      );
      return _unwrap(response.data);
    } catch (e) {
      throw Exception(
        _handleError(
          e,
          'Could not validate scanner token. Check the link from your host.',
        ),
      );
    }
  }

  /// POST /scan/ticket — public, auth via scan_code in body.
  Future<Map<String, dynamic>> scanTicket({
    required String scanToken,
    required String qrData,
    String scanType = 'entry',
    String? location,
  }) async {
    try {
      final response = await _api.post(
        '/scan/ticket',
        data: {
          'scan_code': scanToken.trim(),
          'scan_token': scanToken.trim(),
          'ticket_code': qrData,
          'qr_data': qrData,
          'scan_type': scanType,
          if (location != null) 'location': location,
        },
        public: true,
      );
      final body = response.data;
      if (body is Map) {
        return Map<String, dynamic>.from(body);
      }
      throw Exception('Invalid scan response');
    } catch (e) {
      throw Exception(_handleError(e, 'Scan denied'));
    }
  }

  /// POST /scan/sync — download event tickets for offline cache.
  Future<ScanSyncResult> syncTickets(String scanCode) async {
    try {
      final response = await _api.post(
        '/scan/sync',
        data: _scanCodeBody(scanCode),
        public: true,
      );
      final data = _unwrapDataMap(response.data);

      final ticketsRaw = data['tickets'];
      final tickets = ticketsRaw is List
          ? ticketsRaw
              .whereType<Map>()
              .map((e) => Map<String, dynamic>.from(e))
              .toList()
          : <Map<String, dynamic>>[];

      final syncedRaw = data['synced_at']?.toString();
      final countRaw = data['ticket_count'];
      final count = countRaw is int
          ? countRaw
          : int.tryParse(countRaw?.toString() ?? '') ?? tickets.length;

      return ScanSyncResult(
        tickets: tickets,
        syncedAt: syncedRaw != null ? DateTime.tryParse(syncedRaw) : null,
        ticketCount: count,
        event: data['event'] is Map
            ? Map<String, dynamic>.from(data['event'] as Map)
            : null,
        job: data['job'] is Map
            ? Map<String, dynamic>.from(data['job'] as Map)
            : null,
      );
    } catch (e) {
      throw Exception(
        _handleError(e, 'Could not download ticket list for offline sync.'),
      );
    }
  }

  /// POST /scan/migrate — upload offline scans; polls job until done.
  Future<ScanMigrateResult> migrateScans({
    required String scanCode,
    required List<Map<String, dynamic>> scans,
    Duration pollInterval = const Duration(seconds: 2),
    Duration timeout = const Duration(minutes: 3),
  }) async {
    try {
      final response = await _api.post(
        '/scan/migrate',
        data: {
          ..._scanCodeBody(scanCode),
          'scans': scans,
        },
        options: Options(
          validateStatus: (status) =>
              status != null && (status == 202 || status == 200),
        ),
        public: true,
      );

      final body = response.data;
      if (body is! Map) {
        throw Exception('Invalid migration response');
      }
      final map = Map<String, dynamic>.from(body);
      ensureApiSuccess(map);

      final data = map['data'];
      if (data is! Map) {
        throw Exception('Migration response missing job data');
      }
      final dataMap = Map<String, dynamic>.from(data);
      final jobRaw = dataMap['job'];
      if (jobRaw is! Map) {
        throw Exception('Migration response missing job');
      }
      final job = Map<String, dynamic>.from(jobRaw);
      final jobId = job['id']?.toString();
      if (jobId == null || jobId.isEmpty) {
        throw Exception('Migration response missing job id');
      }

      final initialStatus = job['status']?.toString() ?? 'pending';
      if (initialStatus == 'completed' || initialStatus == 'failed') {
        return _migrateResultFromJob(jobId, job);
      }

      return _pollMigrateJob(
        scanCode: scanCode,
        jobId: jobId,
        pollInterval: pollInterval,
        timeout: timeout,
      );
    } catch (e) {
      throw Exception(_handleError(e, 'Migration to server failed'));
    }
  }

  /// GET /scan/jobs/{jobId} — poll sync/migrate job status.
  Future<Map<String, dynamic>> getJobStatus({
    required String scanCode,
    required String jobId,
  }) async {
    try {
      final encodedJob = Uri.encodeComponent(jobId.trim());
      final response = await _api.get(
        '/scan/jobs/$encodedJob',
        params: {'scan_code': scanCode.trim()},
        public: true,
      );
      return _unwrapDataMap(response.data);
    } catch (e) {
      throw Exception(_handleError(e, 'Could not check migration status'));
    }
  }

  Future<ScanMigrateResult> _pollMigrateJob({
    required String scanCode,
    required String jobId,
    required Duration pollInterval,
    required Duration timeout,
  }) async {
    final deadline = DateTime.now().add(timeout);

    while (DateTime.now().isBefore(deadline)) {
      await Future<void>.delayed(pollInterval);

      final job = await getJobStatus(scanCode: scanCode, jobId: jobId);
      final status = job['status']?.toString() ?? 'pending';

      if (status == 'completed' || status == 'failed') {
        return _migrateResultFromJob(jobId, job);
      }
    }

    throw Exception(
      'Migration is still processing. Scans remain queued and will retry automatically.',
    );
  }

  ScanMigrateResult _migrateResultFromJob(
    String jobId,
    Map<String, dynamic> job,
  ) {
    final status = job['status']?.toString() ?? 'failed';
    final processed = job['processed_items'];
    final failed = job['failed_items'];
    final total = job['total_items'];

    return ScanMigrateResult(
      jobId: jobId,
      status: status,
      processedItems: processed is int
          ? processed
          : int.tryParse(processed?.toString() ?? '') ?? 0,
      failedItems: failed is int
          ? failed
          : int.tryParse(failed?.toString() ?? '') ?? 0,
      totalItems: total is int
          ? total
          : int.tryParse(total?.toString() ?? '') ?? 0,
      errorMessage: job['error_message']?.toString(),
      result: job['result'] is Map
          ? Map<String, dynamic>.from(job['result'] as Map)
          : null,
    );
  }
}
