import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class StatusBadge extends StatelessWidget {
  final String status;

  const StatusBadge({super.key, required this.status});

  static String labelFor(String status) {
    switch (status.toUpperCase()) {
      case 'STARTED':
      case 'ACTIVE':
      case 'ONGOING':
        return 'Active';
      case 'COMPLETED':
      case 'ENDED':
        return 'Ended';
      case 'INACTIVE':
      case 'UPCOMING':
        return 'Upcoming';
      case 'POSTPONED':
        return 'Postponed';
      case 'DRAFT':
        return 'Upcoming';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status.isEmpty ? 'Unknown' : status[0].toUpperCase() + status.substring(1).toLowerCase();
    }
  }

  @override
  Widget build(BuildContext context) {
    final normalized = status.toUpperCase();
    Color bg;
    Color text;

    switch (normalized) {
      case 'STARTED':
      case 'ACTIVE':
      case 'ONGOING':
        bg = AppColors.successLight;
        text = AppColors.success;
        break;
      case 'COMPLETED':
      case 'ENDED':
        bg = AppColors.infoLight;
        text = AppColors.info;
        break;
      case 'INACTIVE':
      case 'UPCOMING':
      case 'DRAFT':
        bg = AppColors.warningLight;
        text = AppColors.warning;
        break;
      case 'POSTPONED':
        bg = AppColors.warningLight;
        text = AppColors.warning;
        break;
      case 'CANCELLED':
        bg = AppColors.errorLight;
        text = AppColors.error;
        break;
      default:
        bg = AppColors.border;
        text = AppColors.textSecondary;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        labelFor(status),
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: text,
        ),
      ),
    );
  }
}
