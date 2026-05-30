import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/services/admin_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../features/events/models/event_model.dart';
import '../../../shared/widgets/shimmer_card.dart';

class AdminEventsScreen extends StatefulWidget {
  const AdminEventsScreen({super.key});

  @override
  State<AdminEventsScreen> createState() => _AdminEventsScreenState();
}

class _AdminEventsScreenState extends State<AdminEventsScreen> {
  final AdminService _admin = AdminService();
  List<EventModel> _events = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await _admin.getEvents();
      final data = res['data'] as List? ?? [];
      if (mounted) {
        setState(() {
          _events = data.map((e) => EventModel.fromJson(e)).toList();
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('My Events'),
        backgroundColor: AppColors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.add_rounded),
            onPressed: () => context.push('/admin/events/create'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _loading
            ? ListView(
                children: const [
                  Padding(
                    padding: EdgeInsets.all(16),
                    child: ShimmerList(count: 5, itemHeight: 80),
                  ),
                ],
              )
            : _events.isEmpty
                ? const Center(child: Text('No events yet'))
                : ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _events.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (_, i) {
                      final e = _events[i];
                      return ListTile(
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                          side: const BorderSide(color: AppColors.border),
                        ),
                        tileColor: AppColors.white,
                        title: Text(e.title,
                            style: const TextStyle(fontWeight: FontWeight.w700)),
                        subtitle: Text('${e.venue} · ${e.status}'),
                        trailing: const Icon(Icons.chevron_right_rounded),
                        onTap: () => context.push('/admin/events/${e.id}'),
                      );
                    },
                  ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/admin/events/create'),
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.add),
        label: const Text('Create'),
      ),
    );
  }
}
