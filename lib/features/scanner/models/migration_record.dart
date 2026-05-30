enum MigrationStatus { success, failed, partial, skipped }

class MigrationRecord {
  final String id;
  final DateTime migratedAt;
  final MigrationStatus status;
  final int uploadedCount;
  final int failedCount;
  final String? message;

  const MigrationRecord({
    required this.id,
    required this.migratedAt,
    required this.status,
    required this.uploadedCount,
    required this.failedCount,
    this.message,
  });

  factory MigrationRecord.fromJson(Map<String, dynamic> json) {
    return MigrationRecord(
      id: json['id']?.toString() ?? '',
      migratedAt: DateTime.tryParse(json['migrated_at']?.toString() ?? '') ??
          DateTime.now(),
      status: _statusFromString(json['status']?.toString()),
      uploadedCount: json['uploaded_count'] as int? ??
          int.tryParse(json['uploaded_count']?.toString() ?? '') ??
          0,
      failedCount: json['failed_count'] as int? ??
          int.tryParse(json['failed_count']?.toString() ?? '') ??
          0,
      message: json['message']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'migrated_at': migratedAt.toIso8601String(),
        'status': status.name,
        'uploaded_count': uploadedCount,
        'failed_count': failedCount,
        if (message != null) 'message': message,
      };

  static MigrationStatus _statusFromString(String? raw) {
    switch (raw) {
      case 'success':
        return MigrationStatus.success;
      case 'failed':
        return MigrationStatus.failed;
      case 'partial':
        return MigrationStatus.partial;
      case 'skipped':
        return MigrationStatus.skipped;
      default:
        return MigrationStatus.failed;
    }
  }

  bool get isSuccess => status == MigrationStatus.success;
}
