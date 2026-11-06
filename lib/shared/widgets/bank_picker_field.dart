import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../core/services/bank_account_service.dart';
import '../../core/theme/app_theme.dart';

/// Searchable bank picker (works with API list or local fallback).
class BankPickerField extends StatefulWidget {
  final List<Map<String, dynamic>> banks;
  final String? selectedKey;
  final ValueChanged<Map<String, dynamic>> onBankSelected;

  const BankPickerField({
    super.key,
    required this.banks,
    required this.selectedKey,
    required this.onBankSelected,
  });

  @override
  State<BankPickerField> createState() => _BankPickerFieldState();
}

class _BankPickerFieldState extends State<BankPickerField> {
  Map<String, dynamic>? get _selected {
    if (widget.selectedKey == null) return null;
    for (var i = 0; i < widget.banks.length; i++) {
      if (BankAccountService.bankPickerKey(widget.banks[i], i) ==
          widget.selectedKey) {
        return widget.banks[i];
      }
    }
    return null;
  }

  Future<void> _openPicker(BuildContext context) async {
    if (widget.banks.isEmpty) return;

    final picked = await showModalBottomSheet<Map<String, dynamic>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _BankSearchSheet(banks: widget.banks),
    );

    if (picked != null) widget.onBankSelected(picked);
  }

  @override
  Widget build(BuildContext context) {
    final selected = _selected;
    final label = selected == null
        ? (widget.banks.isEmpty ? 'No banks available' : 'Tap to select bank')
        : BankAccountService.bankDisplayName(selected);

    return InkWell(
      onTap: widget.banks.isEmpty ? null : () => _openPicker(context),
      borderRadius: BorderRadius.circular(8),
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: 'Select bank',
          border: const OutlineInputBorder(),
          suffixIcon: const Icon(Icons.arrow_drop_down_rounded),
          enabled: widget.banks.isNotEmpty,
        ),
        child: Row(
          children: [
            if (selected != null) ...[
              BankLogo(bank: selected, size: 28),
              const SizedBox(width: 10),
            ],
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  color: selected == null
                      ? AppPalette.of(context).muted
                      : AppPalette.of(context).text,
                  fontSize: 15,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BankSearchSheet extends StatefulWidget {
  final List<Map<String, dynamic>> banks;

  const _BankSearchSheet({required this.banks});

  @override
  State<_BankSearchSheet> createState() => _BankSearchSheetState();
}

class _BankSearchSheetState extends State<_BankSearchSheet> {
  final _searchCtrl = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  List<Map<String, dynamic>> get _filtered {
    if (_query.isEmpty) return widget.banks;
    final q = _query.toLowerCase();
    return widget.banks.where((bank) {
      final name = BankAccountService.bankDisplayName(bank).toLowerCase();
      final code = BankAccountService.bankCodeFrom(bank);
      return name.contains(q) || code.contains(q);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final height = MediaQuery.sizeOf(context).height * 0.72;
    final filtered = _filtered;

    return Container(
      height: height,
      decoration: BoxDecoration(
        color: AppPalette.of(context).card,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 10),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppPalette.of(context).border,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: EdgeInsets.all(16),
            child: Text('Select bank', style: AppTextStyles.tone(AppTextStyles.headlineSmall, context)),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: TextField(
              controller: _searchCtrl,
              decoration: const InputDecoration(
                hintText: 'Search bank name or code',
                prefixIcon: Icon(Icons.search_rounded),
                border: OutlineInputBorder(),
                isDense: true,
              ),
              onChanged: (v) => setState(() => _query = v.trim()),
            ),
          ),
          const SizedBox(height: 8),
          const Divider(height: 1),
          Expanded(
            child: filtered.isEmpty
                ? const Center(child: Text('No banks match your search'))
                : ListView.separated(
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (_, i) {
                      final bank = filtered[i];
                      final name = BankAccountService.bankDisplayName(bank);
                      final code = BankAccountService.bankCodeFrom(bank);
                      return ListTile(
                        leading: BankLogo(bank: bank, size: 36),
                        title: Text(
                          name,
                          style: TextStyle(color: AppPalette.of(context).text),
                        ),
                        subtitle: code.isNotEmpty
                            ? Text(
                                'Code: $code',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: AppPalette.of(context).muted,
                                ),
                              )
                            : null,
                        onTap: () => Navigator.pop(context, bank),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

class BankLogo extends StatelessWidget {
  final Map<String, dynamic> bank;
  final double size;

  const BankLogo({super.key, required this.bank, this.size = 36});

  @override
  Widget build(BuildContext context) {
    final url = BankAccountService.bankLogoUrl(bank);
    final name = BankAccountService.bankDisplayName(bank);
    final letter = name.isEmpty ? 'B' : name[0].toUpperCase();
    final fallback = Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        letter,
        style: TextStyle(
          color: AppColors.primary,
          fontWeight: FontWeight.w800,
          fontSize: size * 0.4,
        ),
      ),
    );

    if (url == null) return fallback;

    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: CachedNetworkImage(
        imageUrl: url,
        width: size,
        height: size,
        fit: BoxFit.contain,
        placeholder: (_, __) => fallback,
        errorWidget: (_, __, ___) => fallback,
      ),
    );
  }
}
