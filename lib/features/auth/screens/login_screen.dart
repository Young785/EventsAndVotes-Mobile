import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_text_field.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  void _openScanner() {
    context.go('/scanner/login');
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = context.read<AuthProvider>();
    final ok = await auth.login(_emailCtrl.text.trim(), _passCtrl.text);
    if (!mounted) return;
    if (ok) {
      context.go(auth.needsVerification ? '/verification' : '/dashboard');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            auth.error ?? 'Login failed. Please try again.',
            maxLines: 4,
          ),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          margin: const EdgeInsets.all(16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      resizeToAvoidBottomInset: true,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final compact = constraints.maxHeight < 720;
            final logoSize = compact ? 52.0 : 64.0;
            final titleSize = compact ? 20.0 : 24.0;
            final sectionGap = compact ? 12.0 : 20.0;
            final cardPadding = compact ? 16.0 : 20.0;

            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Form(
                key: _formKey,
                child: Column(
                  children: [
                    SizedBox(height: compact ? 12 : 24),
                    Center(
                      child: Container(
                        width: logoSize,
                        height: logoSize,
                        decoration: BoxDecoration(
                          gradient: AppColors.primaryGradient,
                          borderRadius: BorderRadius.circular(18),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.3),
                              blurRadius: 20,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: Icon(
                          Icons.how_to_vote_rounded,
                          color: Colors.white,
                          size: logoSize * 0.5,
                        ),
                      ),
                    ).animate().fadeIn(duration: 400.ms).scale(),
                    SizedBox(height: compact ? 12 : 16),
                    Text(
                      'Events & Votes',
                      style: TextStyle(
                        fontSize: titleSize,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                        letterSpacing: -0.5,
                      ),
                    ).animate().fadeIn(delay: 100.ms, duration: 400.ms),
                    const SizedBox(height: 4),
                    Text(
                      'Welcome back',
                      style: AppTextStyles.displayMedium.copyWith(
                        fontSize: compact ? 22 : null,
                      ),
                    ).animate().fadeIn(delay: 150.ms, duration: 400.ms),
                    const SizedBox(height: 4),
                    Text(
                      'Sign in to continue',
                      style: AppTextStyles.bodyMedium,
                      textAlign: TextAlign.center,
                    ).animate().fadeIn(delay: 200.ms, duration: 400.ms),
                    SizedBox(height: sectionGap),
                    Expanded(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: EdgeInsets.all(cardPadding),
                            decoration: BoxDecoration(
                              color: AppColors.white,
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
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                AppTextField(
                                  label: 'Email Address',
                                  hint: 'Enter your email',
                                  controller: _emailCtrl,
                                  keyboardType: TextInputType.emailAddress,
                                  prefix: const Icon(
                                    Icons.mail_outline_rounded,
                                    size: 18,
                                    color: AppColors.textHint,
                                  ),
                                  validator: (v) {
                                    if (v == null || v.isEmpty) {
                                      return 'Email is required';
                                    }
                                    if (!v.contains('@')) {
                                      return 'Enter a valid email';
                                    }
                                    return null;
                                  },
                                ),
                                SizedBox(height: compact ? 14 : 18),
                                AppTextField(
                                  label: 'Password',
                                  hint: 'Enter your password',
                                  controller: _passCtrl,
                                  obscureText: _obscure,
                                  prefix: const Icon(
                                    Icons.lock_outline_rounded,
                                    size: 18,
                                    color: AppColors.textHint,
                                  ),
                                  suffix: IconButton(
                                    icon: Icon(
                                      _obscure
                                          ? Icons.visibility_off_outlined
                                          : Icons.visibility_outlined,
                                      size: 18,
                                      color: AppColors.textHint,
                                    ),
                                    onPressed: () =>
                                        setState(() => _obscure = !_obscure),
                                  ),
                                  validator: (v) {
                                    if (v == null || v.isEmpty) {
                                      return 'Password is required';
                                    }
                                    if (v.length < 6) {
                                      return 'Password must be at least 6 characters';
                                    }
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 4),
                                Align(
                                  alignment: Alignment.centerRight,
                                  child: TextButton(
                                    onPressed: () =>
                                        context.go('/forgot-password'),
                                    style: TextButton.styleFrom(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 4,
                                        vertical: 0,
                                      ),
                                      minimumSize: Size.zero,
                                      tapTargetSize:
                                          MaterialTapTargetSize.shrinkWrap,
                                    ),
                                    child: const Text(
                                      'Forgot password?',
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.primary,
                                      ),
                                    ),
                                  ),
                                ),
                                SizedBox(height: compact ? 12 : 16),
                                AppButton(
                                  label: 'Sign In',
                                  onTap: _submit,
                                  isLoading: auth.isLoading,
                                  width: double.infinity,
                                ),
                              ],
                            ),
                          ).animate().fadeIn(delay: 200.ms, duration: 400.ms),
                        ],
                      ),
                    ),
                    Row(
                      children: [
                        const Expanded(child: Divider(color: AppColors.border)),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: Text(
                            "Don't have an account?",
                            style: TextStyle(
                              fontSize: compact ? 11 : 12,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ),
                        const Expanded(child: Divider(color: AppColors.border)),
                      ],
                    ),
                    SizedBox(height: compact ? 10 : 14),
                    AppButton(
                      label: 'Create Account',
                      onTap: () => context.go('/register'),
                      isOutlined: true,
                      width: double.infinity,
                    ),
                    SizedBox(height: compact ? 8 : 10),
                    AppButton(
                      label: 'Login as Scanner',
                      onTap: _openScanner,
                      isOutlined: true,
                      width: double.infinity,
                      icon: Icons.qr_code_scanner_rounded,
                    ),
                    SizedBox(height: compact ? 6 : 10),
                    TextButton(
                      onPressed: () => context.go('/'),
                      child: const Text(
                        'Continue as guest',
                        style: TextStyle(
                          fontSize: 13,
                          color: AppColors.textSecondary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                    SizedBox(height: compact ? 8 : 12),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
