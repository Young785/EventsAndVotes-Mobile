import '../../../core/constants/app_constants.dart';
import '../../../core/utils/json_parse_utils.dart';

class VoteModel {
  final int id;
  final String voteId;
  final String title;
  final String description;
  final String slug;
  final String startDate;
  final String endDate;
  final String? image;
  final String paymentMode;
  final double pricePerVote;
  final String status;
  final int positionsCount;
  final int nomineesCount;
  final int totalVotes;
  final String createdAt;

  VoteModel({
    required this.id,
    required this.voteId,
    required this.title,
    required this.description,
    required this.slug,
    required this.startDate,
    required this.endDate,
    this.image,
    required this.paymentMode,
    required this.pricePerVote,
    required this.status,
    required this.positionsCount,
    required this.nomineesCount,
    required this.totalVotes,
    required this.createdAt,
  });

  bool get isFree => paymentMode == 'FREE';
  bool get isActive => status == 'STARTED' || status == 'ongoing';
  bool get isCompleted => status == 'COMPLETED' || status == 'ended';

  factory VoteModel.fromJson(Map<String, dynamic> json) => VoteModel(
    id: json['id'] ?? 0,
    voteId: json['vote_id'] ?? '',
    title: json['title'] ?? json['name'] ?? '',
    description: json['description'] ?? '',
    slug: json['slug'] ?? '',
    startDate: json['start_date'] ?? '',
    endDate: json['end_date'] ?? '',
    image: json['image'] != null
        ? AppConstants.storageUrl(json['image']?.toString())
        : null,
    paymentMode: json['payment_mode'] ?? 'FREE',
    pricePerVote: parseApiDoubleOrZero(json['price_per_vote']),
    status: json['status'] ?? 'INACTIVE',
    positionsCount: parseApiInt(json['positions_count']),
    nomineesCount: parseApiInt(json['nominees_count']),
    totalVotes: parseApiInt(json['total_votes']),
    createdAt: json['created_at'] ?? '',
  );
}
