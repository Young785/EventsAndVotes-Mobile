class ScanRecord {
  final String id;
  final String guestName;
  final String ticketCode;
  final bool approved;
  final DateTime scannedAt;
  final String? ticketType;
  final String? declineReason;

  const ScanRecord({
    required this.id,
    required this.guestName,
    required this.ticketCode,
    required this.approved,
    required this.scannedAt,
    this.ticketType,
    this.declineReason,
  });
}
