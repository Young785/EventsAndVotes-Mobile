import 'package:flutter/foundation.dart';
import '../services/tickets_service.dart';

/// Tracks the number of tickets the authenticated user currently holds.
/// Refreshed on app start, after purchase, and on manual pull-to-refresh.
class TicketCartProvider extends ChangeNotifier {
  final TicketsService _service = TicketsService();

  int _count = 0;
  int get count => _count;

  /// Fetch fresh count from the API.
  Future<void> refresh() async {
    try {
      final items = await _service.getMyTickets();
      _count = items.length;
      notifyListeners();
    } catch (_) {
      // Silently ignore — badge just stays at its last known value.
    }
  }

  /// Increment optimistically (call right after a successful purchase).
  void increment([int by = 1]) {
    _count += by;
    notifyListeners();
  }

  /// Reset to zero (call on logout).
  void reset() {
    _count = 0;
    notifyListeners();
  }
}
