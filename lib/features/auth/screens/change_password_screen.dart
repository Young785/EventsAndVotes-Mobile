import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/network/api_client.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../../../shared/utils/navigation_utils.dart';

class ChangePasswordScreen extends StatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _currentPassCtrl = TextEditingController();
  final _newPassCtrl = TextEditingController();
  final _confirmPassCtrl = TextEditingController();
  bool _obscureCurrent = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;
  bool _loading = false;

  @override
  void dispose() {
    _currentPassCtrl.dispose();
    _newPassCtrl.dispose();
    _confirmPassCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);

    try {
      final response = await ApiClient.instance.post(
        '/auth/change-password',
        data: {
          'current_password': _currentPassCtrl.text,
          'new_password': _newPassCtrl.text,
          'new_password_confirmation': _confirmPassCtrl.text,
        },
      );

      if (response.data['status'] == 'success') {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Password changed successfully!'),
              backgroundColor: AppColors.success,
            ),
          );
          popPage(context);
        }
      } else {
        throw Exception(
          response.data['message'] ?? 'Failed to change password',
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_rounded,
            color: AppColors.textPrimary,
          ),
          onPressed: () => popPage(context),
        ),
        title: const Text(
          'Change Password',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              // Info card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.infoLight,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: AppColors.info.withValues(alpha: 0.3),
                  ),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.info_outline_rounded,
                      color: AppColors.info,
                      size: 20,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'For your security, please enter your current password to change it.',
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ),
                  ],
                ),
              ).animate().fadeIn(duration: 300.ms),
              const SizedBox(height: 32),

              // Current password
              AppTextField(
                label: 'Current Password',
                hint: 'Enter current password',
                controller: _currentPassCtrl,
                obscureText: _obscureCurrent,
                prefix: const Icon(
                  Icons.lock_outline_rounded,
                  size: 18,
                  color: AppColors.textHint,
                ),
                suffix: IconButton(
                  icon: Icon(
                    _obscureCurrent
                        ? Icons.visibility_off_outlined
                        : Icons.visibility_outlined,
                    size: 18,
                    color: AppColors.textHint,
                  ),
                  onPressed:
                      () => setState(() => _obscureCurrent = !_obscureCurrent),
                ),
                validator: (v) {
                  if (v == null || v.isEmpty)
                    return 'Current password is required';
                  if (v.length < 6)
                    return 'Password must be at least 6 characters';
                  return null;
                },
              ).animate().fadeIn(delay: 100.ms, duration: 300.ms),
              const SizedBox(height: 16),

              // New password
              AppTextField(
                label: 'New Password',
                hint: 'Enter new password',
                controller: _newPassCtrl,
                obscureText: _obscureNew,
                prefix: const Icon(
                  Icons.lock_outline_rounded,
                  size: 18,
                  color: AppColors.textHint,
                ),
                suffix: IconButton(
                  icon: Icon(
                    _obscureNew
                        ? Icons.visibility_off_outlined
                        : Icons.visibility_outlined,
                    size: 18,
                    color: AppColors.textHint,
                  ),
                  onPressed: () => setState(() => _obscureNew = !_obscureNew),
                ),
                validator: (v) {
                  if (v == null || v.isEmpty) return 'New password is required';
                  if (v.length < 8)
                    return 'Password must be at least 8 characters';
                  if (!v.contains(RegExp(r'[A-Z]')))
                    return 'Must contain at least one uppercase letter';
                  if (!v.contains(RegExp(r'[0-9]')))
                    return 'Must contain at least one number';
                  return null;
                },
              ).animate().fadeIn(delay: 150.ms, duration: 300.ms),
              const SizedBox(height: 8),

              // Password requirements
              _PasswordRequirements(
                password: _newPassCtrl.text,
              ).animate().fadeIn(delay: 180.ms, duration: 300.ms),
              const SizedBox(height: 16),

              // Confirm password
              AppTextField(
                label: 'Confirm New Password',
                hint: 'Confirm new password',
                controller: _confirmPassCtrl,
                obscureText: _obscureConfirm,
                prefix: const Icon(
                  Icons.lock_outline_rounded,
                  size: 18,
                  color: AppColors.textHint,
                ),
                suffix: IconButton(
                  icon: Icon(
                    _obscureConfirm
                        ? Icons.visibility_off_outlined
                        : Icons.visibility_outlined,
                    size: 18,
                    color: AppColors.textHint,
                  ),
                  onPressed:
                      () => setState(() => _obscureConfirm = !_obscureConfirm),
                ),
                validator: (v) {
                  if (v == null || v.isEmpty)
                    return 'Please confirm your password';
                  if (v != _newPassCtrl.text) return 'Passwords do not match';
                  return null;
                },
              ).animate().fadeIn(delay: 200.ms, duration: 300.ms),
              const SizedBox(height: 32),

              AppButton(
                label: 'Change Password',
                onTap: _submit,
                isLoading: _loading,
                width: double.infinity,
              ).animate().fadeIn(delay: 250.ms, duration: 300.ms),
            ],
          ),
        ),
      ),
    );
  }
}

class _PasswordRequirements extends StatelessWidget {
  final String password;
  const _PasswordRequirements({required this.password});

  @override
  Widget build(BuildContext context) {
    final hasMinLength = password.length >= 8;
    final hasUppercase = password.contains(RegExp(r'[A-Z]'));
    final hasNumber = password.contains(RegExp(r'[0-9]'));

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surfaceVariant,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Password requirements:',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 8),
          _RequirementItem(text: 'At least 8 characters', met: hasMinLength),
          _RequirementItem(
            text: 'At least one uppercase letter',
            met: hasUppercase,
          ),
          _RequirementItem(text: 'At least one number', met: hasNumber),
        ],
      ),
    );
  }
}

class _RequirementItem extends StatelessWidget {
  final String text;
  final bool met;
  const _RequirementItem({required this.text, required this.met});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Icon(
            met ? Icons.check_circle_rounded : Icons.radio_button_unchecked,
            size: 14,
            color: met ? AppColors.success : AppColors.textHint,
          ),
          const SizedBox(width: 8),
          Text(
            text,
            style: TextStyle(
              fontSize: 11,
              color: met ? AppColors.success : AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}
