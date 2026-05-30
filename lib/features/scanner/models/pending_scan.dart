class PendingScan {
  final String id;
  final String qrData;
  final String guestName;
  final String ticketCode;
  final bool approved;
  final DateTime scannedAt;
  final String? ticketType;
  final String? declineReason;
  final String? scanType;
  final String? location;

  const PendingScan({
    required this.id,
    required this.qrData,
    required this.guestName,
    required this.ticketCode,
    required this.approved,
    required this.scannedAt,
    this.ticketType,
    this.declineReason,
    this.scanType,
    this.location,
  });

  factory PendingScan.fromJson(Map<String, dynamic> json) {
    return PendingScan(
      id: json['id']?.toString() ?? '',
      qrData: json['qr_data']?.toString() ?? '',
      guestName: json['guest_name']?.toString() ?? 'Guest',
      ticketCode: json['ticket_code']?.toString() ?? '',
      approved: json['approved'] == true,
      scannedAt: DateTime.tryParse(json['scanned_at']?.toString() ?? '') ??
          DateTime.now(),
      ticketType: json['ticket_type']?.toString(),
      declineReason: json['decline_reason']?.toString() ??
          json['scan_reason']?.toString(),
      scanType: json['scan_type']?.toString(),
      location: json['location']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'qr_data': qrData,
        'guest_name': guestName,
        'ticket_code': ticketCode,
        'approved': approved,
        'scanned_at': scannedAt.toIso8601String(),
        if (ticketType != null) 'ticket_type': ticketType,
        if (declineReason != null) 'decline_reason': declineReason,
        if (scanType != null) 'scan_type': scanType,
        if (location != null) 'location': location,
      };

  Map<String, dynamic> toApiPayload() {
    final code = ticketCode.isNotEmpty ? ticketCode : qrData;
    return {
      'ticket_code': code,
      if (qrData.isNotEmpty && qrData != code) 'qr_data': qrData,
      'scan_type': scanType ?? 'entry',
      'scan_result': approved
          ? 'success'
          : (declineReason != null && declineReason!.isNotEmpty
              ? 'denied'
              : 'invalid'),
      'scanned_at': scannedAt.toUtc().toIso8601String(),
      if (location != null && location!.isNotEmpty) 'location': location,
      if (declineReason != null && declineReason!.isNotEmpty)
        'scan_reason': declineReason,
    };
  }
}
