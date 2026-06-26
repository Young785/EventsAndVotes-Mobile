import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../shared/utils/navigation_utils.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../providers/auth_provider.dart';

class VerificationScreen extends StatefulWidget {
  const VerificationScreen({super.key});

  @override
  State<VerificationScreen> createState() => _VerificationScreenState();
}

class _VerificationScreenState extends State<VerificationScreen> {
  final _codeCtrl = TextEditingController();
  bool _verifying = false;
  bool _resending = false;
  bool _initialLoad = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadStatus());
  }

  @override
  void dispose() {
    _codeCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadStatus() async {
    final auth = context.read<AuthProvider>();
    await auth.loadVerificationStatus(autoSend: true);
    if (!mounted) return;
    setState(() => _initialLoad = false);
    if (auth.error != null) {
      _showMessage(auth.error!, isError: true);
    }
  }

  Future<void> _verify() async {
    final code = _codeCtrl.text.trim();
    if (code.length != 6) {
      _showMessage('Please enter the 6-digit verification code');
      return;
    }

    setState(() => _verifying = true);
    final auth = context.read<AuthProvider>();
    final ok = await auth.verifyEmailCode(code);
    if (!mounted) return;
    setState(() => _verifying = false);

    if (ok) {
      _showMessage('Email verified successfully!');
      context.go('/dashboard');
    } else {
      _showMessage(auth.error ?? 'Invalid verification code', isError: true);
    }
  }

  Future<void> _resend() async {
    setState(() => _resending = true);
    final auth = context.read<AuthProvider>();
    final ok = await auth.resendVerificationCode();
    if (!mounted) return;
    setState(() => _resending = false);

    if (ok) {
      _showMessage('Verification code sent to your email');
    } else {
      _showMessage(auth.error ?? 'Failed to resend code', isError: true);
    }
  }

  void _showMessage(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message, maxLines: 3),
        backgroundColor: isError ? AppColors.error : AppColors.success,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final email = auth.user?.email ?? 'your email';

    return Scaffold(
      backgroundColor: AppColors.background,
      resizeToAvoidBottomInset: true,
      body: SafeArea(
        child: _initialLoad
            ? const Center(child: CircularProgressIndicator())
            : LayoutBuilder(
                builder: (context, constraints) {
                  final compact = constraints.maxHeight < 700;

                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Column(
                      children: [
                        SizedBox(height: compact ? 16 : 32),
                        Container(
                          width: compact ? 64 : 72,
                          height: compact ? 64 : 72,
                          decoration: BoxDecoration(
                            color: AppColors.warningLight,
                            borderRadius: BorderRadius.circular(22),
                          ),
                          child: Icon(
                            Icons.mark_email_unread_outlined,
                            size: compact ? 32 : 36,
                            color: AppColors.warning,
                          ),
                        ),
                        SizedBox(height: compact ? 16 : 20),
                        Text(
                          'Verify your email',
                          style: AppTextStyles.displayMedium.copyWith(
                            fontSize: compact ? 22 : null,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'We sent a 6-digit code to $email. '
                          'Enter it below to access your dashboard.',
                          style: AppTextStyles.bodyMedium,
                          textAlign: TextAlign.center,
                        ),
                        SizedBox(height: compact ? 20 : 28),
                        Expanded(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                padding: EdgeInsets.all(compact ? 16 : 20),
                                decoration: BoxDecoration(
                                  color: AppColors.white,
                                  borderRadius: BorderRadius.circular(20),
                                  boxShadow: [
                                    BoxShadow(
                                      color:
                                          Colors.black.withValues(alpha: 0.04),
                                      blurRadius: 24,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  crossAxisAlignment:
                                      CrossAxisAlignment.stretch,
                                  children: [
                                    AppTextField(
                                      label: 'Verification Code',
                                      hint: 'Enter 6-digit code',
                                      controller: _codeCtrl,
                                      keyboardType: TextInputType.number,
                                      prefix: const Icon(
                                        Icons.pin_outlined,
                                        size: 18,
                                        color: AppColors.textHint,
                                      ),
                                      onChanged: (v) {
                                        final digits =
                                            v.replaceAll(RegExp(r'\D'), '');
                                        final trimmed = digits.length > 6
                                            ? digits.substring(0, 6)
                                            : digits;
                                        if (trimmed != v) {
                                          _codeCtrl.value = TextEditingValue(
                                            text: trimmed,
                                            selection: TextSelection.collapsed(
                                              offset: trimmed.length,
                                            ),
                                          );
                                        }
                                      },
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      'Check your inbox and spam folder.',
                                      style: AppTextStyles.bodySmall.copyWith(
                                        color: AppColors.textSecondary,
                                      ),
                                    ),
                                    SizedBox(height: compact ? 16 : 20),
                                    AppButton(
                                      label: 'Verify Email',
                                      onTap: _verify,
                                      isLoading: _verifying,
                                      width: double.infinity,
                                    ),
                                    const SizedBox(height: 12),
                                    Center(
                                      child: _resending
                                          ? const SizedBox(
                                              width: 22,
                                              height: 22,
                                              child: CircularProgressIndicator(
                                                strokeWidth: 2,
                                              ),
                                            )
                                          : TextButton(
                                              onPressed: _resend,
                                              child: const Text(
                                                'Resend code',
                                                style: TextStyle(
                                                  fontSize: 14,
                                                  fontWeight: FontWeight.w600,
                                                  color: AppColors.primary,
                                                ),
                                              ),
                                            ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        TextButton(
                          onPressed: () => signOutUser(context),
                          child: const Text('Sign out'),
                        ),
                        SizedBox(height: compact ? 8 : 16),
                      ],
                    ),
                  );
                },
              ),
      ),
    );
  }
}
