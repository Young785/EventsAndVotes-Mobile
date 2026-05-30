import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

/// Slanted stat pills in a row (balance, plan, member since).
class SlantedStatStrip extends StatelessWidget {
  final List<SlantedStatItem> items;

  const SlantedStatStrip({super.key, required this.items});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: items.asMap().entries.map((e) {
        final item = e.value;
        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(
              left: e.key == 0 ? 0 : 4,
              right: e.key == items.length - 1 ? 0 : 4,
            ),
            child: Transform.rotate(
              angle: item.tilt,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
                decoration: BoxDecoration(
                  color: item.backgroundColor,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.4)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.1),
                      blurRadius: 10,
                      offset: const Offset(0, 5),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(item.icon, size: 20, color: item.accentColor),
                    const SizedBox(height: 10),
                    Text(
                      item.label,
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.value,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        height: 1.15,
                        color: item.accentColor,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class SlantedStatItem {
  final String label;
  final String value;
  final IconData icon;
  final Color accentColor;
  final Color backgroundColor;
  final double tilt;

  const SlantedStatItem({
    required this.label,
    required this.value,
    required this.icon,
    required this.accentColor,
    this.backgroundColor = Colors.white,
    this.tilt = -0.06,
  });
}
