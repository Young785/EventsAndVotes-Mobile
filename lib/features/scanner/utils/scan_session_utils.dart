import '../models/scan_record.dart';

/// Normalizes GET /scan/validate/{token} payload for [ScannerSessionProvider].
Map<String, dynamic> normalizeScanSession(Map<String, dynamic> raw) {
  final loc = raw['scan_location'] is Map
      ? Map<String, dynamic>.from(raw['scan_location'] as Map)
      : raw['location'] is Map
          ? Map<String, dynamic>.from(raw['location'] as Map)
          : <String, dynamic>{};

  Map<String, dynamic> event = {};
  if (loc['event'] is Map) {
    event = Map<String, dynamic>.from(loc['event'] as Map);
  } else if (raw['event'] is Map) {
    event = Map<String, dynamic>.from(raw['event'] as Map);
  }

  return {
    ...raw,
    'name': raw['name'] ?? raw['user']?['name'],
    'email': raw['email'] ?? raw['user']?['email'],
    'phone': raw['phone'] ??
        raw['phone_number'] ??
        raw['mobile'] ??
        raw['user']?['phone'] ??
        raw['user']?['phone_number'] ??
        raw['user']?['mobile'],
    'scan_location': loc,
    'event': event,
  };
}

int parseTotalScans(Map<String, dynamic> session) {
  for (final key in ['total_scans', 'lifetime_scans', 'scan_count']) {
    final v = session[key];
    if (v is int) return v;
    final n = int.tryParse(v?.toString() ?? '');
    if (n != null) return n;
  }
  return parseTodayScans(session);
}

int parseTodayScans(Map<String, dynamic> session) {
  for (final key in [
    'today_scans',
    'scans_today',
    'today_scan_count',
    'total_scans_today',
  ]) {
    final v = session[key];
    if (v is int) return v;
    final n = int.tryParse(v?.toString() ?? '');
    if (n != null) return n;
  }
  return 0;
}

DateTime? parseLastScanAt(Map<String, dynamic> session) {
  for (final key in ['last_scan_at', 'last_scan', 'last_scanned_at']) {
    final d = DateTime.tryParse(session[key]?.toString() ?? '');
    if (d != null) return d;
  }
  return null;
}

List<ScanRecord> parseScanHistory(Map<String, dynamic> session) {
  for (final key in [
    'recent_scans',
    'scan_history',
    'scans',
    'logs',
    'today_scans_list',
  ]) {
    final raw = session[key];
    if (raw is List) {
      return raw
          .map(recordFromApi)
          .whereType<ScanRecord>()
          .toList()
        ..sort((a, b) => b.scannedAt.compareTo(a.scannedAt));
    }
  }
  return [];
}

ScanRecord? recordFromApi(dynamic item) {
  if (item is! Map) return null;
  final m = Map<String, dynamic>.from(item);

  final status = (m['status'] ?? m['result'] ?? m['scan_status'])
      ?.toString()
      .toLowerCase();
  final approved = status == 'success' ||
      status == 'approved' ||
      status == 'valid' ||
      m['approved'] == true ||
      m['is_valid'] == true;

  final guest = m['guest_name'] ??
      m['guest']?['name'] ??
      m['name'] ??
      m['holder_name'] ??
      'Guest';

  final code = m['ticket_code'] ??
      m['code'] ??
      m['ticket']?['code'] ??
      m['qr_data'] ??
      '—';

  final scannedRaw =
      m['scanned_at'] ?? m['created_at'] ?? m['timestamp'] ?? m['time'];

  return ScanRecord(
    id: m['id']?.toString() ?? '${scannedRaw}_${code.hashCode}',
    guestName: guest.toString(),
    ticketCode: code.toString(),
    approved: approved,
    scannedAt: DateTime.tryParse(scannedRaw?.toString() ?? '') ?? DateTime.now(),
    ticketType: m['ticket_type']?.toString() ??
        m['tier']?.toString() ??
        m['ticket']?['type']?.toString(),
    declineReason: approved
        ? null
        : m['message']?.toString() ??
            m['reason']?.toString() ??
            m['error']?.toString(),
  );
}

ScanRecord recordFromScanResponse(
  Map<String, dynamic> result, {
  required String qrData,
}) {
  final status = result['status']?.toString().toLowerCase();
  final approved = status == 'success';
  final data = result['data'] is Map
      ? Map<String, dynamic>.from(result['data'] as Map)
      : result;

  final guest = data['guest_name'] ??
      data['name'] ??
      data['guest']?['name'] ??
      'Guest';

  final code = data['ticket_code'] ??
      data['code'] ??
      (qrData.length > 24 ? '${qrData.substring(0, 24)}…' : qrData);

  return ScanRecord(
    id: data['id']?.toString() ??
        DateTime.now().millisecondsSinceEpoch.toString(),
    guestName: guest.toString(),
    ticketCode: code.toString(),
    approved: approved,
    scannedAt: DateTime.now(),
    ticketType: data['ticket_type']?.toString() ?? data['tier']?.toString(),
    declineReason:
        approved ? null : result['message']?.toString() ?? 'Scan denied',
  );
}
