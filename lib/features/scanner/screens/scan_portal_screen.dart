import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../providers/scanner_session_provider.dart';
import '../theme/scanner_theme.dart';

/// Handles deep links like /scan/:token — validates and opens scanner portal.
class ScanPortalScreen extends StatefulWidget {
  final String token;
  const ScanPortalScreen({super.key, required this.token});

  @override
  State<ScanPortalScreen> createState() => _ScanPortalScreenState();
}

class _ScanPortalScreenState extends State<ScanPortalScreen> {
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _bootstrap());
  }

  Future<void> _bootstrap() async {
    final scanner = context.read<ScannerSessionProvider>();
    final ok = await scanner.loginWithToken(widget.token);
    if (!mounted) return;
    if (ok) {
      context.go('/scanner/home');
    } else {
      setState(() => _error = scanner.error ?? 'Invalid or expired scan URL');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return Scaffold(
        backgroundColor: ScannerTheme.surface,
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFECEC),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.link_off_rounded,
                    color: Color(0xFFE74C3C),
                    size: 40,
                  ),
                ),
                const SizedBox(height: 24),
                const Text(
                  'Access denied',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: ScannerTheme.textDark,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  _error!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 14,
                    height: 1.5,
                    color: ScannerTheme.textMuted,
                  ),
                ),
                const SizedBox(height: 28),
                FilledButton(
                  onPressed: () => context.go('/scanner/login'),
                  style: FilledButton.styleFrom(
                    backgroundColor: ScannerTheme.primary,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 32,
                      vertical: 14,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: const Text(
                    'Enter token manually',
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: () => context.go('/login'),
                  child: const Text('Back to login'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: ScannerTheme.surface,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                gradient: ScannerTheme.primaryGradient,
                borderRadius: BorderRadius.circular(22),
                boxShadow: [
                  BoxShadow(
                    color: ScannerTheme.primary.withValues(alpha: 0.28),
                    blurRadius: 24,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: const Icon(
                Icons.qr_code_scanner_rounded,
                color: Colors.white,
                size: 36,
              ),
            ),
            const SizedBox(height: 24),
            const CircularProgressIndicator(color: ScannerTheme.primary),
            const SizedBox(height: 16),
            const Text(
              'Validating scan access…',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: ScannerTheme.textDark,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Connecting to gate server',
              style: TextStyle(
                fontSize: 13,
                color: ScannerTheme.textMuted.withValues(alpha: 0.9),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
