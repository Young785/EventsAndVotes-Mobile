import 'package:flutter/material.dart';
import '../../../core/constants/app_constants.dart';

class TicketModel {
  final String uuid;
  final String? ticketNumber;
  final String status;
  final String? tierName;
  final String? eventId;
  final String? eventTitle;
  final String? eventPoster;
  final String? venue;
  final String? startDate;
  final String? customerName;
  final String? customerEmail;
  final double? price;
  final bool isUsed;
  final String? createdAt;
  /// Gradient colours from the ticket template (e.g. "Gradient Concert").
  final Color? templatePrimary;
  final Color? templateSecondary;

  TicketModel({
    required this.uuid,
    this.ticketNumber,
    required this.status,
    this.tierName,
    this.eventId,
    this.eventTitle,
    this.eventPoster,
    this.venue,
    this.startDate,
    this.customerName,
    this.customerEmail,
    this.price,
    this.isUsed = false,
    this.createdAt,
    this.templatePrimary,
    this.templateSecondary,
  });

  TicketModel copyWith({String? eventPoster}) => TicketModel(
        uuid: uuid,
        ticketNumber: ticketNumber,
        status: status,
        tierName: tierName,
        eventId: eventId,
        eventTitle: eventTitle,
        eventPoster: eventPoster ?? this.eventPoster,
        venue: venue,
        startDate: startDate,
        customerName: customerName,
        customerEmail: customerEmail,
        price: price,
        isUsed: isUsed,
        createdAt: createdAt,
        templatePrimary: templatePrimary,
        templateSecondary: templateSecondary,
      );

  String get entryCode =>
      ticketNumber ??
      'TKT-${uuid.length >= 8 ? uuid.substring(0, 8).toUpperCase() : uuid.toUpperCase()}';

  String get posterUrl => AppConstants.storageUrl(eventPoster);

  bool get isValid => status == 'sold' && !isUsed;

  // ── Known field names for event poster images ──────────────────
  static const _imageKeys = [
    'poster_image',
    'poster',
    'image',
    'banner_image',
    'cover_image',
    'thumbnail',
    'image_url',
    'photo',
    'cover',
    'banner',
    'event_image',
    'hero_image',
    'logo',
    'media',
  ];

  /// Returns true when the string looks like an image path/URL.
  static bool _looksLikeImage(String v) {
    final l = v.toLowerCase();
    if (l.contains('@') || l.length < 4) return false;
    return l.endsWith('.jpg') ||
        l.endsWith('.jpeg') ||
        l.endsWith('.png') ||
        l.endsWith('.webp') ||
        l.endsWith('.gif') ||
        l.contains('/storage/') ||
        l.contains('/images/') ||
        l.contains('/uploads/') ||
        l.contains('/media/') ||
        l.contains('/poster') ||
        l.contains('/event');
  }

  /// Finds a poster URL by checking known field names first, then scanning
  /// all string values in the map for image-like patterns.
  static String? _findPoster(Map<String, dynamic>? map) {
    if (map == null) return null;
    for (final key in _imageKeys) {
      final v = map[key]?.toString();
      if (v != null && v.isNotEmpty) return v;
    }
    // Fallback: scan every string value for image patterns
    for (final entry in map.entries) {
      final v = entry.value?.toString();
      if (v != null && _looksLikeImage(v)) return v;
    }
    return null;
  }

  factory TicketModel.fromJson(Map<String, dynamic> json) {
    final event = json['event'] as Map<String, dynamic>?;
    final tier = json['ticket_tier'] ?? json['tier'];

    final poster = _findPoster(event) ?? _findPoster(json);

    // Extract ticket template gradient colours
    final template = event?['ticket_template'] as Map<String, dynamic>?;
    final theme = template?['theme'] as Map<String, dynamic>?;
    final primary = _hexColor(
          theme?['primary']?.toString() ??
              template?['preview_primary']?.toString(),
        ) ??
        _hexColor(template?['preview_primary']?.toString());
    final secondary = _hexColor(
          theme?['secondary']?.toString() ??
              template?['preview_secondary']?.toString(),
        ) ??
        _hexColor(template?['preview_secondary']?.toString());

    debugPrint(
      '[TicketModel] poster: $poster | '
      'templatePrimary: ${theme?['primary']} | '
      'templateSecondary: ${theme?['secondary']}',
    );

    // Extract customer info from metadata if not at top level
    final meta = json['metadata'] as Map<String, dynamic>?;

    return TicketModel(
      uuid: json['uuid']?.toString() ?? json['id']?.toString() ?? '',
      ticketNumber:
          json['ticket_number']?.toString() ?? json['code']?.toString(),
      status: json['status']?.toString() ?? 'sold',
      tierName: tier is Map ? tier['name']?.toString() : tier?.toString(),
      eventId: event?['id']?.toString() ?? json['event_id']?.toString(),
      eventTitle:
          event?['title']?.toString() ?? json['event_title']?.toString(),
      eventPoster: poster,
      venue: event?['venue']?.toString() ?? event?['location']?.toString(),
      startDate: event?['start_date']?.toString(),
      customerName: json['customer_name']?.toString() ??
          meta?['customer_name']?.toString(),
      customerEmail: json['customer_email']?.toString() ??
          meta?['customer_email']?.toString(),
      price: _toDouble(json['price_paid']) ?? _toDouble(json['price']),
      isUsed: json['is_used'] == true ||
          json['used_at'] != null ||
          json['first_scanned_at'] != null,
      createdAt: json['purchased_at']?.toString() ??
          json['created_at']?.toString(),
      templatePrimary: primary,
      templateSecondary: secondary,
    );
  }

  /// Parses a num or numeric string to double without throwing.
  static double? _toDouble(dynamic v) {
    if (v == null) return null;
    if (v is num) return v.toDouble();
    return double.tryParse(v.toString());
  }

  /// Converts a CSS hex string (#rrggbb or #rgb) to a Flutter Color.
  static Color? _hexColor(String? hex) {
    if (hex == null || hex.isEmpty) return null;
    final cleaned = hex.replaceAll('#', '').trim();
    if (cleaned.length == 3) {
      final r = cleaned[0] * 2;
      final g = cleaned[1] * 2;
      final b = cleaned[2] * 2;
      return _hexColor('#$r$g$b');
    }
    if (cleaned.length != 6) return null;
    final value = int.tryParse(cleaned, radix: 16);
    if (value == null) return null;
    return Color(0xFF000000 | value);
  }
}
