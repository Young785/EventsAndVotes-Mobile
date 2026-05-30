import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/services/scan_service.dart';
import '../../../core/utils/scan_token_utils.dart';
import '../models/migration_record.dart';
import '../models/offline_ticket.dart';
import '../models/pending_scan.dart';
import '../models/scan_exceptions.dart';
import '../models/scan_record.dart';
import '../services/scanner_migration_store.dart';
import '../services/scanner_offline_store.dart';
import '../utils/scan_session_utils.dart';

String _friendlyError(Object e) =>
    e.toString().replaceAll('Exception: ', '').trim();

class ScannerSessionProvider extends ChangeNotifier {
  final ScanService _scanService = ScanService();
  final ScannerOfflineStore _offlineStore = ScannerOfflineStore();
  final ScannerMigrationStore _migrationStore = ScannerMigrationStore();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  String? _token;
  Map<String, dynamic>? _session;
  bool _isLoading = true;
  bool _isSyncing = false;
  bool _isMigrating = false;
  String? _error;
  String? _syncError;
  int _todayScans = 0;
  DateTime? _lastScan;
  DateTime? _lastSyncedAt;
  DateTime? _lastMigrationAt;
  Timer? _migrationTimer;
  final List<ScanRecord> _scanHistory = [];
  final List<OfflineTicket> _offlineTickets = [];
  final List<PendingScan> _pendingScans = [];
  final List<MigrationRecord> _migrationHistory = [];
  MigrationRecord? _migrationAlert;
  final Set<String> _scannedKeys = {};

  String? get token => _token;
  Map<String, dynamic>? get session => _session;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _token != null && _session != null;
  bool get isSyncing => _isSyncing;
  bool get isMigrating => _isMigrating;
  String? get syncError => _syncError;
  DateTime? get lastSyncedAt => _lastSyncedAt;
  DateTime? get lastMigrationAt => _lastMigrationAt;
  int get pendingMigrationCount => _pendingScans.length;
  List<MigrationRecord> get migrationHistory =>
      List.unmodifiable(_migrationHistory);
  MigrationRecord? get migrationAlert => _migrationAlert;

  void clearMigrationAlert() {
    _migrationAlert = null;
  }
  Duration get migrationInterval =>
      Duration(minutes: AppConstants.scannerMigrationIntervalMinutes);
  DateTime? get nextMigrationAt {
    if (_lastMigrationAt == null) return null;
    return _lastMigrationAt!.add(migrationInterval);
  }
  Duration? get timeUntilNextMigration {
    final next = nextMigrationAt;
    if (next == null) return null;
    final diff = next.difference(DateTime.now());
    return diff.isNegative ? Duration.zero : diff;
  }
  int get offlineTicketCount => _offlineTickets.length;
  int get offlinePaidCount =>
      _offlineTickets
          .where((t) => t.isPaid && !isOfflineTicketScanned(t))
          .length;
  List<OfflineTicket> get offlineTickets => List.unmodifiable(_offlineTickets);
  bool get hasOfflineData => _offlineTickets.isNotEmpty;

  Duration? get nextMigrationIn {
    if (_lastMigrationAt == null) {
      if (_pendingScans.isEmpty && !hasOfflineData) return null;
      if (lastSyncedAt != null) {
        final next = lastSyncedAt!.add(migrationInterval);
        final remaining = next.difference(DateTime.now());
        return remaining.isNegative ? Duration.zero : remaining;
      }
      return migrationInterval;
    }
    final remaining = nextMigrationAt!.difference(DateTime.now());
    return remaining.isNegative ? Duration.zero : remaining;
  }

  DateTime? get scheduledMigrationAt {
    if (_lastMigrationAt != null) return nextMigrationAt;
    if (lastSyncedAt != null && (hasOfflineData || pendingMigrationCount > 0)) {
      return lastSyncedAt!.add(migrationInterval);
    }
    return null;
  }

  int get todayScans => _todayScans;
  DateTime? get lastScan => _lastScan;
  List<ScanRecord> get scanHistory => List.unmodifiable(_scanHistory);
  int get approvedCount => _scanHistory.where((r) => r.approved).length;
  int get declinedCount => _scanHistory.where((r) => !r.approved).length;
  double get approvalRate =>
      todayScans == 0 ? 0 : approvedCount / todayScans;

  String get eventTitle => event['title']?.toString() ?? 'Event';
  String get eventId =>
      event['id']?.toString() ?? event['uuid']?.toString() ?? 'unknown_event';
  String get eventVenue => event['venue']?.toString() ?? '—';
  String get locationDescription =>
      location['description']?.toString() ?? 'Gate checkpoint';

  DateTime? get eventStartAt => _parseEventDateTime('start_date', 'start_time');
  DateTime? get eventEndAt => _parseEventDateTime('end_date', 'end_time');

  String get eventStatus {
    final now = DateTime.now();
    final start = eventStartAt;
    final end = eventEndAt;
    if (end != null && now.isAfter(end)) return 'ended';
    if (start != null && now.isBefore(start)) return 'upcoming';
    return event['status']?.toString().toLowerCase() == 'draft'
        ? 'upcoming'
        : 'live';
  }

  Duration? get eventTimeRemaining {
    final end = eventEndAt;
    if (end == null) return null;
    final diff = end.difference(DateTime.now());
    return diff.isNegative ? Duration.zero : diff;
  }

  DateTime? _parseEventDateTime(String dateKey, String timeKey) {
    final dateRaw = event[dateKey] ?? event['${dateKey}s_at'];
    if (dateRaw == null) return null;
    final parsed = DateTime.tryParse(dateRaw.toString());
    if (parsed == null) return null;

    final timeRaw = event[timeKey]?.toString();
    if (timeRaw == null || !timeRaw.contains(':')) return parsed;

    final parts = timeRaw.split(':');
    final hour = int.tryParse(parts[0]) ?? parsed.hour;
    final minute =
        int.tryParse(parts.length > 1 ? parts[1] : '0') ?? parsed.minute;
    return DateTime(parsed.year, parsed.month, parsed.day, hour, minute);
  }

  Map<String, dynamic> get event {
    final loc = location;
    if (loc['event'] is Map) {
      return Map<String, dynamic>.from(loc['event'] as Map);
    }
    return Map<String, dynamic>.from(_session?['event'] ?? {});
  }

  Map<String, dynamic> get location {
    final loc = _session?['location'] ?? _session?['scan_location'];
    return loc is Map ? Map<String, dynamic>.from(loc) : {};
  }

  String get scannerName =>
      _session?['name']?.toString() ??
      _session?['user']?['name']?.toString() ??
      'Gate Staff';

  String get scannerEmail {
    for (final raw in [
      _session?['email'],
      _session?['user']?['email'],
      _session?['user']?['gmail'],
      _session?['contact']?['email'],
    ]) {
      if (raw != null && raw.toString().trim().isNotEmpty) {
        return raw.toString().trim();
      }
    }
    return '—';
  }

  String get scannerPhone {
    for (final raw in [
      _session?['phone'],
      _session?['phone_number'],
      _session?['mobile'],
      _session?['user']?['phone'],
      _session?['user']?['phone_number'],
      _session?['contact']?['phone'],
    ]) {
      if (raw != null && raw.toString().trim().isNotEmpty) {
        return raw.toString().trim();
      }
    }
    return '—';
  }

  String get role => _session?['role']?.toString() ?? 'scanner';

  String get scanType =>
      location['location_type']?.toString() ??
      location['type']?.toString() ??
      'entry';

  String get locationName => location['name']?.toString() ?? 'Main Entrance';

  String? get eventPosterUrl {
    final raw = event['poster_image'] ?? event['image'];
    if (raw == null || raw.toString().isEmpty) return null;
    return AppConstants.storageUrl(raw.toString());
  }

  int get totalScans {
    for (final key in ['total_scans', 'lifetime_scans', 'scan_count']) {
      final v = _session?[key];
      if (v is int) return v;
      final n = int.tryParse(v?.toString() ?? '');
      if (n != null) return n;
    }
    return todayScans;
  }

  int get declinedSinceRefresh =>
      _scanHistory.where((r) => !r.approved).length;

  DateTime? get tokenExpiresAt {
    final raw = _session?['token_expires_at'] ??
        _session?['expires_at'] ??
        _session?['token_expires'];
    if (raw != null) {
      return DateTime.tryParse(raw.toString());
    }
    return null;
  }

  Duration? get tokenTimeRemaining {
    final end = tokenExpiresAt;
    if (end == null) return null;
    final diff = end.difference(DateTime.now());
    return diff.isNegative ? Duration.zero : diff;
  }

  Future<void> initialize() async {
    _isLoading = true;
    notifyListeners();

    _token = await _storage.read(key: AppConstants.scanTokenKey);
    if (_token != null && _token!.isNotEmpty) {
      try {
        await _loadSessionFromApi(_token!);
      } catch (_) {
        await _clearSession();
      }
      if (isAuthenticated) {
        await _loadOfflineFromDisk();
        await _loadMigrationFromDisk();
        _startMigrationScheduler();
      }
    }

    _isLoading = false;
    notifyListeners();
  }

  void disposeMigration() {
    _migrationTimer?.cancel();
    _migrationTimer = null;
  }

  void _startMigrationScheduler() {
    _migrationTimer?.cancel();
    if (!isAuthenticated) return;

    _migrationTimer = Timer.periodic(
      Duration(minutes: AppConstants.scannerMigrationIntervalMinutes),
      (_) => migrateToBackend(),
    );
  }

  Future<void> migrateToBackend({bool manual = false}) async {
    if (_token == null || _isMigrating) return;

    if (_pendingScans.isEmpty) return;

    _isMigrating = true;
    notifyListeners();

    final batch = List<PendingScan>.from(_pendingScans);
    var uploaded = 0;
    var failed = 0;
    String? errorMessage;

    MigrationRecord? completed;

    try {
      final result = await _scanService.migrateScans(
        scanCode: _token!,
        scans: batch.map((s) => s.toApiPayload()).toList(),
      );

      if (result.isCompleted) {
        uploaded = result.processedItems > 0
            ? result.processedItems - result.failedItems
            : batch.length;
        failed = result.failedItems;
        _pendingScans.clear();

        completed = MigrationRecord(
          id: result.jobId,
          migratedAt: DateTime.now(),
          status: failed > 0 ? MigrationStatus.partial : MigrationStatus.success,
          uploadedCount: uploaded,
          failedCount: failed,
          message: failed > 0
              ? '$uploaded uploaded · $failed failed'
              : uploaded > 0
                  ? '$uploaded scan${uploaded == 1 ? '' : 's'} uploaded'
                  : null,
        );
        _recordMigration(completed);
      } else {
        failed = batch.length;
        errorMessage = result.errorMessage ?? 'Migration failed on server';
        completed = MigrationRecord(
          id: result.jobId,
          migratedAt: DateTime.now(),
          status: MigrationStatus.failed,
          uploadedCount: result.processedItems,
          failedCount: failed,
          message: errorMessage,
        );
        _recordMigration(completed);
      }
    } catch (e) {
      failed = batch.length;
      errorMessage = _friendlyError(e);
      completed = MigrationRecord(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        migratedAt: DateTime.now(),
        status: MigrationStatus.failed,
        uploadedCount: 0,
        failedCount: failed,
        message: errorMessage,
      );
      _recordMigration(completed);
    } finally {
      _isMigrating = false;
      _lastMigrationAt = DateTime.now();
      if (completed != null) _migrationAlert = completed;
      await _persistMigration();
      notifyListeners();
    }
  }

  void _recordMigration(MigrationRecord record) {
    _migrationHistory.insert(0, record);
    if (_migrationHistory.length > AppConstants.scannerMigrationHistoryLimit) {
      _migrationHistory.removeRange(
        AppConstants.scannerMigrationHistoryLimit,
        _migrationHistory.length,
      );
    }
    _lastMigrationAt = record.migratedAt;
  }

  void _queueForMigration({
    required String qrData,
    required ScanRecord record,
  }) {
    _pendingScans.add(
      PendingScan(
        id: record.id,
        qrData: qrData,
        guestName: record.guestName,
        ticketCode: record.ticketCode,
        approved: record.approved,
        scannedAt: record.scannedAt,
        ticketType: record.ticketType,
        declineReason: record.declineReason,
        scanType: scanType,
        location: locationName,
      ),
    );
    _persistMigration();
  }

  Future<void> _loadMigrationFromDisk() async {
    final loaded = await _migrationStore.load(eventId);
    _pendingScans
      ..clear()
      ..addAll(loaded.pending);
    _migrationHistory
      ..clear()
      ..addAll(loaded.history);
    _lastMigrationAt = loaded.lastMigrationAt;
  }

  Future<void> _persistMigration() async {
    await _migrationStore.save(
      eventKey: eventId,
      pending: _pendingScans,
      history: _migrationHistory,
      lastMigrationAt: _lastMigrationAt,
    );
  }

  Future<void> syncPaidTickets() async {
    if (_token == null) {
      _syncError = 'Not signed in as scanner';
      notifyListeners();
      return;
    }

    _isSyncing = true;
    _syncError = null;
    notifyListeners();

    try {
      final syncResult = await _scanService.syncTickets(_token!);
      final tickets = syncResult.tickets
          .map(OfflineTicket.fromJson)
          .where((t) => t.qrCode.isNotEmpty && !t.isExcludedFromCache)
          .toList();

      _offlineTickets
        ..clear()
        ..addAll(tickets);
      _lastSyncedAt = syncResult.syncedAt ?? DateTime.now();
      await _offlineStore.save(eventId, _offlineTickets, _lastSyncedAt!);
      if (_lastMigrationAt == null) {
        _lastMigrationAt = DateTime.now();
        await _persistMigration();
      }
      _startMigrationScheduler();
      _isSyncing = false;
      notifyListeners();

      if (_pendingScans.isNotEmpty) {
        unawaited(migrateToBackend());
      }
    } catch (e) {
      _syncError = _friendlyError(e);
      _isSyncing = false;
      notifyListeners();
    }
  }

  Future<void> clearOfflineTickets() async {
    _offlineTickets.clear();
    _lastSyncedAt = null;
    await _offlineStore.clear(eventId);
    notifyListeners();
  }

  OfflineTicket? lookupOfflineTicket(String qrData) {
    final normalized = qrData.trim();
    if (normalized.isEmpty) return null;

    for (final ticket in _offlineTickets) {
      if (ticket.qrCode == normalized ||
          ticket.ticketCode == normalized ||
          normalized.contains(ticket.ticketCode) ||
          ticket.qrCode.contains(normalized)) {
        return ticket;
      }
    }
    return null;
  }

  /// Whether this cached ticket has already been scanned on this device.
  bool isOfflineTicketScanned(OfflineTicket ticket) {
    if (ticket.alreadyScanned) return true;
    if (ticket.id.isNotEmpty && _scannedKeys.contains(ticket.id)) return true;
    if (ticket.ticketCode.isNotEmpty &&
        _scannedKeys.contains(ticket.ticketCode)) {
      return true;
    }
    return approvedScanForOfflineTicket(ticket) != null;
  }

  /// Latest approved scan record for a cached ticket, if any.
  ScanRecord? approvedScanForOfflineTicket(OfflineTicket ticket) {
    for (final record in _scanHistory) {
      if (record.approved && _offlineTicketMatchesRecord(record, ticket)) {
        return record;
      }
    }
    return null;
  }

  bool _offlineTicketMatchesRecord(ScanRecord record, OfflineTicket ticket) {
    if (record.ticketCode == ticket.ticketCode) return true;
    if (record.guestName != ticket.guestName) return false;

    final code = record.ticketCode.replaceAll('…', '').trim();
    if (code.isEmpty) return false;
    return ticket.ticketCode.startsWith(code) ||
        code.startsWith(ticket.ticketCode);
  }

  Future<void> _loadOfflineFromDisk() async {
    final loaded = await _offlineStore.load(eventId);
    _offlineTickets
      ..clear()
      ..addAll(loaded.tickets);
    _lastSyncedAt = loaded.syncedAt;
  }

  Future<void> _persistOfflineTickets() async {
    if (_lastSyncedAt == null) return;
    await _offlineStore.save(eventId, _offlineTickets, _lastSyncedAt!);
  }

  void _markOfflineScanned(String qrData) {
    final match = lookupOfflineTicket(qrData);
    if (match == null) return;
    final index = _offlineTickets.indexWhere((t) => t.id == match.id);
    if (index >= 0) {
      _offlineTickets[index] = match.copyWith(alreadyScanned: true);
      _persistOfflineTickets();
    }
    _rememberScanned(qrData);
  }

  Future<bool> loginWithInput(String input) async {
    final token = extractScanToken(input);
    if (token.isEmpty) {
      _error = 'Please enter your scanner token';
      notifyListeners();
      return false;
    }
    return loginWithToken(token);
  }

  Future<bool> loginWithToken(String token) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _loadSessionFromApi(token);
      await _storage.write(key: AppConstants.scanTokenKey, value: token);
      await _loadOfflineFromDisk();
      await _loadMigrationFromDisk();
      _startMigrationScheduler();
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = _friendlyError(e);
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> refreshSession() async {
    if (_token == null) return;
    try {
      await _syncSessionFromApi();
    } catch (e) {
      _error = _friendlyError(e);
      notifyListeners();
    }
  }

  Future<ScanRecord> scanTicket(String qrData) async {
    if (_token == null) throw Exception('Not signed in as scanner');

    if (_wasAlreadyScanned(qrData)) {
      final offline = lookupOfflineTicket(qrData);
      throw AlreadyScannedException(
        guestName: offline?.guestName ?? _guestNameFromQr(qrData),
      );
    }

    final offline = lookupOfflineTicket(qrData);
    if (offline != null) {
      if (!offline.isPaid) {
        final record = ScanRecord(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          guestName: offline.guestName,
          ticketCode: offline.ticketCode,
          approved: false,
          scannedAt: DateTime.now(),
          ticketType: offline.ticketType,
          declineReason: 'Ticket not paid',
        );
        _prependRecord(record);
        throw Exception('Ticket not paid');
      }

      if (hasOfflineData) {
        _markOfflineScanned(qrData);
        final record = ScanRecord(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          guestName: offline.guestName,
          ticketCode: offline.ticketCode,
          approved: true,
          scannedAt: DateTime.now(),
          ticketType: offline.ticketType,
        );
        _prependRecord(record, qrData: qrData, queueMigration: true);
        _rememberScanned(qrData);
        return record;
      }
    }

    if (hasOfflineData && offline == null) {
      final record = ScanRecord(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        guestName: _guestNameFromQr(qrData) ?? 'Unknown Guest',
        ticketCode:
            qrData.length > 24 ? '${qrData.substring(0, 24)}…' : qrData,
        approved: false,
        scannedAt: DateTime.now(),
        declineReason: 'Ticket not found in offline list',
      );
      _prependRecord(record);
      throw Exception('Ticket not found in offline list');
    }

    try {
      final result = await _scanService.scanTicket(
        scanToken: _token!,
        qrData: qrData,
        scanType: scanType,
        location: locationName,
      );
      final record = recordFromScanResponse(result, qrData: qrData);
      _prependRecord(record);
      if (record.approved) _rememberScanned(qrData);
      await _syncSessionFromApi();
      return record;
    } catch (e) {
      final record = ScanRecord(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        guestName: _guestNameFromQr(qrData) ?? 'Unknown Guest',
        ticketCode:
            qrData.length > 24 ? '${qrData.substring(0, 24)}…' : qrData,
        approved: false,
        scannedAt: DateTime.now(),
        declineReason: e.toString().replaceAll('Exception: ', ''),
      );
      _prependRecord(record);
      throw Exception(_friendlyError(e));
    }
  }

  void _prependRecord(
    ScanRecord record, {
    String? qrData,
    bool queueMigration = false,
  }) {
    _scanHistory.insert(0, record);
    _todayScans++;
    _lastScan = record.scannedAt;
    if (queueMigration && qrData != null) {
      _queueForMigration(qrData: qrData, record: record);
    }
    notifyListeners();
  }

  String? _guestNameFromQr(String qr) {
    if (qr.contains('name=')) {
      final part = qr.split('name=').last.split('&').first;
      return Uri.decodeComponent(part);
    }
    return null;
  }

  String _scanKey(String qrData) {
    final offline = lookupOfflineTicket(qrData);
    if (offline != null) {
      if (offline.id.isNotEmpty) return offline.id;
      if (offline.ticketCode.isNotEmpty) return offline.ticketCode;
    }
    return qrData.trim();
  }

  bool _wasAlreadyScanned(String qrData) {
    final offline = lookupOfflineTicket(qrData);
    if (offline?.alreadyScanned == true) return true;
    return _scannedKeys.contains(_scanKey(qrData));
  }

  void _rememberScanned(String qrData) {
    _scannedKeys.add(_scanKey(qrData));
  }

  Future<void> logout() async {
    disposeMigration();
    await _clearSession();
    notifyListeners();
  }

  Future<void> _loadSessionFromApi(String token) async {
    final session = await _scanService.validateToken(token);
    _token = token;
    _applySession(session, replaceHistory: true);
  }

  Future<void> _syncSessionFromApi() async {
    if (_token == null) return;
    final session = await _scanService.validateToken(_token!);
    _applySession(session, replaceHistory: false);
    notifyListeners();
  }

  void _applySession(
    Map<String, dynamic> session, {
    required bool replaceHistory,
  }) {
    _session = session;
    _todayScans = parseTodayScans(session);
    final apiLast = parseLastScanAt(session);
    if (apiLast != null) _lastScan = apiLast;

    final fromApi = parseScanHistory(session);
    if (fromApi.isNotEmpty) {
      _scanHistory
        ..clear()
        ..addAll(fromApi);
      _todayScans = _scanHistory.length;
    } else if (replaceHistory) {
      _scanHistory.clear();
    }
    _error = null;
  }

  Future<void> _clearSession() async {
    _token = null;
    _session = null;
    _error = null;
    _todayScans = 0;
    _lastScan = null;
    _lastMigrationAt = null;
    _scanHistory.clear();
    _offlineTickets.clear();
    _pendingScans.clear();
    _migrationHistory.clear();
    _scannedKeys.clear();
    _lastSyncedAt = null;
    await _storage.delete(key: AppConstants.scanTokenKey);
  }
}
