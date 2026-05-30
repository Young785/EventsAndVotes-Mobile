import 'dart:convert';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import '../models/migration_record.dart';
import '../models/pending_scan.dart';

class ScannerMigrationStore {
  Future<File> _fileForEvent(String eventKey) async {
    final dir = await getApplicationDocumentsDirectory();
    final safe = eventKey.replaceAll(RegExp(r'[^a-zA-Z0-9_-]'), '_');
    return File('${dir.path}/scanner_migration_$safe.json');
  }

  Future<({
    List<PendingScan> pending,
    List<MigrationRecord> history,
    DateTime? lastMigrationAt,
  })> load(String eventKey) async {
    try {
      final file = await _fileForEvent(eventKey);
      if (!await file.exists()) {
        return (
          pending: <PendingScan>[],
          history: <MigrationRecord>[],
          lastMigrationAt: null,
        );
      }
      final raw = jsonDecode(await file.readAsString()) as Map<String, dynamic>;
      final pending = (raw['pending'] as List? ?? [])
          .whereType<Map>()
          .map((e) => PendingScan.fromJson(Map<String, dynamic>.from(e)))
          .toList();
      final history = (raw['history'] as List? ?? [])
          .whereType<Map>()
          .map((e) => MigrationRecord.fromJson(Map<String, dynamic>.from(e)))
          .toList();
      final lastRaw = raw['last_migration_at']?.toString();
      return (
        pending: pending,
        history: history,
        lastMigrationAt:
            lastRaw != null ? DateTime.tryParse(lastRaw) : null,
      );
    } catch (_) {
      return (
        pending: <PendingScan>[],
        history: <MigrationRecord>[],
        lastMigrationAt: null,
      );
    }
  }

  Future<void> save({
    required String eventKey,
    required List<PendingScan> pending,
    required List<MigrationRecord> history,
    DateTime? lastMigrationAt,
  }) async {
    final file = await _fileForEvent(eventKey);
    await file.writeAsString(
      jsonEncode({
        'pending': pending.map((p) => p.toJson()).toList(),
        'history': history.map((h) => h.toJson()).toList(),
        if (lastMigrationAt != null)
          'last_migration_at': lastMigrationAt.toIso8601String(),
      }),
    );
  }

  Future<void> clear(String eventKey) async {
    final file = await _fileForEvent(eventKey);
    if (await file.exists()) await file.delete();
  }
}
