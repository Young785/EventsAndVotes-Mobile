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
    // On success, the router's refreshListenable picks up the auth state
    // change and automatically redirects — no manual navigation needed.
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
      body: SafeArea(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 48),
                // Logo
                Center(
                  child: Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      gradient: AppColors.primaryGradient,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.3),
                          blurRadius: 20,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: const Icon(Icons.how_to_vote_rounded,
                        color: Colors.white, size: 32),
                  ),
                ).animate().fadeIn(duration: 400.ms).scale(),
                const SizedBox(height: 24),
                Center(
                  child: const Text(
                    'Events & Votes',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                      letterSpacing: -0.5,
                    ),
                  ).animate().fadeIn(delay: 100.ms, duration: 400.ms),
                ),
                const SizedBox(height: 8),
                Center(
                  child: const Text(
                    'Welcome back!',
                    style: AppTextStyles.displayMedium,
                  ).animate().fadeIn(delay: 150.ms, duration: 400.ms),
                ),
                const SizedBox(height: 8),
                Center(
                  child: Text(
                    'Sign in to your account to continue',
                    style: AppTextStyles.bodyMedium,
                    textAlign: TextAlign.center,
                  ).animate().fadeIn(delay: 200.ms, duration: 400.ms),
                ),
                const SizedBox(height: 40),
                Container(
                  padding: const EdgeInsets.all(24),
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
                    children: [
                      AppTextField(
                        label: 'Email Address',
                        hint: 'Enter your email',
                        controller: _emailCtrl,
                        keyboardType: TextInputType.emailAddress,
                        prefix: const Icon(Icons.mail_outline_rounded,
                            size: 18, color: AppColors.textHint),
                        validator: (v) {
                          if (v == null || v.isEmpty) return 'Email is required';
                          if (!v.contains('@')) return 'Enter a valid email';
                          return null;
                        },
                      ).animate().fadeIn(delay: 250.ms, duration: 400.ms),
                      const SizedBox(height: 20),
                      AppTextField(
                        label: 'Password',
                        hint: 'Enter your password',
                        controller: _passCtrl,
                        obscureText: _obscure,
                        prefix: const Icon(Icons.lock_outline_rounded,
                            size: 18, color: AppColors.textHint),
                        suffix: IconButton(
                          icon: Icon(
                            _obscure
                                ? Icons.visibility_off_outlined
                                : Icons.visibility_outlined,
                            size: 18,
                            color: AppColors.textHint,
                          ),
                          onPressed: () => setState(() => _obscure = !_obscure),
                        ),
                        validator: (v) {
                          if (v == null || v.isEmpty) return 'Password is required';
                          if (v.length < 6) {
                            return 'Password must be at least 6 characters';
                          }
                          return null;
                        },
                      ).animate().fadeIn(delay: 300.ms, duration: 400.ms),
                      const SizedBox(height: 12),
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton(
                          onPressed: () => context.go('/forgot-password'),
                          child: const Text(
                            'Forgot password?',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                      ).animate().fadeIn(delay: 350.ms, duration: 400.ms),
                      const SizedBox(height: 16),
                      AppButton(
                        label: 'Sign In',
                        onTap: _submit,
                        isLoading: auth.isLoading,
                        width: double.infinity,
                      ).animate().fadeIn(delay: 400.ms, duration: 400.ms),
                    ],
                  ),
                ).animate().fadeIn(delay: 200.ms, duration: 400.ms).slideY(begin: 0.1, end: 0),
                const SizedBox(height: 24),
                Row(
                  children: [
                    const Expanded(child: Divider(color: AppColors.border)),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text(
                        "Don't have an account?",
                        style: const TextStyle(
                            fontSize: 12, color: AppColors.textSecondary),
                      ),
                    ),
                    const Expanded(child: Divider(color: AppColors.border)),
                  ],
                ).animate().fadeIn(delay: 450.ms, duration: 400.ms),
                const SizedBox(height: 20),
                AppButton(
                  label: 'Create Account',
                  onTap: () => context.go('/register'),
                  isOutlined: true,
                  width: double.infinity,
                ).animate().fadeIn(delay: 500.ms, duration: 400.ms),
                const SizedBox(height: 16),
                AppButton(
                  label: 'Login as Scanner',
                  onTap: _openScanner,
                  isOutlined: true,
                  width: double.infinity,
                  icon: Icons.qr_code_scanner_rounded,
                ).animate().fadeIn(delay: 520.ms, duration: 400.ms),
                const SizedBox(height: 20),
                Center(
                  child: TextButton(
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
                ).animate().fadeIn(delay: 550.ms, duration: 400.ms),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
