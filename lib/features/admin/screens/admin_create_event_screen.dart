import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/services/admin_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_text_field.dart';

class AdminCreateEventScreen extends StatefulWidget {
  const AdminCreateEventScreen({super.key});

  @override
  State<AdminCreateEventScreen> createState() => _AdminCreateEventScreenState();
}

class _AdminCreateEventScreenState extends State<AdminCreateEventScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _venueCtrl = TextEditingController();
  final AdminService _admin = AdminService();
  bool _saving = false;

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descCtrl.dispose();
    _venueCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      final event = await _admin.createEvent({
        'title': _titleCtrl.text.trim(),
        'description': _descCtrl.text.trim(),
        'venue': _venueCtrl.text.trim(),
        'is_public': true,
        'status': 'draft',
      });
      if (mounted) {
        final id = event['id']?.toString();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Event created'),
            backgroundColor: AppColors.success,
          ),
        );
        if (id != null) {
          context.go('/admin/events/$id');
        } else {
          context.go('/admin/events');
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Create Event'),
        backgroundColor: AppColors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            AppTextField(
              controller: _titleCtrl,
              label: 'Event title',
              validator: (v) =>
                  v == null || v.isEmpty ? 'Title is required' : null,
            ),
            const SizedBox(height: 12),
            AppTextField(
              controller: _descCtrl,
              label: 'Description',
              maxLines: 4,
              validator: (v) =>
                  v == null || v.isEmpty ? 'Description is required' : null,
            ),
            const SizedBox(height: 12),
            AppTextField(
              controller: _venueCtrl,
              label: 'Venue',
              validator: (v) =>
                  v == null || v.isEmpty ? 'Venue is required' : null,
            ),
            const SizedBox(height: 24),
            AppButton(
              label: 'Create Event',
              onTap: _saving ? null : _save,
              isLoading: _saving,
            ),
          ],
        ),
      ),
    );
  }
}
