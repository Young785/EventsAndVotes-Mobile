import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/services/auth_service.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../../../shared/utils/navigation_utils.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});
  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  bool _loading = false;
  bool _sent = false;
  final AuthService _authService = AuthService();

  @override
  void dispose() {
    _emailCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      await _authService.forgotPassword(_emailCtrl.text.trim());
      if (mounted)
        setState(() {
          _loading = false;
          _sent = true;
        });
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_rounded,
            size: 18,
            color: AppColors.textPrimary,
          ),
          onPressed: () => popPage(context),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: _sent ? _buildSuccess() : _buildForm(),
        ),
      ),
    );
  }

  Widget _buildForm() {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 24),
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: AppColors.primarySurface,
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(
              Icons.lock_reset_rounded,
              color: AppColors.primary,
              size: 28,
            ),
          ).animate().fadeIn(duration: 300.ms),
          const SizedBox(height: 20),
          const Text(
            'Forgot Password?',
            style: AppTextStyles.displayMedium,
          ).animate().fadeIn(delay: 80.ms),
          const SizedBox(height: 8),
          const Text(
            'Enter your email and we\'ll send you a reset link.',
            style: AppTextStyles.bodyMedium,
          ).animate().fadeIn(delay: 120.ms),
          const SizedBox(height: 32),
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
              if (v == null || v.isEmpty) return 'Email is required';
              if (!v.contains('@')) return 'Enter a valid email';
              return null;
            },
          ).animate().fadeIn(delay: 160.ms),
          const SizedBox(height: 24),
          AppButton(
            label: 'Send Reset Link',
            onTap: _submit,
            isLoading: _loading,
            width: double.infinity,
          ).animate().fadeIn(delay: 200.ms),
          const SizedBox(height: 16),
          Center(
            child: TextButton(
              onPressed: () => context.go('/login'),
              child: const Text(
                'Back to Sign In',
                style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
              ),
            ),
          ).animate().fadeIn(delay: 240.ms),
        ],
      ),
    );
  }

  Widget _buildSuccess() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: AppColors.successLight,
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.mark_email_read_rounded,
            color: AppColors.success,
            size: 40,
          ),
        ).animate().scale(duration: 400.ms, curve: Curves.elasticOut),
        const SizedBox(height: 24),
        const Text(
          'Check Your Email',
          style: AppTextStyles.headlineLarge,
          textAlign: TextAlign.center,
        ).animate().fadeIn(delay: 200.ms),
        const SizedBox(height: 8),
        Text(
          'We sent a password reset link to\n${_emailCtrl.text}',
          style: AppTextStyles.bodyMedium,
          textAlign: TextAlign.center,
        ).animate().fadeIn(delay: 300.ms),
        const SizedBox(height: 32),
        AppButton(
          label: 'Back to Sign In',
          onTap: () => context.go('/login'),
          width: double.infinity,
        ).animate().fadeIn(delay: 400.ms),
      ],
    );
  }
}
