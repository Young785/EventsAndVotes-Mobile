class OfflineTicket {
  final String id;
  final String qrCode;
  final String guestName;
  final String ticketCode;
  final String ticketType;
  final String paymentStatus;
  final bool alreadyScanned;
  final String? guestEmail;
  final String? guestPhone;

  const OfflineTicket({
    required this.id,
    required this.qrCode,
    required this.guestName,
    required this.ticketCode,
    required this.ticketType,
    this.paymentStatus = 'paid',
    this.alreadyScanned = false,
    this.guestEmail,
    this.guestPhone,
  });

  factory OfflineTicket.fromJson(Map<String, dynamic> json) {
    String? readContact(List<dynamic> keys) {
      for (final key in keys) {
        final raw = json[key];
        if (raw != null && raw.toString().trim().isNotEmpty) {
          return raw.toString().trim();
        }
      }
      return null;
    }

    String? readNested(List<List<String>> paths) {
      for (final path in paths) {
        final value = _nestedValue(json, path);
        if (value != null) return value;
      }
      return null;
    }

    final status = json['status']?.toString().toLowerCase() ?? '';
    final scanCount = json['scan_count'] is int
        ? json['scan_count'] as int
        : int.tryParse(json['scan_count']?.toString() ?? '') ?? 0;

    return OfflineTicket(
      id: json['id']?.toString() ?? json['uuid']?.toString() ?? '',
      qrCode: json['entry_code']?.toString() ??
          json['qr_code']?.toString() ??
          json['qr_data']?.toString() ??
          json['ticket_code']?.toString() ??
          json['uuid']?.toString() ??
          '',
      guestName: json['guest_name']?.toString() ??
          json['holder_name']?.toString() ??
          json['name']?.toString() ??
          'Guest',
      ticketCode: json['entry_code']?.toString() ??
          json['ticket_code']?.toString() ??
          json['code']?.toString() ??
          json['uuid']?.toString() ??
          '',
      ticketType: json['ticket_type']?.toString() ??
          json['tier_name']?.toString() ??
          json['tier']?.toString() ??
          json['type']?.toString() ??
          'General',
      paymentStatus: json['payment_status']?.toString() ??
          json['status']?.toString() ??
          'paid',
      alreadyScanned: json['already_scanned'] == true ||
          json['is_scanned'] == true ||
          json['scanned'] == true ||
          status == 'used' ||
          scanCount > 0 ||
          json['last_scanned_at'] != null,
      guestEmail: readContact([
            'guest_email',
            'email',
            'gmail',
            'holder_email',
            'user_email',
          ]) ??
          readNested([
            ['user', 'email'],
            ['user', 'gmail'],
            ['holder', 'email'],
            ['guest', 'email'],
            ['attendee', 'email'],
            ['customer', 'email'],
          ]),
      guestPhone: readContact([
            'guest_phone',
            'phone',
            'phone_number',
            'mobile',
            'holder_phone',
          ]) ??
          readNested([
            ['user', 'phone'],
            ['user', 'phone_number'],
            ['holder', 'phone'],
            ['guest', 'phone'],
            ['attendee', 'phone'],
            ['customer', 'phone'],
          ]),
    );
  }

  static String? _nestedValue(Map<String, dynamic> json, List<String> path) {
    dynamic current = json;
    for (final key in path) {
      if (current is! Map) return null;
      current = current[key];
    }
    if (current == null) return null;
    final text = current.toString().trim();
    return text.isEmpty ? null : text;
  }

  /// Gmail shown in UI when available from the API.
  String get displayGmail {
    final direct = guestEmail?.trim();
    if (direct != null && direct.isNotEmpty) return direct;
    return 'Not provided';
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'qr_code': qrCode,
        'guest_name': guestName,
        'ticket_code': ticketCode,
        'ticket_type': ticketType,
        'payment_status': paymentStatus,
        'already_scanned': alreadyScanned,
        if (guestEmail != null) 'guest_email': guestEmail,
        if (guestPhone != null) 'guest_phone': guestPhone,
      };

  OfflineTicket copyWith({
    bool? alreadyScanned,
    String? guestEmail,
    String? guestPhone,
  }) =>
      OfflineTicket(
        id: id,
        qrCode: qrCode,
        guestName: guestName,
        ticketCode: ticketCode,
        ticketType: ticketType,
        paymentStatus: paymentStatus,
        alreadyScanned: alreadyScanned ?? this.alreadyScanned,
        guestEmail: guestEmail ?? this.guestEmail,
        guestPhone: guestPhone ?? this.guestPhone,
      );

  bool get isPaid {
    final s = paymentStatus.toLowerCase();
    return s == 'paid' ||
        s == 'completed' ||
        s == 'success' ||
        s == 'sold' ||
        s == 'used';
  }

  bool get isExcludedFromCache {
    final s = paymentStatus.toLowerCase();
    return s == 'cancelled' ||
        s == 'refunded' ||
        s == 'expired' ||
        s == 'pending';
  }
}
