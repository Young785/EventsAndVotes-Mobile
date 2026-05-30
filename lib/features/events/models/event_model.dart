import '../../../core/constants/app_constants.dart';
import '../../../core/utils/json_parse_utils.dart';

class EventModel {
  final String id;
  final String title;
  final String description;
  final String venue;
  final String slug;
  final String startDate;
  final String endDate;
  final String? startTime;
  final String? endTime;
  final String? posterImage;
  final int? totalCapacity;
  final bool isPublic;
  final String status;
  final String createdAt;
  final List<TicketTierModel> ticketTiers;
  final int? totalSoldTickets;

  EventModel({
    required this.id,
    required this.title,
    required this.description,
    required this.venue,
    required this.slug,
    required this.startDate,
    required this.endDate,
    this.startTime,
    this.endTime,
    this.posterImage,
    this.totalCapacity,
    required this.isPublic,
    required this.status,
    required this.createdAt,
    required this.ticketTiers,
    this.totalSoldTickets,
  });

  bool get isActive => status == 'active';
  bool get isUpcoming => status == 'draft';

  double get minPrice {
    final active = ticketTiers.where((t) => t.isActive).toList();
    if (active.isEmpty) return 0;
    return active.map((t) => t.price).reduce((a, b) => a < b ? a : b);
  }

  factory EventModel.fromJson(Map<String, dynamic> json) => EventModel(
    id: json['id']?.toString() ?? '',
    title: json['title'] ?? json['name'] ?? '',
    description: json['description'] ?? '',
    venue: json['venue'] ?? json['location'] ?? '',
    slug: json['slug'] ?? '',
    startDate: json['start_date'] ?? '',
    endDate: json['end_date'] ?? '',
    startTime: json['start_time'],
    endTime: json['end_time'],
    posterImage: json['poster_image'] != null
        ? AppConstants.storageUrl(json['poster_image']?.toString())
        : null,
    totalCapacity: json['total_capacity'],
    isPublic: json['is_public'] ?? true,
    status: json['status'] ?? 'draft',
    createdAt: json['created_at'] ?? '',
    ticketTiers: ((json['ticket_tiers'] ?? json['ticketTiers']) as List? ?? [])
        .whereType<Map>()
        .map((t) => TicketTierModel.fromJson(Map<String, dynamic>.from(t)))
        .toList(),
    totalSoldTickets: json['total_sold_tickets'],
  );
}

class TicketTierModel {
  final int id;
  final String name;
  final String? description;
  final double price;
  final int? capacity;
  final int soldCount;
  final bool isActive;

  TicketTierModel({
    required this.id,
    required this.name,
    this.description,
    required this.price,
    this.capacity,
    required this.soldCount,
    required this.isActive,
  });

  factory TicketTierModel.fromJson(Map<String, dynamic> json) =>
      TicketTierModel(
        id: json['id'] ?? 0,
        name: json['name'] ?? '',
        description: json['description'],
        price: parseApiDoubleOrZero(json['price']),
        capacity: json['capacity'],
        soldCount: json['sold_count'] ?? 0,
        isActive: json['is_active'] ?? true,
      );
}
