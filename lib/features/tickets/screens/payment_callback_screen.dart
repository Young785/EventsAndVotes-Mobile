import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/services/cart_service.dart';
import '../../../core/services/tickets_service.dart';
import '../../../core/theme/app_theme.dart';

class PaymentCallbackScreen extends StatefulWidget {
  final String type;
  final String reference;

  const PaymentCallbackScreen({
    super.key,
    required this.type,
    required this.reference,
  });

  @override
  State<PaymentCallbackScreen> createState() => _PaymentCallbackScreenState();
}

class _PaymentCallbackScreenState extends State<PaymentCallbackScreen> {
  bool _loading = true;
  bool _success = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _verify();
  }

  Future<void> _verify() async {
    try {
      if (widget.type == 'cart' || widget.type == 'votes') {
        await CartService().checkoutCallback(reference: widget.reference);
      } else {
        await TicketsService().paymentCallback(reference: widget.reference);
      }
      if (mounted) {
        setState(() {
          _success = true;
          _loading = false;
        });
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) {
            if (widget.type == 'cart' || widget.type == 'votes') {
              context.go('/votes');
            } else {
              context.go('/my-tickets');
            }
          }
        });
      }
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
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (_loading) ...[
                const CircularProgressIndicator(color: AppColors.primary),
                const SizedBox(height: 24),
                const Text('Verifying payment...',
                    style: AppTextStyles.headlineSmall),
              ] else if (_success) ...[
                const Icon(Icons.check_circle_rounded,
                    size: 72, color: AppColors.success),
                const SizedBox(height: 24),
                const Text('Payment successful!',
                    style: AppTextStyles.headlineSmall),
                const SizedBox(height: 8),
                const Text('Redirecting...', style: AppTextStyles.bodyMedium),
              ] else ...[
                const Icon(Icons.error_outline_rounded,
                    size: 72, color: AppColors.error),
                const SizedBox(height: 24),
                const Text('Payment failed',
                    style: AppTextStyles.headlineSmall),
                const SizedBox(height: 8),
                Text(_error ?? 'Unknown error',
                    style: AppTextStyles.bodyMedium, textAlign: TextAlign.center),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => context.go('/dashboard'),
                  child: const Text('Go to Dashboard'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
