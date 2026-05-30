import 'dart:async';
import 'package:flutter/material.dart';
import '../../core/services/bank_account_service.dart';
import '../../core/theme/app_theme.dart';
import 'bank_picker_field.dart';

class AddBankAccountSheet extends StatefulWidget {
  const AddBankAccountSheet({super.key});

  static Future<bool?> show(BuildContext context) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const AddBankAccountSheet(),
    );
  }

  @override
  State<AddBankAccountSheet> createState() => _AddBankAccountSheetState();
}

class _AddBankAccountSheetState extends State<AddBankAccountSheet> {
  final _bankService = BankAccountService();
  final _accountNumberCtrl = TextEditingController();
  final _accountNameCtrl = TextEditingController();

  List<Map<String, dynamic>> _banks = [];
  String? _bankPickerKey;
  Map<String, dynamic>? _selectedBank;
  bool _loadingBanks = true;
  String? _banksError;
  String? _verifyError;
  bool _submitting = false;
  bool _resolvingName = false;
  bool _nameVerified = false;
  bool _manualNameEntry = false;
  Timer? _resolveDebounce;

  @override
  void initState() {
    super.initState();
    _accountNumberCtrl.addListener(_onAccountNumberChanged);
    _loadBanks();
  }

  @override
  void dispose() {
    _resolveDebounce?.cancel();
    _accountNumberCtrl.removeListener(_onAccountNumberChanged);
    _accountNameCtrl.dispose();
    _accountNumberCtrl.dispose();
    super.dispose();
  }

  void _onAccountNumberChanged() {
    _resolveDebounce?.cancel();
    setState(() {
      _nameVerified = false;
      _manualNameEntry = false;
      _verifyError = null;
      _accountNameCtrl.clear();
    });
    _resolveDebounce = Timer(const Duration(milliseconds: 700), _resolveName);
  }

  void _selectBank(Map<String, dynamic> bank) {
    final index = _banks.indexWhere(
      (b) =>
          BankAccountService.bankCodeFrom(b) ==
              BankAccountService.bankCodeFrom(bank) &&
          BankAccountService.bankDisplayName(b) ==
              BankAccountService.bankDisplayName(bank),
    );
    setState(() {
      _selectedBank = bank;
      _bankPickerKey = BankAccountService.bankPickerKey(
        bank,
        index >= 0 ? index : 0,
      );
      _nameVerified = false;
      _manualNameEntry = false;
      _verifyError = null;
      _accountNameCtrl.clear();
    });
    _resolveName();
  }

  Future<void> _loadBanks() async {
    setState(() {
      _loadingBanks = true;
      _banksError = null;
    });
    try {
      final banks = await _bankService.getAvailableBanks();
      if (!mounted) return;
      setState(() {
        _banks = banks;
        _loadingBanks = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loadingBanks = false;
        _banksError = 'Could not load banks. Tap retry below.';
      });
    }
  }

  bool get _canVerify {
    final bank = _selectedBank;
    final accountNo = _accountNumberCtrl.text.trim();
    return bank != null &&
        BankAccountService.bankCodeFrom(bank).isNotEmpty &&
        accountNo.length >= 10;
  }

  Future<void> _resolveName() async {
    if (!_canVerify) return;

    final bank = _selectedBank!;
    final accountNo = _accountNumberCtrl.text.trim();
    final bankCode = BankAccountService.bankCodeFrom(bank);
    final bankName = BankAccountService.bankDisplayName(bank);

    setState(() {
      _resolvingName = true;
      _verifyError = null;
    });

    try {
      final result = await _bankService.resolveAccountName(
        bankCode: bankCode,
        accountNumber: accountNo,
        bankName: bankName,
      );
      if (!mounted) return;

      setState(() {
        _resolvingName = false;
        if (result.isSuccess) {
          _accountNameCtrl.text = result.accountName!;
          _nameVerified = true;
          _manualNameEntry = false;
          _verifyError = null;
        } else {
          _accountNameCtrl.clear();
          _nameVerified = false;
          _verifyError = result.errorMessage;
        }
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _resolvingName = false;
        _nameVerified = false;
        _verifyError = e.toString().replaceAll('Exception: ', '');
      });
    }
  }

  void _enableManualName() {
    setState(() {
      _manualNameEntry = true;
      _nameVerified = false;
      _verifyError = null;
    });
  }

  Future<void> _submit() async {
    final bank = _selectedBank;
    if (bank == null) {
      _toast('Please select your bank');
      return;
    }
    final bankCode = BankAccountService.bankCodeFrom(bank);
    if (bankCode.isEmpty) {
      _toast('Invalid bank selection — pick a bank from the list');
      return;
    }
    if (_accountNumberCtrl.text.trim().length < 10) {
      _toast('Enter a valid 10-digit account number');
      return;
    }

    if (!_nameVerified && !_manualNameEntry) {
      await _resolveName();
    }

    if (!_nameVerified && !_manualNameEntry) {
      _toast(
        _verifyError ??
            'We could not verify this account. Tap Verify or enter name manually.',
      );
      return;
    }

    final accountName = _accountNameCtrl.text.trim();
    if (accountName.isEmpty) {
      _toast('Account name is required');
      return;
    }

    setState(() => _submitting = true);
    try {
      await _bankService.createBankAccount(
        bankId: BankAccountService.bankIdFrom(bank),
        bankName: BankAccountService.bankDisplayName(bank),
        bankCode: bankCode,
        accountName: accountName,
        accountNumber: _accountNumberCtrl.text.trim(),
      );
      if (mounted) {
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Bank account saved')),
        );
      }
    } catch (e) {
      _toast(e.toString().replaceAll('Exception: ', ''));
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
      margin: const EdgeInsets.only(top: 48),
      decoration: const BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Padding(
        padding: EdgeInsets.fromLTRB(20, 16, 20, 20 + bottom),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  const Expanded(
                    child: Text(
                      'Add Bank Account',
                      style: AppTextStyles.headlineSmall,
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close_rounded),
                  ),
                ],
              ),
              const Text(
                'Enter your 10-digit account number and select your bank — your account name will be fetched automatically.',
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 16),
              if (_loadingBanks)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Center(child: CircularProgressIndicator()),
                )
              else ...[
                TextField(
                  controller: _accountNumberCtrl,
                  keyboardType: TextInputType.number,
                  maxLength: 10,
                  decoration: const InputDecoration(
                    labelText: 'Account number',
                    hintText: 'Enter 10-digit account number',
                    border: OutlineInputBorder(),
                    counterText: '',
                  ),
                ),
                const SizedBox(height: 12),
                BankPickerField(
                  banks: _banks,
                  selectedKey: _bankPickerKey,
                  onBankSelected: _selectBank,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _accountNameCtrl,
                  readOnly: !_manualNameEntry,
                  onChanged: (_) {
                    if (_manualNameEntry) {
                      setState(() => _nameVerified = false);
                    }
                  },
                  decoration: InputDecoration(
                    labelText: 'Account name',
                    hintText: _resolvingName
                        ? 'Fetching account name…'
                        : _manualNameEntry
                            ? 'Enter name as it appears on your bank account'
                            : 'Verified name appears here',
                    border: const OutlineInputBorder(),
                    suffixIcon: _resolvingName
                        ? const Padding(
                            padding: EdgeInsets.all(12),
                            child: SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                          )
                        : _nameVerified
                            ? const Icon(Icons.check_circle,
                                color: AppColors.success)
                            : null,
                  ),
                ),
                if (_verifyError != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      _verifyError!,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.error,
                      ),
                    ),
                  ),
                if (!_nameVerified && !_manualNameEntry && _canVerify)
                  TextButton(
                    onPressed: _enableManualName,
                    child: const Text('Enter account name manually instead'),
                  ),
                if (_banksError != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            _banksError!,
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.error,
                            ),
                          ),
                        ),
                        TextButton(
                          onPressed: _loadBanks,
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: _submitting || _resolvingName || _loadingBanks
                      ? null
                      : _submit,
                  child: _submitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Save Account'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
