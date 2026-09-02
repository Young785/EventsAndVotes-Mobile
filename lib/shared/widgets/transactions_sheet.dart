import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../core/theme/app_theme.dart';
import '../../core/services/tickets_service.dart';
import '../../core/services/votes_service.dart';
import '../../shared/widgets/shimmer_card.dart';

enum TransactionType { tickets, votes }

/// Bottom sheet that lists purchase / cast history.
/// Reused by both [MyTicketsScreen] and [VotesListScreen].
class TransactionsSheet extends StatefulWidget {
  final TransactionType type;
  final String? token;

  const TransactionsSheet({
    super.key,
    required this.type,
    this.token,
  });

  static Future<void> show(
    BuildContext context, {
    required TransactionType type,
    String? token,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => TransactionsSheet(type: type, token: token),
    );
  }

  @override
  State<TransactionsSheet> createState() => _TransactionsSheetState();
}

class _TransactionsSheetState extends State<TransactionsSheet> {
  List<Map<String, dynamic>> _items = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      if (widget.type == TransactionType.tickets) {
        final raw = await TicketsService().getMyTickets();
        _items = raw.map((e) => Map<String, dynamic>.from(e)).toList();
      } else {
        _items = await VotesService().getMyVoteTransactions();
      }
      if (mounted) setState(() => _loading = false);
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString().replaceAll('Exception: ', '');
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomPad = MediaQuery.of(context).padding.bottom;
    final maxH = MediaQuery.of(context).size.height * 0.82;
    final isTickets = widget.type == TransactionType.tickets;

    return Container(
      margin: const EdgeInsets.fromLTRB(12, 0, 12, 12),
      constraints: BoxConstraints(maxHeight: maxH),
      decoration: const BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.all(Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // ── Handle ────────────────────────────────────────────────
          const SizedBox(height: 12),
          Container(
            width: 36,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.border,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 14),

          // ── Title ─────────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                HugeIcon(
                  icon: isTickets
                      ? HugeIcons.strokeRoundedShoppingBag01
                      : HugeIcons.strokeRoundedCheckList,
                  color: AppColors.primary,
                  size: 22,
                ),
                const SizedBox(width: 10),
                Text(
                  isTickets ? 'Ticket Transactions' : 'Vote Transactions',
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.close_rounded,
                      color: AppColors.textHint),
                  onPressed: () => Navigator.pop(context),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            ),
          ),

          const Divider(height: 1, color: AppColors.border),

          // ── Body ──────────────────────────────────────────────────
          Flexible(
            child: _loading
                ? const Padding(
                    padding: EdgeInsets.all(20),
                    child: ShimmerList(count: 5, itemHeight: 72),
                  )
                : _error != null
                    ? _buildError()
                    : _items.isEmpty
                        ? _buildEmpty(isTickets)
                        : ListView.separated(
                            padding: EdgeInsets.fromLTRB(
                                16, 12, 16, bottomPad + 16),
                            itemCount: _items.length,
                            separatorBuilder: (_, __) =>
                                const SizedBox(height: 8),
                            itemBuilder: (_, i) => isTickets
                                ? _TicketTxRow(item: _items[i])
                                : _VoteTxRow(item: _items[i]),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildError() {
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          HugeIcon(
            icon: HugeIcons.strokeRoundedWifiError01,
            color: AppColors.textHint,
            size: 40,
          ),
          const SizedBox(height: 12),
          Text(
            _error ?? 'Failed to load transactions',
            style: const TextStyle(
                color: AppColors.textSecondary, fontSize: 13),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          TextButton.icon(
            onPressed: _load,
            icon: const Icon(Icons.refresh_rounded, size: 16),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmpty(bool isTickets) {
    return Padding(
      padding: const EdgeInsets.all(40),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          HugeIcon(
            icon: isTickets
                ? HugeIcons.strokeRoundedShoppingBag01
                : HugeIcons.strokeRoundedCheckList,
            color: AppColors.textHint,
            size: 44,
          ),
          const SizedBox(height: 14),
          Text(
            isTickets
                ? 'No ticket purchases yet'
                : 'No vote transactions yet',
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            isTickets
                ? 'Buy event tickets and they will appear here'
                : 'Cast votes and they will appear here',
            style: const TextStyle(
                color: AppColors.textSecondary, fontSize: 13),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

// ── Ticket transaction row ────────────────────────────────────────────────────

class _TicketTxRow extends StatelessWidget {
  final Map<String, dynamic> item;
  const _TicketTxRow({required this.item});

  String _fmt(String? raw) {
    if (raw == null || raw.isEmpty) return '—';
    try {
      final dt = DateTime.parse(raw);
      const m = [
        'Jan','Feb','Mar','Apr','May','Jun',
        'Jul','Aug','Sep','Oct','Nov','Dec'
      ];
      return '${dt.day} ${m[dt.month - 1]} ${dt.year}';
    } catch (_) {
      return raw.length >= 10 ? raw.substring(0, 10) : raw;
    }
  }

  @override
  Widget build(BuildContext context) {
    final event = item['event'] as Map? ?? {};
    final tier = item['ticket_tier'] ?? item['tier'];
    final tierName = tier is Map
        ? tier['name']?.toString()
        : tier?.toString();

    final title = event['title']?.toString() ??
        item['event_title']?.toString() ??
        'Event Ticket';
    final status = item['status']?.toString() ?? 'sold';
    final price = _parsePrice(item['price_paid'] ?? item['price']);
    final date = _fmt(
        item['purchased_at']?.toString() ??
        item['created_at']?.toString());

    final isValid = status == 'sold' && item['is_used'] != true;
    final statusColor = isValid ? AppColors.success : AppColors.error;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          // Icon
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: AppColors.primarySurface,
              borderRadius: BorderRadius.circular(11),
            ),
            child: Center(
              child: HugeIcon(
                icon: HugeIcons.strokeRoundedTicket02,
                color: AppColors.primary,
                size: 20,
              ),
            ),
          ),
          const SizedBox(width: 12),
          // Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 3),
                Row(
                  children: [
                    if (tierName != null) ...[
                      Text(
                        tierName,
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const Text(' · ',
                          style: TextStyle(
                              color: AppColors.textHint, fontSize: 11)),
                    ],
                    Text(
                      date,
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textHint,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          // Right: price + status
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                price == 0
                    ? 'FREE'
                    : '₦${price.toStringAsFixed(0)}',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  status.toUpperCase(),
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                    color: statusColor,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  double _parsePrice(dynamic v) {
    if (v == null) return 0;
    if (v is num) return v.toDouble();
    return double.tryParse(v.toString()) ?? 0;
  }
}

// ── Vote transaction row ──────────────────────────────────────────────────────

class _VoteTxRow extends StatelessWidget {
  final Map<String, dynamic> item;
  const _VoteTxRow({required this.item});

  String _fmt(String? raw) {
    if (raw == null || raw.isEmpty) return '—';
    try {
      final dt = DateTime.parse(raw);
      const m = [
        'Jan','Feb','Mar','Apr','May','Jun',
        'Jul','Aug','Sep','Oct','Nov','Dec'
      ];
      return '${dt.day} ${m[dt.month - 1]} ${dt.year}';
    } catch (_) {
      return raw.length >= 10 ? raw.substring(0, 10) : raw;
    }
  }

  @override
  Widget build(BuildContext context) {
    // Handle both nested vote object and flat fields
    final voteObj = item['vote'] as Map? ?? {};
    final title = voteObj['title']?.toString() ??
        item['vote_title']?.toString() ??
        item['title']?.toString() ??
        'Vote';
    final nominee = item['nominee'] as Map? ?? {};
    final nomineeName = [
          nominee['first_name'],
          nominee['last_name'],
        ].where((v) => v != null && v.toString().isNotEmpty).join(' ').trim().isNotEmpty
        ? [nominee['first_name'], nominee['last_name']]
            .where((v) => v != null && v.toString().isNotEmpty)
            .join(' ')
            .trim()
        : nominee['name']?.toString() ?? item['nominee_name']?.toString();

    final position = item['position'] as Map? ?? {};
    final positionTitle = position['title']?.toString() ??
        item['position_title']?.toString();

    final qty = item['quantity']?.toString() ?? '1';
    final amount = _parseAmount(
        item['amount'] ?? item['total_amount'] ?? item['price']);
    final date = _fmt(
        item['voted_at']?.toString() ??
        item['created_at']?.toString());

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          // Icon
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: AppColors.primarySurface,
              borderRadius: BorderRadius.circular(11),
            ),
            child: Center(
              child: HugeIcon(
                icon: HugeIcons.strokeRoundedCheckList,
                color: AppColors.primary,
                size: 20,
              ),
            ),
          ),
          const SizedBox(width: 12),
          // Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 3),
                Text(
                  [
                    if (nomineeName != null && nomineeName.isNotEmpty)
                      nomineeName,
                    if (positionTitle != null) positionTitle,
                    '$qty vote${int.tryParse(qty) == 1 ? '' : 's'}',
                    date,
                  ].join(' · '),
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textHint,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          // Amount
          Text(
            amount == 0 ? 'FREE' : '₦${amount.toStringAsFixed(0)}',
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  double _parseAmount(dynamic v) {
    if (v == null) return 0;
    if (v is num) return v.toDouble();
    return double.tryParse(v.toString()) ?? 0;
  }
}
