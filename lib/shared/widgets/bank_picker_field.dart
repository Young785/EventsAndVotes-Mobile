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
        child: Text(
          label,
          style: TextStyle(
            color:
                selected == null ? AppColors.textHint : AppColors.textPrimary,
            fontSize: 15,
          ),
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
      decoration: const BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 10),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.border,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const Padding(
            padding: EdgeInsets.all(16),
            child: Text('Select bank', style: AppTextStyles.headlineSmall),
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
                        title: Text(name),
                        subtitle: code.isNotEmpty
                            ? Text('Code: $code',
                                style: const TextStyle(fontSize: 12))
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
