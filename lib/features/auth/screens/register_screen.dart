import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../../../shared/utils/navigation_utils.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});
  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _step1Key = GlobalKey<FormState>();
  final _step2Key = GlobalKey<FormState>();

  final _firstNameCtrl = TextEditingController();
  final _lastNameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _confirmPassCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _referralCtrl = TextEditingController();

  int _step = 0;
  bool _obscurePass = true;
  bool _obscureConfirm = true;
  String _gender = 'male';
  String _country = 'Nigeria';
  String? _state;
  DateTime? _dob;
  bool _acceptTerms = false;

  final List<String> _nigeriaStates = [
    'Abia',
    'Adamawa',
    'Akwa Ibom',
    'Anambra',
    'Bauchi',
    'Bayelsa',
    'Benue',
    'Borno',
    'Cross River',
    'Delta',
    'Ebonyi',
    'Edo',
    'Ekiti',
    'Enugu',
    'FCT - Abuja',
    'Gombe',
    'Imo',
    'Jigawa',
    'Kaduna',
    'Kano',
    'Katsina',
    'Kebbi',
    'Kogi',
    'Kwara',
    'Lagos',
    'Nasarawa',
    'Niger',
    'Ogun',
    'Ondo',
    'Osun',
    'Oyo',
    'Plateau',
    'Rivers',
    'Sokoto',
    'Taraba',
    'Yobe',
    'Zamfara',
  ];

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _passCtrl.dispose();
    _confirmPassCtrl.dispose();
    _addressCtrl.dispose();
    _referralCtrl.dispose();
    super.dispose();
  }

  String _formatPhone(String raw) {
    var p = raw.trim().replaceAll(RegExp(r'\s+'), '');
    if (p.startsWith('+')) return p;
    if (p.startsWith('0')) return '+234${p.substring(1)}';
    if (p.startsWith('234')) return '+$p';
    return '+234$p';
  }

  String _formatDob(DateTime date) =>
      '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';

  void _nextStep() {
    if (!_step1Key.currentState!.validate()) return;
    setState(() => _step = 1);
  }

  void _prevStep() => setState(() => _step = 0);

  Future<void> _submit() async {
    if (!_step2Key.currentState!.validate()) return;
    if (_dob == null) {
      _showError('Please select your date of birth');
      return;
    }
    if (_state == null || _state!.isEmpty) {
      _showError('Please select your state');
      return;
    }
    if (!_acceptTerms) {
      _showError('Please accept the terms and conditions');
      return;
    }

    final auth = context.read<AuthProvider>();
    final ok = await auth.register({
      'first_name': _firstNameCtrl.text.trim(),
      'last_name': _lastNameCtrl.text.trim(),
      'email': _emailCtrl.text.trim(),
      'phone': _formatPhone(_phoneCtrl.text),
      'password': _passCtrl.text,
      'password_confirmation': _confirmPassCtrl.text,
      'dob': _formatDob(_dob!),
      'gender': _gender,
      'country': _country,
      'state': _state!,
      'address': _addressCtrl.text.trim(),
      'role_id': 'user',
      'referral_code': _referralCtrl.text.trim(),
      'terms': true,
    });

    if (!mounted) return;
    if (ok) {
      context.go(auth.needsVerification ? '/verification' : '/dashboard');
    } else {
      _showError(auth.error ?? 'Registration failed');
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message, maxLines: 8),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(16),
        duration: const Duration(seconds: 6),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_rounded,
            size: 20,
            color: AppColors.textPrimary,
          ),
          onPressed: () {
            if (_step > 0) {
              _prevStep();
            } else {
              popPage(context);
            }
          },
        ),
        title: const Text(
          'Create Account',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
      ),
      body: Column(
        children: [
          _buildProgressHeader(),
          Expanded(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                child: _step == 0 ? _buildStep1() : _buildStep2(auth),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressHeader() {
    final progress = (_step + 1) / 2;
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Step ${_step + 1} of 2',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.primary,
                ),
              ),
              Text(
                _step == 0 ? 'Account details' : 'Profile & location',
                style: AppTextStyles.bodySmall,
              ),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 6,
              backgroundColor: AppColors.border,
              color: AppColors.primary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStep1() {
    return Form(
      key: _step1Key,
      child: Column(
        key: const ValueKey('step1'),
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Your account', style: AppTextStyles.headlineLarge),
          const SizedBox(height: 6),
          const Text(
            'Enter your name, email, phone and password',
            style: AppTextStyles.bodyMedium,
          ),
          const SizedBox(height: 24),
          _card(
            children: [
              Row(
                children: [
                  Expanded(
                    child: AppTextField(
                      label: 'First Name *',
                      hint: 'Daniel',
                      controller: _firstNameCtrl,
                      validator: (v) =>
                          (v == null || v.trim().length < 2) ? 'Required' : null,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: AppTextField(
                      label: 'Last Name *',
                      hint: 'Olamilekan',
                      controller: _lastNameCtrl,
                      validator: (v) =>
                          (v == null || v.trim().length < 2) ? 'Required' : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              AppTextField(
                label: 'Email Address *',
                hint: 'you@example.com',
                controller: _emailCtrl,
                keyboardType: TextInputType.emailAddress,
                prefix: const Icon(Icons.mail_outline_rounded,
                    size: 18, color: AppColors.textHint),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return 'Required';
                  if (!v.contains('@')) return 'Invalid email';
                  return null;
                },
              ),
              const SizedBox(height: 16),
              AppTextField(
                label: 'Phone Number *',
                hint: '+2349022807616',
                controller: _phoneCtrl,
                keyboardType: TextInputType.phone,
                prefix: const Icon(Icons.phone_outlined,
                    size: 18, color: AppColors.textHint),
                validator: (v) {
                  if (v == null || v.trim().length < 10) {
                    return 'Enter a valid phone number';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              AppTextField(
                label: 'Password *',
                hint: 'Min 6 characters',
                controller: _passCtrl,
                obscureText: _obscurePass,
                prefix: const Icon(Icons.lock_outline_rounded,
                    size: 18, color: AppColors.textHint),
                suffix: IconButton(
                  icon: Icon(
                    _obscurePass
                        ? Icons.visibility_off_outlined
                        : Icons.visibility_outlined,
                    size: 18,
                    color: AppColors.textHint,
                  ),
                  onPressed: () => setState(() => _obscurePass = !_obscurePass),
                ),
                validator: (v) =>
                    (v == null || v.length < 6) ? 'Min 6 characters' : null,
              ),
              const SizedBox(height: 16),
              AppTextField(
                label: 'Confirm Password *',
                hint: 'Re-enter password',
                controller: _confirmPassCtrl,
                obscureText: _obscureConfirm,
                prefix: const Icon(Icons.lock_outline_rounded,
                    size: 18, color: AppColors.textHint),
                suffix: IconButton(
                  icon: Icon(
                    _obscureConfirm
                        ? Icons.visibility_off_outlined
                        : Icons.visibility_outlined,
                    size: 18,
                    color: AppColors.textHint,
                  ),
                  onPressed: () =>
                      setState(() => _obscureConfirm = !_obscureConfirm),
                ),
                validator: (v) =>
                    v != _passCtrl.text ? "Passwords don't match" : null,
              ),
              const SizedBox(height: 24),
              AppButton(
                label: 'Continue',
                onTap: _nextStep,
                width: double.infinity,
                icon: Icons.arrow_forward_rounded,
              ),
            ],
          ),
          const SizedBox(height: 20),
          _signInLink(),
          const SizedBox(height: 32),
        ],
      ),
    ).animate().fadeIn(duration: 250.ms);
  }

  Widget _buildStep2(AuthProvider auth) {
    return Form(
      key: _step2Key,
      child: Column(
        key: const ValueKey('step2'),
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('About you', style: AppTextStyles.headlineLarge),
          const SizedBox(height: 6),
          const Text(
            'Date of birth, location and optional referral',
            style: AppTextStyles.bodyMedium,
          ),
          const SizedBox(height: 24),
          _card(
            children: [
              _dateOfBirthField(),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(child: _genderDropdown()),
                  const SizedBox(width: 12),
                  Expanded(child: _countryField()),
                ],
              ),
              const SizedBox(height: 16),
              _stateDropdown(),
              const SizedBox(height: 16),
              AppTextField(
                label: 'Street Address *',
                hint: 'Enter street address',
                controller: _addressCtrl,
                maxLines: 2,
                prefix: const Icon(Icons.location_on_outlined,
                    size: 18, color: AppColors.textHint),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) {
                    return 'Address is required';
                  }
                  if (v.trim().length < 5) {
                    return 'Enter a valid address';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              AppTextField(
                label: 'Referral Code (Optional)',
                hint: 'Enter referral code',
                controller: _referralCtrl,
                prefix: const Icon(Icons.card_giftcard_rounded,
                    size: 18, color: AppColors.textHint),
              ),
              const SizedBox(height: 20),
              _termsCheckbox(),
              const SizedBox(height: 24),
              AppButton(
                label: 'Create Account',
                onTap: _submit,
                isLoading: auth.isLoading,
                width: double.infinity,
              ),
            ],
          ),
          const SizedBox(height: 20),
          _signInLink(),
          const SizedBox(height: 32),
        ],
      ),
    ).animate().fadeIn(duration: 250.ms);
  }

  Widget _card({required List<Widget> children}) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 24,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children,
      ),
    );
  }

  Widget _dateOfBirthField() {
    final label = _dob == null
        ? 'dd/mm/yyyy'
        : '${_dob!.day.toString().padLeft(2, '0')}/${_dob!.month.toString().padLeft(2, '0')}/${_dob!.year}';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Date of Birth *',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        InkWell(
          onTap: () async {
            final picked = await showDatePicker(
              context: context,
              initialDate: _dob ?? DateTime(2000, 1, 1),
              firstDate: DateTime(1950),
              lastDate: DateTime.now().subtract(const Duration(days: 365 * 13)),
            );
            if (picked != null) setState(() => _dob = picked);
          },
          borderRadius: BorderRadius.circular(14),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            decoration: BoxDecoration(
              color: AppColors.surfaceVariant,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                const Icon(Icons.calendar_today_outlined,
                    size: 18, color: AppColors.textHint),
                const SizedBox(width: 10),
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 15,
                    color: _dob == null
                        ? AppColors.textHint
                        : AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _genderDropdown() {
    return _labeledDropdown(
      label: 'Gender *',
      value: _gender,
      icon: Icons.person_outline_rounded,
      items: const ['male', 'female'],
      display: (v) => v[0].toUpperCase() + v.substring(1),
      onChanged: (v) => setState(() => _gender = v!),
    );
  }

  Widget _countryField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Country *',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
          decoration: BoxDecoration(
            color: AppColors.surfaceVariant,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.border),
          ),
          child: const Row(
            children: [
              Icon(Icons.public, size: 18, color: AppColors.textHint),
              SizedBox(width: 10),
              Text('Nigeria', style: TextStyle(fontSize: 15)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _stateDropdown() {
    return _labeledDropdown(
      label: 'State *',
      value: _state,
      hint: 'Select State',
      icon: Icons.map_outlined,
      items: _nigeriaStates,
      display: (v) => v,
      onChanged: (v) => setState(() => _state = v),
    );
  }

  Widget _labeledDropdown({
    required String label,
    required String? value,
    required IconData icon,
    required List<String> items,
    required String Function(String) display,
    required void Function(String?) onChanged,
    String? hint,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: AppColors.surfaceVariant,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.border),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: value,
              isExpanded: true,
              hint: Row(
                children: [
                  Icon(icon, size: 18, color: AppColors.textHint),
                  const SizedBox(width: 10),
                  Text(hint ?? '', style: const TextStyle(color: AppColors.textHint)),
                ],
              ),
              style: const TextStyle(
                fontSize: 15,
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w500,
              ),
              items: items
                  .map((s) => DropdownMenuItem(value: s, child: Text(display(s))))
                  .toList(),
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }

  Widget _termsCheckbox() {
    return GestureDetector(
      onTap: () => setState(() => _acceptTerms = !_acceptTerms),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            width: 22,
            height: 22,
            margin: const EdgeInsets.only(top: 2),
            decoration: BoxDecoration(
              color: _acceptTerms ? AppColors.primary : Colors.transparent,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(
                color: _acceptTerms ? AppColors.primary : AppColors.border,
                width: 1.5,
              ),
            ),
            child: _acceptTerms
                ? const Icon(Icons.check_rounded, size: 15, color: Colors.white)
                : null,
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Text(
              'I agree to the Terms and Conditions of this Platform.',
              style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
          ),
        ],
      ),
    );
  }

  Widget _signInLink() {
    return Center(
      child: TextButton(
        onPressed: () => context.go('/login'),
        child: const Text(
          'Already have an account? Sign In',
          style: TextStyle(
            fontSize: 14,
            color: AppColors.primary,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
