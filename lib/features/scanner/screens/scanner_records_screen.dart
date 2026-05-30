import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../models/scan_record.dart';
import '../providers/scanner_session_provider.dart';
import '../theme/scanner_theme.dart';

class ScannerRecordsScreen extends StatefulWidget {
  const ScannerRecordsScreen({super.key});

  @override
  State<ScannerRecordsScreen> createState() => _ScannerRecordsScreenState();
}

class _ScannerRecordsScreenState extends State<ScannerRecordsScreen> {
  int _filter = 0;
  final _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  List<ScanRecord> _filtered(ScannerSessionProvider scanner) {
    var list = scanner.scanHistory;
    switch (_filter) {
      case 1:
        list = list.where((r) => r.approved).toList();
        break;
      case 2:
        list = list.where((r) => !r.approved).toList();
        break;
    }
    final q = _searchCtrl.text.trim().toLowerCase();
    if (q.isEmpty) return list;
    return list
        .where(
          (r) =>
              r.guestName.toLowerCase().contains(q) ||
              r.ticketCode.toLowerCase().contains(q),
        )
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final scanner = context.watch<ScannerSessionProvider>();
    final records = _filtered(scanner);
    final todayLabel = DateFormat('EEEE, MMM d').format(DateTime.now());

    return RefreshIndicator(
      onRefresh: scanner.refreshSession,
      color: ScannerTheme.primary,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(
          parent: BouncingScrollPhysics(),
        ),
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                Text(
                  todayLabel,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: ScannerTheme.textMuted,
                    letterSpacing: 0.2,
                  ),
                ),
                const SizedBox(height: 12),
                _RecordsSummary(scanner: scanner),
                const SizedBox(height: 16),
                TextField(
                  controller: _searchCtrl,
                  onChanged: (_) => setState(() {}),
                  decoration: InputDecoration(
                    hintText: 'Search guest or ticket code',
                    prefixIcon: const Icon(Icons.search_rounded, size: 22),
                    filled: true,
                    fillColor: Colors.white,
                    contentPadding: const EdgeInsets.symmetric(vertical: 12),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide(color: ScannerTheme.primaryLight),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide(color: ScannerTheme.primaryLight),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: const BorderSide(
                        color: ScannerTheme.primary,
                        width: 1.5,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                _FilterBar(
                  filter: _filter,
                  onChanged: (i) => setState(() => _filter = i),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    const Text(
                      'Scan records',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: ScannerTheme.textDark,
                      ),
                    ),
                    const Spacer(),
                    if (records.isNotEmpty)
                      Text(
                        '${records.length} ticket${records.length == 1 ? '' : 's'}',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: ScannerTheme.textMuted,
                        ),
                      ),
                  ],
                ),
                if (records.isEmpty)
                  _EmptyRecords(scanner: scanner)
                else
                  ...records.asMap().entries.map((entry) {
                    final record = entry.value;
                    final isLast = entry.key == records.length - 1;
                    return _HistoryRow(record: record, showDivider: !isLast);
                  }),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

class _RecordsSummary extends StatelessWidget {
  final ScannerSessionProvider scanner;

  const _RecordsSummary({required this.scanner});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: ScannerTheme.cardDecoration,
      child: Row(
        children: [
          Expanded(
            child: _SummaryTile(
              label: 'Total',
              value: '${scanner.todayScans}',
              color: ScannerTheme.textDark,
            ),
          ),
          Container(width: 1, height: 36, color: const Color(0xFFE8ECF2)),
          Expanded(
            child: _SummaryTile(
              label: 'Approved',
              value: '${scanner.approvedCount}',
              color: ScannerTheme.primary,
            ),
          ),
          Container(width: 1, height: 36, color: const Color(0xFFE8ECF2)),
          Expanded(
            child: _SummaryTile(
              label: 'Declined',
              value: '${scanner.declinedCount}',
              color: const Color(0xFFE74C3C),
            ),
          ),
        ],
      ),
    );
  }
}

class _SummaryTile extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _SummaryTile({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w800,
            color: color,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: ScannerTheme.textMuted,
          ),
        ),
      ],
    );
  }
}

class _FilterBar extends StatelessWidget {
  final int filter;
  final ValueChanged<int> onChanged;

  const _FilterBar({required this.filter, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    const labels = ['All', 'Approved', 'Declined'];
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ScannerTheme.primaryLight),
      ),
      child: Row(
        children: List.generate(labels.length, (i) {
          final selected = filter == i;
          return Expanded(
            child: GestureDetector(
              onTap: () => onChanged(i),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: selected ? ScannerTheme.primary : Colors.transparent,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  labels[i],
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: selected ? Colors.white : ScannerTheme.textMuted,
                  ),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
}

class _EmptyRecords extends StatelessWidget {
  final ScannerSessionProvider scanner;

  const _EmptyRecords({required this.scanner});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 40),
      child: Column(
        children: [
          Icon(
            Icons.receipt_long_outlined,
            size: 40,
            color: ScannerTheme.textMuted.withValues(alpha: 0.45),
          ),
          const SizedBox(height: 12),
          const Text(
            'No scan records yet',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: ScannerTheme.textDark,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Scanned tickets at ${scanner.locationName} will appear here.',
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 13,
              height: 1.45,
              color: ScannerTheme.textMuted,
            ),
          ),
        ],
      ),
    );
  }
}

class _HistoryRow extends StatelessWidget {
  final ScanRecord record;
  final bool showDivider;

  const _HistoryRow({required this.record, required this.showDivider});

  @override
  Widget build(BuildContext context) {
    final approved = record.approved;
    final timeFmt = DateFormat('h:mm a');
    final statusColor =
        approved ? ScannerTheme.primary : const Color(0xFFE74C3C);
    final statusBg =
        approved ? ScannerTheme.primaryLight : const Color(0xFFFFECEC);

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(color: statusBg, shape: BoxShape.circle),
                child: Icon(
                  approved ? Icons.check_rounded : Icons.close_rounded,
                  size: 18,
                  color: statusColor,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            record.guestName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 15,
                              color: ScannerTheme.textDark,
                            ),
                          ),
                        ),
                        Text(
                          timeFmt.format(record.scannedAt),
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: ScannerTheme.textMuted,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Ticket · ${record.ticketCode}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 12,
                        color: ScannerTheme.textMuted,
                      ),
                    ),
                    if (record.ticketType != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        record.ticketType!,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: ScannerTheme.primaryDark.withValues(alpha: 0.85),
                        ),
                      ),
                    ],
                    if (!approved && record.declineReason != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        record.declineReason!,
                        style: TextStyle(
                          fontSize: 11,
                          color: statusColor.withValues(alpha: 0.9),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
        if (showDivider) const Divider(height: 1, color: Color(0xFFE8ECF2)),
      ],
    );
  }
}
