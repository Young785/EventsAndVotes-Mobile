import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/ticket_cart_provider.dart';
import '../../../core/services/events_service.dart';
import '../../../core/services/tickets_service.dart';
import '../../../core/services/payment_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../features/events/models/event_model.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../../../shared/widgets/detail_back_button.dart';

class BuyTicketsScreen extends StatefulWidget {
  final String eventId;
  const BuyTicketsScreen({super.key, required this.eventId});

  @override
  State<BuyTicketsScreen> createState() => _BuyTicketsScreenState();
}

class _BuyTicketsScreenState extends State<BuyTicketsScreen> {
  final EventsService _eventsService = EventsService();
  final TicketsService _ticketsService = TicketsService();
  final PaymentService _paymentService = PaymentService();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final Map<int, int> _quantities = {};

  EventModel? _event;
  bool _loading = true;
  bool _purchasing = false;

  @override
  void initState() {
    super.initState();
    _load();
    // Rebuild so button enables/disables as user types
    _nameCtrl.addListener(() => setState(() {}));
    _emailCtrl.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final data = await _eventsService.getEventDetails(widget.eventId);
      final auth = context.read<AuthProvider>();
      if (mounted) {
        setState(() {
          _event = EventModel.fromJson(data);
          _loading = false;
          if (auth.user != null) {
            _nameCtrl.text = auth.user!.fullName;
            _emailCtrl.text = auth.user!.email;
            _phoneCtrl.text = auth.user!.phone ?? '';
          }
          for (final tier in _event!.ticketTiers.where((t) => t.isActive)) {
            _quantities[tier.id] = 0;
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: AppColors.error),
        );
      }
    }
  }

  double get _total {
    if (_event == null) return 0;
    double sum = 0;
    for (final tier in _event!.ticketTiers) {
      final qty = _quantities[tier.id] ?? 0;
      sum += tier.price * qty;
    }
    return sum;
  }

  int get _totalQty =>
      _quantities.values.fold(0, (a, b) => a + b);

  // True when form is ready to submit
  bool get _canPurchase =>
      !_purchasing &&
      _totalQty > 0 &&
      _nameCtrl.text.trim().isNotEmpty &&
      _emailCtrl.text.trim().isNotEmpty;

  Future<void> _purchase() async {
    if (_event == null || _totalQty == 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Select at least one ticket')),
      );
      return;
    }
    if (_nameCtrl.text.isEmpty || _emailCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Name and email are required')),
      );
      return;
    }

    setState(() => _purchasing = true);
    try {
      final tickets = _quantities.entries
          .where((e) => e.value > 0)
          .map((e) => {'tier_id': e.key, 'quantity': e.value})
          .toList();

      final result = await _ticketsService.purchaseTickets(
        eventId: widget.eventId,
        tickets: tickets,
        customerName: _nameCtrl.text.trim(),
        customerEmail: _emailCtrl.text.trim(),
        customerPhone:
            _phoneCtrl.text.trim().isEmpty ? null : _phoneCtrl.text.trim(),
      );

      if (!mounted) return;

      final paid = await _paymentService.launchFromPurchaseResponse(
        context: context,
        purchaseResponse: result,
        customerEmail: _emailCtrl.text.trim(),
        customerName: _nameCtrl.text.trim(),
        amountNaira: _total,
      );

      if (!mounted) return;

      if (paid) {
        if (!mounted) return;
        // Update cart badge count
        context.read<TicketCartProvider>().increment(_totalQty);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Payment successful! Your tickets are ready.'),
            backgroundColor: AppColors.success,
          ),
        );
        context.go('/my-tickets');
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
      if (mounted) setState(() => _purchasing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _event == null
              ? const Center(child: Text('Event not found'))
              : CustomScrollView(
                  slivers: [
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(0, 8, 0, 0),
                        child: Row(
                          children: [
                            const DetailBackButton(),
                            Expanded(
                              child: Text(
                                'Buy Tickets',
                                style: AppTextStyles.headlineSmall,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    SliverPadding(
                      padding: const EdgeInsets.all(16),
                      sliver: SliverList(
                        delegate: SliverChildListDelegate([
                          Text(_event!.title,
                              style: AppTextStyles.displayMedium),
                          const SizedBox(height: 16),
                          ..._event!.ticketTiers
                              .where((t) => t.isActive)
                              .map(_buildTierRow),
                          const SizedBox(height: 20),
                          const Text('Your details',
                              style: AppTextStyles.headlineSmall),
                          const SizedBox(height: 12),
                          AppTextField(
                            controller: _nameCtrl,
                            label: 'Full name',
                            prefix: const Icon(Icons.person_outline),
                          ),
                          const SizedBox(height: 12),
                          AppTextField(
                            controller: _emailCtrl,
                            label: 'Email',
                            keyboardType: TextInputType.emailAddress,
                            prefix: const Icon(Icons.email_outlined),
                          ),
                          const SizedBox(height: 12),
                          AppTextField(
                            controller: _phoneCtrl,
                            label: 'Phone (optional)',
                            keyboardType: TextInputType.phone,
                            prefix: const Icon(Icons.phone_outlined),
                          ),
                          const SizedBox(height: 24),
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: AppColors.primarySurface,
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Total',
                                    style: TextStyle(
                                        fontWeight: FontWeight.w700)),
                                Text(
                                  _total == 0
                                      ? 'FREE'
                                      : '₦${_total.toStringAsFixed(0)}',
                                  style: const TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.primary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                          AppButton(
                            label: _purchasing ? 'Processing...' : 'Continue to Payment',
                            onTap: _canPurchase ? _purchase : null,
                            isLoading: _purchasing,
                          ),
                          const SizedBox(height: 32),
                        ]),
                      ),
                    ),
                  ],
                ),
    );
  }

  Widget _buildTierRow(TicketTierModel tier) {
    final qty = _quantities[tier.id] ?? 0;
    final remaining = tier.capacity != null
        ? tier.capacity! - tier.soldCount
        : 999;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(tier.name,
                    style: const TextStyle(fontWeight: FontWeight.w700)),
                Text(
                  tier.price == 0
                      ? 'FREE'
                      : '₦${tier.price.toStringAsFixed(0)} each',
                  style: const TextStyle(
                      color: AppColors.primary, fontSize: 13),
                ),
              ],
            ),
          ),
          Row(
            children: [
              IconButton(
                onPressed: qty > 0
                    ? () => setState(() => _quantities[tier.id] = qty - 1)
                    : null,
                icon: const Icon(Icons.remove_circle_outline),
              ),
              Text('$qty',
                  style: const TextStyle(
                      fontWeight: FontWeight.w700, fontSize: 16)),
              IconButton(
                onPressed: qty < remaining
                    ? () => setState(() => _quantities[tier.id] = qty + 1)
                    : null,
                icon: const Icon(Icons.add_circle_outline),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
