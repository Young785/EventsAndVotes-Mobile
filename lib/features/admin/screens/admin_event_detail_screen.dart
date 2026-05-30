import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/services/admin_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../features/events/models/event_model.dart';

class AdminEventDetailScreen extends StatefulWidget {
  final String eventId;
  const AdminEventDetailScreen({super.key, required this.eventId});

  @override
  State<AdminEventDetailScreen> createState() => _AdminEventDetailScreenState();
}

class _AdminEventDetailScreenState extends State<AdminEventDetailScreen> {
  final AdminService _admin = AdminService();
  EventModel? _event;
  Map<String, dynamic>? _analytics;
  List<dynamic> _locations = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final results = await Future.wait([
        _admin.getEvent(widget.eventId),
        _admin.getEventAnalytics(widget.eventId),
        _admin.getScanLocations(widget.eventId),
      ]);
      if (mounted) {
        setState(() {
          _event = EventModel.fromJson(results[0] as Map<String, dynamic>);
          _analytics = results[1] as Map<String, dynamic>;
          _locations = results[2] as List<dynamic>;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _publish() async {
    try {
      await _admin.publishEvent(widget.eventId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Event published'),
            backgroundColor: AppColors.success,
          ),
        );
        _load();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: AppColors.error),
        );
      }
    }
  }

  Future<void> _addLocation() async {
    final nameCtrl = TextEditingController();
    final typeCtrl = TextEditingController(text: 'entry');
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Add scan location'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameCtrl,
              decoration: const InputDecoration(labelText: 'Location name'),
            ),
            TextField(
              controller: typeCtrl,
              decoration: const InputDecoration(
                  labelText: 'Type (entry/exit/checkpoint)'),
            ),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel')),
          ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Create')),
        ],
      ),
    );
    if (ok == true && nameCtrl.text.isNotEmpty) {
      await _admin.createScanLocation(widget.eventId, {
        'name': nameCtrl.text,
        'type': typeCtrl.text,
        'is_active': true,
      });
      _load();
    }
    nameCtrl.dispose();
    typeCtrl.dispose();
  }

  Future<void> _addScanUser(dynamic location) async {
    final emailCtrl = TextEditingController();
    String role = 'scanner';
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Invite gate staff'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: emailCtrl,
                decoration: const InputDecoration(labelText: 'Email'),
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: role,
                items: const [
                  DropdownMenuItem(value: 'scanner', child: Text('Scanner')),
                  DropdownMenuItem(
                      value: 'supervisor', child: Text('Supervisor')),
                ],
                onChanged: (v) => setState(() => role = v ?? 'scanner'),
                decoration: const InputDecoration(labelText: 'Role'),
              ),
            ],
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('Cancel')),
            ElevatedButton(
                onPressed: () => Navigator.pop(context, true),
                child: const Text('Invite')),
          ],
        ),
      ),
    );
    if (ok == true && emailCtrl.text.isNotEmpty) {
      try {
        final result = await _admin.createScanUser(
          location['id'].toString(),
          {'email': emailCtrl.text, 'role': role},
        );
        final token = result['access_token']?.toString();
        if (token != null && mounted) {
          final url = '${AppConstants.frontendUrl}/scan/$token';
          await showDialog(
            context: context,
            builder: (_) => AlertDialog(
              title: const Text('Scanner invitation'),
              content: SelectableText(url),
              actions: [
                TextButton(
                  onPressed: () {
                    Clipboard.setData(ClipboardData(text: url));
                    Navigator.pop(context);
                  },
                  child: const Text('Copy URL'),
                ),
                TextButton(
                  onPressed: () {
                    Share.share('Gate scan link: $url');
                    Navigator.pop(context);
                  },
                  child: const Text('Share'),
                ),
              ],
            ),
          );
        }
        _load();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(e.toString()), backgroundColor: AppColors.error),
          );
        }
      }
    }
    emailCtrl.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(_event?.title ?? 'Event'),
        backgroundColor: AppColors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary))
          : _event == null
              ? const Center(child: Text('Event not found'))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      if (_event!.status != 'active')
                        ElevatedButton(
                          onPressed: _publish,
                          child: const Text('Publish Event'),
                        ),
                      const SizedBox(height: 16),
                      _section('Analytics', [
                        _row('Tickets sold',
                            '${_analytics?['tickets_sold'] ?? _analytics?['total_tickets'] ?? 0}'),
                        _row('Revenue',
                            '₦${_analytics?['revenue'] ?? _analytics?['total_revenue'] ?? 0}'),
                        _row('Scans today',
                            '${_analytics?['scans_today'] ?? 0}'),
                      ]),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Scan locations',
                              style: AppTextStyles.headlineSmall),
                          TextButton.icon(
                            onPressed: _addLocation,
                            icon: const Icon(Icons.add, size: 18),
                            label: const Text('Add'),
                          ),
                        ],
                      ),
                      ..._locations.map((loc) => Card(
                            child: ListTile(
                              title: Text(loc['name']?.toString() ?? ''),
                              subtitle: Text(loc['type']?.toString() ?? ''),
                              trailing: IconButton(
                                icon: const Icon(Icons.person_add_outlined),
                                onPressed: () => _addScanUser(loc),
                              ),
                            ),
                          )),
                      const SizedBox(height: 16),
                      OutlinedButton.icon(
                        onPressed: () =>
                            context.push('/admin/events/${widget.eventId}/scanner'),
                        icon: const Icon(Icons.qr_code_scanner_rounded),
                        label: const Text('Test gate scanner'),
                      ),
                    ],
                  ),
                ),
    );
  }

  Widget _section(String title, List<Widget> children) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: AppTextStyles.headlineSmall),
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: AppTextStyles.bodyMedium),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}
