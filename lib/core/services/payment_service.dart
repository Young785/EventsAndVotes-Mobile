import 'package:flutter/material.dart';
import '../utils/payment_url_utils.dart';
import '../../features/tickets/screens/payment_webview_screen.dart';
import 'cart_service.dart';
import 'tickets_service.dart';

/// Event ticket payments — OpenAPI flow:
/// 1. POST /tickets/purchase → paystack access_code / authorization_url
/// 2. Paystack hosted checkout (WebView)
/// 3. POST /tickets/payment-callback { reference, status: success }
class PaymentService {
  final TicketsService _ticketsService = TicketsService();

  Future<bool> launchFromPurchaseResponse({
    required BuildContext context,
    required Map<String, dynamic> purchaseResponse,
    required String customerEmail,
    required String customerName,
    double? amountNaira,
  }) async {
    final data = enrichPaymentPayload(purchaseResponse);

    if (_isPaymentCompleted(data)) return true;

    final reference = paymentReferenceFrom(data);
    final checkoutUrl = resolvePaystackCheckoutUrl(data);

    if (!context.mounted) return false;

    if (checkoutUrl == null || checkoutUrl.isEmpty) {
      throw Exception(
        'Paystack checkout could not start. '
        'The server did not return a payment link. Please try again.',
      );
    }

    final result = await Navigator.of(context, rootNavigator: true).push<bool>(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => PaymentWebViewScreen.fromUrl(
          paymentUrl: checkoutUrl,
          reference: reference,
        ),
      ),
    );

    if (result == true) return true;

    if (reference.isNotEmpty) {
      try {
        await _ticketsService.paymentCallback(reference: reference);
        return true;
      } catch (_) {}
    }

    return false;
  }

  bool _isPaymentCompleted(Map<String, dynamic> data) {
    final status = data['payment_status']?.toString().toLowerCase() ?? '';
    return status == 'completed' ||
        status == 'success' ||
        status == 'paid';
  }

  Future<bool> launchFromCartCheckout({
    required BuildContext context,
    required Map<String, dynamic> checkoutResponse,
  }) async {
    final data = enrichPaymentPayload(checkoutResponse);

    if (_isPaymentCompleted(data)) return true;

    final reference = paymentReferenceFrom(data);
    final checkoutUrl = resolvePaystackCheckoutUrl(data);

    if (!context.mounted) return false;

    if (checkoutUrl == null || checkoutUrl.isEmpty) {
      throw Exception(
        'Paystack checkout could not start. '
        'The server did not return a payment link. Please try again.',
      );
    }

    final result = await Navigator.of(context, rootNavigator: true).push<bool>(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => PaymentWebViewScreen.fromUrl(
          paymentUrl: checkoutUrl,
          reference: reference,
          type: 'cart',
        ),
      ),
    );

    if (result == true) return true;

    if (reference.isNotEmpty) {
      try {
        await CartService().checkoutCallback(reference: reference);
        return true;
      } catch (_) {}
    }

    return false;
  }
}
