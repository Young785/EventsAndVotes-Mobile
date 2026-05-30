import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/scanner_session_provider.dart';
import '../theme/scanner_theme.dart';
import '../scanner_tab_scope.dart';
import 'scanner_activity_sheet.dart';

class ScannerHeader extends StatelessWidget {
  final String title;
  final bool showBack;

  const ScannerHeader({
    super.key,
    required this.title,
    this.showBack = false,
  });

  @override
  Widget build(BuildContext context) {
    final scanner = context.watch<ScannerSessionProvider>();
    final declined = scanner.declinedCount;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
      child: Row(
        children: [
          if (showBack)
            _CircleBtn(
              icon: Icons.arrow_back_rounded,
              onTap: () => Navigator.of(context).maybePop(),
            )
          else
            CircleAvatar(
              radius: 22,
              backgroundColor: ScannerTheme.primaryLight,
              child: Text(
                scanner.scannerName.isNotEmpty
                    ? scanner.scannerName[0].toUpperCase()
                    : 'S',
                style: const TextStyle(
                  color: ScannerTheme.primaryDark,
                  fontWeight: FontWeight.w800,
                  fontSize: 18,
                ),
              ),
            ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: ScannerTheme.textDark,
                    letterSpacing: -0.3,
                  ),
                ),
                Text(
                  scanner.locationName,
                  style: const TextStyle(
                    fontSize: 12,
                    color: ScannerTheme.textMuted,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          _CircleBtn(
            icon: Icons.refresh_rounded,
            onTap: () async {
              await scanner.refreshSession();
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Session refreshed'),
                    behavior: SnackBarBehavior.floating,
                    duration: Duration(seconds: 2),
                  ),
                );
              }
            },
          ),
          const SizedBox(width: 8),
          Stack(
            clipBehavior: Clip.none,
            children: [
              _CircleBtn(
                icon: Icons.notifications_none_rounded,
                onTap: () => ScannerActivitySheet.show(
                  context,
                  records: scanner.scanHistory,
                  onRefresh: scanner.refreshSession,
                ),
              ),
              if (declined > 0)
                Positioned(
                  right: 6,
                  top: 6,
                  child: Container(
                    width: 16,
                    height: 16,
                    decoration: const BoxDecoration(
                      color: Color(0xFFE74C3C),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        declined > 9 ? '9+' : '$declined',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CircleBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _CircleBtn({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      shape: const CircleBorder(),
      elevation: 0,
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: ScannerTheme.primaryLight),
          ),
          child: Icon(icon, size: 22, color: ScannerTheme.textDark),
        ),
      ),
    );
  }
}

/// Quick scan FAB shown on home tab.
class ScannerQuickScanFab extends StatelessWidget {
  const ScannerQuickScanFab({super.key});

  @override
  Widget build(BuildContext context) {
    final scope = ScannerTabScope.maybeOf(context);
    if (scope == null) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(right: 20, bottom: 88),
      child: FloatingActionButton.extended(
        onPressed: () => scope.goTo(1),
        backgroundColor: ScannerTheme.primary,
        foregroundColor: Colors.white,
        elevation: 4,
        icon: const Icon(Icons.qr_code_scanner_rounded),
        label: const Text(
          'Scan',
          style: TextStyle(fontWeight: FontWeight.w700),
        ),
      ),
    );
  }
}
