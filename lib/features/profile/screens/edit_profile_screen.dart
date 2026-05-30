import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../../../core/theme/app_theme.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/services/profile_service.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../../../shared/utils/navigation_utils.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameCtrl = TextEditingController();
  final _lastNameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();

  bool _loading = false;
  bool _uploadingAvatar = false;
  String? _avatarUrl;
  String? _localAvatarPath;
  final ProfileService _profileService = ProfileService();

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _addressCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadUserData() async {
    final auth = context.read<AuthProvider>();
    final user = auth.user;
    if (user != null) {
      setState(() {
        _firstNameCtrl.text = user.firstName;
        _lastNameCtrl.text = user.lastName;
        _emailCtrl.text = user.email;
        _phoneCtrl.text = user.phone ?? '';
        _addressCtrl.text = '';
        _avatarUrl = user.image;
      });
    }
  }

  Future<void> _pickImage() async {
    try {
      final picker = ImagePicker();
      final pickedFile = await picker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 80,
      );
      if (pickedFile != null && mounted) {
        setState(() => _uploadingAvatar = true);
        try {
          final url = await _profileService.uploadAvatar(pickedFile.path);
          await context.read<AuthProvider>().initialize();
          setState(() {
            _localAvatarPath = pickedFile.path;
            _avatarUrl = url ?? pickedFile.path;
          });
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Profile photo updated'),
                backgroundColor: AppColors.success,
              ),
            );
          }
        } catch (e) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Failed to upload photo: $e'),
                backgroundColor: AppColors.error,
              ),
            );
          }
        } finally {
          if (mounted) setState(() => _uploadingAvatar = false);
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to pick image'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);

    try {
      await _profileService.updateProfile(
        firstName: _firstNameCtrl.text.trim(),
        lastName: _lastNameCtrl.text.trim(),
        phone: _phoneCtrl.text.trim(),
      );

      await context.read<AuthProvider>().initialize();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profile updated successfully!'),
            backgroundColor: AppColors.success,
          ),
        );
        popPage(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update profile: ${e.toString()}'),
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
          'Edit Profile',
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
              // Avatar section
              Center(
                child: Column(
                  children: [
                    GestureDetector(
                      onTap: _pickImage,
                      child: Stack(
                        children: [
                          Container(
                            width: 100,
                            height: 100,
                            decoration: BoxDecoration(
                              color: AppColors.primarySurface,
                              borderRadius: BorderRadius.circular(50),
                              border: Border.all(
                                color: AppColors.primary,
                                width: 3,
                              ),
                            ),
                            child: _buildAvatarPreview(),
                          ),
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: Container(
                              width: 32,
                              height: 32,
                              decoration: BoxDecoration(
                                color: AppColors.primary,
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: Colors.white,
                                  width: 2,
                                ),
                              ),
                              child: const Icon(
                                Icons.camera_alt_rounded,
                                color: Colors.white,
                                size: 16,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ).animate().fadeIn(duration: 300.ms),
                    const SizedBox(height: 12),
                    Text(
                      'Tap to change photo',
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Form fields
              Row(
                children: [
                  Expanded(
                    child: AppTextField(
                      label: 'First Name',
                      hint: 'Enter first name',
                      controller: _firstNameCtrl,
                      validator: (v) {
                        if (v == null || v.isEmpty)
                          return 'First name is required';
                        if (v.length < 2)
                          return 'Must be at least 2 characters';
                        return null;
                      },
                    ).animate().fadeIn(delay: 100.ms, duration: 300.ms),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: AppTextField(
                      label: 'Last Name',
                      hint: 'Enter last name',
                      controller: _lastNameCtrl,
                      validator: (v) {
                        if (v == null || v.isEmpty)
                          return 'Last name is required';
                        if (v.length < 2)
                          return 'Must be at least 2 characters';
                        return null;
                      },
                    ).animate().fadeIn(delay: 150.ms, duration: 300.ms),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              AppTextField(
                label: 'Email Address',
                hint: 'Enter email',
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
              ).animate().fadeIn(delay: 200.ms, duration: 300.ms),
              const SizedBox(height: 16),
              AppTextField(
                label: 'Phone Number',
                hint: 'Enter phone number',
                controller: _phoneCtrl,
                keyboardType: TextInputType.phone,
                prefix: const Icon(
                  Icons.phone_outlined,
                  size: 18,
                  color: AppColors.textHint,
                ),
                validator: (v) {
                  if (v != null && v.isNotEmpty && v.length < 10) {
                    return 'Enter a valid phone number';
                  }
                  return null;
                },
              ).animate().fadeIn(delay: 250.ms, duration: 300.ms),
              const SizedBox(height: 16),
              AppTextField(
                label: 'Address',
                hint: 'Enter your address',
                controller: _addressCtrl,
                maxLines: 3,
                prefix: const Icon(
                  Icons.location_on_outlined,
                  size: 18,
                  color: AppColors.textHint,
                ),
              ).animate().fadeIn(delay: 300.ms, duration: 300.ms),
              const SizedBox(height: 32),
              AppButton(
                label: 'Save Changes',
                onTap: _save,
                isLoading: _loading,
                width: double.infinity,
              ).animate().fadeIn(delay: 350.ms, duration: 300.ms),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAvatarPreview() {
    if (_uploadingAvatar) {
      return const Center(
        child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
      );
    }
    if (_localAvatarPath != null) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(47),
        child: Image.file(File(_localAvatarPath!), fit: BoxFit.cover),
      );
    }
    if (_avatarUrl != null && _avatarUrl!.startsWith('http')) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(47),
        child: CachedNetworkImage(
          imageUrl: _avatarUrl!,
          fit: BoxFit.cover,
          errorWidget: (_, __, ___) => _buildInitialAvatar(),
        ),
      );
    }
  if (_avatarUrl != null && _avatarUrl!.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(47),
        child: Image.network(
          AppConstants.storageUrl(_avatarUrl),
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _buildInitialAvatar(),
        ),
      );
    }
    return _buildInitialAvatar();
  }

  Widget _buildInitialAvatar() {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    return Center(
      child: Text(
        user?.firstName.substring(0, 1).toUpperCase() ?? 'U',
        style: const TextStyle(
          fontSize: 36,
          fontWeight: FontWeight.w800,
          color: AppColors.primary,
        ),
      ),
    );
  }
}
