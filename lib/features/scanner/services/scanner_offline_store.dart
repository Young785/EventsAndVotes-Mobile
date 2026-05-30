import 'dart:convert';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import '../models/offline_ticket.dart';

class ScannerOfflineStore {
  Future<File> _fileForEvent(String eventKey) async {
    final dir = await getApplicationDocumentsDirectory();
    final safe = eventKey.replaceAll(RegExp(r'[^a-zA-Z0-9_-]'), '_');
    return File('${dir.path}/scanner_offline_$safe.json');
  }

  Future<({List<OfflineTicket> tickets, DateTime? syncedAt})> load(
    String eventKey,
  ) async {
    try {
      final file = await _fileForEvent(eventKey);
      if (!await file.exists()) {
        return (tickets: <OfflineTicket>[], syncedAt: null);
      }
      final raw = jsonDecode(await file.readAsString()) as Map<String, dynamic>;
      final list = (raw['tickets'] as List? ?? [])
          .whereType<Map>()
          .map((e) => OfflineTicket.fromJson(Map<String, dynamic>.from(e)))
          .toList();
      final syncedRaw = raw['synced_at']?.toString();
      return (
        tickets: list,
        syncedAt: syncedRaw != null ? DateTime.tryParse(syncedRaw) : null,
      );
    } catch (_) {
      return (tickets: <OfflineTicket>[], syncedAt: null);
    }
  }

  Future<void> save(
    String eventKey,
    List<OfflineTicket> tickets,
    DateTime syncedAt,
  ) async {
    final file = await _fileForEvent(eventKey);
    await file.writeAsString(
      jsonEncode({
        'synced_at': syncedAt.toIso8601String(),
        'tickets': tickets.map((t) => t.toJson()).toList(),
      }),
    );
  }

  Future<void> clear(String eventKey) async {
    final file = await _fileForEvent(eventKey);
    if (await file.exists()) await file.delete();
  }
}
