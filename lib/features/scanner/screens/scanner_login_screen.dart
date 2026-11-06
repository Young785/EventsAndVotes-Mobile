import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../providers/scanner_session_provider.dart';
import '../../../shared/widgets/app_alert.dart';

class ScannerLoginScreen extends StatefulWidget {
  const ScannerLoginScreen({super.key});

  @override
  State<ScannerLoginScreen> createState() => _ScannerLoginScreenState();
}

class _ScannerLoginScreenState extends State<ScannerLoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _tokenCtrl = TextEditingController();

  @override
  void dispose() {
    _tokenCtrl.dispose();
    super.dispose();
  }

  Future<void> _enterGate(Future<bool> Function() login) async {
    final scanner = context.read<ScannerSessionProvider>();
    final ok = await login();
    if (!mounted) return;
    if (ok) {
      context.go('/scanner/home');
    } else {
      showTopAlert(context, 
        SnackBar(
          content: Text(scanner.error ?? 'Could not open scanner'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    await _enterGate(
      () => context.read<ScannerSessionProvider>().loginWithInput(_tokenCtrl.text),
    );
  }

  @override
  Widget build(BuildContext context) {
    final scanner = context.watch<ScannerSessionProvider>();

    return Scaffold(
      backgroundColor: AppPalette.of(context).background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_rounded, color: AppPalette.of(context).text),
          onPressed: () => context.go('/login'),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 8),
                Center(
                  child: Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      gradient: AppColors.primaryGradient,
                      borderRadius: BorderRadius.circular(22),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.28),
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
                ).animate().fadeIn(duration: 400.ms).scale(),
                const SizedBox(height: 24),
                Text(
                  'Scanner Login',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                    color: AppPalette.of(context).text,
                    letterSpacing: -0.4,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Enter the 6-digit access code from your event host.',
                  textAlign: TextAlign.center,
                  style: AppTextStyles.tone(AppTextStyles.bodyMedium, context, muted: true),
                ),
                const SizedBox(height: 28),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppPalette.of(context).card,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04),
                        blurRadius: 24,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      AppTextField(
                        label: 'Scanner code',
                        hint: '000000',
                        controller: _tokenCtrl,
                        maxLength: 6,
                        textAlign: TextAlign.center,
                        keyboardType: TextInputType.text,
                        style: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 10,
                          color: AppPalette.of(context).text,
                          height: 1.2,
                        ),
                        hintStyle: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 10,
                          color: AppColors.textHint.withValues(alpha: 0.45),
                          height: 1.2,
                        ),
                        validator: (v) {
                          final code = v?.trim() ?? '';
                          if (code.isEmpty) return 'Code is required';
                          if (code.length != 6) return 'Enter all 6 characters';
                          return null;
                        },
                      ),
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.primarySurface,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.info_outline_rounded,
                              size: 18,
                              color: AppColors.primary,
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                'Your host shares this 6-digit code when you are assigned to a gate.',
                                style: AppTextStyles.tone(AppTextStyles.bodySmall, context, muted: true).copyWith(
                                  color: AppColors.primaryDark,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),
                      AppButton(
                        label: 'Enter Gate',
                        onTap: _submit,
                        isLoading: scanner.isLoading,
                        width: double.infinity,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Code is checked with the event server in real time.',
                  textAlign: TextAlign.center,
                  style: AppTextStyles.tone(AppTextStyles.bodySmall, context, muted: true).copyWith(
                    color: AppColors.textHint,
                  ),
                ),
                const SizedBox(height: 24),
                TextButton(
                  onPressed: () => context.go('/login'),
                  child: Text(
                    'Back to user login',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: AppPalette.of(context).muted,
                    ),
                  ),
                ),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
