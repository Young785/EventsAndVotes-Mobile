import 'package:flutter/material.dart';
import '../../core/services/bank_account_service.dart';
import '../../core/services/withdrawal_service.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/json_parse_utils.dart';
import 'add_bank_account_sheet.dart';

class WithdrawalRequestSheet extends StatefulWidget {
  const WithdrawalRequestSheet({super.key});

  static Future<bool?> show(BuildContext context) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const WithdrawalRequestSheet(),
    );
  }

  @override
  State<WithdrawalRequestSheet> createState() => _WithdrawalRequestSheetState();
}

class _WithdrawalRequestSheetState extends State<WithdrawalRequestSheet> {
  final _withdrawalService = WithdrawalService();
  final _bankService = BankAccountService();
  final _amountCtrl = TextEditingController();

  bool _loading = true;
  bool _submitting = false;
  String? _bankAccountKey;
  List<Map<String, dynamic>> _banks = [];
  Map<String, dynamic> _sources = {};
  Map<String, dynamic> _limits = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _amountCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final results = await Future.wait([
        _bankService.getBankAccounts(),
        _withdrawalService.getWithdrawalSources(),
      ]);
      if (!mounted) return;
      final rawBanks = results[0] as List<dynamic>;
      final banks = rawBanks
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList();
      setState(() {
        _banks = banks;
        _sources = Map<String, dynamic>.from(results[1] as Map);
        _limits = {
          'min': parseApiDoubleOrZero(
            (_sources['settings'] ?? {})['min_withdrawal_amount'] ?? 1000,
          ),
          'max': parseApiDoubleOrZero(
            (_sources['settings'] ?? {})['max_withdrawal_amount'] ?? 500000,
          ),
        };
        if (_banks.isNotEmpty) {
          _bankAccountKey = _bankAccountPickerKey(_banks.first, 0);
        }
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  double get _available {
    final ref = _sources['referrals'];
    if (ref is Map) {
      return parseApiDoubleOrZero(ref['available_balance']);
    }
    return 0;
  }

  String _bankAccountPickerKey(Map<String, dynamic> bank, int index) {
    final id = bank['id']?.toString() ?? '';
    final acct = bank['account_no'] ?? bank['account_number'] ?? '';
    return 'acct_${index}_${id}_$acct';
  }

  int? get _selectedBankAccountId {
    if (_bankAccountKey == null) return null;
    for (var i = 0; i < _banks.length; i++) {
      if (_bankAccountPickerKey(_banks[i], i) == _bankAccountKey) {
        final id = _banks[i]['id'];
        if (id is int) return id;
        return int.tryParse(id?.toString() ?? '');
      }
    }
    return null;
  }

  Future<void> _addBankAccount() async {
    final added = await AddBankAccountSheet.show(context);
    if (added == true) await _load();
  }

  Future<void> _submit() async {
    final amount = double.tryParse(_amountCtrl.text.trim()) ?? 0;
    final min = _limits['min'] as double? ?? 1000;
    final max = _limits['max'] as double? ?? 500000;

    final bankAccountId = _selectedBankAccountId;
    if (bankAccountId == null) {
      _toast('Please add a bank account first');
      return;
    }
    if (amount < min) {
      _toast('Minimum withdrawal is ₦${min.toStringAsFixed(0)}');
      return;
    }
    if (amount > max) {
      _toast('Maximum withdrawal is ₦${max.toStringAsFixed(0)}');
      return;
    }
    if (amount > _available) {
      _toast('Insufficient balance');
      return;
    }

    setState(() => _submitting = true);
    try {
      await _withdrawalService.createWithdrawal(
        amount: amount,
        bankAccountId: bankAccountId,
        sourceType: 'REFERRAL',
        pace: 'NORMAL',
        notes: '',
      );
      if (mounted) {
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Withdrawal request submitted')),
        );
      }
    } catch (_) {
      _toast('Failed to submit withdrawal');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _toast(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.viewInsetsOf(context).bottom;
    return Container(
      margin: const EdgeInsets.only(top: 80),
      decoration: const BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Padding(
        padding: EdgeInsets.fromLTRB(20, 14, 20, 24 + bottom),
        child: _loading
            ? const SizedBox(
                height: 160,
                child: Center(child: CircularProgressIndicator()),
              )
            : SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Handle
                    Center(
                      child: Container(
                        width: 36,
                        height: 4,
                        decoration: BoxDecoration(
                          color: AppColors.border,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    // Header
                    Row(
                      children: [
                        const Expanded(
                          child: Text(
                            'Request Withdrawal',
                            style: AppTextStyles.headlineSmall,
                          ),
                        ),
                        IconButton(
                          onPressed: () => Navigator.pop(context),
                          icon: const Icon(Icons.close_rounded),
                          visualDensity: VisualDensity.compact,
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    // Available balance chip
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.primarySurface,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'Available: ₦${_available.toStringAsFixed(0)}',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // Amount field
                    TextField(
                      controller: _amountCtrl,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: 'Amount (₦)',
                        prefixText: '₦ ',
                        border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12)),
                        helperText:
                            'Min: ₦${(_limits['min'] as double? ?? 1000).toStringAsFixed(0)}',
                      ),
                    ),
                    const SizedBox(height: 14),
                    // Bank account
                    _bankSection(),
                    const SizedBox(height: 20),
                    // Submit
                    ElevatedButton(
                      onPressed: _submitting ? null : _submit,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                      child: _submitting
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Submit Request'),
                    ),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _bankSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            const Expanded(
              child: Text(
                'Bank Account',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
            TextButton.icon(
              onPressed: _addBankAccount,
              icon: const Icon(Icons.add_rounded, size: 18),
              label: const Text('Add Account'),
            ),
          ],
        ),
        if (_banks.isEmpty)
          OutlinedButton.icon(
            onPressed: _addBankAccount,
            icon: const Icon(Icons.account_balance_outlined),
            label: const Text('Add your bank account'),
          )
        else
          DropdownButtonFormField<String>(
            value: _bankAccountKey != null &&
                    _banks.asMap().entries.any(
                          (e) =>
                              _bankAccountPickerKey(e.value, e.key) ==
                              _bankAccountKey,
                        )
                ? _bankAccountKey
                : null,
            decoration: const InputDecoration(
              border: OutlineInputBorder(),
              hintText: 'Select Bank Account',
            ),
            items: [
              for (var i = 0; i < _banks.length; i++)
                DropdownMenuItem(
                  value: _bankAccountPickerKey(_banks[i], i),
                  child: Text(
                    '${_banks[i]['bank_name'] ?? _banks[i]['bank']?['name'] ?? 'Bank'} — '
                    '${_banks[i]['account_number'] ?? _banks[i]['account_no'] ?? ''} '
                    '(${_banks[i]['account_name'] ?? ''})',
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
            ],
            onChanged: (v) => setState(() => _bankAccountKey = v),
          ),
      ],
    );
  }

}
